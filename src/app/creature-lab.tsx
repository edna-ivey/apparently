import { Redirect } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CreatureTestComposer, DEFAULT_LAYER_ORDER, type CreatureTestRecipe } from '@/components/creature-test/creature-test-composer';
import { LabeledSlider } from '@/components/creature-test/labeled-slider';
import {
  CREATURE_TEST_CATEGORIES,
  CREATURE_TEST_CATEGORY_LABEL,
  CREATURE_TEST_FILENAMES,
  CREATURE_TEST_KNOWN_ASSET_ISSUES,
  CREATURE_TEST_SLOTS,
  CREATURE_TEST_SLOT_LABEL,
  type CreatureTestCategory,
  type CreatureTestSlot,
} from '@/data/creature-test/creature-test-assets';
import {
  ANCHORS,
  DEFAULT_CREATURE_ASSET_CONFIG,
  IDENTITY_TRANSFORM,
  buildInitialConfig,
  composeTransform,
  type CreatureCategoryConfig,
} from '@/data/creature-test/creature-test-config';

// INTERNAL DEV-ONLY production calibration tool for assets/creatures-test/ (a fresh 5-slot x
// 8-category modular Creature asset set -- separate from src/app/dev/creature-lab.tsx, which
// covers an earlier, different asset library under assets/creatures/). Not linked from any
// navigation; reachable only at /creature-lab, and blanked outside __DEV__.

type BackgroundKey = 'checkerboard' | 'cream' | 'white' | 'plum';
const BACKGROUND_OPTIONS: { key: BackgroundKey; label: string }[] = [
  { key: 'checkerboard', label: 'Checkerboard' },
  { key: 'cream', label: 'Warm cream' },
  { key: 'white', label: 'White' },
  { key: 'plum', label: 'Dark plum' },
];
const BACKGROUND_COLOR: Record<BackgroundKey, string> = {
  checkerboard: 'transparent',
  cream: '#FFF3E4',
  white: '#FFFFFF',
  plum: '#2B1730',
};

const DEFAULT_RECIPE: CreatureTestRecipe = {
  body: 'strong',
  tail: 'strong',
  wings: 'strong',
  earsHorns: 'strong',
  eyes: 'strong',
};

function randomCategory(): CreatureTestCategory {
  return CREATURE_TEST_CATEGORIES[Math.floor(Math.random() * CREATURE_TEST_CATEGORIES.length)];
}

export default function CreatureLabScreen() {
  if (!__DEV__) {
    return <Redirect href="/" />;
  }
  return <CreatureLabInner />;
}

