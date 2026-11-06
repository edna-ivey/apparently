# Production account deletion deployment report
Date: October 21, 2026
Project: apparently-you (rjslgjxlpsjljbrlxfet)
Owner authorization: user explicitly approved production account-deletion backend deployment in conversation.

## Applied successfully
1. SQL content of local 20261020010000_daily_option_effects_validation.sql applied through Supabase migration API as daily_option_effects_validation. Remote generated migration version: 20261021133214.
2. SQL content of local 20261021010000_admin_attribution_fk_set_null_on_delete.sql applied as admin_attribution_fk_set_null_on_delete. Remote generated migration version: 20261021133217.
3. Edge Function delete-account deployed as ACTIVE version 1 with verify_jwt=true.

## Verification
- Remote migration list confirms both newly applied migrations.
- Remote Edge Function list confirms delete-account ACTIVE and verify_jwt=true.
- pg_constraint check confirms ON DELETE SET NULL for daily_questions.approved_by and tester_access_grants.granted_by.
- No existing user account was deleted. No authenticated end-to-end delete test was performed.
- Local migration filenames use 20261020010000 and 20261021010000 while Supabase migration API generated new remote versions 20261021133214 and 20261021133217. Reconcile local/remote migration history before running Supabase CLI db push, or the same DDL may be attempted twice. Do not blindly apply these two local migration files again.

## Outstanding tests
- Test in Settings with a new disposable anonymous account and verify account deletion removes auth user and associated rows.
- Verify expired or invalid JWT returns 401, and no request body can select another user's account.
- Verify an account with active Apple subscription sees clear warning; subscription remains managed through Apple.
- Verify share tokens stop resolving after owner deletion and client local state resets.
- Verify diagnostics and backup retention wording for privacy policy.
- App Store privacy, terms and support public URLs still returned HTTP 404 at last check; separate deployment required.

## Rollback
The Edge Function may be removed or redeployed if necessary. Migration 1 replaces the admin_update_daily_option RPC, so rollback would require restoring its prior function definition; migration 2 changes foreign-key delete behavior and could be reversed only with a separately reviewed migration. Do not reverse without verifying impact on live data.
