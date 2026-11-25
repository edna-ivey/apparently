# Apparently You | App Privacy Audit & Age Eligibility Verification
Prepared 2026-10-21. Evidence-based audit of the actual repository, production Supabase
project, and installed SDKs — not a recollection of prior docs, though it cross-references and
in two places corrects them (see §11). Every claim below cites the exact file, migration, or
live command that supports it. This document does not itself enter or certify anything in App
Store Connect (no ASC access exists in this environment); it is the evidence the owner enters
those answers from.

**Locked policy this audit verifies against** (owner-set, not re-opened here): Apple-calculated
age rating 9+; minimum account age 13; ages 13–17 get the standard app including Apparently
Private; "Private Private" is 18+ only and must be completely hidden/inaccessible under 18; no
under-13 accounts or COPPA parental consent for launch.

---

## 1. Executive summary

The age-eligibility design is sound and, with two fixes made in this pass, now holds up under
direct code/production inspection — not just at the one obvious entry point, but through deep
links, direct routes, retroactive accounts, and the one path that leaks content publicly.
Two real gaps were found and fixed this pass (code changes made; one database migration
**staged, not applied** pending owner authorization):

1. **Fixed (code, committed):** the root layout unconditionally created a real anonymous
   Supabase account on every app launch, including the very first launch — *before* the
   onboarding age-gate step had even rendered. This contradicts "age gate blocks access before
   account creation." See §2.3.
2. **Fixed (code, committed) + staged migration (not applied):** the public, anonymous,
   no-session-required shared-result page (`/s/[token]`) had no restriction preventing an 18+
   subscriber from sharing their completed "Private Private" result — handing its
   mature/suggestive-themed content to a link recipient of any age. See §2.6.

