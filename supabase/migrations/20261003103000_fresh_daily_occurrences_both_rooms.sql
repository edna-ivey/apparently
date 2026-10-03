-- Every calendar-day Daily must be a FRESH answer occurrence, even when its content is
-- recycled from the archive. Reusing the same daily_questions.id makes the consumer correctly
-- find the user's historical daily_answers row, which is wrong for a new day's occurrence.
--
-- Canonical editorial rows stay intact with all historical answers. A recycled day gets a new
-- daily_questions row + new daily_options ids, linked back to the canonical source. This lets
-- users answer the repeated prompt again without overwriting or mutating any prior answer.

alter table public.daily_questions
  add column if not exists recurrence_source_id uuid references public.daily_questions(id) on delete restrict;

create index if not exists daily_questions_recurrence_source_idx
  on public.daily_questions (recurrence_source_id);

comment on column public.daily_questions.recurrence_source_id is
  'Null for canonical editorial Daily content. For a recycled Daily occurrence, points to the canonical source question whose prompt/options were copied. Each occurrence has fresh ids so prior daily_answers remain immutable and do not pre-answer a new day.';

create or replace function public.advance_daily_rotation(p_room public.daily_room)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_state record;
  v_current record;
  v_current_source uuid;
  v_candidate record;
  v_new_question_id uuid;
  v_today date := (now() at time zone 'America/Anchorage')::date;
begin
  insert into public.daily_rotation_state (room)
  values (p_room)
  on conflict (room) do nothing;

  select * into v_state
  from public.daily_rotation_state
  where room = p_room
  for update;

  select * into v_current
  from public.daily_questions
  where room = p_room and status = 'Live'
  limit 1
  for update;

  if v_current is not null then
    v_current_source := coalesce(v_current.recurrence_source_id, v_current.id);
    if not (v_current_source = any(v_state.shown_question_ids)) then
      update public.daily_rotation_state
      set shown_question_ids = array_append(shown_question_ids, v_current_source)
      where room = p_room;
      select * into v_state from public.daily_rotation_state where room = p_room;
    end if;
  end if;

  -- Pick a canonical, previously-published question not yet used this cycle. Occurrence clones
  -- are never themselves candidates, preventing the recycle pool from multiplying duplicates.
  select * into v_candidate
  from public.daily_questions
  where room = p_room
    and recurrence_source_id is null
    and status in ('Live', 'Archived')
    and (v_current_source is null or id <> v_current_source)
    and not (id = any(v_state.shown_question_ids))
  order by random()
  limit 1;

  if v_candidate is null then
    -- Fresh randomized cycle. Keep the current canonical source marked as already shown so the
    -- first day of a new cycle does not immediately repeat yesterday when another choice exists.
    update public.daily_rotation_state
    set cycle_number = cycle_number + 1,
        shown_question_ids = case when v_current_source is null then '{}'::uuid[] else array[v_current_source] end
    where room = p_room;

    select * into v_state from public.daily_rotation_state where room = p_room;

    select * into v_candidate
    from public.daily_questions
    where room = p_room
      and recurrence_source_id is null
      and status in ('Live', 'Archived')
      and (v_current_source is null or id <> v_current_source)
      and not (id = any(v_state.shown_question_ids))
    order by random()
    limit 1;
  end if;

  -- If a room only has one canonical published question, repeating that content is preferable
  -- to leaving yesterday stuck. It still becomes a fresh occurrence with fresh answer ids.
  if v_candidate is null and v_current_source is not null then
    select * into v_candidate
    from public.daily_questions
    where id = v_current_source and recurrence_source_id is null
    limit 1;
  end if;

  if v_candidate is null then
    return;
  end if;

  -- Archive yesterday's occurrence/source, but NEVER alter its answers.
  update public.daily_questions
  set status = 'Archived'
  where room = p_room and status = 'Live';

  -- Create today's fresh occurrence from canonical approved content.
  insert into public.daily_questions (
    prompt, category, status, sort_order, scheduled_for, published_for,
    approved_by, approved_at, approved_content_version, review_note,
    room, daily_mode, is_free_private_unlock, recurrence_source_id
  ) values (
    v_candidate.prompt, v_candidate.category, 'Live', v_candidate.sort_order, null, v_today,
    v_candidate.approved_by, v_candidate.approved_at, v_candidate.approved_content_version, v_candidate.review_note,
    v_candidate.room, v_candidate.daily_mode, v_candidate.is_free_private_unlock, v_candidate.id
  ) returning id into v_new_question_id;

  insert into public.daily_options (
    question_id, position, label, personality_effects, apparently_feedback
  )
  select
    v_new_question_id, position, label, personality_effects, apparently_feedback
  from public.daily_options
  where question_id = v_candidate.id
  order by position;

  update public.daily_rotation_state
  set shown_question_ids = case
        when v_candidate.id = any(shown_question_ids) then shown_question_ids
        else array_append(shown_question_ids, v_candidate.id)
      end
  where room = p_room;
end;
$$;

comment on function public.advance_daily_rotation(public.daily_room) is
  'Creates a fresh Daily occurrence from randomized previously-published canonical content. It never reactivates an old question row, so historical daily_answers stay attached to the old occurrence and never pre-answer a later recycled day. Supports both Public and Private rooms.';

revoke execute on function public.advance_daily_rotation(public.daily_room) from public;
revoke execute on function public.advance_daily_rotation(public.daily_room) from anon;
revoke execute on function public.advance_daily_rotation(public.daily_room) from authenticated;

create or replace function public.run_daily_rollover()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'America/Anchorage')::date;
begin
  -- Admin-curated schedule always wins, independently for both rooms.
  perform public.publish_scheduled_daily_for_today();

  -- If either room still has yesterday's Live content, create a fresh recycled occurrence.
  if not exists (
    select 1 from public.daily_questions
    where room = 'public' and status = 'Live' and published_for = v_today
  ) then
    perform public.advance_daily_rotation('public');
  end if;

  if not exists (
    select 1 from public.daily_questions
    where room = 'private' and status = 'Live' and published_for = v_today
  ) then
    perform public.advance_daily_rotation('private');
  end if;
end;
$$;

comment on function public.run_daily_rollover() is
  'Hourly Alaska-calendar Daily rollover for BOTH rooms. Scheduled content wins. When a room has no freshly-published question for today, creates a fresh occurrence from its randomized archive pool so the Daily never stalls and historical answers never pre-answer a recycled prompt.';

revoke execute on function public.run_daily_rollover() from public;
revoke execute on function public.run_daily_rollover() from anon;
revoke execute on function public.run_daily_rollover() from authenticated;

select cron.schedule(
  'apparently_daily_rollover',
  '5 * * * *',
  $$select public.run_daily_rollover();$$
);
