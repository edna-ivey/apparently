import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { Celestial, CelestialType, CelestialWash, Panel, PortalRings } from '@/components/today/celestial';
import { useResponsiveContentWidth } from '@/hooks/use-responsive-content-width';
import {
  APPARENTLY_PRIVATE_ANNUAL_PRODUCT_ID,
  APPARENTLY_PRIVATE_ENTITLEMENT_ID,
  checkApparentlyPrivateAnnualIntroEligibility,
  getApparentlyPrivateOfferings,
  getSubscriptionManagementUrl,
  restorePurchases,
  subscribeToPackage,
  usePremiumStatus,
  type ApparentlyPrivateOfferings,
  type PurchasesPackage,
} from '@/services/purchases-service';

// Apparently Private's real paywall -- the one place a subscription can actually be bought or
// restored. Approved copy only (heading/support/kicker below, transcribed exactly as given);
// no invented discount/trial/urgency language. Every price shown is read from the live Store
// product (package.product.priceString/introPrice) -- $3.99/$29.99/$19.99 are the owner-
// locked TARGETS (see docs/app-store/OWNER_APP_STORE_ACTIONS.md), never the authoritative
// displayed number; whatever StoreKit actually returns is what renders. Never renders on web
// (see the unsupported-platform state) -- react-native-purchases' native purchase APIs are
// iOS/Android-build-only, see purchases-service.ts.
type PlanId = 'monthly' | 'annual';

type OfferingState =
  | { phase: 'loading' }
  | {
      phase: 'ready';
      offerings: ApparentlyPrivateOfferings;
      // Real Apple/StoreKit eligibility for the annual product's introductory ("Founding
      // Member") price -- checked once per load, never assumed. False (never true) until a
      // real SDK answer comes back; see checkApparentlyPrivateAnnualIntroEligibility's own
      // fail-closed behavior.
      annualIntroEligible: boolean;
    }
  | { phase: 'unavailable'; message: string };

