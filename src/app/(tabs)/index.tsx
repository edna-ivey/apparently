import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandSignature } from '@/components/brand-signature';
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
  getEffectDisplayLabel,
  getPercentLanguage,
  getPersonalitySignalCopy,
  scorePersonalityProfile,
  stripApparentlyPrefix,
} from '@/data/personality';

const fallbackQuestion: DailyQuestion = initialQuestions.find((item) => item.id === 5) ?? initialQuestions[0];

export default function HomeScreen() {
  const router = useRouter();
  const contentWidth = useResponsiveContentWidth();
  const topInset = useResponsiveTopInset();
  const questions = useDailyQuestions();
  const liveQuestion = questions.find((question) => question.status === 'Live') ?? null;
  const question = liveQuestion ?? fallbackQuestion;
  const committedAnswer = useCommittedDailyAnswer(question.id);
  // committedAnswer (Daily answer history) is the single source of truth for whether this
  // Daily is final. draftOption is purely a local, pre-commit UI selection — it is never
  // itself written to storage, and it's irrelevant once isCommitted is true (displayedOption
  // reads from committedAnswer instead). This is what makes a Daily answer immutable: the
  // only path to persistence is confirmAnswer below, and commitDailyAnswer itself also
  // refuses a second commit for the same question.
  const [draftOption, setDraftOption] = useState<number | null>(null);
  const [answeredCount, setAnsweredCount] = useState(43);
  const [worldExpanded, setWorldExpanded] = useState(false);
  const isCommitted = committedAnswer !== null;
  const displayedOption = isCommitted ? committedAnswer : draftOption;
  const selectedChoice = question.options[displayedOption ?? 0] ?? question.options[0];
  // Trait names only, no "+2" weight — that mechanical detail stays in Review Studio
  // (getEffectLabel), which editors need; the consumer reveal only needs the name.
  const selectedTraitLine = (selectedChoice.personalityEffects ?? []).map(getEffectDisplayLabel).join(' · ');
  const baselineProfile = useMemo(() => getDemoPersonalityProfile(43), []);
  const selectedProfile = useMemo(() => {
    if (!isCommitted || !selectedChoice.personalityEffects) {
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
  }, [isCommitted, baselineProfile, question.category, question.prompt, selectedChoice.label, selectedChoice.personalityEffects]);
  const selectedSignal = useMemo(() => {
    const effects = selectedChoice.personalityEffects ?? [];
    const effect = effects[0];
    return effect
      ? selectedProfile.dimensions.find((dimension) => dimension.dimension === effect.dimension) ?? null
      : null;
  }, [selectedChoice.personalityEffects, selectedProfile]);
  const consensus = isCommitted ? getConsensusLanguage(question.options, displayedOption ?? 0) : null;
  const signalCopy = selectedSignal ? getPersonalitySignalCopy(selectedSignal.evidenceCount) : 'Still taking notes.';
  const remainingToReveal = Math.max(0, 50 - answeredCount);

  useEffect(() => {
    void hydrateDailyAnswers();
  }, []);

  // Resets local draft state whenever the active Daily changes — a fresh Daily always starts
  // with nothing selected. If this question already has a committed answer (from a prior
  // session, resolved once hydration completes), draftOption is simply never consulted:
  // isCommitted/displayedOption above read from committedAnswer instead.
  useEffect(() => {
    setDraftOption(null);
    setAnsweredCount(43);
    setWorldExpanded(false);
  }, [liveQuestion?.id, question.id]);

  // Pre-commit only: freely changes which option is highlighted. Never touches persistence
  // and never reveals anything — the user may tap a different option as many times as they
  // like before confirming. See confirmAnswer for the one place a Daily actually commits.
  const selectDraftOption = (index: number) => {
    if (isCommitted) {
      return;
    }
    setDraftOption(index);
  };

  // The ONLY place a Daily answer is written to history — triggered by the explicit "Lock
  // it in" CTA, never by selecting an option. Once commitDailyAnswer
  // succeeds, useCommittedDailyAnswer reactively flips isCommitted to true on the next
  // render and the reveal renders from committedAnswer from then on: there is no path back
  // to an editable draft for this question, on this device, ever again.
  const confirmAnswer = () => {
    if (isCommitted || draftOption === null) {
      return;
    }
    if (!commitDailyAnswer(question.id, draftOption)) {
      return;
    }
    setAnsweredCount((count) => count + 1);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={[styles.safeArea, contentWidth ? { maxWidth: contentWidth } : null]}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: topInset }]}
          showsVerticalScrollIndicator={false}>
          <BrandSignature variant="full" />
          <View style={styles.intro}>
            <View style={styles.metaRow}>
              <ThemedText style={styles.eyebrow}>TODAY'S DROP</ThemedText>
              <View style={styles.streak}>
                <ThemedText style={styles.fire}>✦</ThemedText>
                <ThemedText style={styles.streakText}>7</ThemedText>
              </View>
            </View>
            <ThemedText style={styles.introSupport}>One question. Choose carefully.</ThemedText>
          </View>

          <View style={styles.questionCard}>
            <ThemedText style={styles.prompt}>{question.prompt}</ThemedText>
            <View style={styles.options}>
              {question.options.map((option, index) => {
                const isSelected = displayedOption === index;
                // Once committed, a Daily choice is final: unselected options become
                // inert (not just visually muted) so the committed answer can never be
                // swapped out after the reveal has been seen. Before commit, nothing is
                // locked — any option can be re-tapped to change the draft selection.
                const isLocked = isCommitted && !isSelected;
                return (
                  <Pressable
                    key={option.label}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected, disabled: isLocked }}
                    disabled={isLocked}
                    onPress={() => selectDraftOption(index)}
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
            {!isCommitted && draftOption === null && (
              <ThemedText style={styles.microcopy} themeColor="textSecondary">
                Pick first. Then we&apos;ll show you the room.
              </ThemedText>
            )}
            {!isCommitted && (
              <Pressable
                disabled={draftOption === null}
                onPress={confirmAnswer}
                style={[styles.confirmButton, draftOption === null && styles.confirmButtonDisabled]}>
                <ThemedText style={styles.confirmButtonText}>Lock it in →</ThemedText>
              </Pressable>
            )}
          </View>

          {isCommitted && (
            <View style={styles.revealCard}>
              <ThemedText style={styles.revealEyebrow}>THE READ</ThemedText>
              <ThemedText style={styles.observation}>
                {stripApparentlyPrefix(selectedChoice.apparentlyFeedback ?? 'You gave us something to think about.')}
              </ThemedText>

              <ThemedText style={styles.revealPercentLine}>
                {consensus ? getPercentLanguage(selectedChoice.percent, consensus.label) : ''}
              </ThemedText>

              {selectedTraitLine.length > 0 && (
                <View style={styles.signalLine}>
                  <ThemedText style={styles.signalEyebrow}>WE&apos;RE NOTICING</ThemedText>
                  <ThemedText style={styles.signalChips}>{selectedTraitLine}</ThemedText>
                  <ThemedText style={styles.signalCopy}>{signalCopy}</ThemedText>
                </View>
              )}

              <Pressable style={styles.worldToggle} onPress={() => setWorldExpanded((value) => !value)}>
                <ThemedText style={styles.worldToggleText}>
                  {worldExpanded ? 'Close the room ↑' : 'See the room ↓'}
                </ThemedText>
              </Pressable>

              {worldExpanded && (
                <View style={styles.worldDistribution}>
                  {question.options.map((option, index) => {
                    const isSelected = index === displayedOption;
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

              <Pressable style={styles.worldButton} onPress={() => router.push('/explore')}>
                <ThemedText style={styles.worldButtonText}>Keep going →</ThemedText>
              </Pressable>
            </View>
          )}

          {isCommitted && (
            <View style={styles.privateDropCard}>
              <ThemedText style={styles.privateDropEyebrow}>PRIVATE DROP</ThemedText>
              <ThemedText style={styles.privateDropTitle}>Your second drop is locked.</ThemedText>
              <ThemedText style={styles.privateDropCopy}>You know you want to know.</ThemedText>
              {/* Deliberately plain text, no arrow, no button chrome — this is a status
                  label, not a CTA, and must not look tappable. No purchase/paywall code
                  exists behind it. */}
              <ThemedText style={styles.privateDropStatus}>PRIVATE · COMING SOON</ThemedText>
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
                <ThemedText style={styles.eyebrow}>YOUR 7</ThemedText>
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
  introSupport: {
    color: Brand.inkSecondary,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
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
  // The one and only path to commitDailyAnswer — pink like every other primary CTA in the
  // app (onboarding's ctaText included), so it reads as the deliberate confirmation step it
  // is rather than a secondary action.
  confirmButton: {
    backgroundColor: Brand.pink,
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: Spacing.three,
    marginTop: Spacing.one,
  },
  confirmButtonDisabled: {
    opacity: 0.35,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.82,
  },
  // The reveal is one card, hero-first: the Read is the payoff, everything else (percentage,
  // personality nudge, full breakdown) is deliberately smaller/secondary so it doesn't
  // compete with it — see Part 2 of the visual QA correction.
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
  signalEyebrow: {
    color: Brand.violet,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
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
  // The premium/private surface treatment: deep plum, cream text, a restrained coral
  // eyebrow — visibly a different room from the pink free-content chrome around it, with no
  // purchase functionality behind it yet (see privateDropStatus below, deliberately not a
  // Pressable so it never implies a real, tappable purchase action exists).
  privateDropCard: {
    backgroundColor: Brand.plum,
    borderRadius: 24,
    padding: Spacing.four,
    gap: Spacing.one,
  },
  privateDropEyebrow: {
    color: Brand.coral,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  privateDropTitle: {
    color: Brand.cream,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  privateDropCopy: {
    color: 'rgba(255,249,245,0.7)',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  privateDropStatus: {
    color: Brand.coral,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: Spacing.one,
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
