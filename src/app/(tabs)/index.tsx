import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, BottomTabInset, Spacing } from '@/constants/theme';
import { commitDailyAnswer, hydrateDailyAnswers, useCommittedDailyAnswer } from '@/data/daily-answer';
import { initialQuestions, useDailyQuestions, type DailyQuestion } from '@/data/daily-questions';
import { useResponsiveContentWidth, useResponsiveTopInset } from '@/hooks/use-responsive-content-width';
import {
  getDemoPersonalityAnswers,
  getDemoPersonalityProfile,
  getConsensusLanguage,
  getEffectLabel,
  getPersonalitySignalCopy,
  scorePersonalityProfile,
} from '@/data/personality';

const fallbackQuestion: DailyQuestion = initialQuestions.find((item) => item.id === 5) ?? initialQuestions[0];

export default function HomeScreen() {
  const contentWidth = useResponsiveContentWidth();
  const topInset = useResponsiveTopInset();
  const questions = useDailyQuestions();
  const liveQuestion = questions.find((question) => question.status === 'Live') ?? null;
  const question = liveQuestion ?? fallbackQuestion;
  const committedAnswer = useCommittedDailyAnswer(question.id);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answeredCount, setAnsweredCount] = useState(43);
  const [worldExpanded, setWorldExpanded] = useState(false);
  const answered = selectedOption !== null;
  const selectedChoice = question.options[selectedOption ?? 0] ?? question.options[0];
  const selectedTraitLine = (selectedChoice.personalityEffects ?? []).map(getEffectLabel).join(' · ');
  const baselineProfile = useMemo(() => getDemoPersonalityProfile(43), []);
  const selectedProfile = useMemo(() => {
    if (!answered || !selectedChoice.personalityEffects) {
      return baselineProfile;
    }

    return scorePersonalityProfile([
      ...getDemoPersonalityAnswers(43),
      {
        question: question.prompt,
        category: question.category,
        chosenAnswer: selectedChoice.label,
        effects: selectedChoice.personalityEffects,
      },
    ]);
  }, [answered, baselineProfile, question.category, question.prompt, selectedChoice.label, selectedChoice.personalityEffects]);
  const selectedSignal = useMemo(() => {
    const effects = selectedChoice.personalityEffects ?? [];
    const effect = effects[0];
    return effect
      ? selectedProfile.dimensions.find((dimension) => dimension.dimension === effect.dimension) ?? null
      : null;
  }, [selectedChoice.personalityEffects, selectedProfile]);
  const consensus = answered
    ? getConsensusLanguage(question.options, selectedOption ?? 0)
    : null;
  const signalCopy = selectedSignal
    ? getPersonalitySignalCopy(selectedSignal.displayName, selectedSignal.evidenceCount)
    : 'Apparently is taking notes.';
  const remainingToReveal = Math.max(0, 50 - answeredCount);

  useEffect(() => {
    void hydrateDailyAnswers();
  }, []);

  // committedAnswer is already scoped to THIS question's id (useCommittedDailyAnswer
  // looks it up by key), so a non-null value here restores the original selection
  // (reopening the Daily preserves it) and a null value starts fresh — it can never leak
  // in a stale answer that actually belongs to a different, previously-answered question.
  // This is also what makes a Daily answer immutable: once committedAnswer is non-null,
  // selectedOption is always non-null for this question, so selectOption below never gets
  // a chance to accept a second choice.
  useEffect(() => {
    setSelectedOption(committedAnswer);
    setAnsweredCount(43);
    setWorldExpanded(false);
  }, [liveQuestion?.id, question.id, committedAnswer]);

  const selectOption = (index: number) => {
    // A submitted Daily answer is final — the reveal it produces (world percentages,
    // personality signal, rarity language) must reflect the user's instinctive first
    // choice, not something they changed after seeing the reveal. commitDailyAnswer
    // itself also refuses a second commit for the same question, so this holds even if
    // some future screen calls selectOption without going through this guard.
    if (selectedOption !== null) {
      return;
    }
    if (!commitDailyAnswer(question.id, index)) {
      return;
    }
    setSelectedOption(index);
    setAnsweredCount((count) => count + 1);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={[styles.safeArea, contentWidth ? { maxWidth: contentWidth } : null]}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: topInset }]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.intro}>
            <View style={styles.metaRow}>
              <ThemedText style={styles.eyebrow}>TODAY'S QUESTION</ThemedText>
              <View style={styles.streak}>
                <ThemedText style={styles.fire}>✦</ThemedText>
                <ThemedText style={styles.streakText}>7</ThemedText>
              </View>
            </View>
            <ThemedText type="title" style={styles.heading}>
              Let&apos;s see what that says about you.
            </ThemedText>
          </View>

          <View style={styles.questionCard}>
            <ThemedText style={styles.prompt}>{question.prompt}</ThemedText>
            <View style={styles.options}>
              {question.options.map((option, index) => {
                const isSelected = selectedOption === index;
                // Once answered, a Daily choice is final: unselected options become
                // inert (not just visually muted) so the committed answer can never be
                // swapped out after the reveal has been seen.
                const isLocked = answered && !isSelected;
                return (
                  <Pressable
                    key={option.label}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected, disabled: isLocked }}
                    disabled={isLocked}
                    onPress={() => selectOption(index)}
                    style={({ pressed }) => [
                      styles.option,
                      isSelected && styles.optionSelected,
                      isLocked && styles.optionLocked,
                      pressed && styles.pressed,
                    ]}>
                    <View style={[styles.optionNumber, isSelected && styles.optionNumberSelected]}>
                      <ThemedText style={[styles.numberText, isSelected && styles.selectedText]}>
                        {String.fromCharCode(65 + index)}
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.optionText, isSelected && styles.selectedText]}>
                      {option.label}
                    </ThemedText>
                    {isSelected && <ThemedText style={styles.check}>✓</ThemedText>}
                  </Pressable>
                );
              })}
            </View>
            {!answered && (
              <ThemedText style={styles.microcopy} themeColor="textSecondary">
                Answer to unlock the world.
              </ThemedText>
            )}
          </View>

          {answered && (
            <View style={styles.revealCard}>
              <ThemedText style={styles.revealEyebrow}>APPARENTLY...</ThemedText>
              <ThemedText style={styles.observation}>
                {selectedChoice.apparentlyFeedback ?? 'Apparently, you gave us something to think about.'}
              </ThemedText>

              <ThemedText style={styles.revealPercentLine}>
                {selectedChoice.percent}% agreed with you.
                {consensus ? ` ${consensus.label.charAt(0).toUpperCase()}${consensus.label.slice(1)}.` : ''}
              </ThemedText>

              {selectedTraitLine.length > 0 && (
                <View style={styles.signalLine}>
                  <ThemedText style={styles.signalChips}>{selectedTraitLine}</ThemedText>
                  <ThemedText style={styles.signalCopy}>{signalCopy}</ThemedText>
                </View>
              )}

              <Pressable style={styles.worldToggle} onPress={() => setWorldExpanded((value) => !value)}>
                <ThemedText style={styles.worldToggleText}>
                  {worldExpanded ? 'Hide how everyone voted ↑' : 'See how everyone voted ↓'}
                </ThemedText>
              </Pressable>

              {worldExpanded && (
                <View style={styles.worldDistribution}>
                  {question.options.map((option, index) => {
                    const isSelected = index === selectedOption;
                    return (
                      <View
                        key={option.id}
                        style={[styles.distributionRow, isSelected && styles.distributionRowSelected]}>
                        <ThemedText
                          style={[styles.distributionLabel, isSelected && styles.distributionLabelSelected]}
                          numberOfLines={1}>
                          {String.fromCharCode(65 + index)}. {option.label}
                        </ThemedText>
                        <ThemedText
                          style={[styles.distributionPercent, isSelected && styles.distributionPercentSelected]}>
                          {option.percent}%
                        </ThemedText>
                      </View>
                    );
                  })}
                </View>
              )}

              <Pressable style={styles.worldButton} onPress={() => {}}>
                <ThemedText style={styles.worldButtonText}>One more? 👀</ThemedText>
              </Pressable>
            </View>
          )}

          <View style={styles.statsRow}>
            <View style={styles.statBlock}>
              <ThemedText style={styles.statValue}>37%</ThemedText>
              <ThemedText style={styles.statLabel}>commonality</ThemedText>
            </View>
            <View style={styles.statBlock}>
              <ThemedText style={styles.statValue}>{answeredCount}</ThemedText>
              <ThemedText style={styles.statLabel}>your answers</ThemedText>
            </View>
            <View style={styles.statBlock}>
              <ThemedText style={styles.statValue}>06</ThemedText>
              <ThemedText style={styles.statLabel}>rare picks</ThemedText>
            </View>
          </View>

          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <View>
                <ThemedText style={styles.eyebrow}>YOUR 7, APPARENTLY</ThemedText>
                <ThemedText style={styles.progressTitle}>
                  {remainingToReveal > 0 ? `${remainingToReveal} more answers until Your 7.` : 'Your 7 is live.'}
                </ThemedText>
              </View>
              <ThemedText style={styles.progressCount}>{answeredCount} / 50</ThemedText>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(100, (answeredCount / 50) * 100)}%` }]} />
            </View>
            <ThemedText style={styles.progressCopy}>Your answers are becoming a pattern.</ThemedText>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Slightly deeper than the app's own cream so the app column reads as a deliberate
    // object sitting on a page, instead of blending edge-to-edge on wide web viewports.
    // Invisible on native, where safeArea always fills the container exactly.
    backgroundColor: '#F0E8DD',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#FFF9F5',
    ...Platform.select({
      web: {
        marginVertical: 28,
        borderRadius: 28,
        boxShadow: '0 24px 64px rgba(23, 21, 29, 0.10)',
        overflow: 'hidden',
      },
      default: {},
    }),
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.five,
    gap: Spacing.four,
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: '#FFF0D2',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: 99,
  },
  fire: {
    color: Brand.gold,
    fontSize: 18,
  },
  streakText: {
    color: '#9B6812',
    fontSize: 14,
    fontWeight: '800',
  },
  intro: {
    gap: Spacing.two,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  eyebrow: {
    color: Brand.pink,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  heading: {
    color: Brand.ink,
    fontSize: 37,
    lineHeight: 41,
    fontWeight: '800',
    letterSpacing: -1.2,
    maxWidth: 460,
  },
  questionCard: {
    backgroundColor: Brand.violet,
    borderRadius: 28,
    padding: Spacing.four,
    gap: Spacing.three,
    shadowColor: Brand.violet,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  prompt: {
    color: '#FFFFFF',
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  options: {
    gap: Spacing.two,
  },
  option: {
    minHeight: 58,
    borderRadius: 16,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    backgroundColor: 'rgba(255,255,255,0.16)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  optionSelected: {
    backgroundColor: '#FFFFFF',
  },
  optionLocked: {
    opacity: 0.45,
  },
  optionNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  optionNumberSelected: {
    backgroundColor: Brand.pink,
  },
  numberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  optionText: {
    color: '#FFFFFF',
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '700',
  },
  selectedText: {
    color: '#17151D',
  },
  check: {
    color: Brand.pink,
    fontSize: 20,
    fontWeight: '800',
  },
  microcopy: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.82,
  },
  // The reveal is one card, hero-first: the Apparently response is the payoff, everything
  // else (percentage, personality nudge, full breakdown) is deliberately smaller/secondary
  // so it doesn't compete with it — see Part 2 of the visual QA correction.
  revealCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F0E6E8',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  revealEyebrow: {
    color: Brand.pink,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  observation: {
    color: Brand.ink,
    fontSize: 20,
    lineHeight: 27,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  revealPercentLine: {
    color: Brand.inkSecondary,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  signalLine: {
    marginTop: Spacing.one,
    gap: 2,
  },
  signalChips: {
    color: Brand.violet,
    fontSize: 14,
    fontWeight: '800',
  },
  signalCopy: {
    color: Brand.inkSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  worldToggle: {
    alignSelf: 'flex-start',
    marginTop: Spacing.one,
  },
  worldToggleText: {
    color: Brand.violet,
    fontSize: 13,
    fontWeight: '800',
  },
  worldDistribution: {
    gap: 6,
    marginTop: Spacing.one,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: Spacing.two,
  },
  distributionRowSelected: {
    backgroundColor: '#F7F3FF',
  },
  distributionLabel: {
    flex: 1,
    color: Brand.inkSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  distributionLabelSelected: {
    color: Brand.violet,
    fontWeight: '800',
  },
  distributionPercent: {
    color: Brand.inkSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  distributionPercentSelected: {
    color: Brand.pink,
    fontWeight: '800',
  },
  worldButton: {
    backgroundColor: Brand.pink,
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    marginTop: Spacing.one,
  },
  worldButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.one,
  },
  statBlock: {
    gap: Spacing.one,
  },
  statValue: {
    color: Brand.ink,
    fontSize: 25,
    lineHeight: 29,
    fontWeight: '800',
  },
  statLabel: {
    color: Brand.inkSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  progressCard: {
    backgroundColor: '#FFE5EF',
    borderRadius: 24,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  progressTitle: {
    color: Brand.ink,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    marginTop: Spacing.one,
  },
  progressCount: {
    color: Brand.pink,
    fontSize: 15,
    fontWeight: '800',
  },
  progressTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  progressFill: {
    width: '86%',
    height: '100%',
    borderRadius: 5,
    backgroundColor: Brand.pink,
  },
  progressCopy: {
    color: Brand.inkSecondary,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
});
