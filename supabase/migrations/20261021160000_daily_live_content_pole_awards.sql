-- ============================================================================================
-- STAGED, NOT APPLIED. Requires explicit owner authorization before `supabase db push`.
--
-- DEPENDENCY: must be applied AFTER 20261018010000_personality_scoring_v2_schema.sql, which is
-- itself also still staged/not applied. This migration's UPDATE statements target
-- public.daily_options.pole_personality_effects, a column that migration adds -- running this
-- one first will fail outright (undefined column), not silently no-op.
--
-- WHAT THIS DOES: writes positive-only V2 pole awards onto the 60 real, currently-live
-- daily_options rows (across the 15 canonical daily_questions that carry a real personality
-- mapping; the other 12 live Daily questions are deliberately ROOM_ONLY -- no personality
-- mapping of any kind, untouched here) by UPDATEing each option's pole_personality_effects
-- column in place. Every id below is a REAL production row id, pulled via
-- `supabase db query --linked` on 2026-10-21 and cross-checked against the live
-- daily_options.personality_effects it was derived from -- see
-- docs/DAILY_LIVE_CONTENT_POLE_RECALIBRATION_2026-10-21.md for the full, per-answer evidence
-- review this was built from, including the one place a mapping was corrected (not just
-- repolarized) on re-examination.
--
-- WHAT THIS DOES NOT DO: it never touches the existing, live, signed personality_effects
-- column on any of these rows -- that column, and the V1 engine that reads it
-- (personality_evidence, scorePersonalityProfile), are completely unaffected. This is
-- additive-only, exactly like 20261018010000's own schema design: V1 keeps working today,
-- unchanged, for every existing user; V2 evidence simply becomes available to accumulate going
-- forward once BOTH this migration and the schema migration it depends on are applied and a
-- Daily question carrying these awards is actually served (recurrence clones copy
-- personality_effects today per 20261003103000_fresh_daily_occurrences_both_rooms.sql's
-- `advance_daily_rotation` -- that function's own INSERT ... SELECT will need a one-line
-- addition to also carry pole_personality_effects forward, or future recycled occurrences of
-- this content will silently lose their V2 awards even after this migration ships; flagged
-- here, not fixed in this migration, since changing advance_daily_rotation is a separate,
-- already-existing function this migration does not otherwise touch).
--
-- VERIFICATION GUARD: raises an exception (aborting the whole migration transaction) if the
-- actual row count affected does not match the expected 60 -- protects against this migration
-- being applied against a database where these specific option ids no longer exist or already
-- differ from what this was built against, rather than silently doing less than intended.
-- ============================================================================================

