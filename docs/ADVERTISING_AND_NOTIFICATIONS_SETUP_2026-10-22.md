# Apparently You | Advertising + Push Notifications: architecture, setup, and limitations
Prepared 2026-10-22. Companion to the full implementation (AdMob advertising, push
notifications, first-party analytics) landed this pass. This is the single reference for
everything an owner needs to do outside this codebase to turn test-mode code into a real,
revenue-producing/notification-sending production feature, plus every architectural decision
made and why.

## 1. Architecture decisions (confirmed with the owner before implementation)

1. **AdMob account**: none exists yet. Every ad placement is built against Google's own
   official public TEST ad-unit IDs (`react-native-google-mobile-ads`'s `TestIds.*`) and a TEST
   AdMob app ID (`ca-app-pub-3940256099942544~1458002511` for iOS) — safe to ship, never a real
   impression or charge. See §3 for exactly what the owner creates and pastes in later.
2. **Push transport**: Expo's own Push Notification service (`expo-notifications` +
   `getExpoPushTokenAsync`), not Firebase Cloud Messaging and not a hand-rolled raw-APNs
   integration. This app is iOS-only, managed (EAS-built, no bare `ios/`/`android/` checked
   in) — Expo's push service brokers delivery to Apple's APNs directly using push credentials
   EAS itself manages for this project; FCM would add a second cloud project and SDK for a
   capability APNs-via-Expo already gives this app for free, and a hand-rolled raw-APNs
   integration would require the owner to generate and rotate an Apple Push Notification
   Authentication Key themselves with no corresponding benefit here.
3. **Analytics**: a first-party `analytics_events` table (`supabase/migrations/
   20261022010000_analytics_events.sql`), no third-party SDK. Simplest privacy story (no new
   vendor, no new SDK-specific App Privacy disclosure beyond what AdMob itself already
   requires), and this app already had zero analytics infrastructure to build on top of.

## 2. Conflicts found against the existing Bible/architecture — resolved pragmatically

- **No analytics system existed to "use."** The task's own instruction assumed one; built the
  first-party table above instead of silently skipping the requirement.
- **No friend/relationship/blocking system exists.** "Compare" (`compare-service.ts`) is
  anonymous-nickname, share-link-based — there is no persistent friend graph or block list in
  this app's actual architecture to "respect." Resolved pragmatically: the Friend/Compare
  activity notification fires on a REAL event (a genuine `compare_responses` row landing for a
  share the recipient owns) and goes only to that recipient — the one meaningful
  privacy/authorization boundary that DOES exist in this architecture (an anonymous respondent
  can never be notified about anything, has no account to notify). "Blocking" as literally
  described does not apply until/unless a real friend-graph feature is built — flagged, not
  silently assumed solved.
