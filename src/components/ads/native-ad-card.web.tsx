// Web-only stand-in for native-ad-card.tsx -- see ads-config.web.ts's header comment for why
// this split exists. react-native-google-mobile-ads is native-only; no native ad can load on
// web, so this renders nothing, exactly like the real component's own documented "loading, no-
// fill, or error" fallback (a quiz list with one fewer card for this slot is the same strictly
// safer failure already established there) -- just the permanent case of it on this platform.

export function NativeAdExploreCard(_props: { underAgeOfConsent: boolean }) {
  return null;
}
