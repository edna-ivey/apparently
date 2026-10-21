# Apparently You | App Store submission control center
Updated October 21, 2026 (afternoon pass). Source: actual repository docs/code, live Supabase
read-only inspection, HTTPS status checks from connected Mac, and owner-provided device
screenshots. This is the authoritative checklist; older Build 18 references are historical.

## Verified live October 21, 2026 (afternoon pass -- supersedes the morning entries below where they conflict)
- `https://apparentlyyou.com/privacy`, `/terms`, and `/support` now return **HTTP 200** with
  the real finalized content (fresh `curl` checks run AFTER deploying, body content verified,
  not just status code). Deployed via `npx vercel --prod --yes`, deployment
  `dpl_ETi2FoaZ2AiR6CbRq9JGunZgo5ZG`, aliased to `apparentlyyou.com`. Blocker #3/#4 below are
  RESOLVED.
- Production Supabase migrations `20261021133214`/`20261021133217` (the same DDL originally
  staged as `20261020010000`/`20261021010000`, applied under different Supabase-API-generated
  remote version numbers) ARE applied -- confirmed live via fresh `supabase migration list`.
  Local migration files renamed to match exactly; zero local/remote mismatch remains. Blocker
  #5's migration half is RESOLVED.
- `delete-account` Edge Function IS deployed, ACTIVE, `verify_jwt=true` -- confirmed live via
  fresh `supabase functions list`, and further LIVE-TESTED end to end against production with
  a disposable account `scripts/test-delete-account-integration.ts` creates and destroys
  itself (never an existing user): real cascade deletion confirmed, honest failure on a
  second/invalid-token attempt confirmed. Blocker #5 is fully RESOLVED.
- `privacy-policy.tsx`/`terms-of-use.tsx`/`support.tsx` no longer show PRE-PUBLICATION DRAFT --
  genuinely re-verified against live app/infrastructure (account-deletion cascade, Sentry's
  real config, full service inventory, share-link/age-gate behavior), not republished
  unchanged. Blocker #3 fully RESOLVED. See Bible §91 for the complete writeup.
- Creature viewer close-button bug (reported separately by the owner) fixed this same pass --
  see Bible §91. NOT verified on a real device/simulator (unavailable in this environment);
  owner should re-test this specific scenario before considering it fully resolved.

## Verified live October 21, 2026 (morning pass -- historical, mostly superseded above)
- Owner elects to submit using existing Individual Apple Developer membership now. D-U-N-S and organization conversion can occur later; do not block current submission for it.
- Working tree has pre-existing uncommitted `src/app/creature-read.tsx` and preview artifacts. Do not overwrite or include them in unrelated App Store documentation commits. (Now committed this afternoon pass -- see Bible §91.)
- Production migrations/Edge Function deployment require owner approval after risk and rollback review -- that approval was already given and executed in an earlier pass per `docs/app-store/PRODUCTION_ACCOUNT_DELETION_DEPLOYMENT_2026-10-21.md`; this afternoon pass only independently re-verified it live and reconciled the local migration filenames.

## Prepared now
- Product-page name, subtitle, promotional text, description, keyword proposal and screenshot story: APP_STORE_METADATA_DRAFT_2026-10-20.md.
- App Review notes: REVIEW_NOTES_DRAFT_2026-10-20.md.
- Privacy and terms draft text exists, but **not legally finalized** and in-app screens explicitly display draft banners.
- Existing owner-confirmed Zoho mail aliases: support@apparentlyyou.com and privacy@apparentlyyou.com.
- App config verified: version 1.0.0, bundle com.supergreatventures.apparently, buildNumber 19, ITSAppUsesNonExemptEncryption=false. Export compliance answer still must reflect actual encryption use.
- Screenshots provided by owner show active monthly $3.99 and annual $19.99 introductory / $29.99 renewal cards, but do not prove purchase, eligibility for another user, or live App Store Connect approval.
- Apple Developer agreement owner-confirmed accepted October 20. Paid Apps, banking, W-9, DSA previously shown active in owner screenshots; refresh before submission.

