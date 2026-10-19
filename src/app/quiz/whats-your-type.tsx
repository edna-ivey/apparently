import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Celestial, CelestialType, CelestialWash, PortalRings } from '@/components/today/celestial';
import { Brand, Spacing } from '@/constants/theme';
import { Radius } from '@/constants/design-system';
import { reduceWhatsYourTypeProfileSignals, WHATS_YOUR_TYPE_QUESTIONS, type WhatsYourTypeQuestion } from '@/data/quizzes/whats-your-type-content';
import { queuePendingQuizSubmission } from '@/data/quizzes/pending-quiz-submissions';
import { ATTRACTION_RESULTS, COMBINATION_RESULTS, PARTNER_RESULTS, WHATS_YOUR_TYPE_DEFINITION } from '@/data/quizzes/whats-your-type-results';
import { resolveCombinationKey, scoreDualDimensionQuiz } from '@/data/quizzes/scoring';
import { saveQuizResult } from '@/data/quizzes/results';
import { isRemoteDailyEnabled } from '@/lib/supabase';
import { submitQuizResultRemote, type SubmitQuizResultPayload } from '@/services/quiz-result-service';

// A dedicated STATIC route (/quiz/whats-your-type) rather than a case inside the dynamic
// [quizId].tsx runner -- Expo Router resolves a static route ahead of a same-prefix dynamic
// one, so this never touches that file, its QuizDefinition-shaped union, or any of the other
// 21 quizzes it serves. This quiz's own two-independent-archetype-dimension shape
// (DualDimensionQuizDefinition, scoring.ts) has no equivalent in that shared union by design
// -- see whats-your-type-content.ts's header comment.

type Step = 'intro' | 'question' | 'result';

