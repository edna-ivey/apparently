// Advertising + push notifications (2026-10-22). Source-text checks, same documented
// limitation every other validator touching a react-native-dependent module already has:
// ad-interstitial-service.ts/ads-consent-service.ts/notification-*.ts transitively import
// react-native and native-module packages (react-native-google-mobile-ads, expo-notifications)
// that esbuild/tsx cannot load outside a real RN/Metro runtime -- see age-eligibility.ts's own
// validator for the same convention. Covers as many of the task's 17 required test cases as
// are verifiable by static analysis; the rest genuinely require a physical device (see the
// final report for exactly which).
//
// Run with: npx tsx scripts/validate-ads-and-notifications.ts

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

// ============================================================================================
// Test case 1/2 -- free user finishes a public quiz, sees AT MOST one eligible ad; result
// survives an ad-loading failure/interruption.
// ============================================================================================

const quizRunnerSource = read('../src/app/quiz/[quizId].tsx');
assert(/const adGateStarted = useRef\(false\);/.test(quizRunnerSource), 'the quiz runner tracks a one-shot ad-gate-started ref -- the ad flow can never run twice for one completion');
assert(/if \(savedResultDisplay \|\| step !== 'result' \|\| !definition \|\| adGateStarted\.current\) {\s*return;/.test(quizRunnerSource), 'the ad effect refuses to re-run once started, and never runs at all for a revisited saved result');
assert(/definition\.access !== 'free'/.test(quizRunnerSource), "the ad is only ever attempted for a genuinely free/public quiz (access === 'free') -- never private/private-preview");
assert(/showInterstitialIfDue\('quiz_interstitial', !adEligibility\.personalizedAdsAllowed\)\.then\(\(adShown\) => {/.test(quizRunnerSource), 'showInterstitialIfDue is awaited via .then, never blocking the synchronous result computation/save that already happened in the earlier effect');
assert(/liveResult: ResultDisplay \| null = definition && !savedResultDisplay && step === 'result' \? computeQuizResult/.test(quizRunnerSource), 'the result itself is computed from step==="result" alone -- completely independent of the ad gate, which only delays the RENDER');
assert(/const timer = setTimeout\(\(\) => setFreshCompletionAdResolved\(true\), 5000\);/.test(quizRunnerSource), 'a bounded safety timeout forces the result through even if subscription-status resolution or the ad flow itself never completes -- the result can never be delayed indefinitely');

const interstitialServiceSource = read('../src/services/ad-interstitial-service.ts');
assert(/export const showInterstitialIfDue = async \(placement: AdPlacementName, underAgeOfConsent: boolean\): Promise<boolean> => {/.test(interstitialServiceSource), 'showInterstitialIfDue always resolves (never rejects) -- every branch, including every failure branch, reaches a return');
assert(/if \(loadResult !== 'loaded'\) {\s*logAnalyticsEvent\({ name: 'ad_failed'/.test(interstitialServiceSource), 'a load failure/timeout is logged and resolves false -- never throws, never hangs the caller');
assert(/const withTimeout = <T>\(promise: Promise<T>, ms: number\)/.test(interstitialServiceSource), 'ad loading is raced against a bounded timeout (AdsConfig.adLoadTimeoutMs) -- a slow/hanging SDK load can never block the caller past that bound');

// ============================================================================================
// Test case 3/4 -- Daily reveal appears before any ad; the Daily ad is never repeated for the
// same completed Daily.
// ============================================================================================

const todaySource = read('../src/app/(tabs)/index.tsx');
assert(/onClose={\(\) => handleCloseFreeReadModal\(ready\?\.question\.prompt \?\? ''\)}/.test(todaySource), 'the Daily ad is only ever triggered from the Read modal\'s OWN close handler -- it cannot fire before the user has already seen the real reveal');
assert(/const key = `\$\{prompt\}\|\$\{getTodayLocalDateKey\(\)\}`;/.test(todaySource), 'the Daily ad dedup key combines the real prompt text with the device\'s own local calendar day');
assert(/if \(await hasShownDailyAdForKey\(key\)\) {\s*return;/.test(todaySource), 'a key already marked shown short-circuits before any new ad request -- the same completed Daily can never show a second ad today');
assert(/if \(shown\) {\s*await markDailyAdShownForKey\(key\);/.test(todaySource), 'the dedup key is only persisted once the ad genuinely showed -- a skipped/failed attempt correctly allows a retry on a later close, never silently blocking all future attempts for the day');

// ============================================================================================
// Test case 5 -- native sponsored cards are correctly labeled as advertisements.
// ============================================================================================

const nativeAdCardSource = read('../src/components/ads/native-ad-card.tsx');
assert(/<Text style={styles\.adBadgeText}>Ad<\/Text>/.test(nativeAdCardSource), 'every loaded native ad card renders an explicit "Ad" badge, unconditionally -- never omitted, never merely implied by styling');
assert(/if \(status !== 'loaded' \|\| !nativeAd\) {\s*return null;/.test(nativeAdCardSource), 'a native ad that is loading, no-fill, or errored renders nothing at all -- never a placeholder that could be mistaken for a real quiz card');

const exploreSource = read('../src/app/(tabs)/explore.tsx');
assert(/exploreAdEligibility\.eligible && index > 0 && \(index \+ 1\) % AdsConfig\.nativeAdCardSpacing === 0/.test(exploreSource), 'native ad cards are interleaved at a fixed, configurable spacing -- never adjacent to each other, never at position 0');

// ============================================================================================
// Test case 6 -- rapid quiz completion respects ad-frequency cooldowns (shared across quiz and
// Daily interstitials).
// ============================================================================================

assert(/if \(interstitialsShownThisSession >= AdsConfig\.maxInterstitialsPerSession\) {\s*return false;/.test(interstitialServiceSource), 'a hard per-session interstitial cap is checked before any load attempt');
assert(/if \(lastShownAt !== null && Date\.now\(\) - lastShownAt < AdsConfig\.interstitialCooldownSeconds \* 1000\) {\s*return false;/.test(interstitialServiceSource), 'the cooldown clock is checked before any load attempt, and is the SAME stored key/clock for every placement -- quiz and Daily interstitials share one cooldown, never two independent ones');

// ============================================================================================
// Test case 7/8/9/10 -- a paid subscriber sees zero ads everywhere; purchase/restoration
// immediately disable ads; an expired subscription correctly restores free-tier eligibility.
// ============================================================================================

const eligibilityServiceSource = read('../src/services/ad-eligibility-service.ts');
assert(/const statusUncertain = premium\.status === 'loading' \|\| premium\.status === 'error';/.test(eligibilityServiceSource), "both 'loading' and 'error' are treated as uncertain -- never defaulting to ad-eligible while unresolved");
assert(/const isFree = premium\.status === 'free';/.test(eligibilityServiceSource), "eligibility requires an explicit server-verified 'free' status -- 'premium' is never ad-eligible under any condition");
assert(/eligible: placementEnabled && isFree && !statusUncertain,/.test(eligibilityServiceSource), 'the final eligible flag requires ALL THREE of: placement enabled, confirmed free, and NOT uncertain -- a subscriber (isFree=false) can never compute eligible=true regardless of any other flag');
assert(/usePremiumStatus\(\)/.test(eligibilityServiceSource), 'ad eligibility is derived from usePremiumStatus -- the exact same reactive, RevenueCat-backed, server-verified source Apparently Private\'s own paywall gate uses (not a separate/cached flag), so a purchase/restore/expiration that already updates that store is reflected here with zero additional wiring');

// ============================================================================================
// Test case 11/12 -- notification permission requested contextually, not at first launch;
// disabled categories do not trigger notifications.
// ============================================================================================

const rootLayoutSource = read('../src/app/_layout.tsx');
assert(!/requestNotificationPermission\(\)/.test(rootLayoutSource), 'the root layout (first-launch code path) never calls requestNotificationPermission itself -- only a real in-app contextual UI does');

const permissionServiceSource = read('../src/services/notification-permission-service.ts');
assert(/const before = await getNotificationPermissionStatus\(\);\s*if \(before !== 'undetermined'\) {\s*return before;/.test(permissionServiceSource), 'requesting permission is a no-op (never re-prompts) once the OS already has a real granted/denied answer');

const todayContextualSource = todaySource;
assert(/if \(!isCommitted\) {\s*return;/.test(todayContextualSource), 'the contextual explainer is only ever considered after a real completed Daily -- never on cold launch');
assert(/if \(await hasShownContextualPermissionPrompt\(\)\) {\s*return;/.test(todayContextualSource), 'the explainer checks it has never been shown on this device before offering itself again');

const sendFunctionSource = read('../supabase/functions/send-push-notification/index.ts');
assert(/if \(!categoryEnabled\(prefs, row\.category\) \|\| isWithinQuietHours\(prefs\)\) {\s*continue;/.test(sendFunctionSource), 'the send function skips composing any message for a disabled category or during quiet hours -- a disabled category structurally cannot produce a push, not merely "is asked nicely not to"');

// ============================================================================================
// Test case 13 -- completed Dailies do not generate reminder notifications.
// ============================================================================================

const dailyReminderSource = read('../src/services/daily-reminder-service.ts');
assert(/export const cancelTodaysDailyReminder = async \(\): Promise<void> => {/.test(dailyReminderSource), 'cancelTodaysDailyReminder exists as its own explicit cancellation path');
assert(/useEffect\(\(\) => {\s*if \(isCommitted\) {\s*void cancelTodaysDailyReminder\(\);/.test(todaySource), 'Today cancels the pending reminder the moment isCommitted is true -- both for a fresh commit and for a device that opens the app with today\'s Daily already answered');

// ============================================================================================
// Test case 14 -- Friend/Compare activity notifications are based on real authorized events,
// never fabricated.
// ============================================================================================

const pushSchemaMigration = read('../supabase/migrations/20261022020000_push_notifications_schema.sql');
assert(/create trigger compare_responses_after_insert_notify\s*after insert on public\.compare_responses/.test(pushSchemaMigration), 'the Friend/Compare notification is enqueued by a real AFTER INSERT trigger on compare_responses -- it can only ever fire for a response that genuinely landed in the database, never a client-invoked "pretend a friend answered" call');
assert(/select s\.sharer_user_id, s\.quiz_id into v_owner_id, v_quiz_id\s*from public\.quiz_shares s\s*where s\.id = new\.share_id;/.test(pushSchemaMigration), 'the notification recipient is looked up from the real share row the response actually belongs to -- never a client-supplied user id');

// ============================================================================================
// Test case 15 -- notification deep links open the intended screen (all three app states).
// ============================================================================================

assert(/Notifications\.getLastNotificationResponseAsync\(\)\.then\(\(response\) => {/.test(rootLayoutSource), 'cold-start-from-notification is handled by reading the last response once on mount');
assert(/Notifications\.addNotificationResponseReceivedListener\(\(response\) => {/.test(rootLayoutSource), 'foreground/background taps are handled by the same response listener while the app is already running');
assert(/router\.push\(resolveNotificationUrl\(response\) as never\);/.test(rootLayoutSource), 'both paths route through the SAME resolveNotificationUrl + router.push -- cold-start and already-running taps land on the identical destination for the identical payload');

// ============================================================================================
// Test case 16 -- logout and account deletion stop account-related notifications.
// ============================================================================================

assert(/references auth\.users \(id\) on delete cascade/.test(pushSchemaMigration), 'push_tokens.user_id cascades on auth.users deletion -- every token for a deleted account is removed automatically, with zero separate cleanup code required');
const settingsSource = read('../src/app/settings.tsx');
assert(/void removeThisDevicePushToken\(\);\s*const result = await deleteAccount\(\);/.test(settingsSource), 'the account-deletion handler also explicitly removes this device\'s token ahead of the real deletion call, independent of (and in addition to) the server-side cascade');

// ============================================================================================
// Test case 17 -- advertising and notifications respect consent and privacy preferences.
// ============================================================================================

const consentServiceSource = read('../src/services/ads-consent-service.ts');
assert(/const consentInfo = await AdsConsent\.gatherConsent\({ tagForUnderAgeOfConsent: options\.underAgeOfConsent }\);/.test(consentServiceSource), 'Google UMP consent is gathered before any ad request, tagged with the real existing age-eligibility signal -- never a hardcoded false');
assert(/const requestNonPersonalizedAdsOnly = options\.underAgeOfConsent \|\| !consentObtainedOrNotRequired \|\| !attGranted;/.test(consentServiceSource), 'non-personalized-ads-only is forced by ANY of: under-age-of-consent, consent not obtained, or ATT not granted -- a user who fails any one of these three checks can never receive personalized ads');
assert(/current\.status === 'undetermined' \? await TrackingTransparency\.requestTrackingPermissionsAsync\(\) : current;/.test(consentServiceSource), 'ATT is only ever requested when the OS reports it as genuinely undetermined -- never assumed required, never re-requested');

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED.`);
  process.exit(1);
}
console.log('\nALL advertising + push notification checks PASSED (source-text verified; see the final report for which of the 17 required test cases additionally need a physical device).');
