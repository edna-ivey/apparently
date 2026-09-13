import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandSignature } from '@/components/brand-signature';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { APP_URL } from '@/constants/app';
import { Brand, Spacing } from '@/constants/theme';
import { getQuizDefinition, type QuizQuestion } from '@/data/quizzes';
import { hydrateQuizResults, saveQuizResult, useLatestQuizResult } from '@/data/quizzes/results';
import { computeQuizResult, reconstructResultDisplay, type ResultDisplay } from '@/data/quizzes/scoring';
import { useResponsiveContentWidth } from '@/hooks/use-responsive-content-width';

export default function QuizScreen() {
  const { quizId, view } = useLocalSearchParams<{ quizId: string; view?: string }>();
  const router = useRouter();
  const contentWidth = useResponsiveContentWidth();
  const definition = getQuizDefinition(quizId);

  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const savedResult = useRef(false);

  // Called unconditionally (before the not-found early return below) to keep hook order
  // stable. Powers "See result →" from You: arriving with ?view=result jumps straight to the
  // last saved completion instead of restarting the quiz — see savedBand below.
  const latestResult = useLatestQuizResult(definition?.id ?? '');
  useEffect(() => {
    void hydrateQuizResults();
  }, []);

  // Not thrown/notFound — a quiz route reached with an unknown id (a stale link, a typo)
  // should land somewhere real rather than crash. Explore is the natural home.
  if (!definition) {
    return <Redirect href="/explore" />;
  }

  const wantsSavedResult = view === 'result';
  // The persisted record deliberately doesn't carry heroRead/body/kicker/mix titles (avoids
  // duplicated copy — see results.ts) — reconstructResultDisplay re-derives the full result
  // from resultId, for either scoring type. This is the "See result →" path from You.
  const savedResultDisplay: ResultDisplay | null =
    wantsSavedResult && latestResult && latestResult !== 'loading'
      ? reconstructResultDisplay(definition, latestResult)
      : null;

  const stepOrder: string[] = ['intro', ...definition.questions.map((question) => question.id), 'result'];
  const step = savedResultDisplay ? 'result' : stepOrder[stepIndex] ?? 'intro';
  const questionIndex = savedResultDisplay ? -1 : definition.questions.findIndex((question) => question.id === step);
  const currentQuestion: QuizQuestion | null = questionIndex >= 0 ? definition.questions[questionIndex] : null;
  const isLastQuestion = questionIndex === definition.questions.length - 1;

  const goNext = () => setStepIndex((index) => Math.min(index + 1, stepOrder.length - 1));
  const goBack = () => setStepIndex((index) => Math.max(index - 1, 0));

  const selectAnswer = (questionId: string, choiceId: string) => {
    setAnswers((previous) => ({ ...previous, [questionId]: choiceId }));
  };

  // computeQuizResult is the ONE place scoringType branching happens for a fresh completion —
  // this screen never special-cases numericBand vs archetype itself.
  const liveResult: ResultDisplay | null = !savedResultDisplay && step === 'result' ? computeQuizResult(definition, answers) : null;
  const result: ResultDisplay | null = savedResultDisplay ?? liveResult;

  // Persists exactly once per freshly-completed run — stepping into 'result' via the normal
  // quiz flow is the single moment a quiz is "done." Viewing an already-saved result
  // (savedResultDisplay) never re-saves, so re-opening "See result →" can't duplicate history.
  useEffect(() => {
    if (savedResultDisplay) {
      savedResult.current = true;
      return;
    }
    if (step !== 'result' || !liveResult || savedResult.current) {
      return;
    }
    savedResult.current = true;
    void saveQuizResult({
      quizId: definition.id,
      completedAt: new Date().toISOString(),
      score: liveResult.score,
      percent: liveResult.percent,
      resultId: liveResult.resultId,
      resultTitle: liveResult.resultTitle,
      traits: liveResult.traits,
      mix: liveResult.mix ? Object.fromEntries(liveResult.mix.map((entry) => [entry.id, entry.percent])) : undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, savedResultDisplay]);

  const handleShare = async () => {
    if (!result) {
      return;
    }
    try {
      await Share.share({
        message: `I got ${result.resultDisplayTitle} on Apparently You 😂\n${definition.title}\n${APP_URL}/quiz/${definition.id}`,
      });
    } catch {
      // Share can reject/cancel (user dismissed the sheet, or no share target available on
      // this platform/context) — nothing to recover, the result card itself is still on
      // screen and screenshot-able.
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={[styles.safeArea, contentWidth ? { maxWidth: contentWidth } : null]}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {step !== 'result' && (
            <View style={styles.topRow}>
              {step === 'intro' ? (
                <Pressable
                  onPress={() => router.replace('/explore')}
                  hitSlop={12}
                  accessibilityLabel="Close"
                  accessibilityRole="button"
                  style={styles.closeButton}>
                  <ThemedText style={styles.closeText}>×</ThemedText>
                </Pressable>
              ) : stepIndex > 0 ? (
                <Pressable onPress={goBack} hitSlop={12} style={styles.backButton}>
                  <ThemedText style={styles.backText}>← Back</ThemedText>
                </Pressable>
              ) : (
                <View style={styles.backButton} />
              )}
              {currentQuestion ? (
                <ThemedText style={styles.progress}>
                  {questionIndex + 1} of {definition.questions.length}
                </ThemedText>
              ) : null}
            </View>
          )}

          {step === 'intro' && <QuizIntro definition={definition} onStart={goNext} />}

          {currentQuestion && (
            <QuestionStep
              question={currentQuestion}
              selected={answers[currentQuestion.id] ?? null}
              onSelect={(choiceId) => selectAnswer(currentQuestion.id, choiceId)}
              onNext={goNext}
              isLastQuestion={isLastQuestion}
            />
          )}

          {step === 'result' && result && (
            <ResultScreen
              result={result}
              onShare={handleShare}
              onSeeYou={() => router.push('/you')}
              onTakeAnother={() => router.push('/explore')}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function QuizIntro({ definition, onStart }: { definition: NonNullable<ReturnType<typeof getQuizDefinition>>; onStart: () => void }) {
  return (
    <View style={styles.stepGap}>
      <BrandSignature variant="mark" />
      <View style={styles.introGap}>
        <ThemedText style={styles.eyebrow}>{definition.eyebrow}</ThemedText>
        <ThemedText type="title" style={styles.introTitle}>
          {definition.title}
        </ThemedText>
        {definition.introSupport.map((line) => (
          <ThemedText key={line} style={styles.subcopy}>
            {line}
          </ThemedText>
        ))}
        <ThemedText style={styles.meta}>{definition.meta}</ThemedText>
      </View>
      <Pressable onPress={onStart} style={styles.cta}>
        <ThemedText style={styles.ctaText}>{definition.introCta}</ThemedText>
      </Pressable>
      {definition.introNote ? <ThemedText style={styles.introNote}>{definition.introNote}</ThemedText> : null}
    </View>
  );
}

function QuestionStep({
  question,
  selected,
  onSelect,
  onNext,
  isLastQuestion,
}: {
  question: QuizQuestion;
  selected: string | null;
  onSelect: (choiceId: string) => void;
  onNext: () => void;
  isLastQuestion: boolean;
}) {
  const canContinue = selected !== null;

  return (
    <View style={[styles.stepGap, styles.growStep]}>
      <ThemedText type="title" style={styles.questionPrompt}>
        {question.prompt}
      </ThemedText>
      <View style={styles.choiceList}>
        {question.choices.map((choice, index) => {
          const isSelected = selected === choice.id;
          return (
            <Pressable
              key={choice.id}
              onPress={() => onSelect(choice.id)}
              style={[styles.choiceCard, isSelected && styles.choiceCardSelected]}>
              <View style={[styles.choiceBadge, isSelected && styles.choiceBadgeSelected]}>
                <ThemedText style={[styles.choiceBadgeText, isSelected && styles.choiceBadgeTextSelected]}>
                  {String.fromCharCode(65 + index)}
                </ThemedText>
              </View>
              <ThemedText style={styles.choiceText}>{choice.label}</ThemedText>
              {isSelected && <ThemedText style={styles.choiceCheck}>✓</ThemedText>}
            </Pressable>
          );
        })}
      </View>
      <View style={styles.spacer} />
      <Pressable disabled={!canContinue} onPress={onNext} style={[styles.cta, !canContinue && styles.ctaDisabled]}>
        <ThemedText style={styles.ctaText}>{isLastQuestion ? 'Read me →' : 'Next →'}</ThemedText>
      </Pressable>
    </View>
  );
}

function ResultScreen({
  result,
  onShare,
  onSeeYou,
  onTakeAnother,
}: {
  result: ResultDisplay;
  onShare: () => void;
  onSeeYou: () => void;
  onTakeAnother: () => void;
}) {
  return (
    <View style={styles.stepGap}>
      <View style={styles.verdictCard}>
        <ThemedText style={styles.verdictEyebrow}>THE VERDICT</ThemedText>
        <ThemedText style={styles.verdictTitle}>{result.resultTitle}</ThemedText>
        {result.resultSubtitle ? <ThemedText style={styles.verdictSubtitle}>{result.resultSubtitle}</ThemedText> : null}
        {result.heroRead.map((line) => (
          <ThemedText key={line} style={styles.verdictHero}>
            {line}
          </ThemedText>
        ))}
        {result.mix ? (
          <View style={styles.mixBlock}>
            <ThemedText style={styles.mixLabel}>{result.mixLabel}</ThemedText>
            {result.mix.map((entry) => {
              const isPrimary = entry.id === result.resultId;
              return (
                <View key={entry.id} style={styles.mixRow}>
                  <ThemedText style={[styles.mixRowTitle, isPrimary && styles.mixRowTitlePrimary]}>
                    {entry.title}
                  </ThemedText>
                  <View style={styles.mixBarTrack}>
                    <View style={[styles.mixBarFill, { width: `${entry.percent}%` }, isPrimary && styles.mixBarFillPrimary]} />
                  </View>
                  <ThemedText style={[styles.mixRowPercent, isPrimary && styles.mixRowPercentPrimary]}>{entry.percent}%</ThemedText>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.meterBlock}>
            <ThemedText style={styles.meterPercent}>{result.percent}%</ThemedText>
            <ThemedText style={styles.meterLabel}>{result.meterLabel}</ThemedText>
          </View>
        )}
      </View>

      <View style={styles.whyCard}>
        <ThemedText style={styles.eyebrow}>WHY WE&apos;RE SAYING THAT</ThemedText>
        <ThemedText style={styles.whyBody}>{result.body}</ThemedText>
        <View style={styles.traitRow}>
          {result.traits.map((trait) => (
            <View key={trait} style={styles.traitPill}>
              <ThemedText style={styles.traitPillText}>{trait}</ThemedText>
            </View>
          ))}
        </View>
        <ThemedText style={styles.kicker}>{result.kicker}</ThemedText>
      </View>

      <Pressable onPress={onShare} style={styles.cta}>
        <ThemedText style={styles.ctaText}>Share this →</ThemedText>
      </Pressable>
      <Pressable onPress={onSeeYou} style={styles.secondaryCta}>
        <ThemedText style={styles.secondaryCtaText}>See what else we know →</ThemedText>
      </Pressable>
      <Pressable onPress={onTakeAnother} style={styles.tertiaryCta}>
        <ThemedText style={styles.tertiaryCtaText}>Take another quiz</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.five,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 28,
  },
  backButton: {
    minWidth: 60,
  },
  backText: {
    color: Brand.violet,
    fontSize: 14,
    fontWeight: '700',
  },
  // Intro-only exit — nothing is saved before the quiz starts, so this is a plain, honest
  // "leave" affordance, not styled as a branded action.
  closeButton: {
    minWidth: 44,
    minHeight: 32,
    justifyContent: 'center',
  },
  closeText: {
    color: Brand.inkSecondary,
    fontSize: 26,
    lineHeight: 26,
    fontWeight: '600',
  },
  progress: {
    color: Brand.inkSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  stepGap: {
    gap: Spacing.four,
  },
  growStep: {
    flexGrow: 1,
  },
  spacer: {
    flexGrow: 1,
  },
  introGap: {
    gap: Spacing.two,
  },
  eyebrow: {
    color: Brand.pink,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  introTitle: {
    color: Brand.ink,
    fontSize: 32,
    lineHeight: 37,
    fontWeight: '800',
    letterSpacing: -0.7,
  },
  subcopy: {
    color: Brand.inkSecondary,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  meta: {
    color: Brand.violet,
    fontSize: 13,
    fontWeight: '800',
    marginTop: Spacing.one,
  },
  introNote: {
    color: Brand.inkSecondary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: -Spacing.two,
  },
  cta: {
    backgroundColor: Brand.pink,
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five,
  },
  ctaDisabled: {
    opacity: 0.35,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryCta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderWidth: 1,
    borderColor: '#F0E6E8',
  },
  secondaryCtaText: {
    color: Brand.violet,
    fontSize: 15,
    fontWeight: '800',
  },
  tertiaryCta: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  tertiaryCtaText: {
    color: Brand.inkSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  questionPrompt: {
    color: Brand.ink,
    fontSize: 26,
    lineHeight: 31,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  choiceList: {
    gap: Spacing.two,
  },
  choiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 58,
    borderRadius: 16,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0E6E8',
  },
  choiceCardSelected: {
    backgroundColor: '#FFE5EF',
    borderColor: Brand.pink,
  },
  choiceBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F3FF',
  },
  choiceBadgeSelected: {
    backgroundColor: Brand.pink,
  },
  choiceBadgeText: {
    color: Brand.violet,
    fontSize: 12,
    fontWeight: '800',
  },
  choiceBadgeTextSelected: {
    color: '#FFFFFF',
  },
  choiceText: {
    flex: 1,
    color: Brand.ink,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '700',
  },
  choiceCheck: {
    color: Brand.pink,
    fontSize: 18,
    fontWeight: '800',
  },
  // The result "verdict" card is the screenshot-worthy moment — a deliberately different
  // treatment from Today's violet question card (same family, bigger occasion): violet base,
  // a large percent readout, generous padding.
  verdictCard: {
    backgroundColor: Brand.violet,
    borderRadius: 28,
    padding: Spacing.four,
    gap: Spacing.one,
    shadowColor: Brand.violet,
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  verdictEyebrow: {
    color: '#DCD6FF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  verdictTitle: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '900',
    letterSpacing: -0.6,
    marginTop: Spacing.one,
  },
  verdictSubtitle: {
    color: '#DCD6FF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
    marginTop: -Spacing.half,
  },
  verdictHero: {
    color: '#F1EEFF',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  },
  meterBlock: {
    marginTop: Spacing.three,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    gap: 2,
  },
  meterPercent: {
    color: '#FFFFFF',
    fontSize: 44,
    lineHeight: 48,
    fontWeight: '900',
  },
  meterLabel: {
    color: '#DCD6FF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  // Archetype quizzes' counterpart to meterBlock above — a labeled breakdown instead of one
  // number, sorted so the primary (highlighted) result naturally leads.
  mixBlock: {
    marginTop: Spacing.three,
    gap: Spacing.two,
  },
  mixLabel: {
    color: '#DCD6FF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.3,
    marginBottom: Spacing.half,
  },
  mixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  // Wide enough for the longest archetype names ("The Improviser", "The Commander") to
  // render on one line without truncating — the bar column (flex: 1) absorbs the difference,
  // so it's modestly narrower than before rather than the row needing to grow overall.
  // numberOfLines is deliberately not set here: if a future, longer archetype name ever
  // doesn't fit even at this width, it wraps cleanly instead of ellipsis-truncating.
  mixRowTitle: {
    width: 118,
    color: '#DCD6FF',
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '700',
  },
  mixRowTitlePrimary: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  mixBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.16)',
    overflow: 'hidden',
  },
  mixBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  mixBarFillPrimary: {
    backgroundColor: '#FFFFFF',
  },
  mixRowPercent: {
    width: 36,
    textAlign: 'right',
    color: '#DCD6FF',
    fontSize: 12,
    fontWeight: '700',
  },
  mixRowPercentPrimary: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  whyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: Spacing.four,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: '#F0E6E8',
  },
  whyBody: {
    color: Brand.ink,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  traitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  traitPill: {
    backgroundColor: '#F7F3FF',
    borderRadius: 99,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  traitPillText: {
    color: Brand.violet,
    fontSize: 13,
    fontWeight: '800',
  },
  kicker: {
    color: Brand.inkSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    fontStyle: 'italic',
    marginTop: Spacing.one,
  },
});
