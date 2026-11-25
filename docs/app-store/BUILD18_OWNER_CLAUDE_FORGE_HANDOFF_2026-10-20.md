# Build 18 | Three-way launch handoff | October 20, 2026

## Confirmed
- Owner explicitly confirmed the updated Apple Developer Program License Agreement has been accepted. Do not ask again.
- Zoho aliases hello/support/privacy@apparentlyyou.com and hello@supergreatventures.com owner-confirmed configured and tested.
- Claude WP1–WP3 code and tests committed/pushed; no live Build 18 binary, migration, or deletion function deployed as of uploaded sprint report.
- App Store Connect screenshot audit showed Paid Apps Agreement, bank, W-9, DSA active; monthly product exists in Prepare for Submission; annual/intro not yet verified.

## Owner sequence
1. Create annual `apparently_private_annual` in the existing Apparently Private group, 1 year, $29.99 US base price; confirm monthly $3.99.
2. Add Apple Introductory Offer to annual: Pay Up Front, 1 year, $19.99 first year; verify eligibility limitations.
3. RevenueCat: annual and monthly products under `apparently_private` entitlement, annual/monthly packages in current default offering.
4. Decide legal operator name/address and individual-vs-organization seller preference; review final policies and App Store listing.
5. After deployment/build, run iPhone sandbox purchase/restore, account deletion, legal navigation, age and >3 traits regression.
6. Complete App Privacy questionnaire, age rating, listing/screenshots/review contact and submit after release gate.

## Claude sequence
1. Confirm repo branch HEAD and compare deployed Supabase/RevenueCat state without assuming.
2. Review SQL migration, Edge Function security and auth deletion cascade, backups and retention, and rollback/restore strategy. Do not deploy until owner explicitly approves target project and changes.
3. After approval, apply only reviewed migration, deploy delete-account function and run non-destructive integration smoke tests with disposable test users.
4. Verify StoreKit offering and intro eligibility for new and prior subscribers, premium entitlement and restore; avoid any production real-money purchase without explicit owner consent.
5. Create EAS Build 18, internal TestFlight submit, collect exact build IDs and commit hashes. No public release without owner signoff.
6. Publish approved web legal/support pages only after owner signs off on operator/contact and text.
7. Return status in APPROVED / IMPLEMENTED / DEPLOYED / TESTED / OPEN format and update Bible/continuity docs.

## Forge sequence
1. Review Claude's diff, migrations, tests and evidence independently.
2. Reconcile privacy worksheet with actual SDK and server data behavior, then prepare owner-ready legal review, not legal approval.
3. Refine metadata, review notes and screenshot inventory; preserve unapproved Daily workbook as draft.
4. Maintain go/no-go launch gates, timeline and Bible, clearly marking screenshots/claims versus live verification.

## Working schedule
Owner Apple/RevenueCat setup: 0.5–2 days; deployment and QA: 1–2 days parallel; metadata/legal: 1–2 days parallel; Build 18 TestFlight and acceptance: 1–2 days; working submission target 3–6 days after start; Apple review 1–3+ days variable.
