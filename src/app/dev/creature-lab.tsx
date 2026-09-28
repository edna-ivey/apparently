import { Image } from 'expo-image';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CreatureComposer, type CreatureRecipe } from '@/components/creature-lab/creature-composer';
import { RegistrationTemplateView } from '@/components/creature-lab/registration-template-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  CONTROL_BODY_BASE_CLEAN_V2_ASSET,
  CONTROL_BODY_BASE_CLEAN_V2_FILENAME,
  CREATURE_ASSETS,
  CREATURE_ASSET_FILENAMES,
  CREATURE_BODY_DIMENSIONS,
  CREATURE_FAMILY_LABEL,
  CREATURE_FULL_REFERENCE,
  EXTREME_BODY_ASSETS,
  EXTREME_BODY_DIMENSIONS,
  EXTREME_BODY_FILENAMES,
  EXTREME_BODY_LABEL,
  MOST_DRAMATIC_TAIL_FAMILY,
  MOST_DRAMATIC_WINGS_FAMILY,
  PLANNER_BODY_FILENAME,
  WINGS_LANDSCAPE_CANVAS_FAMILIES,
  type CreatureFamilyId,
  type CreaturePartKey,
  type CreaturePartSet,
  type ExtremeBodyId,
} from '@/data/creature-lab/creature-assets';
import { REGISTRATION_TEMPLATE_V0, REGISTRATION_TEMPLATE_V1, REGISTRATION_TEMPLATE_V2, type CreatureRegistrationTemplate } from '@/data/creature-lab/creature-registration';
import { REGISTERED_CONTROL_FILENAMES, REGISTERED_CONTROL_PARTS } from '@/data/creature-lab/creature-registered-control';
import {
  REGISTERED_V2_ATTACHMENT_KEYS,
  REGISTERED_V2_CONTROL_BODY,
  REGISTERED_V2_CONTROL_BODY_FILENAME,
  REGISTERED_V2_CONTROL_BODY_ORIGINAL,
  REGISTERED_V2_EAR_CLAMPS,
  REGISTERED_V2_FILENAMES,
  REGISTERED_V2_PARTS,
  REGISTERED_V2_PROTECTIVE_BODY,
  REGISTERED_V2_PROTECTIVE_BODY_FILENAME,
  type RegisteredV2AttachmentKey,
  type RegisteredV2Family,
} from '@/data/creature-lab/creature-registered-v2';
import { Spacing } from '@/constants/theme';

// INTERNAL DEV-ONLY. Not linked from any consumer or admin navigation -- reachable only by
// typing /dev/creature-lab directly, and blanked out entirely in production builds below.
// This is an R&D compositing test of already-approved assets: it proves/disproves whether
// CreatureComposer + one shared CREATURE_LAYOUT config can assemble a beautiful creature from
// 7 independent trait assets. It does not decide art direction, does not touch personality
// scoring, and does not modify any approved SVG.

type PartMap = Record<CreaturePartKey, CreatureFamilyId>;

const PART_KEYS: CreaturePartKey[] = ['body', 'eyes', 'ears', 'wings', 'tail', 'headFeature', 'chestCrest'];
const REGISTERED_CONTROL_PARTS_ORDER = PART_KEYS;
const PART_LABEL: Record<CreaturePartKey, string> = {
  body: 'Body',
  eyes: 'Eyes',
  ears: 'Ears',
  wings: 'Wings',
  tail: 'Tail',
  headFeature: 'Head Feature',
  chestCrest: 'Chest Crest',
};

function buildMixedRecipe(map: PartMap): {
  recipe: CreaturePartSet;
  filenames: Record<CreaturePartKey, string>;
  labels: PartMap;
  bodyAspect: number;
} {
  const recipe = {} as CreaturePartSet;
  const filenames = {} as Record<CreaturePartKey, string>;
  for (const key of PART_KEYS) {
    const family = map[key];
    recipe[key] = CREATURE_ASSETS[family][key];
    filenames[key] = CREATURE_ASSET_FILENAMES[family][key];
  }
  const bodyDims = CREATURE_BODY_DIMENSIONS[map.body];
  return { recipe, filenames, labels: map, bodyAspect: bodyDims.width / bodyDims.height };
}

const MIXED_A = buildMixedRecipe({
  body: 'control',
  eyes: 'independent',
  ears: 'practical',
  wings: 'idealistic',
  tail: 'sentimental',
  headFeature: 'collaborative',
  chestCrest: 'thickSkinned',
});

const MIXED_B = buildMixedRecipe({
  body: 'thickSkinned',
  eyes: 'sentimental',
  ears: 'letItPlayOut',
  wings: 'collaborative',
  tail: 'idealistic',
  headFeature: 'control',
  chestCrest: 'practical',
});

const ATTACHMENT_KEYS = ['eyes', 'ears', 'wings', 'tail', 'headFeature', 'chestCrest'] as const;
type AttachmentMap = Record<(typeof ATTACHMENT_KEYS)[number], CreatureFamilyId>;

