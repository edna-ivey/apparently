-- "THEY HAVE NOTES." Compare — friend-answering persistence for the two playable Private
-- quizzes (keep-you-around, be-so-serious), built entirely on top of the EXISTING
-- quiz_results/quiz_shares tables and the EXISTING client-side scoring engine
-- (src/data/quizzes/scoring.ts). No second scoring interpretation is introduced here — every
-- RPC below stores whatever result the client's own scoreArchetypeQuiz() computed, the exact
-- same trust boundary submit_quiz_result already uses for the owner's own completions.
--
-- =========================================================================================
-- 1. quiz_results gains `answers` — needed for Compare's exact-match-count, which did not
--    exist as a requirement when quiz_results was first designed. Nullable: a completion made
--    BEFORE this migration has no raw answers to backfill (there is no way to recover them),
--    so a share pinned to a pre-migration completion simply has no match-count available —
--    handled as an honest "unavailable" state client-side, never fabricated.
-- =========================================================================================

alter table public.quiz_results add column answers jsonb;

comment on column public.quiz_results.answers is
  'Question-id -> choice-id map for this completion, e.g. {"q1":"a","q2":"c",...}. Null for any completion made before this column existed (no way to recover it retroactively). Used by Compare (see get_compare_result) to compute the literal exact-match count between an owner''s pinned completion and a friend''s response — never used to re-score anything (result_id/score/percent are still authoritative from the original submission).';

