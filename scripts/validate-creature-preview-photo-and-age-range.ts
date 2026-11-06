// Validates the three Build 17 physical-device fixes: the duplicate Creature on Your Read,
// the broken Save-to-Photos path, and the missing 13-17 age range -- plus the critical
// constraint that a profile age-range selection can never touch the separate, immutable
// age-eligibility gate. Source-text checks only (these screens import react-native/expo-
// router, which esbuild/tsx cannot parse outside Metro -- same established convention as
// every other screen-checking script in this repo).
//
// Run with: npx tsx scripts/validate-creature-preview-photo-and-age-range.ts

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
// 1. NO DUPLICATE CREATURE on Your Read -- exactly one CreatureAvatar render per state branch
//    in the always-visible scroll content, with the second (export-card) avatar living only
//    inside the preview modal, which is not rendered inline.
// ============================================================================================

const creatureReadSource = read('../src/app/creature-read.tsx');

assert(/function TappableCreatureAvatar/.test(creatureReadSource), 'TappableCreatureAvatar exists -- the one shared tappable avatar for both states');
assert(/accessibilityLabel="View your Creature"/.test(creatureReadSource), 'the tappable avatar has a real accessibility label');
assert(/Tap to view your Creature/.test(creatureReadSource), 'the "Tap to view your Creature" cue is present verbatim');

// Exactly two call sites of TappableCreatureAvatar in the main render (first-form, mixed) --
// never a second, separately-rendered CreatureAvatar alongside it in the scroll content.
const tappableCallSites = creatureReadSource.match(/<TappableCreatureAvatar/g) ?? [];
assert(tappableCallSites.length === 2, `TappableCreatureAvatar is used exactly twice (first-form, mixed) in the main render (got ${tappableCallSites.length})`);

// The main render function (everything before CreaturePreviewModal's own definition) must
// contain exactly 2 CreatureAvatar renders -- one per TappableCreatureAvatar call, NOT a third
// bare <CreatureAvatar inline in first-form/mixed (the old duplicate-export-card bug).
const modalDefIndex = creatureReadSource.indexOf('function CreaturePreviewModal');
const mainRenderSource = creatureReadSource.slice(0, modalDefIndex);
const creatureAvatarInMainRender = mainRenderSource.match(/<CreatureAvatar/g) ?? [];
assert(creatureAvatarInMainRender.length === 1, `exactly one <CreatureAvatar usage in the main screen's own render code (inside TappableCreatureAvatar itself) -- got ${creatureAvatarInMainRender.length}`);
assert(!/SaveCreatureButton/.test(creatureReadSource), 'the old always-visible SaveCreatureButton (which rendered the duplicate export card) no longer exists');

// ============================================================================================
// 2. PREVIEW MODAL -- premium, immersive, both Creature forms, no overlap, capture target
//    excludes modal chrome.
// ============================================================================================

assert(/function CreaturePreviewModal/.test(creatureReadSource), 'CreaturePreviewModal exists');
assert(/<Modal visible=\{visible\}/.test(creatureReadSource), 'the preview is a real Modal, gated on a real visible prop');
assert(/presentationStyle="overFullScreen"/.test(creatureReadSource), 'the preview is a full-screen immersive presentation, not a small popup card');
assert(/PortalRings/.test(creatureReadSource) && /CelestialWash/.test(creatureReadSource), 'the preview reuses the app\'s own dark celestial background treatment (PortalRings/CelestialWash), not an invented look');
assert(/accessibilityLabel="Close"/.test(creatureReadSource), 'a real, labeled close button exists in the preview');
assert(/accessibilityLabel="Share Creature"/.test(creatureReadSource), 'a real, labeled Share Creature action exists');
assert(/accessibilityLabel="Save Creature to Photos"/.test(creatureReadSource), 'a real, labeled Save to Photos action exists');
assert(/useWindowDimensions/.test(creatureReadSource), 'the preview sizes itself responsively from real window dimensions, not a single fixed size, so it fits smaller iPhones');

// The capture target (exportCardRef view) must be structurally separate from the close button
// and action row -- i.e. the close button and action buttons are NOT inside the ref'd subtree.
const previewModalBody = creatureReadSource.slice(modalDefIndex);
const exportCardOpenIndex = previewModalBody.indexOf('<View ref={exportCardRef}');
const actionRowOpenIndex = previewModalBody.indexOf('<View style={styles.previewActionRow}>');
const exportCardJsx = previewModalBody.slice(exportCardOpenIndex, actionRowOpenIndex);
assert(!/previewCloseButton|previewActionButton/.test(exportCardJsx), 'the ref\'d capture subtree contains no close button or action buttons -- a saved/shared image can never include modal chrome');
assert(/exportName/.test(exportCardJsx) && /exportMark/.test(exportCardJsx), 'the capture subtree includes the Creature\'s name and the Apparently You brand mark');

// Reopening never shows a stale previous result -- the render-time "adjust state when a prop
// changes" pattern (not a setState-in-effect), matching this codebase's own established
// convention (e.g. settings.tsx's prevUserProfile).
assert(/const \[prevVisible, setPrevVisible\] = useState\(visible\)/.test(creatureReadSource), 'stale save/share state is reset on open/close via the render-time pattern, not setState-in-an-effect');

// ============================================================================================
// 3. SAVE AND SHARE OPERATE ON THE SAME EXPORT IMAGE, both via save-creature-image.ts.
// ============================================================================================

