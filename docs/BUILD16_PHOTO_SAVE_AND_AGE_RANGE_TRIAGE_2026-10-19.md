# Build 16 TestFlight triage: Save Creature photo and missing age range

Owner reported two bugs with screenshots: Save to Photos returns 'That save didn’t go through. Try again?' for Zorafox; Settings age options begin at 18-24, omitting 13-17. Pause Daily editorial work.

## Age range
Confirmed: shared `src/data/onboarding.ts` AgeRange union and AGE_RANGES array omitted 13-17; used by onboarding and Settings. Added 13-17 to both. This is demographic profile selection only; separate immutable 13to17/18plus eligibility gate continues to control Apparently Private. Need verify age gate and profile consistency on device.

## Photo save
Confirmed error comes from catch around `MediaLibrary.saveToLibraryAsync(uri)` in `src/services/save-creature-image.ts`; capture succeeded and permission request granted, otherwise different messages would appear. Root native exception not yet known. Added console.error with native exception and URI in capture/save catches for diagnosis. **This is instrumentation, not a verified fix.** Investigate iOS Info.plist NSPhotoLibraryAddUsageDescription and file path/extension, native exception from device logs, then repair and test on device. No TestFlight build or submission performed.

Changes limited to the two noted source files and this note. No Daily content touched.