-- CREATE OR REPLACE preserves the function's identity (same OID, same existing EXECUTE
-- grants) — only a new trailing defaulted parameter is added, so every existing call site
-- keeps working unchanged even before the client starts passing it.
create or replace function public.submit_quiz_result(
  p_quiz_id text,
  p_quiz_title text,
  p_quiz_category text,
  p_completed_at timestamptz,
  p_question_count smallint,
  p_score integer,
  p_percent integer,
  p_result_id text,
  p_result_title text,
  p_traits text[],
  p_mix jsonb,
  p_profile_effects jsonb,
  p_answers jsonb default null
)
returns table (quiz_result_id uuid, is_first_profile_completion boolean, was_retry boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_existing_id uuid;
  v_is_first boolean;
  v_new_id uuid;
  v_effect jsonb;
  v_dimension text;
  v_value integer;
  v_effect_count integer;
  v_seen_dimensions text[] := '{}';
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated.';
  end if;

  if p_quiz_id is null or length(trim(p_quiz_id)) = 0 then
    raise exception 'quiz_id is required.';
  end if;
  if p_completed_at is null then
    raise exception 'completed_at is required.';
  end if;
  if p_question_count is null or p_question_count < 1 or p_question_count > 50 then
    raise exception 'Invalid question_count.';
  end if;
  if p_percent is null or p_percent < 0 or p_percent > 100 then
    raise exception 'Invalid percent.';
  end if;
  if p_result_id is null or p_result_title is null or p_quiz_title is null or p_quiz_category is null then
    raise exception 'Missing required quiz result fields.';
  end if;
  if p_answers is not null and p_answers <> 'null'::jsonb and jsonb_typeof(p_answers) <> 'object' then
    raise exception 'answers must be a JSON object.';
  end if;

  if p_profile_effects is not null and p_profile_effects <> 'null'::jsonb then
    if jsonb_typeof(p_profile_effects) <> 'array' then
      raise exception 'profile_effects must be a JSON array.';
    end if;

    select count(*) into v_effect_count from jsonb_array_elements(p_profile_effects);
    if v_effect_count > 3 then
      raise exception 'profile_effects may contain at most 3 entries.';
    end if;

    for v_effect in select * from jsonb_array_elements(p_profile_effects)
    loop
      if jsonb_typeof(v_effect -> 'dimension') <> 'string' then
        raise exception 'Malformed profile_effects entry: dimension must be a string.';
      end if;
      v_dimension := v_effect ->> 'dimension';

      if v_dimension not in (
        'planner_spontaneous', 'emotional_intensity', 'direct_indirect', 'social_attunement',
        'protective_hands_off', 'adventure_comfort', 'independent_collaborative', 'control_allowing',
        'practical_idealistic', 'sentimental_thick_skinned', 'rules_bending', 'conflict_peacekeeping',
        'trust_verify', 'forgiving_receipts', 'playful_serious', 'competitive_cooperative',
        'curious_decisive', 'private_open', 'patient_urgent', 'ambitious_content'
      ) then
        raise exception 'Unknown personality dimension: %', v_dimension;
      end if;

      if jsonb_typeof(v_effect -> 'value') <> 'number' then
        raise exception 'Malformed profile_effects entry: value must be a number.';
      end if;
      v_value := (v_effect ->> 'value')::integer;
      if v_value not in (-2, -1, 1, 2) then
        raise exception 'Invalid personality effect value: %', v_value;
      end if;

      if v_dimension = any(v_seen_dimensions) then
        raise exception 'Duplicate personality dimension in profile_effects: %', v_dimension;
      end if;
      v_seen_dimensions := array_append(v_seen_dimensions, v_dimension);
    end loop;
  end if;

  perform pg_advisory_xact_lock(hashtext(v_user_id::text), hashtext(p_quiz_id));

  select id into v_existing_id
    from public.quiz_results
    where user_id = v_user_id and quiz_id = p_quiz_id and completed_at = p_completed_at;

  if v_existing_id is not null then
    return query select v_existing_id, false, true;
    return;
  end if;

  v_is_first := not exists (
    select 1 from public.quiz_results where user_id = v_user_id and quiz_id = p_quiz_id
  );

  begin
    insert into public.quiz_results (
      user_id, quiz_id, completed_at, question_count, score, percent, result_id, result_title, traits, mix, answers
    ) values (
      v_user_id, p_quiz_id, p_completed_at, p_question_count, p_score, p_percent, p_result_id, p_result_title,
      coalesce(p_traits, '{}'), p_mix, p_answers
    )
    returning id into v_new_id;
  exception when unique_violation then
    select id into v_existing_id
      from public.quiz_results
      where user_id = v_user_id and quiz_id = p_quiz_id and completed_at = p_completed_at;
    return query select v_existing_id, false, true;
    return;
  end;

  if v_is_first and p_profile_effects is not null and p_profile_effects <> 'null'::jsonb then
    for v_effect in select * from jsonb_array_elements(p_profile_effects)
    loop
      insert into public.personality_evidence (
        user_id, source_type, source_id, question_snapshot, answer_snapshot, category, dimension, effect
      ) values (
        v_user_id, 'quiz_result', v_new_id::text, p_quiz_title, p_result_title, p_quiz_category,
        v_effect ->> 'dimension', (v_effect ->> 'value')::smallint
      )
      on conflict (user_id, source_type, source_id, dimension) do nothing;
    end loop;
  end if;

  return query select v_new_id, v_is_first, false;
end;
$$;

comment on function public.submit_quiz_result(text, text, text, timestamptz, smallint, integer, integer, text, text, text[], jsonb, jsonb, jsonb) is
  'Persists a completed quiz result and, ONLY on the first completion of a given (user, quiz_id), writes up to 3 personality_evidence rows from server-validated profile_effects. Also stores the raw question-id -> choice-id answer map (p_answers, nullable) for Compare''s exact-match-count. Idempotent on (user_id, quiz_id, completed_at).';

-- =========================================================================================
-- 2. compare_responses — one row per friend's completed comparison about an owner's SHARED
--    (pinned) completion. RLS enabled with ZERO direct policies, matching quiz_shares' own
--    pattern — every legitimate access path goes through the SECURITY DEFINER RPCs below.
-- =========================================================================================

create table public.compare_responses (
  id uuid primary key default gen_random_uuid(),
  share_id uuid not null references public.quiz_shares (id) on delete cascade,
  -- Opaque, client-generated identity — never a raw auth.users id. Persisted in the
  -- respondent's own browser storage per (device, share) so a resubmission updates their own
  -- row (see the unique constraint below) instead of counting as a second independent person.
  respondent_token uuid not null,
  respondent_nickname text not null,
  answers jsonb not null,
  primary_result_id text not null,
  -- Stored if the scoring engine returns one (enableCloseSecond quizzes), but the Build 6
  -- comparison classification (WELL... THAT TRACKS / THE PLOT TWIST) is based ONLY on
  -- primary_result_id — see get_compare_result, which never branches on this column.
  secondary_result_id text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  viewed_at timestamptz,
  constraint compare_responses_nickname_length check (char_length(respondent_nickname) between 1 and 60),
  constraint compare_responses_note_length check (note is null or char_length(note) <= 240),
  unique (share_id, respondent_token)
);

comment on table public.compare_responses is
  'One row per friend response to a shared quiz result. Pinned to share_id (an EXACT quiz_shares row, itself pinned to one quiz_results completion) — a later owner retake never rewrites an existing comparison, since a retake produces a NEW quiz_results row and (if re-shared) a NEW quiz_shares row, never touching this one. RLS enabled, zero direct policies — access exclusively via submit_compare_response/get_compare_result/list_compare_responses_for_owner/get_apparently_its_a_thing/mark_compare_response_viewed.';

create index compare_responses_share_id_idx on public.compare_responses (share_id);

alter table public.compare_responses enable row level security;

-- The one write path. `authenticated` only — a friend gets a real (anonymous) Supabase
-- session automatically the same way every other consumer write in this app already
-- requires one; this is not gated behind a raw anon-writable table. UPSERTs on
-- (share_id, respondent_token) so a resubmission by the SAME respondent updates their
-- existing record rather than counting as a second independent person.
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
    share_id, respondent_token, respondent_nickname, answers, primary_result_id, secondary_result_id, note
  ) values (
    p_share_id, p_respondent_token, v_nickname, p_answers, p_primary_result_id, p_secondary_result_id, v_note
  )
  on conflict (share_id, respondent_token) do update set
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
  'The one write path for a friend''s comparison response. p_respondent_token is client-generated and opaque — never a raw user id. Validates share exists, nickname/note length, answers shape. Never re-scores anything: p_primary_result_id/p_secondary_result_id are trusted from the client''s own scoreArchetypeQuiz() call, the same trust boundary submit_quiz_result already uses.';