No advertising SDK is installed, initialized, or active anywhere in the codebase (§8). No
analytics/tracking SDK exists (§3). The one diagnostic SDK (Sentry) is configured with explicit
privacy guardrails, verified from its own `PrivacyInfo.xcprivacy` manifest and this app's actual
init code (§7). RevenueCat's configuration matches the confirmed App Store Connect product IDs
and pricing exactly (§7). All three live legal/support pages return HTTP 200 with finalized
content and accurately state the locked age policy — except the Terms of Use, which states none
of it at all (§9, flagged for owner decision, not fixed here since it's a legal-text change).

39/39 project validators, `tsc`, and `lint` all pass after the fixes (§12).

---

## 2. Verified age eligibility behavior

Walked each of the 11 surfaces named in the audit brief, against the actual code and (where a
database check was relevant) the live production schema.

### 2.1 Onboarding age selection and validation
`src/app/onboarding.tsx`'s `age-gate` step is the first real question after the Welcome screen,
before any other input. Three choices: Under 13 / 13 to 17 / 18 or older
(`AgeGateStep`/`handleAgeGateAnswer`, lines 138–146, 337–363). Under 13 sets a local terminal
`ageGateResult: 'blocked'` state and returns — `setAgeEligibilityOnce` (the only function that
creates a session) is never called for that answer. 13-17/18+ call `setAgeEligibilityOnce`
and continue into the rest of onboarding.

### 2.2 Age stored in Supabase and local state
Two genuinely separate fields, confirmed not to be conflated anywhere in code:
- `age_eligibility` (`'13to17' | '18plus'`, never `'under13'`) — the legal gate, written once by
  `setAgeEligibilityOnce` (`src/data/age-eligibility.ts`) to local storage (AsyncStorage/
  localStorage) and, best-effort, to `public.profiles.age_eligibility` via `upsertAgeEligibility`.
- `ageRange` (`'13-17' | '18-24' | ...`) — the pre-existing demographic field in
  `src/data/onboarding.ts`, personalization only, edited freely from Settings at any time, never
  read by any gate.

### 2.3 Account creation and anonymous authentication — GAP FOUND AND FIXED
`setAgeEligibilityOnce` is the only call site that creates a session for an age answer, and it
is never reached for "Under 13" — confirmed by reading `handleAgeGateAnswer` directly.

However, a **separate, unconditional** session-bootstrap effect in the app's root layout
(`src/app/_layout.tsx`) was firing on **every launch of the app, for any route, regardless of
onboarding progress** — including a brand-new install's very first launch, before the
onboarding screen (let alone its age-gate step) had rendered at all. Confirmed this was live in
production, not just a theoretical path: `EXPO_PUBLIC_REMOTE_DAILY_ENABLED=true` in the real EAS
production environment (`npx eas-cli env:list --environment production`), which is exactly the
flag this effect is gated on. `(tabs)/_layout.tsx` already blocks every *consumer tab screen*
until onboarding completes, but the root effect sits **above** that gate and was unaffected by
it.

**Fixed**: `_layout.tsx` now also requires `onboardingState.completed` (via the existing reactive
`useOnboardingState()` store) before running the bootstrap. A fresh install now creates no
session of any kind until onboarding genuinely completes — which, by construction, a
self-identified under-13 answer never does. A device that already completed onboarding in a
prior session is unaffected (the flag is true from first render after hydration). Covered by a
new assertion in `scripts/validate-age-eligibility-gate.ts` (§6).

**Residual, not fixed in this pass**: because this bug has been live since before this audit, it
is possible that real anonymous `auth.users` rows already exist in production for devices that
opened the app and abandoned onboarding before this fix — including, potentially, a device that
would have answered "Under 13" had it reached that screen. These rows carry **no profile, no
age, no content, no PII of any kind** — they are indistinguishable from any other
abandoned/incomplete-onboarding session (an adult who closed the app before finishing). There is
no way to identify which, if any, belong to a self-identified minor, because no such
self-identification was ever recorded for them. Recommend (not implemented here, out of scope
for this pass): a periodic cleanup of anonymous `auth.users` rows that never reach a completed
`profiles` row past some retention window, as general hygiene — this would also reduce the
residual question above for all future abandoned sessions, not just this one.

### 2.4 Existing users without age information
`age_eligibility IS NULL` is treated as **not adult-eligible everywhere** — client
(`isAdultEligible`) and server (`is_adult_eligible()`, `coalesce(..., false)`) both fail closed.
A null-state device sees no "Private Private" content, but (unlike a confirmed `13to17`) is
offered a one-time retroactive confirmation prompt (`private.tsx`'s `ageConfirmVisible` modal) —
discoverable, not silently and permanently locked out.

### 2.5 Users changing their age
`age_eligibility` is immutable once set, enforced in two independent places: client
(`setAgeEligibilityOnce` never overwrites an already-set local value) and server (a `BEFORE
UPDATE` trigger, `profiles_age_eligibility_immutable`, raises an exception on any attempt to
change a non-null value — confirmed applied to production, see §6/§11). A raw client PATCH
bypassing the app entirely still cannot change it. The demographic `ageRange` remains freely
editable in Settings, as intended — confirmed it is a different column with no gating effect.

### 2.6 App restarts, reinstalls, session restoration — related gap, see 2.3
A restart/relaunch persists both the local cache and the server row; behavior unchanged, now
correctly gated per §2.3. A reinstall clears local storage and (since the anonymous session
itself is also device-local) results in a genuinely new anonymous identity — onboarding, and its
age gate, runs again from scratch for that new identity, which is the correct and already-
intended behavior, not a gap.

### 2.7 All navigation paths to Private Private
`private.tsx`: the "Private Private. 😈" category pill is filtered out of the visible pill row
entirely for a confirmed `13to17` device (`visibleCategoryPills`); every locked teaser in that
category is filtered out of `visibleLockedEntries`; the one real quiz
(`private-private-trouble`) is filtered out of the subscriber's playable `premiumIds` list. A
13-17 year old sees **no tile, no teaser, no pill, no card** for this category anywhere on this
screen — confirmed by reading all three filter predicates, each independently checking
`isAdultEligible`.

### 2.8 Deep links and direct route access
`quiz/[quizId].tsx`'s gate (`definition.id === 'private-private-trouble' && !isAdultEligible(...)`)
runs as an early return **before** any question/intro rendering, and applies regardless of how
the route was reached — in-app navigation, a universal link, or a raw deep link into
`/quiz/private-private-trouble` all hit the identical check, since it is a property of the route
component itself, not of how navigation arrived there. Confirmed: no alternate render path
(`step === 'intro'`, `currentQuestion`) is reachable before this check.

### 2.9 Quiz discovery, recommendations, search, and result history
`src/app/(tabs)/explore.tsx` (the only other quiz-listing/discovery surface) iterates a
hardcoded `QUIZ_CARD_STYLE` array of free-quiz ids only, typed as `FreeQuizCategory` — confirmed
`private-private-trouble` (category `PrivateQuizCategory`) cannot type-check into that list and
does not appear in it. There is no text-search feature anywhere in the app. Result history
(`useQuizResults`) only ever shows a completion that genuinely exists, which — per §2.8's
dual gate (premium + 18+) — can only exist for an account that was both subscribed and adult-
eligible at the time of completion.

### 2.10 Backend/API access to Private Private content
Two independent server-side gates on the one function that can persist a completion,
`submit_quiz_result`: the pre-existing premium-entitlement check, and (migration
`20261018020000_age_eligibility_gate.sql`, confirmed **applied to production**, see §11) an
additive `is_adult_eligible()` check specific to `private-private-trouble`, run alongside, never
instead of, the premium check. Verified live: `supabase migration list` shows this migration's
version present in both local and remote lists with a matching timestamp, and a live anonymous
RPC call to `is_adult_eligible` against production returned a real `false` result (not a
"function does not exist" error), confirming the function genuinely exists in production exactly
as written.

### 2.11 Cached data, notifications, and shared content — GAP FOUND, FIXED
No push-notification feature exists anywhere in this app (`grep` for `expo-notifications`/
`PushNotification` across `src` and `package.json` returns nothing) — nothing to leak there.
Local cached data: `apparently:age-eligibility` is included in `account-deletion-service.ts`'s
`LOCAL_USER_DATA_KEYS`, cleared on account deletion.

**Shared content was the real gap.** `/s/[token]` (`src/app/s/[token].tsx`) is, by design, a
fully public web page reachable with **zero session and zero age check** — that is its intended
behavior for every other quiz, so a friend with no install can view a shared result. Neither
`create_quiz_share` nor `get_shared_quiz_result` (`20260919010000_quiz_result_sharing.sql`)
special-cased `private-private-trouble`, and the quiz runner's "Share this →" button rendered
unconditionally for every completed result, structuredRead ones (which is what
`private-private-trouble` uses) included. This quiz's actual result copy is mature/suggestive-
themed (flirting, attraction, chemistry — read directly from
`src/data/quizzes/private-private-trouble.ts`), and the public share page renders exactly that
copy (`THE READ` + any `shareKicker`) to whoever opens the link. An 18+ subscriber who completed
this quiz and tapped Share could therefore hand that content to a recipient of **any age**,
completely outside the 18+ gate.

**Fixed, client-side (code, committed):** `src/app/quiz/[quizId].tsx` now computes
`isShareRestricted = definition.id === 'private-private-trouble'`; `handleShare` and
`handleAskForNotes` both refuse to run for a restricted result, and `ResultScreen` is passed
`canShare={!isShareRestricted}`, which hides the Share button and the "THEY HAVE NOTES." invite
entirely (never merely disables them) for this one quiz.

**Fixed, server-side — STAGED, NOT APPLIED, requires owner authorization:**
`supabase/migrations/20261021150000_block_private_private_trouble_sharing.sql` makes
`create_quiz_share` reject `private-private-trouble` outright, and makes
`get_shared_quiz_result` exclude it even for a share row that might already exist (there is no
RPC to enumerate `quiz_shares` by `quiz_id` from this environment to confirm whether one does —
the fix is correct regardless of whether one does). The client fix alone is not sufficient per
this audit's own standard — a direct RPC call could still create/read a share — so this
migration is the real enforcement; apply it before shipping the client fix's build, or at minimum
before this build reaches any tester who could complete and share this quiz.

---

## 3. All collected data and third-party processors

Full dependency inventory (`package.json`, `package-lock.json`) cross-checked against actual
imports in `src/`:

| Processor | SDK / version | What it actually touches |
|---|---|---|
| Supabase | `@supabase/supabase-js` ^2.116.0 | Anonymous auth; `profiles`, `daily_answers`, `quiz_results`, `personality_evidence`, `personality_pole_evidence`, `quiz_shares`, `compare_responses`, `user_entitlements`, `tester_access_grants` |
| RevenueCat | `react-native-purchases` ^10.10.1 | Subscription entitlement sync, keyed to the same anonymous Supabase UID |
| Sentry | `@sentry/react-native` ~7.13.0 | Crash/error diagnostics only (see §7) — the only file importing it is `src/services/observability.ts` (confirmed: `grep -rln "Sentry\." src` returns exactly one file) |
| Apple (StoreKit, via RevenueCat) | n/a | Payment processing — card data never reaches this app's code |
| Expo/EAS, Vercel | n/a | Build/deploy and website hosting infrastructure, not runtime data processors |

No analytics SDK, no advertising SDK, no attribution SDK, no device-fingerprinting SDK exists
(checked by name for Firebase, Mixpanel, Amplitude, Segment, AppsFlyer, Adjust, Branch, PostHog,
AdMob, Meta/Facebook Audience Network, AppLovin, Unity Ads — none present). `expo-device` is a
declared dependency with **zero imports anywhere in `src`** (confirmed by `grep`) — almost
certainly a transitive requirement of another Expo module; it collects nothing because nothing
in this app calls it.

### Collected / stored / transmitted / linked / retained, by category
1. **Collected by the developer (this app's own code → Supabase):** profile fields (name, age
   range, gender/custom gender), quiz/Daily answers and results, personality evidence, Creature/
   Relic progression, comparison responses, share tokens.
2. **Collected by third-party SDKs:** RevenueCat (purchase/entitlement records, linked to the
   same anonymous UID); Sentry (crash/diagnostic events, see §7 for exactly what fields).
3. **Stored only locally (never transmitted):** nothing persists local-only once a session
   exists — every `LOCAL_USER_DATA_KEYS` entry has a server-side counterpart it mirrors/caches,
   per `account-deletion-service.ts`'s own list.
4. **Transmitted off-device:** everything in row 1 (to Supabase), row 2 (to RevenueCat/Apple,
   Sentry).
5. **Linked to a user/account:** all of the above, via the single anonymous Supabase UID
   (confirmed as RevenueCat's own `appUserID` in `purchases-service.ts`'s header comment) —
   **except** Sentry events, which never receive this UID (no `Sentry.setUser()` call exists
   anywhere in `src`, confirmed by the same single-file-import check above).
6. **Used for cross-app/cross-site tracking:** none. No SDK present is capable of it, and
   RevenueCat's and Sentry's own `PrivacyInfo.xcprivacy` manifests both declare
   `NSPrivacyTracking: false`.
7. **Retained after account deletion:** RevenueCat's customer record and Apple's own
   subscription/transaction history (Apple requires this for revenue reporting regardless of
   app-side deletion — disclosed in the Privacy Policy and Terms); any Sentry event already sent
   before deletion (a separate third-party system with its own retention, outside this app's
   reach); routine pre-deletion database backups until they age out of Supabase's own retention.
   Everything else is hard-deleted via cascade (see §10).

---

## 4. Exact Apple checkbox selections

Apple's current data-type taxonomy and the collect/link/track definitions were confirmed live
from Apple's own App Privacy Details documentation before writing this table, not recalled from
memory.

| Apple category | Select? | Evidence | Confidence |
|---|---|---|---|
| Contact Info — Name | **Yes** | `src/services/profile-service.ts`; stored server-side in `public.profiles` | Verified |
| Contact Info — Email Address | No | No email collected anywhere — anonymous auth only | Verified |
| Contact Info — Phone Number | No | Not collected | Verified |
| Contact Info — Physical Address | No | Not collected | Verified |
| Contact Info — Other User Contact Info | No | Not collected | Verified |
| Health & Fitness — Health | No | No HealthKit/health API anywhere in `package.json` or `src` | Verified |
| Health & Fitness — Fitness | No | Same | Verified |
| Financial Info — Payment Info | No | Apple's own purchase sheet handles payment; RevenueCat SDK never exposes card data to host-app code (`purchases-service.ts` header comment) | Verified |
| Financial Info — Credit Info | No | Not collected | Verified |
| Financial Info — Other Financial Info | No | Not collected | Verified |
| Location — Precise Location | No | No location permission/API anywhere | Verified |
| Location — Coarse Location | No | Same | Verified |
| Sensitive Info | **No** (judgment call, see below) | Self-reported gender/custom gender doesn't clean-match Apple's Sensitive Info definition (racial/ethnic origin, sexual orientation, pregnancy, disability, religion, union membership, political opinion, genetic/biometric data, criminal record) | **Owner should confirm** |
| Contacts | No | No contacts permission/API anywhere | Verified |
| User Content — Emails or Text Messages | No | Not applicable | Verified |
| User Content — Photos or Videos | No | `expo-media-library` is write-only (Save to Photos) — the app never reads/uploads the user's existing photos; the Creature image is app-generated, not user-supplied | Verified |
| User Content — Audio Data | No | No audio capture anywhere | Verified |
| User Content — Gameplay Content | No | Not a game; quiz/Daily activity classified as Other User Content instead (below) | Verified |
| User Content — Customer Support | No | Support/privacy contact is a plain `mailto:` link (`src/app/support.tsx`) — the app never collects or transmits support-request content itself | Verified |
| User Content — Other User Content | **Yes** | Quiz/Daily answers, personality evidence, Creature/Relic progression, comparison results, optional profile fields | Verified |
| Activity — Browsing History | No | Not collected | Verified |
| Activity — Search History | No | No search feature exists in the app | Verified |
| Identifiers — User ID | **Yes** | The anonymous Supabase auth UID, also used as RevenueCat's `appUserID` | Verified |
| Identifiers — Device ID | No | No IDFA/IDFV/device-fingerprinting code found; `expo-device` unused (see §3) | Verified |
| Purchases | **Yes** | RevenueCat entitlement + Apple transaction records, linked to the same User ID | Verified |
| Usage Data — Product Interaction | No | No analytics/engagement SDK present | Verified |
| Usage Data — Advertising Data | No | No advertising SDK present | Verified |
| Usage Data — Other Usage Data | No | Same | Verified |
| Diagnostics — Crash Data | **Yes** | Sentry, active only when `EXPO_PUBLIC_SENTRY_DSN` is configured (it is, in production — see §7) | Verified |
| Diagnostics — Performance Data | **Yes** | Sentry performance tracing (`tracesSampleRate`), same config | Verified |
| Diagnostics — Other Diagnostic Data | **Yes** | Structural error codes, screen/operation tags — see §7 for the exact allow-listed fields | Verified |
| Surroundings — Environment Scanning | No | No camera/AR/scanning feature exists | Verified |
| Body — Hands | No | No AR/body-tracking feature exists | Verified |
| Body — Head | No | Same | Verified |
| Other Data | No | No category not already covered above | Verified |

---

## 5. Exact follow-up answers for each selected data type

For every "Yes" row above, Apple's next screens ask: linked to identity, used for tracking,
collected for third-party advertising, developer advertising/marketing, analytics, product
personalization, app functionality, or other purposes.

| Data type | Linked? | Tracking? | 3rd-party ads? | Dev ads/marketing? | Analytics? | Product personalization? | App functionality? | Other? |
|---|---|---|---|---|---|---|---|---|
| Name | Yes | No | No | No | No | No | **Yes** | No |
| Other User Content | Yes | No | No | No | No | **Yes** | **Yes** | No |
| User ID | Yes | No | No | No | No | No | **Yes** | No |
| Purchases | Yes¹ | No | No | No | No | No | **Yes** | No |
| Diagnostics (all three) | No | No | No | No | No | No | **Yes** | No |

¹ RevenueCat's own manifest generically declares purchase history as "not linked" (an
SDK-level default claim), but *this app's actual practice* links it — the same anonymous UID
used everywhere else is the one passed as RevenueCat's `appUserID`. Apple's questionnaire asks
about the app's actual practice, not the SDK's generic default, so **Yes** is the evidence-
correct answer here.

### Step-by-step for App Store Connect
1. App Privacy → Data Types: check exactly **Name, Other User Content, User ID, Purchases,
   Crash Data, Performance Data, Other Diagnostic Data**. Leave every other box unchecked.
2. For each checked type, answer the follow-up screen using the table immediately above.
3. For **Name**, **Other User Content**, **User ID**, and **Purchases**: "Is this data linked to
   the user's identity?" → **Yes**.
4. For **Crash Data / Performance Data / Other Diagnostic Data**: "Is this data linked to the
   user's identity?" → **No** (see §7 for why — no `Sentry.setUser()` call exists anywhere).
5. "Is this data used for tracking?" → **No** for every type, no exceptions.
6. Purpose selection: Name/User ID/Purchases/Diagnostics → App Functionality only. Other User
   Content → App Functionality **and** Product Personalization (it is what drives the
   Creature/Read personalization itself).
7. The single top-level "Does this app track users?" toggle → **No**.
8. Before certifying, resolve the one flagged judgment call (Sensitive Info / gender, §4) with
   the owner.

### Apple's optional disclosure exceptions
None apply here. The exceptions (data collected only for security/fraud purposes without further
use, data collected but never linked and never leaving the device, account-authentication data
used solely for sign-in, etc.) are each narrower than what this app actually does with the data
in question — e.g. the anonymous User ID is linked and used for the app's core functionality, not
solely sign-in, so it doesn't qualify for the sign-in-only exception.

---

## 6. Evidence references for every selection

Every claim above traces to one of: a direct file/line read (cited inline in §2–§5), a live
command run against production during this pass (`supabase migration list`, `supabase functions
list`, `eas-cli env:list --environment production`, a direct anonymous RPC call to
`is_adult_eligible`, `curl` against the three live legal/support URLs), or
`scripts/validate-age-eligibility-gate.ts`, extended this pass with three new sections (25
assertions total, all passing — see §12) covering: the pre-age-gate session-creation fix, the
sharing-restriction fix (client and staged server migration), and the pre-existing client/server
age model this audit re-verified rather than re-built.

---

## 7. SDK and RevenueCat findings

**RevenueCat** (`react-native-purchases` ^10.10.1): `appUserID` is set to the same stable
anonymous Supabase auth UID (`purchases-service.ts` lines ~187-220) — never a separate identifier,
never device-derived. Product/offering/entitlement constants match the confirmed App Store
Connect configuration exactly:

| Confirmed value | Code constant |
|---|---|
| Entitlement `apparently_private` | `APPARENTLY_PRIVATE_ENTITLEMENT_ID` |
| Offering `default` | `APPARENTLY_PRIVATE_OFFERING_ID` |
| Monthly `apparently_private_monthly` ($3.99/mo) | `APPARENTLY_PRIVATE_MONTHLY_PRODUCT_ID` |
| Annual `apparently_private_annual` ($29.99/yr, $19.99 intro first year) | `APPARENTLY_PRIVATE_ANNUAL_PRODUCT_ID` |

No RevenueCat/Apple integration collects device identifiers or IP-derived information beyond
what RevenueCat's SDK does on its own (declared in its own manifest as not linked, not tracking).

**Sentry** (`@sentry/react-native` ~7.13.0), `src/services/observability.ts` — the only file in
`src` that imports it:
- `sendDefaultPii: false` — no IP address, no device-contact auto-attach.
- `attachScreenshot: false` — no screen capture at crash time.
- `enableAutoSessionTracking: true` — a crash-free-session rate (a count), not a recording.
- No session-replay integration configured.
- `beforeBreadcrumb`/`beforeSend` strip HTTP breadcrumbs down to method+URL+status, redact
  Authorization/apikey/cookie headers, and delete request bodies/cookies from any event.
- What's actually sent: app version/build/environment, a backend-operation tag, a structural
  Postgres/Supabase error code, a high-level screen name, and stack traces — never quiz answer
  text, personality results, or any other user content.
- No `Sentry.setUser()` call exists anywhere in this codebase — confirmed by the single-file-
  import check above, which also means no identifier is ever attached to a Sentry event from
  this app's side (Sentry's own manifest separately declares its collected types as not linked).

