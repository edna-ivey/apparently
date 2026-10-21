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

## Sign-off
Legal operator: [OWNER]
Backend/SDK evidence review: [ENGINEERING]
Final Apple questionnaire values: [REQUIRES LIVE ASC]
Date entered/published: [REQUIRES LIVE ASC]
No tracking assertion or age rating is made here.
