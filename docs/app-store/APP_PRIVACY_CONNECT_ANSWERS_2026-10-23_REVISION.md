# Apparently You | App Store Connect App Privacy questionnaire — REVISION, NOT CERTIFIED

Prepared 2026-10-23, for owner review only, as part of the same focused correction/security pass
that produced `PRIVACY_POLICY_DRAFT_2026-10-23_REVISION.md`. This revises
`APP_PRIVACY_CONNECT_ANSWERS.md` (2026-10-21) for the AdMob advertising + Expo push notification
+ first-party analytics work built this pass. **None of that work has been deployed yet** (no
migration applied, no Edge Function deployed, no production AdMob app ID live) — do not enter
these answers into App Store Connect, and do not flip the live Tracking toggle, until the
underlying features actually ship. Entering privacy answers ahead of the feature shipping would
itself be an inaccurate ASC disclosure, same reasoning as the Privacy Policy revision.

## What changed from the 2026-10-21 answers, and why
1. **Identifiers > Device ID — NEW, Collected: Yes.** The Expo push token (`push-token-
   service.ts`) is a device-specific identifier now stored server-side, linked to the account.
2. **Identifiers > Device ID (Advertising ID / IDFA) — NEW, Collected: Yes, for a narrower
   slice of users than "every free user."** Google AdMob's SDK can access the IDFA only when
   (a) the user is a free user (subscribers never load an ad at all — confirmed by
   `ad-eligibility-logic.ts`'s exhaustive matrix), AND (b) `computeRequestNonPersonalizedAdsOnly`
   returns `false`, which this pass's own 8-case truth table
   (`validate-ad-eligibility-logic.ts`) confirms requires ALL THREE of: confirmed 18+, Google's
   own UMP consent obtained or not required for the user's region, AND the user granted Apple's
   ATT permission. For every other user, AdMob is still present and still serves an ad, but
   requests it non-personalized — no IDFA use.
3. **Usage Data > Advertising Data — NEW, Collected: Yes.** This app's own first-party
   `analytics_events` table now records ad funnel events (`ad_eligible`, `ad_request`,
   `ad_loaded`, `ad_impression`, `ad_revenue_paid`, `ad_dismissed`, `ad_failed`,
   `ad_placement_variant`) — see the exact properties shape in `analytics-service.ts`. This is
   first-party (never sent to a third party) and contains no IDFA, no specific-ad/advertiser
   identity, and no user content.
4. **Usage Data > Product Interaction — NEW, Collected: Yes.** The same first-party table also
   records `quiz_completed`, `result_revealed`, and the notification-funnel events
   (`notification_permission_requested/granted/denied`, `notification_scheduled`,
   `notification_sent`, `notification_opened`, `notification_preference_changed`).
5. **The 2026-10-21 answer "Usage Data — COLLECTED: No" is now WRONG and must be replaced**, not
   merely supplemented — that answer was correct only because no analytics system existed yet.
6. **The Tracking toggle recommendation changes from No to Yes.** See its own section below —
   this is the single highest-consequence change in this revision.
7. **A third-party SDK's own Privacy Manifest could not be verified in this environment** (see
   "What this revision could NOT verify" below) — flagged rather than guessed at.

## Revised/added answers

### Identifiers > Device ID — COLLECTED: Yes (new)
- **What**: the Expo push token (`getExpoPushTokenAsync`), stored in `push_tokens`, linked to
  the account (`user_id references auth.users(id) on delete cascade`).
- **Linked**: Yes — tied to the account, removed on logout/disable/account deletion
  (`removeThisDevicePushToken`, and the delete-account cascade).
