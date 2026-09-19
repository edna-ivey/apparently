-- Result-first quiz sharing. A recipient who opens a shared link sees the SHARER's result
-- first (never an unanswered quiz) — see create_quiz_share/get_shared_quiz_result below and
-- src/app/s/[token].tsx. This is engineering/infrastructure only: no new Private quiz/Daily
-- creative content is added or changed by this migration.
--
-- Design summary (see the engineering sprint report for the full reasoning):
--   * quiz_shares.id is the opaque public share token — a random uuid, never the sharer's raw
--     auth.users id, and never sequential/guessable.
--   * Each share is pinned to ONE SPECIFIC quiz_results row (quiz_result_id) at creation time,
--     so a later retake of the same quiz can never silently change what an already-distributed
--     link shows — the historical quiz_results row is immutable/append-only already.
--   * quiz_id/result_id are denormalized copies onto quiz_shares itself (not a join read from
--     quiz_results at view time), so the anonymous-readable RPC below never touches
--     quiz_results' own RLS-protected columns at all, and can never leak anything beyond
--     exactly the one result a user chose to share.
--   * The actual result COPY (title/heroRead/body/kicker/traits) is never duplicated into the
--     database — it's re-resolved client-side from the existing quiz definition content by
--     (quiz_id, result_id), the same "reuse approved copy" pattern reconstructResultDisplay
--     already uses for the "See result" path. Nothing here invents or stores new copy.
--   * quiz_shares has RLS enabled with NO policies at all — every legitimate access path goes
--     through the two SECURITY DEFINER RPCs below, matching this project's existing pattern
--     for sensitive tables (e.g. admin_users).

create table public.quiz_shares (
  id uuid primary key default gen_random_uuid(),
  sharer_user_id uuid not null references auth.users (id) on delete cascade,
  quiz_id text not null,
  result_id text not null,
  quiz_result_id uuid not null references public.quiz_results (id) on delete cascade,
  -- Snapshot of the sharer's local display name AT SHARE TIME (self-reported first name
  -- already visible in their own UI — never anything more sensitive). Snapshotted, not
  -- live-synced, for the same reason the result itself is pinned: an already-distributed link
  -- must not silently change later. Null/blank renders as "Someone" client-side.
  sharer_display_name text,
  created_at timestamptz not null default now()
);

comment on table public.quiz_shares is
  'One row per "Share this" tap that successfully pins a specific quiz_results completion. id is the opaque public share token. RLS is enabled with zero policies — access is exclusively through create_quiz_share() and get_shared_quiz_result().';

create index quiz_shares_sharer_idx on public.quiz_shares (sharer_user_id);
create index quiz_shares_quiz_result_idx on public.quiz_shares (quiz_result_id);

alter table public.quiz_shares enable row level security;

-- Pins the CALLER's own most recent completion of p_quiz_id. Reuses an existing share row for
-- the same (sharer, quiz_result_id) rather than growing a new token every time Share is
-- tapped again for the same completion.
create or replace function public.create_quiz_share(p_quiz_id text, p_sharer_display_name text default null)
returns table (share_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_result record;
  v_existing uuid;
  v_new_id uuid;
begin
  v_user := auth.uid();
  if v_user is null then
    raise exception 'Not authenticated.';
  end if;

  select id, result_id into v_result
  from public.quiz_results
  where user_id = v_user and quiz_id = p_quiz_id
  order by completed_at desc
  limit 1;

  if v_result is null then
    raise exception 'No completion found for this quiz.';
  end if;

  select id into v_existing
  from public.quiz_shares
  where sharer_user_id = v_user and quiz_result_id = v_result.id
  limit 1;

  if v_existing is not null then
    return query select v_existing;
    return;
  end if;

  insert into public.quiz_shares (sharer_user_id, quiz_id, result_id, quiz_result_id, sharer_display_name)
  values (v_user, p_quiz_id, v_result.result_id, v_result.id, nullif(btrim(coalesce(p_sharer_display_name, '')), ''))
  returning id into v_new_id;

  return query select v_new_id;
end;
$$;

revoke all on function public.create_quiz_share(text, text) from public;
revoke all on function public.create_quiz_share(text, text) from anon;
grant execute on function public.create_quiz_share(text, text) to authenticated;

comment on function public.create_quiz_share(text, text) is
  'The one write path for quiz_shares. Always pins the CALLER''s (auth.uid()) own latest completion of p_quiz_id — a client can never supply an arbitrary quiz_result_id or share on behalf of another user.';

-- The one read path for a shared result. Deliberately grantable to a caller with NO session
-- at all (anon) — an anonymous web visitor must be able to open a shared link without
-- installing/signing into the app. Returns only what a shared-result landing needs: never the
-- sharer's user id, never any other completion, never personality effects/evidence.
create or replace function public.get_shared_quiz_result(p_share_id uuid)
returns table (quiz_id text, result_id text, sharer_display_name text, created_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select s.quiz_id, s.result_id, s.sharer_display_name, s.created_at
  from public.quiz_shares s
  where s.id = p_share_id;
$$;

revoke all on function public.get_shared_quiz_result(uuid) from public;
grant execute on function public.get_shared_quiz_result(uuid) to anon;
grant execute on function public.get_shared_quiz_result(uuid) to authenticated;

comment on function public.get_shared_quiz_result(uuid) is
  'The one read path for a shared quiz result — safe for a fully anonymous caller. Never exposes sharer_user_id or any column beyond quiz_id/result_id/sharer_display_name/created_at.';

-- FUTURE (not built in this pass — see the engineering sprint report''s "unfinished work"
-- section): "THEY HAVE NOTES." full friend-answering Compare persistence would add a
-- separate table (e.g. compare_responses) keyed by quiz_shares.id recording a respondent's
-- own answers ABOUT the sharer for the same quiz, plus a narrow RPC to submit those answers
-- and a comparison read RPC that reveals the approved WELL... THAT TRACKS / THE PLOT TWIST /
-- THE PART YOU MISSED / APPARENTLY, IT'S A THING. copy (Michelle-approved creative content,
-- never authored here). quiz_shares.id is already the natural foreign key that flow hangs
-- off of. Nothing in this migration builds or fakes that persistence.
