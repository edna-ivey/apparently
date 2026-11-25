-- ============================================================================================
-- STAGED, NOT APPLIED. Requires explicit owner authorization before `supabase db push`.
--
-- Build 22 Daily correction. REWRITTEN (2026-10-29) after owner audit: the first version
-- invented a new submit_daily_answer() RPC, which does not match how Daily submission
-- actually works live and would have bypassed/duplicated real, already-shipped security
-- gating. The real architecture (confirmed directly in 20260913120000 and 20260918010000):
--   - PUBLIC room: a direct client INSERT into daily_answers, gated entirely by RLS
--     (daily_answers_insert_own requires status='Live' AND room='public') -- no RPC. V1
--     evidence is attached via an AFTER INSERT TRIGGER (handle_daily_answer_personality_
--     evidence), not an RPC call.
--   - PRIVATE room: direct INSERT is blocked by that same RLS policy (room='public' only);
--     the ONLY path is submit_private_daily_answer(), which already validates
--     room/status/unlock server-side before inserting.
-- Both paths ultimately INSERT into daily_answers. The correct, smallest-change way to
-- attach numeric trait evidence to EITHER path is therefore the same pattern V1 already
-- uses: ONE new AFTER INSERT TRIGGER on daily_answers -- not a new RPC, not a change to
-- submit_private_daily_answer's own gating (which is untouched, still fully in effect).
--
-- Also fixes advance_daily_rotation (applied, live today) so a recycled occurrence's options
-- carry their trait awards forward -- confirmed gap, documented in 20261021160000's own
-- header comment and never fixed. Daily scoring identity uses the REAL occurrence id
-- (daily_questions.id of the specific row actually answered), never a content/wording
-- fingerprint, per the locked product decision.
-- =========================================================================================
-- 1. DAILY_OPTION_TRAIT_AWARDS -- numeric, one row per (option, awarded trait).
-- =========================================================================================

create table public.daily_option_trait_awards (
  option_id uuid not null references public.daily_options (id) on delete cascade,
  trait_id smallint not null references public.personality_traits (trait_id),
  points smallint not null check (points between 1 and 3),
  primary key (option_id, trait_id)
);

comment on table public.daily_option_trait_awards is 'Numeric Daily trait awards -- one row per (option, awarded trait). Approved content only; an option with no personality mapping (ROOM_ONLY questions) simply has zero rows here.';

alter table public.daily_option_trait_awards enable row level security;
create policy "daily_option_trait_awards_select_all" on public.daily_option_trait_awards for select to authenticated using (true);

-- =========================================================================================
-- 2. AFTER INSERT TRIGGER -- fires for every daily_answers insert, from EITHER the public
--    direct-insert path or submit_private_daily_answer(), exactly like the existing V1
--    trigger. daily_answers' own existing unique constraint (user_id, question_id) already
--    guarantees "one answer per occurrence, ever" -- there is no retake branch to write here,
--    mirroring handle_daily_answer_personality_evidence's own shape.
-- =========================================================================================

create or replace function public.handle_daily_answer_trait_evidence()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trait record;
begin
  for v_trait in
    select
      awards.trait_id,
      max(awards.points) as max_available,
      coalesce(max(awards.points) filter (where o.id = new.option_id), 0) as points_earned
    from public.daily_option_trait_awards awards
    join public.daily_options o on o.id = awards.option_id
    where o.question_id = new.question_id
    group by awards.trait_id
  loop
    insert into public.user_trait_evidence (
      user_id, source_type, source_answer_id, trait_id, points_earned, max_available, created_at
    ) values (
      new.user_id, 'daily_answer', new.id, v_trait.trait_id, v_trait.points_earned, v_trait.max_available, new.created_at
    );

    insert into public.user_trait_totals (
      user_id, trait_id, lifetime_earned, max_available_total, distinct_questions_with_earned, distinct_questions_presented, updated_at
    ) values (
      new.user_id, v_trait.trait_id, v_trait.points_earned, v_trait.max_available,
      case when v_trait.points_earned > 0 then 1 else 0 end, 1, now()
    )
    on conflict (user_id, trait_id) do update set
      lifetime_earned = public.user_trait_totals.lifetime_earned + excluded.lifetime_earned,
      max_available_total = public.user_trait_totals.max_available_total + excluded.max_available_total,
      distinct_questions_with_earned = public.user_trait_totals.distinct_questions_with_earned + excluded.distinct_questions_with_earned,
      distinct_questions_presented = public.user_trait_totals.distinct_questions_presented + excluded.distinct_questions_presented,
      updated_at = now();
  end loop;
  return new;