- **Quizzes and Private content are static app code, not database rows.** "Notify when a new
  quiz is published" and "notify subscribers about new Private content" assume a dynamic
  content-publish event; this app ships both via an app BUILD, not a database insert. Resolved
  with an explicit, admin-invoked broadcast RPC (`broadcast_content_notification`) the
  owner/admin calls once after a build with genuinely new content has shipped — never a
  fabricated automatic trigger (the task's own explicit "never fabricate progress" standard).
- **Creature-evolution detection needs the real, LOCKED scoring engine, not a SQL re-derivation.**
  `personality.ts`'s `scorePersonalityProfile`/opposite-pole qualification logic is the one
  approved implementation; re-deriving it in plpgsql would risk silent drift from future Bible-
  approved scoring changes. Resolved by detecting the change client-side (where the real engine
  already runs, in `you.tsx`) and enqueueing a narrow, identity-scoped notification request —
  see `src/services/creature-evolution-notification-service.ts`.
- **Apple App Privacy / tracking disclosures**: this launch materially changes what was
  certified in `docs/APP_PRIVACY_AUDIT_2026-10-21.md` / `APP_PRIVACY_CONNECT_ANSWERS.md`
  (2026-10-21, a previous pass) — Usage Data/Advertising Data/Identifiers answers flip from "No"
  to "Yes," and the ASC tracking toggle changes from "No" to "Yes" once AdMob/ATT ship. **Not
  re-done in this pass** — flagged as required follow-up before any production ad goes live;
  see §7.
- **The live, published Privacy Policy currently states** *"We do not use any advertising,
  analytics, or behavioral-tracking SDK."* **This becomes false the moment this ships to
  production.** Not rewritten in this pass — a live legal-page change needs the owner's
  explicit review per this engagement's standing practice; see §7.

## 3. AdMob account and ad-unit setup (owner action required before real ads can serve)

1. Create an AdMob account at https://admob.google.com if one doesn't exist, and add
   Apparently You as an app (link to its real App Store listing once published, or register as
   "not yet published" for TestFlight-stage setup).
2. Create three ad units: one Interstitial (for the quiz/Daily placements) and one Native
   Advanced (for Explore). Note the real `ca-app-pub-...` app ID and each ad unit's id.
3. Set these as EAS environment variables (`eas env:create`), matching the existing
   `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` pattern — never commit real ids to this repository:
   - `EXPO_PUBLIC_ADMOB_INTERSTITIAL_UNIT_ID`
   - `EXPO_PUBLIC_ADMOB_NATIVE_UNIT_ID`
4. Replace the TEST `iosAppId`/`androidAppId` in `app.json`'s `react-native-google-mobile-ads`
   plugin config with the real AdMob app id (this one IS baked into the native build config,
   not an env var — it has to be, since it's read before any JS runs). This requires a new
   build once changed.
5. Google requires an `app-ads.txt` file at `https://apparentlyyou.com/app-ads.txt` once real
   ad revenue is involved — add this to the website's own static-file deployment (outside this
   repo's scope; same Vercel project the Privacy Policy/Terms already deploy from).
6. Set `isUsingRealAdUnits` (`src/services/ads-config.ts`) to confirm in a build whether real
   ids are actually configured — already computed automatically from the env vars above; no
   code change needed, just set the env vars.

## 4. APNs / Apple Developer / EAS push credentials setup

1. In the Apple Developer portal, enable the **Push Notifications** capability for this app's
   bundle id (`com.supergreatventures.apparently`) if not already enabled.
2. Run `eas credentials -p ios` and follow the interactive flow to let EAS generate/upload a
   real APNs key for this project — this is an interactive CLI flow (push-key generation
   requires either an existing Apple Developer-issued key uploaded, or EAS generating one via
   an authenticated Apple Developer session), so it cannot be fully scripted/automated from
   this environment. Once done, EAS stores and manages the key; no further action is needed per
   build.
3. No Firebase project, no `google-services.json`/`GoogleService-Info.plist`, no FCM server
   key — none of that is used by this integration (see §1.2).
4. A new build (`eas build --profile testflight`) is required after push credentials are first
   configured, so the native binary actually has notification entitlements baked in.

## 5. Required environment variables / secrets (full list)

| Variable | Where | Purpose |
|---|---|---|
| `EXPO_PUBLIC_ADMOB_INTERSTITIAL_UNIT_ID` | EAS env | Real interstitial ad unit id (optional — defaults to Google's test id) |
| `EXPO_PUBLIC_ADMOB_NATIVE_UNIT_ID` | EAS env | Real native ad unit id (optional — defaults to Google's test id) |
| `app.json`'s `iosAppId`/`androidAppId` | committed config | Real AdMob app id (not an env var — baked into native config) |
| Supabase Vault secret named `service_role_key` | Supabase Vault (SQL editor/CLI, never a file) | Lets the `apparently_send_push_notifications` cron job authenticate its call to the send-push-notification Edge Function |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Edge Function runtime env (automatic) | Already provided automatically to every deployed Edge Function by Supabase — no manual setup |

## 6. TestFlight verification instructions

1. Apply the four staged migrations in order (see §8) to a project the TestFlight build points
   at, and deploy `send-push-notification` (`supabase functions deploy send-push-notification`).
2. Build with `eas build --profile testflight` (required regardless, to pick up the new push
   capability + AdMob config plugin changes) and submit as usual.
3. On a real device running the TestFlight build:
   - Confirm interstitial ads render Google's test-ad creative (a visibly test-labeled ad, not
     a real ad) after a free public quiz and after the Free Daily reveal.
   - Confirm native ad cards in Explore show the "Ad" badge and Google's test-ad creative.
   - Complete the first Daily/quiz and confirm the contextual notification-permission explainer
     appears, and that accepting it triggers the real iOS system permission dialog.
   - In Settings → Notifications, toggle each category and confirm the Switch state persists
     across an app restart.
   - Have a second TestFlight tester "Give their version" on a shared quiz result and confirm
     the sharer receives a real push notification (requires the Edge Function + cron to be
     live — see §8).
4. Verify a subscriber (sandbox purchase) sees zero ads anywhere, immediately after purchase
   completes, with no app restart required.

## 7. Outstanding steps that require explicit owner action (not done in this pass)

1. **Re-audit App Privacy / tracking disclosures.** `docs/APP_PRIVACY_AUDIT_2026-10-21.md` and
   `APP_PRIVACY_CONNECT_ANSWERS.md` need a real redo once this ships — Usage Data/Advertising
   Data/Identifiers flip to "Yes," and the ASC tracking toggle flips to "Yes." Not done this
   pass; flagged, not silently left stale.
2. **Rewrite the live Privacy Policy's "We do not use any advertising, analytics, or
   behavioral-tracking SDK" sentence** (and add real advertising/analytics-data disclosure
   language) before this ships to production — a live legal-page change, requires explicit
   owner review before publishing, per this engagement's standing practice. Not drafted in this
   pass (out of this implementation task's own scope, but required before go-live).
3. **Create the real AdMob account/ad units** (§3) and **enable the Push Notifications
   capability + run `eas credentials`** (§4) — neither can be done from this environment.
4. **Store the `service_role_key` secret in Supabase Vault** (§5) before applying the cron
   migration, and **deploy `send-push-notification`** before the cron job can do anything
   useful.
5. **Decide whether/when to apply the four staged migrations below** — nothing has been applied
   to production. Same authorization step every database change in this engagement has gone
   through.
6. **Author `app-ads.txt`** on the website once real ad revenue is involved (§3.5).

## 8. Migrations added this pass (staged, NOT applied — apply in this order)

1. `20261022010000_analytics_events.sql` — first-party events table + RPC + two read-only
   reporting views. No dependency on anything else here.
2. `20261022020000_push_notifications_schema.sql` — `push_tokens`, `notification_preferences`,
   `notification_outbox`, the Friend/Compare trigger, and the admin broadcast RPC.
3. `20261022030000_creature_evolution_notification.sql` — the one additional RPC
   `enqueue_creature_evolution_notification`, depends on `notification_outbox` from #2.
4. `20261022040000_schedule_push_notification_sends.sql` — the cron job that actually sends
   enqueued notifications. Depends on #2 (the table it reads) AND two things that cannot be
   done from a migration file: the Vault secret (§5) and the deployed Edge Function (§4 above's
   sibling, `supabase functions deploy send-push-notification`).

None of these touch, alter, or drop anything from the existing schema — purely additive new
tables/functions/triggers. No existing user's data, entitlement, or Creature/Signature/Relic
identity is read or written by any of them.

## 9. Known limitations (honest, not glossed over)

- **Quiet hours are compared against server UTC time, not the user's real local timezone** —
  no per-user timezone is stored server-side (the Daily reminder avoids this entirely by
  scheduling client-side, in the user's actual local time; remote pushes from the Edge Function
  do not have an equivalent per-user timezone signal today). Documented in
  `send-push-notification`'s own code comment, not silently assumed correct.
- **New-quiz/Private-content notifications require an explicit admin action** after each
  relevant build ships — there is no automatic "content published" event for static app
  content, and none was fabricated.
- **Nothing in this pass has been verified end-to-end on a physical device** (no device was
  available in this environment) — see the final report for the exact test-case-by-test-case
  breakdown of what's validator-covered vs. what still needs a real device.
- **AdMob mediation, GAM (Google Ad Manager), and any ad network beyond AdMob itself** are out
  of scope — this integration is AdMob-only, using `react-native-google-mobile-ads`'s own
  bundled AdMob adapter.