// Extreme Silhouette Test: pairs a BODY-only asset (no family kit of its own -- outside the 8
// approved personality-pole families) with attachments borrowed from those 8 families. Bodies
// are used exactly as approved; only the ATTACHMENT choice is arbitrary, same as Tests B/C.
function buildExtremeRecipe(bodyId: ExtremeBodyId, parts: AttachmentMap) {
  const filenames = { body: EXTREME_BODY_FILENAMES[bodyId] } as Record<CreaturePartKey, string>;
  const labels = { body: EXTREME_BODY_LABEL[bodyId] } as Record<CreaturePartKey, string>;
  const recipe: CreaturePartSet = { body: EXTREME_BODY_ASSETS[bodyId] } as CreaturePartSet;
  for (const key of ATTACHMENT_KEYS) {
    const family = parts[key];
    recipe[key] = CREATURE_ASSETS[family][key];
    filenames[key] = CREATURE_ASSET_FILENAMES[family][key];
    labels[key] = CREATURE_FAMILY_LABEL[family];
  }
  const bodyDims = EXTREME_BODY_DIMENSIONS[bodyId];
  return { recipe, filenames, labels, bodyAspect: bodyDims.width / bodyDims.height };
}

const EXTREME_A = buildExtremeRecipe('adventurous', {
  eyes: 'sentimental',
  ears: 'practical',
  wings: 'idealistic',
  tail: 'sentimental',
  headFeature: 'collaborative',
  chestCrest: 'thickSkinned',
});

const EXTREME_B = buildExtremeRecipe('comfortSeeking', {
  eyes: 'independent',
  ears: 'letItPlayOut',
  wings: 'collaborative',
  tail: 'idealistic',
  headFeature: 'control',
  chestCrest: 'sentimental',
});

const EXTREME_C = buildExtremeRecipe('emotionallyIntense', {
  eyes: 'thickSkinned',
  ears: 'sentimental',
  wings: 'idealistic',
  tail: MOST_DRAMATIC_TAIL_FAMILY,
  headFeature: 'letItPlayOut',
  chestCrest: 'collaborative',
});

const EXTREME_D = buildExtremeRecipe('protective', {
  eyes: 'idealistic',
  ears: 'collaborative',
  wings: 'sentimental',
  tail: 'letItPlayOut',
  headFeature: 'sentimental',
  chestCrest: 'practical',
});

// ===========================================================================================
// v2 registration proof (Michelle-review pass). All recipes below use REGISTERED_V2_* full-
// canvas assets stacked at x=0,y=0,width=100%,height=100% via V2RegisteredComposite -- no
// slot rectangles, no CreatureComposer, no scaleMultiplier. See creature-registered-v2.ts.
const V2_CANVAS_ASPECT_RATIO = REGISTRATION_TEMPLATE_V2.canvas.width / REGISTRATION_TEMPLATE_V2.canvas.height;

type V2AttachmentMap = Record<RegisteredV2AttachmentKey, RegisteredV2Family>;

// Elegant/standard mix: revised (softened eye-socket) Control body + Sentimental, two families.
const V2_MIXED_A: V2AttachmentMap = {
  eyes: 'sentimental',
  ears: 'control',
  wings: 'sentimental',
  tail: 'control',
  headFeature: 'sentimental',
  chestCrest: 'control',
};

// Stress mix: three families across the six attachments, all on the revised Control body.
const V2_MIXED_B: V2AttachmentMap = {
  eyes: 'thickSkinned',
  ears: 'sentimental',
  wings: 'thickSkinned',
  tail: 'sentimental',
  headFeature: 'thickSkinned',
  chestCrest: 'sentimental',
};

// Extreme silhouette: original (unmodified) Protective body -- wildly different proportions
// than Control/Planner -- plus a mix of the already-registered families, to check whether v2's
// generic body-fit rule and shared anchors still hold up on a body they weren't tuned against.
const V2_EXTREME: V2AttachmentMap = {
  eyes: 'sentimental',
  ears: 'control',
  wings: 'thickSkinned',
  tail: 'sentimental',
  headFeature: 'control',
  chestCrest: 'thickSkinned',
};

const SCALE_VALUES = [0.85, 1.0, 1.15, 1.3, 1.45];
const SCALE_TEST_BASE_FAMILY: CreatureFamilyId = 'control';

// Tail/Wings Scale Test: ONE base creature (all-Control) with every part fixed except the one
// under test, which is swapped for the most dramatic existing asset of its kind (see
// MOST_DRAMATIC_TAIL_FAMILY / MOST_DRAMATIC_WINGS_FAMILY) and rendered at 5 fixed scale
// values. scaleMultiplier is plain test-config data on each recipe below -- deterministic,
// asset/test-tied, never per-user, never randomized, never hand-tuned after the fact.
function buildScaleTestRenders(varyingKey: 'tail' | 'wings', dramaticFamily: CreatureFamilyId) {
  const bodyDims = CREATURE_BODY_DIMENSIONS[SCALE_TEST_BASE_FAMILY];
  const bodyAspect = bodyDims.width / bodyDims.height;

  return SCALE_VALUES.map((scale) => {
    const recipe = { body: CREATURE_ASSETS[SCALE_TEST_BASE_FAMILY].body } as CreatureRecipe;
    for (const key of ATTACHMENT_KEYS) {
      recipe[key] =
        key === varyingKey
          ? { source: CREATURE_ASSETS[dramaticFamily][key], scaleMultiplier: scale }
          : CREATURE_ASSETS[SCALE_TEST_BASE_FAMILY][key];
    }
    return { scale, recipe, bodyAspect };
  });
}

