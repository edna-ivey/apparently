import { Redirect } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { CardStyle, Radius } from '@/constants/design-system';
import { isErrorReportingReady, reportBackendFailure, triggerTestError } from '@/services/observability';

// Dev-only intentional error triggers for Work Package 2 -- same __DEV__-redirect pattern as
// every other src/app/dev/* screen (relic-lab.tsx) and src/app/creature-lab.tsx, so this is
// structurally unreachable in any production build, never a normal consumer action.
function ObservabilityLabInner() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <ThemedText style={styles.title}>Observability Lab</ThemedText>
          <ThemedText style={styles.subtitle}>Dev-only. Sentry ready: {String(isErrorReportingReady())}</ThemedText>

          <Pressable style={styles.button} onPress={() => reportBackendFailure({ operation: 'submit_quiz_result', errorCode: 'TEST', recoverable: true }, new Error('Test backend failure'))}>
            <ThemedText style={styles.buttonText}>Trigger reportBackendFailure</ThemedText>
          </Pressable>

          <Pressable style={styles.button} onPress={() => triggerTestError('reported')}>
            <ThemedText style={styles.buttonText}>Trigger reportUnexpectedError</ThemedText>
          </Pressable>

          <Pressable style={[styles.button, styles.dangerButton]} onPress={() => triggerTestError('thrown')}>
            <ThemedText style={styles.buttonText}>Throw (test ErrorBoundary)</ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

export default function ObservabilityLabScreen() {
  if (!__DEV__) {
    return <Redirect href="/" />;
  }
  return <ObservabilityLabInner />;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { flex: 1, padding: Spacing.four, gap: Spacing.three },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { color: Brand.inkSecondary, fontSize: 13 },
  button: { ...CardStyle.base, borderRadius: Radius.sm, alignItems: 'center' },
  dangerButton: { backgroundColor: '#FBEAE9', borderColor: '#F1C4C2' },
  buttonText: { fontWeight: '700' },
});
