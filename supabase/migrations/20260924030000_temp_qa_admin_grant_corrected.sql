-- TEMPORARY, FOR LIVE QA ONLY. Corrects 20260924020000's target id (that one turned out to be
-- orphaned, see its own updated header comment) -- grants the disposable anonymous identity
-- whose session token was actually captured and used for this pass's live security QA
-- 'editor' admin_users membership. Revoked alongside it in the same final cleanup migration.

insert into public.admin_users (user_id, role)
values ('ee166978-c6bb-4edd-a0f1-b1b799f319e9'::uuid, 'editor')
on conflict (user_id) do nothing;