const TAIL_SCALE_TEST = {
  renders: buildScaleTestRenders('tail', MOST_DRAMATIC_TAIL_FAMILY),
  varyingFilename: CREATURE_ASSET_FILENAMES[MOST_DRAMATIC_TAIL_FAMILY].tail,
  varyingFamilyLabel: CREATURE_FAMILY_LABEL[MOST_DRAMATIC_TAIL_FAMILY],
};

const WINGS_SCALE_TEST = {
  renders: buildScaleTestRenders('wings', MOST_DRAMATIC_WINGS_FAMILY),
  varyingFilename: CREATURE_ASSET_FILENAMES[MOST_DRAMATIC_WINGS_FAMILY].wings,
  varyingFamilyLabel: CREATURE_FAMILY_LABEL[MOST_DRAMATIC_WINGS_FAMILY],
};

export default function CreatureLabScreen() {
  const [showSlotBounds, setShowSlotBounds] = useState(false);

  if (!__DEV__) {
    return <Redirect href="/" />;
  }

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="title">Creature Lab</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Internal R&D only. Compositing test of already-approved trait assets -- not the production Creature system, not
            hooked into personality scoring, no new art.
          </ThemedText>

          <Pressable style={styles.toggle} onPress={() => setShowSlotBounds((v) => !v)}>
            <ThemedText type="smallBold">SHOW SLOT BOUNDS: {showSlotBounds ? 'ON' : 'OFF'}</ThemedText>
          </Pressable>

          <Section title="Current v0 vs current v1 vs proposed v2 -- for Michelle's review">
            <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
              STOP checkpoint: v2 not approved yet. Michelle&apos;s review of v1 found TWO separate, confirmed-by-measurement
              problems: (1) eyes read low/&quot;on the chest&quot; -- caused entirely by v1&apos;s canvas framing (the eye&apos;s
              position relative to the body is IDENTICAL in v0 and v1, 0.2272 native fraction both times; v1&apos;s 380px of
              added headroom pushes that same eye from 22.7% down the canvas to 37.2% down it, with nothing to do with the
              face itself); (2) the body art&apos;s own eye-socket shading is a strong, pre-committed dark shape that fights
              modular eyes -- a separate, orthogonal problem, fixed at the art layer below, not here. v2 addresses (1) only:
              same 1800x2000 canvas as v1 (same lateral wing room), but body render height raised to 1720px (was 1600) and
              bottom margin to 25px (was 20), landing the eye at ~33% down the canvas -- roughly halfway back to v0, not all
              the way, because the tall ear asset still needs real headroom above its root anchor (see the ear-clamp note
              below). Solid crosshairs/lines = MEASURED off {PLANNER_BODY_FILENAME}&apos;s pixels. Dashed/hollow rings =
              PROPOSED judgment calls, still not approved.
            </ThemedText>
            <View style={styles.row}>
              <View style={styles.column}>
                <ThemedText type="smallBold">v0 -- superseded (no headroom)</ThemedText>
                <RegistrationTemplateView template={REGISTRATION_TEMPLATE_V0} width={230} />
              </View>
              <View style={styles.column}>
                <ThemedText type="smallBold">v1 -- superseded (eyes read low)</ThemedText>
                <RegistrationTemplateView template={REGISTRATION_TEMPLATE_V1} width={230} />
              </View>
              <View style={styles.column}>
                <ThemedText type="smallBold">v2 -- PROPOSED candidate</ThemedText>
                <RegistrationTemplateView template={REGISTRATION_TEMPLATE_V2} width={400} showLabels />
              </View>
            </View>
            <RegistrationCoordinateList template={REGISTRATION_TEMPLATE_V2} />
          </Section>

          <Section title="Body-base cleanup comparison">
            <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
              Old vs. revised Control body-base, both registered identically under v2, SAME Control eyes asset overlaid on
              both at the same anchor. Revised file: {CONTROL_BODY_BASE_CLEAN_V2_FILENAME} -- eye-socket shadow depth reduced
              ~60% (feathered, not a hard-edged patch), nose/mouth untouched, original head silhouette/structure unchanged.
              Original assets/creatures/body/control-body-master-v1.svg is completely untouched; the revised file is a
              separate prototype under assets/creatures-dev-prototype/. This is a SOFTEN, not a full removal -- a fully flat
              socket risked looking dead/unfinished, which the brief explicitly warns against.
            </ThemedText>
            <View style={styles.row}>
              <View style={styles.column}>
                <ThemedText type="smallBold">OLD body-base + Control eyes</ThemedText>
                <View style={[styles.canvasPreview, { width: 260, height: 260 / V2_CANVAS_ASPECT_RATIO }]}>
                  <Image source={REGISTERED_V2_CONTROL_BODY_ORIGINAL} contentFit="contain" style={StyleSheet.absoluteFill} />
                  <Image source={REGISTERED_V2_PARTS.control.eyes} contentFit="contain" style={StyleSheet.absoluteFill} />
                </View>
              </View>
              <View style={styles.column}>
                <ThemedText type="smallBold">REVISED body-base + same Control eyes</ThemedText>
                <View style={[styles.canvasPreview, { width: 260, height: 260 / V2_CANVAS_ASPECT_RATIO }]}>
                  <Image source={REGISTERED_V2_CONTROL_BODY} contentFit="contain" style={StyleSheet.absoluteFill} />
                  <Image source={REGISTERED_V2_PARTS.control.eyes} contentFit="contain" style={StyleSheet.absoluteFill} />
                </View>
              </View>
            </View>
          </Section>

          <Section title="Revised Control Composite (v2, one-family registration proof)">
            <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
              Same one-family proof methodology as the previous pass (see archival section below), rebuilt on v2: the
              revised (softened eye-socket) Control body plus Control&apos;s other 6 original, unmodified SVGs, each resized
              and placed onto its own full 1800x2000 v2 canvas. Stacked at x=0,y=0,width=100%,height=100% -- no runtime x/y,
              no slot rectangles, no scaleMultiplier. Ears required a scale CAP to avoid off-canvas clipping -- nominal
              (head-width-matched) scale was {REGISTERED_V2_EAR_CLAMPS.control.nominalScale.toFixed(3)}x, capped to{' '}
              {REGISTERED_V2_EAR_CLAMPS.control.cappedScale.toFixed(3)}x to keep the tips on-canvas. That means these ears
              render narrower/smaller than the nominal head-width anchor target -- a visible, deliberate tradeoff, not a
              hidden one. See the written assessment for why this specific ear asset can&apos;t be fully solved by
              registration math alone.
            </ThemedText>
            <View style={styles.row}>
              {REGISTERED_V2_ATTACHMENT_KEYS.map((key) => (
                <View key={key} style={styles.column}>
                  <ThemedText type="smallBold">{PART_LABEL[key]}</ThemedText>
                  <V2RegisteredPartView source={REGISTERED_V2_PARTS.control[key]} width={140} />
                  <ThemedText type="small" themeColor="textSecondary">
                    {REGISTERED_V2_FILENAMES.control[key]}
                  </ThemedText>
                </View>
              ))}
              <View style={styles.column}>
                <ThemedText type="smallBold">Body (revised)</ThemedText>
                <V2RegisteredPartView source={REGISTERED_V2_CONTROL_BODY} width={140} />
                <ThemedText type="small" themeColor="textSecondary">
                  {REGISTERED_V2_CONTROL_BODY_FILENAME}
                </ThemedText>
              </View>
            </View>
            <ThemedText type="smallBold" style={styles.coordGroupHeading}>
              REVISED CONTROL COMPOSITE
            </ThemedText>
            <V2RegisteredComposite
              body={REGISTERED_V2_CONTROL_BODY}
              attachments={{ eyes: 'control', ears: 'control', wings: 'control', tail: 'control', headFeature: 'control', chestCrest: 'control' }}
              width={360}
            />
          </Section>

          <Section title="Mixed Creature A -- revised system (v2)">
            <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
              Elegant/standard mix: revised Control body + Sentimental, two families across the seven parts. Pure v2
              full-canvas stack, deterministic, no runtime positioning.
            </ThemedText>
            <View style={styles.row}>
              <V2RegisteredComposite body={REGISTERED_V2_CONTROL_BODY} attachments={V2_MIXED_A} width={340} />
              <View>
                <ThemedText type="small">Body: Control (revised)</ThemedText>
                <V2RecipeLegend attachments={V2_MIXED_A} />
              </View>
            </View>
          </Section>

          <Section title="Mixed Creature B -- revised system (v2)">
            <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
              Stress mix: revised Control body + Sentimental + Thick-Skinned, three families across the six attachments.
            </ThemedText>
            <View style={styles.row}>
              <V2RegisteredComposite body={REGISTERED_V2_CONTROL_BODY} attachments={V2_MIXED_B} width={340} />
              <View>
                <ThemedText type="small">Body: Control (revised)</ThemedText>
                <V2RecipeLegend attachments={V2_MIXED_B} />
              </View>
            </View>
          </Section>

          <Section title="Extreme Silhouette Stress Test (v2)">
            <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
              Original, unmodified Protective body (1024x1536 native -- a wildly different silhouette than Control/Planner)
              registered under v2&apos;s generic body-fit rule, mixed with Control/Sentimental/Thick-Skinned attachments.
              Tests whether v2&apos;s shared anchors and body-fit rule generalize to a body they weren&apos;t tuned against.
            </ThemedText>
            <View style={styles.row}>
              <V2RegisteredComposite body={REGISTERED_V2_PROTECTIVE_BODY} attachments={V2_EXTREME} width={340} />
              <View>
                <ThemedText type="small">Body: Protective (original, unmodified)</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {REGISTERED_V2_PROTECTIVE_BODY_FILENAME}
                </ThemedText>
                <V2RecipeLegend attachments={V2_EXTREME} />
              </View>
            </View>
          </Section>

          <Section title="Ears / eye alignment sanity check (v2)">
            <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
              Side by side: v1&apos;s ear clipping (previous pass, uncapped) vs. v2&apos;s capped ears (no clipping, smaller/
              closer-set as a result) vs. v2&apos;s eye placement. All three families&apos; nominal-vs-capped ear scale:{' '}
              {(Object.keys(REGISTERED_V2_EAR_CLAMPS) as RegisteredV2Family[])
                .map((f) => `${CREATURE_FAMILY_LABEL[f]} ${REGISTERED_V2_EAR_CLAMPS[f].nominalScale.toFixed(2)}x -> ${REGISTERED_V2_EAR_CLAMPS[f].cappedScale.toFixed(2)}x`)
                .join('; ')}
              . Every family needed capping -- this is a property of the ear asset&apos;s own tall proportions relative to
              plausible head-width spacing, not a one-family fluke.
            </ThemedText>
            <View style={styles.row}>
              <View style={styles.column}>
                <ThemedText type="smallBold">v1 Control ears (previous pass, clips)</ThemedText>
                <RegisteredPartView source={REGISTERED_CONTROL_PARTS.ears} width={180} />
              </View>
              <View style={styles.column}>
                <ThemedText type="smallBold">v2 Control ears (capped, no clipping)</ThemedText>
                <V2RegisteredPartView source={REGISTERED_V2_PARTS.control.ears} width={180} />
              </View>
              <View style={styles.column}>
                <ThemedText type="smallBold">v2 Control eyes (on revised body-base)</ThemedText>
                <V2RegisteredPartView source={REGISTERED_V2_PARTS.control.eyes} width={180} />
              </View>
            </View>
          </Section>

          <Section title="PREVIOUS PASS -- archival (v1 registration + CREATURE_LAYOUT slot system)">
            <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
              Everything below this line is kept for reference only and reflects the PRIOR pass&apos;s conclusions (v1
              registration, and before that the original CREATURE_LAYOUT rect-slot system) -- superseded by v2 above.
              Nothing below was deleted or modified; treat it as archival, not current guidance.
            </ThemedText>
          </Section>

          <Section title="Control Registered Composite -- PREVIOUS PASS (v1, superseded by v2 above)">
            <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
              Temporary dev-only test: each of Control&apos;s 7 original approved SVGs was resized and placed (no redrawing,
              no regeneration) onto its own full 1800x2000 v1 canvas so its own functional attachment point(s) land exactly
              on the v1 anchors above. Originals in assets/creatures/ are untouched -- these are separate generated files
              under assets/creatures-dev-registered/control/, for this test only. The composite below stacks all 7 at x=0,
              y=0, width=100%, height=100% -- no runtime x/y, no slot rectangles, no scaleMultiplier.
            </ThemedText>
            <View style={styles.row}>
              {REGISTERED_CONTROL_PARTS_ORDER.map((key) => (
                <View key={key} style={styles.column}>
                  <ThemedText type="smallBold">{PART_LABEL[key]}</ThemedText>
                  <RegisteredPartView source={REGISTERED_CONTROL_PARTS[key]} width={160} />
                  <ThemedText type="small" themeColor="textSecondary">
                    {REGISTERED_CONTROL_FILENAMES[key]}
                  </ThemedText>
                </View>
              ))}
            </View>
            <ThemedText type="smallBold" style={styles.coordGroupHeading}>
              CONTROL REGISTERED COMPOSITE (v1)
            </ThemedText>
            <RegisteredComposite width={340} />
          </Section>

          <Section title="Test A1 -- Exact Reconstruction: Control">
            <SideBySide showSlotBounds={showSlotBounds} family="control" />
          </Section>

          <Section title="Test A2 -- Exact Reconstruction: Sentimental">
            <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
              Sentimental's body was corrected to v2 after the (missing) original full reference would have been generated.
              Minor body differences vs. any future reference are expected, not a bug.
            </ThemedText>
            <SideBySide showSlotBounds={showSlotBounds} family="sentimental" />
          </Section>

          <Section title="Test B -- Mixed Creature A">
            <CreatureBlock title="MIXED CREATURE A" recipeSet={MIXED_A} width={340} showSlotBounds={showSlotBounds} />
          </Section>

          <Section title="Test C -- Mixed Creature B">
            <CreatureBlock title="MIXED CREATURE B" recipeSet={MIXED_B} width={340} showSlotBounds={showSlotBounds} />
          </Section>

          <Section title="Test D -- Determinism: Mixed Creature A rendered twice">
            <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
              Both instances below call the same CreatureComposer with the exact same MIXED_A recipe object -- no duplicated
              hand-positioned markup.
            </ThemedText>
            <View style={styles.row}>
              <CreatureComposer recipe={MIXED_A.recipe} bodyAspect={MIXED_A.bodyAspect} width={220} showSlotBounds={showSlotBounds} />
              <CreatureComposer recipe={MIXED_A.recipe} bodyAspect={MIXED_A.bodyAspect} width={220} showSlotBounds={showSlotBounds} />
            </View>
          </Section>

          <Section title="Extreme Silhouette Test">
            <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
              Stress test only: pairs the most visually extreme existing BODY assets (wide fluffy silhouettes, oversized
              heads, dramatic fur) with attachments borrowed from the 8 approved families -- same CreatureComposer, same
              CREATURE_LAYOUT, no per-instance positioning. Some weirdness here is expected and desirable, not a bug to fix.
            </ThemedText>
            <View style={styles.row}>
              <ExtremeCreatureBlock title="EXTREME BODY A -- Adventurous" recipeSet={EXTREME_A} showSlotBounds={showSlotBounds} />
              <ExtremeCreatureBlock title="EXTREME BODY B -- Comfort-Seeking" recipeSet={EXTREME_B} showSlotBounds={showSlotBounds} />
              <ExtremeCreatureBlock title="EXTREME BODY C -- Emotionally Intense" recipeSet={EXTREME_C} showSlotBounds={showSlotBounds} />
              <ExtremeCreatureBlock title="EXTREME BODY D -- Protective" recipeSet={EXTREME_D} showSlotBounds={showSlotBounds} />
            </View>
          </Section>

          <Section title="Tail Scale Test">
            <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
              All-Control base creature, every part fixed except tail. Tail is {TAIL_SCALE_TEST.varyingFamilyLabel} (
              {TAIL_SCALE_TEST.varyingFilename}) -- the most opaque-pixel-dense tail of the 8 approved families -- rendered
              at 5 fixed scaleMultiplier values on top of the same shared tail slot. Scale only; no x/y override.
            </ThemedText>
            <View style={styles.row}>
              {TAIL_SCALE_TEST.renders.map(({ scale, recipe, bodyAspect }) => (
                <ScaleTestRender key={scale} scale={scale} recipe={recipe} bodyAspect={bodyAspect} showSlotBounds={showSlotBounds} />
              ))}
            </View>
          </Section>

          <Section title="Wings Scale Test">
            <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
              Same pattern as the Tail Scale Test. Wings is {WINGS_SCALE_TEST.varyingFamilyLabel} (
              {WINGS_SCALE_TEST.varyingFilename}) -- the most opaque-pixel-dense wings of the 8 approved families.
            </ThemedText>
            <View style={styles.row}>
              {WINGS_SCALE_TEST.renders.map(({ scale, recipe, bodyAspect }) => (
                <ScaleTestRender key={scale} scale={scale} recipe={recipe} bodyAspect={bodyAspect} showSlotBounds={showSlotBounds} />
              ))}
            </View>
          </Section>

          <Section title="Known template exception">
            <ThemedText type="small" themeColor="textSecondary">
              Wings for {WINGS_LANDSCAPE_CANVAS_FAMILIES.map((f) => CREATURE_FAMILY_LABEL[f]).join(' and ')} are authored on a
              1448x1086 landscape canvas; every other family's wings (and every family's eyes/ears/tail/head-feature/chest-crest)
              are on a shared 1254x1254 square canvas. Same slot rect is used for all 8 -- flagging this rather than adding a
              silent per-family exception. See written assessment for what this looks like visually.
            </ThemedText>
          </Section>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText type="subtitle">{title}</ThemedText>
      {children}
    </View>
  );
}

