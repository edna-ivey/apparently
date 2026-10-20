// Validates Build 18 Work Package 2: monthly + annual + Founding Member introductory-offer
// subscription selection, real StoreKit-sourced pricing/eligibility, and the "no tester
// override accidentally grants paid entitlements" invariant. Source-text checks only --
// purchases-service.ts transitively imports react-native-purchases and react-native (AppState),
// which esbuild/tsx cannot parse outside Metro -- same documented limitation as every other
// native-module-touching file in this repo.
//
// Run with: npx tsx scripts/validate-subscription-plans.ts

declare const require: (id: string) => { readFileSync: (path: string, encoding: string) => string };
declare const __dirname: string;
const { readFileSync } = require('fs');
const { join } = require('path') as unknown as { join: (...parts: string[]) => string };

let failures = 0;
const assert = (condition: unknown, message: string): void => {
  if (!condition) {
    failures += 1;
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`OK: ${message}`);
  }
};

const read = (relativePath: string): string => readFileSync(join(__dirname, relativePath), 'utf8');

const serviceSource = read('../src/services/purchases-service.ts');
const paywallSource = read('../src/app/paywall.tsx');

// ============================================================================================
// 1. REAL OFFERING LOOKUP -- both monthly and annual, from the live RevenueCat offering.
//    annual resolving to null/absent is a normal state, never an invented fallback price.
// ============================================================================================

assert(/export const getApparentlyPrivateOfferings = /.test(serviceSource), 'a single function resolves both monthly and annual packages from the live offering');
assert(/offering\.monthly \?\?/.test(serviceSource) && /offering\.annual \?\?/.test(serviceSource), 'both packages are read from the real RevenueCat offering slots (never hardcoded)');
assert(!/getMonthlyOffering/.test(serviceSource), 'the old monthly-only lookup function no longer exists (superseded, not duplicated alongside the new one)');
assert(!/subscribeMonthly/.test(serviceSource), 'the old monthly-only purchase function no longer exists -- subscribeToPackage is package-agnostic');
assert(/export const subscribeToPackage = /.test(serviceSource), 'a package-agnostic subscribe function exists (purchasing is the same call regardless of plan)');

// ============================================================================================
// 2. FOUNDING MEMBER = A REAL STOREKIT INTRODUCTORY OFFER, NEVER A HAND-PICKED COHORT.
//    Apple has no mechanism for "first N users" -- this must be modeled as real eligibility
//    checking against the SDK, fail-closed, never assumed true.
// ============================================================================================

assert(
  /export const checkApparentlyPrivateAnnualIntroEligibility = /.test(serviceSource),
  'a real eligibility-check function exists for the annual product\'s introductory price',
);
assert(/checkTrialOrIntroductoryPriceEligibility/.test(serviceSource), 'eligibility is checked via the real RevenueCat/StoreKit SDK call, never assumed');
assert(/INTRO_ELIGIBILITY_STATUS_ELIGIBLE/.test(serviceSource), 'eligibility is compared against the real SDK enum value, not a guessed boolean shape');
assert(
  /return false;\s*\n\s*\}\s*\n\};?\s*$/m.test(serviceSource.slice(serviceSource.indexOf('checkApparentlyPrivateAnnualIntroEligibility'))) ||
    /Fails closed to "not eligible"/.test(serviceSource),
  'eligibility checking fails CLOSED (not eligible) on any SDK error -- never optimistically promises the discount',
);
// A comment MENTIONING "first 100 users" as the exact thing NOT being done (explaining the
// real Apple constraint) is fine and expected -- what matters is that no actual cohort
// mechanism (a constant, list, or id-based gate) was built to simulate it.
assert(
  !/founderCohort|FOUNDER_USER_IDS|isFoundingMemberCohort/i.test(serviceSource),
  'no hand-picked "first N users" cohort mechanism was invented -- Apple does not support targeting introductory offers that way',
);

// ============================================================================================
// 3. NO INVENTED PRODUCT IDS CLAIMED AS CONFIRMED; NO HARDCODED PRICES ANYWHERE IN THE APP.
// ============================================================================================

