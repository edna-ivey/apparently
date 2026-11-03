# Manual Operations

Files in this directory are **structurally excluded** from `supabase db push`, `supabase
migration list`, and `supabase db diff` — the Supabase CLI only ever scans
`supabase/migrations/*.sql` for migrations to apply or track; it never looks at this directory
at all. This is a hard, mechanical guarantee, not an informational convention —
`scripts/verify-reset-isolation.ts` proves it by inspecting the filesystem directly.

Placing a file here is the correct choice for a database change that is:

- **Destructive or one-time**, not a repeatable, forward-only schema migration.
- **Not meant to be part of a normal deployment push**, even by accident.
- Something that must be applied **manually and deliberately** — via `psql`, the Supabase SQL
  editor, or `supabase db execute <file>` targeted at this exact file — never via `supabase db
  push`, which cannot see it.

## Applying a file from this directory

1. Read the file's own header comment in full — it documents exactly what it does, what it
   preserves, its backup/rollback strategy, and any migrations it depends on being live first.
2. Rehearse it first against an isolated environment with representative data (see this
   engagement's `scripts/pglite-harness/*rehearsal*.mjs` for the pattern).
3. Get explicit, separate owner authorization — a file here being "ready" is never itself that
   authorization.
4. Apply it manually (`psql`, the SQL editor, or `supabase db execute`) against the real
   project, never through `supabase db push`.
5. Run the file's own post-apply verification queries before considering the operation done.

## Current contents

- `20261102030000_clean_v1_prelaunch_data_reset.sql` — the one-time clean V1 prelaunch data
  reset (Build 22 final cleanup). See `docs/BUILD_22_V1_RESET_INVENTORY.md` for the full
  inventory and `scripts/pglite-harness/run-clean-v1-reset-rehearsal-test.mjs` for its local
  rehearsal proof.
