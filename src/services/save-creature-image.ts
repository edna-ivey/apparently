import { Platform, type View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
// ROOT CAUSE (Build 16 "That save didn't go through" bug, confirmed by reading the installed
// expo-media-library@57.0.5 source, not assumed): this package's default entry point
// ("expo-media-library") now resolves to the NEW class-based "next" API. Its
// `saveToLibraryAsync` is a deprecated compatibility shim (src/legacyWarnings.ts) that
// UNCONDITIONALLY throws "Method saveToLibraryAsync ... is deprecated ... This method will
// throw in runtime" -- regardless of permissions, the capture succeeding, or device state.
// `requestPermissionsAsync` on the default export DOES still work (it forwards to the real
// native module), which is exactly why Build 16's permission prompt worked fine right up until
// the save call itself always failed. The package ships a real, fully-functional legacy entry
// point at "expo-media-library/legacy" (see its package.json "exports" map) whose
// saveToLibraryAsync/requestPermissionsAsync both call the actual native module -- switching
// the import below is the complete fix; no other logic changes needed.
import * as MediaLibrary from 'expo-media-library/legacy';
import * as Sharing from 'expo-sharing';

// Save/Share Creature as a Photo (Build 16, fixed in Build 17). Both actions capture the SAME
// dedicated, purpose-built export card (never the live screen/modal itself -- no nav controls,
// no close button, no debug overlays) via react-native-view-shot, through the one shared
// captureCreatureExportImage helper below, so Save and Share always operate on an identical
// image. Writes use the MINIMUM permission that action needs: expo-media-library's write-only
// mode requests only NSPhotoLibraryAddUsageDescription (add-only) -- this feature never reads
// the user's existing photos, so it never requests NSPhotoLibraryUsageDescription at all (see
// app.json's expo-media-library plugin config, photosPermission: false). Sharing requests no
// permission at all on iOS -- presenting the share sheet needs none.
//
// Web has no photo library/native share sheet -- both expo-media-library and expo-sharing are
// native-only here. Callers should gate on Platform.OS !== 'web' (isSaveCreatureImageSupported/
// isShareCreatureImageSupported) rather than these functions silently no-oping, so the UI never
// shows a button that can't work.

export type SaveCreatureImageResult =
  | { ok: true }
  | { ok: false; reason: 'permission-denied' | 'capture-failed' | 'save-failed'; message: string };

export type ShareCreatureImageResult =
  | { ok: true }
  | { ok: false; reason: 'capture-failed' | 'unavailable' | 'share-failed'; message: string };

// The one real capture call both actions go through -- same ref, same format/quality, so a
// saved image and a shared image are never subtly different artifacts of the same Creature.
const captureCreatureExportImage = (viewRef: React.RefObject<View | null>): Promise<string> =>
  captureRef(viewRef, { format: 'png', quality: 1 });

export async function saveCreatureImageFromRef(viewRef: React.RefObject<View | null>): Promise<SaveCreatureImageResult> {
  let uri: string;
  try {
    uri = await captureCreatureExportImage(viewRef);
  } catch (error) {
    console.error('[CreaturePhoto] capture failed', error);
    return { ok: false, reason: 'capture-failed', message: 'We couldn’t capture your Creature just now. Try again?' };
  }

  // writeOnly: true -- requests ONLY the add-to-library permission, never full photo library
  // read access, matching the add-only Info.plist entry this feature is configured with.
  let permission;
  try {
    permission = await MediaLibrary.requestPermissionsAsync(true);
  } catch (error) {
    console.error('[CreaturePhoto] permission request failed', error);
    return { ok: false, reason: 'save-failed', message: 'Photos access could not be requested. Please try again.' };
  }
  if (!permission.granted) {
    return {
      ok: false,
      reason: 'permission-denied',
      message: permission.canAskAgain
        ? 'Allow access to Photos to save your Creature.'
        : 'Photos access is turned off. Enable it in Settings to save your Creature.',
    };
  }

  try {
    await MediaLibrary.saveToLibraryAsync(uri);
  } catch (error) {
    console.error('[CreaturePhoto] photo library save failed', { uri, error });
    return { ok: false, reason: 'save-failed', message: 'That save didn’t go through. Try again?' };
  }

  return { ok: true };
}

export async function shareCreatureImageFromRef(viewRef: React.RefObject<View | null>): Promise<ShareCreatureImageResult> {
  let uri: string;
  try {
    uri = await captureCreatureExportImage(viewRef);
  } catch (error) {
    console.error('[CreaturePhoto] capture failed (share)', error);
    return { ok: false, reason: 'capture-failed', message: 'We couldn’t prepare your Creature to share. Try again?' };
  }

  let available: boolean;
  try {
    available = await Sharing.isAvailableAsync();
  } catch (error) {
    console.error('[CreaturePhoto] sharing availability check failed', error);
    return { ok: false, reason: 'unavailable', message: 'Sharing isn’t available right now.' };
  }
  if (!available) {
    return { ok: false, reason: 'unavailable', message: 'Sharing isn’t available on this device.' };
  }

  try {
    // iOS's native share-sheet completion handler resolves in every case -- completed,
    // cancelled, or failed inside the sheet -- it never rejects for a user cancellation (see
    // expo-sharing's own SharingModule.swift). A caught error here means shareAsync itself
    // couldn't even present the sheet (a real failure), never "the user tapped Cancel."
    await Sharing.shareAsync(uri, { UTI: 'public.png', mimeType: 'image/png', dialogTitle: 'Share your Creature' });
  } catch (error) {
    console.error('[CreaturePhoto] share failed', error);
    return { ok: false, reason: 'share-failed', message: 'We couldn’t open the share sheet. Try again?' };
  }

  return { ok: true };
}

export const isSaveCreatureImageSupported = (): boolean => Platform.OS !== 'web';
export const isShareCreatureImageSupported = (): boolean => Platform.OS !== 'web';
