import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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

// A per-asset correction is stored sparse (Partial<RelicLabTransform>) -- fills any missing
// field with identity so the slider controls always receive a complete transform to display.
function fillTransform(partial: Partial<RelicLabTransform> | undefined): RelicLabTransform {
  return { x: partial?.x ?? 0, y: partial?.y ?? 0, scale: partial?.scale ?? 1, rotation: partial?.rotation ?? 0 };
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
              <Text style={styles.combinationTitle}>Current combination</Text>
              <Text style={styles.combinationLine}>
                Relic: {baseEntry.objectLabel} ({baseEntry.traitLabel})
              </Text>
              <Text style={styles.combinationLine}>Color: {colorEntry.label}</Text>
              <Text style={styles.combinationLine}>Effect: {effectEntry.label}</Text>
              {baseEntry.filenameMismatch && <Text style={styles.mismatchNote}>⚠ {baseEntry.filenameMismatch}</Text>}
            </View>

            <View style={styles.buttonRow}>
              <PrimaryButton label="Randomize" onPress={handleRandomize} />
              <SecondaryButton label="Reset calibration" onPress={handleResetCalibration} />
              <SecondaryButton label="Reset everything" onPress={handleResetEverything} />
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
              transform={calibrationMode === 'layerDefault' ? layerDefaults.base : fillTransform(baseCorrection)}
              opacity={null}
              onChangeTransform={(patch) =>
                calibrationMode === 'layerDefault' ? updateLayerDefault('base', patch) : updateCorrection('base', patch)
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
              transform={calibrationMode === 'layerDefault' ? layerDefaults.color : fillTransform(colorCorrection)}
              opacity={calibrationMode === 'layerDefault' ? layerDefaults.color.opacity : colorCorrection?.opacity ?? layerDefaults.color.opacity}
              onChangeTransform={(patch) =>
                calibrationMode === 'layerDefault' ? updateLayerDefault('color', patch) : updateCorrection('color', patch)
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
              transform={calibrationMode === 'layerDefault' ? layerDefaults.effect : fillTransform(effectCorrection)}
              opacity={calibrationMode === 'layerDefault' ? layerDefaults.effect.opacity : effectCorrection?.opacity ?? layerDefaults.effect.opacity}
              onChangeTransform={(patch) =>
                calibrationMode === 'layerDefault' ? updateLayerDefault('effect', patch) : updateCorrection('effect', patch)
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
  combinationTitle: { fontSize: 12, fontWeight: '800', marginBottom: 4 },
  combinationLine: { fontSize: 13, color: '#17151D' },
  mismatchNote: { fontSize: 12, color: '#B23B3B', marginTop: 6, fontWeight: '700' },

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
