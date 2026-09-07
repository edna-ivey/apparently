import { Alert, Platform } from 'react-native';

// Small cross-platform confirm helper. react-native-web's Alert.alert does not reliably
// present a two-button choice, so web uses window.confirm directly.
export const confirmAction = (
  message: string,
  onConfirm: () => void,
  options?: { title?: string; confirmLabel?: string }
) => {
  const title = options?.title ?? 'Please confirm';
  const confirmLabel = options?.confirmLabel ?? 'Confirm';

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(message)) {
      onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
};
