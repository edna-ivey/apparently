import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandSignature } from '@/components/brand-signature';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { useResponsiveContentWidth } from '@/hooks/use-responsive-content-width';
import {
  getMonthlyOffering,
  getSubscriptionManagementUrl,
  restorePurchases,
  subscribeMonthly,
  usePremiumStatus,
  type MonthlyOfferingResult,
} from '@/services/purchases-service';

// Apparently Private's real paywall -- the one place a monthly subscription can actually be
// bought or restored. Approved copy only (heading/support/kicker below, transcribed exactly
// as given); no invented discount/trial/urgency language. Price is ALWAYS read from the live
// Store product (offering.package.product.priceString) -- $3.99 is the target, never the
// authoritative displayed number. Never renders on web (see the unsupported-platform state) --
// react-native-purchases' native purchase APIs are iOS/Android-build-only, see purchases-service.ts.
type OfferingState = { phase: 'loading' } | { phase: 'ready'; offering: MonthlyOfferingResult & { ok: true } } | { phase: 'unavailable'; message: string };

export default function PaywallScreen() {
  const router = useRouter();
  const contentWidth = useResponsiveContentWidth();
  const premium = usePremiumStatus();

  const [offeringState, setOfferingState] = useState<OfferingState>({ phase: 'loading' });
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [restoreState, setRestoreState] = useState<{ phase: 'idle' | 'restoring' | 'done'; message?: string }>({ phase: 'idle' });

  const loadOffering = async () => {
    setOfferingState({ phase: 'loading' });
    const result = await getMonthlyOffering();
    setOfferingState(result.ok ? { phase: 'ready', offering: result } : { phase: 'unavailable', message: result.message });
  };

  useEffect(() => {
    void loadOffering();
  }, []);

  const handleSubscribe = async () => {
    if (offeringState.phase !== 'ready' || isPurchasing) {
      return;
    }
    setIsPurchasing(true);
    setPurchaseError(null);
    const result = await subscribeMonthly(offeringState.offering.package);
    setIsPurchasing(false);
    if (!result.ok) {
      setPurchaseError(result.message);
      return;
    }
    if (result.status === 'purchased') {
      // Premium state is already live via purchases-service's own CustomerInfo listener by
      // the time this resolves -- dismissing here just closes the paywall on top of that
      // already-updated truth, never a locally-faked "success" state.
      router.back();
    }
    // status === 'cancelled': stay on the paywall, no error shown, user remains free.
  };

  const handleRestore = async () => {
    setRestoreState({ phase: 'restoring' });
    const result = await restorePurchases();
    if (!result.ok) {
      setRestoreState({ phase: 'done', message: result.message });
      return;
    }
    setRestoreState({
      phase: 'done',
      message: result.restored ? 'Apparently Private is active on this account.' : 'No active Apparently Private subscription was found.',
    });
  };

  const managementUrl = getSubscriptionManagementUrl();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={[styles.safeArea, contentWidth ? { maxWidth: contentWidth } : null]}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Close" accessibilityRole="button" style={styles.closeButton}>
              <ThemedText style={styles.closeText}>×</ThemedText>
            </Pressable>
          </View>

          <BrandSignature variant="mark" />

          <View style={styles.headingGroup}>
            <ThemedText style={styles.heading}>apparently private.</ThemedText>
            <ThemedText style={styles.headingSupport}>The questions stop being polite in here.</ThemedText>
            <ThemedText style={styles.headingNote}>
              Some will gas you up. Some will clock you. Some might have you staring at the ceiling for a minute. {'\u{1F440}'}
            </ThemedText>
          </View>

          {premium.status === 'premium' && (
            <View style={styles.activeCard}>
              <ThemedText style={styles.activeEyebrow}>APPARENTLY PRIVATE</ThemedText>
              <ThemedText style={styles.activeTitle}>You&apos;re already in.</ThemedText>
              {managementUrl && Platform.OS !== 'web' && (
                <Pressable style={styles.manageCta} onPress={() => void Linking.openURL(managementUrl)}>
                  <ThemedText style={styles.manageCtaText}>Manage subscription →</ThemedText>
                </Pressable>
              )}
              <Pressable style={styles.primaryCta} onPress={() => router.back()}>
                <ThemedText style={styles.primaryCtaText}>Back to Apparently →</ThemedText>
              </Pressable>
            </View>
          )}

          {premium.status !== 'premium' && Platform.OS === 'web' && (
            <View style={styles.stateCard}>
              <ThemedText style={styles.stateText}>Subscribing to Apparently Private is available in the iOS app.</ThemedText>
              <Pressable style={styles.primaryCta} onPress={() => router.back()}>
                <ThemedText style={styles.primaryCtaText}>Back →</ThemedText>
              </Pressable>
            </View>
          )}

          {premium.status !== 'premium' && Platform.OS !== 'web' && (
            <>
              {offeringState.phase === 'loading' && (
                <View style={styles.stateCard}>
                  <ThemedText style={styles.stateText}>Loading…</ThemedText>
                </View>
              )}

              {offeringState.phase === 'unavailable' && (
                <View style={styles.stateCard}>
                  <ThemedText style={styles.stateText}>{offeringState.message}</ThemedText>
                  <Pressable style={styles.secondaryCta} onPress={() => void loadOffering()}>
                    <ThemedText style={styles.secondaryCtaText}>Try again →</ThemedText>
                  </Pressable>
                </View>
              )}

              {offeringState.phase === 'ready' && (
                <View style={styles.priceCard}>
                  <ThemedText style={styles.priceEyebrow}>APPARENTLY PRIVATE</ThemedText>
                  <View style={styles.priceRow}>
                    <ThemedText style={styles.priceValue}>{offeringState.offering.package.product.priceString}</ThemedText>
                    <ThemedText style={styles.priceUnit}>/month</ThemedText>
                  </View>

                  {purchaseError && <ThemedText style={styles.errorText}>{purchaseError}</ThemedText>}

                  <Pressable disabled={isPurchasing} style={[styles.primaryCta, isPurchasing && styles.ctaDisabled]} onPress={() => void handleSubscribe()}>
                    <ThemedText style={styles.primaryCtaText}>{isPurchasing ? 'Subscribing…' : 'Subscribe →'}</ThemedText>
                  </Pressable>
                </View>
              )}

              <View style={styles.restoreRow}>
                <Pressable disabled={restoreState.phase === 'restoring'} onPress={() => void handleRestore()} style={styles.secondaryCta}>
                  <ThemedText style={styles.secondaryCtaText}>
                    {restoreState.phase === 'restoring' ? 'Restoring…' : 'Restore Purchases'}
                  </ThemedText>
                </Pressable>
                {restoreState.phase === 'done' && restoreState.message && <ThemedText style={styles.restoreMessage}>{restoreState.message}</ThemedText>}
              </View>

              <Pressable style={styles.tertiaryCta} onPress={() => router.back()}>
                <ThemedText style={styles.tertiaryCtaText}>Not now</ThemedText>
              </Pressable>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.plum },
  safeArea: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: Brand.plum,
    ...Platform.select({
      web: { marginVertical: 28, borderRadius: 28, overflow: 'hidden' },
      default: {},
    }),
  },
  content: { paddingHorizontal: Spacing.four, paddingTop: Spacing.four, paddingBottom: Spacing.six, gap: Spacing.four },
  topRow: { flexDirection: 'row', justifyContent: 'flex-end', minHeight: 28 },
  closeButton: { minWidth: 44, minHeight: 32, justifyContent: 'center', alignItems: 'flex-end' },
  closeText: { color: 'rgba(255,249,245,0.7)', fontSize: 26, lineHeight: 26, fontWeight: '600' },
  headingGroup: { gap: Spacing.one },
  heading: { color: Brand.cream, fontSize: 32, lineHeight: 37, fontWeight: '800', letterSpacing: -0.7 },
  headingSupport: { color: 'rgba(255,249,245,0.85)', fontSize: 16, lineHeight: 22, fontWeight: '700' },
  headingNote: { color: 'rgba(255,249,245,0.65)', fontSize: 14, lineHeight: 20, fontWeight: '600', marginTop: Spacing.one },
  priceCard: { backgroundColor: 'rgba(255,249,245,0.06)', borderRadius: 24, padding: Spacing.four, gap: Spacing.two, borderWidth: 1, borderColor: 'rgba(255,249,245,0.14)' },
  priceEyebrow: { color: Brand.coral, fontSize: 11, fontWeight: '800', letterSpacing: 1.3 },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap', gap: Spacing.half },
  priceValue: { color: Brand.cream, fontSize: 36, lineHeight: 40, fontWeight: '900', letterSpacing: -0.5 },
  priceUnit: { color: 'rgba(255,249,245,0.6)', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  errorText: { color: Brand.coral, fontSize: 13, lineHeight: 18, fontWeight: '600' },
  primaryCta: { backgroundColor: Brand.coral, borderRadius: 16, alignItems: 'center', paddingVertical: Spacing.three, marginTop: Spacing.one },
  primaryCtaText: { color: Brand.plum, fontSize: 16, fontWeight: '800' },
  ctaDisabled: { opacity: 0.5 },
  restoreRow: { alignItems: 'center', gap: Spacing.one },
  secondaryCta: { alignSelf: 'center', paddingVertical: Spacing.two, paddingHorizontal: Spacing.three },
  secondaryCtaText: { color: 'rgba(255,249,245,0.8)', fontSize: 14, fontWeight: '800' },
  restoreMessage: { color: 'rgba(255,249,245,0.65)', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  tertiaryCta: { alignItems: 'center', paddingVertical: Spacing.two },
  tertiaryCtaText: { color: 'rgba(255,249,245,0.5)', fontSize: 14, fontWeight: '700' },
  stateCard: { backgroundColor: 'rgba(255,249,245,0.06)', borderRadius: 24, padding: Spacing.four, gap: Spacing.two, borderWidth: 1, borderColor: 'rgba(255,249,245,0.14)', alignItems: 'center' },
  stateText: { color: 'rgba(255,249,245,0.8)', fontSize: 14, lineHeight: 20, fontWeight: '600', textAlign: 'center' },
  activeCard: { backgroundColor: 'rgba(255,249,245,0.06)', borderRadius: 24, padding: Spacing.four, gap: Spacing.two, borderWidth: 1, borderColor: 'rgba(255,249,245,0.14)' },
  activeEyebrow: { color: Brand.coral, fontSize: 11, fontWeight: '800', letterSpacing: 1.3 },
  activeTitle: { color: Brand.cream, fontSize: 24, fontWeight: '800' },
  manageCta: { alignSelf: 'flex-start', paddingVertical: Spacing.one },
  manageCtaText: { color: 'rgba(255,249,245,0.8)', fontSize: 14, fontWeight: '800' },
});
