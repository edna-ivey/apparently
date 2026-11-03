#!/bin/bash
# V1 release execution (2026-11-03). The exact, exception-safe execution mechanism for pushing
# ONLY the 21-file engineering candidate set -- never the 1 gated + 4 independent migrations
# that also happen to be pending. `supabase db push` has no per-file selection flag (confirmed:
# `supabase db push --help` offers only --include-all/--dry-run, nothing scoped to specific
# files) -- the only real, CLI-enforced restriction is physically removing the other 5 files
# from supabase/migrations/ before running it, exactly like the already-proven pattern for the
# destructive reset (supabase/manual_operations/). This script does that move, runs the push,
# and restores the 5 files in a `trap` that fires on ANY exit path -- success, failure, or a
# manual interrupt -- so a crash mid-push can never silently leave the gated/independent
# migrations permanently missing from the working tree.
#
# This script does NOT run automatically and is NOT invoked by anything else. It requires
# explicit owner authorization before each real run. Defaults to --dry-run; pass --apply (and
# only after that authorization) to actually push.
#
# Usage: ./scripts/safe-migration-push.sh [--apply]

set -euo pipefail

cd "$(dirname "$0")/.."

MODE="dry-run"
if [ "${1:-}" = "--apply" ]; then
  MODE="apply"
fi

HOLDOUT_DIR="$(mktemp -d /tmp/migration-safety-holdout.XXXXXX)"
EXCLUDED_FILES=(
  "20261028080000_retire_legacy_pole_evidence_rpc.sql"
  "20261022010000_analytics_events.sql"
  "20261022020000_push_notifications_schema.sql"
  "20261022030000_creature_evolution_notification.sql"
  "20261022040000_schedule_push_notification_sends.sql"
)

restore_excluded_files() {
  local status=$?
  echo ""
  echo "Restoring the ${#EXCLUDED_FILES[@]} temporarily-excluded migration files to supabase/migrations/ ..."
  for f in "${EXCLUDED_FILES[@]}"; do
    if [ -f "$HOLDOUT_DIR/$f" ]; then
      mv "$HOLDOUT_DIR/$f" "supabase/migrations/$f"
      echo "  restored: $f"
    fi
  done
  rmdir "$HOLDOUT_DIR" 2>/dev/null || true
  if [ $status -ne 0 ]; then
    echo "safe-migration-push.sh exited with status $status -- files were restored regardless. Nothing was left excluded." >&2
  fi
  exit $status
}
trap restore_excluded_files EXIT

echo "Moving ${#EXCLUDED_FILES[@]} gated/independent migrations out of supabase/migrations/ (to $HOLDOUT_DIR) ..."
for f in "${EXCLUDED_FILES[@]}"; do
  if [ ! -f "supabase/migrations/$f" ]; then
    echo "ERROR: expected file not found: supabase/migrations/$f -- aborting before moving anything else." >&2
    exit 1
  fi
done
for f in "${EXCLUDED_FILES[@]}"; do
  mv "supabase/migrations/$f" "$HOLDOUT_DIR/$f"
done

echo ""
echo "Verifying the real linked-project dry-run now shows ONLY the 21-file candidate set ..."
DRYRUN_OUTPUT=$(npx supabase db push --linked --dry-run 2>&1)
echo "$DRYRUN_OUTPUT" | grep "•" || true
PENDING_COUNT=$(echo "$DRYRUN_OUTPUT" | grep -c "•" || true)
if [ "$PENDING_COUNT" != "21" ]; then
  echo "ERROR: expected exactly 21 pending migrations with the 5 files excluded, found $PENDING_COUNT. Aborting -- not pushing anything." >&2
  exit 1
fi
echo "Confirmed: exactly 21 pending migrations, matching the approved candidate set."

if [ "$MODE" = "dry-run" ]; then
  echo ""
  echo "DRY RUN ONLY (default). Re-run with --apply, after explicit owner authorization, to actually push."
  exit 0
fi

echo ""
echo "APPLYING: supabase db push --linked (the 5 gated/independent files are physically absent, so this can only apply the 21 approved files) ..."
npx supabase db push --linked
echo "Push complete."
