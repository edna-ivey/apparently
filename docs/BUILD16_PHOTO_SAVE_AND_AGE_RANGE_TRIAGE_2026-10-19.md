# Build 16 TestFlight triage: Save Creature photo and missing age range

Owner reported two bugs with screenshots: Save to Photos returns 'That save didn’t go through. Try again?' for Zorafox; Settings age options begin at 18-24, omitting 13-17. Pause Daily editorial work.

## Age range
Confirmed: shared `src/data/onboarding.ts` AgeRange union and AGE_RANGES array omitted 13-17; used by onboarding and Settings. Added 13-17 to both. This is demographic profile selection only; separate immutable 13to17/18plus eligibility gate continues to control Apparently Private. Need verify age gate and profile consistency on device.

## Photo save
Confirmed error comes from catch around `MediaLibrary.saveToLibraryAsync(uri)` in `src/services/save-creature-image.ts`; capture succeeded and permission request granted, otherwise different messages would appear. Root native exception not yet known. Added console.error with native exception and URI in capture/save catches for diagnosis. **This is instrumentation, not a verified fix.** Investigate iOS Info.plist NSPhotoLibraryAddUsageDescription and file path/extension, native exception from device logs, then repair and test on device. No TestFlight build or submission performed.

Changes limited to the two noted source files and this note. No Daily content touched.

## Resolution (Build 17)

**Photo save — root cause confirmed, fixed.** The instrumented console.error above was never triggered by device state — reading the installed `expo-media-library@57.0.5` source directly showed its default/"next" entry point's `saveToLibraryAsync` is a deprecated shim that unconditionally throws at runtime (`src/legacyWarnings.ts`), independent of permissions or the capture. `requestPermissionsAsync` on that same default export still works correctly, which is exactly why the permission prompt succeeded while the save itself always failed. Fix: `src/services/save-creature-image.ts` now imports from `expo-media-library/legacy`, the package's real, fully-functional entry point — no other logic change. Also added native Share (`expo-sharing`) and a premium full-screen Creature preview modal in `creature-read.tsx`, replacing the always-visible duplicate export card with the one tappable primary avatar. See `docs/APPARENTLY_YOU_PRODUCT_CREATIVE_BIBLE.md` §73 for the full approved UX direction and status, and the Build 17 completion report for the device test checklist (not yet run on a physical device as of this note).

**Age range — verified consistent, no further change needed.** `AGE_RANGES`/Settings/onboarding already share one array; Settings never imports the age-eligibility module and cannot reach it. Confirmed by `scripts/validate-creature-preview-photo-and-age-range.ts`.
