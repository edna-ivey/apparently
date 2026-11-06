# Apparently You | Build 17 product-to-code audit
Date: 2026-10-20
Source: `feature/private-library-implementation`, inspected after Bible reconciliation at `d3d9009`.
Scope: repository code, build records, editorial registry and available documentation. NOT a live Supabase, RevenueCat dashboard, App Store Connect or physical iPhone audit.

## Verified passes
- Working branch synchronized with origin; no uncommitted changes at audit start.
- Build 17 provenance documented in Bible §74: iOS 1.0.0 (17), EAS build from `8a42ace`, submitted and available to internal TestFlight testers. Later HEAD commits are NOT automatically included in Build 17.
- `npx tsc --noEmit` exited 0; `npm run lint` exited 0.
- Main navigation source files exist for Today, Explore, Private, Compare, You; Settings, paywall, quiz, Creature/Relic views are present.
- `react-native-purchases` and purchase/restore/service synchronization paths exist. Server entitlement boundary is designed in code; live enforcement was not re-tested.
- Age eligibility and Build 17 Creature/photo improvements are represented in source and dated docs; physical-device checklist remains unchecked.

## P0: Owner-approved rule conflicts
1. Daily trait breadth. Bible §56 LOCKED: unlimited number of genuinely supported trait poles per answer, at most 3 points per pole. `src/data/daily-questions.ts` lines 46, 501 and 1188 cap and slice to 3 effects; `src/app/admin/(protected)/review/[id].tsx` lines 31, 258, 333, 449 caps editor to 3. This can silently discard valid mappings. Requires tested change, including validation and migration/compatibility review before publication.

## P1: Commercial and launch gaps
2. Annual/Founding Member pricing: owner LOCKED $3.99/month, $29.99 standard annual, $19.99 first-year founder then $29.99 annual renewal with clear upfront disclosure. `src/app/paywall.tsx` currently imports only `getMonthlyOffering` and `subscribeMonthly`; `src/services/purchases-service.ts` identifies monthly product only. No annual/founder purchase selection was observed. Store/RevenueCat products and eligibility not inspected. Implementation + sandbox tests required.
3. Account deletion: no user-facing deletion action found in `src/app/settings.tsx` via targeted source inspection. Check other routes/backend and implement accessible in-app deletion and data handling as applicable; don't claim absent globally until exhaustive code and live service audit.
4. Build 17 acceptance: `docs/BUILD17_DEVICE_TEST_CHECKLIST_2026-10-19.md` still entirely unchecked. Validate Creature preview, actual saved photo, share/cancel, age-range persistence and eligibility isolation on real devices.
5. External TestFlight: §74 records internal beta availability; external submission not completed at that checkpoint. Reconfirm current App Store Connect state before any external distribution or release claim.

## P1: Content and scoring quality
6. `docs/DAILY_ONE_PASS_FULL_WORKBOOK_2026-10-20.md` is 90 original slots TOTAL, including cut archival entries, NOT 90 new approved questions per room. 428 active answer options have proposed mappings; 135 individually reasoned, 293 rough lexical candidates. No blanket approval or publication. Batch 2 includes 27 newly authored answer-set proposals rather than recovered originals.
7. `docs/DAILY_COLLISION_AUDIT_2026-10-20.md` records Shuri and Cleo collisions between approved options. Resolve with owner before publishing. No silent editorial substitution.
8. New approved Daily scheduling priority over repeats is LOCKED, but exact live scheduling and deployment status require verification.

## P2: Repository/documentation and release verification
9. `master` is behind current feature branch; keep branch provenance in all reports, merge only after review.
10. Confirm privacy policy/terms URLs, App Privacy, account deletion, subscription renewal disclosures, RevenueCat annual products, Apple agreements, age rating, screenshots, review notes and store metadata in live systems. These were NOT verified by this repository-only pass.
11. Confirm current Supabase migration state, live entitlements, age gate, RPC grants and live Daily inventory. Migration files exist but do not prove deployment.
12. The historical `docs/Apparently You Bible UPDATED v1.4.rtf` is not the canonical current copy; Markdown Bible is. Sync/export RTF only when explicitly making a new document release.

## Recommended implementation order
A. Fix Daily evidence cap with unit/integration validation; no content publication.
B. Implement annual/founder purchase selection, truthful first-year renewal disclosures, and StoreKit/RevenueCat sandbox test matrix.
C. Verify/implement account deletion, privacy links and release compliance.
D. Run physical Build 17 regression; log pass/fail evidence.
E. Owner-review proposed Daily content and collisions, then stage approved release changes.
F. Inspect live Supabase and App Store Connect; produce final go/no-go checklist.
Do not change approved product copy, publish content, or submit a new build solely as a side effect of this audit.