end;
$$;

comment on function public.handle_daily_answer_trait_evidence() is 'Additive AFTER INSERT trigger, parallel to the existing V1 handle_daily_answer_personality_evidence (untouched) and the old V2 handle_daily_answer_pole_evidence (superseded, 20261018010000, never dropped -- it still runs harmlessly against a jsonb column nothing new reads). Fires identically from the PUBLIC direct-insert RLS path and from submit_private_daily_answer()''s own insert -- neither needs any change. daily_answers'' own unique constraint already prevents more than one row ever existing per (user, occurrence), so there is no retake case to special-case here. Trait evidence is keyed to the REAL occurrence (new.question_id, new.id), never a content fingerprint -- a later recycled occurrence of the same template always earns fresh evidence.';

create trigger daily_answers_after_insert_trait_evidence
  after insert on public.daily_answers
  for each row
  execute function public.handle_daily_answer_trait_evidence();

-- =========================================================================================
-- 3. ADVANCE_DAILY_ROTATION FIX -- carry daily_option_trait_awards forward on recycle.
-- =========================================================================================

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
  v_old_option_id uuid;
  v_new_option_id uuid;
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

  if v_candidate is null and v_current_source is not null then
    select * into v_candidate
    from public.daily_questions
    where id = v_current_source and recurrence_source_id is null
    limit 1;
  end if;

  if v_candidate is null then
    return;
  end if;

  update public.daily_questions
  set status = 'Archived'
  where room = p_room and status = 'Live';

  insert into public.daily_questions (
    prompt, category, status, sort_order, scheduled_for, published_for,
    approved_by, approved_at, approved_content_version, review_note,
    room, daily_mode, is_free_private_unlock, recurrence_source_id
  ) values (
    v_candidate.prompt, v_candidate.category, 'Live', v_candidate.sort_order, null, v_today,
    v_candidate.approved_by, v_candidate.approved_at, v_candidate.approved_content_version, v_candidate.review_note,
    v_candidate.room, v_candidate.daily_mode, v_candidate.is_free_private_unlock, v_candidate.id
  ) returning id into v_new_question_id;

  for v_old_option_id in
    select id from public.daily_options where question_id = v_candidate.id order by position
  loop
    insert into public.daily_options (question_id, position, label, personality_effects, apparently_feedback)
    select v_new_question_id, position, label, personality_effects, apparently_feedback
    from public.daily_options
    where id = v_old_option_id
    returning id into v_new_option_id;

    insert into public.daily_option_trait_awards (option_id, trait_id, points)
    select v_new_option_id, trait_id, points
    from public.daily_option_trait_awards
    where option_id = v_old_option_id;
  end loop;

  update public.daily_rotation_state
  set shown_question_ids = case
        when v_candidate.id = any(shown_question_ids) then shown_question_ids
        else array_append(shown_question_ids, v_candidate.id)
      end
  where room = p_room;
end;
$$;

comment on function public.advance_daily_rotation(public.daily_room) is
  'Creates a fresh Daily occurrence from randomized previously-published canonical content, cloning each option AND its daily_option_trait_awards rows so a recycled occurrence keeps its approved V2 scoring (Build 22 fix). Supports both Public and Private rooms.';

revoke execute on function public.advance_daily_rotation(public.daily_room) from public;
revoke execute on function public.advance_daily_rotation(public.daily_room) from anon;
revoke execute on function public.advance_daily_rotation(public.daily_room) from authenticated;
