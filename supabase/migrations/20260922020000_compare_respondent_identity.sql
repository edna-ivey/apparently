-- Tightens "THEY HAVE NOTES." respondent identity from a bearer opaque token to the
-- respondent's real (anonymous) Supabase auth identity, server-derived only. Fixes two gaps
-- in the original compare_responses design (supabase/migrations/20260921010000_compare_they_
-- have_notes.sql):
--   1. The SAME anonymous person/browser answering two different share links for the same
--      owner+quiz got two different per-share opaque tokens, and so could incorrectly count
--      as two independent people toward APPARENTLY, IT'S A THING.'s 3-person threshold.
--   2. Mere possession of another respondent's opaque token acted as a bearer capability for
--      reading that response -- Friend B holding Friend A's token could read Friend A's
--      answers even from a different auth session.
--
-- This is an ADDITIVE forward migration on top of the already-applied 20260921010000 table --
-- it does not edit that migration as though it never ran. respondent_token is KEPT (an
-- additional client-held capability/session token) but is no longer the sole read-access
-- gate, and respondent_user_id -- never client-supplied, always derived from auth.uid() --
-- becomes the real identity boundary for both read security and the "3 independent friends"
-- count. Existing rows (all of them known, at the time of this migration, to be disposable
-- test data from live QA smoke tests -- no product surface has offered this flow to a real
-- user yet) get a NULL respondent_user_id; nothing is fabricated for them. They remain fully
-- visible to their share's owner (the owner-path branch below is unconditional on
-- respondent_user_id), simply excluded from COUNT(DISTINCT respondent_user_id) (SQL already
-- ignores NULLs there) and no longer independently re-readable by their original respondent
-- via the tightened non-owner path -- an acceptable, intentional consequence for disposable
-- test rows, not a data-loss concern.

alter table public.compare_responses
  add column respondent_user_id uuid references auth.users (id) on delete cascade;

comment on column public.compare_responses.respondent_user_id is
  'The server-derived (auth.uid()) anonymous Supabase identity of the respondent -- the real identity boundary for "3 independent friends" (see get_apparently_its_a_thing) and for friend-read security (see get_compare_result). Nullable ONLY for rows inserted before this column existed; every row inserted by submit_compare_response from this migration forward always has one -- it is derived server-side from auth.uid() and is never accepted as a client parameter. Never selected by any client-facing RPC (get_compare_result / list_compare_responses_for_owner) -- the raw id never reaches the app.';

-- One response per (share, real respondent identity). Coexists with the original
-- unique(share_id, respondent_token) from 20260921010000 -- both hold; this one is the
-- meaningful identity constraint going forward (every new row has a non-null
-- respondent_user_id, enforced procedurally by submit_compare_response, so this constraint is
-- always effective for new data). Multiple pre-existing NULL rows under the same share_id do
-- not violate this constraint -- standard SQL treats NULLs as distinct from one another.
alter table public.compare_responses
  add constraint compare_responses_share_respondent_user_unique unique (share_id, respondent_user_id);

