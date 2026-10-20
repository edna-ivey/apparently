import { Platform, type View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';

// Save Creature as a Photo (Build 16). Captures a dedicated, purpose-built export card (never
// the live screen itself -- no nav controls, no debug overlays, no unrelated UI) via
// react-native-view-shot, then writes it to the user's photo library with the MINIMUM
// permission that action actually needs: expo-media-library's write-only mode requests only
// NSPhotoLibraryAddUsageDescription (add-only) -- this feature never reads the user's existing
// photos, so it never requests NSPhotoLibraryUsageDescription at all (see app.json's
// expo-media-library plugin config, photosPermission: false).
//
// Web has no photo library to save to -- expo-media-library is a native-only module there.
// Callers should gate the Save action on Platform.OS !== 'web' (see creature-read.tsx) rather
// than this function silently no-oping, so the UI never shows a Save button that can't work.

export type SaveCreatureImageResult =
  | { ok: true }
  | { ok: false; reason: 'permission-denied' | 'capture-failed' | 'save-failed'; message: string };

export async function saveCreatureImageFromRef(viewRef: React.RefObject<View | null>): Promise<SaveCreatureImageResult> {
  let uri: string;
  try {
    uri = await captureRef(viewRef, { format: 'png', quality: 1 });
  } catch (error) {
    console.error('[CreaturePhoto] capture failed', error);
    return { ok: false, reason: 'capture-failed', message: 'We couldn’t capture your Creature just now. Try again?' };
  }

  // writeOnly: true -- requests ONLY the add-to-library permission, never full photo library
  // read access, matching the add-only Info.plist entry this feature is configured with.
  const permission = await MediaLibrary.requestPermissionsAsync(true);
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

export const isSaveCreatureImageSupported = (): boolean => Platform.OS !== 'web';