export default function PaywallScreen() {
  const router = useRouter();
  const contentWidth = useResponsiveContentWidth();
  const premium = usePremiumStatus();

  const [offeringState, setOfferingState] = useState<OfferingState>({ phase: 'loading' });
  // Defaults to annual once it's known to exist (the better-value plan to lead with) --
  // reset to whichever plans are actually available each time offerings load, never assumed
  // ahead of that.
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('annual');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [restoreState, setRestoreState] = useState<{ phase: 'idle' | 'restoring' | 'done'; message?: string }>({ phase: 'idle' });
  // An already-active subscriber previously had no way to see the plan cards at all (the
  // paywall only ever rendered "You're already in"). Toggled by "View plans" below --
  // existing offerings are already being fetched in the background regardless of premium
  // status (loadOffering's effect runs unconditionally), so this never needs its own fetch.
  const [viewingPlansWhileActive, setViewingPlansWhileActive] = useState(false);

  const loadOffering = async () => {
    setOfferingState({ phase: 'loading' });
    const result = await getApparentlyPrivateOfferings();
    if (!result.ok) {
      setOfferingState({ phase: 'unavailable', message: result.message });
      return;
    }
    const annualProductId = result.offerings.annual?.product.identifier ?? APPARENTLY_PRIVATE_ANNUAL_PRODUCT_ID;
    const annualIntroEligible = result.offerings.annual ? await checkApparentlyPrivateAnnualIntroEligibility(annualProductId) : false;
    setOfferingState({ phase: 'ready', offerings: result.offerings, annualIntroEligible });
    setSelectedPlan(result.offerings.annual ? 'annual' : 'monthly');
  };

  useEffect(() => {
    // Fetching data on mount is one of the canonical, documented uses of an effect -- there is
    // no render-time equivalent for "go fetch this from the network." Scoped to this one line.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadOffering();
  }, []);

  const selectedPackage: PurchasesPackage | null =
    offeringState.phase === 'ready' ? (selectedPlan === 'annual' ? offeringState.offerings.annual : offeringState.offerings.monthly) : null;

  // The real product currently granting the entitlement, straight from RevenueCat's own
  // CustomerInfo -- never inferred from which plan is merely SELECTED in this UI. Null for a
  // free user, or if CustomerInfo hasn't loaded yet.
  const currentProductId = premium.customerInfo?.entitlements.active[APPARENTLY_PRIVATE_ENTITLEMENT_ID]?.productIdentifier ?? null;
  const isSelectedPlanCurrent = !!selectedPackage && !!currentProductId && selectedPackage.product.identifier === currentProductId;
  // Plans render for a brand-new (free) visitor as before, OR for an already-active
  // subscriber who explicitly asked to see them via "View plans" -- never a fake/duplicate
  // purchase screen shown unconditionally to someone already subscribed.
  const showPlans = premium.status !== 'premium' || viewingPlansWhileActive;

  const handleSubscribe = async () => {
    if (!selectedPackage || isPurchasing) {
      return;
    }
    setIsPurchasing(true);
    setPurchaseError(null);
    const result = await subscribeToPackage(selectedPackage);
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
        <PortalRings />
        <CelestialWash />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            <ThemedText style={styles.wordmark}>apparently you.</ThemedText>
            <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Close" accessibilityRole="button" style={styles.closeButton}>
              <ThemedText style={styles.closeText}>×</ThemedText>
            </Pressable>
          </View>

          <View style={styles.headingGroup}>
            <ThemedText style={styles.eyebrowTop}>👀 APPARENTLY PRIVATE</ThemedText>
            <ThemedText style={styles.heading}>The questions stop being polite in here.</ThemedText>
            <ThemedText style={styles.headingNote}>
              Some will gas you up. Some will clock you. Some might have you staring at the ceiling for a minute.
            </ThemedText>
          </View>

          {/* Real, already-true value explanation — the actual things Private unlocks, not
              invented marketing claims. Build 15 final copy correction: dropped the fixed
              "Seven ... quizzes" count (Private is an evolving premium experience, not a
              fixed bundle — a hardcoded number here would need editing every time the
              catalog grows) in favor of benefit-driven phrasing. Still exactly matches real,
              shipping functionality — nothing here promises unlimited content, a release
              schedule, or a feature that doesn't exist yet. */}
          <View style={styles.valueList}>
            {[
              ['👀', 'Exclusive Apparently Private quizzes, locked until you subscribe'],
              ['🌙', 'A daily Private question, answerable only here'],
              ['💎', 'Your Undercurrent and Relic — the identity layer Free never reaches'],
            ].map(([icon, copy]) => (
              <View key={copy} style={styles.valueRow}>
                <ThemedText style={styles.valueIcon}>{icon}</ThemedText>
                <ThemedText style={styles.valueText}>{copy}</ThemedText>
              </View>
            ))}
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
              {/* Lets an existing subscriber see real plan pricing (e.g. to compare monthly
                  vs. annual, or just confirm what they're paying) without faking a second
                  purchase screen -- the same real PlanCard/offering data every visitor sees,
                  gated behind one explicit tap rather than shown unconditionally. */}
              {Platform.OS !== 'web' && (
                <Pressable style={styles.manageCta} onPress={() => setViewingPlansWhileActive((current) => !current)}>
                  <ThemedText style={styles.manageCtaText}>{viewingPlansWhileActive ? 'Hide plans' : 'View plans →'}</ThemedText>
                </Pressable>
              )}
              {!viewingPlansWhileActive && (
                <Pressable style={styles.primaryCta} onPress={() => router.back()}>
                  <ThemedText style={styles.primaryCtaText}>Back to Apparently →</ThemedText>
                </Pressable>
              )}
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

          {showPlans && Platform.OS !== 'web' && (
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
                <View style={styles.plansGroup}>
                  {offeringState.offerings.annual && (
                    <PlanCard
                      pkg={offeringState.offerings.annual}
                      eyebrow={offeringState.annualIntroEligible && offeringState.offerings.annual.product.introPrice ? 'FOUNDING MEMBER' : 'ANNUAL'}
                      selected={selectedPlan === 'annual'}
                      isCurrent={offeringState.offerings.annual.product.identifier === currentProductId}
                      onPress={() => setSelectedPlan('annual')}
                    />
                  )}
                  {offeringState.offerings.monthly && (
                    <PlanCard
                      pkg={offeringState.offerings.monthly}
                      eyebrow="MONTHLY"
                      selected={selectedPlan === 'monthly'}
                      isCurrent={offeringState.offerings.monthly.product.identifier === currentProductId}
                      onPress={() => setSelectedPlan('monthly')}
                    />
                  )}

                  {purchaseError && <ThemedText style={styles.errorText}>{purchaseError}</ThemedText>}

                  {/* Disabled when the selected plan is already the real active plan --
                      never lets a tap attempt a duplicate purchase of what they already
                      have. A DIFFERENT plan while already premium is a real plan switch:
                      Purchases.purchasePackage itself (subscribeToPackage, unchanged) is
                      what StoreKit/RevenueCat use to apply the subscription-group upgrade/
                      downgrade -- both products already share one Apple subscription group
                      (see docs/app-store/OWNER_APP_STORE_ACTIONS.md), so no separate
                      switch-specific code path is needed here. */}
                  <Pressable
                    disabled={isPurchasing || !selectedPackage || isSelectedPlanCurrent}
                    style={[styles.primaryCta, (isPurchasing || !selectedPackage || isSelectedPlanCurrent) && styles.ctaDisabled]}
                    onPress={() => void handleSubscribe()}>
                    <ThemedText style={styles.primaryCtaText}>
                      {isPurchasing ? 'Subscribing…' : isSelectedPlanCurrent ? 'Current Plan' : premium.status === 'premium' ? 'Switch Plan →' : 'Subscribe →'}
                    </ThemedText>
                  </Pressable>
                </View>
              )}

              {/* Restore Purchases is useful whenever plans are visible -- a free visitor
                  who should already be subscribed (reinstalled app, lost local state), AND
                  an already-active subscriber confirming restore still works for this
                  device/account. Not gated on free-vs-premium, unlike "Not now"/legal below,
                  which only make sense for someone actually deciding whether to subscribe. */}
              <View style={styles.restoreRow}>
                <Pressable disabled={restoreState.phase === 'restoring'} onPress={() => void handleRestore()} style={styles.secondaryCta}>
                  <ThemedText style={styles.secondaryCtaText}>
                    {restoreState.phase === 'restoring' ? 'Restoring…' : 'Restore Purchases'}
                  </ThemedText>
                </Pressable>
                {restoreState.phase === 'done' && restoreState.message && <ThemedText style={styles.restoreMessage}>{restoreState.message}</ThemedText>}
              </View>
            </>
          )}

          {premium.status !== 'premium' && Platform.OS !== 'web' && (
            <>
              <Pressable style={styles.tertiaryCta} onPress={() => router.back()}>
                <ThemedText style={styles.tertiaryCtaText}>Not now</ThemedText>
              </Pressable>

              <View style={styles.legalRow}>
                <Pressable onPress={() => router.push('/privacy-policy')}>
                  <ThemedText style={styles.legalLinkText}>Privacy Policy</ThemedText>
                </Pressable>
                <ThemedText style={styles.legalDivider}>·</ThemedText>
                <Pressable onPress={() => router.push('/terms-of-use')}>
                  <ThemedText style={styles.legalLinkText}>Terms of Use</ThemedText>
                </Pressable>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

// ISO 8601 duration ("P1Y"/"P1M"/"P1W") -> a plain unit word for display. Reads the real
// product's own reported period rather than assuming "annual slot = year" -- if StoreKit ever
// reports something unexpected, this degrades to the raw string rather than silently asserting
// a wrong duration.
const formatSubscriptionPeriodUnit = (period: string | null): string => {
  switch (period) {
    case 'P1Y':
      return 'year';
    case 'P1M':
      return 'month';
    case 'P1W':
      return 'week';
    default:
      return period ?? '';
  }
};

// One selectable plan -- real StoreKit price/duration only. The Founding Member framing is
// ONLY ever shown when the caller has already confirmed (a) a real introductory price exists
// on this product and (b) this specific customer is Apple-eligible for it right now --
// PlanCard itself never decides eligibility, it only renders what it's told, so it can never
// accidentally promise a discount that wasn't actually verified.
function PlanCard({
  pkg,
  eyebrow,
  selected,
  isCurrent,
  onPress,
}: {
  pkg: PurchasesPackage;
  eyebrow: string;
  selected: boolean;
  // Whether THIS package's product is the real, currently-active entitlement-granting
  // product (from CustomerInfo, never inferred from UI selection) -- lets an existing
  // subscriber immediately see which plan they're actually on.
  isCurrent: boolean;
  onPress: () => void;
}) {
  const unit = formatSubscriptionPeriodUnit(pkg.product.subscriptionPeriod);
  const isFoundingMember = eyebrow === 'FOUNDING MEMBER' && pkg.product.introPrice;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${eyebrow} plan, ${isFoundingMember ? pkg.product.introPrice?.priceString : pkg.product.priceString} per ${unit}${isCurrent ? ', your current plan' : ''}`}
      style={[Panel.shell, styles.priceCard, selected && styles.priceCardSelected]}>
      <View style={[Panel.glow, styles.priceGlow]} />
      <View style={styles.priceEyebrowRow}>
        <ThemedText style={[Panel.eyebrow, styles.priceEyebrow]}>{eyebrow}</ThemedText>
        {isCurrent && (
          <View style={styles.currentPlanBadge}>
            <ThemedText style={styles.currentPlanBadgeText}>CURRENT PLAN</ThemedText>
          </View>
        )}
      </View>
      {isFoundingMember && pkg.product.introPrice ? (
        <>
          <View style={styles.priceRow}>
            <ThemedText style={styles.priceValue}>{pkg.product.introPrice.priceString}</ThemedText>
            <ThemedText style={styles.priceUnit}>for your first {unit}</ThemedText>
          </View>
          {/* Required upfront renewal disclosure -- the real StoreKit base price, not a
              hardcoded number, shown right alongside the discounted price, never hidden in
              fine print the user has to seek out. */}
          <ThemedText style={styles.renewalNote}>
            Then {pkg.product.priceString} per {unit}, billed automatically unless you cancel.
          </ThemedText>
        </>
      ) : (
        <View style={styles.priceRow}>
          <ThemedText style={styles.priceValue}>{pkg.product.priceString}</ThemedText>
          <ThemedText style={styles.priceUnit}>per {unit}</ThemedText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Already the approved dark celestial surface — unchanged value (Celestial.background ===
  // Brand.plum), switched to the shared token for consistency only.
  container: { flex: 1, backgroundColor: Celestial.background },
  safeArea: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: Celestial.background,
    ...Platform.select({
      web: { marginVertical: 28, borderRadius: 28, overflow: 'hidden' },
      default: {},
    }),
  },
  content: { paddingHorizontal: Spacing.four, paddingTop: Spacing.four, paddingBottom: Spacing.six, gap: Spacing.three },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 32 },
  wordmark: { color: Celestial.textPrimary, fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  closeButton: { minWidth: 44, minHeight: 32, justifyContent: 'center', alignItems: 'flex-end' },
  closeText: { color: 'rgba(255,249,245,0.7)', fontSize: 26, lineHeight: 26, fontWeight: '600' },
  headingGroup: { gap: 4, marginTop: Spacing.two },
  eyebrowTop: { ...CelestialType.eyebrow, color: Brand.coral },
  // Build 15: serif italic editorial headline, same unified scale as every other page
  // headline — "apparently private." (redundant with the eyebrow above it) dropped in favor
  // of leading with the actual approved positioning line.
  heading: { ...CelestialType.editorialHeadline, fontSize: 25, lineHeight: 31, marginTop: 4 },
  headingNote: { ...CelestialType.body, marginTop: Spacing.one },
  valueList: { gap: Spacing.two },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  valueIcon: { fontSize: 16 },
  valueText: { ...CelestialType.body, flex: 1 },
  // Two selectable plan cards stacked above one shared Subscribe button/error line.
  plansGroup: { gap: Spacing.two },
  priceCard: { gap: Spacing.one, borderColor: 'rgba(255,121,95,0.3)' },
  priceCardSelected: { borderColor: Brand.coral, borderWidth: 2 },
  priceGlow: { backgroundColor: 'rgba(255,121,95,0.2)' },
  priceEyebrowRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceEyebrow: { color: Brand.coral },
  currentPlanBadge: { backgroundColor: 'rgba(255,121,95,0.18)', borderRadius: 99, paddingHorizontal: Spacing.two, paddingVertical: 3 },
  currentPlanBadgeText: { color: Brand.coral, fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap', gap: Spacing.half },
  priceValue: { color: Brand.cream, fontSize: 36, lineHeight: 40, fontWeight: '900', letterSpacing: -0.5 },
  priceUnit: { color: 'rgba(255,249,245,0.6)', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  // Required renewal disclosure for the Founding Member intro price -- always visible on the
  // card itself, never hidden behind a tap or only shown after purchase.
  renewalNote: { color: 'rgba(255,249,245,0.6)', fontSize: 13, fontWeight: '600' },
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
  legalRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Spacing.two, paddingTop: Spacing.one },
  legalLinkText: { color: 'rgba(255,249,245,0.4)', fontSize: 12, fontWeight: '700' },
  legalDivider: { color: 'rgba(255,249,245,0.3)', fontSize: 12 },
  stateCard: { backgroundColor: 'rgba(255,249,245,0.06)', borderRadius: 24, padding: Spacing.four, gap: Spacing.two, borderWidth: 1, borderColor: 'rgba(255,249,245,0.14)', alignItems: 'center' },
  stateText: { color: 'rgba(255,249,245,0.8)', fontSize: 14, lineHeight: 20, fontWeight: '600', textAlign: 'center' },
  activeCard: { backgroundColor: 'rgba(255,249,245,0.06)', borderRadius: 24, padding: Spacing.four, gap: Spacing.two, borderWidth: 1, borderColor: 'rgba(255,249,245,0.14)' },
  activeEyebrow: { color: Brand.coral, fontSize: 11, fontWeight: '800', letterSpacing: 1.3 },
  activeTitle: { color: Brand.cream, fontSize: 24, fontWeight: '800' },
  manageCta: { alignSelf: 'flex-start', paddingVertical: Spacing.one },
  manageCtaText: { color: 'rgba(255,249,245,0.8)', fontSize: 14, fontWeight: '800' },
});