- **Tracking**: No — never shared with any third party or data broker for ad targeting; Expo
  uses it solely as a delivery address for this app's own notifications
  (`push-token-service.ts`'s own header comment: "Expo does not use this for advertising or any
  purpose of its own").
- **Purpose**: App Functionality.

### Identifiers > Device ID — Advertising Identifier (IDFA) — COLLECTED: Yes, conditionally (new)
- **What**: Google AdMob's SDK can access the device's advertising identifier.
- **Collected for**: only free users who are confirmed 18+, have granted Google's UMP consent
  (or consent is not required for their region), AND have granted Apple's ATT permission — the
  exact three-condition AND proven exhaustively in `validate-ad-eligibility-logic.ts`. Never for
  subscribers (never load an ad). Never for anyone who hasn't confirmed 18+. Never for anyone
  who declines ATT or UMP consent.
- **Linked**: Yes, for the users it's collected from — this is precisely the case Apple's own
  "linked" and "tracking" definitions both describe.
- **Tracking**: **Yes**, for that slice of users — this app, for the first time, lets a
  third party (Google) use the IDFA to personalize ads using data about the user's activity
  across apps. See the Tracking section below.
- **Purpose**: Third-Party Advertising.

### Usage Data > Advertising Data — COLLECTED: Yes (revised from No)
- **What**: `ad_eligible`, `ad_request` (placement + ad unit id), `ad_loaded` (load time),
  `ad_impression`, `ad_revenue_paid` (SDK-estimated revenue, explicitly NOT a finalized payout —
  see the migration's own comment), `ad_dismissed`, `ad_failed` (error code),
  `ad_placement_variant`. First-party only (`analytics-service.ts`); never sent to Google or any
  other third party by this app's own code.
- **Linked**: Yes (tied to the account via `log_analytics_event`'s own `auth.uid()` derivation).
- **Tracking**: No — stays inside this app's own first-party system; the "Yes" tracking answer
  above comes entirely from AdMob's own IDFA access, not from this first-party event stream.
- **Purpose**: Analytics, App Functionality (operating the ad placements themselves).

### Usage Data > Product Interaction — COLLECTED: Yes (new)
- **What**: `quiz_completed`, `result_revealed` (+ whether an ad was shown),
  `notification_permission_requested/granted/denied`, `notification_scheduled`,
  `notification_sent`, `notification_opened`, `notification_preference_changed`.
- **Linked**: Yes. **Tracking**: No (first-party only, same reasoning as above).
- **Purpose**: Analytics, App Functionality.
- Note: this is a narrower claim than it may look — it's the SAME quiz-completion/result
  moment already disclosed under User Content in the 2026-10-21 answers, now also counted as a
  lightweight usage event; no new screen-by-screen engagement telemetry was added.

### Purchases > Purchase History, Diagnostics, Contact Info, User Content — UNCHANGED
Nothing in this pass touched RevenueCat, Sentry, profile fields, or quiz/Daily/Creature/Relic
content collection. The 2026-10-21 answers for these rows stand as written.

### Notification preferences (category toggles, reminder time, quiet hours, timezone)
- **Classify under**: User Content > Other User Content (a user-set preference, not a
  behavioral signal) — consistent with how the 2026-10-21 document classified other optional
  profile fields.
- **Linked**: Yes. **Tracking**: No. **Purpose**: App Functionality.
- Timezone specifically: collected ONLY to apply quiet hours at the correct local hour
  (`notification-preferences-service.ts`'s `getDeviceTimeZone`) — not used for any location-
  based feature, ad targeting, or analytics purpose. Worth stating that narrowly in ASC's free-
  text description field if one is offered for this row.

## Tracking question (the single App Store Connect toggle) — REVISED
**Previous answer (2026-10-21): No.** **Revised recommendation: Yes**, scoped narrowly: this app
now tracks users, through Google AdMob's use of the IDFA, but ONLY for the slice of users who
are simultaneously free, confirmed 18+, UMP-consented, and ATT-granted — every other user
(subscribers always, by far the largest protected group) is never tracked.

Apple's own ASC flow asks this as a single app-wide Yes/No, not a per-user-segment answer — a
conditional "sometimes, for some users" practice still answers **Yes**, the same way a "tracking
happens unless the user opts out" app does. **This is the one answer in this entire revision
that carries real App Review risk if entered wrong — recommend the owner treat this specific
toggle as requiring a final human decision, not an automated inference, before submission.**

Do not change the live ASC Tracking toggle to Yes before AdMob is actually live in a shipped
build — ASC's own tracking question is about actual current app behavior, not a planned future
state.

## What this revision could NOT verify in this environment
- **Google Mobile Ads SDK's own `PrivacyInfo.xcprivacy` manifest.** The 2026-10-21 document was
  able to read RevenueCat's and Sentry's real generated manifests because an `ios/Pods`
  prebuild existed at the time. No `ios/` directory exists in this checkout right now (this is
  a bare Expo-managed project at the moment), so `react-native-google-mobile-ads`'s and
  `expo-tracking-transparency`'s own Apple-mandated privacy manifests could not be read directly
  this time. The answers above are grounded in this app's own code (which fully determines WHEN
  AdMob is invoked and under what consent state) and Google's own long-published, publicly
  documented AdMob data-collection practices — but **re-confirm directly against the real
  generated manifest** (via `npx expo prebuild` or an actual EAS build's Pods output) before
  certifying, the same evidentiary standard the rest of this engagement has held to.
- Google UMP's own manifest, same caveat.

## What this document does NOT do
Enter or certify anything in live App Store Connect (no ASC access exists in this environment).
It is evidence to enter those answers FROM, once the underlying features are actually live.
Final sign-off, and the Tracking toggle specifically, remain the owner's.