function SideBySide({ family, showSlotBounds }: { family: CreatureFamilyId; showSlotBounds: boolean }) {
  const recipe = CREATURE_ASSETS[family];
  const filenames = CREATURE_ASSET_FILENAMES[family];
  const reference = CREATURE_FULL_REFERENCE[family];
  const bodyDims = CREATURE_BODY_DIMENSIONS[family];
  const bodyAspect = bodyDims.width / bodyDims.height;

  return (
    <>
      <View style={styles.row}>
        <View style={styles.column}>
          <ThemedText type="smallBold">ASSEMBLED FROM 7 ASSETS</ThemedText>
          <CreatureComposer recipe={recipe} bodyAspect={bodyAspect} width={220} showSlotBounds={showSlotBounds} />
        </View>
        <View style={styles.column}>
          <ThemedText type="smallBold">APPROVED FULL REFERENCE</ThemedText>
          {reference ? (
            <CreatureComposer recipe={recipe} bodyAspect={bodyAspect} width={220} showSlotBounds={false} />
          ) : (
            <View style={[styles.placeholder, { width: 220, height: 293 }]}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.placeholderText}>
                No standalone {family}-creature-master-v1.svg found in the repo. Showing the same 7-asset composite again
                instead of fabricating a reference image.
              </ThemedText>
            </View>
          )}
        </View>
      </View>
      {showSlotBounds ? <FilenameLegend filenames={filenames} /> : null}
    </>
  );
}

