-- TEMPORARY, FOR LIVE QA ONLY. Grants one disposable anonymous test identity 'editor'
-- admin_users membership so it can drive the real admin_grant_tester_access/
-- admin_revoke_tester_access RPCs as a genuine authenticated admin, proving those RPCs'
-- is_admin() gate and the tester-grant unlock path work end to end. Revoked (row deleted) by
-- a follow-up cleanup migration in this same pass -- see the engineering sprint report.
--
-- This specific target id turned out to be orphaned for live testing purposes -- an anonymous
-- Supabase session's access token is not persisted anywhere in this repo, so once the
-- throwaway Node process that created this id exited, it could never be signed back into.
-- The real QA session instead used a different, correctly-captured id -- see the follow-up
-- migration 20260924030000_temp_qa_admin_grant_corrected.sql. This row is still cleaned up
-- alongside everything else (see the final cleanup migration in this pass) even though it was
-- never actually exercised.

insert into public.admin_users (user_id, role)
values ('1ca21aa8-4d51-4aaa-890a-68a41e38d1b0'::uuid, 'editor')
on conflict (user_id) do nothing;