-- The one-to-one comparison read path. Callable by EITHER the share's owner (real auth.uid()
-- match) OR the specific respondent who holds this exact response's opaque token — never
-- anyone else. Returns the owner's pinned completion (via quiz_shares -> quiz_results) and
-- the friend's response side by side; match_count is computed server-side from both answer
-- maps so raw answers never need to be compared/exposed client-side for this purpose (they
-- ARE still returned, since the comparison UI needs to render the actual differing choice
-- labels for "THE PART YOU MISSED" — content-side resolution, not an extra data exposure
-- beyond what this one comparison already legitimately contains).
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
    and (v_is_owner or (p_respondent_token is not null and cr.respondent_token = p_respondent_token));
end;
$$;

revoke all on function public.get_compare_result(uuid, uuid) from public;
revoke all on function public.get_compare_result(uuid, uuid) from anon;
grant execute on function public.get_compare_result(uuid, uuid) to authenticated;

comment on function public.get_compare_result(uuid, uuid) is
  'The one read path for a single one-to-one comparison. Returns a row ONLY if the caller is the share''s owner (real auth.uid()) or presents the exact respondent_token for that response — never any other caller, never another respondent''s row. match_count is the literal same-question-id-same-choice-id count between the owner''s pinned answers and the friend''s answers.';

