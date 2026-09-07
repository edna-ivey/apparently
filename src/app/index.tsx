import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { initialQuestions, useDailyQuestions, type DailyQuestion } from '@/data/daily-questions';
import {
  getDemoPersonalityAnswers,
  getDemoPersonalityProfile,
  getConsensusLanguage,
  getPersonalitySignalCopy,
  scorePersonalityProfile,
} from '@/data/personality';

const fallbackQuestion: DailyQuestion = initialQuestions.find((item) => item.id === 5) ?? initialQuestions[0];

export default function HomeScreen() {
  const questions = useDailyQuestions();
  const liveQuestion = questions.find((question) => question.status === 'Live') ?? null;
  const question = liveQuestion ?? fallbackQuestion;
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answeredCount, setAnsweredCount] = useState(43);
  const answered = selectedOption !== null;
  const selectedChoice = question.options[selectedOption ?? 0] ?? question.options[0];
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
    setSelectedOption(null);
    setAnsweredCount(43);
  }, [liveQuestion?.id]);

  const selectOption = (index: number) => {
    if (selectedOption === null) {
      setAnsweredCount((count) => count + 1);
    }
    setSelectedOption(index);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <ThemedText style={styles.wordmark}>apparently.</ThemedText>
            <View style={styles.streak}>
              <ThemedText style={styles.fire}>✦</ThemedText>
              <ThemedText style={styles.streakText}>7</ThemedText>
            </View>
          </View>

          <View style={styles.intro}>
            <View style={styles.metaRow}>
              <ThemedText style={styles.eyebrow}>TODAY'S QUESTION</ThemedText>
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
                return (
                  <Pressable
                    key={option.label}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => selectOption(index)}
                    style={({ pressed }) => [
                      styles.option,
                      isSelected && styles.optionSelected,
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
            <ThemedText style={styles.microcopy} themeColor="textSecondary">
              {answered ? 'Your answer unlocked the world.' : 'Answer to unlock the world.'}
            </ThemedText>
          </View>

          {answered && (
            <View style={styles.revealCard}>
              <View style={styles.revealHeader}>
                <ThemedText style={styles.eyebrow}>YOU PICKED</ThemedText>
                <ThemedText style={styles.revealPercent}>
                  {selectedChoice.percent}%
                </ThemedText>
              </View>
              <ThemedText style={styles.revealTitle}>
                {selectedChoice.label}
              </ThemedText>
              <ThemedText style={styles.revealCopy}>
                {consensus?.sentence}
              </ThemedText>
              <View style={styles.worldDistribution}>
                {question.options.map((option, index) => {
                  const isSelected = index === selectedOption;
                  return (
                  <View key={option.id} style={[styles.distributionRow, isSelected && styles.distributionRowSelected]}>
                    <ThemedText style={[styles.distributionLabel, isSelected && styles.distributionLabelSelected]}>
                      {isSelected ? 'YOU → ' : ''}{option.percent}%
                    </ThemedText>
                    <View style={styles.distributionTrack}>
                      <View style={[styles.distributionFill, isSelected && styles.distributionFillSelected, { width: `${option.percent}%` }]} />
                    </View>
                    {!isSelected && <ThemedText style={styles.distributionPercent}>{option.percent}%</ThemedText>}
                  </View>
                  );
                })}
              </View>
              <View style={styles.divider} />
              <ThemedText style={styles.revealEyebrow}>APPARENTLY...</ThemedText>
              <ThemedText style={styles.observation}>
                {selectedChoice.apparentlyFeedback ?? 'Apparently, you gave us something to think about.'}
              </ThemedText>
              {selectedSignal && (
                <View style={styles.signalCard}>
                  <ThemedText style={styles.revealEyebrow}>PERSONALITY SIGNAL</ThemedText>
                  <ThemedText style={styles.signalLabel}>{selectedSignal.displayPole}</ThemedText>
                  <ThemedText style={styles.signalName}>({selectedSignal.displayName})</ThemedText>
                  <ThemedText style={styles.signalCopy}>{signalCopy}</ThemedText>
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
              <ThemedText style={styles.statLabel} themeColor="textSecondary">
                commonality
              </ThemedText>
            </View>
            <View style={styles.statBlock}>
              <ThemedText style={styles.statValue}>{answeredCount}</ThemedText>
              <ThemedText style={styles.statLabel} themeColor="textSecondary">
                your answers
              </ThemedText>
            </View>
            <View style={styles.statBlock}>
              <ThemedText style={styles.statValue}>06</ThemedText>
              <ThemedText style={styles.statLabel} themeColor="textSecondary">
                rare picks
              </ThemedText>
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
            <ThemedText style={styles.progressCopy} themeColor="textSecondary">
              Your answers are becoming a pattern.
            </ThemedText>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F5',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.five,
    gap: Spacing.four,
  },
  header: {
    paddingTop: Spacing.two,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wordmark: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '800',
    letterSpacing: -1,
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
    paddingTop: Spacing.five,
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
  revealCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F0E6E8',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  revealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  revealPercent: {
    color: Brand.pink,
    fontSize: 38,
    lineHeight: 42,
    fontWeight: '900',
  },
  revealTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
  },
  revealCopy: {
    color: '#746D79',
    fontSize: 14,
    lineHeight: 21,
  },
  worldDistribution: {
    gap: Spacing.one,
    marginTop: Spacing.one,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  distributionRowSelected: {
    backgroundColor: '#F7F3FF',
  },
  distributionLabel: {
    flex: 1,
    color: '#5D5571',
    fontSize: 11,
    fontWeight: '600',
  },
  distributionLabelSelected: {
    color: Brand.violet,
    fontWeight: '800',
  },
  distributionTrack: {
    width: 92,
    height: 7,
    borderRadius: 99,
    overflow: 'hidden',
    backgroundColor: '#F1ECF8',
  },
  distributionFill: {
    height: '100%',
    borderRadius: 99,
    backgroundColor: Brand.violet,
  },
  distributionFillSelected: {
    backgroundColor: Brand.pink,
  },
  distributionPercent: {
    width: 34,
    color: Brand.pink,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0E6E8',
    marginVertical: Spacing.one,
  },
  revealEyebrow: {
    color: Brand.pink,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  observation: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '700',
  },
  signalCard: {
    backgroundColor: '#F7F3FF',
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.one,
    marginTop: Spacing.one,
  },
  signalLabel: {
    color: Brand.violet,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  signalName: {
    color: '#5D5571',
    fontSize: 13,
    fontWeight: '700',
  },
  signalCopy: {
    color: '#17151D',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
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
    fontSize: 25,
    lineHeight: 29,
    fontWeight: '800',
  },
  statLabel: {
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
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
});
