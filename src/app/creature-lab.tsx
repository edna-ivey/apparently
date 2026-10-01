import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CreatureTestComposer, DEFAULT_LAYER_ORDER, type CreatureTestRecipe } from '@/components/creature-test/creature-test-composer';
import { LabeledSlider } from '@/components/creature-test/labeled-slider';
import {
  CREATURE_TEST_CATEGORIES,
  CREATURE_TEST_CATEGORY_LABEL,
  CREATURE_TEST_KNOWN_ASSET_ISSUES,
  CREATURE_TEST_SLOTS,
  CREATURE_TEST_SLOT_LABEL,
  type CreatureTestCategory,
  type CreatureTestSlot,
} from '@/data/creature-test/creature-test-assets';
import {
  BODY_CANVAS_INSET,
  BODY_CANVAS_SIZE,
  BODY_RIG,
  COMPOSITION_CANVAS_SIZE,
  IDENTITY_EYE_TRANSFORM,
  IDENTITY_TRANSFORM,
  INITIAL_SLOT_DEFAULTS,
  buildInitialAssetCorrections,
  buildInitialSlotDefaults,
  clearCorrection,
  getCorrection,
  resolveEyeTransform,
  resolveTransform,
  setCorrection,
  type AssetCorrections,
  type CreatureTransform,
  type EyeTransform,
  type NonBodySlot,
  type SlotDefaults,
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

type CalibrationMode = 'slotDefault' | 'assetOnly';

// Per-slot slider ranges -- deliberately separate from the calibrated VALUES themselves (which
// live in slotDefaults/assetCorrections). Widening a range never touches a saved value; it only
// changes how far a slider can be dragged. Ears/Horns gets a much wider range so dramatic
// placements (tall horns pushed up and enlarged) are reachable without editing numbers by hand.
type SliderRange = { min: number; max: number; step: number };
type SlotRangeConfig = { x: SliderRange; y: SliderRange; scale: SliderRange; rotation: SliderRange; spacingScale?: SliderRange };

const DEFAULT_RANGES: SlotRangeConfig = {
  x: { min: -400, max: 400, step: 1 },
  y: { min: -400, max: 400, step: 1 },
  scale: { min: 0.05, max: 2.5, step: 0.01 },
  rotation: { min: -45, max: 45, step: 1 },
};

const EARS_HORNS_RANGES: SlotRangeConfig = {
  x: { min: -500, max: 500, step: 1 },
  y: { min: -700, max: 400, step: 1 },
  scale: { min: 0.2, max: 1.5, step: 0.01 },
  rotation: { min: -45, max: 45, step: 1 },
};

const EYES_RANGES: SlotRangeConfig = {
  ...DEFAULT_RANGES,
  spacingScale: { min: 0.5, max: 1.4, step: 0.01 },
};

const SLOT_RANGES: Record<NonBodySlot, SlotRangeConfig> = {
  tail: DEFAULT_RANGES,
  wings: DEFAULT_RANGES,
  earsHorns: EARS_HORNS_RANGES,
  eyes: EYES_RANGES,
};

function transformsEqual(a: CreatureTransform | EyeTransform, b: CreatureTransform | EyeTransform): boolean {
  if (a.x !== b.x || a.y !== b.y || a.scale !== b.scale || a.rotation !== b.rotation) return false;
  const aSpacing = (a as EyeTransform).spacingScale;
  const bSpacing = (b as EyeTransform).spacingScale;
  return aSpacing === bSpacing;
}

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
  const [slotDefaults, setSlotDefaults] = useState<SlotDefaults>(() => buildInitialSlotDefaults());
  const [assetCorrections, setAssetCorrections] = useState<AssetCorrections>(() => buildInitialAssetCorrections());
  // Baseline for the "saved vs. currently-being-adjusted" indicator -- starts equal to the
  // loaded state (whatever was already on disk counts as "saved"), and is re-synced to the
  // live slotDefaults whenever Save Calibration is clicked. Never written to except there, so a
  // slider drag alone can never mark itself as saved.
  const [savedSlotDefaults, setSavedSlotDefaults] = useState<SlotDefaults>(() => buildInitialSlotDefaults());
  const [selectedSlot, setSelectedSlot] = useState<NonBodySlot | null>(null);
  const [calibrationMode, setCalibrationMode] = useState<CalibrationMode>('slotDefault');
  const [showRig, setShowRig] = useState(false);
  const [showSelectionBox, setShowSelectionBox] = useState(false);
  const [layerVisibility, setLayerVisibility] = useState<Record<CreatureTestSlot, boolean>>({
    body: true,
    tail: true,
    wings: true,
    earsHorns: true,
    eyes: true,
  });
  const [background, setBackground] = useState<BackgroundKey>('checkerboard');
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);

  const stageWidth = 460;

  function updateSlotDefault(slot: NonBodySlot, patch: Partial<SlotDefaults[typeof slot]>) {
    setSlotDefaults((prev) => ({ ...prev, [slot]: { ...prev[slot], ...patch } }));
  }

  function updateCorrection(slot: NonBodySlot, patch: Partial<SlotDefaults[typeof slot]>) {
    const category = recipe[slot];
    setAssetCorrections((prev) => {
      const current = getCorrection(prev, category, slot) ?? identityFor(slot);
      return setCorrection(prev, category, slot, { ...current, ...patch } as SlotDefaults[typeof slot]);
    });
  }

  function handleMatchCategory(category: CreatureTestCategory) {
    setRecipe({ body: category, tail: category, wings: category, earsHorns: category, eyes: category });
  }

  function handleRandomize() {
    setRecipe({ body: randomCategory(), tail: randomCategory(), wings: randomCategory(), earsHorns: randomCategory(), eyes: randomCategory() });
  }

  function handleSetAsSlotDefault() {
    if (!selectedSlot) return;
    const category = recipe[selectedSlot];
    const correction = getCorrection(assetCorrections, category, selectedSlot);
    const resolved =
      selectedSlot === 'eyes'
        ? resolveEyeTransform(slotDefaults.eyes, correction as Partial<EyeTransform> | undefined)
        : resolveTransform(slotDefaults[selectedSlot], correction as Partial<CreatureTransform> | undefined);
    setSlotDefaults((prev) => ({ ...prev, [selectedSlot]: resolved }));
    setAssetCorrections((prev) => clearCorrection(prev, category, selectedSlot));
  }

  function handleResetSelected() {
    if (!selectedSlot) return;
    if (calibrationMode === 'slotDefault') {
      setSlotDefaults((prev) => ({ ...prev, [selectedSlot]: { ...INITIAL_SLOT_DEFAULTS[selectedSlot] } }));
    } else {
      const category = recipe[selectedSlot];
      setAssetCorrections((prev) => clearCorrection(prev, category, selectedSlot));
    }
  }

  function handleResetWholeCreature() {
    setSlotDefaults({ ...INITIAL_SLOT_DEFAULTS });
    setAssetCorrections({});
  }

  function handleSaveCalibration() {
    const payload = { slotDefaults, assetCorrections };
    const json = JSON.stringify(payload, null, 2);
    setSavedSlotDefaults({ ...slotDefaults });
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
        window.alert('Downloaded creature-config.json (also copied to clipboard). Place it at assets/creatures-test/creature-config.json to persist -- it will auto-load next time Creature Lab opens.');
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
    await exportCreaturePngWeb(recipe, slotDefaults, assetCorrections, layerVisibility);
  }

  const selectedCategory = selectedSlot ? recipe[selectedSlot] : null;

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

          <View style={styles.warningBanner}>
            <Text style={styles.warningTitle}>Ears/Horns slot default not recovered</Text>
            <Text style={styles.warningText}>
              The Ears/Horns values you calibrated live before this pass were never written to a file (Save Calibration downloads to
              your browser&apos;s Downloads folder; nothing had been placed back into assets/creatures-test/creature-config.json), so
              they could not be migrated into the new shared slot default -- it currently starts at identity (0, 0, 1x, 0°).
              Recalibrate Ears/Horns once and click &quot;SET AS SLOT DEFAULT&quot; -- from then on, Save Calibration persists it for
              real.
            </Text>
          </View>

          {/* ===== Main stage ===== */}
          <View style={styles.mainRow}>
            <View>
              <View
                style={[
                  styles.stageBackdrop,
                  { width: stageWidth, height: stageWidth },
                  background !== 'checkerboard' && { backgroundColor: BACKGROUND_COLOR[background] },
                  background === 'checkerboard' && styles.checkerboard,
                ]}
              >
                <CreatureTestComposer
                  recipe={recipe}
                  slotDefaults={slotDefaults}
                  assetCorrections={assetCorrections}
                  width={stageWidth}
                  layerOrder={DEFAULT_LAYER_ORDER}
                  layerVisibility={layerVisibility}
                  showRig={showRig}
                  showSelectionBox={showSelectionBox}
                  highlightSlot={selectedSlot}
                />
              </View>
              <Text style={styles.smallMuted}>
                Composition canvas {COMPOSITION_CANVAS_SIZE}x{COMPOSITION_CANVAS_SIZE}; original body canvas {BODY_CANVAS_SIZE}x
                {BODY_CANVAS_SIZE} centered inside it ({BODY_CANVAS_INSET}px inset each side) -- unchanged size/position, just more
                transparent room around it. Toggle Show Rig to see both bounds.
              </Text>
              {showBeforeAfter ? (
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.sectionLabel}>Before (raw, identity transforms)</Text>
                  <View
                    style={[
                      styles.stageBackdrop,
                      { width: stageWidth * 0.6, height: stageWidth * 0.6 },
                      background === 'checkerboard' && styles.checkerboard,
                    ]}
                  >
                    <CreatureTestComposer
                      recipe={recipe}
                      slotDefaults={IDENTITY_SLOT_DEFAULTS}
                      assetCorrections={{}}
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
                    <Pressable onPress={() => setSelectedSlot(slot as NonBodySlot)} style={styles.calibrateLink}>
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
              <ToggleRow label="Show Selection Box" value={showSelectionBox} onChange={setShowSelectionBox} />
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
          {selectedSlot && selectedCategory ? (
            <CalibrationPanel
              slot={selectedSlot}
              category={selectedCategory}
              mode={calibrationMode}
              onChangeMode={setCalibrationMode}
              slotDefault={slotDefaults[selectedSlot]}
              savedSlotDefault={savedSlotDefaults[selectedSlot]}
              correction={getCorrection(assetCorrections, selectedCategory, selectedSlot)}
              onChangeSlotDefault={(patch) => updateSlotDefault(selectedSlot, patch)}
              onChangeCorrection={(patch) => updateCorrection(selectedSlot, patch)}
              onSetAsSlotDefault={handleSetAsSlotDefault}
              ranges={SLOT_RANGES[selectedSlot]}
            />
          ) : null}

          <MatchCategorySection onSelect={handleMatchCategory} />

          <ViewAMatchingGallery slotDefaults={slotDefaults} assetCorrections={assetCorrections} />
          <ViewBMixedGallery slotDefaults={slotDefaults} assetCorrections={assetCorrections} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const IDENTITY_SLOT_DEFAULTS: SlotDefaults = {
  tail: { ...IDENTITY_TRANSFORM },
  wings: { ...IDENTITY_TRANSFORM },
  earsHorns: { ...IDENTITY_TRANSFORM },
  eyes: { ...IDENTITY_EYE_TRANSFORM },
};

function identityFor(slot: NonBodySlot): CreatureTransform | EyeTransform {
  return slot === 'eyes' ? { ...IDENTITY_EYE_TRANSFORM } : { ...IDENTITY_TRANSFORM };
}

function CalibrationPanel({
  slot,
  category,
  mode,
  onChangeMode,
  slotDefault,
  savedSlotDefault,
  correction,
  onChangeSlotDefault,
  onChangeCorrection,
  onSetAsSlotDefault,
  ranges,
}: {
  slot: NonBodySlot;
  category: CreatureTestCategory;
  mode: CalibrationMode;
  onChangeMode: (mode: CalibrationMode) => void;
  slotDefault: SlotDefaults[typeof slot];
  savedSlotDefault: SlotDefaults[typeof slot];
  correction: SlotDefaults[typeof slot] | undefined;
  onChangeSlotDefault: (patch: Partial<SlotDefaults[typeof slot]>) => void;
  onChangeCorrection: (patch: Partial<SlotDefaults[typeof slot]>) => void;
  onSetAsSlotDefault: () => void;
  ranges: SlotRangeConfig;
}) {
  const resolvedCorrection = correction ?? identityFor(slot);
  const resolved =
    slot === 'eyes'
      ? resolveEyeTransform(slotDefault as EyeTransform, resolvedCorrection as Partial<EyeTransform>)
      : resolveTransform(slotDefault as CreatureTransform, resolvedCorrection as Partial<CreatureTransform>);

  // Which value the sliders show/edit depends on mode: the shared slot default itself, or just
  // this category's small correction on top of it.
  const active = mode === 'slotDefault' ? slotDefault : resolvedCorrection;
  const onChangeActive = mode === 'slotDefault' ? onChangeSlotDefault : onChangeCorrection;
  const activeScale = active.scale;

  const slotDefaultIsSaved = transformsEqual(slotDefault, savedSlotDefault);
  const hasCorrection = correction != null;

  return (
    <View style={styles.calibrationPanel}>
      <Text style={styles.sectionLabel}>
        Calibrating: {CREATURE_TEST_CATEGORY_LABEL[category]} {CREATURE_TEST_SLOT_LABEL[slot]}
      </Text>

      <Text style={styles.smallMuted}>CALIBRATING:</Text>
      <View style={styles.modeRow}>
        <RadioOption label="Slot Default (shared -- affects every category in this slot)" selected={mode === 'slotDefault'} onPress={() => onChangeMode('slotDefault')} />
        <RadioOption
          label={`This Asset Only (${CREATURE_TEST_CATEGORY_LABEL[category]} ${CREATURE_TEST_SLOT_LABEL[slot]} correction)`}
          selected={mode === 'assetOnly'}
          onPress={() => onChangeMode('assetOnly')}
        />
      </View>

      {/* Three distinct states, always visible regardless of mode: the shared slot default's
          saved-vs-being-adjusted status, whether this category has its own correction on top,
          and the final resolved transform actually rendering right now. */}
      <View style={styles.statusRow}>
        <View style={[styles.statusBadge, slotDefaultIsSaved ? styles.statusBadgeSaved : styles.statusBadgeUnsaved]}>
          <Text style={styles.statusBadgeText}>{slotDefaultIsSaved ? '✓ SAVED SLOT DEFAULT' : '● SLOT DEFAULT -- UNSAVED CHANGES'}</Text>
        </View>
        <Text style={styles.smallMuted}>
          ({slotDefault.x}, {slotDefault.y}, {slotDefault.scale}x, {slotDefault.rotation}°)
          {!slotDefaultIsSaved
            ? ` -- last saved: (${savedSlotDefault.x}, ${savedSlotDefault.y}, ${savedSlotDefault.scale}x, ${savedSlotDefault.rotation}°)`
            : ''}
        </Text>
      </View>
      <View style={styles.statusRow}>
        <View style={[styles.statusBadge, hasCorrection ? styles.statusBadgeCorrection : styles.statusBadgeNone]}>
          <Text style={styles.statusBadgeText}>
            {hasCorrection ? `◆ ASSET-ONLY CORRECTION ACTIVE -- ${CREATURE_TEST_CATEGORY_LABEL[category]}` : '○ no per-category correction'}
          </Text>
        </View>
        {hasCorrection ? (
          <Text style={styles.smallMuted}>
            ({resolvedCorrection.x}, {resolvedCorrection.y}, {resolvedCorrection.scale}x, {resolvedCorrection.rotation}°)
          </Text>
        ) : null}
      </View>
      <Text style={styles.smallMuted}>
        Resolved (what&apos;s actually rendering now) = ({resolved.x.toFixed(1)}, {resolved.y.toFixed(1)}, {resolved.scale.toFixed(2)}x,{' '}
        {resolved.rotation.toFixed(0)}°)
      </Text>

      <LabeledSlider label="X" value={active.x} min={ranges.x.min} max={ranges.x.max} step={ranges.x.step} onChange={(x) => onChangeActive({ x })} />
      <LabeledSlider label="Y" value={active.y} min={ranges.y.min} max={ranges.y.max} step={ranges.y.step} onChange={(y) => onChangeActive({ y })} />
      <LabeledSlider
        label="Scale"
        value={active.scale}
        min={ranges.scale.min}
        max={ranges.scale.max}
        step={ranges.scale.step}
        onChange={(scale) => onChangeActive({ scale })}
      />
      <LabeledSlider
        label="Rotation"
        value={active.rotation}
        min={ranges.rotation.min}
        max={ranges.rotation.max}
        step={ranges.rotation.step}
        onChange={(rotation) => onChangeActive({ rotation })}
      />
      {slot === 'eyes' ? (
        <LabeledSlider
          label="Spacing"
          value={(active as EyeTransform).spacingScale}
          min={ranges.spacingScale?.min ?? 0.5}
          max={ranges.spacingScale?.max ?? 1.4}
          step={ranges.spacingScale?.step ?? 0.01}
          onChange={(spacingScale) => onChangeActive({ spacingScale } as never)}
        />
      ) : null}

      <Pressable style={styles.setDefaultButton} onPress={onSetAsSlotDefault}>
        <Text style={styles.setDefaultButtonText}>SET AS SLOT DEFAULT</Text>
      </Pressable>
      <Text style={styles.smallMuted}>
        Promotes the current resolved transform (whatever is showing above) to the shared {CREATURE_TEST_SLOT_LABEL[slot]} slot default,
        and clears {CREATURE_TEST_CATEGORY_LABEL[category]}&apos;s own correction (since it&apos;s now baked into the default). Every
        other category keeps rendering at the same resolved position until it gets its own correction. This only updates the in-memory
        slot default -- click Save Calibration afterward to mark it as the saved default.
      </Text>

      <Text style={[styles.smallMuted, styles.sectionLabel]}>
        Verification tests (prove the transform is actually applied -- can stay in the tool or be removed later)
      </Text>
      <View style={styles.buttonRow}>
        <SecondaryButton label="TEST 25%" onPress={() => onChangeActive({ scale: 0.25 } as never)} />
        <SecondaryButton label="TEST 50%" onPress={() => onChangeActive({ scale: 0.5 } as never)} />
        <SecondaryButton label="TEST 100%" onPress={() => onChangeActive({ scale: 1 } as never)} />
      </View>
      <View style={styles.buttonRow}>
        <SecondaryButton label="MOVE LEFT 200" onPress={() => onChangeActive({ x: active.x - 200 })} />
        <SecondaryButton label="MOVE RIGHT 200" onPress={() => onChangeActive({ x: active.x + 200 })} />
        <SecondaryButton label="MOVE UP 200" onPress={() => onChangeActive({ y: active.y - 200 })} />
        <SecondaryButton label="MOVE DOWN 200" onPress={() => onChangeActive({ y: active.y + 200 })} />
      </View>
      {/* keep activeScale referenced so TS doesn't flag it as unused if the above ever changes shape */}
      {false ? <Text>{activeScale}</Text> : null}
    </View>
  );
}

function RadioOption({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable style={styles.radioRow} onPress={onPress}>
      <View style={[styles.radioOuter, selected && styles.radioOuterActive]}>{selected ? <View style={styles.radioInner} /> : null}</View>
      <Text style={styles.radioLabel}>{label}</Text>
    </Pressable>
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

function ViewAMatchingGallery({ slotDefaults, assetCorrections }: { slotDefaults: SlotDefaults; assetCorrections: AssetCorrections }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>View A -- Matching Categories</Text>
      <View style={styles.galleryRow}>
        {CREATURE_TEST_CATEGORIES.map((cat) => (
          <View key={cat} style={styles.galleryCell}>
            <CreatureTestComposer
              recipe={{ body: cat, tail: cat, wings: cat, earsHorns: cat, eyes: cat }}
              slotDefaults={slotDefaults}
              assetCorrections={assetCorrections}
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

function ViewBMixedGallery({ slotDefaults, assetCorrections }: { slotDefaults: SlotDefaults; assetCorrections: AssetCorrections }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>View B -- Mixed Creatures</Text>
      <View style={styles.galleryRow}>
        {MIXED_RECIPES.map((entry, i) => (
          <View key={i} style={styles.galleryCell}>
            <CreatureTestComposer recipe={entry.recipe} slotDefaults={slotDefaults} assetCorrections={assetCorrections} width={170} layerOrder={DEFAULT_LAYER_ORDER} />
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
// Exports the FULL composition canvas (not a dynamically-computed union of layer bounds --
// simpler and more reliable, and explicitly an acceptable alternative per the brief) at high
// resolution, so wings/ears/horns/tail can never be clipped as long as COMPOSITION_CANVAS_SIZE
// stays big enough for whatever is currently calibrated.
async function exportCreaturePngWeb(
  recipe: CreatureTestRecipe,
  slotDefaults: SlotDefaults,
  assetCorrections: AssetCorrections,
  layerVisibility: Record<CreatureTestSlot, boolean>,
) {
  const RESOLUTION = 2048; // maps to the full COMPOSITION_CANVAS_SIZE, not just the body canvas
  const canvasEl = document.createElement('canvas');
  canvasEl.width = RESOLUTION;
  canvasEl.height = RESOLUTION;
  const ctx = canvasEl.getContext('2d');
  if (!ctx) return;

  const { CREATURE_TEST_ASSETS } = await import('@/data/creature-test/creature-test-assets');

  const unit = RESOLUTION / COMPOSITION_CANVAS_SIZE;
  const bodyCanvasPx = BODY_CANVAS_SIZE * unit;
  const bodyOffsetPx = BODY_CANVAS_INSET * unit;

  for (const slot of DEFAULT_LAYER_ORDER) {
    if (!layerVisibility[slot]) continue;
    const category = recipe[slot];
    const source = CREATURE_TEST_ASSETS[category][slot] as unknown as string | { uri?: string; default?: string };
    const uri = typeof source === 'string' ? source : source?.uri ?? (source as { default?: string })?.default;
    if (!uri) continue;

    const transform =
      slot === 'body'
        ? BODY_RIG
        : slot === 'eyes'
          ? resolveEyeTransform(slotDefaults.eyes, getCorrection(assetCorrections, category, 'eyes'))
          : resolveTransform(slotDefaults[slot], getCorrection(assetCorrections, category, slot as NonBodySlot));

    // eslint-disable-next-line no-await-in-loop
    const img = await loadImage(uri);
    const scaledSize = bodyCanvasPx * transform.scale;
    const baseLeft = bodyOffsetPx + (bodyCanvasPx - scaledSize) / 2;
    const baseTop = bodyOffsetPx + (bodyCanvasPx - scaledSize) / 2;
    const left = baseLeft + transform.x * unit;
    const top = baseTop + transform.y * unit;

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
  stageBackdrop: { alignItems: 'center', justifyContent: 'center', borderRadius: 12, overflow: 'visible' },
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
  modeRow: { gap: 6, backgroundColor: '#F6F2F4', borderRadius: 8, padding: 8 },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  radioOuter: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: '#00000055', alignItems: 'center', justifyContent: 'center' },
  radioOuterActive: { borderColor: '#E61E5A' },
  radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E61E5A' },
  radioLabel: { fontSize: 12, flexShrink: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 6 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: 1 },
  statusBadgeSaved: { backgroundColor: '#E6F5EC', borderColor: '#1F7A45' },
  statusBadgeUnsaved: { backgroundColor: '#FFF1D6', borderColor: '#B8780C' },
  statusBadgeCorrection: { backgroundColor: '#F3E8FF', borderColor: '#8033D6' },
  statusBadgeNone: { backgroundColor: '#F1F1F1', borderColor: '#00000022' },
  statusBadgeText: { fontSize: 10, fontWeight: '800' },
  setDefaultButton: {
    backgroundColor: '#1F7A45',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  setDefaultButtonText: { color: '#fff', fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
  section: { gap: 8, marginTop: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  galleryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  galleryCell: { alignItems: 'center', width: 180 },
  galleryLabel: { fontSize: 12, fontWeight: '700', marginTop: 4 },
  galleryCaption: { fontSize: 10, color: '#666', marginTop: 4, textAlign: 'center' },
});
