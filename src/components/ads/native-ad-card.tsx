// Native sponsored card for the Explore feed. Styled to sit naturally in the same card list as
// a real quiz card (same corner radius/shadow language) WITHOUT being visually indistinguishable
// from one -- a clearly labeled "Ad" badge is always the first thing rendered, per the task's
// own explicit instruction ("clearly identified as an advertisement... not visually
// indistinguishable from actual quizzes"). Renders nothing at all (null) while loading, on
// no-fill, or on error -- never a placeholder box, never a retry prompt in the feed itself; a
// quiz list with one fewer card for this slot is a strictly safer failure than an empty/broken-
// looking card. Only ever mounted for a free, ad-eligible user -- see explore.tsx's own
// interleave logic, which checks useAdEligibility before rendering this at all.

import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeAd, NativeAdView, NativeAsset, NativeAssetType, useNativeAd } from 'react-native-google-mobile-ads';

import { Brand, Spacing } from '@/constants/theme';
import { Radius } from '@/constants/design-system';
import { logAnalyticsEvent } from '@/services/analytics-service';
import { AD_UNIT_IDS } from '@/services/ads-config';
import { prepareAdsConsent } from '@/services/ads-consent-service';

export function NativeAdExploreCard({ underAgeOfConsent }: { underAgeOfConsent: boolean }) {
  // Native ads are the one placement that can be the FIRST ad surface a session ever reaches
  // (a user who goes straight to Explore without ever touching a quiz/Daily) -- so this is the
  // other call site, alongside ad-interstitial-service.ts, that must run the one-time
  // consent/ATT/SDK-init flow itself rather than assuming it already happened. Memoized inside
  // prepareAdsConsent itself (module-level promise), so concurrent mounts of multiple native ad
  // cards on screen at once never run it twice.
  const [requestNonPersonalizedAdsOnly, setRequestNonPersonalizedAdsOnly] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    void prepareAdsConsent({ underAgeOfConsent }).then((result) => {
      if (!cancelled) {
        setRequestNonPersonalizedAdsOnly(result.requestNonPersonalizedAdsOnly);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [underAgeOfConsent]);

  const { status, nativeAd } = useNativeAd({
    adUnitId: AD_UNIT_IDS.native,
    requestOptions: requestNonPersonalizedAdsOnly !== null ? { requestNonPersonalizedAdsOnly } : undefined,
    autoLoad: requestNonPersonalizedAdsOnly !== null,
  });

  if (status !== 'loaded' || !nativeAd) {
    return null;
  }

  return <LoadedNativeAdCard nativeAd={nativeAd} />;
}

function LoadedNativeAdCard({ nativeAd }: { nativeAd: NativeAd }) {
  return (
    <NativeAdView
      style={styles.card}
      nativeAd={nativeAd}
      onLayout={() => logAnalyticsEvent({ name: 'ad_impression', properties: { placement: 'explore_native' } })}>
      <View style={styles.adBadgeRow}>
        <View style={styles.adBadge}>
          <Text style={styles.adBadgeText}>Ad</Text>
        </View>
        {nativeAd.advertiser && (
          <NativeAsset assetType={NativeAssetType.ADVERTISER}>
            <Text style={styles.advertiser}>{nativeAd.advertiser}</Text>
          </NativeAsset>
        )}
      </View>
      <View style={styles.bodyRow}>
        {nativeAd.icon && (
          <NativeAsset assetType={NativeAssetType.ICON}>
            <Image source={{ uri: nativeAd.icon.url }} style={styles.icon} />
          </NativeAsset>
        )}
        <View style={styles.textColumn}>
          <NativeAsset assetType={NativeAssetType.HEADLINE}>
            <Text style={styles.headline} numberOfLines={2}>
              {nativeAd.headline}
            </Text>
          </NativeAsset>
          <NativeAsset assetType={NativeAssetType.BODY}>
            <Text style={styles.body} numberOfLines={2}>
              {nativeAd.body}
            </Text>
          </NativeAsset>
        </View>
      </View>
      <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
        <Pressable style={styles.ctaButton}>
          <Text style={styles.ctaText}>{nativeAd.callToAction}</Text>
        </Pressable>
      </NativeAsset>
    </NativeAdView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    padding: Spacing.four,
    gap: Spacing.two,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  adBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  adBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  adBadgeText: {
    color: Brand.cream,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  advertiser: {
    color: 'rgba(255,249,245,0.6)',
    fontSize: 11,
    fontWeight: '700',
  },
  bodyRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'center',
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  textColumn: {
    flex: 1,
    gap: 2,
  },
  headline: {
    color: Brand.cream,
    fontSize: 15,
    fontWeight: '800',
  },
  body: {
    color: 'rgba(255,249,245,0.7)',
    fontSize: 13,
    fontWeight: '600',
  },
  ctaButton: {
    alignSelf: 'flex-start',
    backgroundColor: Brand.coral,
    borderRadius: 14,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    marginTop: Spacing.one,
  },
  ctaText: {
    color: Brand.plum,
    fontSize: 13,
    fontWeight: '800',
  },
});
