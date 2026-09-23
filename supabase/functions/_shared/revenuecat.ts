// Shared between sync-revenuecat-entitlement and revenuecat-webhook -- the ONE place either
// Edge Function talks to RevenueCat's server REST API or writes to user_entitlements. Both
// functions end up doing the exact same thing ("re-query this app_user_id's CURRENT state
// from RevenueCat, normalize it, upsert it") -- the webhook deliberately never trusts its own
// payload as final truth (see revenuecat-webhook/index.ts's own header comment), so it calls
// the SAME refresh path sync-revenuecat-entitlement uses rather than a second interpretation.

export const APPARENTLY_PRIVATE_ENTITLEMENT_ID = 'apparently_private';

const REVENUECAT_API_BASE = 'https://api.revenuecat.com/v1';

export type NormalizedEntitlementState = {
  entitlementId: string;
  isActive: boolean;
  expiresAt: string | null;
  productId: string | null;
  environment: string | null;
};

// RevenueCat's v1 GET /subscribers/{app_user_id} response shape -- only the fields this
// function actually reads. https://www.revenuecat.com/docs/api-v1#tag/customers
type RevenueCatSubscriberResponse = {
  subscriber?: {
    entitlements?: Record<
      string,
      {
        expires_date: string | null;
        product_identifier: string;
        grace_period_expires_date?: string | null;
      }
    >;
    subscriptions?: Record<string, { store?: string }>;
  };
};

export class RevenueCatFetchError extends Error {}

// Fetches the CURRENT subscriber state directly from RevenueCat's server API using the
// SECRET key (REVENUECAT_SECRET_API_KEY -- server-only, never sent to or readable by any
// client). appUserId is the Supabase auth.uid() the RevenueCat SDK was configured with (see
// purchases-service.ts's own identity-strategy comment) -- the SAME id both this function and
// the client agree on, so this always resolves to the correct customer.
export const fetchRevenueCatEntitlementState = async (
  appUserId: string,
  entitlementId: string,
): Promise<NormalizedEntitlementState> => {
  const secretKey = Deno.env.get('REVENUECAT_SECRET_API_KEY');
  if (!secretKey) {
    throw new RevenueCatFetchError('REVENUECAT_SECRET_API_KEY is not configured.');
  }

  const response = await fetch(`${REVENUECAT_API_BASE}/subscribers/${encodeURIComponent(appUserId)}`, {
    headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    // A brand-new appUserID RevenueCat has never seen (e.g. this device never actually
    // purchased anything) can 404 -- that's a real, honest "no entitlement," not an error.
    if (response.status === 404) {
      return { entitlementId, isActive: false, expiresAt: null, productId: null, environment: null };
    }
    throw new RevenueCatFetchError(`RevenueCat API returned ${response.status}`);
  }

  const body = (await response.json()) as RevenueCatSubscriberResponse;
  const entitlement = body.subscriber?.entitlements?.[entitlementId];

  if (!entitlement) {
    return { entitlementId, isActive: false, expiresAt: null, productId: null, environment: null };
  }

  const expiresAt = entitlement.expires_date ?? null;
  // Active iff there's no expiration (non-expiring/lifetime entitlement -- not applicable to
  // this monthly subscription today, but handled correctly regardless) OR the expiration is
  // still in the future. A grace period is intentionally NOT treated as active here -- RevenueCat
  // surfaces that via its own grace_period_expires_date, and this app has not been asked to
  // implement grace-period-specific product behavior; billing issues resolve to "inactive"
  // until RevenueCat itself reports a real expires_date in the future again (e.g. on
  // successful retry), which the next sync/webhook-triggered refresh will pick up.
  const isActive = expiresAt === null || new Date(expiresAt).getTime() > Date.now();
  const store = body.subscriber?.subscriptions?.[entitlement.product_identifier]?.store ?? null;

  return {
    entitlementId,
    isActive,
    expiresAt,
    productId: entitlement.product_identifier,
    environment: store,
  };
};

// Writes the normalized state using the caller's own Supabase client -- expected to be a
// service_role client (see both functions' own setup), since user_entitlements has zero
// client-writable RLS policies by design.
export const upsertUserEntitlement = async (
  // Typed loosely (not importing @supabase/supabase-js's SupabaseClient type here) to avoid
  // coupling this shared module to one specific client-library import path between the two
  // functions -- both already construct their own client and just need `.from(...).upsert(...)`.
  supabaseAdmin: { from: (table: string) => { upsert: (row: unknown, opts: unknown) => Promise<{ error: { message: string } | null }> } },
  userId: string,
  state: NormalizedEntitlementState,
): Promise<void> => {
  const { error } = await supabaseAdmin.from('user_entitlements').upsert(
    {
      user_id: userId,
      entitlement_id: state.entitlementId,
      is_active: state.isActive,
      expires_at: state.expiresAt,
      product_id: state.productId,
      environment: state.environment,
      last_verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,entitlement_id' },
  );
  if (error) {
    throw new RevenueCatFetchError(`Failed to upsert user_entitlements: ${error.message}`);
  }
};

// The one shared "refresh this user's entitlement from RevenueCat's real current state" flow
// -- used by BOTH Edge Functions, so there is exactly one interpretation of RevenueCat data
// anywhere in this system.
export const refreshUserEntitlement = async (
  supabaseAdmin: Parameters<typeof upsertUserEntitlement>[0],
  userId: string,
  entitlementId: string = APPARENTLY_PRIVATE_ENTITLEMENT_ID,
): Promise<NormalizedEntitlementState> => {
  const state = await fetchRevenueCatEntitlementState(userId, entitlementId);
  await upsertUserEntitlement(supabaseAdmin, userId, state);
  return state;
};
