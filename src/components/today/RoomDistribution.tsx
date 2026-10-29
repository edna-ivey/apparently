import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { Type } from '@/constants/design-system';

// The shared "Room" visual — four real answer choices with their real recorded percentages
// (from DistributionState, see src/data/consumer-daily.ts / consumer-private-daily.ts), the
// current user's answer highlighted, and the real per-option apparentlyFeedback text as the
// witty line. Used by both Free and Private Daily's existing expand/collapse section in
// src/app/(tabs)/index.tsx — this component renders ALREADY-FETCHED real data; it never
// fetches, computes, or invents a percentage itself.
// Below this many real respondents, "Live tally" reads as more confident than a room this thin
// actually is -- an honest "early results" framing instead, still showing the exact real
// percentages (never hidden, never replaced), just not oversold as a settled consensus.
const SMALL_SAMPLE_THRESHOLD = 5;

export type RoomDistributionProps = {
  options: { label: string }[];
  percentages: number[];
  selectedIndex: number | null;
  feedbackText: string | null;
  totalAnswers: number | null;
  variant: 'free' | 'private';
};

export function RoomDistribution({ options, percentages, selectedIndex, feedbackText, totalAnswers, variant }: RoomDistributionProps) {
  const isPrivate = variant === 'private';
  const maxPercent = Math.max(1, ...percentages);
  const fillColor = isPrivate ? Brand.coral : Brand.violet;

  return (
    <View style={styles.container}>
      <View style={styles.bars}>
        {options.map((option, index) => {
          const percent = percentages[index] ?? 0;
          const isMe = index === selectedIndex;
          const width = Math.max(4, Math.round((percent / maxPercent) * 100));
          return (
            <View key={`${option.label}-${index}`} style={styles.row}>
              <View style={styles.rowTop}>
                <ThemedText
                  numberOfLines={1}
                  style={[styles.label, isMe && (isPrivate ? styles.labelMePrivate : styles.labelMeFree)]}>
                  {String.fromCharCode(65 + index)}. {option.label}
                </ThemedText>
                <ThemedText style={[styles.percent, isMe && (isPrivate ? styles.percentMePrivate : styles.percentMeFree)]}>
                  {percent}%
                </ThemedText>
              </View>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    { width: `${width}%`, backgroundColor: isMe ? (isPrivate ? Brand.coral : Brand.gold) : fillColor, opacity: isMe ? 1 : 0.45 },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>

      {feedbackText ? (
        <View style={[styles.wittyCard, isPrivate && styles.wittyCardPrivate]}>
          <ThemedText style={[styles.wittyLabel, isPrivate && styles.wittyLabelPrivate]}>
            {isPrivate ? 'APPARENTLY, PRIVATELY' : 'APPARENTLY'}
          </ThemedText>
          <ThemedText style={styles.wittyText}>{feedbackText}</ThemedText>
        </View>
      ) : null}

      <ThemedText style={styles.totalLine}>
        {/* totalAnswers is null ONLY for the local/offline-prototype fallback (see
            consumer-daily.ts) — a real population count never exists there, so this must never
            read as "live." Every other branch below is real, server-derived data.
            SMALL_SAMPLE_THRESHOLD (5): a real but still-thin room reads as "28%" with total
            confidence otherwise, which overstates a tally of e.g. 2-3 real answers. Naming the
            real count here is honest framing, not a new statistic -- totalAnswers is already
            real, already fetched, just never surfaced as a number before this. */}
        {totalAnswers === null
          ? 'Illustrative numbers — not a live tally.'
          : totalAnswers === 1
            ? "You're the first one in the room so far."
            : totalAnswers <= SMALL_SAMPLE_THRESHOLD
              ? `Early results — ${totalAnswers} real answer${totalAnswers === 1 ? '' : 's'} so far.`
              : isPrivate
                ? 'Private answers only — never mixed with Free Daily.'
                : "Live tally from today's real answers."}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.three,
    gap: Spacing.three,
  },
  bars: {
    gap: Spacing.three,
  },
  row: {
    gap: 6,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  label: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,249,245,0.72)',
  },
  labelMeFree: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  labelMePrivate: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  percent: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,249,245,0.6)',
  },
  percentMeFree: {
    color: Brand.gold,
    fontWeight: '800',
  },
  percentMePrivate: {
    color: Brand.coral,
    fontWeight: '800',
  },
  track: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
  wittyCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: 20,
    padding: Spacing.three,
  },
  wittyCardPrivate: {
    backgroundColor: 'rgba(255,121,95,0.1)',
    borderColor: 'rgba(255,121,95,0.3)',
  },
  wittyLabel: {
    ...Type.eyebrow,
    color: Brand.gold,
    marginBottom: 6,
  },
  wittyLabelPrivate: {
    color: '#FF9ED6',
  },
  wittyText: {
    ...Type.displaySmall,
    fontSize: 16,
    lineHeight: 22,
    color: '#FFFFFF',
    fontStyle: 'italic',
  },
  totalLine: {
    fontSize: 11.5,
    color: 'rgba(255,249,245,0.5)',
    textAlign: 'center',
  },
});