update public.daily_options set pole_personality_effects = '[{"pole": "planner_spontaneous:negative", "points": 2}, {"pole": "adventure_comfort:positive", "points": 2}]'::jsonb where id = '1d3533fa-a3db-4e4f-b24f-22f678d7c763';
update public.daily_options set pole_personality_effects = '[{"pole": "adventure_comfort:positive", "points": 1}, {"pole": "curious_decisive:positive", "points": 1}]'::jsonb where id = '2f7cf318-6b23-4d88-9c53-04cae817bb0a';
update public.daily_options set pole_personality_effects = '[{"pole": "planner_spontaneous:positive", "points": 2}, {"pole": "control_allowing:positive", "points": 2}]'::jsonb where id = '4eb27666-828b-4bf2-9436-13429db3cf3c';
update public.daily_options set pole_personality_effects = '[{"pole": "adventure_comfort:negative", "points": 2}, {"pole": "control_allowing:positive", "points": 1}]'::jsonb where id = '13263cbd-fa9e-4943-96f5-63d1b58af65b';
update public.daily_options set pole_personality_effects = '[{"pole": "playful_serious:positive", "points": 1}, {"pole": "conflict_peacekeeping:positive", "points": 1}]'::jsonb where id = '4eec948e-30ab-44ac-8d14-f15a2112299d';
update public.daily_options set pole_personality_effects = '[{"pole": "protective_hands_off:positive", "points": 1}, {"pole": "direct_indirect:positive", "points": 1}]'::jsonb where id = 'd771b4ef-247a-4ffb-8ece-9a09ecfb7f6e';
update public.daily_options set pole_personality_effects = '[{"pole": "sentimental_thick_skinned:positive", "points": 1}, {"pole": "social_attunement:positive", "points": 1}]'::jsonb where id = '7ee6691e-7f63-4b3b-84e3-ff32d08e3ff7';
update public.daily_options set pole_personality_effects = '[{"pole": "direct_indirect:positive", "points": 2}, {"pole": "control_allowing:positive", "points": 1}]'::jsonb where id = '273e9434-8661-43ce-835d-a9dc850d0f4f';
update public.daily_options set pole_personality_effects = '[{"pole": "curious_decisive:positive", "points": 1}, {"pole": "playful_serious:positive", "points": 1}]'::jsonb where id = '6c805dde-907e-42a7-8f72-9b48f2462d9d';
update public.daily_options set pole_personality_effects = '[{"pole": "trust_verify:positive", "points": 1}, {"pole": "forgiving_receipts:positive", "points": 1}]'::jsonb where id = 'e0cd62cc-ba09-4fa7-be85-93e1883aa3a1';
update public.daily_options set pole_personality_effects = '[{"pole": "social_attunement:positive", "points": 1}, {"pole": "rules_bending:positive", "points": 1}]'::jsonb where id = 'd661a8bb-2af1-4a7f-a94e-d6581d4183a0';
update public.daily_options set pole_personality_effects = '[{"pole": "forgiving_receipts:positive", "points": 1}, {"pole": "emotional_intensity:negative", "points": 1}]'::jsonb where id = '192a75b4-b2d2-4d74-887b-9eaea49496cf';
update public.daily_options set pole_personality_effects = '[{"pole": "control_allowing:positive", "points": 1}, {"pole": "conflict_peacekeeping:positive", "points": 1}]'::jsonb where id = '2aa026e5-2778-450a-9a97-56bd483a87b2';
update public.daily_options set pole_personality_effects = '[{"pole": "conflict_peacekeeping:negative", "points": 2}]'::jsonb where id = '650194db-2247-4a70-bca3-a950bf6e0344';
update public.daily_options set pole_personality_effects = '[{"pole": "playful_serious:positive", "points": 1}, {"pole": "forgiving_receipts:negative", "points": 1}]'::jsonb where id = '30ed587d-5253-4303-a638-e87607d91452';
update public.daily_options set pole_personality_effects = '[{"pole": "emotional_intensity:negative", "points": 2}, {"pole": "control_allowing:negative", "points": 1}]'::jsonb where id = '762c2efa-cdb9-42f3-a482-1ede40360d73';
update public.daily_options set pole_personality_effects = '[{"pole": "conflict_peacekeeping:negative", "points": 1}, {"pole": "patient_urgent:positive", "points": 1}]'::jsonb where id = '2d45834d-3201-48af-9963-5e7599ad9aa8';
update public.daily_options set pole_personality_effects = '[{"pole": "playful_serious:positive", "points": 1}, {"pole": "forgiving_receipts:negative", "points": 1}]'::jsonb where id = '780eb488-cf72-44a9-a591-3f4e1c1609fa';
update public.daily_options set pole_personality_effects = '[{"pole": "forgiving_receipts:positive", "points": 1}, {"pole": "protective_hands_off:negative", "points": 1}]'::jsonb where id = 'd1932683-6885-4675-a07b-bb449a9ccc99';
update public.daily_options set pole_personality_effects = '[{"pole": "direct_indirect:positive", "points": 2}, {"pole": "protective_hands_off:positive", "points": 1}]'::jsonb where id = '51e7a010-0727-4acd-920a-212662a2d40a';
update public.daily_options set pole_personality_effects = '[{"pole": "forgiving_receipts:positive", "points": 2}, {"pole": "trust_verify:positive", "points": 1}]'::jsonb where id = 'ddc750d1-9d7a-49b6-a636-f7783d7a3e57';
update public.daily_options set pole_personality_effects = '[{"pole": "forgiving_receipts:positive", "points": 1}, {"pole": "trust_verify:negative", "points": 1}]'::jsonb where id = '0422e592-adf6-42d7-9434-76be0a211955';
update public.daily_options set pole_personality_effects = '[{"pole": "trust_verify:negative", "points": 2}, {"pole": "practical_idealistic:positive", "points": 1}]'::jsonb where id = '7b358f4f-b49e-416c-843a-d5820dfdd44e';
update public.daily_options set pole_personality_effects = '[{"pole": "forgiving_receipts:negative", "points": 2}, {"pole": "curious_decisive:negative", "points": 1}]'::jsonb where id = 'e5e2859c-4642-4913-9b48-5d1a91596ce0';
update public.daily_options set pole_personality_effects = '[{"pole": "private_open:negative", "points": 2}, {"pole": "direct_indirect:positive", "points": 1}]'::jsonb where id = 'fec3e884-03cf-44b1-93f6-44eb2c109665';
update public.daily_options set pole_personality_effects = '[{"pole": "private_open:negative", "points": 1}, {"pole": "practical_idealistic:positive", "points": 1}]'::jsonb where id = '5355204a-80a9-4d8b-b658-6ad44c482946';
update public.daily_options set pole_personality_effects = '[{"pole": "playful_serious:positive", "points": 2}, {"pole": "direct_indirect:negative", "points": 1}]'::jsonb where id = '00adaac1-5c70-4def-8f78-476681e71998';
update public.daily_options set pole_personality_effects = '[{"pole": "private_open:positive", "points": 2}, {"pole": "trust_verify:negative", "points": 1}]'::jsonb where id = '065b694e-4d79-4a9a-a1c4-1bb101ab1232';
update public.daily_options set pole_personality_effects = '[{"pole": "curious_decisive:positive", "points": 1}, {"pole": "practical_idealistic:positive", "points": 1}]'::jsonb where id = '3fd1f90b-670e-48c3-99a8-c229120f0b93';
update public.daily_options set pole_personality_effects = '[{"pole": "rules_bending:positive", "points": 2}, {"pole": "direct_indirect:positive", "points": 1}]'::jsonb where id = '6fe8aa77-687a-4ae4-a7c6-5f65789f71dd';
update public.daily_options set pole_personality_effects = '[{"pole": "protective_hands_off:positive", "points": 1}, {"pole": "rules_bending:negative", "points": 1}]'::jsonb where id = '8ad5b062-0340-489f-be68-1aea7e5fa064';
update public.daily_options set pole_personality_effects = '[{"pole": "conflict_peacekeeping:negative", "points": 1}, {"pole": "protective_hands_off:positive", "points": 1}, {"pole": "practical_idealistic:positive", "points": 1}]'::jsonb where id = '5ef6c827-f194-4b92-aac8-94df4de43cb2';
update public.daily_options set pole_personality_effects = '[{"pole": "patient_urgent:positive", "points": 1}]'::jsonb where id = '510bfd80-17f5-4be1-9507-57ff2970807d';
update public.daily_options set pole_personality_effects = '[{"pole": "rules_bending:positive", "points": 2}]'::jsonb where id = 'c1accf2d-3ec0-4a32-889d-209febe05c67';
update public.daily_options set pole_personality_effects = '[{"pole": "trust_verify:negative", "points": 2}, {"pole": "practical_idealistic:positive", "points": 1}]'::jsonb where id = '4b2d5e3c-8a01-4f2a-8f3e-2acbecc282c1';
update public.daily_options set pole_personality_effects = '[{"pole": "rules_bending:negative", "points": 2}, {"pole": "planner_spontaneous:negative", "points": 1}]'::jsonb where id = '9f7b1c4d-619b-403e-96b5-96023fa13211';
update public.daily_options set pole_personality_effects = '[{"pole": "direct_indirect:positive", "points": 2}, {"pole": "conflict_peacekeeping:positive", "points": 2}]'::jsonb where id = '2624fc7b-f85e-4406-9688-892f2eb72402';
update public.daily_options set pole_personality_effects = '[{"pole": "private_open:positive", "points": 2}, {"pole": "conflict_peacekeeping:negative", "points": 1}]'::jsonb where id = 'ad0c2d5e-7969-4f92-9acd-4e53de6c7230';
update public.daily_options set pole_personality_effects = '[{"pole": "direct_indirect:negative", "points": 2}, {"pole": "playful_serious:negative", "points": 1}]'::jsonb where id = 'e27bcac6-a3ad-4853-8536-44e0273e9b80';
update public.daily_options set pole_personality_effects = '[{"pole": "direct_indirect:positive", "points": 2}, {"pole": "forgiving_receipts:negative", "points": 1}]'::jsonb where id = 'a48b3d9e-cf16-4e61-bf18-c702a7fcb202';
update public.daily_options set pole_personality_effects = '[{"pole": "curious_decisive:positive", "points": 1}, {"pole": "trust_verify:negative", "points": 1}]'::jsonb where id = '6dcb7df8-2c02-4564-915a-f3bad573c360';
update public.daily_options set pole_personality_effects = '[{"pole": "trust_verify:positive", "points": 1}, {"pole": "independent_collaborative:positive", "points": 1}]'::jsonb where id = 'ba4eba3d-775c-4467-a37c-dfafc2d278a1';
update public.daily_options set pole_personality_effects = '[{"pole": "trust_verify:negative", "points": 2}, {"pole": "social_attunement:positive", "points": 1}]'::jsonb where id = '61cb483c-3eb9-4b45-8ca1-609aba673051';
update public.daily_options set pole_personality_effects = '[{"pole": "direct_indirect:positive", "points": 1}, {"pole": "trust_verify:negative", "points": 1}]'::jsonb where id = '22ed955f-1878-4523-ba2e-feebaf3c49b4';
update public.daily_options set pole_personality_effects = '[{"pole": "trust_verify:negative", "points": 2}, {"pole": "protective_hands_off:positive", "points": 1}]'::jsonb where id = '399c5eae-6d39-449f-b796-fcd9ae3502f0';
update public.daily_options set pole_personality_effects = '[{"pole": "playful_serious:positive", "points": 2}, {"pole": "protective_hands_off:positive", "points": 1}, {"pole": "direct_indirect:positive", "points": 1}]'::jsonb where id = 'd4083739-7fa3-4ce1-a7e5-22ef03c84e63';
update public.daily_options set pole_personality_effects = '[{"pole": "trust_verify:positive", "points": 2}, {"pole": "protective_hands_off:negative", "points": 1}]'::jsonb where id = '7d0df73e-acd8-4816-8679-072cef46c2c0';
update public.daily_options set pole_personality_effects = '[{"pole": "direct_indirect:positive", "points": 2}, {"pole": "protective_hands_off:positive", "points": 1}]'::jsonb where id = '67aaacad-28b7-4bd4-b61a-7a5a4191d2e1';
update public.daily_options set pole_personality_effects = '[{"pole": "patient_urgent:negative", "points": 2}, {"pole": "trust_verify:positive", "points": 1}]'::jsonb where id = '3242db06-4178-42f8-9f3b-d8b7d4c32a76';
update public.daily_options set pole_personality_effects = '[{"pole": "trust_verify:negative", "points": 2}, {"pole": "curious_decisive:positive", "points": 1}]'::jsonb where id = '1ac1a42a-3365-4818-9753-fc317905e5bb';
update public.daily_options set pole_personality_effects = '[{"pole": "direct_indirect:positive", "points": 2}, {"pole": "control_allowing:positive", "points": 1}]'::jsonb where id = '69542272-19b5-46cc-b403-08c8cbadc3ee';
update public.daily_options set pole_personality_effects = '[{"pole": "curious_decisive:negative", "points": 2}]'::jsonb where id = 'ba72f8ea-980c-4259-b2c8-a7c2476a4de4';
update public.daily_options set pole_personality_effects = '[{"pole": "direct_indirect:positive", "points": 2}, {"pole": "conflict_peacekeeping:positive", "points": 2}]'::jsonb where id = 'e798c52a-10cb-4aa9-b474-b8b559b9a836';
update public.daily_options set pole_personality_effects = '[{"pole": "conflict_peacekeeping:negative", "points": 1}, {"pole": "patient_urgent:positive", "points": 1}]'::jsonb where id = '8489219e-88b1-4e92-8e46-62e70f184209';
update public.daily_options set pole_personality_effects = '[{"pole": "social_attunement:positive", "points": 2}, {"pole": "trust_verify:negative", "points": 1}]'::jsonb where id = '329940d2-f335-467c-a8c9-aa90a634a618';
update public.daily_options set pole_personality_effects = '[{"pole": "forgiving_receipts:negative", "points": 2}, {"pole": "playful_serious:positive", "points": 1}]'::jsonb where id = '4e9cefff-5ca1-4517-a0f8-a2b5de8ae00d';
update public.daily_options set pole_personality_effects = '[{"pole": "control_allowing:positive", "points": 2}, {"pole": "curious_decisive:negative", "points": 2}]'::jsonb where id = '99ae0194-c7d1-4586-b0e5-4b1b03320726';
update public.daily_options set pole_personality_effects = '[{"pole": "independent_collaborative:negative", "points": 2}, {"pole": "control_allowing:positive", "points": 1}]'::jsonb where id = '09456186-df6e-4405-be9d-e42484a79908';
update public.daily_options set pole_personality_effects = '[{"pole": "control_allowing:negative", "points": 2}, {"pole": "patient_urgent:positive", "points": 1}]'::jsonb where id = 'd7a83d46-19f9-4c9b-96bd-20d234f34baa';
update public.daily_options set pole_personality_effects = '[{"pole": "independent_collaborative:positive", "points": 2}, {"pole": "direct_indirect:positive", "points": 1}]'::jsonb where id = '740878a1-f297-4f20-8fb5-c3cef5b00938';

