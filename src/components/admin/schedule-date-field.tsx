import type { StyleProp, TextStyle } from 'react-native';
import { TextInput } from 'react-native';

// Native/default fallback — used on iOS/Android where there is no HTML date input to defer
// to. Preserves the original typed-YYYY-MM-DD behavior exactly (draft-on-keystroke,
// commit-on-blur, via the parent's onCommit). See schedule-date-field.web.tsx for the real
// calendar picker used on web Admin, which is where Michelle actually works today.
export type ScheduleDateFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  onCommit: (value: string) => void;
  style?: StyleProp<TextStyle>;
};

export function ScheduleDateField({ value, onChangeText, onCommit, style }: ScheduleDateFieldProps) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      onBlur={() => onCommit(value)}
      placeholder="YYYY-MM-DD"
      style={style}
    />
  );
}