This affects Apple's Purchases, Identifiers, Usage Data, and Diagnostics categories exactly as
reflected in §4/§5 — Usage Data is unaffected (RevenueCat/Sentry are not usage-analytics SDKs).

---

## 8. Advertising findings

**No advertising SDK is installed, initialized, or active anywhere in this codebase**, confirmed
three independent ways:
1. `package.json`/`package-lock.json`: no AdMob, Meta/Facebook Audience Network, AppLovin, Unity
   Ads, or any other ad-network SDK present.
2. `app.json`: no `SKAdNetwork`, `NSUserTrackingUsageDescription`,
   `GADApplicationIdentifier`, or similar ad-related config anywhere.
3. `grep` across `src/` and `app.json` for `AppTrackingTransparency`,
   `requestTrackingPermission`, `IDFA`, `AdvertisingIdentifier` — zero matches.

The owner has stated an intent to monetize free users with advertising **in the future**. Per
this audit's own instruction, that intent is reported as exactly what it is — a future plan, not
a current practice — and nothing hypothetical is disclosed as though it already occurs. No
advertising code was installed or activated during this audit.

**What adding advertising later will require, flagged now so it isn't missed:**
- A new App Tracking Transparency prompt (`NSUserTrackingUsageDescription` +
  `requestTrackingPermissionsAsync`) before any cross-app/cross-site ad identifier use.