function CreatureBlock({
  title,
  recipeSet,
  width,
  showSlotBounds,
}: {
  title: string;
  recipeSet: ReturnType<typeof buildMixedRecipe>;
  width: number;
  showSlotBounds: boolean;
}) {
  return (
    <View>
      <ThemedText type="smallBold">{title}</ThemedText>
      <CreatureComposer recipe={recipeSet.recipe} bodyAspect={recipeSet.bodyAspect} width={width} showSlotBounds={showSlotBounds} />
      <View style={styles.recipeList}>
        {PART_KEYS.map((key) => (
          <ThemedText key={key} type="small">
            {PART_LABEL[key]}: {CREATURE_FAMILY_LABEL[recipeSet.labels[key]]}
          </ThemedText>
        ))}
      </View>
      {showSlotBounds ? <FilenameLegend filenames={recipeSet.filenames} /> : null}
    </View>
  );
}

function ExtremeCreatureBlock({
  title,
  recipeSet,
  showSlotBounds,
}: {
  title: string;
  recipeSet: ReturnType<typeof buildExtremeRecipe>;
  showSlotBounds: boolean;
}) {
  return (
    <View style={{ width: 220 }}>
      <ThemedText type="smallBold">{title}</ThemedText>
      <CreatureComposer recipe={recipeSet.recipe} bodyAspect={recipeSet.bodyAspect} width={220} showSlotBounds={showSlotBounds} />
      <View style={styles.recipeList}>
        {PART_KEYS.map((key) => (
          <ThemedText key={key} type="small">
            {PART_LABEL[key]}: {recipeSet.labels[key]}
          </ThemedText>
        ))}
      </View>
      {showSlotBounds ? <FilenameLegend filenames={recipeSet.filenames} /> : null}
    </View>
  );
}

