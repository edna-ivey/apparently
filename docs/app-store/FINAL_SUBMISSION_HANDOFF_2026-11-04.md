# Apparently You 1.0.0 — Final App Store Connect Handoff (2026-11-04)

Consolidates the existing drafts (`APP_STORE_METADATA_DRAFT_2026-10-20.md`, `REVIEW_NOTES_DRAFT_2026-10-20.md`,
`AGE_RATING_CONNECT_ANSWERS.md`, `APP_PRIVACY_DISCLOSURE_WORKSHEET.md`, `SUBMISSION_CONTROL_CENTER_2026-10-21.md`)
into one copy-paste source for App Store Connect, with every stale or placeholder item called out explicitly
rather than silently filled in. **This document does not certify anything itself — App Store Connect's own
questionnaires are the actual record.**

## 1. App name and subtitle

- Name: `Apparently You`
- Subtitle: `Personality, with a twist`

## 2. Description and keywords

Use the full description body from `APP_STORE_METADATA_DRAFT_2026-10-20.md` (MEET YOUR CREATURE / A LITTLE
SELF-DISCOVERY, EVERY DAY / COMPARE NOTES / GO APPARENTLY PRIVATE sections) verbatim — unchanged by this pass.

Keywords: `personality,quiz,quizzes,self discovery,traits,identity,questions,compatibility,avatar,fun`
**Owner action still open:** confirm this is ≤100 bytes once comma-joined (App Store Connect's hard limit) —
not independently re-measured in this pass.

## 3. Category and age rating

- Category: Primary `Lifestyle`. Secondary `Entertainment` — a recommendation from the draft, not confirmed;
  **owner selects in ASC.**
- Age rating questionnaire answers (unchanged, still current):
  - Violence: None (all subcategories)
  - Mature/Suggestive Themes: Infrequent/Mild
  - Sexual Content or Nudity: None currently live
  - Graphic Sexual Content and Nudity: None
  - Profanity or Crude Humor: Infrequent/Mild
  - Horror/Fear, Alcohol/Tobacco/Drug: None
  - Medical/Wellness, Chance-Based Activities: None
  - Unrestricted Web Access, Messaging/Chat, Social Media: No
  - User-Generated Content: owner judgment call, leaning No
  - **Advertising: this must now be answered "Yes"** — the 2026-10-20 draft says "No," written before AdMob
    shipped. Enter Yes.
  - Expected resulting tier: 9+ or 12+/13+ (Apple computes the final tier from the per-category answers above
    — do not hand-pick a tier).

## 4. App Privacy questionnaire — **BLOCKING, requires a real redo before submission**

`APP_PRIVACY_DISCLOSURE_WORKSHEET.md` is dated **2026-10-21** — one day *before* AdMob, first-party analytics,
and push notifications shipped (`ADVERTISING_AND_NOTIFICATIONS_SETUP_2026-10-22.md`). Its current answers
("No advertising/attribution SDK," "No tracking") are now **false** and were already flagged as needing a redo
in that later document, which was never acted on. Before submitting:

- **Advertising Data: No → Yes.** AdMob now collects this.
- **Usage Data: → Yes.** The first-party `analytics_events` table + AdMob impression/revenue data.
- **Identifiers: → Yes.** AdMob device identifiers; Expo push token (identifies a device, not a person, but
  ASC's own categories still expect it disclosed under Identifiers/Device ID as applicable).
- **ASC's "Does this app use data for tracking" toggle: No → Yes**, once ATT/AdMob is live in production
  (confirm against whichever ATT/attribution behavior the production build actually ships — see Phase 2 below;
  this app requests ATT and respects the answer, so tracking-linked advertising only occurs when the user
  grants it, but the toggle itself still needs to flip to Yes per Apple's own guidance for apps that use ATT
  at all).
- Everything else in the worksheet (User ID linked, Name/Age/Gender via `profiles`, user content server-side
  and RLS-governed, hard-deleted on account deletion, purchases linked, Sentry diagnostics scrubbed) remains
  accurate and does not need to change.
- Also pending, unchanged from the draft: **"Final Apple questionnaire values" and "Date entered/published"
  both require live ASC entry** — not something this pass can pre-fill.

**This is a genuine compliance gap, not a formality** — submitting the stale "No tracking" answer while AdMob
is live in production would misrepresent the app to Apple. Recommend redoing this questionnaire from scratch
in ASC using the Yes/Yes/Yes answers above, rather than trusting the 2026-10-21 draft.

## 5. Privacy Policy / Support / Marketing URLs

- Privacy Policy: `https://apparentlyyou.com/privacy-policy` (site live, confirmed)
- Marketing: `https://apparentlyyou.com`
- Support: `https://apparentlyyou.com/support`

**Note:** the live Privacy Policy text itself was flagged in `ADVERTISING_AND_NOTIFICATIONS_SETUP_2026-10-22.md`
as still containing "We do not use any advertising, analytics, or behavioral-tracking SDK" — the same staleness
as item 4 above, on the actual public page rather than just the ASC questionnaire. **Confirm whether that
sentence has been rewritten before submission; if not, this is a second instance of the same gap, on a page
Apple reviewers read directly.**

## 6. Review notes and reviewer access

Use `REVIEW_NOTES_DRAFT_2026-10-20.md`'s core note verbatim: the app creates an anonymous Supabase session on
first use, no login required — if ASC's "Sign-In Required" checkbox is on, turn it off.

**Two placeholders remain unfilled, verbatim from the draft — owner input required, not guessed here:**
- `Region/availability: [CONFIRM REGIONS AND ANY FEATURE DIFFERENCES].`
- `Reviewer contact: [CONFIRM CONTACT NAME, PHONE, EMAIL].`

**No demo account exists or is provided**, per the draft's own explicit instruction. If Apple Review needs one
with an expired-subscription state to test the paywall's "resubscribe" path, that needs a real one created and
entered in ASC's own secure App Review Information fields — not fabricated here.

## 7. Subscription review information

Preserve existing, owner-approved pricing and identifiers — **unchanged by this pass**:

| Item | Value |
|---|---|
| Monthly product id | `apparently_private_monthly` — $3.99/month |
| Annual product id | `apparently_private_annual` — $29.99/year standard |
| Founding Member intro | $19.99 first year, renews at $29.99/year |
| RevenueCat entitlement | `apparently_private` |
| RevenueCat offering | `default` |

Confirmed in code (`src/services/purchases-service.ts`): product/entitlement/offering identifiers match
exactly; `checkApparentlyPrivateAnnualIntroEligibility` calls StoreKit's real
`checkTrialOrIntroductoryPriceEligibility` and fails closed to "not eligible" on any error or API failure, so
an existing/returning subscriber is shown the plain annual price rather than a promised discount the SDK
couldn't actually confirm — this is enforced by Apple's own subscription-group eligibility rule, not a
client-side guess.

**Owner-only verification still needed (cannot be done from this environment):**
1. In App Store Connect → Apparently Private → Subscriptions, confirm the Founding Member introductory price
   is configured as exactly **$19.99, pay-up-front, 1 year, US territory**, attached to `apparently_private_annual`.
2. Confirm the **renewal price is $29.99/year** after the intro period.
3. Run one real **sandbox purchase as a NEW sandbox tester** and confirm the $19.99 intro price is offered.
4. Run one real **sandbox purchase as a tester who already redeemed a subscription in this group before**, and
   confirm they are shown $29.99 (not the intro price) — this is the live-system equivalent of the code check
   above. No sandbox transaction was run in this pass; nothing here should be read as claiming one was.
5. Submit the subscription itself for review alongside the binary (first-subscription submissions require this).

## 8. Export compliance, content rights, pricing/availability

- `app.json`: `"ITSAppUsesNonExemptEncryption": false` — matches "no custom/non-exempt encryption," the
  standard answer for an app using only Apple's own standard HTTPS/TLS. Confirm this still matches actual
  encryption use in Build 25 before entering it in ASC (not independently re-audited for new crypto usage in
  this pass — nothing in the recent notification/ads work adds any).
- Content rights: confirm in ASC that the owner holds rights to all shipped content (quiz copy, Creature/Relic
  artwork) — the repo doesn't expose a mechanism to verify this ASC field one way or the other; owner attests.
- Pricing and availability territories: **not recorded anywhere in this repo** — `SUBMISSION_CONTROL_CENTER_2026-10-21.md`
  lists this as item #8, still open as of that date. **Owner must choose and enter in ASC** (nothing to flag
  as stale here — it was simply never decided yet).
- Copyright/legal entity and mailing address: per the control-center doc, the legal operator was confirmed but
  IP-ownership/mailing-address fields were still open. Same status — owner-only ASC entry.

## 9. Manual release

Recommend **manual release** (not automatic) so the owner controls the exact go-live moment after Apple's
approval — matches the existing "no unattended production actions" practice this engagement has followed
throughout. Select this in ASC's version-release settings; nothing to configure in this repo for it.

## 10. Screenshots

- Six iPhone screenshots are already prepared by the owner (per this task's own confirmation) — no App Preview
  video will be used, consistent with ASC's "optional" treatment of preview videos.
- **iPad screenshots are not required.** `app.json` sets no `ios.supportsTablet` key (Expo's default is
  `false`), and no `ios.requiresFullScreen`/tablet-related config exists anywhere in this repo — this app does
  not declare iPad support, so App Store Connect's device-support-based screenshot requirement only applies to
  iPhone sizes. Confirmed from config, not assumed. Do not stretch iPhone images into fake iPad screenshots —
  not needed here regardless.

## 11. Build selection

Select the **production** EAS-profile binary (Build 25 or later — see the main completion report for its
exact number and ASC upload status) as the release build. **Never select a `diagnostic` or `testflight`
profile build as the public release** — those builds carry `EXPO_PUBLIC_DIAGNOSTIC_BUILD` /
`EXPO_PUBLIC_PRIVATE_DAILY_TESTER_ACCESS` flags and Google's test AdMob IDs, and must never reach the public
App Store listing.
