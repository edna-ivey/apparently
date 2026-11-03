import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Image } from 'expo-image';
import { ScrollView, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';

import { CreatureAvatar } from '@/components/creature/creature-avatar';
import { RelicAvatar } from '@/components/relic/relic-avatar';
import { RelicRenderer } from '@/components/relic/relic-renderer';
import {
  APPROVED_BASE_CORRECTIONS,
  APPROVED_COLOR_CORRECTIONS,
  APPROVED_EFFECT_CORRECTIONS,
  GLOBAL_BASE_OPACITY,
  GLOBAL_BASE_TRANSFORM,
  GLOBAL_COLOR_OPACITY,
  GLOBAL_COLOR_TRANSFORM,
  GLOBAL_EFFECT_OPACITY,
  GLOBAL_EFFECT_TRANSFORM,
} from '@/data/relic/relic-production-config';
import { colorFamilyByKey, effectByKey, relicTraitByKey } from '@/data/relic/relic-assets';
import { resolveOpacity, resolveTransform as resolveRelicTransform } from '@/data/relic/relic-transform';
import { CREATURE_TEST_ASSETS } from '@/data/creature-test/creature-test-assets';
import type { CreatureTestRecipe } from '@/components/creature-test/creature-test-composer';
import {
  BODY_CANVAS_INSET,
  BODY_CANVAS_SIZE,
  BODY_RIG,
  COMPOSITION_CANVAS_SIZE,
  buildInitialAssetCorrections,
  buildInitialSlotDefaults,
  resolveEyeTransform,
  resolveTransform,
} from '@/data/creature-test/creature-test-config';

type CachePolicy = 'none' | 'disk' | 'memory' | 'memory-disk';

// ISOLATED EXPERIMENT SCREEN, __DEV__ only, not linked from any navigation (same convention as
// /creature-lab and /dev/relic-lab). Reachable only at /dev/png-experiment via direct deep
// link. Compares the EXISTING, UNMODIFIED production SVG-wrapped Creature/Relic rendering path
// against a second, independent rendering path using the byte-exact PNGs extracted from those
// same SVG files by scripts/experiment-extract-embedded-png.ts (no redraw, resize, recolor, or
// recompression of any kind). Nothing here replaces, deletes, or modifies any production asset,
// component, or screen. Purely additive and fully reversible: deleting this one file (and
// assets/_png_experiment/) removes the entire experiment with zero trace.
//
// Driven by query params rather than taps, so it can be exercised by deep link alone:
//   ?mode=before|after|both (default both)
//   &autoexport=1 -- after a fixed settle delay, runs the real Save-to-Photos capture path
//     (the exact captureRef({format:'png',quality:1}) call save-creature-image.ts uses) on
//     every visible section and reports capture duration + result.
// A fixed delay (not an onLoad callback count) gates "ready," deliberately: CreatureAvatar/
// RelicAvatar (the real production components, used unmodified for the BEFORE path) expose no
// per-layer load hook to a caller, so onLoad-counting would only ever work for one side of the
// comparison. A uniform delay is the fair, honest way to treat both sides identically.
//
// Fixed test identities, used for BOTH versions, so size/background/layer order/positioning are
// identical by construction:
//  - Creature: all five slots = 'strong' (same recipe CREATURE_TEST_ASSETS.strong already
//    defines in production).
//  - Relic: base='accountability', color='protectionDefense', effect='halo' -- a simple,
//    fully-qualified three-layer combo.

// Three preset recipes, selectable via ?recipe=, to check the PNG path isn't coincidentally
// correct only for the one category originally tested:
//  - 'strong': all five slots the same category (the original test).
//  - 'playful': all five slots a DIFFERENT single category, as its own independent control.
//  - 'mixed': a different category per slot (body=strong, tail=playful, wings=visionary,
//    earsHorns=bold, eyes=curious) -- exercises every slot's own require() entry independently,
//    catching any accidental source mix-up between slots that an all-one-category recipe could
//    never reveal. Production's own assetCorrections are empty for every category today (see
//    assets/creatures/creature-config.json), so every category already renders with the exact
//    same slotDefaults transform regardless of which art is in it -- 'mixed' therefore isn't
//    testing different TRANSFORM math (there isn't any to differ), it's testing that each slot's
//    PNG source resolves to the right file for its own chosen category.
const RECIPES: Record<string, CreatureTestRecipe> = {
  strong: { body: 'strong', tail: 'strong', wings: 'strong', earsHorns: 'strong', eyes: 'strong' },
  playful: { body: 'playful', tail: 'playful', wings: 'playful', earsHorns: 'playful', eyes: 'playful' },
  mixed: { body: 'strong', tail: 'playful', wings: 'visionary', earsHorns: 'bold', eyes: 'curious' },
};

const RELIC_IDENTITY = {
  base: 'accountability' as const,
  color: 'protectionDefense' as const,
  effect: 'halo' as const,
};

type CreatureSlot = 'body' | 'tail' | 'wings' | 'earsHorns' | 'eyes';

// Hand-written require() map for the extracted PNG experiment files -- Metro needs a static
// string literal per require(), so this mirrors the same require() pattern creature-test-
// assets.ts uses for the real .svg files, pointed at assets/_png_experiment/ instead. Every path
// below matches scripts/experiment-extract-embedded-png.ts's own output exactly. Covers every
// category the three preset recipes above actually use (strong, playful, visionary, bold,
// curious) -- not all 8, since nothing here needs the other 3.
const PNG_CREATURE_SOURCES: Record<string, Record<CreatureSlot, ImageSourcePropType>> = {
  strong: {
    body: require('../../../assets/_png_experiment/creatures/apparently_you_8_base_bodies_svg/apparently_you_strong_base.png'),
    tail: require('../../../assets/_png_experiment/creatures/apparently_you_8_tails_svg_v2/apparently_you_strong_tail_v2.png'),
    wings: require('../../../assets/_png_experiment/creatures/apparently_you_8_wings_svg/apparently_you_strong_wings.png'),
    earsHorns: require('../../../assets/_png_experiment/creatures/apparently_you_8_ears_horns_svg/apparently_you_strong_ears_horns.png'),
    eyes: require('../../../assets/_png_experiment/creatures/apparently_you_8_eyes_svg/apparently_you_strong_eyes.png'),
  },
  playful: {
    body: require('../../../assets/_png_experiment/creatures/apparently_you_8_base_bodies_svg/apparently_you_playful_base.png'),
    tail: require('../../../assets/_png_experiment/creatures/apparently_you_8_tails_svg_v2/apparently_you_playful_tail_v2.png'),
    wings: require('../../../assets/_png_experiment/creatures/apparently_you_8_wings_svg/apparently_you_playful_wings.png'),
    earsHorns: require('../../../assets/_png_experiment/creatures/apparently_you_8_ears_horns_svg/apparently_you_playful_ears_horns.png'),
    eyes: require('../../../assets/_png_experiment/creatures/apparently_you_8_eyes_svg/apparently_you_playful_eyes.png'),
  },
  visionary: {
    body: require('../../../assets/_png_experiment/creatures/apparently_you_8_base_bodies_svg/apparently_you_visionary_base.png'),
    tail: require('../../../assets/_png_experiment/creatures/apparently_you_8_tails_svg_v2/apparently_you_visionary_tail_v2.png'),
    wings: require('../../../assets/_png_experiment/creatures/apparently_you_8_wings_svg/apparently_you_visionary_wings.png'),
    earsHorns: require('../../../assets/_png_experiment/creatures/apparently_you_8_ears_horns_svg/apparently_you_visionary_ears_horns.png'),
    eyes: require('../../../assets/_png_experiment/creatures/apparently_you_8_eyes_svg/apparently_you_visionary_eyes.png'),
  },
  bold: {
    body: require('../../../assets/_png_experiment/creatures/apparently_you_8_base_bodies_svg/apparently_you_bold_base.png'),
    tail: require('../../../assets/_png_experiment/creatures/apparently_you_8_tails_svg_v2/apparently_you_bold_tail_v2.png'),
    wings: require('../../../assets/_png_experiment/creatures/apparently_you_8_wings_svg/apparently_you_bold_wings.png'),
    earsHorns: require('../../../assets/_png_experiment/creatures/apparently_you_8_ears_horns_svg/apparently_you_bold_ears_horns.png'),
    eyes: require('../../../assets/_png_experiment/creatures/apparently_you_8_eyes_svg/apparently_you_bold_eyes.png'),
  },
  curious: {
    body: require('../../../assets/_png_experiment/creatures/apparently_you_8_base_bodies_svg/apparently_you_curious_base.png'),
    tail: require('../../../assets/_png_experiment/creatures/apparently_you_8_tails_svg_v2/apparently_you_curious_tail_v2.png'),
    wings: require('../../../assets/_png_experiment/creatures/apparently_you_8_wings_svg/apparently_you_curious_wings.png'),
    earsHorns: require('../../../assets/_png_experiment/creatures/apparently_you_8_ears_horns_svg/apparently_you_curious_ears_horns.png'),
    eyes: require('../../../assets/_png_experiment/creatures/apparently_you_8_eyes_svg/apparently_you_curious_eyes.png'),
  },
};

const PNG_RELIC_BASE = require('../../../assets/_png_experiment/relics/relic/apparently_you_relic_seal.png');
const PNG_RELIC_COLOR = require('../../../assets/_png_experiment/relics/color/apparently_you_relic_color_protection_defense.png');
const PNG_RELIC_EFFECT = require('../../../assets/_png_experiment/relics/effect/apparently_you_relic_effect_halo.png');

const CREATURE_SIZE = 280;
const RELIC_SIZE = 200;
const READY_DELAY_MS = 1200;

// FIRST ATTEMPT AT THIS FUNCTION WAS WRONG (caught by this experiment's own pixel diff, not
// assumed correct): a naive absoluteFill-every-layer version renders each image at the full
// `size x size` stage, which visibly over-zooms compared to production -- CreatureTestComposer
// actually renders each layer inside a SMALLER box inset within a larger COMPOSITION_CANVAS_SIZE
// stage (room for wings/ears to extend past the 1254 body canvas without clipping), then applies
// each slot's own x/y/scale/rotation transform on top. This version replicates that exact math
// (same constants/helpers CreatureTestComposer itself uses), just swapping PNG sources in for
// the SVG-wrapper require()s -- same stage size, same inset, same per-slot transform, same paint
// order (wings, tail, body, earsHorns, eyes).
function PngCreatureComposer({ size, recipe }: { size: number; recipe: CreatureTestRecipe }) {
  const slotDefaults = buildInitialSlotDefaults();
  const assetCorrections = buildInitialAssetCorrections();
  const unit = size / COMPOSITION_CANVAS_SIZE;
  const bodyCanvasPx = BODY_CANVAS_SIZE * unit;
  const bodyOffsetPx = BODY_CANVAS_INSET * unit;
  const order: CreatureSlot[] = ['wings', 'tail', 'body', 'earsHorns', 'eyes'];

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      {order.map((slot) => {
        const category = recipe[slot];
        const correction = assetCorrections[category];
        let transform: { x: number; y: number; scale: number; rotation: number };
        let spacingScaleX = 1;
        if (slot === 'body') {
          transform = BODY_RIG;
        } else if (slot === 'eyes') {
          const resolved = resolveEyeTransform(slotDefaults.eyes, correction?.eyes);
          transform = resolved;
          spacingScaleX = resolved.spacingScale;
        } else {
          transform = resolveTransform(slotDefaults[slot], correction?.[slot]);
        }
        const outerTransform = [{ translateX: transform.x * unit }, { translateY: transform.y * unit }, { scale: transform.scale }, { rotate: `${transform.rotation}deg` }];
        const source = PNG_CREATURE_SOURCES[category][slot];
        return (
          <View key={slot} style={{ position: 'absolute', left: bodyOffsetPx, top: bodyOffsetPx, width: bodyCanvasPx, height: bodyCanvasPx }}>
            <View style={[StyleSheet.absoluteFill, { transform: outerTransform }]}>
              {spacingScaleX !== 1 ? (
                <View style={[StyleSheet.absoluteFill, { transform: [{ scaleX: spacingScaleX }] }]}>
                  <Image source={source} contentFit="contain" style={StyleSheet.absoluteFill} />
                </View>
              ) : (
                <Image source={source} contentFit="contain" style={StyleSheet.absoluteFill} />
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

// cachePolicy experiment composer (owner request): uses the REAL, unmodified production SVG-
// wrapped assets (CREATURE_TEST_ASSETS -- the exact same require()s creature-test-assets.ts
// itself uses, not a copy), with the ONLY variable being each <Image>'s cachePolicy prop.
// Otherwise byte-for-byte the same positioning math as PngCreatureComposer above (and therefore
// the same math CreatureTestComposer itself uses) -- this isolates cachePolicy as the single
// changed variable, nothing else. Production's real CreatureAvatar never sets cachePolicy
// explicitly today (expo-image's own default is 'disk', confirmed by reading the installed
// package's own type declarations, not assumed) -- this experiment never modifies that
// production component; it exists only so 'disk' vs 'memory-disk' can be measured side by side
// without touching any shipped file.
function SvgCreatureComposer({ size, recipe, cachePolicy }: { size: number; recipe: CreatureTestRecipe; cachePolicy: CachePolicy }) {
  const slotDefaults = buildInitialSlotDefaults();
  const assetCorrections = buildInitialAssetCorrections();
  const unit = size / COMPOSITION_CANVAS_SIZE;
  const bodyCanvasPx = BODY_CANVAS_SIZE * unit;
  const bodyOffsetPx = BODY_CANVAS_INSET * unit;
  const order: CreatureSlot[] = ['wings', 'tail', 'body', 'earsHorns', 'eyes'];

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      {order.map((slot) => {
        const category = recipe[slot];
        const correction = assetCorrections[category];
        let transform: { x: number; y: number; scale: number; rotation: number };
        let spacingScaleX = 1;
        if (slot === 'body') {
          transform = BODY_RIG;
        } else if (slot === 'eyes') {
          const resolved = resolveEyeTransform(slotDefaults.eyes, correction?.eyes);
          transform = resolved;
          spacingScaleX = resolved.spacingScale;
        } else {
          transform = resolveTransform(slotDefaults[slot], correction?.[slot]);
        }
        const outerTransform = [{ translateX: transform.x * unit }, { translateY: transform.y * unit }, { scale: transform.scale }, { rotate: `${transform.rotation}deg` }];
        const source = CREATURE_TEST_ASSETS[category][slot];
        return (
          <View key={slot} style={{ position: 'absolute', left: bodyOffsetPx, top: bodyOffsetPx, width: bodyCanvasPx, height: bodyCanvasPx }}>
            <View style={[StyleSheet.absoluteFill, { transform: outerTransform }]}>
              {spacingScaleX !== 1 ? (
                <View style={[StyleSheet.absoluteFill, { transform: [{ scaleX: spacingScaleX }] }]}>
                  <Image source={source} contentFit="contain" style={StyleSheet.absoluteFill} cachePolicy={cachePolicy} />
                </View>
              ) : (
                <Image source={source} contentFit="contain" style={StyleSheet.absoluteFill} cachePolicy={cachePolicy} />
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

// Same cachePolicy-isolation approach as SvgCreatureComposer above, for Relic -- real asset
// lookups (relicTraitByKey/colorFamilyByKey/effectByKey, the same functions RelicAvatar itself
// calls) and the real locked global transforms/opacity, with only cachePolicy varied.
function SvgRelicComposer({ size, cachePolicy }: { size: number; cachePolicy: CachePolicy }) {
  const base = relicTraitByKey(RELIC_IDENTITY.base);
  const color = colorFamilyByKey(RELIC_IDENTITY.color);
  const effect = effectByKey(RELIC_IDENTITY.effect);
  const baseCorrection = APPROVED_BASE_CORRECTIONS[RELIC_IDENTITY.base];
  const colorCorrection = APPROVED_COLOR_CORRECTIONS[RELIC_IDENTITY.color];
  const effectCorrection = APPROVED_EFFECT_CORRECTIONS[RELIC_IDENTITY.effect];
  const baseTransform = resolveRelicTransform(GLOBAL_BASE_TRANSFORM, baseCorrection);
  const colorTransform = resolveRelicTransform(GLOBAL_COLOR_TRANSFORM, colorCorrection);
  const effectTransform = resolveRelicTransform(GLOBAL_EFFECT_TRANSFORM, effectCorrection);
  const colorOpacity = resolveOpacity(GLOBAL_COLOR_OPACITY, colorCorrection?.opacity);
  const effectOpacity = resolveOpacity(GLOBAL_EFFECT_OPACITY, effectCorrection?.opacity);

  const layers: { source: ImageSourcePropType; transform: { x: number; y: number; scale: number; rotation: number }; opacity: number }[] = [
    { source: base.source, transform: baseTransform, opacity: GLOBAL_BASE_OPACITY },
    { source: color.source, transform: colorTransform, opacity: colorOpacity },
    { source: effect.source, transform: effectTransform, opacity: effectOpacity },
  ];

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      {layers.map((layer, i) => (
        <View
          key={i}
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: layer.opacity,
              transform: [{ translateX: layer.transform.x }, { translateY: layer.transform.y }, { scale: layer.transform.scale }, { rotate: `${layer.transform.rotation}deg` }],
            },
          ]}
        >
          <Image source={layer.source} contentFit="contain" style={StyleSheet.absoluteFill} cachePolicy={cachePolicy} />
        </View>
      ))}
    </View>
  );
}

type Phase = 'settling' | 'ready' | 'exported' | 'export-error';

function TimedSection({ label, autoExport, children }: { label: string; autoExport: boolean; children: ReactNode }) {
  const ref = useRef<View>(null);
  // Initial state is 'settling' directly (never set synchronously inside an effect body) --
  // the settle delay itself is a real passage-of-time concern, so it belongs in the
  // setTimeout callback below, not a bare synchronous setState at the top of an effect.
  const [phase, setPhase] = useState<Phase>('settling');
  const [exportMs, setExportMs] = useState<number | null>(null);
  const [exportResult, setExportResult] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setPhase('ready'), READY_DELAY_MS);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!autoExport || phase !== 'ready') return;
    // Every setState call below happens inside the async .then()/.catch() continuation, never
    // synchronously in this effect's own body -- captureRef's own promise microtask is the
    // "external system" this effect subscribes to, same shape as a fetch-in-an-effect pattern.
    const start = performance.now();
    void captureRef(ref, { format: 'png', quality: 1 })
      .then((uri) => {
        setExportMs(performance.now() - start);
        setExportResult(`ok, uri length ${uri.length}`);
        setPhase('exported');
      })
      .catch((error: unknown) => {
        setExportMs(performance.now() - start);
        setExportResult(`FAILED: ${String(error)}`);
        setPhase('export-error');
      });
    // phase deliberately omitted from deps beyond the guard above -- this effect's own setPhase
    // calls intentionally do not re-trigger a second capture.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoExport, phase === 'ready']);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View ref={ref} collapsable={false} style={styles.captureStage}>
        {children}
      </View>
      <Text style={styles.statusText}>phase: {phase} (settle delay: {READY_DELAY_MS}ms, fixed, same for both versions)</Text>
      {exportMs !== null && (
        <Text style={styles.statusText}>
          capture: {exportMs.toFixed(1)}ms · {exportResult}
        </Text>
      )}
    </View>
  );
}

export default function PngExperimentScreen() {
  // useLocalSearchParams must run unconditionally, before the __DEV__ early return below --
  // React's rules of hooks apply regardless of how "obviously constant" __DEV__ is.
  const {
    mode: modeParam,
    autoexport,
    content,
    recipe: recipeParam,
    stress: stressParam,
    format: formatParam,
    cache: cacheParam,
  } = useLocalSearchParams<{
    mode?: string;
    autoexport?: string;
    content?: string;
    recipe?: string;
    stress?: string;
    format?: string;
    cache?: string;
  }>();

  if (!__DEV__) {
    return <Redirect href="/" />;
  }

  const mode = modeParam === 'before' || modeParam === 'after' ? modeParam : 'both';
  const doAutoExport = autoexport === '1';
  // format=png keeps the original (now-rejected) PNG-vs-SVG comparison available for reference;
  // default is now the owner-requested cachePolicy comparison -- same real SVG-wrapped assets on
  // both sides, only cachePolicy differs. BEFORE always uses the real, unmodified
  // CreatureAvatar/RelicAvatar (implicit 'disk' default, exactly as shipped); AFTER uses the
  // SAME real assets through SvgCreatureComposer/SvgRelicComposer with cachePolicy from ?cache=
  // (default 'memory-disk', the policy being evaluated).
  const useFormatPng = formatParam === 'png';
  const afterCachePolicy: CachePolicy = cacheParam === 'disk' || cacheParam === 'memory' || cacheParam === 'none' ? cacheParam : 'memory-disk';
  // content=relic|creature isolates just that object (Relic first, so it lands above the
  // simulator's own dev Inspector overlay for a clean screenshot); default shows both, Creature
  // first, matching the original comparison layout.
  const showCreature = content !== 'relic';
  const showRelic = content !== 'creature';
  const recipeKey = recipeParam && RECIPES[recipeParam] ? recipeParam : 'strong';
  const recipe = RECIPES[recipeKey];
  // stress=N renders N independent copies of the production (BEFORE) Creature+Relic pair, each
  // its own real CreatureAvatar/RelicAvatar mount -- a direct test of the "too many simultaneous
  // renders" hypothesis (e.g. Today + You both staying mounted at once under native tabs, each
  // with their own full Creature+Relic). N=1 is the normal single-instance case.
  const stressCount = Math.max(1, Math.min(6, Number(stressParam) || 1));

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Creature/Relic Rendering Experiment (DEV ONLY)</Text>
        <Text style={styles.subtitle}>
          mode={mode} · format={useFormatPng ? 'png (rejected, reference only)' : 'svg (real assets)'} · cache={useFormatPng ? 'n/a' : afterCachePolicy} · autoexport=
          {doAutoExport ? '1' : '0'} · recipe={recipeKey} · stress={stressCount}
        </Text>

        {stressCount > 1 && (
          <>
            <Text style={styles.groupLabel}>
              STRESS TEST — {stressCount}× independent Creature+Relic mounts (production, SVG-wrapped)
            </Text>
            {Array.from({ length: stressCount }, (_, i) => {
              // Cycle through the distinct preset recipes rather than repeating the SAME one --
              // tests the realistic "many different Creatures decoded at once" case (e.g.
              // scrolling shared results, multiple tabs with different users' content), not just
              // N mounts of content expo-image's own cache could trivially dedupe by source+size.
              const recipeNames = Object.keys(RECIPES);
              const stressRecipe = RECIPES[recipeNames[i % recipeNames.length]];
              return (
                <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
                  <TimedSection label={`#${i + 1} Relic`} autoExport={false}>
                    <RelicAvatar identity={RELIC_IDENTITY} size={100} />
                  </TimedSection>
                  <TimedSection label={`#${i + 1} Creature (${recipeNames[i % recipeNames.length]})`} autoExport={false}>
                    <CreatureAvatar recipe={stressRecipe} size={140} />
                  </TimedSection>
                </View>
              );
            })}
          </>
        )}

        {stressCount === 1 && (mode === 'before' || mode === 'both') && (
          <>
            <Text style={styles.groupLabel}>BEFORE — production, SVG-wrapped (unmodified)</Text>
            {showRelic && (
              <TimedSection label="Relic (RelicAvatar, real production component)" autoExport={doAutoExport}>
                <RelicAvatar identity={RELIC_IDENTITY} size={RELIC_SIZE} />
              </TimedSection>
            )}
            {showCreature && (
              <TimedSection label="Creature (CreatureAvatar, real production component)" autoExport={doAutoExport}>
                <CreatureAvatar recipe={recipe} size={CREATURE_SIZE} />
              </TimedSection>
            )}
          </>
        )}

        {stressCount === 1 && (mode === 'after' || mode === 'both') && useFormatPng && (
          <>
            <Text style={styles.groupLabel}>AFTER — extracted PNG experiment (byte-exact from the same SVGs) — REJECTED, kept for reference only</Text>
            {showRelic && (
              <TimedSection label="Relic (same transforms/opacity, PNG sources)" autoExport={doAutoExport}>
                <View style={{ width: RELIC_SIZE, height: RELIC_SIZE }}>
                  <RelicRenderer
                    width={RELIC_SIZE}
                    baseSource={PNG_RELIC_BASE}
                    baseTransform={GLOBAL_BASE_TRANSFORM}
                    baseOpacity={GLOBAL_BASE_OPACITY}
                    colorSource={PNG_RELIC_COLOR}
                    colorTransform={GLOBAL_COLOR_TRANSFORM}
                    colorOpacity={GLOBAL_COLOR_OPACITY}
                    effectSource={PNG_RELIC_EFFECT}
                    effectTransform={GLOBAL_EFFECT_TRANSFORM}
                    effectOpacity={GLOBAL_EFFECT_OPACITY}
                  />
                </View>
              </TimedSection>
            )}
            {showCreature && (
              <TimedSection label="Creature (same layer order/size, PNG sources)" autoExport={doAutoExport}>
                <PngCreatureComposer size={CREATURE_SIZE} recipe={recipe} />
              </TimedSection>
            )}
          </>
        )}

        {stressCount === 1 && (mode === 'after' || mode === 'both') && !useFormatPng && (
          <>
            <Text style={styles.groupLabel}>AFTER — real production SVG-wrapped assets, cachePolicy=&quot;{afterCachePolicy}&quot; (BEFORE uses the implicit &apos;disk&apos; default)</Text>
            {showRelic && (
              <TimedSection label={`Relic (real assets, cachePolicy=${afterCachePolicy})`} autoExport={doAutoExport}>
                <SvgRelicComposer size={RELIC_SIZE} cachePolicy={afterCachePolicy} />
              </TimedSection>
            )}
            {showCreature && (
              <TimedSection label={`Creature (real assets, cachePolicy=${afterCachePolicy})`} autoExport={doAutoExport}>
                <SvgCreatureComposer size={CREATURE_SIZE} recipe={recipe} cachePolicy={afterCachePolicy} />
              </TimedSection>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0E0515' },
  content: { padding: 16, gap: 12 },
  title: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  subtitle: { color: '#C9BEDA', fontSize: 11, marginBottom: 8 },
  groupLabel: { color: '#FFD86B', fontSize: 14, fontWeight: '800', marginTop: 16, marginBottom: 4 },
  section: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 12, gap: 6, alignItems: 'center' },
  sectionLabel: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', alignSelf: 'flex-start' },
  captureStage: { backgroundColor: '#1A0E2A' },
  statusText: { color: '#9BE7C4', fontSize: 11, alignSelf: 'flex-start' },
});
