import { StyleSheet, View } from 'react-native';

import { Brand, Fonts } from '@/constants/theme';

// Today's celestial surface — built ENTIRELY from existing Brand tokens (plum/violet/gold/
// coral/pink/cream, theme.ts), already reserved for "authority/premium moments" per
// design-system.ts's own header comment. This is a broader, Today-specific application of
// those same tokens, not a new palette. No gradient library, no blur library — the "portal
// ring" and glow effects below use the exact same plain-View/boxShadow stacking technique
// already established and approved in src/components/creature/atmospheric-glow.tsx, so this
// reads as a continuation of the app's own visual language rather than an import.

export const Celestial = {
  background: Brand.plum,
  // A card surface sitting on the plum background — solid, warm-tinted fill rather than true
  // blur (React Native has no cross-platform backdrop-filter), matching how every other card
  // surface in this app is already built (solid/tinted fills, see design-system.ts's
  // CardStyle).
  glassFill: 'rgba(255,255,255,0.07)',
  glassBorder: 'rgba(255,255,255,0.16)',
  textPrimary: Brand.cream,
  textSecondary: 'rgba(255,249,245,0.7)',
  textMuted: 'rgba(255,249,245,0.5)',
  eyebrow: Brand.gold,
  accentGradientStart: Brand.gold,
  accentGradientEnd: Brand.pink,
} as const;

// Three faint concentric ring outlines, echoing the approved mockups' "portal" motif — plain
// bordered circles, no fill, absolutely positioned behind content. Purely decorative
// (pointerEvents="none"), sized relative to the container that renders it.
export function PortalRings() {
  const rings = [
    { size: 620, top: -180, opacity: 0.35 },
    { size: 460, top: -110, opacity: 0.5 },
    { size: 320, top: -40, opacity: 0.65 },
  ];
  return (
    <View pointerEvents="none" style={styles.ringField}>
      {rings.map((ring) => (
        <View
          key={ring.size}
          style={[
            styles.ring,
            {
              width: ring.size,
              height: ring.size,
              borderRadius: ring.size / 2,
              top: ring.top,
              left: '50%',
              marginLeft: -ring.size / 2,
              opacity: ring.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
}

// A soft, low-opacity violet/gold wash near the top of the page — same concentric stacked-
// circle technique as AtmosphericGlow, tuned down for a full-width background wash rather than
// a tight halo behind one object.
export function CelestialWash() {
  const violet = (opacity: number) => `rgba(121, 100, 232, ${opacity})`;
  const gold = (opacity: number) => `rgba(246, 184, 63, ${opacity})`;
  return (
    <View pointerEvents="none" style={styles.washField}>
      <View style={[styles.washRing, { width: 620, height: 620, borderRadius: 310, top: -260, left: -80, backgroundColor: violet(0.16) }]} />
      <View style={[styles.washRing, { width: 420, height: 420, borderRadius: 210, top: -120, right: -100, backgroundColor: gold(0.08) }]} />
    </View>
  );
}

// Shared panel language for Featured Quiz + Your Creature — same corner radius, border, inner
// padding, and gold-eyebrow convention so the two read as one family rather than two
// differently-weighted stacked cards. Distinct accent/glow colors stay per-component (passed
// separately); only the shared shell lives here.
export const Panel = StyleSheet.create({
  shell: {
    position: 'relative',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(246,184,63,0.18)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 22,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(246,184,63,0.1)',
  },
  eyebrow: {
    fontSize: 9.5,
    letterSpacing: 2.6,
    color: Brand.gold,
    textTransform: 'uppercase',
    fontWeight: '800',
  },
});

// Build 15 "one cohesive typography system" — the single shared type scale every celestial
// screen now draws from, replacing the per-screen ad hoc heading sizes (35/36/32/26px sans
// bold, etc.) that read as inconsistent/oversized. Two families only, used deliberately:
// Fonts.serif (italic) for personality-driven moments (questions, editorial headlines, result
// verdicts), Fonts.sans for everything else (labels, body, controls). Sizes/weights/line-
// heights/letter-spacing are fixed here so no screen re-guesses its own scale.
export const CelestialType = {
  // A witty, editorial page headline (Explore/Compare's own opening line) -- serif italic,
  // noticeably smaller than the old 35-36px bold-sans headings it replaces, so it reads as a
  // considered editorial voice rather than a shouted dashboard title.
  editorialHeadline: {
    fontFamily: Fonts?.serif,
    fontStyle: 'italic' as const,
    fontWeight: '500' as const,
    fontSize: 27,
    lineHeight: 33,
    letterSpacing: -0.4,
    color: '#FFFFFF',
  },
  // A personality-driven question -- Daily prompts, quiz questions, quiz intro titles. Serif
  // italic, one consistent size everywhere it appears instead of 20/23/26/32px scattered
  // across screens.
  question: {
    fontFamily: Fonts?.serif,
    fontStyle: 'italic' as const,
    fontWeight: '500' as const,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
    color: '#FFFFFF',
  },
  // A result/read verdict -- the single biggest, most celebratory serif moment, reserved for
  // the one or two true "reveal" beats per screen (quiz result title, Creature/Relic name).
  verdict: {
    fontFamily: Fonts?.serif,
    fontStyle: 'italic' as const,
    fontWeight: '600' as const,
    fontSize: 30,
    lineHeight: 35,
    letterSpacing: -0.4,
    color: '#FFFFFF',
  },
  // Small tracked uppercase label -- the app's one eyebrow convention, gold by default.
  eyebrow: {
    fontFamily: Fonts?.sans,
    fontSize: 11,
    fontWeight: '800' as const,
    letterSpacing: 1.2,
    color: Brand.gold,
  },
  // Sans section heading -- UI chrome (card titles, section labels), deliberately NOT serif:
  // serif is reserved for personality moments, not interface structure.
  heading: {
    fontFamily: Fonts?.sans,
    fontSize: 17,
    fontWeight: '800' as const,
    letterSpacing: -0.2,
    color: '#FFFFFF',
  },
  body: {
    fontFamily: Fonts?.sans,
    fontSize: 14.5,
    lineHeight: 21,
    fontWeight: '600' as const,
    color: 'rgba(255,249,245,0.72)',
  },
  caption: {
    fontFamily: Fonts?.sans,
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '600' as const,
    color: 'rgba(255,249,245,0.5)',
  },
  button: {
    fontFamily: Fonts?.sans,
    fontSize: 14.5,
    fontWeight: '800' as const,
  },
} as const;

const styles = StyleSheet.create({
  ringField: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 500,
  },
  ring: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  washField: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 420,
    overflow: 'hidden',
  },
  washRing: {
    position: 'absolute',
  },
});