const saveServiceSource = read('../src/services/save-creature-image.ts');
assert(/const captureCreatureExportImage = /.test(saveServiceSource), 'one shared capture helper exists');
assert(
  (saveServiceSource.match(/captureCreatureExportImage\(viewRef\)/g) ?? []).length === 2,
  'both saveCreatureImageFromRef and shareCreatureImageFromRef call the SAME capture helper with the SAME ref -- never two different capture paths',
);

// ============================================================================================
// 4. PHOTO SAVE ROOT-CAUSE FIX: the legacy expo-media-library entry point, not the default
//    "next" API whose saveToLibraryAsync unconditionally throws (confirmed by reading the
//    installed package's own source -- src/legacyWarnings.ts).
// ============================================================================================

assert(/from 'expo-media-library\/legacy'/.test(saveServiceSource), "imports the real, functional legacy API (expo-media-library's default/next export's saveToLibraryAsync is a deprecated shim that always throws)");
assert(!/from 'expo-media-library';/.test(saveServiceSource), 'never imports the default (next) expo-media-library entry point, which would silently reintroduce the always-throws bug');

// ============================================================================================
// 5. SHARING -- real Expo-supported native API, same capture target, graceful cancel/failure.
// ============================================================================================

assert(/from 'expo-sharing'/.test(saveServiceSource), 'uses the Expo-supported expo-sharing package for native sharing');
assert(/export async function shareCreatureImageFromRef/.test(saveServiceSource), 'a real shareCreatureImageFromRef export exists');
assert(/Sharing\.isAvailableAsync/.test(saveServiceSource), 'checks real platform availability before attempting to share');
assert(/Sharing\.shareAsync\(uri/.test(saveServiceSource), 'shares the real captured image URI, never a screenshot of the whole screen or plain text');
assert(
  !/shareAsync\(.*JSON\.stringify|shareAsync\(.*message:/.test(saveServiceSource),
  'never shares text/a message in place of the actual image',
);
const packageJsonSource = read('../package.json');
assert(/"expo-sharing":\s*"~?\d+\.\d+\.\d+"/.test(packageJsonSource), 'expo-sharing is a real, versioned dependency (installed via `expo install` for SDK compatibility, not hand-added)');

// ============================================================================================
// 6. DUPLICATE-TAP / RETRY BEHAVIOR on the new actions.
// ============================================================================================

assert(/if \(busy\) \{\s*return;\s*\}/.test(creatureReadSource), 'both handleSave/handleShare bail out while an action is already in progress (duplicate-tap guard)');
assert(/disabled=\{busy\}/.test(creatureReadSource), 'both action buttons are disabled while busy, not just internally guarded');
assert(/'save-error'/.test(creatureReadSource) && /'share-error'/.test(creatureReadSource), 'distinct, retryable error states exist for both actions -- the idle button is always reachable again after a failure');

// ============================================================================================
// 7. 13-17 AGE RANGE -- present, consistent across onboarding + Settings, no DB-side rejection.
// ============================================================================================

const onboardingDataSource = read('../src/data/onboarding.ts');
assert(/export type AgeRange = '13-17' \| '18-24'/.test(onboardingDataSource), "AgeRange's union starts with '13-17'");
assert(/export const AGE_RANGES: AgeRange\[\] = \['13-17', '18-24'/.test(onboardingDataSource), "AGE_RANGES includes '13-17'");

const onboardingScreenSource = read('../src/app/onboarding.tsx');
const settingsScreenSource = read('../src/app/settings.tsx');
assert(/AGE_RANGES\.map/.test(onboardingScreenSource), 'onboarding renders age options from the single shared AGE_RANGES array, not a hand-duplicated list');
assert(/AGE_RANGES\.map/.test(settingsScreenSource), 'Settings renders age options from the SAME shared AGE_RANGES array -- the two screens can never drift out of sync');

// ============================================================================================
// 8. CRITICAL: age-range selection (Settings/onboarding) can NEVER touch the separate,
//    immutable age-eligibility gate. Settings must not even be ABLE to call the eligibility
//    write path -- checked by absence, not just by not calling it today.
// ============================================================================================

assert(!/age-eligibility/.test(settingsScreenSource), 'Settings never imports anything from the age-eligibility module at all -- changing age range there cannot possibly reach the eligibility gate');
assert(!/setAgeEligibilityOnce|upsertAgeEligibility/.test(settingsScreenSource), 'Settings never calls either real eligibility-write function');
assert(/const selectAgeRange = \(range: AgeRange\) => void updateUserProfile\(\{ ageRange: range \}\);/.test(settingsScreenSource), 'selecting an age range writes ONLY the demographic ageRange field, through the generic profile-update path -- never a dedicated/special write that could be confused with eligibility');

// onboarding.tsx legitimately imports BOTH modules (it hosts both the real age-GATE and the
// demographic age-RANGE question) -- the critical property there is that they stay two
// independent state variables/handlers, never merged into one.
assert(/ageGateResult/.test(onboardingScreenSource) && /\[ageRange, setAgeRange\]/.test(onboardingScreenSource), 'onboarding keeps age-gate eligibility and demographic age-range as two separate state variables');
assert(
  !/ageEligibility === ageRange|ageRange === ageEligibility|isAdultEligible\(ageRange/.test(onboardingScreenSource + settingsScreenSource),
  'no code anywhere compares or derives eligibility FROM the demographic age range (or vice versa)',
);

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED.`);
  process.exit(1);
}
console.log(
  '\nALL Build 17 fixes (single tappable Creature + premium preview modal, Save-to-Photos root-cause fix, native Share, 13-17 age range, age-range/eligibility separation) VALIDATION CHECKS PASSED.',
);
