-- ============================================================================================
-- STAGED, NOT YET APPLIED. Prepared per the Build 16 implementation task's age-eligibility
-- requirement -- do not run `supabase db push` (or any other apply step) against this file
-- until the product owner has explicitly reviewed and approved it. Nothing here has been
-- applied to the production database.
--
-- Scope: adds ONE nullable column to the existing profiles table, ONE trigger making that
-- column immutable once set, ONE read-only helper function, and extends submit_quiz_result
-- with an additional (not replacing) gate for the single quiz id that needs it. Nothing
-- existing is altered, dropped, or renamed. The 13+ app-wide floor is enforced entirely
-- client-side at onboarding (a user who says "under 13" never reaches ensureAnonymousSession
-- at all, so no session/profile is ever created for them -- there is nothing for this
-- migration to additionally gate for that floor). This migration's server-side enforcement is
-- specifically for the 18+ "Apparently Private Private" gate, which -- unlike the 13+ floor --
-- protects real content a 13-17 year old COULD otherwise reach via direct route/deep link/a
-- forged client request, so it needs real server enforcement, not just a client check.
-- ============================================================================================

-- =========================================================================================
-- 1. PROFILES -- additive column. NULL means "not yet established" -- every consumer below
--    (is_adult_eligible, the client's own isAdultEligible) treats null as NOT eligible
--    (fail closed), including for every existing pre-Build-16 account.
-- =========================================================================================

alter table public.profiles
  add column age_eligibility text;

alter table public.profiles
  add constraint profiles_age_eligibility_check check (age_eligibility in ('13to17', '18plus'));

comment on column public.profiles.age_eligibility is
  'Self-attested at onboarding (or, for a pre-Build-16 account, a retroactive one-time confirmation prompt) -- see src/data/age-eligibility.ts. Null until established; treated as NOT adult-eligible everywhere until then. Immutable once set -- see profiles_age_eligibility_immutable below. A user who self-identifies as under 13 is never represented by any row here at all -- see onboarding.tsx''s age gate, which never calls ensureAnonymousSession for that answer.';

-- =========================================================================================
-- 2. IMMUTABILITY -- once set, age_eligibility can never change, even via a raw client PATCH
--    that bypasses upsertAgeEligibility entirely (Postgres RLS is row-level; this is the
--    column-level backstop). Every OTHER profile field keeps updating exactly as before --
--    this only rejects a change to THIS column when it was already non-null.
-- =========================================================================================

create or replace function public.enforce_age_eligibility_immutable()
returns trigger
language plpgsql
as $$
begin
  if old.age_eligibility is not null and new.age_eligibility is distinct from old.age_eligibility then
    raise exception 'age_eligibility is immutable once set.';
  end if;
  return new;
end;
$$;

comment on function public.enforce_age_eligibility_immutable() is
  'BEFORE UPDATE trigger on profiles: rejects any attempt to change age_eligibility once it has been set to a non-null value. A client can never flip this after the fact, whether through upsertAgeEligibility, the generic profile-update path, or a raw PATCH against the table directly.';

create trigger profiles_age_eligibility_immutable
  before update on public.profiles
  for each row
  execute function public.enforce_age_eligibility_immutable();

-- =========================================================================================
-- 3. SERVER-SIDE READ HELPER -- same SECURITY DEFINER pattern has_active_entitlement/
--    has_tester_access already use (20260924010000_secure_entitlement_authorization.sql),
--    so submit_quiz_result's new check below reads it the same way it already reads those.
--    Fails closed: no row, or a null column, both resolve to false.
-- =========================================================================================

create or replace function public.is_adult_eligible(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select age_eligibility = '18plus' from public.profiles where user_id = p_user_id),
    false
  );
$$;

comment on function public.is_adult_eligible(uuid) is
  'True only when profiles.age_eligibility = ''18plus'' for this user. False (never null, never an error) for a missing row or a null/13to17 value -- fails closed. SECURITY DEFINER so submit_quiz_result can check it regardless of whose row it is, same pattern as has_active_entitlement/has_tester_access.';

revoke all on function public.is_adult_eligible(uuid) from public;
grant execute on function public.is_adult_eligible(uuid) to authenticated;

-- =========================================================================================
-- 4. SUBMIT_QUIZ_RESULT -- additive: ONE more gate, for the ONE quiz id that needs it
--    ('private-private-trouble', the sole 'Private Private. 😈' category quiz -- see
--    src/data/quizzes/private-private-trouble.ts / PrivateQuizCategory in
--    src/data/quizzes/types.ts). Every other line of this function is byte-for-byte
--    unchanged from 20261006010000_secure_premium_quiz_submission.sql, including the
--    existing premium-entitlement gate this check runs ALONGSIDE, never instead of -- a
--    subscriber who is 13-17 still fails this gate; an 18+ user with no subscription still
--    fails the existing premium gate. Both must pass.
-- =========================================================================================

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

  -- Server-authoritative premium gate (Build 13 audit fix) -- unchanged.
  if p_quiz_id in (
    'career-ambition-how-bad', 'career-ambition-proving', 'hidden-you-wrong',
    'life-match-dream-life', 'love-soulmates-ready', 'private-private-trouble',
    'style-vibe-intimidating'
  ) then
    if not (
      public.has_active_entitlement(v_user_id, 'apparently_private')
      or public.has_tester_access(v_user_id)
    ) then
      raise exception 'This quiz requires an active Apparently Private subscription.';
    end if;
  end if;

  -- Server-authoritative 18+ gate (Build 16) -- additive, runs ALONGSIDE the premium gate
  -- above, never instead of it. Only 'private-private-trouble' is in the 'Private Private. 😈'
  -- category; every other quiz (free, preview, and the other 6 premium quizzes) is completely
  -- untouched by this check.
  if p_quiz_id = 'private-private-trouble' then
    if not public.is_adult_eligible(v_user_id) then
      raise exception 'This content requires confirming you are 18 or older.';
    end if;
  end if;

  if p_profile_effects is not null and p_profile_effects <> 'null'::jsonb then
    if jsonb_typeof(p_profile_effects) <> 'array' then
      raise exception 'profile_effects must be a JSON array.';
    end if;

    select count(*) into v_effect_count from jsonb_array_elements(p_profile_effects);
    if v_effect_count > 6 then
      raise exception 'profile_effects may contain at most 6 entries.';
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
        'curious_decisive', 'private_open', 'patient_urgent', 'ambitious_content',
        'accountability_defensiveness', 'reflective_reactive', 'self_secure_reassurance',
        'boundary_holding_approval_seeking', 'vulnerable_armored', 'repair_punishing',
        'tactful_blunt', 'duty_first_self_preserving', 'supportive_challenging',
        'gives_freely_keeps_score', 'perspective_taking_self_referencing', 'initiating_responsive'
      ) then
        raise exception 'Unknown personality dimension: %', v_dimension;
      end if;

      if jsonb_typeof(v_effect -> 'value') <> 'number' then
        raise exception 'Malformed profile_effects entry: value must be a number.';
      end if;
      v_value := (v_effect ->> 'value')::integer;
      if v_value not in (-3, -2, -1, 1, 2, 3) then
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
  'Persists a completed quiz result and, ONLY on the first completion of a given (user, quiz_id), writes up to 6 personality_evidence rows from server-validated profile_effects. Build 16: additionally gates private-private-trouble on is_adult_eligible(), alongside (never instead of) the existing premium-entitlement gate -- both must pass. Idempotent on (user_id, quiz_id, completed_at). Everything else unchanged from 20261006010000.';
