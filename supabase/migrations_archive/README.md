# Archived, superseded, never-applied migrations

These files were never applied to any database (confirmed via `supabase migration list
--linked` before archiving) and are superseded by later Build 22 work. Moved out of
`supabase/migrations/` on 2026-10-30 per owner audit: a comment saying "SUPERSEDED" inside a
migration file does not stop the Supabase CLI from applying it on an unrestricted
`supabase db push` -- only actually removing it from the active migrations directory does.

Kept here, not deleted, for historical record and because some Build 22 generator scripts
read them as their data source (see each file below):

- `20261021160000_daily_live_content_pole_awards.sql` -- hand-authored Daily option trait
  awards (string-keyed). Source for `scripts/lib/daily-pole-award-rows.ts`.
- `20261026170000_reconcile_quiz_choice_pole_awards.sql` -- the combined, string-keyed quiz
  calibration (1,694 rows). Source for `scripts/lib/quiz-pole-award-rows.ts`.
- `20261027180000_reconcile_free_quiz_choice_pole_awards.sql` -- an earlier, string-keyed,
  free-quiz-only reconciliation. Fully superseded by the numeric
  `20261028020000_quiz_content_identity.sql`; kept only for historical record, nothing reads
  it.
- `20261027190000_pole_evidence_correction_timestamp.sql` -- a column addition to the
  (never-applied) string-keyed `personality_pole_evidence` design. Superseded by
  `user_trait_evidence.last_corrected_at`, which already exists in
  `20261028040000_user_quiz_evidence_schema.sql`. Kept only for historical record.

Do not move these back into `supabase/migrations/`. Do not delete them -- the two generator
scripts above will fail loudly (not silently) if they go missing, since both read them by
relative path from this exact location.