- New App Privacy disclosures: Usage Data (Advertising Data) and, depending on the network
  chosen, a "Yes" on the tracking toggle — a materially different answer than today's.
  App Privacy section (3), (4), and (5) of this document will need re-doing, not just appending
  to.
  - A Privacy Policy rewrite (today's explicitly states "We do not use any advertising, analytics,
  or behavioral-tracking SDK" — that sentence becomes false the moment any ad SDK ships).
  - A re-review of whether ad content itself needs age-based restriction given the under-18
  population this app explicitly serves (ages 13–17) — advertising content/category restrictions
  for a mixed-age audience are a real, separate design question from this audit's data-collection
  scope.

---

## 9. Privacy policy and legal URL verification

All three live and returning real, finalized content as of this pass (fresh `curl`, body content
read, not just status code):

| URL | Status | Content check |
|---|---|---|
| `https://apparentlyyou.com/privacy` | HTTP 200 | No DRAFT/PRE-PUBLICATION marker. Accurately states: minimum age 13; no account/data collection for a self-identified under-13 user; the 13–17 demographic choice is personalization-only and distinct from the 18+ "Private Private" gate; Supabase/RevenueCat/Sentry named as processors with accurate scope; retention/deletion described accurately (matches §10); "We do not use any advertising, analytics, or behavioral-tracking SDK" (true, confirmed §8); privacy@/support@ contacts present. |
| `https://apparentlyyou.com/terms` | HTTP 200 | No DRAFT marker. Accurately states subscription pricing ($3.99/mo, $29.99/yr, $19.99 Founding Member intro), account deletion, Apple ToS incorporation. **Gap: contains no age-eligibility/minimum-age clause at all** — the Privacy Policy states the 13+ minimum, but the Terms of Use (the actual usage agreement) doesn't. Not fixed in this pass — this is a materially new legal statement and requires owner review before publishing; see §11 for suggested wording. |
| `https://apparentlyyou.com/support` | HTTP 200 | No DRAFT marker. |

---

## 10. Account deletion and retention findings

Re-verified against the already-deployed, already-tested `delete-account` Edge Function
(`supabase/functions/delete-account/index.ts`) and its migrations — not redeployed, not
re-tested end-to-end again this pass (that was done and passed in the prior session; this pass
confirmed it is still `ACTIVE`/`verify_jwt=true` via a fresh `supabase functions list`).

- **Authentication/authorization:** the JWT is the only source of identity; the function derives
  `userId` from the token itself, never from a request-body field — structurally prevents one
  user from deleting another's account.
- **User-owned record deletion:** every user-linked table (`profiles`, `daily_answers`,
  `quiz_results`, `personality_evidence`, `personality_pole_evidence`, `quiz_shares`,
  `user_entitlements`, `tester_access_grants`) has `user_id uuid references auth.users(id) on
  delete cascade` — confirmed by reading every `CREATE TABLE` in `supabase/migrations/*.sql`, not
  assumed. One `auth.admin.deleteUser` call cascades all of them atomically.
- **Shared links and tokens:** `quiz_shares` rows cascade-delete on the sharer's account
  deletion; `compare_responses.share_id references quiz_shares(id) on delete cascade` means a
  deleted sharer's links are invalidated too (the row backing the token no longer exists).
- **RevenueCat customer data:** explicitly **not** deleted — Apple requires subscription/receipt
  data to remain with Apple/RevenueCat for revenue reporting regardless of app-side deletion.
  Documented in the function's own header comment and disclosed in the Privacy Policy/Terms.
- **Active-subscriber deletion:** deleting the account does not cancel the Apple subscription —
  stated to the user before they confirm (Settings) and in both legal pages.
- **Local storage clearing:** `account-deletion-service.ts`'s `clearLocalUserData()` removes
  every per-user `AsyncStorage`/`localStorage` key, including `apparently:age-eligibility`, and
  only runs *after* the server confirms real deletion (never clears locally on a failed/ambiguous
  server response).
- **Retained after deletion (disclosed, not a gap):** RevenueCat/Apple's own records; any Sentry
  event already sent before deletion; pre-deletion database backups until they age out of
  Supabase's own retention policy.

---

## 11. Unresolved questions and submission blockers

**Corrections made to prior documentation during this pass** (stale claims found while
verifying, now fixed):
- `supabase/migrations/20261018020000_age_eligibility_gate.sql`'s header said "STAGED, NOT YET
  APPLIED" — this was false; the migration is live in production (confirmed via
  `supabase migration list` and a live RPC call). Header corrected in place.
