// Client-invoked entitlement refresh. Requires a valid Supabase-authenticated JWT (enforced
// both by the platform -- this function is deployed WITH JWT verification on, see the deploy
// command in the engineering sprint report -- and defensively inside this function itself by
// deriving the user id from that verified JWT, never from anything the request body could
// claim). Calls RevenueCat's server API with the SECRET key and writes the normalized result
// into user_entitlements. Returns ONLY a safe, normalized status -- never the RevenueCat
// secret, never unrelated customer data.
//
// Invoke from the client after: a successful purchase, a successful Restore Purchases,
// app/session initialization, and returning to foreground when the cached state looks stale
// -- see src/services/purchases-service.ts.

import { createClient } from 'jsr:@supabase/supabase-js@2';

import { APPARENTLY_PRIVATE_ENTITLEMENT_ID, refreshUserEntitlement } from '../_shared/revenuecat.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verifies the JWT and derives the calling user's id FROM THE TOKEN ITSELF (Supabase's
    // own signature verification) -- this is the entire security boundary. The request body
    // is never consulted for identity; there is nothing a client could send here to claim to
    // be a different user.
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userResult, error: userError } = await callerClient.auth.getUser();
    if (userError || !userResult?.user) {
      return new Response(JSON.stringify({ error: 'Not authenticated.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = userResult.user.id;

    // service_role client for the actual write -- user_entitlements has zero client-writable
    // RLS policies, so only this key (never exposed to the client) can upsert into it.
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const state = await refreshUserEntitlement(adminClient, userId, APPARENTLY_PRIVATE_ENTITLEMENT_ID);

    return new Response(
      JSON.stringify({ entitlement: state.entitlementId, active: state.isActive, expiresAt: state.expiresAt }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('[sync-revenuecat-entitlement] failed:', error instanceof Error ? error.message : error);
    return new Response(JSON.stringify({ error: 'Could not refresh entitlement right now.' }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
