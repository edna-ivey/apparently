// The contextual, in-app explainer shown BEFORE the real iOS system permission prompt --
// task requirement: "Present a contextual explanation after the user experiences the app's
// value," never immediately at first launch. This is plain app UI, not an OS dialog -- tapping
// through it is what actually triggers requestNotificationPermission() (see this component's
// own onEnable), which is the only place the real system prompt gets requested. Shown at most
// once per device, regardless of the answer -- see hasShownContextualPermissionPrompt.

import { Modal, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { Radius } from '@/constants/design-system';

export function NotificationPermissionPrompt({
  visible,
  onEnable,
  onDismiss,
}: {
  visible: boolean;
  onEnable: () => void;
  onDismiss: () => void;
}) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onDismiss} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Pressable style={styles.card} onPress={(event) => event.stopPropagation()}>
          <ThemedText style={styles.eyebrow}>DON&apos;T MISS IT</ThemedText>
          <ThemedText style={styles.title}>Want a nudge?</ThemedText>
          <ThemedText style={styles.body}>
            We&apos;ll send you a quick reminder when today&apos;s Daily is still unanswered, and let you know when something
            real happens — a friend&apos;s response, your Creature taking shape. You pick exactly what you hear about, any
            time, in Settings.
          </ThemedText>
          <Pressable style={styles.primaryButton} onPress={onEnable} accessibilityRole="button">
            <ThemedText style={styles.primaryButtonText}>Turn on notifications →</ThemedText>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={onDismiss} accessibilityRole="button">
            <ThemedText style={styles.secondaryButtonText}>Not now</ThemedText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(23,21,29,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.five,
  },
  card: {
    backgroundColor: Brand.plum,
    borderRadius: Radius.xl,
    padding: Spacing.five,
    gap: Spacing.one,
    maxWidth: 380,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,249,245,0.14)',
  },
  eyebrow: { color: Brand.coral, fontSize: 11, fontWeight: '800', letterSpacing: 1.3 },
  title: { color: Brand.cream, fontSize: 24, fontWeight: '800', marginTop: Spacing.one },
  body: { color: 'rgba(255,249,245,0.78)', fontSize: 14, lineHeight: 20, fontWeight: '600', marginTop: Spacing.one },
  primaryButton: {
    backgroundColor: Brand.coral,
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: Spacing.three,
    marginTop: Spacing.three,
  },
  primaryButtonText: { color: Brand.plum, fontSize: 15, fontWeight: '800' },
  secondaryButton: { alignItems: 'center', paddingVertical: Spacing.two },
  secondaryButtonText: { color: 'rgba(255,249,245,0.65)', fontSize: 14, fontWeight: '700' },
});
