-- NOT A SCHEMA CHANGE. One-time cleanup of every disposable identity created during this
-- pass's live security QA (never a real user/tester account), including the two temporary
-- admin_users grants from 20260924020000/20260924030000 (admin_users.user_id references
-- auth.users on delete cascade, so deleting these auth.users rows removes those grant rows
-- automatically -- no separate DELETE FROM admin_users needed) and the two synthetic
-- user_entitlements expiry fixtures from 20260924040000 (same cascade). Explicit-id-only,
-- safety-guarded exactly like every prior cleanup migration in this project.

do $$
declare
  v_ids uuid[] := array[
    '1ca21aa8-4d51-4aaa-890a-68a41e38d1b0'::uuid, -- orphaned first admin-grant attempt (never signed back into, harmless)
    'ee166978-c6bb-4edd-a0f1-b1b799f319e9'::uuid, -- the actual temp QA admin
    'dc02a2a2-ba64-4285-aa6d-16c49f2be0de'::uuid, -- tester-grant QA subject
    'ee60b428-f806-429e-9c71-a0e8966014e1'::uuid, -- plain (non-premium, non-tester) QA subject
    '8c821006-2b77-4079-83a0-ee938dc078e0'::uuid, -- future-expires_at entitlement fixture
    'bc8f51db-9c07-487d-a926-cd9ca081375a'::uuid, -- past-expires_at entitlement fixture
    '5c9a2768-1b62-4d98-af7e-e2302d853caa'::uuid, -- sync-revenuecat-entitlement Edge Function QA
    '55aca2ec-51d5-4861-b355-1bac0e25afd9'::uuid, -- user_entitlements write/RLS verification (owner)
    '424e30fd-d3cf-4b8f-8bdf-3120352bfc6d'::uuid  -- user_entitlements RLS verification (other user, cross-read check)
  ];
  v_found_count int;
  v_non_anonymous_count int;
  v_deleted_count int;
begin
  select count(*) into v_found_count from auth.users where id = any(v_ids);
  select count(*) into v_non_anonymous_count from auth.users where id = any(v_ids) and coalesce(is_anonymous, false) = false;

  if v_non_anonymous_count > 0 then
    raise exception 'Safety abort: % of the listed ids resolve to a NON-anonymous user -- refusing to delete anything.', v_non_anonymous_count;
  end if;

  delete from auth.users where id = any(v_ids) and coalesce(is_anonymous, false) = true;
  get diagnostics v_deleted_count = row_count;

  raise notice 'Secure-entitlement QA disposable identity cleanup: % of % listed ids existed and were confirmed anonymous; % deleted (cascades to admin_users/user_entitlements/tester_access_grants rows).', v_found_count, array_length(v_ids, 1), v_deleted_count;
end $$;