-- submit_compare_response: now derives respondent_user_id from auth.uid() (never trusts a
-- client-submitted id -- there was never a client parameter for it, and there still isn't).
-- Upsert conflict target moves from (share_id, respondent_token) to (share_id,
-- respondent_user_id) -- the real identity is what makes a resubmission "the same person,"
-- not whatever token happens to be presented. respondent_token is still accepted and stored
-- (an additional capability/session token, per the approved design) but the client-facing
-- call signature is UNCHANGED -- no app code needs to change for this migration.
create or replace function public.submit_compare_response(
  p_share_id uuid,
  p_respondent_token uuid,
  p_respondent_nickname text,
  p_answers jsonb,
  p_primary_result_id text,
  p_secondary_result_id text default null,
  p_note text default null
)
returns table (response_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_nickname text;
  v_note text;
  v_new_id uuid;
begin
  v_user := auth.uid();
  if v_user is null then
    raise exception 'Not authenticated.';
  end if;

  if not exists (select 1 from public.quiz_shares where id = p_share_id) then
    raise exception 'This share is no longer available.';
  end if;

  v_nickname := btrim(coalesce(p_respondent_nickname, ''));
  if v_nickname = '' then
    raise exception 'A name or nickname is required.';
  end if;
  if char_length(v_nickname) > 60 then
    raise exception 'That name is too long.';
  end if;

  if p_answers is null or jsonb_typeof(p_answers) <> 'object' or (select count(*) from jsonb_object_keys(p_answers)) = 0 then
    raise exception 'answers must be a non-empty JSON object.';
  end if;
  if p_primary_result_id is null or btrim(p_primary_result_id) = '' then
    raise exception 'primary_result_id is required.';
  end if;

  v_note := nullif(btrim(coalesce(p_note, '')), '');
  if v_note is not null and char_length(v_note) > 240 then
    raise exception 'That note is too long.';
  end if;

  insert into public.compare_responses (
    share_id, respondent_token, respondent_user_id, respondent_nickname, answers, primary_result_id, secondary_result_id, note
  ) values (
    p_share_id, p_respondent_token, v_user, v_nickname, p_answers, p_primary_result_id, p_secondary_result_id, v_note
  )
  on conflict (share_id, respondent_user_id) do update set
    respondent_token = excluded.respondent_token,
    respondent_nickname = excluded.respondent_nickname,
    answers = excluded.answers,
    primary_result_id = excluded.primary_result_id,
    secondary_result_id = excluded.secondary_result_id,
    note = excluded.note,
    updated_at = now()
  returning id into v_new_id;

  return query select v_new_id;
end;
$$;

revoke all on function public.submit_compare_response(uuid, uuid, text, jsonb, text, text, text) from public;
revoke all on function public.submit_compare_response(uuid, uuid, text, jsonb, text, text, text) from anon;
grant execute on function public.submit_compare_response(uuid, uuid, text, jsonb, text, text, text) to authenticated;

comment on function public.submit_compare_response(uuid, uuid, text, jsonb, text, text, text) is
  'The one write path for a friend''s comparison response. respondent_user_id is derived from auth.uid() -- never a client parameter, never trusted from the client. Upserts on (share_id, respondent_user_id): the SAME anonymous Supabase identity resubmitting (on this share, or a different share for the same owner+quiz) updates/replaces their own response rather than counting as a second independent person. p_respondent_token is still stored as an additional client-held capability token (see get_compare_result), no longer the sole read-access gate.';

-- get_compare_result: friend read access now requires BOTH auth.uid() = respondent_user_id
-- AND the correct respondent_token -- mere possession of another respondent's token (without
-- also being authenticated as that exact respondent) no longer grants read access. Owner
-- access is unchanged (auth.uid() = share's sharer_user_id, unconditional on
-- respondent_user_id/token, so legacy NULL-identity rows stay visible to their owner).
-- respondent_user_id is deliberately NOT part of the returned columns -- never exposed to the
-- client.
create or replace function public.get_compare_result(p_share_id uuid, p_respondent_token uuid default null)
returns table (
  response_id uuid,
  quiz_id text,
  owner_result_id text,
  owner_answers jsonb,
  owner_display_name text,
  respondent_nickname text,
  friend_answers jsonb,
  friend_primary_result_id text,
  friend_secondary_result_id text,
  note text,
  match_count int,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_share record;
  v_is_owner boolean;
begin
  v_user := auth.uid();

  select s.quiz_id, s.sharer_display_name, s.sharer_user_id, qr.result_id as owner_result_id, qr.answers as owner_answers
    into v_share
    from public.quiz_shares s
    join public.quiz_results qr on qr.id = s.quiz_result_id
    where s.id = p_share_id;

  if v_share is null then
    return;
  end if;

  v_is_owner := v_user is not null and v_user = v_share.sharer_user_id;

  return query
  select
    cr.id,
    v_share.quiz_id,
    v_share.owner_result_id,
    v_share.owner_answers,
    v_share.sharer_display_name,
    cr.respondent_nickname,
    cr.answers,
    cr.primary_result_id,
    cr.secondary_result_id,
    cr.note,
    (
      select count(*)::int
      from jsonb_each_text(coalesce(v_share.owner_answers, '{}'::jsonb)) oa
      join jsonb_each_text(cr.answers) fa on oa.key = fa.key and oa.value = fa.value
    ),
    cr.created_at
  from public.compare_responses cr
  where cr.share_id = p_share_id
    and (
      v_is_owner
      or (
        v_user is not null
        and cr.respondent_user_id = v_user
        and p_respondent_token is not null
        and cr.respondent_token = p_respondent_token
      )
    );
end;
$$;

revoke all on function public.get_compare_result(uuid, uuid) from public;
revoke all on function public.get_compare_result(uuid, uuid) from anon;
grant execute on function public.get_compare_result(uuid, uuid) to authenticated;

comment on function public.get_compare_result(uuid, uuid) is
  'The one read path for a single one-to-one comparison. Returns a row ONLY if the caller is the share''s owner (real auth.uid() match against quiz_shares.sharer_user_id) OR is BOTH authenticated as the exact respondent (auth.uid() = compare_responses.respondent_user_id) AND presents that response''s correct opaque respondent_token -- possessing only the token is no longer sufficient. match_count is the literal same-question-id-same-choice-id count between the owner''s pinned answers and the friend''s answers. respondent_user_id is never included in the returned columns.';

-- get_apparently_its_a_thing: distinct-person counting now uses respondent_user_id (the real
-- identity) instead of respondent_token, so the SAME anonymous person answering two different
-- shares for the same owner+quiz counts once, not twice. NULL respondent_user_id rows
-- (pre-migration test data) are explicitly excluded -- belt-and-suspenders on top of
-- COUNT(DISTINCT ...) already ignoring NULLs, matching this codebase's existing "enforced in
-- ADDITION to" convention (see contributesToProfile's own double-enforcement).
create or replace function public.get_apparently_its_a_thing(p_quiz_id text)
returns table (result_id text, respondent_count bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user uuid;
begin
  v_user := auth.uid();
  if v_user is null then
    raise exception 'Not authenticated.';
  end if;

  return query
  select cr.primary_result_id, count(distinct cr.respondent_user_id) as respondent_count
  from public.compare_responses cr
  join public.quiz_shares s on s.id = cr.share_id
  where s.sharer_user_id = v_user and s.quiz_id = p_quiz_id and cr.respondent_user_id is not null
  group by cr.primary_result_id
  having count(distinct cr.respondent_user_id) >= 3;
end;
$$;

revoke all on function public.get_apparently_its_a_thing(text) from public;
revoke all on function public.get_apparently_its_a_thing(text) from anon;
grant execute on function public.get_apparently_its_a_thing(text) to authenticated;

comment on function public.get_apparently_its_a_thing(text) is
  'Owner-only. Distinct RESPONDENT_USER_ID count per primary_result_id, across ALL of the caller''s shares for one quiz_id -- the same anonymous Supabase identity answering multiple shares for this owner+quiz counts once. Only rows meeting the approved 3-respondent threshold are returned. Never visible to friends -- auth.uid()-gated, no p_owner_id parameter exists to spoof.';
