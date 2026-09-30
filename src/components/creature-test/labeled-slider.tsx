import { useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, TextInput, View } from 'react-native';

// Minimal cross-platform slider (no @react-native-community/slider dependency -- not installed,
// and adding a native module just for this dev tool would need a rebuild). Pure PanResponder +
// View, works identically on web and native. Paired with a numeric text input for precise entry,
// per the brief's "sliders plus numeric inputs" ask.
export function LabeledSlider({
  label,
  value,
  min,
  max,
  step = 0.01,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (next: number) => void;
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const [textValue, setTextValue] = useState(String(round(value, step)));
  const trackWidthRef = useRef(0);

  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const quantize = (n: number) => round(clamp(n), step);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: (_evt, gesture) => {
          const width = trackWidthRef.current;
          if (width <= 0) return;
          const x = clampNumber(gesture.moveX, 0, width);
          updateFromRatio(x / width);
        },
        onPanResponderGrant: (evt) => {
          const width = trackWidthRef.current;
          if (width <= 0) return;
          // locationX is relative to the track itself on the initial touch.
          const x = clampNumber(evt.nativeEvent.locationX, 0, width);
          updateFromRatio(x / width);
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [min, max, step],
  );

  function updateFromRatio(ratio: number) {
    const next = quantize(min + ratio * (max - min));
    onChange(next);
    setTextValue(String(next));
  }

  const ratio = max > min ? (clamp(value) - min) / (max - min) : 0;

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={styles.track}
        onLayout={(e) => {
          trackWidthRef.current = e.nativeEvent.layout.width;
          setTrackWidth(e.nativeEvent.layout.width);
        }}
        {...panResponder.panHandlers}
      >
        <View style={styles.trackFill} />
        <View style={[styles.thumb, { left: Math.max(0, Math.min(trackWidth - 14, ratio * trackWidth - 7)) }]} />
      </View>
      <TextInput
        style={styles.input}
        value={textValue}
        onChangeText={setTextValue}
        onEndEditing={() => {
          const parsed = Number(textValue);
          const next = Number.isFinite(parsed) ? quantize(parsed) : value;
          onChange(next);
          setTextValue(String(next));
        }}
        keyboardType="numeric"
      />
    </View>
  );
}

function round(n: number, step: number): number {
  const decimals = Math.max(0, Math.ceil(-Math.log10(step || 1)));
  return Math.round(n / step) * step === 0 ? 0 : Number((Math.round(n / step) * step).toFixed(decimals));
}

function clampNumber(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 4 },
  label: { width: 64, fontSize: 12 },
  track: { flex: 1, height: 24, justifyContent: 'center' },
  trackFill: { height: 4, borderRadius: 2, backgroundColor: '#00000022' },
  thumb: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E61E5A',
    top: 5,
  },
  input: { width: 64, borderWidth: 1, borderColor: '#00000033', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, fontSize: 12 },
});
