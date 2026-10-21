# Apparently Private subscription implementation + test status, October 20, 2026

Covers `src/services/purchases-service.ts` and `src/app/paywall.tsx` against the full
monthly/annual/Founding Member/existing-subscriber scope. Distinguishes **code-complete**
(implemented, passes static validation) from **tested** (actually exercised against a real
StoreKit sandbox or physical device) -- the two are never the same claim.

## RevenueCat/StoreKit mapping (verified against current code, not re-implemented)

| RevenueCat concept | Value | Where |
|---|---|---|
| Entitlement | `apparently_private` | `APPARENTLY_PRIVATE_ENTITLEMENT_ID` |
| Offering | `default` | `APPARENTLY_PRIVATE_OFFERING_ID` |
| Monthly package | `$rc_monthly` (RevenueCat's own predefined identifier) | `offering.monthly`, with a fallback scan for `PACKAGE_TYPE.MONTHLY`/`'monthly'` if the dashboard ever attaches it as a custom package instead |
| Annual package | `$rc_annual` | `offering.annual`, same fallback pattern |
| Monthly product | `apparently_private_monthly` | `APPARENTLY_PRIVATE_MONTHLY_PRODUCT_ID` |
| Annual product | `apparently_private_annual` | `APPARENTLY_PRIVATE_ANNUAL_PRODUCT_ID` (still PROPOSED/unconfirmed in App Store Connect as of this date) |

`getApparentlyPrivateOfferings()` fetches both packages from the ONE live offering in a single
`Purchases.getOfferings()` call. Neither package existing is a graceful `package-unavailable`
result, never a crash or an invented price.

## Test matrix

| # | Scenario | Status | Notes |
|---|---|---|---|
| 1 | Monthly plan selection | **Code-complete, validator-covered** | `selectedPlan`/`selectedPackage` resolve `offerings.monthly`; `PlanCard` renders its real `priceString`. Not exercised against a live sandbox purchase. |
| 2 | Annual plan selection | **Code-complete, validator-covered** | Same path for `offerings.annual`. |
| 3 | Correct RevenueCat package mapping | **Code-complete, validator-covered** | See mapping table above; `scripts/validate-subscription-plans.ts` asserts both packages are read from the real offering slots, never hardcoded. |
| 4 | Purchase success | **Code-complete only -- BLOCKED, needs sandbox/device** | `subscribeToPackage` calls the real `Purchases.purchasePackage`; success path sets snapshot from the real returned `CustomerInfo` and calls `syncServerEntitlement()`. Cannot be exercised without a real or sandbox StoreKit purchase. |
| 5 | Purchase cancellation | **Code-complete only -- BLOCKED, needs sandbox/device** | Distinguished via `PurchasesError.userCancelled` (RevenueCat's own documented field), returns a clean non-error `{ok:true, status:'cancelled'}` -- user stays free, no scary UI. Requires actually tapping Cancel in the real StoreKit sheet to exercise. |
| 6 | Restore Purchases | **Code-complete, validator-covered; BLOCKED for a real restore outcome** | `restorePurchases()` exists, reachable from both the free-visitor and existing-subscriber ("View plans") states as of this pass. The actual "finds a real prior purchase" outcome needs a sandbox/device test. |
| 7 | Existing active subscriber | **Code-complete, validator-covered -- NEW this pass** | Previously only showed "You're already in" with no way to see plan options. Now has a "View plans" toggle revealing the same real `PlanCard`s, a "CURRENT PLAN" badge (from `CustomerInfo.entitlements.active[...].productIdentifier`, never inferred from UI selection), and Restore Purchases. Not yet confirmed on a real active-subscriber device. |
| 8 | Subscription management | **Code-complete, validator-covered** | `getSubscriptionManagementUrl()` from the real `CustomerInfo.managementURL`; unchanged this pass. |
| 9 | Annual introductory-offer eligibility | **Code-complete, validator-covered; BLOCKED for a real eligible/ineligible answer** | `checkApparentlyPrivateAnnualIntroEligibility` calls the real `checkTrialOrIntroductoryPriceEligibility`, fails closed to "not eligible" on any error. Needs two sandbox testers (one fresh, one that already redeemed the offer) to see both real answers. |
| 10 | Missing/unavailable product handling | **Code-complete, validator-covered** | `annual: null` (or `monthly: null`) is a normal non-error state; the Founding Member framing simply doesn't render without a real `introPrice`. Exercised today in this environment implicitly (no live annual product configured yet), so this specific path IS effectively live-verified right now -- the paywall currently shows monthly only, no crash. |
| 11 | No duplicate entitlement grants | **Code-complete, validator-covered -- NEW this pass** | The Subscribe/Switch button is disabled (`isSelectedPlanCurrent`) when the selected plan's product id already matches the real active entitlement's product id -- a tap can never attempt to re-purchase the exact plan already owned. A plan SWITCH (different product, same subscription group) is not specially coded -- `Purchases.purchasePackage` itself is what StoreKit/RevenueCat use to apply Apple's own subscription-group upgrade/downgrade proration; this repo adds no custom switch logic. |

## What is genuinely blocked, and why

Items 4, 5, 6 (real outcome), 7 (real device confirmation), and 9 all require either a real
App Store sandbox tester account or a physical iPhone running a real build -- none of which
exist in this engineering environment. `npx tsc`, `npm run lint`, and
`scripts/validate-subscription-plans.ts` can prove the CODE is structured correctly (right
functions called, right fields read, right fallback/error handling, no tester-override leak,
no duplicate-purchase path) but cannot prove StoreKit itself behaves as expected end to end.
See `docs/app-store/OWNER_APP_STORE_ACTIONS.md` item 3d for the exact sandbox test steps to
run once the annual product + introductory offer are live in App Store Connect/RevenueCat.

## Review-access note

The existing-subscriber "View plans" feature also directly solves the App Store review
screenshot need (`docs/app-store/REVIEW_NOTES_DRAFT_2026-10-20.md`): the owner's own active
monthly subscription can now be used to view both real plan cards without cancelling anything,
to capture accurate subscription-review screenshots.
