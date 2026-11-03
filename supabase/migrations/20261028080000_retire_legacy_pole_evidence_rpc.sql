-- ============================================================================================
-- STAGED, NOT APPLIED. Requires explicit owner authorization before `supabase db push`.
-- GATED: do not apply until the client cutover (see this engagement's final report) is
-- verified against a real TestFlight build -- revoking before the client stops calling this
-- function would silently stop all V2 evidence writes for anyone still on the old build.
--
-- URGENT FINDING (Build 22 audit, 2026-10-28, corrected 2026-10-30): submit_quiz_pole_evidence
-- (20261018010000) and the table it reads, quiz_choice_pole_awards, are BOTH currently applied
-- and callable in production RIGHT NOW. Confirmed directly: quiz_choice_pole_awards already
-- holds 468 live rows for the 9 held Apparently Private quizzes (the original, never-reviewed
-- 2026-10-19 seed). src/app/quiz/[quizId].tsx calls submitQuizPoleEvidence unconditionally for
-- every quiz, regardless of access level.
--
-- CORRECTION (2026-10-30): the first version of this migration revoked execute from
-- `authenticated` only. Live privilege check confirmed this was insufficient --
-- information_schema.routine_privileges shows BOTH anon and authenticated (and service_role,
-- postgres, neither of which should ever be revoked) currently hold EXECUTE. PUBLIC itself is
-- NOT separately granted (Postgres's PUBLIC pseudo-role grant is distinct from anon/
-- authenticated, which are real roles each holding their own explicit grant) -- revoking from
-- PUBLIC in addition is harmless defense-in-depth even though it holds no grant today.
--
-- Does not drop the function or the table -- personality_pole_evidence holds real historical
-- user evidence; dropping anything here would destroy real historical data, which this plan
-- does not do. Revoking execute simply makes the function uncallable going forward.
-- quiz_choice_pole_awards' stale Private rows are left in place (harmless once nothing can
-- write through the revoked RPC) rather than deleted -- a separate, optional cleanup.
-- ============================================================================================

revoke execute on function public.submit_quiz_pole_evidence(text, uuid, jsonb) from public;
revoke execute on function public.submit_quiz_pole_evidence(text, uuid, jsonb) from anon;
revoke execute on function public.submit_quiz_pole_evidence(text, uuid, jsonb) from authenticated;

comment on function public.submit_quiz_pole_evidence is
  'RETIRED (Build 22) -- execute revoked from public, anon, and authenticated (confirmed via information_schema.routine_privileges which of these actually held it live before revoking). Superseded by submit_quiz_completion (20261028040000). Left in place, uncallable, as a historical record -- never dropped. Apply ONLY after the client cutover (standard quiz screen, What''s Your Type, pending-submission retries) is verified against a real TestFlight build -- revoking first would silently stop V2 evidence writes for any client still on the old build.';
