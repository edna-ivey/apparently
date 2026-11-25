import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandSignature } from '@/components/brand-signature';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { CardStyle, Radius, Surface, Type } from '@/constants/design-system';
import { reportUnexpectedError } from '@/services/observability';

// App-level catastrophic-render-failure fallback — Work Package 2 §6. Deliberately the ONLY
// error boundary in the app (wraps the whole Stack in src/app/_layout.tsx) rather than one per
// screen: a render error this high up is already an "unexpected" failure by definition (every
// known/expected failure state in this app — loading/error/empty — is handled by the screen
// itself returning its own UI, never by throwing). Reuses the exact stateCard/retry visual
// pattern already established on creature-read.tsx/relic-read.tsx rather than inventing a new
// one, so a worst-case screen still looks like Apparently You, not a bare crash page.
//
// React class components are still required for error boundaries — componentDidCatch/
// getDerivedStateFromError have no hook equivalent.

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Reported exactly once here, at the boundary — call sites further down never need their
    // own reporting for a render error, only for their own async/backend failures (see
    // reportBackendFailure elsewhere). componentStack is code structure, never user content.
    reportUnexpectedError(error, { boundary: 'root', screen: info.componentStack?.split('\n')[1]?.trim() });
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <BrandSignature variant="mark" />
            <View style={styles.stateCard}>
              <ThemedText style={styles.title}>Something went sideways.</ThemedText>
              <ThemedText style={styles.stateText}>
                Apparently hit a snag. Nothing about your answers or your read was lost — try again.
              </ThemedText>
              <Pressable style={styles.retryButton} onPress={this.handleRetry} accessibilityRole="button">
                <ThemedText style={styles.retryButtonText}>Try again →</ThemedText>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Surface.pageDeep },
  safeArea: { flex: 1, width: '100%', backgroundColor: Surface.page },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.four, gap: Spacing.four },
  stateCard: { ...CardStyle.base, alignItems: 'center', gap: Spacing.two, maxWidth: 360 },
  title: { ...Type.displaySmall, textAlign: 'center' },
  stateText: { color: Brand.inkSecondary, fontSize: 14, lineHeight: 20, fontWeight: '600', textAlign: 'center' },
  retryButton: {
    marginTop: Spacing.one,
    minHeight: 44,
    borderRadius: Radius.pill,
    backgroundColor: Brand.plum,
    paddingHorizontal: Spacing.four,
    paddingVertical: 10,
    justifyContent: 'center',
    boxShadow: '0 10px 24px rgba(36, 1, 31, 0.22)',
  },
  retryButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', letterSpacing: 0.6 },
});