function ScaleTestRender({
  scale,
  recipe,
  bodyAspect,
  showSlotBounds,
}: {
  scale: number;
  recipe: CreatureRecipe;
  bodyAspect: number;
  showSlotBounds: boolean;
}) {
  return (
    <View style={styles.column}>
      <CreatureComposer recipe={recipe} bodyAspect={bodyAspect} width={170} showSlotBounds={showSlotBounds} />
      <ThemedText type="smallBold">{scale.toFixed(2)}x</ThemedText>
    </View>
  );
}

const V1_CANVAS_ASPECT = REGISTRATION_TEMPLATE_V1.canvas.width / REGISTRATION_TEMPLATE_V1.canvas.height;

// x=0, y=0, width=100%, height=100%, contentFit="contain" (never stretched) -- literally no
// other positioning applied. If a registered file's own placement is correct, this alone is
// enough for it to land in the right spot.
function RegisteredPartView({ source, width }: { source: CreaturePartSet['body']; width: number }) {
  const height = width / V1_CANVAS_ASPECT;
  return (
    <View style={[styles.canvasPreview, { width, height }]}>
      <Image source={source} contentFit="contain" style={StyleSheet.absoluteFill} />
    </View>
  );
}

function RegisteredComposite({ width }: { width: number }) {
  const height = width / V1_CANVAS_ASPECT;
  return (
    <View style={[styles.canvasPreview, { width, height }]}>
      {REGISTERED_CONTROL_PARTS_ORDER.map((key) => (
        <Image key={key} source={REGISTERED_CONTROL_PARTS[key]} contentFit="contain" style={StyleSheet.absoluteFill} />
      ))}
    </View>
  );
}

