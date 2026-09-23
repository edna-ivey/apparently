-- TEMPORARY, FOR LIVE QA ONLY. Two synthetic user_entitlements rows, inserted directly
-- (bypassing the normal Edge-Function-only write path, which is exactly what a migration
-- running with elevated privileges is allowed to do -- this is the same trust level as the
-- service_role key the Edge Functions themselves use) to prove has_active_entitlement's
-- future-vs-past expires_at logic without needing a real RevenueCat purchase, which requires
-- Michelle's physical device. Both rows (and the disposable identities they belong to) are
-- removed in this pass's final cleanup migration.

insert into public.user_entitlements (user_id, entitlement_id, is_active, expires_at, product_id, environment, last_verified_at, updated_at)
values
  ('8c821006-2b77-4079-83a0-ee938dc078e0'::uuid, 'apparently_private', true, now() + interval '1 day', 'apparently_private_monthly', 'sandbox', now(), now()),
  ('bc8f51db-9c07-487d-a926-cd9ca081375a'::uuid, 'apparently_private', true, now() - interval '1 day', 'apparently_private_monthly', 'sandbox', now(), now())
on conflict (user_id, entitlement_id) do update set
  is_active = excluded.is_active,
  expires_at = excluded.expires_at,
  product_id = excluded.product_id,
  environment = excluded.environment,
  last_verified_at = excluded.last_verified_at,
  updated_at = excluded.updated_at;
