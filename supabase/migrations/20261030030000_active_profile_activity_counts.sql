-- ============================================================================================
-- STAGED, NOT APPLIED. Requires explicit owner authorization before `supabase db push`.
--
-- Build 22 owner audit (2026-10-30), item 5: "Correct activity counts and active history."
-- Two real defects in the You page's activity counts, both fixed here:
--
-- 1. dailyAnswerCount was derived from the LEGACY personality_evidence table (one row per
--    personality effect, written by the OLD V1 Daily trigger) instead of the authoritative
--    daily_answers table the numeric V2 model actually scores from. In practice this mostly
--    agreed with reality, but ties the You page's activity count to a table this engagement
--    is actively retiring in spirit (see 20261028080000's gated retirement of the legacy pole-
--    evidence RPC) rather than to the real submitted occurrence record.
-- 2. quizCompletionCount/profileAnswerCount had NO 12-month active window at all -- every
--    quiz ever completed, lifetime, counted toward the 8-answer First Form / 50-answer mixed-
--    Creature thresholds forever. The Bible's 12-MONTH ACTIVE EVIDENCE WINDOW section is
--    explicit: "Active quiz-result history also drops results from the current app
--    experience after 12 months" -- the SAME locked rule the active trait-evidence window
--    (20261030010000) already implements for Signature/Relic ranking, just never applied to
--    these activity counts.
--
-- Both fixes below respect EXISTING rules, inventing nothing new:
--   - ROOM_ONLY exclusion: get_my_active_daily_answer_count() filters to daily_mode = 'profile'
--     -- the exact same condition that already gates personality_evidence/user_trait_evidence
--     creation for Dailies (20260918010000, 20261028050000). A profile-mode Daily with a
--     genuine content gap (no trait-award mapping yet) still counts here, same as it already
--     correctly would have under the old personality_evidence-based count -- this is counting
--     SUBMITTED ANSWERS, never re-deriving eligibility from whether scoring happened to
--     succeed.
--   - "Retake never renews first-completion credit": get_my_active_quiz_completions() filters
--     on user_quiz_completions.completed_at, which is set EXACTLY ONCE at first completion and
--     never updated (INSERT ... ON CONFLICT DO NOTHING, no UPDATE path exists on this table at
--     all) -- a retake can change quiz_results history but can never move this timestamp, so
--     it can never pull an already-inactive quiz back into the active window either.
--   - "UNLOCKS DO NOT RELOCK" (Bible, same section): untouched by this migration -- You's own
--     persisted evolutionState.mixedSnapshot (src/data/creature/creature-reveal-state.ts)
--     already gates display of an ALREADY-revealed Creature independently of any live
--     threshold recheck; these two functions only ever feed the pre-reveal ELIGIBILITY check.
--
-- Both are intentionally lean (return at most ~tens of rows, never full history) so the normal
-- You-page read path can stop fetching the user's entire quiz_results history (every retake,
-- forever) merely to recompute activity counts client-side -- see this migration's client-side
-- companion changes in personality-service.ts/you.tsx/creature-read.tsx.
-- ============================================================================================

create or replace function public.get_my_active_daily_answer_count()
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::integer
  from public.daily_answers da
  join public.daily_questions dq on dq.id = da.question_id
  where da.user_id = auth.uid()
    and dq.daily_mode = 'profile'
    and da.created_at >= now() - interval '12 months';
$$;

comment on function public.get_my_active_daily_answer_count() is
  'Count of the caller''s OWN profile-mode (never room_only) daily_answers rows with created_at within the trailing 12 months -- the authoritative, active-windowed replacement for counting source_type=''daily_answer'' rows in the legacy personality_evidence table. SECURITY DEFINER so RLS never needs a cross-table policy; auth.uid() scoping is the real boundary, same pattern as get_my_commonality/is_adult_eligible.';

revoke all on function public.get_my_active_daily_answer_count() from public;
revoke all on function public.get_my_active_daily_answer_count() from anon;
grant execute on function public.get_my_active_daily_answer_count() to authenticated;

create or replace function public.get_my_active_quiz_completions()
returns table (quiz_key text, question_count integer)
language sql
security definer
set search_path = public
stable
as $$
  select qz.quiz_key, qr.question_count
  from public.user_quiz_completions uqc
  join public.quizzes qz on qz.quiz_id = uqc.quiz_id
  join public.quiz_results qr on qr.id = uqc.quiz_result_id
  where uqc.user_id = auth.uid()
    and uqc.completed_at >= now() - interval '12 months';
$$;

comment on function public.get_my_active_quiz_completions() is
  'One row per quiz the caller has EVER completed whose first-completion user_quiz_completions.completed_at falls within the trailing 12 months -- never a row per retake (user_quiz_completions is already the atomic, retake-proof first-completion gate). question_count is read from that SAME first-completion''s own quiz_results row, never recomputed. A quiz whose first completion has aged out of the window is correctly absent here even if it was later retaken (completed_at is immutable -- a retake can never renew it back into the window). SECURITY DEFINER, auth.uid()-scoped, same pattern as get_my_active_daily_answer_count().';

revoke all on function public.get_my_active_quiz_completions() from public;
revoke all on function public.get_my_active_quiz_completions() from anon;
grant execute on function public.get_my_active_quiz_completions() to authenticated;