-- Owner-only: every response across every share the caller owns, optionally filtered to one
-- quiz_id. Powers the "N people have weighed in" list — never merges responses from
-- different quiz_ids into one list entry, since quiz_id is returned per row for the UI to
-- group/label by the real quiz title.
create or replace function public.list_compare_responses_for_owner(p_quiz_id text default null)
returns table (
  response_id uuid,
  share_id uuid,
  quiz_id text,
  respondent_nickname text,
  friend_primary_result_id text,
  match_count int,
  note text,
  created_at timestamptz,
  viewed_at timestamptz
)
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
  select
    cr.id,
    s.id,
    s.quiz_id,
    cr.respondent_nickname,
    cr.primary_result_id,
    (
      select count(*)::int
      from jsonb_each_text(coalesce(qr.answers, '{}'::jsonb)) oa
      join jsonb_each_text(cr.answers) fa on oa.key = fa.key and oa.value = fa.value
    ),
    cr.note,
    cr.created_at,
    cr.viewed_at
  from public.compare_responses cr
  join public.quiz_shares s on s.id = cr.share_id
  join public.quiz_results qr on qr.id = s.quiz_result_id
  where s.sharer_user_id = v_user
    and (p_quiz_id is null or s.quiz_id = p_quiz_id)
  order by cr.created_at desc;
end;
$$;

revoke all on function public.list_compare_responses_for_owner(text) from public;
revoke all on function public.list_compare_responses_for_owner(text) from anon;
grant execute on function public.list_compare_responses_for_owner(text) to authenticated;

comment on function public.list_compare_responses_for_owner(text) is
  'Owner-only: every compare response across every share owned by auth.uid(), optionally filtered to one quiz_id. Never returns another owner''s responses.';

-- Owner-only aggregate: "APPARENTLY, IT'S A THING." — for the caller's own owner identity +
-- one quiz_id, counts DISTINCT respondent_token values per primary_result_id across ALL of
-- that owner's shares for that quiz (not just one share), so a retake-and-reshare still
-- accumulates toward the same threshold. Only returns rows with count >= 3 (the approved
-- threshold) — the client never needs to apply that filter itself.
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
  select cr.primary_result_id, count(distinct cr.respondent_token) as respondent_count
  from public.compare_responses cr
  join public.quiz_shares s on s.id = cr.share_id
  where s.sharer_user_id = v_user and s.quiz_id = p_quiz_id
  group by cr.primary_result_id
  having count(distinct cr.respondent_token) >= 3;
end;
$$;

revoke all on function public.get_apparently_its_a_thing(text) from public;
revoke all on function public.get_apparently_its_a_thing(text) from anon;
grant execute on function public.get_apparently_its_a_thing(text) to authenticated;

comment on function public.get_apparently_its_a_thing(text) is
  'Owner-only. Distinct respondent_token count per primary_result_id, across ALL of the caller''s shares for one quiz_id — only rows meeting the approved 3-respondent threshold are returned. Never visible to friends (see the AGGREGATE PRIVACY requirement) — auth.uid()-gated, no p_owner_id parameter exists to spoof.';

create or replace function public.mark_compare_response_viewed(p_response_id uuid)
returns void
language plpgsql
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

  update public.compare_responses cr
  set viewed_at = coalesce(cr.viewed_at, now())
  from public.quiz_shares s
  where cr.id = p_response_id and cr.share_id = s.id and s.sharer_user_id = v_user;
end;
$$;

revoke all on function public.mark_compare_response_viewed(uuid) from public;
revoke all on function public.mark_compare_response_viewed(uuid) from anon;
grant execute on function public.mark_compare_response_viewed(uuid) to authenticated;

comment on function public.mark_compare_response_viewed(uuid) is
  'Owner-only. Marks one response viewed (first-view timestamp only, never re-clears it). No-op if the caller does not own the response''s share.';
