-- Apparently You — Public Daily indefinite rotation (Build 9).
--
-- publish_scheduled_daily_for_today() (20260916030000) only ever promotes a Daily that an
-- admin explicitly pre-scheduled for today's exact calendar date. Once that admin-curated
-- Scheduled calendar runs out, there is nothing left to promote, and the Public Daily room
-- gets stuck on whatever was last Live -- forever. This migration adds a durable fallback:
-- when no Scheduled Daily exists for today, cycle through the pool of already-approved,
-- previously-published public Daily content (status Live/Archived) instead, in a fresh random
-- order per cycle so a returning user does not see an exact replay of a previous cycle, with
-- every Daily appearing once before any repeat within a cycle.
--
-- Never invents content: the pool is real, previously-approved questions only. Never deletes
-- or alters daily_answers -- a user who already answered a question that cycles back simply
-- sees their earlier answer/reveal again (getDailyAnswer already handles "already answered"),
-- the same as if they'd scrolled back to an old day. Historical Commonality data is untouched;
-- get_daily_distribution still counts every real answer ever recorded. Permanent personality
-- evidence cannot be duplicated by a repeat appearance either: the question_id is reused
-- (never faked), and daily_answers' own UNIQUE(user_id, question_id) constraint (and its
-- INSERT-only personality-evidence trigger) already make a second answer to the same question
-- structurally impossible for a given user.

-- =========================================================================================
-- 1. daily_rotation_state -- one row per room, tracks the current cycle's shuffle progress.
-- =========================================================================================

create table public.daily_rotation_state (
  room public.daily_room primary key,
  cycle_number integer not null default 1,
  -- Question ids already promoted to Live during the CURRENT cycle. Cleared (and cycle_number
  -- incremented) once every eligible question has appeared.
  shown_question_ids uuid[] not null default '{}',
  updated_at timestamptz not null default now()
);

comment on table public.daily_rotation_state is
  'Tracks indefinite Daily rotation (Build 9) -- see advance_daily_rotation(). One row per room. Scheduler-internal bookkeeping only; never read/written by the consumer client (no RLS policy grants anon/authenticated access).';

alter table public.daily_rotation_state enable row level security;
-- Deliberately NO policies at all -- RLS with zero policies denies every role but the table
-- owner (and SECURITY DEFINER functions running as owner), matching daily_questions' own
-- "no admin/editorial table is client-writable" convention.

create trigger daily_rotation_state_set_updated_at
  before update on public.daily_rotation_state
  for each row
  execute function public.set_updated_at();

-- =========================================================================================
-- 2. advance_daily_rotation(room) -- promotes the next Daily in the current cycle, starting a
--    fresh (reshuffled) cycle once every eligible question has appeared once.
-- =========================================================================================

create or replace function public.advance_daily_rotation(p_room public.daily_room)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_state record;
  v_candidate record;
  v_pool_count integer;
