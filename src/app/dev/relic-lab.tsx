import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RelicLabComposer } from '@/components/relic-lab/relic-lab-composer';
import { LabeledSlider } from '@/components/creature-test/labeled-slider';
import {
  COLOR_FAMILIES,
  EFFECTS,
  RELIC_TRAITS,
  colorFamilyByKey,
  effectByKey,
  relicTraitByKey,
  type ColorFamilyKey,
  type EffectKey,
  type RelicTraitKey,
} from '@/data/relic-lab/relic-lab-assets';
import {
  DEFAULT_LAYER_DEFAULTS,
  EMPTY_ASSET_CORRECTIONS,
  loadRelicLabCalibration,
  resolveOpacity,
  resolveTransform,
  saveRelicLabCalibration,
  type RelicAssetCorrections,
  type RelicLabTransform,
  type RelicLayerDefaults,
} from '@/data/relic-lab/relic-lab-config';
import {
  buildCombinationKey,
  clearSavedCombination,
  importSavedCombinations,
  loadSavedCombinations,
  saveCombination,
  type SavedCombination,
  type SavedCombinationsMap,
} from '@/data/relic-lab/relic-lab-saved-combinations';

// INTERNAL DEV-ONLY visual compositing/calibration tool for the Relic system's 3 SVG layers
// (assets/relics/relic|color|effect/). Reachable only at /dev/relic-lab, blanked outside
// __DEV__, not linked from any navigation. NOT production Relic logic: no reveal rules, no
// trait-to-Relic scoring, no personality mapping, no change to src/data/private-signals.ts or
// the You page's RelicGlyph. Purely "does this Relic + this color + this effect, stacked and
// calibrated, look right" -- same R&D philosophy as Creature Lab (src/app/creature-lab.tsx),
// but its own separate asset set, state, and storage key.

type LayerKind = 'base' | 'color' | 'effect';
type CalibrationMode = 'layerDefault' | 'assetOnly';
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

const TRANSFORM_RANGES = {
  x: { min: -300, max: 300, step: 1 },
  y: { min: -300, max: 300, step: 1 },
  scale: { min: 0.2, max: 2.5, step: 0.01 },
  rotation: { min: -180, max: 180, step: 1 },
};
const OPACITY_RANGE = { min: 0, max: 1, step: 0.01 };

function randomFrom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

// --- Save Calibration workflow helpers -----------------------------------------------------
// "Load Saved Calibration" re-applies an exact saved look by computing the per-asset
// CORRECTION that, composed with whatever the layer default currently is, resolves to exactly
// the saved target -- i.e. the inverse of resolveTransform/resolveOpacity. This reuses the
// existing correction pipeline rather than adding a second, parallel rendering path, and means
// a saved combination still displays correctly even if the shared layer default has since
// changed.
function deriveCorrection(layerDefault: RelicLabTransform, target: RelicLabTransform): Partial<RelicLabTransform> {
  return {
    x: target.x - layerDefault.x,
    y: target.y - layerDefault.y,
    scale: layerDefault.scale !== 0 ? target.scale / layerDefault.scale : target.scale,
    rotation: target.rotation - layerDefault.rotation,
  };
}

function deriveOpacityCorrection(layerDefaultOpacity: number, targetOpacity: number): number {
  return layerDefaultOpacity !== 0 ? targetOpacity / layerDefaultOpacity : targetOpacity;
}

function transformsMatch(a: RelicLabTransform, b: RelicLabTransform): boolean {
  return a.x === b.x && a.y === b.y && a.scale === b.scale && a.rotation === b.rotation;
}

export default function RelicLabScreen() {
  if (!__DEV__) {
    return <Redirect href="/" />;
  }
  return <RelicLabInner />;
}

