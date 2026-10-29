import type { ReactNode } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Fonts, Spacing } from '@/constants/theme';

// The immersive Read reveal — replaces the old inline expand/collapse Room with a near-
// full-screen modal: The Read as the visual centerpiece, a real Creature/Relic connection
// (never fabricated — callers pass the real connection state via `stage`/`connectText`), then
// See the Room with real percentages (via the already-correct RoomDistribution/loading/error
// JSX callers already build — this component never fetches or computes room data itself, it
// only presents what's handed to it). Reopenable any time from Today's compact completed card
// — this component holds no answer/commit state of its own, so opening/closing it can never
// duplicate evidence or touch persistence.
export type ReadModalProps = {
  visible: boolean;
  onClose: () => void;
  variant: 'free' | 'private';
  readText: string;
  percentLine?: string | null;
  connectText: string;
  stage: ReactNode;
  roomTitle: string;
  room: ReactNode;
  ctaLabel: string;
  onCta: () => void;
};

export function ReadModal({
  visible,
  onClose,
  variant,
  readText,
  percentLine,
  connectText,
  stage,
  roomTitle,
  room,
  ctaLabel,
  onCta,
}: ReadModalProps) {
  const isPrivate = variant === 'private';

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Dismiss" accessibilityRole="button" />
        <View style={styles.sheet}>
          <Pressable onPress={onClose} hitSlop={10} style={styles.closeButton} accessibilityRole="button" accessibilityLabel="Close">
            <ThemedText style={styles.closeIcon}>✕</ThemedText>
          </Pressable>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces>
            <View style={styles.handle} />
            <ThemedText style={[styles.eyebrow, isPrivate && styles.eyebrowPrivate]}>
              {isPrivate ? 'The Read · Private' : 'The Read'}
            </ThemedText>

            <View style={styles.stage}>{stage}</View>

            <ThemedText style={styles.quote}>&ldquo;{readText}&rdquo;</ThemedText>

            {percentLine ? <ThemedText style={styles.percentLine}>{percentLine}</ThemedText> : null}

            <ThemedText style={styles.connect}>{connectText}</ThemedText>

            <View style={styles.divider} />

            <ThemedText style={[styles.roomTitle, isPrivate && styles.roomTitlePrivate]}>{roomTitle}</ThemedText>
            {room}

            <Pressable
              onPress={onCta}
              style={({ pressed }) => [styles.cta, isPrivate && styles.ctaPrivate, pressed && styles.pressed]}
              accessibilityRole="button">
              <ThemedText style={styles.ctaText}>{ctaLabel}</ThemedText>
            </Pressable>
            <Pressable onPress={onClose} style={styles.backLink} accessibilityRole="button">
              <ThemedText style={styles.backLinkText}>← Back to Today</ThemedText>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5,3,10,0.6)',
    justifyContent: 'flex-end',
    ...Platform.select({ web: { alignItems: 'center' }, default: {} }),
  },
  sheet: {
    width: '100%',
    maxWidth: 480,
    height: '92%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#1C0F30',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 5,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    color: Brand.cream,
    fontSize: 13,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.five,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.six,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: Spacing.four,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 3,
    color: Brand.gold,
    textTransform: 'uppercase',
    fontWeight: '800',
    textAlign: 'center',
  },
  eyebrowPrivate: {
    color: '#FF9ED6',
  },
  stage: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
    marginVertical: Spacing.three,
  },
  quote: {
    fontFamily: Fonts?.serif,
    fontStyle: 'italic',
    fontWeight: '600',
    fontSize: 22,
    lineHeight: 29,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: Spacing.two,
  },
  percentLine: {
    fontSize: 13,
    color: 'rgba(255,249,245,0.75)',
    textAlign: 'center',
    marginBottom: Spacing.three,
  },
  connect: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#D8C9FF',
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 300,
    alignSelf: 'center',
    marginBottom: Spacing.four,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: Spacing.four,
  },
  roomTitle: {
    fontSize: 9.5,
    letterSpacing: 2.6,
    color: Brand.gold,
    textTransform: 'uppercase',
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: Spacing.three,
  },
  roomTitlePrivate: {
    color: '#FF9ED6',
  },
  cta: {
    alignSelf: 'center',
    marginTop: Spacing.four,
    backgroundColor: Brand.gold,
    borderRadius: 999,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.six,
  },
  ctaPrivate: {
    backgroundColor: Brand.coral,
  },
  ctaText: {
    color: Brand.plum,
    fontSize: 14,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.85,
  },
  backLink: {
    alignSelf: 'center',
    marginTop: Spacing.three,
  },
  backLinkText: {
    color: 'rgba(255,249,245,0.5)',
    fontSize: 12,
    fontWeight: '700',
  },
});