begin
  insert into public.daily_rotation_state (room)
  values (p_room)
  on conflict (room) do nothing;

  select * into v_state from public.daily_rotation_state where room = p_room for update;

  -- The eligible pool: real, previously-approved, previously-published content only (Live is
  -- included so the question currently Live is correctly recognized as "already shown this
  -- cycle" below rather than re-selected as its own replacement). Scheduled rows are
  -- deliberately excluded -- reserved for a specific future admin-chosen date, never hijacked
  -- by the automatic rotation.
  select count(*) into v_pool_count
  from public.daily_questions
  where room = p_room and status in ('Live', 'Archived');

  if v_pool_count = 0 then
    -- Nothing has ever been published in this room -- genuinely nothing to rotate to yet.
    return;
  end if;

  select * into v_candidate
  from public.daily_questions
  where room = p_room
    and status in ('Live', 'Archived')
    and not (id = any(v_state.shown_question_ids))
  order by random()
  limit 1;

  if v_candidate is null then
    -- Every eligible question has already appeared this cycle -- start a fresh cycle instead
    -- of getting stuck. Re-select from the FULL pool, still at random, so the new cycle's
    -- order is not a predictable replay of the previous one.
    update public.daily_rotation_state
    set cycle_number = v_state.cycle_number + 1, shown_question_ids = '{}'
    where room = p_room;

    select * into v_candidate
    from public.daily_questions
    where room = p_room and status in ('Live', 'Archived')
    order by random()
    limit 1;
  end if;

  if v_candidate is null then
    return;
  end if;

  -- Same transactional one-Live-per-room pattern as admin_publish_daily/
  -- publish_scheduled_daily_for_today: archive whatever is currently Live in this room, then
  -- promote the chosen candidate, inside this function's single implicit transaction.
  update public.daily_questions set status = 'Archived' where room = p_room and status = 'Live';
  update public.daily_questions
  set status = 'Live', scheduled_for = null, published_for = (now() at time zone 'America/Anchorage')::date
  where id = v_candidate.id;

  update public.daily_rotation_state
  set shown_question_ids = array_append(shown_question_ids, v_candidate.id)
  where room = p_room;
end;
$$;

comment on function public.advance_daily_rotation(public.daily_room) is
  'Durable indefinite-cycle fallback for a room''s Daily, used only when nothing is admin-Scheduled for today. Promotes one real, previously-approved/published question (Live or Archived) not yet shown in the current cycle; once every eligible question has appeared, starts a new cycle (fresh random order) rather than getting stuck. Never invents content, never touches daily_answers. Owner/cron-only.';

revoke execute on function public.advance_daily_rotation(public.daily_room) from public;
revoke execute on function public.advance_daily_rotation(public.daily_room) from anon;
revoke execute on function public.advance_daily_rotation(public.daily_room) from authenticated;

-- =========================================================================================
-- 3. run_daily_rollover() -- the new hourly cron target. Tries the admin-Scheduled calendar
--    first (publish_scheduled_daily_for_today, left completely unmodified), then falls back
--    to the pool-cycle rotation for the Public room only when nothing was published today.
--    Private rotation is intentionally out of scope for this pass -- Build 9 Part B addresses
--    a separate Private Daily rendering bug, not its content cycle.
-- =========================================================================================

create or replace function public.run_daily_rollover()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.publish_scheduled_daily_for_today();

  -- Only fall back to automatic rotation if the Public room's CURRENT Live question was not
  -- published today -- covers both "nothing was Scheduled for today" and "nothing has ever
  -- been Scheduled at all." Checking published_for (not a separate flag) keeps this hourly
  -- cron naturally idempotent: once the Public room has a fresh Live question for today
  -- (whether from the Scheduled calendar or from rotation), every later run this same day is
  -- a no-op.
  if not exists (
    select 1 from public.daily_questions
    where room = 'public' and status = 'Live'
      and published_for = (now() at time zone 'America/Anchorage')::date
  ) then
    perform public.advance_daily_rotation('public');
  end if;
end;
$$;

comment on function public.run_daily_rollover() is
  'Hourly Daily rollover entry point (replaces publish_scheduled_daily_for_today as the cron target). Tries the admin-Scheduled calendar first (publish_scheduled_daily_for_today, unmodified); if the Public room still has no fresh Live question for today, falls back to advance_daily_rotation(''public'') so the Public Daily cycles indefinitely instead of getting stuck once the Scheduled calendar runs out.';

revoke execute on function public.run_daily_rollover() from public;
revoke execute on function public.run_daily_rollover() from anon;
revoke execute on function public.run_daily_rollover() from authenticated;

-- cron.schedule with an existing job name updates it in place rather than duplicating it
-- (documented and relied upon identically in the original 20260916030000 migration).
select cron.schedule(
  'apparently_daily_rollover',
  '5 * * * *',
  $$select public.run_daily_rollover();$$
);
