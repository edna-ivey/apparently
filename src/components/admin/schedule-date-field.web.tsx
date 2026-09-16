import type { CSSProperties } from 'react';

import type { ScheduleDateFieldProps } from './schedule-date-field';

// Web Admin's real calendar/date picker — a genuine HTML `<input type="date">`, which is
// what actually makes Safari/iPhone and desktop browsers open their native date chooser UI
// (a plain RN TextInput can never do this; there's no React Native equivalent that renders a
// real OS/browser date picker without a large third-party dependency, which the task
// explicitly asked to avoid for one field). The browser's own calendar icon inside the input
// is the "tap to open a picker" affordance — no separate icon needed.
//
// `value`/onChangeText stay a plain YYYY-MM-DD string throughout, matching exactly what
// scheduleDaily() (src/services/admin-daily-service.ts) already expects — this component
// never introduces a second date representation. Unlike the native TextInput fallback, a
// native date input's onChange already represents a deliberate, complete selection (there is
// no "still typing" intermediate state the way free-text entry has), so this commits
// immediately on change rather than waiting for blur — matching the "no extra Save button"
// requirement.
export function ScheduleDateField({ value, onChangeText, onCommit }: ScheduleDateFieldProps) {
  return (
    <input
      type="date"
      value={value}
      onChange={(event) => {
        const next = event.target.value;
        onChangeText(next);
        onCommit(next);
      }}
      style={webDateInputStyle}
    />
  );
}

const webDateInputStyle: CSSProperties = {
  color: '#17151D',
  backgroundColor: '#F6F2FF',
  borderRadius: 10,
  border: '1px solid #E8E2FF',
  paddingLeft: 12,
  paddingRight: 12,
  paddingTop: 8,
  paddingBottom: 8,
  fontSize: 13,
  fontWeight: 600,
  fontFamily: 'inherit',
  colorScheme: 'light',
  cursor: 'pointer',
};
