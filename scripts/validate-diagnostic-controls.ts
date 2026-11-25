// Build 23 P0 review, item 6: targeted tests for diagnostic-controls-service.ts -- the
// persisted-toggle logic behind the Ads/Notifications diagnostic build, and specifically the
// cold-launch hydration race item 2 of the review named (a startup effect reading this before
// AsyncStorage's real persisted value has loaded must get the REAL value, never a premature
// default).
//
// @react-native-async-storage/async-storage throws "window is not defined" when imported in a
// plain Node process with no `window` global at all -- it is written to fall back to
// window.localStorage outside a true React Native runtime (confirmed directly: shimming a
// minimal in-memory window.localStorage before importing it is enough to make getItem/setItem
// actually work). This script does exactly that, so it exercises the REAL AsyncStorage module
// this service imports, not a hand-rolled mock standing in for it.
//
// isDiagnosticBuild is computed once, at module load, from EXPO_PUBLIC_DIAGNOSTIC_BUILD -- this
// script must therefore be run TWICE, once per value, to cover both branches (a single process
// cannot re-evaluate that top-level const after changing the env var):
//   EXPO_PUBLIC_DIAGNOSTIC_BUILD=true  npx tsx scripts/validate-diagnostic-controls.ts
//   EXPO_PUBLIC_DIAGNOSTIC_BUILD=false npx tsx scripts/validate-diagnostic-controls.ts
// Both invocations assert the branch they actually exercise; each prints which mode it ran in.

declare const process: { env: Record<string, string | undefined>; exit: (code: number) => void };

// Must run BEFORE importing diagnostic-controls-service.ts (which imports AsyncStorage at
// module scope) -- see this file's own header for why.
const memoryStorage = new Map<string, string>();
(globalThis as unknown as { window: unknown }).window = {
  localStorage: {
    getItem: (key: string) => (memoryStorage.has(key) ? memoryStorage.get(key)! : null),
    setItem: (key: string, value: string) => {
      memoryStorage.set(key, value);
    },
    removeItem: (key: string) => {
      memoryStorage.delete(key);
    },
  },
};

let failures = 0;
const assert = (condition: unknown, message: string): void => {
  if (!condition) {
    failures += 1;
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`OK: ${message}`);
  }
};

const main = async () => {
  const { isDiagnosticBuild, ensureDiagnosticControlsHydrated, setDiagnosticControl } = await import(
    '../src/services/diagnostic-controls-service'
  );

  console.log(`Running with EXPO_PUBLIC_DIAGNOSTIC_BUILD=${process.env.EXPO_PUBLIC_DIAGNOSTIC_BUILD ?? '(unset)'} -> isDiagnosticBuild=${isDiagnosticBuild}\n`);

  if (!isDiagnosticBuild) {
    // --- Non-diagnostic (production/testflight) branch: everything must be permanently inert.
    const before = await ensureDiagnosticControlsHydrated();
    assert(before.adsDisabled === false && before.notificationsDisabled === false, 'outside the diagnostic build, controls start at the fixed ON/ON default');

    setDiagnosticControl('adsDisabled', true);
    const after = await ensureDiagnosticControlsHydrated();
    assert(after.adsDisabled === false, 'outside the diagnostic build, setDiagnosticControl is a genuine no-op (cannot be used to disable ads/notifications on a real build)');
    assert(memoryStorage.size === 0, 'outside the diagnostic build, nothing is ever written to storage -- confirms zero footprint on a production/testflight install');
  } else {
    // --- Diagnostic branch: the cold-launch hydration race, THEN persistence/toggle behavior.
    //
    // The race test must run FIRST, against this module's very first-ever hydration (its
    // internal `hydrated` flag starts false exactly once per process) -- that first hydration
    // IS the cold-launch moment item 2 of the review is about. Pre-seed storage with a value
    // from a SIMULATED prior session (ads already off) before ever calling the function under
    // test, so a correct result can only come from actually reading storage, never the default.
    memoryStorage.set('apparently:diagnostic:controls', JSON.stringify({ adsDisabled: true, notificationsDisabled: false }));

    // Real startup code (see _layout.tsx) calls this from more than one effect in the same
    // render pass -- two concurrent callers before hydration completes must BOTH receive the
    // real persisted value, never one getting a premature default because it asked a few
    // microtasks earlier than the other resolved.
    const [first, second] = await Promise.all([ensureDiagnosticControlsHydrated(), ensureDiagnosticControlsHydrated()]);
    assert(first.adsDisabled === true && second.adsDisabled === true, 'two concurrent first-ever callers both receive the real persisted value, not a premature default -- the exact cold-launch race item 2 of the review named');

    // --- Now that hydration has happened once, exercise the toggle/persistence behavior.
    setDiagnosticControl('notificationsDisabled', true);
    const afterToggle = await ensureDiagnosticControlsHydrated();
    assert(afterToggle.notificationsDisabled === true, 'setDiagnosticControl immediately updates the in-memory snapshot (reflected without waiting on the storage write)');
    assert(afterToggle.adsDisabled === true, 'toggling notificationsDisabled never affects the already-hydrated adsDisabled value -- the two controls are independent');

    const persisted = JSON.parse(memoryStorage.get('apparently:diagnostic:controls')!);
    assert(persisted.adsDisabled === true && persisted.notificationsDisabled === true, 'the toggle is actually written to storage (not just the in-memory snapshot), so it would survive a real cold launch');
  }

  console.log(`\n${failures === 0 ? 'ALL diagnostic-controls checks PASSED.' : failures + ' diagnostic-controls check(s) FAILED.'}`);
  if (failures > 0) process.exit(1);
};

void main();