function CreatureLabInner() {
  const [recipe, setRecipe] = useState<CreatureTestRecipe>(DEFAULT_RECIPE);
  const [config, setConfig] = useState(() => buildInitialConfig());
  const [selectedSlot, setSelectedSlot] = useState<Exclude<CreatureTestSlot, 'body'> | null>(null);
  const [showRig, setShowRig] = useState(false);
  const [layerVisibility, setLayerVisibility] = useState<Record<CreatureTestSlot, boolean>>({
    body: true,
    tail: true,
    wings: true,
    earsHorns: true,
    eyes: true,
  });
  const [background, setBackground] = useState<BackgroundKey>('checkerboard');
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);
  const stageRef = useRef<View>(null);

  const stageWidth = 420;

  function updateCorrection(slot: Exclude<CreatureTestSlot, 'body'>, patch: Partial<CreatureCategoryConfig[typeof slot]>) {
    const category = recipe[slot];
    setConfig((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [slot]: { ...prev[category][slot], ...patch },
      },
    }));
  }

  function handleMatchCategory(category: CreatureTestCategory) {
    setRecipe({ body: category, tail: category, wings: category, earsHorns: category, eyes: category });
  }

  function handleRandomize() {
    setRecipe({ body: randomCategory(), tail: randomCategory(), wings: randomCategory(), earsHorns: randomCategory(), eyes: randomCategory() });
  }

  function handleResetSelected() {
    if (!selectedSlot) return;
    const category = recipe[selectedSlot];
    setConfig((prev) => ({
      ...prev,
      [category]: { ...prev[category], [selectedSlot]: { ...DEFAULT_CREATURE_ASSET_CONFIG[category][selectedSlot] } },
    }));
  }

  function handleResetWholeCreature() {
    setConfig((prev) => {
      const next = { ...prev };
      for (const slot of ['tail', 'wings', 'earsHorns', 'eyes'] as const) {
        const category = recipe[slot];
        next[category] = { ...next[category], [slot]: { ...DEFAULT_CREATURE_ASSET_CONFIG[category][slot] } };
      }
      return next;
    });
  }

  function handleSaveCalibration() {
    const json = JSON.stringify(config, null, 2);
    if (Platform.OS === 'web') {
      try {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'creature-config.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        void navigator.clipboard?.writeText(json).catch(() => {});
        // eslint-disable-next-line no-alert
        window.alert('Downloaded creature-config.json (also copied to clipboard). Place it at assets/creatures-test/creature-config.json to persist these corrections.');
      } catch (err) {
        console.warn('Save calibration failed', err);
      }
    } else {
      console.log('creature-config.json:\n' + json);
    }
  }

  async function handleExportPng() {
    if (Platform.OS !== 'web') {
      // eslint-disable-next-line no-alert
      window?.alert?.('PNG export is implemented for the web build. Native export would need react-native-view-shot (not currently installed).');
      return;
    }
    await exportCreaturePngWeb(recipe, config, layerVisibility);
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Creature Lab</Text>
          <Text style={styles.subtitle}>
            Internal calibration tool for assets/creatures-test/. Positioning, scale, rotation, and layering only -- no artwork is
            edited, cropped, recolored, or regenerated.
          </Text>

          {CREATURE_TEST_KNOWN_ASSET_ISSUES.length > 0 ? (
            <View style={styles.warningBanner}>
              <Text style={styles.warningTitle}>Source asset issue found during inspection</Text>
              {CREATURE_TEST_KNOWN_ASSET_ISSUES.map((issue) => (
                <Text key={`${issue.category}-${issue.slot}`} style={styles.warningText}>
                  {CREATURE_TEST_CATEGORY_LABEL[issue.category]} {CREATURE_TEST_SLOT_LABEL[issue.slot]}: {issue.description}
                </Text>
              ))}
            </View>
          ) : null}

          {/* ===== Main stage ===== */}
          <View style={styles.mainRow}>
            <View>
              <View style={[styles.stageBackdrop, background !== 'checkerboard' && { backgroundColor: BACKGROUND_COLOR[background] }, background === 'checkerboard' && styles.checkerboard]}>
                <CreatureTestComposer
                  recipe={recipe}
                  config={config}
                  width={stageWidth}
                  layerOrder={DEFAULT_LAYER_ORDER}
                  layerVisibility={layerVisibility}
                  showRig={showRig}
                  highlightSlot={selectedSlot}
                />
              </View>
              {showBeforeAfter ? (
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.sectionLabel}>Before (raw, identity transforms)</Text>
                  <View style={[styles.stageBackdrop, { width: stageWidth * 0.6, height: stageWidth * 0.6 }, background === 'checkerboard' && styles.checkerboard]}>
                    <CreatureTestComposer
                      recipe={recipe}
                      config={identityConfigFor(recipe, config)}
                      width={stageWidth * 0.6}
                      layerOrder={DEFAULT_LAYER_ORDER}
                      layerVisibility={layerVisibility}
                    />
                  </View>
                </View>
              ) : null}
            </View>

            <View style={styles.controlsColumn}>
              {CREATURE_TEST_SLOTS.map((slot) => (
                <View key={slot} style={styles.slotPicker}>
                  <Text style={styles.slotPickerLabel}>{CREATURE_TEST_SLOT_LABEL[slot]}</Text>
                  <View style={styles.chipRow}>
                    {CREATURE_TEST_CATEGORIES.map((cat) => (
                      <Pressable
                        key={cat}
                        onPress={() => setRecipe((prev) => ({ ...prev, [slot]: cat }))}
                        style={[styles.chip, recipe[slot] === cat && styles.chipActive]}
                      >
                        <Text style={[styles.chipText, recipe[slot] === cat && styles.chipTextActive]}>{CREATURE_TEST_CATEGORY_LABEL[cat]}</Text>
                      </Pressable>
                    ))}
                  </View>
                  {slot !== 'body' ? (
                    <Pressable onPress={() => setSelectedSlot(slot)} style={styles.calibrateLink}>
                      <Text style={styles.calibrateLinkText}>{selectedSlot === slot ? '▾ calibrating' : '▸ calibrate'}</Text>
                    </Pressable>
                  ) : (
                    <Text style={styles.lockedNote}>locked master rig -- not adjustable per category</Text>
                  )}
                </View>
              ))}

              <View style={styles.buttonRow}>
                <PrimaryButton label="Randomize" onPress={handleRandomize} />
                <PrimaryButton label="Save Calibration" onPress={handleSaveCalibration} />
                <PrimaryButton label="Export PNG" onPress={handleExportPng} />
              </View>
              <View style={styles.buttonRow}>
                <SecondaryButton label="Reset selected" onPress={handleResetSelected} disabled={!selectedSlot} />
                <SecondaryButton label="Reset whole creature" onPress={handleResetWholeCreature} />
              </View>

              <ToggleRow label="Show Rig" value={showRig} onChange={setShowRig} />
              <ToggleRow label="Before / After" value={showBeforeAfter} onChange={setShowBeforeAfter} />

              <Text style={styles.sectionLabel}>Layer visibility</Text>
              <View style={styles.chipRow}>
                {CREATURE_TEST_SLOTS.map((slot) => (
                  <Pressable
                    key={slot}
                    onPress={() => setLayerVisibility((prev) => ({ ...prev, [slot]: !prev[slot] }))}
                    style={[styles.chip, layerVisibility[slot] && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, layerVisibility[slot] && styles.chipTextActive]}>
                      {CREATURE_TEST_SLOT_LABEL[slot]} {layerVisibility[slot] ? '✓' : ''}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.sectionLabel}>Background</Text>
              <View style={styles.chipRow}>
                {BACKGROUND_OPTIONS.map((opt) => (
                  <Pressable key={opt.key} onPress={() => setBackground(opt.key)} style={[styles.chip, background === opt.key && styles.chipActive]}>
                    <Text style={[styles.chipText, background === opt.key && styles.chipTextActive]}>{opt.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {/* ===== Calibration panel ===== */}
          {selectedSlot ? (
            <CalibrationPanel
              slot={selectedSlot}
              category={recipe[selectedSlot]}
              correction={config[recipe[selectedSlot]][selectedSlot]}
              anchor={ANCHORS[selectedSlot]}
              onChange={(patch) => updateCorrection(selectedSlot, patch)}
            />
          ) : null}

          <MatchCategorySection onSelect={handleMatchCategory} />

          <ViewAMatchingGallery config={config} />
          <ViewBMixedGallery config={config} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function identityConfigFor(
  recipe: CreatureTestRecipe,
  config: Record<CreatureTestCategory, CreatureCategoryConfig>,
): Record<CreatureTestCategory, CreatureCategoryConfig> {
  const next = { ...config };
  for (const slot of ['tail', 'wings', 'earsHorns', 'eyes'] as const) {
    const category = recipe[slot];
    next[category] = {
      ...next[category],
      [slot]: slot === 'eyes' ? { ...IDENTITY_TRANSFORM, spacingScale: 1 } : { ...IDENTITY_TRANSFORM },
    };
  }
  return next;
}

function CalibrationPanel({
  slot,
  category,
  correction,
  anchor,
  onChange,
}: {
  slot: Exclude<CreatureTestSlot, 'body'>;
  category: CreatureTestCategory;
  correction: CreatureCategoryConfig[typeof slot];
  anchor: (typeof ANCHORS)[typeof slot];
  onChange: (patch: Partial<CreatureCategoryConfig[typeof slot]>) => void;
}) {
  const resolved = composeTransform(anchor, correction);
  return (
    <View style={styles.calibrationPanel}>
      <Text style={styles.sectionLabel}>
        Calibrating: {CREATURE_TEST_CATEGORY_LABEL[category]} {CREATURE_TEST_SLOT_LABEL[slot]}
      </Text>
      <Text style={styles.smallMuted}>
        Anchor ({anchor.x}, {anchor.y}, {anchor.scale}x, {anchor.rotation}°) + this correction = resolved ({resolved.x.toFixed(1)},{' '}
        {resolved.y.toFixed(1)}, {resolved.scale.toFixed(2)}x, {resolved.rotation.toFixed(0)}°)
      </Text>
      <LabeledSlider label="X" value={correction.x} min={-400} max={400} step={1} onChange={(x) => onChange({ x })} />
      <LabeledSlider label="Y" value={correction.y} min={-400} max={400} step={1} onChange={(y) => onChange({ y })} />
      <LabeledSlider label="Scale" value={correction.scale} min={0.2} max={2.5} step={0.01} onChange={(scale) => onChange({ scale })} />
      <LabeledSlider label="Rotation" value={correction.rotation} min={-45} max={45} step={1} onChange={(rotation) => onChange({ rotation })} />
      {slot === 'eyes' ? (
        <LabeledSlider
          label="Spacing"
          value={(correction as { spacingScale: number }).spacingScale}
          min={0.7}
          max={1.4}
          step={0.01}
          onChange={(spacingScale) => onChange({ spacingScale } as never)}
        />
      ) : null}

      <Text style={[styles.smallMuted, styles.sectionLabel]}>
        Verification tests (prove the transform is actually applied -- can stay in the tool or be removed later)
      </Text>
      <View style={styles.buttonRow}>
        <SecondaryButton label="TEST 25%" onPress={() => onChange({ scale: 0.25 / anchor.scale })} />
        <SecondaryButton label="TEST 50%" onPress={() => onChange({ scale: 0.5 / anchor.scale })} />
        <SecondaryButton label="TEST 100%" onPress={() => onChange({ scale: 1 / anchor.scale })} />
      </View>
      <View style={styles.buttonRow}>
        <SecondaryButton label="MOVE LEFT 200" onPress={() => onChange({ x: correction.x - 200 })} />
        <SecondaryButton label="MOVE RIGHT 200" onPress={() => onChange({ x: correction.x + 200 })} />
        <SecondaryButton label="MOVE UP 200" onPress={() => onChange({ y: correction.y - 200 })} />
        <SecondaryButton label="MOVE DOWN 200" onPress={() => onChange({ y: correction.y + 200 })} />
      </View>
    </View>
  );
}

function MatchCategorySection({ onSelect }: { onSelect: (category: CreatureTestCategory) => void }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>Match Category</Text>
      <View style={styles.chipRow}>
        {CREATURE_TEST_CATEGORIES.map((cat) => (
          <Pressable key={cat} onPress={() => onSelect(cat)} style={styles.chip}>
            <Text style={styles.chipText}>{CREATURE_TEST_CATEGORY_LABEL[cat]}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function ViewAMatchingGallery({ config }: { config: Record<CreatureTestCategory, CreatureCategoryConfig> }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>View A -- Matching Categories</Text>
      <View style={styles.galleryRow}>
        {CREATURE_TEST_CATEGORIES.map((cat) => (
          <View key={cat} style={styles.galleryCell}>
            <CreatureTestComposer
              recipe={{ body: cat, tail: cat, wings: cat, earsHorns: cat, eyes: cat }}
              config={config}
              width={150}
              layerOrder={DEFAULT_LAYER_ORDER}
            />
            <Text style={styles.galleryLabel}>{CREATURE_TEST_CATEGORY_LABEL[cat]}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const MIXED_RECIPES: { label: string; recipe: CreatureTestRecipe }[] = [
  { label: 'Strong body + Sentimental eyes + Visionary wings + Grounded ears + Playful tail', recipe: { body: 'strong', eyes: 'sentimental', wings: 'visionary', earsHorns: 'grounded', tail: 'playful' } },
  { label: 'Bold body + Curious eyes + Harmonious wings + Strong ears + Visionary tail', recipe: { body: 'bold', eyes: 'curious', wings: 'harmonious', earsHorns: 'strong', tail: 'visionary' } },
  { label: 'Harmonious body + Playful eyes + Bold wings + Sentimental ears + Grounded tail', recipe: { body: 'harmonious', eyes: 'playful', wings: 'bold', earsHorns: 'sentimental', tail: 'grounded' } },
  { label: 'Grounded body + Visionary eyes + Strong wings + Curious ears + Bold tail', recipe: { body: 'grounded', eyes: 'visionary', wings: 'strong', earsHorns: 'curious', tail: 'bold' } },
  { label: 'Sentimental body + Bold eyes + Playful wings + Visionary ears + Harmonious tail', recipe: { body: 'sentimental', eyes: 'bold', wings: 'playful', earsHorns: 'visionary', tail: 'harmonious' } },
  { label: 'Curious body + Grounded eyes + Sentimental wings + Playful ears + Strong tail', recipe: { body: 'curious', eyes: 'grounded', wings: 'sentimental', earsHorns: 'playful', tail: 'strong' } },
  { label: 'Playful body + Harmonious eyes + Curious wings + Bold ears + Sentimental tail', recipe: { body: 'playful', eyes: 'harmonious', wings: 'curious', earsHorns: 'bold', tail: 'sentimental' } },
  { label: 'Visionary body + Strong eyes + Grounded wings + Harmonious ears + Curious tail', recipe: { body: 'visionary', eyes: 'strong', wings: 'grounded', earsHorns: 'harmonious', tail: 'curious' } },
];

function ViewBMixedGallery({ config }: { config: Record<CreatureTestCategory, CreatureCategoryConfig> }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>View B -- Mixed Creatures</Text>
      <View style={styles.galleryRow}>
        {MIXED_RECIPES.map((entry, i) => (
          <View key={i} style={styles.galleryCell}>
            <CreatureTestComposer recipe={entry.recipe} config={config} width={170} layerOrder={DEFAULT_LAYER_ORDER} />
            <Text style={styles.galleryCaption}>{entry.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable style={styles.toggleRow} onPress={() => onChange(!value)}>
      <View style={[styles.toggleBox, value && styles.toggleBoxActive]}>{value ? <Text style={styles.toggleCheck}>✓</Text> : null}</View>
      <Text style={styles.toggleLabel}>{label}</Text>
    </Pressable>
  );
}

function PrimaryButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.primaryButton, disabled && styles.buttonDisabled]}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.secondaryButton, disabled && styles.buttonDisabled]}>
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

// ---- Web-only high-resolution PNG export -----------------------------------------------
async function exportCreaturePngWeb(
  recipe: CreatureTestRecipe,
  config: Record<CreatureTestCategory, CreatureCategoryConfig>,
  layerVisibility: Record<CreatureTestSlot, boolean>,
) {
  const RESOLUTION = 2048;
  const canvasEl = document.createElement('canvas');
  canvasEl.width = RESOLUTION;
  canvasEl.height = RESOLUTION;
  const ctx = canvasEl.getContext('2d');
  if (!ctx) return;

  const { CREATURE_TEST_ASSETS } = await import('@/data/creature-test/creature-test-assets');
  const { BODY_RIG } = await import('@/data/creature-test/creature-test-config');

  for (const slot of DEFAULT_LAYER_ORDER) {
    if (!layerVisibility[slot]) continue;
    const category = recipe[slot];
    const source = CREATURE_TEST_ASSETS[category][slot] as unknown as string | { uri?: string; default?: string };
    const uri = typeof source === 'string' ? source : source?.uri ?? (source as { default?: string })?.default;
    if (!uri) continue;

    const transform = slot === 'body' ? BODY_RIG : composeTransform(ANCHORS[slot as Exclude<CreatureTestSlot, 'body'>], config[category][slot as Exclude<CreatureTestSlot, 'body'>]);

    // eslint-disable-next-line no-await-in-loop
    const img = await loadImage(uri);
    const scaledSize = RESOLUTION * transform.scale;
    const baseOffset = (RESOLUTION - scaledSize) / 2;
    const left = baseOffset + (transform.x / 1254) * RESOLUTION;
    const top = baseOffset + (transform.y / 1254) * RESOLUTION;

    ctx.save();
    if (transform.rotation) {
      ctx.translate(left + scaledSize / 2, top + scaledSize / 2);
      ctx.rotate((transform.rotation * Math.PI) / 180);
      ctx.translate(-(left + scaledSize / 2), -(top + scaledSize / 2));
    }
    ctx.drawImage(img, left, top, scaledSize, scaledSize);
    ctx.restore();
  }

  const dataUrl = canvasEl.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `creature-${recipe.body}-${recipe.tail}-${recipe.wings}-${recipe.earsHorns}-${recipe.eyes}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FAF7F5' },
  safeArea: { flex: 1 },
  content: { padding: 20, gap: 16, paddingBottom: 80 },
  title: { fontSize: 26, fontWeight: '800' },
  subtitle: { fontSize: 13, color: '#666', maxWidth: 800 },
  warningBanner: { backgroundColor: '#FFF1E0', borderWidth: 1, borderColor: '#E8A33D', borderRadius: 10, padding: 12, gap: 4 },
  warningTitle: { fontWeight: '700', fontSize: 13 },
  warningText: { fontSize: 12, color: '#5A4324' },
  mainRow: { flexDirection: 'row', gap: 24, flexWrap: 'wrap' },
  stageBackdrop: { width: 420, height: 420, alignItems: 'center', justifyContent: 'center', borderRadius: 12, overflow: 'hidden' },
  checkerboard: {
    backgroundColor: '#e9e9e9',
    // simple checker via layered borders isn't trivial in RN StyleSheet; a flat mid-gray reads
    // as "neutral test background" cross-platform without needing an image asset or web-only CSS.
  },
  controlsColumn: { flex: 1, minWidth: 320, gap: 10 },
  slotPicker: { gap: 4, marginBottom: 6 },
  slotPickerLabel: { fontWeight: '700', fontSize: 13 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: '#00000022', backgroundColor: '#fff' },
  chipActive: { backgroundColor: '#2B1730', borderColor: '#2B1730' },
  chipText: { fontSize: 12 },
  chipTextActive: { color: '#fff' },
  calibrateLink: { alignSelf: 'flex-start', marginTop: 2 },
  calibrateLinkText: { fontSize: 12, color: '#E61E5A', fontWeight: '600' },
  lockedNote: { fontSize: 11, color: '#999', fontStyle: 'italic' },
  buttonRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 6 },
  primaryButton: { backgroundColor: '#2B1730', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  primaryButtonText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  secondaryButton: { borderWidth: 1, borderColor: '#00000033', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  secondaryButtonText: { fontSize: 12, fontWeight: '600' },
  buttonDisabled: { opacity: 0.4 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  toggleBox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: '#00000044', alignItems: 'center', justifyContent: 'center' },
  toggleBoxActive: { backgroundColor: '#2B1730', borderColor: '#2B1730' },
  toggleCheck: { color: '#fff', fontSize: 12, fontWeight: '700' },
  toggleLabel: { fontSize: 13 },
  sectionLabel: { fontWeight: '700', fontSize: 13, marginTop: 8 },
  smallMuted: { fontSize: 11, color: '#888' },
  calibrationPanel: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#00000018', padding: 14, gap: 4 },
  section: { gap: 8, marginTop: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  galleryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  galleryCell: { alignItems: 'center', width: 180 },
  galleryLabel: { fontSize: 12, fontWeight: '700', marginTop: 4 },
  galleryCaption: { fontSize: 10, color: '#666', marginTop: 4, textAlign: 'center' },
});