// v2 equivalent of RegisteredPartView/RegisteredComposite above -- same contract (x=0,y=0,
// width=100%,height=100%, contentFit="contain", no other positioning) on the v2 1800x2000 canvas.
function V2RegisteredPartView({ source, width }: { source: CreaturePartSet['body']; width: number }) {
  const height = width / V2_CANVAS_ASPECT_RATIO;
  return (
    <View style={[styles.canvasPreview, { width, height }]}>
      <Image source={source} contentFit="contain" style={StyleSheet.absoluteFill} />
    </View>
  );
}

function V2RegisteredComposite({ body, attachments, width }: { body: CreaturePartSet['body']; attachments: V2AttachmentMap; width: number }) {
  const height = width / V2_CANVAS_ASPECT_RATIO;
  return (
    <View style={[styles.canvasPreview, { width, height }]}>
      <Image source={body} contentFit="contain" style={StyleSheet.absoluteFill} />
      {REGISTERED_V2_ATTACHMENT_KEYS.map((key) => (
        <Image key={key} source={REGISTERED_V2_PARTS[attachments[key]][key]} contentFit="contain" style={StyleSheet.absoluteFill} />
      ))}
    </View>
  );
}

function V2RecipeLegend({ attachments }: { attachments: V2AttachmentMap }) {
  return (
    <View style={styles.recipeList}>
      {REGISTERED_V2_ATTACHMENT_KEYS.map((key) => (
        <ThemedText key={key} type="small">
          {PART_LABEL[key]}: {CREATURE_FAMILY_LABEL[attachments[key]]} ({REGISTERED_V2_FILENAMES[attachments[key]][key]})
        </ThemedText>
      ))}
    </View>
  );
}

function fmtPt(p: { canonical: { x: number; y: number }; normalized: { x: number; y: number } }): string {
  return `canonical (${p.canonical.x.toFixed(1)}, ${p.canonical.y.toFixed(1)})  norm (${p.normalized.x.toFixed(4)}, ${p.normalized.y.toFixed(4)})`;
}

function fmtBox(b: { canonical: { x0: number; y0: number; x1: number; y1: number }; normalized: { x0: number; y0: number; x1: number; y1: number } }): string {
  return `canonical (${b.canonical.x0.toFixed(1)}, ${b.canonical.y0.toFixed(1)}) - (${b.canonical.x1.toFixed(1)}, ${b.canonical.y1.toFixed(1)})  norm (${b.normalized.x0.toFixed(4)}, ${b.normalized.y0.toFixed(4)}) - (${b.normalized.x1.toFixed(4)}, ${b.normalized.y1.toFixed(4)})`;
}

