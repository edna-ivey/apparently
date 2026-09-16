-- Apparently You — allow changing an already-Scheduled Daily's release date.
--
-- Discovered while building the Admin calendar/date picker (see the immediately-preceding
-- 20260916030000_daily_scheduler.sql, already applied — this is a genuinely separate,
-- additional migration rather than an edit to that one): admin_schedule_daily() only ever
-- accepted a FROM status of 'Approved', so calling it again to change the date of a Daily
-- that is already Scheduled was unconditionally rejected ("Only an Approved Daily can be
-- scheduled."). The calendar picker's whole point is letting Michelle tap a new date on an
-- already-Scheduled card — that requires the server to actually allow it.
--
-- CREATE OR REPLACE keeps the function's identity (same OID, same existing EXECUTE grants
-- from the admin control room migration) — nothing about is_admin() gating, the unique-date
-- collision handling, or any other RPC changes here.

create or replace function public.admin_schedule_daily(p_question_id uuid, p_date date)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cur record;
begin
  if not public.is_admin() then
    raise exception 'Not authorized.';
  end if;

  select status into cur from public.daily_questions where id = p_question_id for update;
  if cur is null then
    raise exception 'Daily question not found.';
  end if;
  -- Approved -> Scheduled (first-time scheduling) AND Scheduled -> Scheduled (changing an
  -- already-scheduled date) are both legal here. This is not a new state-machine edge — the
  -- Daily's status literally does not change in the reschedule case, only scheduled_for does.
  if cur.status not in ('Approved', 'Scheduled') then
    raise exception 'Only an Approved or already-Scheduled Daily can be scheduled.';
  end if;

  begin
    update public.daily_questions
    set status = 'Scheduled', scheduled_for = p_date
    where id = p_question_id;
  exception when unique_violation then
    raise exception 'That date already belongs to another Scheduled Daily.';
  end;
end;
$$;