function RelicLabInner() {
  const [loaded, setLoaded] = useState(false);
  const [baseKey, setBaseKey] = useState<RelicTraitKey>(RELIC_TRAITS[0].key);
  const [colorKey, setColorKey] = useState<ColorFamilyKey>(COLOR_FAMILIES[0].key);
  const [effectKey, setEffectKey] = useState<EffectKey>(EFFECTS[0].key);
  const [layerDefaults, setLayerDefaults] = useState<RelicLayerDefaults>(DEFAULT_LAYER_DEFAULTS);
  const [assetCorrections, setAssetCorrections] = useState<RelicAssetCorrections>(EMPTY_ASSET_CORRECTIONS);
  const [calibrationMode, setCalibrationMode] = useState<CalibrationMode>('layerDefault');
  const [selectedLayer, setSelectedLayer] = useState<LayerKind>('base');
  const [background, setBackground] = useState<BackgroundKey>('checkerboard');

  // Explicit, intentional "Save Calibration" workflow -- deliberately separate state/storage
  // from the general layerDefaults/assetCorrections above (see relic-lab-saved-combinations.ts's
  // own header for why).
  const [savedCombinations, setSavedCombinations] = useState<SavedCombinationsMap>({});
  const [loadMessage, setLoadMessage] = useState<string | null>(null);
  const [showJsonPanel, setShowJsonPanel] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [importMessage, setImportMessage] = useState<string | null>(null);

  // Load persisted calibration once on mount -- see relic-lab-config.ts's own dedicated
  // storage key (never Creature Lab's).
  useEffect(() => {
    let cancelled = false;
    void loadRelicLabCalibration().then((saved) => {
      if (cancelled) return;
      setLayerDefaults(saved.layerDefaults);
      setAssetCorrections(saved.assetCorrections);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist on every change, once initial load has completed (so loading never immediately
  // overwrites a prior session's save with the coded defaults).
  useEffect(() => {
    if (!loaded) return;
    void saveRelicLabCalibration({ layerDefaults, assetCorrections });
  }, [loaded, layerDefaults, assetCorrections]);

  // Load saved combinations once on mount -- its own dedicated storage key, loaded independently
  // of the general calibration above.
  useEffect(() => {
    let cancelled = false;
    void loadSavedCombinations().then((map) => {
      if (!cancelled) setSavedCombinations(map);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const baseEntry = relicTraitByKey(baseKey);
  const colorEntry = colorFamilyByKey(colorKey);
  const effectEntry = effectByKey(effectKey);

  const baseCorrection = assetCorrections.base[baseKey];
  const colorCorrection = assetCorrections.color[colorKey];
  const effectCorrection = assetCorrections.effect[effectKey];

  const resolvedBase = resolveTransform(layerDefaults.base, baseCorrection);
  const resolvedColor = resolveTransform(layerDefaults.color, colorCorrection);
  const resolvedColorOpacity = resolveOpacity(layerDefaults.color.opacity, colorCorrection?.opacity);
  const resolvedEffect = resolveTransform(layerDefaults.effect, effectCorrection);
  const resolvedEffectOpacity = resolveOpacity(layerDefaults.effect.opacity, effectCorrection?.opacity);

  const hasCorrection = {
    base: baseCorrection !== undefined,
    color: colorCorrection !== undefined,
    effect: effectCorrection !== undefined,
  };

  // --- Save Calibration status for the EXACT currently-selected combination ----------------
  const comboKey = buildCombinationKey(baseKey, colorKey, effectKey);
  const savedEntry = savedCombinations[comboKey];
  const matchesSavedEntry = savedEntry
    ? transformsMatch(resolvedBase, savedEntry.base) &&
      transformsMatch(resolvedColor, savedEntry.colorLayer) &&
      resolvedColorOpacity === savedEntry.colorLayer.opacity &&
      transformsMatch(resolvedEffect, savedEntry.effectLayer) &&
      resolvedEffectOpacity === savedEntry.effectLayer.opacity
    : false;
  // Strictly binary, per the brief: "Saved ✓" exactly when the currently-visible look matches
  // what's saved for this exact combo, "Unsaved changes" otherwise (including when nothing has
  // ever been saved for it). The separate "a save exists but isn't currently showing" case --
  // auto-detection when switching combos -- is its own independent hint below, never a third
  // state folded into this one.
  const saveStatus: 'saved' | 'unsaved' = matchesSavedEntry ? 'saved' : 'unsaved';
  // True when a save exists for this combo but the live look doesn't currently match it (e.g.
  // just switched to a combo with an old save, or changed something after loading it).
  const savedCalibrationAvailable = savedEntry !== undefined && !matchesSavedEntry;

  const savedCombinationEntries = Object.entries(savedCombinations);

  function updateLayerDefault(layer: LayerKind, patch: Partial<RelicLabTransform & { opacity: number }>) {
    setLayerDefaults((prev) => ({ ...prev, [layer]: { ...prev[layer], ...patch } }));
  }

  function updateCorrection(layer: LayerKind, patch: Partial<RelicLabTransform & { opacity: number }>) {
    setAssetCorrections((prev) => {
      if (layer === 'base') {
        const current = prev.base[baseKey] ?? {};
        return { ...prev, base: { ...prev.base, [baseKey]: { ...current, ...patch } } };
      }
      if (layer === 'color') {
        const current = prev.color[colorKey] ?? {};
        return { ...prev, color: { ...prev.color, [colorKey]: { ...current, ...patch } } };
      }
      const current = prev.effect[effectKey] ?? {};
      return { ...prev, effect: { ...prev.effect, [effectKey]: { ...current, ...patch } } };
    });
  }

  // "This asset only" editing works in ABSOLUTE values, not raw deltas -- the user types/drags
  // to "X: 50" and the Relic ends up at x=50, exactly as shown, regardless of what the shared
  // layer default currently is. Internally this still computes and stores a correction (the
  // layerDefault+correction model is unchanged), but the correction is derived FROM the typed
  // absolute target every time, via the same inverse math Load Saved Calibration uses, so
  // display and edit always agree. (Storing the raw delta directly, as this used to, meant the
  // field could show a value that had nothing to do with what actually renders once the layer
  // default was anything other than identity -- confusing, and exactly what made a loaded saved
  // combination look like it hadn't loaded correctly even though the render was already right.)
  function updateCorrectionFromAbsolute(layer: LayerKind, patch: Partial<RelicLabTransform & { opacity: number }>) {
    const layerDefault = layerDefaults[layer];
    const currentResolved = layer === 'base' ? resolvedBase : layer === 'color' ? resolvedColor : resolvedEffect;
    const target: RelicLabTransform = { ...currentResolved, ...patch };
    const correction: Partial<RelicLabTransform & { opacity: number }> = deriveCorrection(layerDefault, target);
    if (layer !== 'base' && patch.opacity !== undefined) {
      const defaultOpacity = (layerDefault as RelicLabTransform & { opacity: number }).opacity;
      correction.opacity = deriveOpacityCorrection(defaultOpacity, patch.opacity);
    }
    updateCorrection(layer, correction);
  }

  function clearCorrection(layer: LayerKind) {
    setAssetCorrections((prev) => {
      if (layer === 'base') {
        const next = { ...prev.base };
        delete next[baseKey];
        return { ...prev, base: next };
      }
      if (layer === 'color') {
        const next = { ...prev.color };
        delete next[colorKey];
        return { ...prev, color: next };
      }
      const next = { ...prev.effect };
      delete next[effectKey];
      return { ...prev, effect: next };
    });
  }

  function handleRandomize() {
    setBaseKey(randomFrom(RELIC_TRAITS).key);
    setColorKey(randomFrom(COLOR_FAMILIES).key);
    setEffectKey(randomFrom(EFFECTS).key);
  }

  function handleResetCalibration() {
    setLayerDefaults({ ...DEFAULT_LAYER_DEFAULTS });
    setAssetCorrections({ ...EMPTY_ASSET_CORRECTIONS });
  }

  function handleResetEverything() {
    handleResetCalibration();
    setBaseKey(RELIC_TRAITS[0].key);
    setColorKey(COLOR_FAMILIES[0].key);
    setEffectKey(EFFECTS[0].key);
  }

  // --- Save Calibration workflow ------------------------------------------------------------

  async function handleSaveCalibration() {
    const entry: SavedCombination = {
      relic: baseKey,
      color: colorKey,
      effect: effectKey,
      base: resolvedBase,
      colorLayer: { ...resolvedColor, opacity: resolvedColorOpacity },
      effectLayer: { ...resolvedEffect, opacity: resolvedEffectOpacity },
      savedAt: new Date().toISOString(),
    };
    const next = await saveCombination(comboKey, entry);
    setSavedCombinations(next);
    setLoadMessage(null);
  }

  // Shared by "Load Saved Calibration" and clicking an entry in the Saved Combinations list --
  // selects the entry's three assets and applies its exact saved look via a derived per-asset
  // correction (see deriveCorrection's own comment above).
  function applySavedEntry(entry: SavedCombination) {
    setBaseKey(entry.relic);
    setColorKey(entry.color);
    setEffectKey(entry.effect);
    setAssetCorrections((prev) => ({
      base: { ...prev.base, [entry.relic]: deriveCorrection(layerDefaults.base, entry.base) },
      color: {
        ...prev.color,
        [entry.color]: {
          ...deriveCorrection(layerDefaults.color, entry.colorLayer),
          opacity: deriveOpacityCorrection(layerDefaults.color.opacity, entry.colorLayer.opacity),
        },
      },
      effect: {
        ...prev.effect,
        [entry.effect]: {
          ...deriveCorrection(layerDefaults.effect, entry.effectLayer),
          opacity: deriveOpacityCorrection(layerDefaults.effect.opacity, entry.effectLayer.opacity),
        },
      },
    }));
    // So the sliders immediately show the values that now make up the loaded look, rather than
    // the (now visually stale) shared layer defaults.
    setCalibrationMode('assetOnly');
    setLoadMessage(null);
  }

  function handleLoadSavedCalibration() {
    if (!savedEntry) {
      setLoadMessage('No saved calibration for this combination.');
      return;
    }
    applySavedEntry(savedEntry);
  }

  async function handleClearSavedCalibration() {
    const next = await clearSavedCombination(comboKey);
    setSavedCombinations(next);
  }

  function handleOpenJsonPanel() {
    setJsonText(JSON.stringify(savedCombinations, null, 2));
    setImportMessage(null);
    setShowJsonPanel(true);
  }

  async function handleCopyJson() {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(jsonText);
        setImportMessage('Copied to clipboard.');
        return;
      }
    } catch {
      // fall through to the manual-select message below
    }
    setImportMessage('Clipboard unavailable -- select the text above and copy manually.');
  }

  async function handleImportJson() {
    try {
      const imported = await importSavedCombinations(jsonText);
      setSavedCombinations(imported);
      setImportMessage(`Imported ${Object.keys(imported).length} saved combination(s).`);
    } catch (err) {
      setImportMessage(err instanceof Error ? `Import failed: ${err.message}` : 'Import failed: invalid JSON.');
    }
  }

  const stageWidth = 460;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Relic Lab</Text>
        <Text style={styles.subtitle}>
          R&D compositing tool only -- no production Relic/reveal/scoring logic. /dev/relic-lab, dev-only.
        </Text>

        <View style={styles.mainRow}>
          <View style={styles.previewColumn}>
            <RelicLabComposer
              width={stageWidth}
              baseSource={baseEntry.source}
              baseTransform={resolvedBase}
              colorSource={colorEntry.source}
              colorTransform={resolvedColor}
              colorOpacity={resolvedColorOpacity}
              effectSource={effectEntry.source}
              effectTransform={resolvedEffect}
              effectOpacity={resolvedEffectOpacity}
              backgroundColor={BACKGROUND_COLOR[background]}
              checkerboard={background === 'checkerboard'}
            />

            <View style={styles.chipRow}>
              {BACKGROUND_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.key}
                  onPress={() => setBackground(opt.key)}
                  style={[styles.chip, background === opt.key && styles.chipActive]}>
                  <Text style={[styles.chipText, background === opt.key && styles.chipTextActive]}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.combinationCard}>
              <View style={styles.combinationHeaderRow}>
                <Text style={styles.combinationTitle}>Current combination</Text>
                {saveStatus === 'saved' ? (
                  <Text style={styles.statusSaved}>Saved ✓</Text>
                ) : (
                  <Text style={styles.statusUnsaved}>Unsaved changes</Text>
                )}
              </View>
              {savedCalibrationAvailable && <Text style={styles.statusAvailable}>Saved calibration available -- Load Saved Calibration to apply it.</Text>}
              <Text style={styles.combinationLine}>
                Relic: {baseEntry.objectLabel} ({baseEntry.traitLabel})
              </Text>
              <Text style={styles.combinationLine}>Color: {colorEntry.label}</Text>
              <Text style={styles.combinationLine}>Effect: {effectEntry.label}</Text>
              {baseEntry.filenameMismatch && <Text style={styles.mismatchNote}>⚠ {baseEntry.filenameMismatch}</Text>}
            </View>

            <View style={styles.buttonRow}>
              <PrimaryButton label="Save Calibration" onPress={() => void handleSaveCalibration()} />
              <SecondaryButton label="Load Saved Calibration" onPress={handleLoadSavedCalibration} />
              <SecondaryButton label="Clear Saved Calibration" onPress={() => void handleClearSavedCalibration()} />
            </View>
            {loadMessage && <Text style={styles.loadMessage}>{loadMessage}</Text>}

            <View style={styles.buttonRow}>
              <PrimaryButton label="Randomize" onPress={handleRandomize} />
              <SecondaryButton label="Reset calibration" onPress={handleResetCalibration} />
              <SecondaryButton label="Reset everything" onPress={handleResetEverything} />
            </View>

            <View style={styles.savedListCard}>
              <View style={styles.combinationHeaderRow}>
                <Text style={styles.combinationTitle}>Saved combinations ({savedCombinationEntries.length})</Text>
                <Pressable onPress={handleOpenJsonPanel}>
                  <Text style={styles.jsonLink}>Export / Import JSON</Text>
                </Pressable>
              </View>
              {savedCombinationEntries.length === 0 && <Text style={styles.savedListEmpty}>Nothing saved yet.</Text>}
              {savedCombinationEntries.map(([key, entry]) => {
                const r = relicTraitByKey(entry.relic);
                const c = colorFamilyByKey(entry.color);
                const e = effectByKey(entry.effect);
                return (
                  <Pressable key={key} onPress={() => applySavedEntry(entry)} style={styles.savedListRow}>
                    <Text style={styles.savedListRowText}>
                      {r.objectLabel} + {c.label} + {e.label}
                    </Text>
                    <Text style={styles.savedListRowLoad}>Select + load →</Text>
                  </Pressable>
                );
              })}

              {showJsonPanel && (
                <View style={styles.jsonPanel}>
                  <TextInput
                    style={styles.jsonTextArea}
                    value={jsonText}
                    onChangeText={setJsonText}
                    multiline
                    numberOfLines={10}
                  />
                  <View style={styles.buttonRow}>
                    <SecondaryButton label="Copy JSON" onPress={() => void handleCopyJson()} />
                    <SecondaryButton label="Import from above" onPress={() => void handleImportJson()} />
                    <SecondaryButton label="Refresh from saved" onPress={handleOpenJsonPanel} />
                    <SecondaryButton label="Close" onPress={() => setShowJsonPanel(false)} />
                  </View>
                  {importMessage && <Text style={styles.loadMessage}>{importMessage}</Text>}
                </View>
              )}
            </View>
          </View>

          <View style={styles.controlsColumn}>
            <LayerControls
              title="BASE RELIC"
              layer="base"
              selectedLayer={selectedLayer}
              onSelectLayer={() => setSelectedLayer('base')}
              assetChips={RELIC_TRAITS.map((t) => ({ key: t.key, label: `${t.objectLabel} — ${t.traitLabel}` }))}
              selectedAssetKey={baseKey}
              onSelectAsset={(key) => setBaseKey(key as RelicTraitKey)}
              transform={calibrationMode === 'layerDefault' ? layerDefaults.base : resolvedBase}
              opacity={null}
              onChangeTransform={(patch) =>
                calibrationMode === 'layerDefault' ? updateLayerDefault('base', patch) : updateCorrectionFromAbsolute('base', patch)
              }
              hasCorrection={hasCorrection.base}
              onClearCorrection={() => clearCorrection('base')}
            />

            <LayerControls
              title="COLOR"
              layer="color"
              selectedLayer={selectedLayer}
              onSelectLayer={() => setSelectedLayer('color')}
              assetChips={COLOR_FAMILIES.map((c) => ({ key: c.key, label: c.label }))}
              selectedAssetKey={colorKey}
              onSelectAsset={(key) => setColorKey(key as ColorFamilyKey)}
              transform={calibrationMode === 'layerDefault' ? layerDefaults.color : resolvedColor}
              opacity={calibrationMode === 'layerDefault' ? layerDefaults.color.opacity : resolvedColorOpacity}
              onChangeTransform={(patch) =>
                calibrationMode === 'layerDefault' ? updateLayerDefault('color', patch) : updateCorrectionFromAbsolute('color', patch)
              }
              hasCorrection={hasCorrection.color}
              onClearCorrection={() => clearCorrection('color')}
            />

            <LayerControls
              title="EFFECT"
              layer="effect"
              selectedLayer={selectedLayer}
              onSelectLayer={() => setSelectedLayer('effect')}
              assetChips={EFFECTS.map((e) => ({ key: e.key, label: e.label }))}
              selectedAssetKey={effectKey}
              onSelectAsset={(key) => setEffectKey(key as EffectKey)}
              transform={calibrationMode === 'layerDefault' ? layerDefaults.effect : resolvedEffect}
              opacity={calibrationMode === 'layerDefault' ? layerDefaults.effect.opacity : resolvedEffectOpacity}
              onChangeTransform={(patch) =>
                calibrationMode === 'layerDefault' ? updateLayerDefault('effect', patch) : updateCorrectionFromAbsolute('effect', patch)
              }
              hasCorrection={hasCorrection.effect}
              onClearCorrection={() => clearCorrection('effect')}
            />

            <View style={styles.modeRow}>
              <Text style={styles.modeLabel}>Editing:</Text>
              <Pressable
                onPress={() => setCalibrationMode('layerDefault')}
                style={[styles.modeChip, calibrationMode === 'layerDefault' && styles.chipActive]}>
                <Text style={[styles.chipText, calibrationMode === 'layerDefault' && styles.chipTextActive]}>Layer default (shared)</Text>
              </Pressable>
              <Pressable
                onPress={() => setCalibrationMode('assetOnly')}
                style={[styles.modeChip, calibrationMode === 'assetOnly' && styles.chipActive]}>
                <Text style={[styles.chipText, calibrationMode === 'assetOnly' && styles.chipTextActive]}>
                  This asset only ({selectedLayer})
                </Text>
              </Pressable>
            </View>
            <Text style={styles.modeHint}>
              Layer default applies to every asset in that layer. "This asset only" adds a correction on top, for the one
              currently selected -- use it when one specific Relic/color/effect needs its own nudge.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function LayerControls({
  title,
  layer,
  selectedLayer,
  onSelectLayer,
  assetChips,
  selectedAssetKey,
  onSelectAsset,
  transform,
  opacity,
  onChangeTransform,
  hasCorrection,
  onClearCorrection,
}: {
  title: string;
  layer: LayerKind;
  selectedLayer: LayerKind;
  onSelectLayer: () => void;
  assetChips: { key: string; label: string }[];
  selectedAssetKey: string;
  onSelectAsset: (key: string) => void;
  transform: RelicLabTransform;
  opacity: number | null;
  onChangeTransform: (patch: Partial<RelicLabTransform & { opacity: number }>) => void;
  hasCorrection: boolean;
  onClearCorrection: () => void;
}) {
  const isSelected = selectedLayer === layer;
  return (
    <Pressable onPress={onSelectLayer} style={[styles.layerCard, isSelected && styles.layerCardActive]}>
      <View style={styles.layerHeaderRow}>
        <Text style={styles.layerTitle}>{title}</Text>
        {hasCorrection && <Text style={styles.correctionBadge}>● needs correction set</Text>}
      </View>

      <View style={styles.chipRow}>
        {assetChips.map((chip) => (
          <Pressable
            key={chip.key}
            onPress={() => onSelectAsset(chip.key)}
            style={[styles.chip, selectedAssetKey === chip.key && styles.chipActive]}>
            <Text style={[styles.chipText, selectedAssetKey === chip.key && styles.chipTextActive]}>{chip.label}</Text>
          </Pressable>
        ))}
      </View>

      {opacity !== null && (
        <LabeledSlider label="Opacity" value={opacity} min={OPACITY_RANGE.min} max={OPACITY_RANGE.max} step={OPACITY_RANGE.step} onChange={(v) => onChangeTransform({ opacity: v })} />
      )}
      <LabeledSlider label="X" value={transform.x} min={TRANSFORM_RANGES.x.min} max={TRANSFORM_RANGES.x.max} step={TRANSFORM_RANGES.x.step} onChange={(v) => onChangeTransform({ x: v })} />
      <LabeledSlider label="Y" value={transform.y} min={TRANSFORM_RANGES.y.min} max={TRANSFORM_RANGES.y.max} step={TRANSFORM_RANGES.y.step} onChange={(v) => onChangeTransform({ y: v })} />
      <LabeledSlider label="Scale" value={transform.scale} min={TRANSFORM_RANGES.scale.min} max={TRANSFORM_RANGES.scale.max} step={TRANSFORM_RANGES.scale.step} onChange={(v) => onChangeTransform({ scale: v })} />
      <LabeledSlider label="Rotation" value={transform.rotation} min={TRANSFORM_RANGES.rotation.min} max={TRANSFORM_RANGES.rotation.max} step={TRANSFORM_RANGES.rotation.step} onChange={(v) => onChangeTransform({ rotation: v })} />

      {hasCorrection && (
        <Pressable onPress={onClearCorrection} style={styles.clearCorrectionLink}>
          <Text style={styles.clearCorrectionText}>Clear this asset's correction</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.primaryButton}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.secondaryButton}>
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAF6F0' },
  content: { padding: 20, gap: 16, paddingBottom: 80 },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 12, color: '#5D5571' },
  mainRow: { flexDirection: 'row', gap: 24, flexWrap: 'wrap' },
  previewColumn: { gap: 12, width: 480 },
  controlsColumn: { gap: 12, flex: 1, minWidth: 360 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1, borderColor: '#00000022', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#FFFFFF' },
  chipActive: { backgroundColor: '#24011F', borderColor: '#24011F' },
  chipText: { fontSize: 12, color: '#17151D', fontWeight: '600' },
  chipTextActive: { color: '#FFF9F5' },

  combinationCard: { borderWidth: 1, borderColor: '#00000022', borderRadius: 12, padding: 12, backgroundColor: '#FFFFFF', gap: 2 },
  combinationHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  combinationTitle: { fontSize: 12, fontWeight: '800' },
  combinationLine: { fontSize: 13, color: '#17151D' },
  mismatchNote: { fontSize: 12, color: '#B23B3B', marginTop: 6, fontWeight: '700' },

  statusSaved: { fontSize: 11, fontWeight: '800', color: '#1E8E5A' },
  statusAvailable: { fontSize: 11, fontWeight: '800', color: '#C17A1E' },
  statusUnsaved: { fontSize: 11, fontWeight: '700', color: '#5D5571' },
  loadMessage: { fontSize: 12, color: '#5D5571', fontStyle: 'italic' },

  savedListCard: { borderWidth: 1, borderColor: '#00000022', borderRadius: 12, padding: 12, backgroundColor: '#FFFFFF', gap: 8 },
  savedListEmpty: { fontSize: 12, color: '#5D5571' },
  savedListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#00000014',
  },
  savedListRowText: { fontSize: 13, color: '#17151D', fontWeight: '600', flexShrink: 1 },
  savedListRowLoad: { fontSize: 12, color: '#7964E8', fontWeight: '700' },
  jsonLink: { fontSize: 12, color: '#7964E8', fontWeight: '700' },
  jsonPanel: { gap: 8, marginTop: 4, borderTopWidth: 1, borderTopColor: '#00000014', paddingTop: 8 },
  jsonTextArea: {
    borderWidth: 1,
    borderColor: '#00000033',
    borderRadius: 8,
    padding: 8,
    fontSize: 11,
    fontFamily: 'monospace',
    minHeight: 160,
    textAlignVertical: 'top',
  },

  buttonRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  primaryButton: { backgroundColor: '#E61E5A', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10 },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  secondaryButton: { borderWidth: 1, borderColor: '#00000033', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10 },
  secondaryButtonText: { color: '#17151D', fontWeight: '700', fontSize: 13 },

  layerCard: { borderWidth: 1, borderColor: '#00000022', borderRadius: 12, padding: 12, backgroundColor: '#FFFFFF', gap: 8 },
  layerCardActive: { borderColor: '#E61E5A' },
  layerHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  layerTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 0.6 },
  correctionBadge: { fontSize: 11, fontWeight: '700', color: '#C17A1E' },
  clearCorrectionLink: { marginTop: 2 },
  clearCorrectionText: { fontSize: 12, color: '#7964E8', fontWeight: '700' },

  modeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  modeLabel: { fontSize: 12, fontWeight: '700' },
  modeChip: { borderWidth: 1, borderColor: '#00000022', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#FFFFFF' },
  modeHint: { fontSize: 11, color: '#5D5571', lineHeight: 15 },
});
