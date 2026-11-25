# Apparently You | App Store Connect App Privacy questionnaire — recommended answers

Prepared 2026-10-21. This is evidence-based guidance for entering App Store Connect's live App
Privacy questionnaire — it is NOT itself a completed/certified ASC submission (no ASC access
exists in this environment). Every row below cites the exact code/config that justifies it.
Apple's current data-type taxonomy, purpose list, and "linked"/"tracking" definitions were
confirmed directly from Apple's own App Privacy Details documentation
(developer.apple.com/app-store/app-privacy-details) before writing this, not recalled from
memory.

**Apple's definitions used throughout:**
- **Linked to the user's identity**: data connected to the user via their account, device, or
  other identifying details (Apple: personal data under privacy law is automatically linked).
- **Tracking**: linking data from this app about a user/device with **third-party data** for
  targeted advertising/ad measurement, or sharing it with a **data broker**. On-device-only
  linkage, or a data broker used solely for fraud prevention, is NOT tracking.
- **Purposes**: App Functionality, Analytics, Product Personalization, Developer's Advertising
  or Marketing, Third-Party Advertising, Other Purposes.

## How this was built
1. Read every third-party SDK's OWN Apple-mandated Privacy Manifest (`PrivacyInfo.xcprivacy`)
   after a real `pod install` generated them — these are the vendors' own Apple-format privacy
   declarations, not Apparently You's claims about them.
2. Cross-checked against this app's actual code: `src/services/observability.ts` (Sentry),
   `src/services/purchases-service.ts` (RevenueCat), `src/lib/supabase.ts` (Supabase),
   `supabase/functions/delete-account/index.ts` (what's actually stored/deleted), and a full
   `grep` of `package.json` for any analytics/advertising/tracking SDK (none exists).
3. `src/services/observability.ts` confirmed as the ONLY file anywhere in `src` that imports
   `@sentry/react-native` (`grep -rln "Sentry\." src` returns exactly one file) -- so Sentry's
   actual data exposure is fully determined by that one module's config, not scattered calls
   elsewhere that could silently add more.

## Recommended answers by data type

### Identifiers > User ID — COLLECTED: Yes
- **Linked to user**: Yes. It's the Supabase anonymous auth UID, and the SAME value is passed
  as RevenueCat's `appUserID` (`purchases-service.ts`'s own header comment) -- so it's the
  thread tying a user's quiz answers, Creature/Relic progress, and purchase/entitlement state
  together within this app.
- **Tracking**: No. Never shared with a third party for cross-app/cross-site ad targeting or
  with a data broker. RevenueCat receives it only for first-party entitlement sync (same
  purpose as the app itself); Sentry never receives it at all (see Diagnostics below).
- **Purpose**: App Functionality.

### User Content > Other User Content — COLLECTED: Yes
Quiz and Daily answers, personality trait evidence, Creature/Relic progression, comparison
results, optional profile fields (age range, gender/custom gender).
- **Linked**: Yes (same account/User ID as above; stored server-side in Supabase, confirmed by
  reading the actual `CREATE TABLE`s referenced in `delete-account/index.ts`'s own cascade
  comment: profiles, daily_answers, quiz_results, personality_evidence,
  personality_pole_evidence, quiz_shares).
- **Tracking**: No.
- **Purpose**: App Functionality (the app cannot work without it) and Product Personalization
  (it drives the Creature/Read personalization itself).
- **Owner judgment call**: whether self-reported gender/custom-gender should also be flagged
  under Apple's single "Sensitive Info" checkbox. Apple's current taxonomy doesn't give a
  specific "Gender" sub-type -- "Sensitive Info" as Apple defines it centers on racial/ethnic
  origin, sexual orientation, pregnancy, disability, religious/philosophical belief, trade
  union membership, political opinion, genetic/biometric data, and criminal record. Self-
  reported gender identity isn't a clean match to any of those, so this worksheet recommends
  classifying it under "Other User Content" rather than "Sensitive Info" -- but this is a
  judgment call Apple reviewers could read differently; confirm before certifying.

### Contact Info > Name — COLLECTED: Yes (optional)
- **Linked**: Yes (same account, stored server-side via `profile-service.ts`).
- **Tracking**: No.
- **Purpose**: App Functionality.