do $$
declare
  v_count integer;
begin
  select count(*) into v_count
  from public.daily_options
  where pole_personality_effects <> '[]'::jsonb;

  if v_count <> 60 then
    raise exception 'Expected exactly 60 daily_options rows with non-empty pole_personality_effects after this migration, found %. Aborting -- the target rows likely no longer match what this migration was built against (see this file''s own header).', v_count;
  end if;
end $$;

-- ============================================================================================
-- COMPATIBILITY FIX, same dependency/staging status as everything above: advance_daily_rotation
-- (20261003103000_fresh_daily_occurrences_both_rooms.sql) creates each day's fresh Daily
-- occurrence by copying a canonical question's options via `insert ... select`, but that SELECT
-- only ever named personality_effects -- it would silently never carry pole_personality_effects
-- forward onto a recycled occurrence, meaning every recycled day's instance of this content
-- would quietly lose its V2 awards even after this migration ships. Byte-for-byte identical to
-- the live function except for the two additive column references (one in each insert's column
-- list), per that migration's own header: do not restructure its actual rotation logic here.
-- ============================================================================================

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

  insert into public.daily_options (
    question_id, position, label, personality_effects, pole_personality_effects, apparently_feedback
  )
  select
    v_new_question_id, position, label, personality_effects, pole_personality_effects, apparently_feedback
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
  'Creates a fresh Daily occurrence from randomized previously-published canonical content. It never reactivates an old question row, so historical daily_answers stay attached to the old occurrence and never pre-answer a later recycled day. Supports both Public and Private rooms. Updated 2026-10-21 to also carry pole_personality_effects forward onto a recycled occurrence -- previously only personality_effects (V1) was copied, which would have silently dropped V2 pole awards on every recycle.';

revoke execute on function public.advance_daily_rotation(public.daily_room) from public;
revoke execute on function public.advance_daily_rotation(public.daily_room) from anon;
revoke execute on function public.advance_daily_rotation(public.daily_room) from authenticated;
