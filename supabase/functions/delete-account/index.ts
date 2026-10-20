// Build 18 Work Package 3: in-app account deletion (Apple App Store requirement for any app
// that supports account creation -- Apparently You's anonymous Supabase accounts qualify).
//
// SECURITY: identical pattern to sync-revenuecat-entitlement -- verifies the caller's JWT and
// derives userId FROM THE TOKEN ITSELF (Supabase's own signature verification), never from
// anything the request body claims. There is no "which account to delete" parameter at all --
// this function only ever deletes the CALLER's own account, which structurally prevents one
// user from deleting another user's data (there is nothing to pass that would let them try).
//
// WHY THIS DELETES EVERYTHING: every user-linked table in this schema (profiles,
// daily_answers, quiz_results, personality_evidence, personality_pole_evidence,
// quiz_shares/sharer_user_id, user_entitlements, tester_access_grants) was already defined
// with `user_id uuid references auth.users (id) on delete cascade` (confirmed by reading
// every CREATE TABLE in supabase/migrations/*.sql, not assumed). quiz_shares rows the user
// created cascade-delete their own compare_responses too (compare_responses.share_id
// references quiz_shares(id) on delete cascade), which both deletes those responses AND
// invalidates the share token (the row backing it no longer exists, so get_compare_result/
// any share-viewing path simply finds nothing). Deleting the single auth.users row via the
// Admin API therefore removes every one of those rows in one atomic Postgres operation --
// this function does not need to (and does not) run a manual per-table deletion sequence.
//
// WHAT THIS DOES NOT DELETE, documented rather than silently ignored:
// - The user's RevenueCat customer record and Apple subscription/purchase history. Apple
//   requires subscription/receipt data to remain with Apple and (for revenue reporting)
//   RevenueCat regardless of app-side account deletion; this function never attempts to
//   cancel an active subscription or erase RevenueCat's own records. The client is
//   responsible for telling the user this explicitly BEFORE they confirm deletion and for
//   pointing them to Apple's own subscription management (see src/app/settings.tsx).
// - Sentry/error-monitoring events already sent before deletion (if any quiz answer text or
//   other content ever reached a diagnostic event -- see docs/app-store/PRIVACY_POLICY_DRAFT
//   for the stated intent that it should not). Those live in a separate, third-party system
//   with its own retention policy; this function has no credential to reach into it.
// - Routine database backups taken before this deletion ran. A point-in-time restore of a
//   pre-deletion backup would still contain the row until that backup itself ages out of
//   retention. This is a standard, disclosed limitation of hard-deleting from a backed-up
//   database, not something this function can control from inside one request.

import { createClient } from 'jsr:@supabase/supabase-js@2';

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

    // Same identity boundary as sync-revenuecat-entitlement: the JWT is the only source of
    // truth for who is calling. No request-body field is ever read for identity, so there is
    // no "target user id" a client could substitute to delete someone else's account.
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

    // service_role key -- server-only, never sent to or readable by any client. Required for
    // auth.admin.deleteUser; there is no RLS-governed table path that could do this instead.
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Hard delete (default; no soft-delete flag passed) -- this is what actually fires every
    // ON DELETE CASCADE constraint described above. A failure here is a genuine failure: the
    // function returns a real error status and body, never a fabricated success.
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error('[delete-account] auth.admin.deleteUser failed:', deleteError.message);
      return new Response(JSON.stringify({ error: 'Could not delete your account right now. Please try again.' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[delete-account] failed:', error instanceof Error ? error.message : error);
    return new Response(JSON.stringify({ error: 'Could not delete your account right now. Please try again.' }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