## Submission blockers, no unsupported green checks
1. Legal operator confirmed by owner: **Super Great Ventures LLC**, now stated throughout the
   finalized Privacy Policy/Terms of Use/Support (in-app and live on the website). **Still
   open:** verify LLC ownership of app IP and any required business mailing address (privacy
   policy currently states US privacy law doesn't require a mailing address for this kind of
   policy -- add one if the owner wants it included). Apple account is Individual; seller name
   will reflect the individual legal name unless Apple account enrollment changes.
2. Audit Supabase, RevenueCat, Sentry, Expo and logs for data types, linkage, purposes, tracking, retention, deletion. **DONE** this afternoon pass -- see `APP_PRIVACY_DISCLOSURE_WORKSHEET.md`'s "Verification findings, 2026-10-21" section for the resolved answers. Still requires actually entering/certifying them in live App Store Connect (no ASC access from this environment).
3. ~~Finalize privacy and terms wording...~~ **RESOLVED** this afternoon pass -- see above.
4. ~~Verify production deployment and HTTPS responses...~~ **RESOLVED** this afternoon pass -- see above.
5. ~~Deploy and verify Supabase migrations... delete-account Edge Function with account deletion test...~~ **RESOLVED** this afternoon pass -- see above.
6. Confirm Apple App Store Connect subscription group has monthly and annual products, base prices and 1-year introductory offer, all correct localization and first-subscription review attachments. Test with eligible/ineligible sandbox accounts. **Still open** -- no RevenueCat dashboard/App Store Connect credential exists in this environment; code-side mapping/eligibility logic re-confirmed correct in earlier passes but the live dashboard configuration itself remains unverified from here.
7. Complete App Store age-rating questionnaire from actual mature Private content; test under-18 gating. Do not assume questionnaire answers from a marketing label. **Still open.**
8. Select categories (recommended Lifestyle primary, Entertainment secondary), content rights, copyright, export compliance, digital goods questionnaire if shown, and availability territories. **Still open.**
9. Obtain actual final-build screenshots at ASC accepted device dimensions. Preview-screenshots from Expo Web are NOT valid evidence of final iOS behavior. **Still open** -- all screenshots produced by Claude sessions so far (including this pass's close-button evidence) are Expo Web previews, explicitly not a substitute for real-device ASC screenshots.
10. Verify latest TestFlight build after Creature viewer visual approval. Build 19 (`5fcfac77-a51e-46c5-beb8-8682255f37e1`) was delivered to TestFlight before the Option A redesign and this pass's close-button fix/Creature enlargement existed in the repo -- **the currently-live TestFlight build does NOT contain the latest Creature viewer work.** A new build is required before those changes reach a real device; per explicit instruction, no EAS build was created this pass. **Still open**, now more specifically scoped.
11. Fill reviewer contact name, phone, email, review access and notes. No fictitious login credentials or inaccessible pre-authenticated devices. **Still open.**
12. Complete live App Store Connect metadata entry and verify all required fields saved, select manual release if desired, submit first subscriptions with app version, and only then submit for App Review after owner authorizes public submission. **Still open.**

## Key project links
App Store Connect: https://appstoreconnect.apple.com/
Apple product page metadata: https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information
Apple App Review info: https://developer.apple.com/help/app-review/before-submitting-for-review/complete-review
Apple screenshots: https://developer.apple.com/help/app-review/guideline-reference/2-3-3-screenshots/
Apple Digital Goods questionnaire: https://developer.apple.com/help/app-store-connect/manage-app-information/complete-the-digital-goods-and-services-questionnaire

## Scope and provenance
All copy may be pasted only after legal/factual review. This audit does not assert App Store Connect was modified, website deployed, production Supabase changed, or app submitted. Avoid claiming automated validators prove device transactions.
