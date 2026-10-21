# Apparently You | App Privacy evidence and disclosure worksheet
Updated October 21, 2026. NOT YET ENTERED OR CERTIFIED IN APP STORE CONNECT.

## Apple definitions to apply
For each data type, determine whether data is collected off device by the developer or SDK partners, linked to a user or device, used for tracking, and its purpose (app functionality, analytics, developer advertising, third-party advertising, product personalization, other). Distinguish voluntary sharing from backend collection. Anonymous identifiers can still be linked to a user. Do not declare "no data collected" without evidence.

| Data candidate | Repository evidence | Verification required before ASC answer |
|---|---|---|
| User ID | Supabase anonymous authentication and RevenueCat customer identifiers | Is persistent ID linked to answers, purchases, or analytics? |
| Name | Optional first name in Settings/onboarding | Is it synced server-side or only stored locally? |
| Age range | 13–17 and adult options in onboarding/Settings | Where stored, retention, use for mature-content gating |
| Gender/custom gender | Optional profile fields | Server/local storage and sensitive data taxonomy |
| User content | Quiz answers, Daily answers, comparisons and Private evidence | Backend tables, sharing tokens, retention and deletion |
| Product interaction | Quiz completion and Daily activity | Server events, diagnostics, purposes |
| Purchases | RevenueCat entitlement and Apple transactions | SDK privacy documentation, linked identifier and purposes |
| Diagnostics | @sentry/react-native plugin and EXPO_PUBLIC_SENTRY_DSN environment | Is enabled in production? Scrubbing, events, device IDs and crash data |
| Device/network identifiers | SDK/network requests, IPs, device context | SDK disclosures, logging, linkability and tracking |
| Photos | expo-media-library savePhotosPermission and user-triggered Save to Photos | Confirm write-only behavior; avoid claiming photo library upload |
| Contact details | Support and privacy emails used by users | Support emails and retention, whether within app collection scope |
| Web sharing | /s/:token route and comparison/Creature sharing | Token exposure, revocation, expiry, profile fields shown |
| Advertising/tracking | No advertising code verified in reviewed snippets | Search complete dependency and production stack before selecting No |

## Service audit
Supabase: list all production tables, functions, storage, RLS, account deletion behavior, and retention.
RevenueCat: check Apple/RevenueCat SDK privacy documentation and actual collected fields.
Sentry: inspect initialization, PII flags, breadcrumbs, filtering, and production DSN.
Expo and Apple: confirm privacy manifests, native permissions, attribution/analytics and SDK privacy manifests.
Vercel and website: check analytics, server logs, cookies and web-specific privacy disclosures.

## Deletion and rights
Current Settings calls account-deletion-service; older deployment documentation says the delete-account Edge Function and migrations were staged but not deployed. Verify actual production deployment and successful deletion before claiming it works. Clarify retention in backups, logs, analytics and vendor systems. Deleting an app account does not cancel an Apple subscription.

## Verification findings, 2026-10-21 (Build 19 launch-readiness pass)
Resolves most "Verification required" cells above with direct repository/live evidence --
still NOT the same as entering/certifying the actual App Store Connect questionnaire, which
requires ASC access this environment does not have.

- **User ID:** Yes, linked. The Supabase anonymous auth UID is the SAME identifier used as the
  RevenueCat `appUserID` (confirmed in `src/services/purchases-service.ts`'s own header
  comment) -- so purchase/entitlement data IS linked to the same persistent id that answers
  are stored under. No separate analytics linkage exists (no analytics SDK in `package.json`).
- **Name:** Optional first name is stored server-side in `public.profiles` (confirmed via
  `profile-service.ts`/the delete-account cascade comment), not local-only.
- **Age range / Gender:** Both stored server-side in `public.profiles`, same table/retention as
  Name. Age range (13-17/18-24/.../65+) is demographic only; a SEPARATE field,
  `age_eligibility` (13to17/18plus), server-enforced and immutable once set, gates the 18+
  "Private Private" content -- these are two different columns, do not conflate them in the
  ASC answer.
  Age confirmed 2026-10-21 for sign-off: real end-to-end Confirmed account deletion test (see
  below) ran against this table.
- **User content (quiz/Daily answers, comparisons, Private evidence):** Stored server-side,
  RLS-governed by user_id, hard-deleted via cascade on account deletion (verified live, see
  below). Share tokens (`quiz_shares`/`compare_responses`) also cascade-delete with the
  sharer's account; no separate expiry/revoke exists.
- **Purchases:** RevenueCat entitlement + Apple transaction data, linked via the same user id
  as above. Not deleted by in-app account deletion (Apple/RevenueCat retain their own
  records) -- disclosed explicitly in the finalized Privacy Policy.
- **Diagnostics:** Sentry IS integrated and active in production builds
  (`src/services/observability.ts`). Confirmed explicitly: `sendDefaultPii: false` (no IP/
  device-contact auto-attach), `attachScreenshot: false`, no session-replay integration,
  `beforeSend`/`beforeBreadcrumb` scrub auth headers and request bodies. Fields actually sent:
  app version/build/environment, a backend-operation tag, a structural error code, a
  high-level screen name, and stack traces -- never quiz answer text or personality results.
- **Device/network identifiers:** No separate tracking/advertising/device-fingerprinting SDK
  found in `package.json`. Sentry's default HTTP breadcrumb carries method+URL+status only
  (explicitly scrubbed of headers/bodies).
- **Photos:** `expo-media-library` `savePhotosPermission` is write-only (Save to Photos),
  confirmed by the permission string itself requesting write access only, not read/library
  access -- the app never reads or uploads the user's existing photo library.
- **Web sharing:** No manual revoke exists; a share link resolves until the sharer's account
  is deleted (cascade). The shared page itself does not render the sharer's profile name or
  other account fields (confirmed by reading `src/app/s/[token].tsx`) -- only the
  comparison/result content explicitly shared.
- **Advertising/tracking:** Confirmed no advertising/attribution SDK anywhere in
  `package.json`. "No tracking" is a defensible answer based on this evidence, but ASC's own
  tracking definition should still be reviewed against Apple's current guidance before
  certifying.
- **Account deletion, live-verified 2026-10-21:** `scripts/test-delete-account-integration.ts`
  run against the live production project using a disposable account it creates and destroys
  itself (never an existing user): created a real anonymous account, wrote a real `profiles`
  row, called the deployed `delete-account` function, independently confirmed via admin CLI
  query that BOTH the `auth.users` row and the cascaded `profiles` row were gone, and
  confirmed a second deletion attempt with the now-invalid token fails honestly rather than
  reporting a fabricated second success. All checks passed.

## Sign-off
Legal operator: Super Great Ventures LLC (owner-confirmed).
Backend/SDK evidence review: completed 2026-10-21, findings above.
Final Apple questionnaire values: [REQUIRES LIVE ASC] -- this worksheet is evidence to enter
those answers from, not a substitute for entering/certifying them in App Store Connect itself.
Date entered/published: [REQUIRES LIVE ASC]
No tracking assertion or age rating is made here.
