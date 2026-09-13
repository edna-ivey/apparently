import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandSignature } from '@/components/brand-signature';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, BottomTabInset, Spacing } from '@/constants/theme';
import { useConsumerDailyExperience } from '@/data/consumer-daily';
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

export default function HomeScreen() {
  const router = useRouter();
  const contentWidth = useResponsiveContentWidth();
  const topInset = useResponsiveTopInset();

  // The ONE place that decides local vs remote Daily — see src/data/consumer-daily.ts. This
  // screen works entirely off the resulting shape (and option INDEX, never a raw id of
  // either type), so it never has to know or care which source is active.
  const { experience, draftIndex, selectDraftOption, confirmAnswer, isCommitting, commitError, retry, retryDistribution } =
    useConsumerDailyExperience();

  const [answeredCount, setAnsweredCount] = useState(43);
  const [worldExpanded, setWorldExpanded] = useState(false);

  // Narrows the 5-variant experience union down to "there is a question to show" — true for
  // 'local' always, and for 'remote' only once phase is 'ready'. Every render below that
  // needs a question/committedIndex/distribution goes through this instead of re-deriving it.
  const ready =
    experience.source === 'local' ? experience : experience.phase === 'ready' ? experience : null;

  const isCommitted = ready !== null && ready.committedIndex !== null;
  const displayedOption = ready ? ready.committedIndex ?? draftIndex : null;
  const selectedChoice = ready ? ready.question.options[displayedOption ?? 0] ?? ready.question.options[0] : null;
  const selectedTraitLine = selectedChoice ? selectedChoice.personalityEffects.map(getEffectDisplayLabel).join(' · ') : '';
  // A vote can be locked in while its distribution is still loading or has failed — that must
  // never be presented as a real percentage. `selectedPercent` (and `consensus` below) stay
  // null unless distribution has ACTUALLY loaded; nothing here ever falls back to 0.
  const distribution = ready?.distribution ?? null;
  const selectedPercent =
    distribution?.status === 'ready' && displayedOption !== null ? distribution.percentages[displayedOption] ?? null : null;
  // null for local prototype data (no real population count) and whenever distribution
  // hasn't successfully loaded — getPercentLanguage only applies the first-voter copy when
  // this is the real server-reported value 1, never a guess.
  const totalAnswers = distribution?.status === 'ready' ? distribution.totalAnswers : null;

  // Demo personality/consensus flourishes stay LOCAL-only, exactly as before this sprint —
  // Sprint 1B-A does not replace or extend the existing profile scoring system, and a remote
  // (possibly TEST-ONLY) answer must never feed the local demo profile.
  const localReady = experience.source === 'local' ? experience : null;
  const baselineProfile = useMemo(() => getDemoPersonalityProfile(43), []);
  const selectedProfile = useMemo(() => {
    if (!localReady || localReady.committedIndex === null) {
      return baselineProfile;
    }
    const choice = localReady.question.options[localReady.committedIndex];
    if (!choice || choice.personalityEffects.length === 0) {
      return baselineProfile;
    }
    return scorePersonalityProfile([
      ...getDemoPersonalityAnswers(43),
      {
        question: localReady.question.prompt,
        category: localReady.question.category,
        chosenAnswer: choice.label,
        effects: choice.personalityEffects,
      },
    ]);
  }, [localReady, baselineProfile]);
  const selectedSignal = useMemo(() => {
    if (!localReady || !selectedChoice) {
      return null;
    }
    const effect = selectedChoice.personalityEffects[0];
    return effect ? selectedProfile.dimensions.find((dimension) => dimension.dimension === effect.dimension) ?? null : null;
  }, [localReady, selectedChoice, selectedProfile]);
  const signalCopy = localReady
    ? selectedSignal
      ? getPersonalitySignalCopy(selectedSignal.evidenceCount)
      : 'Still taking notes.'
    : null;

  const consensus = useMemo(() => {
    if (!ready || displayedOption === null || ready.distribution.status !== 'ready') {
      return null;
    }
    return getConsensusLanguage(
      ready.distribution.percentages.map((percent) => ({ percent })),
      displayedOption,
    );
  }, [ready, displayedOption]);

  const remainingToReveal = Math.max(0, 50 - answeredCount);

  // Local-only: mirrors the exact prior behavior of bumping this demo counter once per
  // successful LOCAL commit. Remote (including Sprint 1B-A's TEST-ONLY integration content)
  // deliberately never touches this — it's a local prototype flourish, not real progress.
  const previousLocalCommittedIndexRef = useRef<number | null>(null);
  useEffect(() => {
    if (experience.source !== 'local') {
      return;
    }
    if (experience.committedIndex !== null && previousLocalCommittedIndexRef.current === null) {
      setAnsweredCount((count) => count + 1);
    }
    previousLocalCommittedIndexRef.current = experience.committedIndex;
  }, [experience]);

  // A fresh local Daily always starts with these page-level flourishes reset — draft
  // selection itself is reset inside the hook. `prompt` stands in for "which local question
  // is active" without this screen needing a raw local question id.
  const localQuestionKey = experience.source === 'local' ? experience.question.prompt : null;
  useEffect(() => {
    if (experience.source === 'local') {
      setAnsweredCount(43);
      setWorldExpanded(false);
    }
  }, [localQuestionKey]);

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
              {/* Prototype streak — real remote users have no real streak yet (see the
                  upcoming "Make You Real" work), so this must never render as if it were
                  real user data. Local prototype mode is completely unaffected. */}
              {experience.source === 'local' && (
                <View style={styles.streak}>
                  <ThemedText style={styles.fire}>✦</ThemedText>
                  <ThemedText style={styles.streakText}>7</ThemedText>
                </View>
              )}
            </View>
            <ThemedText style={styles.introSupport}>One question. Choose carefully.</ThemedText>
          </View>

          {experience.source === 'remote' && experience.phase === 'loading' && (
            <View style={styles.questionCard}>
              <ThemedText style={styles.prompt}>Loading today's drop…</ThemedText>
            </View>
          )}

          {experience.source === 'remote' && experience.phase === 'no-live-daily' && (
            <View style={styles.revealCard}>
              <ThemedText style={styles.revealEyebrow}>TODAY'S DROP</ThemedText>
              <ThemedText style={styles.observation}>No live Daily right now.</ThemedText>
            </View>
          )}

          {experience.source === 'remote' && experience.phase === 'error' && (
            <View style={styles.revealCard}>
              <ThemedText style={styles.revealEyebrow}>TODAY'S DROP</ThemedText>
              <ThemedText style={styles.observation}>Today's Drop is having a moment.</ThemedText>
              <Pressable style={styles.worldButton} onPress={retry}>
                <ThemedText style={styles.worldButtonText}>Try again →</ThemedText>
              </Pressable>
            </View>
          )}

          {ready && (
            <View style={styles.questionCard}>
              <ThemedText style={styles.prompt}>{ready.question.prompt}</ThemedText>
              <View style={styles.options}>
                {ready.question.options.map((option, index) => {
                  const isSelected = displayedOption === index;
                  // Once committed, a Daily choice is final: unselected options become
                  // inert (not just visually muted) so the committed answer can never be
                  // swapped out after the reveal has been seen. Before commit, nothing is
                  // locked — any option can be re-tapped to change the draft selection.
                  const isLocked = isCommitted && !isSelected;
                  return (
                    <Pressable
                      key={`option-${index}`}
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
              {!isCommitted && draftIndex === null && (
                <ThemedText style={styles.microcopy} themeColor="textSecondary">
                  Pick first. Then we&apos;ll show you the room.
                </ThemedText>
              )}
              {!isCommitted && (
                <>
                  <Pressable
                    disabled={draftIndex === null || isCommitting}
                    onPress={confirmAnswer}
                    style={[styles.confirmButton, (draftIndex === null || isCommitting) && styles.confirmButtonDisabled]}>
                    <ThemedText style={styles.confirmButtonText}>
                      {isCommitting ? 'Locking it in…' : 'Lock it in →'}
                    </ThemedText>
                  </Pressable>
                  {commitError && (
                    <ThemedText style={styles.microcopy} themeColor="textSecondary">
                      {commitError}
                    </ThemedText>
                  )}
                </>
              )}
            </View>
          )}

          {isCommitted && ready && selectedChoice && (
            <View style={styles.revealCard}>
              <ThemedText style={styles.revealEyebrow}>THE READ</ThemedText>
              <ThemedText style={styles.observation}>
                {stripApparentlyPrefix(selectedChoice.apparentlyFeedback ?? 'You gave us something to think about.')}
              </ThemedText>

              <ThemedText style={styles.revealPercentLine}>
                {consensus && selectedPercent !== null ? getPercentLanguage(selectedPercent, consensus.label, totalAnswers) : ''}
              </ThemedText>

              {selectedTraitLine.length > 0 && (
                <View style={styles.signalLine}>
                  <ThemedText style={styles.signalEyebrow}>WE&apos;RE NOTICING</ThemedText>
                  <ThemedText style={styles.signalChips}>{selectedTraitLine}</ThemedText>
                  {signalCopy && <ThemedText style={styles.signalCopy}>{signalCopy}</ThemedText>}
                </View>
              )}

              <Pressable style={styles.worldToggle} onPress={() => setWorldExpanded((value) => !value)}>
                <ThemedText style={styles.worldToggleText}>
                  {worldExpanded ? 'Close the room ↑' : 'See the room ↓'}
                </ThemedText>
              </Pressable>

              {worldExpanded && ready.distribution.status === 'ready' && (
                <View style={styles.worldDistribution}>
                  {ready.question.options.map((option, index) => {
                    const isSelected = index === displayedOption;
                    // ready.distribution.status is narrowed to 'ready' by the guard above —
                    // percentages is always real, server-derived data here, never a fallback.
                    const percent = ready.distribution.status === 'ready' ? ready.distribution.percentages[index] : null;
                    return (
                      <View
                        key={`option-${index}`}
                        style={[styles.distributionRow, isSelected && styles.distributionRowSelected]}>
                        <ThemedText
                          style={[styles.distributionLabel, isSelected && styles.distributionLabelSelected]}
                          numberOfLines={1}>
                          {String.fromCharCode(65 + index)}. {option.label}
                        </ThemedText>
                        <ThemedText
                          style={[styles.distributionPercent, isSelected && styles.distributionPercentSelected]}>
                          {percent}%
                        </ThemedText>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* The vote itself may already be locked in while The Room's tally is still
                  loading or failed to load — that must never be shown as invented percentages.
                  A network/RPC failure is a small, retryable state, never a fabricated
                  0/0/0/0 result. */}
              {worldExpanded && (ready.distribution.status === 'loading' || ready.distribution.status === 'idle') && (
                <View style={styles.worldDistribution}>
                  <ThemedText style={styles.distributionLabel}>Tallying the room…</ThemedText>
                </View>
              )}

              {worldExpanded && ready.distribution.status === 'error' && (
                <View style={styles.worldDistribution}>
                  <ThemedText style={styles.distributionLabel}>The Room is having a moment.</ThemedText>
                  <Pressable style={styles.worldToggle} onPress={retryDistribution}>
                    <ThemedText style={styles.worldToggleText}>Try again →</ThemedText>
                  </Pressable>
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

          {/* Prototype personal stats (commonality, answer count, rare picks, Your 7
              progress) — real remote users have no real versions of these yet (see the
              upcoming "Make You Real" work), so none of this may render as if it were real
              user data. Local prototype mode is completely unaffected. */}
          {experience.source === 'local' && (
            <>
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
            </>
          )}
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
