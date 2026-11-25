-- Build 11 §17 "MICHELLE'S EXISTING BUILD 10 DATA" backfill. Deterministically recalculates
-- the three personality_evidence rows that were each a rank-#1 Private award under the OLD flat
-- ±2 model and must become ±3 under the new LOCKED 3/2/1 ranked model -- derived by running her
-- real stored quiz_results.answers through the real (now-updated) applyPermanentQuizAwards, not
-- guessed (see scripts/recalculate-michelle-private-evidence.ts, which independently reproduces
-- this exact result from her raw answers and matches what's hand-verified below).
--
-- Scope: ONLY the 3 rows that were each their quiz's rank-#1 qualifying Private trait (the only
-- rank whose award magnitude changed, 2 -> 3). Rank-#2 awards (duty_first_self_preserving from
-- life-match-dream-life, supportive_challenging from style-vibe-intimidating) stay at ±2 under
-- BOTH models and are correctly left untouched. No row is inserted, deleted, or duplicated --
-- this is a pure in-place UPDATE of 3 existing rows' `effect` column, idempotent via the WHERE
-- clause's `effect = 2` guard (a second run finds effect already = 3 and updates 0 rows).
--
-- This migration intentionally touches ONE specific, named user (identified as the only account
-- with completions of all 7 premium Private quizzes -- confirmed via `select quiz_id, count(*)
-- ... group by user_id order by count(*) desc` against the live DB, 2026-10-04) rather than
-- attempting a general recalculation of every historical quiz_result in the table. A general
-- backfill is NOT attempted here because it would require re-deriving ranks for every user's
-- every historical Private quiz completion from their stored answers, which is safe in
-- principle (the same deterministic function) but out of this pass's explicitly scoped "fix
-- Michelle's real data so Build 11 can ship" mandate -- see the Build 11 task's own "Michelle
-- should NOT be forced to retake all seven" instruction, which this satisfies without touching
-- any other user's history.

update public.personality_evidence
set effect = 3
where user_id = 'a857b23b-7dd8-4e55-91e4-8ae0a76742aa'
  and source_type = 'quiz_result'
  and effect = 2
  and (
    (source_id = '7d2e0238-0c8a-4ba4-8253-82147f63e35f' and dimension = 'self_secure_reassurance') or  -- life-match-dream-life rank #1
    (source_id = '1d182824-7522-48b6-93aa-042cd119f600' and dimension = 'self_secure_reassurance') or  -- career-ambition-proving rank #1
    (source_id = '12cff32d-a80b-4712-9488-64c87a3e1f0a' and dimension = 'tactful_blunt')                -- style-vibe-intimidating rank #1
  );
