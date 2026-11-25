-- ============================================================================================
-- SUPERSEDED (Build 22, 2026-10-28). Never applied. personality_pole_evidence itself is
-- replaced by user_trait_evidence (20261028040000_user_quiz_evidence_schema.sql), which
-- includes created_at/last_corrected_at from the start -- this column addition has nothing
-- left to add a column to. Kept for historical record only -- do not apply this file.
-- ============================================================================================
--
-- STAGED, NOT APPLIED. Requires explicit owner authorization before `supabase db push`.
--
-- Build 22 correctness requirement (docs/BUILD22_UNIFIED_SCORING_EVOLUTION_PLAN_2026-10-27.md
-- Revision 6): historical evidence timestamps and correction/backfill timestamps must stay
-- separate. personality_pole_evidence.created_at must hold the REAL original observation time
-- (the quiz completion's completed_at, or the Daily answer's created_at) -- required for the
-- Friday-evolution cycle-cutoff filter to work at all (a cycle only ever reads evidence with
-- created_at <= that cycle's cutoff; stamping a backfilled row with "now" would make years-old
-- evidence look brand new and corrupt every future cutoff comparison). That leaves no column
-- recording when a backfill/correction script actually ran -- this migration adds exactly one,
-- purely additive, nullable column for that.
--
-- Semantics: NULL means this row's values are exactly what was recorded at submission time,
-- never touched since (every row the live trigger/RPC writes). A non-null value means a
-- backfill or mapping-correction script wrote or updated this row at that timestamp -- the
-- row's created_at still reflects the real original observation, this column records when the
-- correction itself happened.
-- ============================================================================================

alter table public.personality_pole_evidence
  add column last_corrected_at timestamptz;

comment on column public.personality_pole_evidence.last_corrected_at is
  'NULL for every row written by the live submission path (quiz/Daily), never touched since. Set to a backfill or mapping-correction script''s own run time when one writes or updates this row -- created_at always stays the real original observation time regardless; this column is the separate audit trail for when a correction happened, per the Build 22 unified-scoring plan.';