function RegistrationCoordinateList({ template }: { template: CreatureRegistrationTemplate }) {
  const { measured, proposed } = template;
  return (
    <View style={styles.coordList}>
      <ThemedText type="smallBold">
        {template.version.toUpperCase()} canonical canvas: {template.canvas.width}x{template.canvas.height}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
        {template.notes}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Planner native canvas: {template.plannerNativeCanvas.width}x{template.plannerNativeCanvas.height} -- scale{' '}
        {template.plannerPlacement.scale.toFixed(4)}, rendered {template.plannerPlacement.renderedWidth.toFixed(1)}x
        {template.plannerPlacement.renderedHeight.toFixed(1)}, offset ({template.plannerPlacement.offsetX.toFixed(1)},{' '}
        {template.plannerPlacement.offsetY.toFixed(1)})
      </ThemedText>

      <ThemedText type="smallBold" style={styles.coordGroupHeading}>
        MEASURED / strongly grounded
      </ThemedText>
      <ThemedText type="small">Left eye center: {fmtPt(measured.points.leftEyeCenter)}</ThemedText>
      <ThemedText type="small">Right eye center: {fmtPt(measured.points.rightEyeCenter)}</ThemedText>
      <ThemedText type="small">Nose/mouth: {fmtPt(measured.points.noseMouth)}</ThemedText>
      <ThemedText type="small">Body centerline: x = {measured.bodyCenterlineX.toFixed(4)} (normalized)</ThemedText>
      <ThemedText type="small">Paw baseline: y = {measured.pawBaselineY.toFixed(4)} (normalized)</ThemedText>
      <ThemedText type="small">Eye region: {fmtBox(measured.boxes.eyeRegion)}</ThemedText>
      <ThemedText type="small">Left eye socket: {fmtBox(measured.boxes.leftEyeSocket)}</ThemedText>
      <ThemedText type="small">Right eye socket: {fmtBox(measured.boxes.rightEyeSocket)}</ThemedText>
      <ThemedText type="small">Planner bounds on canvas: {fmtBox(measured.boxes.plannerBounds)}</ThemedText>
      <ThemedText type="small">Planner opaque (silhouette) bounds: {fmtBox(measured.boxes.plannerOpaqueBounds)}</ThemedText>

      <ThemedText type="smallBold" style={styles.coordGroupHeading}>
        PROPOSED attachment anchors -- not yet approved
      </ThemedText>
      <ThemedText type="small">Left ear root: {fmtPt(proposed.points.leftEarRoot)}</ThemedText>
      <ThemedText type="small">Right ear root: {fmtPt(proposed.points.rightEarRoot)}</ThemedText>
      <ThemedText type="small">Left wing root: {fmtPt(proposed.points.leftWingRoot)}</ThemedText>
      <ThemedText type="small">Right wing root: {fmtPt(proposed.points.rightWingRoot)}</ThemedText>
      <ThemedText type="small">Tail root: {fmtPt(proposed.points.tailRoot)}</ThemedText>
      <ThemedText type="small">Head-feature anchor: {fmtPt(proposed.points.headFeatureAnchor)}</ThemedText>
      <ThemedText type="small">Chest-crest anchor: {fmtPt(proposed.points.chestCrestAnchor)}</ThemedText>
      <ThemedText type="small">Head safe zone: {fmtBox(proposed.boxes.headSafeZone)}</ThemedText>
      <ThemedText type="small">Body safe zone: {fmtBox(proposed.boxes.bodySafeZone)}</ThemedText>
      <ThemedText type="small">
        Max wing bleed: norm ({proposed.maxWingBleedArea.normalized.x0}, {proposed.maxWingBleedArea.normalized.y0}) - (
        {proposed.maxWingBleedArea.normalized.x1}, {proposed.maxWingBleedArea.normalized.y1})
      </ThemedText>
      <ThemedText type="small">
        Max tail bleed: norm ({proposed.maxTailBleedArea.normalized.x0}, {proposed.maxTailBleedArea.normalized.y0}) - (
        {proposed.maxTailBleedArea.normalized.x1}, {proposed.maxTailBleedArea.normalized.y1})
      </ThemedText>
    </View>
  );
}

function FilenameLegend({ filenames }: { filenames: Record<CreaturePartKey, string> }) {
  return (
    <View style={styles.legend}>
      <ThemedText type="small" themeColor="textSecondary">
        Slot bounds legend (filenames, outside the creature):
      </ThemedText>
      {PART_KEYS.map((key) => (
        <ThemedText key={key} type="small" themeColor="textSecondary">
          {PART_LABEL[key]}: {filenames[key]}
        </ThemedText>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  content: { padding: Spacing.three, gap: Spacing.four, paddingBottom: Spacing.six },
  toggle: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#00000033',
    borderRadius: 8,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  section: { gap: Spacing.two },
  note: { fontStyle: 'italic' },
  row: { flexDirection: 'row', gap: Spacing.three, flexWrap: 'wrap' },
  column: { gap: Spacing.one },
  recipeList: { marginTop: Spacing.one, gap: 2 },
  legend: { marginTop: Spacing.one, gap: 2 },
  placeholder: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#00000033',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.two,
  },
  placeholderText: { textAlign: 'center' },
  coordList: { gap: 2, minWidth: 280, flexShrink: 1 },
  coordGroupHeading: { marginTop: Spacing.two },
  canvasPreview: { backgroundColor: 'rgba(0,0,0,0.03)', overflow: 'hidden' },
});
