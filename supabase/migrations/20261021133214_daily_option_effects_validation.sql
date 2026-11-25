-- ============================================================================================
-- STAGED, NOT YET APPLIED. Build 18 Work Package 1 -- removing the client-side 3-trait-per-
-- answer cap (src/data/daily-questions.ts, src/app/admin/(protected)/review/[id].tsx) means
-- admin_update_daily_option's own input is the ONLY remaining place that could let a bad
-- personality_effects payload reach the database -- and today it does zero validation of
-- that JSONB at all (confirmed by reading its current definition in
-- 20260913220000_admin_control_room.sql: it writes p_personality_effects verbatim). This is
-- additive defense-in-depth, not a reaction to a live incident: the admin RPC is already
-- restricted to is_admin(), so the blast radius was always limited to a trusted editor, but
-- the owner's own Build 18 instruction explicitly asks to "preserve legitimate validation,
-- duplicate-dimension prevention, score magnitude limits" while removing the count cap --
-- this is that validation, matching the exact dimension allow-list and value range
-- submit_quiz_result already enforces for the same PersonalityEffect shape.
--
-- Deliberately NO cap on array length (jsonb_array_length(p_personality_effects)) -- that is
-- the exact owner-locked removal this migration exists alongside, never reintroduced here.
-- ============================================================================================

create or replace function public.admin_update_daily_option(
  p_option_id uuid,
  p_label text,
  p_personality_effects jsonb,
  p_apparently_feedback text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  opt record;
  v_effects jsonb;
  v_effect jsonb;
  v_dimension text;
  v_value numeric;
  v_seen_dimensions text[] := '{}';
begin
  if not public.is_admin() then
    raise exception 'Not authorized.';
  end if;

  select o.question_id as question_id, q.status as parent_status
  into opt
  from public.daily_options o
  join public.daily_questions q on q.id = o.question_id
  where o.id = p_option_id
  for update of o;

  if opt is null then
    raise exception 'Daily option not found.';
  end if;
  if opt.parent_status in ('Live', 'Archived') then
    raise exception 'Live and Archived Daily content is immutable.';
  end if;

  v_effects := coalesce(p_personality_effects, '[]'::jsonb);
  if jsonb_typeof(v_effects) <> 'array' then
    raise exception 'personality_effects must be a JSON array.';
  end if;

  -- No limit on jsonb_array_length(v_effects) here -- any number of genuinely distinct
  -- dimensions is allowed (Bible §56/§77 LOCKED). Only per-entry shape and per-answer
  -- dimension-uniqueness are enforced.
  for v_effect in select * from jsonb_array_elements(v_effects)
  loop
    if jsonb_typeof(v_effect -> 'dimension') <> 'string' then
      raise exception 'Malformed personality_effects entry: dimension must be a string.';
    end if;
    v_dimension := v_effect ->> 'dimension';

    if v_dimension not in (
      'planner_spontaneous', 'emotional_intensity', 'direct_indirect', 'social_attunement',
      'protective_hands_off', 'adventure_comfort', 'independent_collaborative', 'control_allowing',
      'practical_idealistic', 'sentimental_thick_skinned', 'rules_bending', 'conflict_peacekeeping',
      'trust_verify', 'forgiving_receipts', 'playful_serious', 'competitive_cooperative',
      'curious_decisive', 'private_open', 'patient_urgent', 'ambitious_content',
      'accountability_defensiveness', 'reflective_reactive', 'self_secure_reassurance',
      'boundary_holding_approval_seeking', 'vulnerable_armored', 'repair_punishing',
      'tactful_blunt', 'duty_first_self_preserving', 'supportive_challenging',
      'gives_freely_keeps_score', 'perspective_taking_self_referencing', 'initiating_responsive'
    ) then
      raise exception 'Unknown personality dimension: %', v_dimension;
    end if;

    if jsonb_typeof(v_effect -> 'value') <> 'number' then
      raise exception 'Malformed personality_effects entry: value must be a number.';
    end if;
    v_value := (v_effect ->> 'value')::numeric;
    -- Score magnitude limit (owner-locked): at most 3 points for any ONE pole, same
    -- PersonalityEffectValue range (-3|-2|-1|1|2|3) every other write path already enforces.
    if v_value not in (-3, -2, -1, 1, 2, 3) then
      raise exception 'Invalid personality effect value: %', v_value;
    end if;

    -- Duplicate-dimension prevention: an answer may support any NUMBER of distinct traits,
    -- but never two awards for the SAME trait -- matches personality_evidence's own
    -- unique(user_id, source_type, source_id, dimension) constraint and the admin editor's
    -- own client-side guard (handleAddEffect), enforced again here server-side.
    if v_dimension = any(v_seen_dimensions) then
      raise exception 'Duplicate personality dimension in personality_effects: %', v_dimension;
    end if;
    v_seen_dimensions := array_append(v_seen_dimensions, v_dimension);
  end loop;

  update public.daily_options
  set label = p_label,
      personality_effects = v_effects,
      apparently_feedback = p_apparently_feedback
  where id = p_option_id;

  if opt.parent_status in ('Approved', 'Scheduled') then
    update public.daily_questions
    set status = 'NeedsRevision', scheduled_for = null, approved_by = null, approved_at = null, approved_content_version = null
    where id = opt.question_id;
  end if;
end;
$$;

comment on function public.admin_update_daily_option(uuid, text, jsonb, text) is
  'Build 18: additive server-side validation of personality_effects (dimension allow-list, -3..3 value range, no duplicate dimension) -- NO count cap, matching the owner-locked removal of the client-side 3-trait-per-answer limit. Everything else (admin-only, Live/Archived immutability, Approved/Scheduled -> NeedsRevision invalidation) is unchanged from 20260913220000.';

-- Grants are unchanged by create or replace -- re-asserted here only for clarity/audit, not
-- because they would otherwise be lost.
revoke execute on function public.admin_update_daily_option(uuid, text, jsonb, text) from public;
revoke execute on function public.admin_update_daily_option(uuid, text, jsonb, text) from anon;
grant execute on function public.admin_update_daily_option(uuid, text, jsonb, text) to authenticated;
