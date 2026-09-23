// RevenueCat webhook receiver. Deployed WITHOUT Supabase JWT verification (RevenueCat is not
// a Supabase-authenticated caller) -- protected instead by RevenueCat's own documented
// webhook pattern: a fixed Authorization header value, checked here against
// REVENUECAT_WEBHOOK_AUTH (server-only secret, never returned/logged). A missing or wrong
// header is rejected outright before anything else runs.
//
// SECURITY: this function deliberately does NOT trust the webhook payload's own entitlement
// data as final truth -- an attacker who somehow got a valid Authorization header could still
// only trigger a RE-QUERY of RevenueCat's own server for whatever app_user_id they named, not
// inject arbitrary entitlement values directly. This also avoids a real correctness bug: a
// CANCELLATION event fires the moment auto-renew is turned off, while the subscriber's actual
// access correctly remains active until the current period's expiration -- trusting the event
// payload naively would incorrectly revoke access early. Re-querying RevenueCat's own current
// state (the same refreshUserEntitlement flow sync-revenuecat-entitlement uses) is what keeps
// that distinction correct for every lifecycle event this function handles: INITIAL_PURCHASE,
// RENEWAL, UNCANCELLATION, CANCELLATION, EXPIRATION, BILLING_ISSUE, PRODUCT_CHANGE,
// SUBSCRIPTION_EXTENDED, TRANSFER, TEMPORARY_ENTITLEMENT_GRANT, and anything else RevenueCat
// ever adds -- the handler is intentionally type-agnostic (see below) rather than branching
// per event type, so a new event type this app has never heard of still degrades safely to
// "go look up what's actually true right now."
//
// Idempotent by construction: processing the same event any number of times just re-derives
// and re-upserts the same current state -- no counters, no side effects beyond that one row.

import { createClient } from 'jsr:@supabase/supabase-js@2';

import { APPARENTLY_PRIVATE_ENTITLEMENT_ID, refreshUserEntitlement } from '../_shared/revenuecat.ts';

type RevenueCatWebhookPayload = {
  event?: {
    type?: string;
    app_user_id?: string;
    // TRANSFER events carry the id(s) that lost/gained access in these arrays instead of a
    // single app_user_id -- handled below so a transfer refreshes every affected identity,
    // not just one.
    transferred_from?: string[];
    transferred_to?: string[];
  };
};

Deno.serve(async (req: Request) => {
  try {
    const configuredAuth = Deno.env.get('REVENUECAT_WEBHOOK_AUTH');
    const incomingAuth = req.headers.get('Authorization');
    if (!configuredAuth || !incomingAuth || incomingAuth !== configuredAuth) {
      // Never logs either value -- only that a mismatch occurred.
      console.warn('[revenuecat-webhook] rejected: missing or incorrect Authorization header.');
      return new Response(JSON.stringify({ error: 'Unauthorized.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const payload = (await req.json()) as RevenueCatWebhookPayload;
    const event = payload.event;
    if (!event) {
      return new Response(JSON.stringify({ error: 'Malformed payload.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const affectedAppUserIds = new Set<string>();
    if (event.app_user_id) affectedAppUserIds.add(event.app_user_id);
    for (const id of event.transferred_from ?? []) affectedAppUserIds.add(id);
    for (const id of event.transferred_to ?? []) affectedAppUserIds.add(id);

    if (affectedAppUserIds.size === 0) {
      // Nothing identifiable to refresh -- acknowledge so RevenueCat doesn't retry forever on
      // an event type this app has no identity to act on.
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    for (const appUserId of affectedAppUserIds) {
      try {
        await refreshUserEntitlement(adminClient, appUserId, APPARENTLY_PRIVATE_ENTITLEMENT_ID);
      } catch (perUserError) {
        // A RevenueCat app_user_id that doesn't correspond to a real auth.users row (a stale
        // test identity, a pre-appUserID-linking anonymous RevenueCat id, etc.) fails the
        // user_entitlements foreign key -- log and continue with any other affected id rather
        // than failing the whole webhook (and triggering RevenueCat retries) over one
        // unresolvable identity.
        console.warn(`[revenuecat-webhook] could not refresh entitlement for ${appUserId}:`, perUserError instanceof Error ? perUserError.message : perUserError);
      }
    }

    // Always 200 once auth passed and the payload was parseable -- RevenueCat expects a
    // prompt 200 to consider the event delivered; per-identity failures above are logged, not
    // surfaced as a delivery failure (which would just cause RevenueCat to retry the same
    // unresolvable id indefinitely).
    return new Response(JSON.stringify({ ok: true, refreshed: Array.from(affectedAppUserIds).length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[revenuecat-webhook] failed:', error instanceof Error ? error.message : error);
    return new Response(JSON.stringify({ error: 'Could not process webhook.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