export default function WhatsYourTypeScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('intro');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  // A ref guard, not state -- mirrors quiz/[quizId].tsx's own `savedResult` ref exactly, so
  // "submit once per completion" never needs a state write inside this effect.
  const savedResult = useRef(false);

  const currentQuestion: WhatsYourTypeQuestion | null = step === 'question' ? WHATS_YOUR_TYPE_QUESTIONS[questionIndex] : null;
  const isLastQuestion = questionIndex === WHATS_YOUR_TYPE_QUESTIONS.length - 1;

  const selectAnswer = (choiceId: string) => {
    if (!currentQuestion) return;
    setAnswers((previous) => ({ ...previous, [currentQuestion.id]: choiceId }));
  };

  const goNext = () => {
    if (isLastQuestion) {
      setStep('result');
      return;
    }
    setQuestionIndex((index) => index + 1);
  };

  const scored = step === 'result' ? scoreDualDimensionQuiz(WHATS_YOUR_TYPE_DEFINITION, answers) : null;
  const attractionResult = scored ? ATTRACTION_RESULTS[scored.dimensionA.archetypeId as keyof typeof ATTRACTION_RESULTS] : null;
  const partnerResult = scored ? PARTNER_RESULTS[scored.dimensionB.archetypeId as keyof typeof PARTNER_RESULTS] : null;
  const combinationResult = scored ? COMBINATION_RESULTS[resolveCombinationKey(scored.dimensionA.archetypeId, scored.dimensionB.archetypeId)] : null;

  // Persists exactly once per completion, mirroring quiz/[quizId].tsx's own ref-guarded
  // save-then-submit-then-queue-on-failure shape exactly.
  useEffect(() => {
    if (step !== 'result' || savedResult.current || !scored || !combinationResult) {
      return;
    }
    savedResult.current = true;
    const completedAt = new Date().toISOString();
    const partnerEnergyQuestionIds = new Set(WHATS_YOUR_TYPE_DEFINITION.dimensionBQuestionIds);
    const chosenPartnerEnergyChoices = WHATS_YOUR_TYPE_QUESTIONS.filter((q) => partnerEnergyQuestionIds.has(q.id))
      .map((q) => q.choices.find((c) => c.id === answers[q.id]))
      .filter((c): c is NonNullable<typeof c> => !!c);
    const profileSignals = reduceWhatsYourTypeProfileSignals(chosenPartnerEnergyChoices);
    const traits = [attractionResult?.title ?? '', partnerResult?.title ?? ''].filter(Boolean);

    void saveQuizResult({
      quizId: WHATS_YOUR_TYPE_DEFINITION.id,
      completedAt,
      score: WHATS_YOUR_TYPE_QUESTIONS.length,
      percent: 100,
      resultId: combinationResult.key,
      resultTitle: combinationResult.title,
      traits,
    });

    if (isRemoteDailyEnabled) {
      const payload: SubmitQuizResultPayload = {
        quizId: WHATS_YOUR_TYPE_DEFINITION.id,
        quizTitle: WHATS_YOUR_TYPE_DEFINITION.title,
        quizCategory: WHATS_YOUR_TYPE_DEFINITION.category,
        completedAt,
        questionCount: WHATS_YOUR_TYPE_QUESTIONS.length,
        score: WHATS_YOUR_TYPE_QUESTIONS.length,
        percent: 100,
        resultId: combinationResult.key,
        resultTitle: combinationResult.title,
        traits,
        profileSignals,
        answers,
      };
      void (async () => {
        const remoteResult = await submitQuizResultRemote(payload);
        if (!remoteResult.ok) {
          await queuePendingQuizSubmission(payload);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <PortalRings />
        <CelestialWash />
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            {step !== 'intro' ? (
              <ThemedText style={styles.progress}>
                {step === 'result' ? 'Result' : `${questionIndex + 1} / ${WHATS_YOUR_TYPE_QUESTIONS.length}`}
              </ThemedText>
            ) : (
              <View />
            )}
            <Pressable onPress={() => router.back()} hitSlop={12} style={styles.closeButton} accessibilityRole="button" accessibilityLabel="Close">
              <ThemedText style={styles.closeText}>×</ThemedText>
            </Pressable>
          </View>

          {step === 'intro' && (
            <View style={styles.stepGap}>
              <ThemedText style={styles.wordmark}>apparently you.</ThemedText>
              <View style={styles.introGap}>
                <ThemedText style={styles.eyebrow}>{WHATS_YOUR_TYPE_DEFINITION.eyebrow}</ThemedText>
                <ThemedText type="title" style={styles.introTitle}>
                  {WHATS_YOUR_TYPE_DEFINITION.title}
                </ThemedText>
                {WHATS_YOUR_TYPE_DEFINITION.introSupport.map((line) => (
                  <ThemedText key={line} style={styles.subcopy}>
                    {line}
                  </ThemedText>
                ))}
                <ThemedText style={styles.meta}>{WHATS_YOUR_TYPE_DEFINITION.meta}</ThemedText>
              </View>
              <Pressable onPress={() => setStep('question')} style={styles.cta}>
                <ThemedText style={styles.ctaText}>{WHATS_YOUR_TYPE_DEFINITION.introCta}</ThemedText>
              </Pressable>
            </View>
          )}

          {currentQuestion && (
            <View style={styles.stepGap}>
              <ThemedText style={styles.axisEyebrow}>{currentQuestion.axis === 'attraction' ? 'YOUR TYPE' : 'YOUR PARTNER ENERGY'}</ThemedText>
              <ThemedText type="title" style={styles.questionPrompt}>
                {currentQuestion.prompt}
              </ThemedText>
              <View style={styles.choiceList}>
                {currentQuestion.choices.map((choice, index) => {
                  const isSelected = answers[currentQuestion.id] === choice.id;
                  return (
                    <Pressable key={choice.id} onPress={() => selectAnswer(choice.id)} style={[styles.choiceCard, isSelected && styles.choiceCardSelected]}>
                      <View style={[styles.choiceBadge, isSelected && styles.choiceBadgeSelected]}>
                        <ThemedText style={[styles.choiceBadgeText, isSelected && styles.choiceBadgeTextSelected]}>{String.fromCharCode(65 + index)}</ThemedText>
                      </View>
                      <ThemedText style={styles.choiceText}>{choice.label}</ThemedText>
                      {isSelected && <ThemedText style={styles.choiceCheck}>✓</ThemedText>}
                    </Pressable>
                  );
                })}
              </View>
              <Pressable disabled={!answers[currentQuestion.id]} onPress={goNext} style={[styles.cta, !answers[currentQuestion.id] && styles.ctaDisabled]}>
                <ThemedText style={styles.ctaText}>{isLastQuestion ? 'Read me →' : 'Next →'}</ThemedText>
              </Pressable>
            </View>
          )}

          {step === 'result' && attractionResult && partnerResult && combinationResult && (
            <View style={styles.stepGap}>
              <ThemedText style={styles.axisEyebrow}>YOUR TYPE</ThemedText>
              <View style={styles.resultCard}>
                <ThemedText style={styles.resultTitle}>{attractionResult.title}</ThemedText>
                <ThemedText style={styles.resultHook}>{attractionResult.hook}</ThemedText>
                <ThemedText style={styles.resultBody}>{attractionResult.body}</ThemedText>
              </View>

              <ThemedText style={styles.axisEyebrow}>YOUR PARTNER ENERGY</ThemedText>
              <View style={styles.resultCard}>
                <ThemedText style={styles.resultTitle}>{partnerResult.title}</ThemedText>
                <ThemedText style={styles.resultHook}>{partnerResult.hook}</ThemedText>
                <ThemedText style={styles.resultBody}>{partnerResult.body}</ThemedText>
              </View>

              <ThemedText style={styles.axisEyebrow}>THE PLOT TWIST</ThemedText>
              <View style={[styles.resultCard, styles.plotTwistCard]}>
                <ThemedText style={styles.resultTitle}>{combinationResult.title}</ThemedText>
                <ThemedText style={styles.resultBody}>{combinationResult.body}</ThemedText>
              </View>

              <Pressable onPress={() => router.replace('/explore')} style={styles.secondaryCta}>
                <ThemedText style={styles.secondaryCtaText}>Back to Explore</ThemedText>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#17000F' },
  safeArea: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: Celestial.background,
    ...Platform.select({
      web: { marginVertical: 28, borderRadius: 28, boxShadow: '0 24px 64px rgba(0, 0, 0, 0.35)', overflow: 'hidden' },
      default: {},
    }),
  },
  scrollView: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.four, paddingBottom: Spacing.six, gap: Spacing.five },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 28 },
  closeButton: { minWidth: 44, minHeight: 32, justifyContent: 'center', alignItems: 'flex-end' },
  closeText: { color: Celestial.textSecondary, fontSize: 26, lineHeight: 26, fontWeight: '600' },
  progress: { color: Celestial.textSecondary, fontSize: 13, fontWeight: '700' },
  stepGap: { gap: Spacing.four },
  wordmark: { color: Celestial.textPrimary, fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  introGap: { gap: Spacing.two },
  eyebrow: CelestialType.eyebrow,
  axisEyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.3, color: Brand.gold },
  introTitle: { ...CelestialType.editorialHeadline, fontSize: 28, lineHeight: 33 },
  subcopy: { color: Celestial.textSecondary, fontSize: 15, lineHeight: 21, fontWeight: '600' },
  meta: { color: Brand.gold, fontSize: 13, fontWeight: '800', marginTop: Spacing.one },
  cta: { backgroundColor: Brand.gold, borderRadius: 16, alignItems: 'center', paddingVertical: Spacing.three, paddingHorizontal: Spacing.five },
  ctaDisabled: { opacity: 0.35 },
  ctaText: { color: Brand.plum, fontSize: 16, fontWeight: '800' },
  secondaryCta: { backgroundColor: Celestial.glassFill, borderRadius: 16, alignItems: 'center', paddingVertical: Spacing.three, borderWidth: 1, borderColor: Celestial.glassBorder },
  secondaryCtaText: { color: Celestial.textPrimary, fontSize: 15, fontWeight: '800' },
  questionPrompt: { ...CelestialType.question, fontSize: 24, lineHeight: 30 },
  choiceList: { gap: Spacing.two },
  choiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 58,
    borderRadius: 16,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: Celestial.glassFill,
    borderWidth: 1,
    borderColor: Celestial.glassBorder,
  },
  choiceCardSelected: { backgroundColor: 'rgba(246,184,63,0.14)', borderColor: Brand.gold },
  choiceBadge: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)' },
  choiceBadgeSelected: { backgroundColor: Brand.gold },
  choiceBadgeText: { color: Celestial.textSecondary, fontSize: 12, fontWeight: '800' },
  choiceBadgeTextSelected: { color: Brand.plum },
  choiceText: { flex: 1, color: Celestial.textPrimary, fontSize: 15, lineHeight: 21, fontWeight: '700' },
  choiceCheck: { color: Brand.gold, fontSize: 18, fontWeight: '800' },
  resultCard: {
    backgroundColor: Celestial.glassFill,
    borderWidth: 1,
    borderColor: Celestial.glassBorder,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    gap: Spacing.one,
  },
  plotTwistCard: { backgroundColor: 'rgba(121,100,232,0.12)', borderColor: 'rgba(121,100,232,0.35)' },
  resultTitle: {
    fontFamily: undefined,
    fontStyle: 'italic',
    fontWeight: '500',
    color: Celestial.textPrimary,
    fontSize: 22,
    lineHeight: 27,
  },
  resultHook: { color: Brand.gold, fontSize: 14, lineHeight: 20, fontWeight: '700', marginTop: Spacing.one },
  resultBody: { color: Celestial.textSecondary, fontSize: 14, lineHeight: 20, marginTop: Spacing.one },
});