- `docs/app-store/APP_PRIVACY_DISCLOSURE_WORKSHEET.md`'s "Web sharing" entry said a shared page
  shows "only the comparison/result content explicitly shared," without flagging that this
  included 18+-gated content with no age check — updated (§ below).

**Requires owner decision:**
1. Apply `supabase/migrations/20261021150000_block_private_private_trouble_sharing.sql` to
   production — **staged, not applied**. Until it is, the server-side sharing gap (§2.11) is
   only closed in the app's own UI, not at the API layer; recommend applying it before this
   pass's build reaches any tester capable of completing `private-private-trouble`.
2. The Sensitive Info / gender-field classification judgment call (§4).
3. Whether to add an age-eligibility/minimum-age clause to the live Terms of Use (§9) — drafted
   suggestion: *"You must be at least 13 years old to use Apparently You. If you are between 13
   and 17, you may use the app's standard features, including Apparently Private; a separate,
   age-verified gate restricts access to 'Private Private' content to users 18 and older."* Not
   published — this is a materially revised legal statement per this audit's own instruction not
   to publish one unverified.
4. Whether to add a retention/cleanup policy for anonymous `auth.users` rows that never complete
   onboarding (§2.3's residual note) — a general-hygiene recommendation, not a launch blocker.
5. Entering/certifying the actual App Privacy and Age Rating questionnaires in live App Store
   Connect — no ASC dashboard/API access exists in this environment; this document and
   `AGE_RATING_CONNECT_ANSWERS.md`/`APP_PRIVACY_CONNECT_ANSWERS.md` are the evidence to enter
   those answers from.

**Not a blocker, but worth tracking:** the three unimplemented "Private Private" catalog entries
flagged in `AGE_RATING_CONNECT_ANSWERS.md` (titles suggesting more explicit future content) —
when any of them is written, re-run this audit's §2 before it ships, since the sharing/gating
fixes made this pass were keyed to the one quiz id that exists today.

---

## 12. Tests executed and actual results

Run fresh, this pass, after the code changes above:

| Check | Result |
|---|---|
| `npx tsc --noEmit` | **Clean, 0 errors** |
| `npm run lint` (`expo lint`) | **Clean, 0 errors/warnings** |
| All 39 `scripts/validate-*.ts` | **39/39 passed** |
| `scripts/validate-age-eligibility-gate.ts` specifically | **25/25 assertions passed**, including 11 new assertions added this pass covering the two fixes above |
| `scripts/check-four-answer-invariant.mjs` | Not re-run this pass — pre-existing, unrelated finding from the prior session (`whats-your-type-content.ts` has 10 questions with 6 choices instead of 4–5); content, not privacy/age, out of this audit's scope, not touched |
| Live production checks | `supabase migration list` (confirmed `20261018020000` applied); `supabase functions list` (confirmed `delete-account` ACTIVE); `eas-cli env:list --environment production` (confirmed `EXPO_PUBLIC_REMOTE_DAILY_ENABLED=true`, making §2.3's bug live, not theoretical); live anonymous RPC call to `is_adult_eligible` (confirmed the function exists in production); `curl` against all three legal/support URLs (all HTTP 200) |
| Native iOS device/simulator test of the fixes above | **Not run** — no Xcode/simulator session was available in this pass; the fixes are code/TypeScript/SQL-verified and validator-covered, not device-verified. Flag for the owner before the next TestFlight build if device confirmation is wanted. |

**Not claimed:** no native iOS test was run this pass; nothing above is reported as
device-verified unless explicitly stated as such.
