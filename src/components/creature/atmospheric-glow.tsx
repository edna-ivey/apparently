import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

// Shared soft-magic atmosphere behind a Creature (You's hero, the First Form/evolution reveal
// overlay, Get Your Read). Visual-redesign pass: the Build 9 correction's two-blob box-shadow
// glow still read as "a white/pastel circle behind the Creature" (direct user feedback on the
// real preview) -- a plain box-shadow draws a flat, evenly-tinted disc with a blurred fringe
// around its OWN edge, not a true center-to-edge falloff, so at any size large enough to matter
// it reads as a container, not atmosphere.
//
// This replaces that with a genuine stepped radial approximation: each stack is several
// concentric, solid rgba-filled circles (real alpha, no boxShadow for the body of the stack) at
// shrinking size and shrinking opacity, which the eye blends into a smooth center-bright/
// edge-transparent gradient -- no gradient library, no new dependency, works identically on
// native and web. Two independently-offset stacks (warm blush shifted toward one corner, cool
// lilac shifted toward the opposite one) read as one asymmetric, colorful light source rather
// than a concentric "target." The outermost ring of each stack carries a wide, very-low-opacity
// boxShadow blur ONLY (on top of its own faint fill) so its own edge dissolves into the page
// rather than terminating in a visible line. A few low-opacity sparkle glyphs finish the
// "magical" read without tipping into game UI.
export function AtmosphericGlow({ size }: { size: number }) {
  const blush = (opacity: number) => `rgba(255, 196, 224, ${opacity})`;
  const lilac = (opacity: number) => `rgba(201, 180, 255, ${opacity})`;
  const gold = (opacity: number) => `rgba(246, 184, 63, ${opacity})`;

  const ring = (diameter: number, color: string, centerX: number, centerY: number, extraStyle?: object) => {
    const left = centerX - diameter / 2;
    const top = centerY - diameter / 2;
    return (
      <View
        style={[
          styles.ring,
          { width: diameter, height: diameter, borderRadius: diameter / 2, left, top, backgroundColor: color },
          extraStyle,
        ]}
      />
    );
  };

  // Primary (warm) stack center -- shifted up-and-left of the field's true center.
  const px = size * 0.44;
  const py = size * 0.42;
  // Secondary (cool) stack center -- shifted down-and-right, independently.
  const sx = size * 0.58;
  const sy = size * 0.6;

  return (
    <View pointerEvents="none" style={[styles.field, { width: size, height: size }]}>
      {/* Warm blush stack -- widest/faintest to narrowest/strongest */}
      {ring(size * 1.9, blush(0.05), px, py, {
        boxShadow: `0 0 ${size * 0.22}px ${size * 0.06}px ${blush(0.03)}`,
      })}
      {ring(size * 1.5, blush(0.08), px, py)}
      {ring(size * 1.12, blush(0.13), px, py)}
      {ring(size * 0.8, blush(0.18), px, py)}
      {ring(size * 0.52, blush(0.22), px, py)}

      {/* Cool lilac stack -- independent offset, lower overall strength, adds depth/color */}
      {ring(size * 1.3, lilac(0.045), sx, sy, {
        boxShadow: `0 0 ${size * 0.18}px ${size * 0.05}px ${lilac(0.03)}`,
      })}
      {ring(size * 0.92, lilac(0.07), sx, sy)}
      {ring(size * 0.6, lilac(0.09), sx, sy)}

      {/* A whisper of warmth right at the Creature's own base */}
      {ring(size * 0.46, gold(0.08), size / 2, size * 0.56)}

      {/* Tasteful sparkle accents -- low opacity, never more than a few */}
      <ThemedText style={[styles.sparkle, { left: size * 0.16, top: size * 0.22, fontSize: size * 0.045, opacity: 0.4 }]} accessibilityElementsHidden importantForAccessibility="no">
        ✦
      </ThemedText>
      <ThemedText style={[styles.sparkle, { left: size * 0.82, top: size * 0.3, fontSize: size * 0.03, opacity: 0.3 }]} accessibilityElementsHidden importantForAccessibility="no">
        ✦
      </ThemedText>
      <ThemedText style={[styles.sparkle, { left: size * 0.74, top: size * 0.78, fontSize: size * 0.035, opacity: 0.35 }]} accessibilityElementsHidden importantForAccessibility="no">
        ✦
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { position: 'absolute' },
  ring: { position: 'absolute' },
  // Gold, not white -- a white glint is nearly invisible against this field's pale cream/
  // blush/lilac tones; warm gold reads as a visible glint without looking game-y.
  sparkle: { position: 'absolute', color: '#D89A2E' },
});