### Purchases > Purchase History — COLLECTED: Yes
- **Linked**: Yes in this app's actual practice -- RevenueCat's own `PrivacyInfo.xcprivacy`
  generically declares purchase history as "not linked" (a default SDK-level claim), but
  Apparently You's own use links it: the SAME `appUserID` (the Supabase anonymous UID) is
  used for purchases as for every other data type above, so what Apple cares about here --
  THIS app's actual linking practice -- is Yes.
- **Tracking**: No (confirmed by RevenueCat's own manifest: `NSPrivacyCollectedDataTypeTracking`
  = false).
- **Purpose**: App Functionality.

### Diagnostics > Crash Data, Performance Data, Other Diagnostic Data — COLLECTED: Yes, only when Sentry is active (production builds; no DSN configured = fully disabled, see `observability.ts`)
- **Linked**: No. Confirmed two ways: (1) Sentry's own `PrivacyInfo.xcprivacy` declares all
  three collected types as `NSPrivacyCollectedDataTypeLinked = false`; (2) this app's own
  config never calls `Sentry.setUser()` anywhere (`grep -rln "Sentry\."` across all of `src`
  returns exactly `observability.ts`, which contains no such call) -- so no user identifier is
  ever attached to a Sentry event from this app's side either.
- **Tracking**: No (Sentry's own manifest: false for all three).
- **What's actually sent**, read directly from `observability.ts`'s real config: app
  version/build/environment, a backend-operation tag, a structural Postgres/Supabase error
  code, a high-level screen name, and stack traces. Explicitly NEVER sent (enforced in code,
  not just policy): default PII (`sendDefaultPii: false`), screenshots
  (`attachScreenshot: false`), session replay (no such integration configured), request
  bodies/auth headers (stripped by `beforeSend`/`beforeBreadcrumb`), or quiz answer/personality
  content.
- **Purpose**: App Functionality.

### Usage Data (Product Interaction / Advertising Data / Other Usage Data) — COLLECTED: No
No analytics, engagement-tracking, or advertising SDK exists anywhere in `package.json`
(checked for Firebase, Mixpanel, Amplitude, Segment, AppsFlyer, Adjust, Branch, PostHog, and
any Facebook/ads SDK -- none found). Quiz/Daily activity IS recorded, but as substantive user
content needed to run the feature (see User Content above), not as a separate engagement-
analytics stream -- there is no "which screens were viewed, for how long" telemetry.

### Location, Health & Fitness, Financial Info, Contacts, Browsing History, Search History — COLLECTED: No
No code anywhere requests location, health, contacts, or browsing/search-history permissions
or APIs. Payment card details are entered directly into Apple's own purchase sheet and never
reach this app's code (`purchases-service.ts`'s own header comment: "never a secret key... the
RevenueCat dashboard/API secret" -- same principle extends to not touching card data, which
RevenueCat's SDK itself never exposes to host-app code either).

### Other data present but NOT independently collected by this app
- `expo-media-library`: write-only (Save to Photos). Its own `PrivacyInfo.xcprivacy` declares
  zero collected data types and `NSPrivacyTracking: false`. This app only ever WRITES an image
  the user explicitly chose to save -- it never reads the existing photo library.
- `expo-device` is a declared dependency but is not imported by any file under `src`
  (confirmed via `grep`) -- likely a transitive requirement of another Expo module. Its own
  manifest declares zero collected data types, no tracking.
- `react-native-view-shot`, `@react-native-async-storage/async-storage`: own manifests both
  declare zero collected data types, no tracking (used only for the on-device Creature image
  capture and local app-state caching respectively).

## Tracking question (the single App Store Connect toggle)
**Recommended answer: No, this app does not track users**, per Apple's definition above --
confirmed no SDK sends any identifier to a third party or data broker for targeted advertising
or ad measurement (every third-party SDK's own manifest agrees: RevenueCat, Sentry, and the
local-storage/media libraries all declare `NSPrivacyTracking: false`). Still worth a final
human read of Apple's current tracking guidance before certifying, since this toggle carries
legal weight.

## What this document does NOT do
Enter or certify anything in live App Store Connect (no ASC access exists in this
environment). It is evidence to enter those answers FROM. Final sign-off remains the owner's.