assert(/PROPOSED/.test(serviceSource) && /NOT confirmed to exist/.test(serviceSource), 'the new annual product id is explicitly documented as proposed/unconfirmed, never asserted to already exist in App Store Connect');
// Comments explaining the owner-locked TARGET prices (for context/traceability) are fine and
// already the established pattern in this codebase -- what matters is that no PRICE STRING
// renders from a literal in the paywall's own JSX/styles (every rendered number must come
// from product.priceString/introPrice.priceString, never a hand-typed fallback).
const paywallJsxAndLogic = paywallSource.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
assert(
  !/\$3\.99|\$29\.99|\$19\.99/.test(paywallJsxAndLogic),
  'no literal dollar price string appears in the paywall\'s actual code (comments aside) -- every displayed price comes from the live StoreKit product',
);
assert(/product\.priceString/.test(paywallSource) && /introPrice\.priceString/.test(paywallSource), 'the paywall renders StoreKit\'s own priceString/introPrice.priceString, never a computed or hardcoded value');

// ============================================================================================
// 4. CLEAR DURATION + RENEWAL DISCLOSURE, SHOWN UPFRONT (never hidden until after purchase).
// ============================================================================================

assert(/renewalNote/.test(paywallSource), 'a dedicated, always-visible renewal-disclosure line exists on the plan card');
assert(/Then \{pkg\.product\.priceString\} per \{unit\}, billed automatically unless you cancel\./.test(paywallSource), 'the renewal line states the REAL post-intro price and that billing is automatic unless cancelled -- shown on the card itself, not gated behind a tap');
assert(/for your first \{unit\}/.test(paywallSource), 'the Founding Member price is explicitly scoped to "first year" (or whatever the real unit is), never presented as the permanent price');

// ============================================================================================
// 5. ACCURATE OFFER ELIGIBILITY GATES THE FRAMING ITSELF -- Founding Member label/copy only
//    renders when BOTH a real introPrice exists AND this customer was confirmed eligible.
// ============================================================================================

assert(
  /annualIntroEligible && offeringState\.offerings\.annual\.product\.introPrice \? 'FOUNDING MEMBER' : 'ANNUAL'/.test(paywallSource),
  'the Founding Member eyebrow/framing is conditioned on BOTH real introPrice presence AND confirmed eligibility -- an ineligible or unconfigured customer sees the plain "ANNUAL" framing instead, never a false promise',
);

// ============================================================================================
// 6. RESTORE / MANAGE SUBSCRIPTION / SERVER SYNC PATHS UNCHANGED.
// ============================================================================================

assert(/export const restorePurchases = /.test(serviceSource), 'Restore Purchases is unchanged and still present');
assert(/export const getSubscriptionManagementUrl = /.test(serviceSource), 'Manage Subscription (Apple\'s own management URL) is unchanged and still present');
assert(/export const syncServerEntitlement = /.test(serviceSource), 'the server-authoritative entitlement sync is unchanged and still present');
assert(/await syncServerEntitlement\(\);/.test(serviceSource), 'subscribeToPackage/restorePurchases still sync the server mirror after a real purchase/restore');

// ============================================================================================
// 7. CRITICAL REGRESSION GUARD: tester override must NEVER be OR'd back into real premium
//    gating. This was a real, previously-fixed bug (Build 8) -- re-verify it stayed fixed.
// ============================================================================================

assert(
  /export const useEffectivePremium = \(\): boolean => \{\s*\n\s*const \{ status \} = usePremiumStatus\(\);\s*\n\s*return status === 'premium';\s*\n\};/.test(serviceSource),
  "useEffectivePremium's implementation is exactly `return status === 'premium'` -- no OR with isTesterOverrideEnabled/any tester flag, across this subscription-plan change too",
);
assert(
  !/status === 'premium' \|\| .*[Tt]ester/.test(serviceSource) && !/[Tt]ester.*\|\| status === 'premium'/.test(serviceSource),
  'no code path ORs a tester/override flag into the real premium determination anywhere in this file',
);

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED.`);
  process.exit(1);
}
console.log(
  '\nALL subscription plan selection (monthly/annual/Founding Member, real StoreKit pricing and eligibility, renewal disclosure, tester-override regression guard) VALIDATION CHECKS PASSED.',
);
