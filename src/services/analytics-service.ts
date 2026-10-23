// The one client-side entry point for every advertising/notification analytics event this
// launch work emits -- see supabase/migrations/20261022010000_analytics_events.sql for the
// server-side allow-list these event names must exactly match. No third-party analytics SDK
// exists in this app (owner-confirmed decision); this writes to this app's own first-party
// analytics_events table via the log_analytics_event RPC, which derives the user id from the
// caller's own session server-side -- never trusts a client-submitted id.
//
// PRIVACY RULE (enforced by convention here, not re-checked server-side -- see the migration's
// own comment): properties must NEVER contain quiz answer text, personality trait/pole values,
// Private content, or anything else this app's own Privacy Policy promises not to collect for
// this purpose. Every event type below has a narrow, explicit properties shape for exactly
// this reason -- never pass an arbitrary object through.

import { supabase } from '@/lib/supabase';

export type AdPlacementName = 'quiz_interstitial' | 'explore_native' | 'daily_interstitial';

export type AnalyticsEvent =
  | { name: 'ad_eligible'; properties: { placement: AdPlacementName } }
  | { name: 'ad_request'; properties: { placement: AdPlacementName; ad_unit_id: string } }
  | { name: 'ad_loaded'; properties: { placement: AdPlacementName; load_time_ms: number } }
  | { name: 'ad_impression'; properties: { placement: AdPlacementName } }
  | { name: 'ad_revenue_paid'; properties: { placement: AdPlacementName; estimated_revenue_micros: number; currency_code: string; precision: string } }
  | { name: 'ad_dismissed'; properties: { placement: AdPlacementName } }
  | { name: 'ad_failed'; properties: { placement: AdPlacementName; error_code: string } }
  | { name: 'quiz_completed'; properties: { quiz_id: string } }
  | { name: 'result_revealed'; properties: { quiz_id: string; ad_shown: boolean } }
  | { name: 'ad_placement_variant'; properties: { placement: AdPlacementName; variant: 'pre-reveal' | 'mid-quiz' } }
  | { name: 'notification_permission_requested'; properties: Record<string, never> }
  | { name: 'notification_permission_granted'; properties: Record<string, never> }
  | { name: 'notification_permission_denied'; properties: Record<string, never> }
  | { name: 'notification_scheduled'; properties: { category: NotificationCategory } }
  | { name: 'notification_sent'; properties: { category: NotificationCategory } }
  | { name: 'notification_opened'; properties: { category: NotificationCategory } }
  | { name: 'notification_preference_changed'; properties: { category: NotificationCategory; enabled: boolean } };

export type NotificationCategory = 'daily_reminder' | 'friend_activity' | 'creature_evolution' | 'new_quizzes' | 'private_updates';

// Fire-and-forget, never throws, never blocks the caller's own UI -- an analytics write
// failing must never be the reason an ad doesn't show or a notification doesn't schedule. Logs
// to the dev console only in development; production failures are simply swallowed (this is
// non-critical telemetry, not a correctness-critical path -- see reportBackendFailure in
// observability.ts for the DIFFERENT category of failure this app does escalate to Sentry).
export const logAnalyticsEvent = (event: AnalyticsEvent): void => {
  if (!supabase) {
    return;
  }
  void supabase.rpc('log_analytics_event', { p_event_name: event.name, p_properties: event.properties }).then(({ error }) => {
    if (error && __DEV__) {
      console.warn(`[analytics-service] log_analytics_event(${event.name}) failed:`, error.message);
    }
  });
};
