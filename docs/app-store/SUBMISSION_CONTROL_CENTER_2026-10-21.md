# Apparently You | App Store submission control center
Updated October 21, 2026. Source: actual repository docs/code and owner-provided device screenshots. This is the authoritative checklist; older Build 18 references are historical.

## Prepared now
- Product-page name, subtitle, promotional text, description, keyword proposal and screenshot story: APP_STORE_METADATA_DRAFT_2026-10-20.md.
- App Review notes: REVIEW_NOTES_DRAFT_2026-10-20.md.
- Privacy and terms draft text exists, but **not legally finalized** and in-app screens explicitly display draft banners.
- Existing owner-confirmed Zoho mail aliases: support@apparentlyyou.com and privacy@apparentlyyou.com.
- App config verified: version 1.0.0, bundle com.supergreatventures.apparently, buildNumber 19, ITSAppUsesNonExemptEncryption=false. Export compliance answer still must reflect actual encryption use.
- Screenshots provided by owner show active monthly $3.99 and annual $19.99 introductory / $29.99 renewal cards, but do not prove purchase, eligibility for another user, or live App Store Connect approval.
- Apple Developer agreement owner-confirmed accepted October 20. Paid Apps, banking, W-9, DSA previously shown active in owner screenshots; refresh before submission.

## Submission blockers, no unsupported green checks
1. Confirm **exact legal operator** and copyright holder, public business contact/address where required. Apple account is Individual; seller name will reflect individual legal name unless Apple account enrollment changes.
2. Audit Supabase, RevenueCat, Sentry, Expo and logs for data types, linkage, purposes, tracking, retention, deletion. Complete truthful App Privacy questionnaire. See APP_PRIVACY_DISCLOSURE_WORKSHEET.md.
3. Finalize privacy and terms wording and update BOTH app screens (privacy-policy.tsx and terms-of-use.tsx) and public website. The current screens visibly say PRE-PUBLICATION DRAFT, which must be removed only when facts are verified.
4. Verify production deployment and HTTPS responses for /support, /privacy, /terms. Source routes and Vercel rewrites exist; presence in git is not live proof.
5. Deploy and verify Supabase migrations 20261020010000 and 20261021010000, and delete-account Edge Function with account deletion test. Prior repo docs say staged but not deployed; do not deploy production data migrations without risk review/owner approval.
6. Confirm Apple App Store Connect subscription group has monthly and annual products, base prices and 1-year introductory offer, all correct localization and first-subscription review attachments. Test with eligible/ineligible sandbox accounts.
7. Complete App Store age-rating questionnaire from actual mature Private content; test under-18 gating. Do not assume questionnaire answers from a marketing label.
8. Select categories (recommended Lifestyle primary, Entertainment secondary), content rights, copyright, export compliance, digital goods questionnaire if shown, and availability territories.
9. Obtain actual final-build screenshots at ASC accepted device dimensions. Preview-screenshots from Expo Web are NOT valid evidence of final iOS behavior.
10. Verify latest TestFlight build after Creature viewer visual approval. Build 19 had previously been queued, but this repo now contains Option A UI changes beyond the Build 19 source commit. Confirm final build selection before public review.
11. Fill reviewer contact name, phone, email, review access and notes. No fictitious login credentials or inaccessible pre-authenticated devices.
12. Complete live App Store Connect metadata entry and verify all required fields saved, select manual release if desired, submit first subscriptions with app version, and only then submit for App Review after owner authorizes public submission.

## Key project links
App Store Connect: https://appstoreconnect.apple.com/
Apple product page metadata: https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information
Apple App Review info: https://developer.apple.com/help/app-review/before-submitting-for-review/complete-review
Apple screenshots: https://developer.apple.com/help/app-review/guideline-reference/2-3-3-screenshots/
Apple Digital Goods questionnaire: https://developer.apple.com/help/app-store-connect/manage-app-information/complete-the-digital-goods-and-services-questionnaire

## Scope and provenance
All copy may be pasted only after legal/factual review. This audit does not assert App Store Connect was modified, website deployed, production Supabase changed, or app submitted. Avoid claiming automated validators prove device transactions.
