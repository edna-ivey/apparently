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
import { hydrateUserProfile, useUserProfile } from '@/data/onboarding';
import { queuePendingQuizSubmission } from '@/data/quizzes/pending-quiz-submissions';
import { PRIVATE_LOCKED_CATALOG } from '@/data/quizzes/private-catalog';
import { hydrateQuizResults, saveQuizResult, useLatestQuizResult } from '@/data/quizzes/results';
import { computeQuizResult, reconstructResultDisplay, type ResultDisplay } from '@/data/quizzes/scoring';
import { useResponsiveContentWidth } from '@/hooks/use-responsive-content-width';
import { isRemoteDailyEnabled } from '@/lib/supabase';
import { createQuizShare } from '@/services/quiz-share-service';
import { submitQuizResultRemote, type SubmitQuizResultPayload } from '@/services/quiz-result-service';
import { useEffectivePremium } from '@/services/purchases-service';

export default function QuizScreen() {
  const { quizId, view } = useLocalSearchParams<{ quizId: string; view?: string }>();
  const router = useRouter();
  const contentWidth = useResponsiveContentWidth();
  const definition = getQuizDefinition(quizId);

  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const savedResult = useRef(false);
  // Tracks whether THIS FRESH completion's remote submission has landed — sharing must pin
  // the exact completion currently on screen, never an older one. 'synced' also covers the
  // ?view=result path (a saved result is, by definition, already a past completion whose own
  // remote submission either already succeeded earlier or never will — either way there is no
  // "in flight" state to wait for here).
  const [remoteSubmitState, setRemoteSubmitState] = useState<'synced' | 'pending' | 'failed'>('synced');

  // Local display name only — used to snapshot "who shared this" on a new share record.
  // Never synced/looked up remotely; the recipient never sees anything beyond this one
  // self-reported first name (see createQuizShare/get_shared_quiz_result).
  const userProfile = useUserProfile();
  useEffect(() => {
    void hydrateUserProfile();
  }, []);
  const sharerDisplayName = userProfile !== 'loading' && userProfile?.firstName?.trim() ? userProfile.firstName.trim() : null;

  // Called unconditionally (before the not-found early return below) to keep hook order
  // stable. Powers "See result →" from You: arriving with ?view=result jumps straight to the
  // last saved completion instead of restarting the quiz — see savedBand below.
  const latestResult = useLatestQuizResult(definition?.id ?? '');
  useEffect(() => {
    void hydrateQuizResults();
  }, []);

  // Readiness for a future real premium quiz (QuizAccess 'private') -- called unconditionally
  // to keep hook order stable, same as the hooks above. No REGISTERED quiz uses 'private'
  // access yet (only 'free' and 'private-preview' -- see QUIZ_REGISTRY), so this gate is
  // currently unreachable dead weight for every existing quiz; it exists so the moment a real
  // paid quiz is registered with access: 'private' in a future content sprint, it is
  // automatically gated correctly with zero additional wiring here.
  const isPremium = useEffectivePremium();

  // Not thrown/notFound — a quiz route reached with an unknown id (a stale link, a typo)
  // should land somewhere real rather than crash. Explore is the natural home.
  if (!definition) {
    return <Redirect href="/explore" />;
  }

  // A registered 'private' (premium-gated) quiz that this device doesn't have entitlement
  // for — send to the paywall rather than rendering any question/result content. Never
  // reachable today (see the comment above); this is forward-readiness only.
  if (definition.access === 'private' && !isPremium) {
    return <Redirect href="/paywall" />;
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
  // (savedResultDisplay) never re-saves, so re-opening "See result →" can't duplicate history
  // or resubmit remotely — this whole effect is skipped whenever a saved result is being
  // viewed instead of a live one just computed.
  useEffect(() => {
    if (savedResultDisplay) {
      savedResult.current = true;
      return;
    }
    if (step !== 'result' || !liveResult || savedResult.current) {
      return;
    }
    savedResult.current = true;

    // One timestamp, generated once, shared identically by the local record and the remote
    // submission below — never two separate `new Date()` calls, so local history and the
    // server's idempotency key always agree on what "this completion" means.
    const completedAt = new Date().toISOString();
    const mix = liveResult.mix ? Object.fromEntries(liveResult.mix.map((entry) => [entry.id, entry.percent])) : undefined;

    void saveQuizResult({
      quizId: definition.id,
      completedAt,
      score: liveResult.score,
      percent: liveResult.percent,
      resultId: liveResult.resultId,
      resultTitle: liveResult.resultTitle,
      traits: liveResult.traits,
      mix,
    });

    if (isRemoteDailyEnabled) {
      setRemoteSubmitState('pending');
      // Explicit code-level gate, independent of whether this result happens to author any
      // profileSignals: a quiz marked contributesToProfile: false (its You-profile mapping
      // isn't approved yet — see keep-you-around.ts) must never send profile_effects at all,
      // so submit_quiz_result can never write personality_evidence for it regardless of
      // future content changes to this quiz's results.
      const contributesToProfile = definition.contributesToProfile !== false;
      const payload: SubmitQuizResultPayload = {
        quizId: definition.id,
        quizTitle: definition.title,
        quizCategory: definition.category,
        completedAt,
        questionCount: definition.questions.length,
        score: liveResult.score,
        percent: liveResult.percent,
        resultId: liveResult.resultId,
        resultTitle: liveResult.resultTitle,
        traits: liveResult.traits,
        mix,
        profileSignals: contributesToProfile ? liveResult.profileSignals : undefined,
        // Compare's exact-match-count needs the owner's raw answer map. `answers` (component
        // state) is only ever populated on a FRESH completion — never sent on the ?view=result
        // read-only path, since this whole branch only runs there in the first place.
        answers,
      };
      // Never blocks the result screen — it already renders from local `result` state
      // regardless of this call. A failure queues the payload for a later retry (You
      // opening, app/session init — see pending-quiz-submissions.ts) instead of silently
      // dropping this completion's profile contribution. remoteSubmitState gates sharing
      // below: creating a share record before this lands could otherwise pin an OLDER
      // completion of the same quiz (create_quiz_share pins the caller's latest quiz_results
      // row) instead of the one currently on screen.
      void (async () => {
        const remoteResult = await submitQuizResultRemote(payload);
        if (remoteResult.ok) {
          setRemoteSubmitState('synced');
        } else {
          setRemoteSubmitState('failed');
          await queuePendingQuizSubmission(payload);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, savedResultDisplay]);

  // Shared by handleShare and handleAskForNotes below — both need a share link pinned to
  // THIS exact completion (never an older one), so the "synced" gating and fallback are
  // identical either way; only the eventual Share.share message text differs.
  const createShareUrl = async (): Promise<string> => {
    let shareUrl = `${APP_URL}/quiz/${definition.id}`;
    if (isRemoteDailyEnabled && remoteSubmitState === 'synced') {
      const shareResult = await createQuizShare(definition.id, sharerDisplayName);
      if (shareResult.ok) {
        shareUrl = `${APP_URL}/s/${shareResult.shareId}`;
      }
    }
    return shareUrl;
  };

  const handleShare = async () => {
    if (!result) {
      return;
    }
    try {
      // Result-first sharing: point the link at the shared-result landing (/s/[token]) rather
      // than the raw quiz, so whoever opens it sees this result FIRST instead of an unanswered
      // quiz. Only attempted once this specific completion's own remote row is confirmed
      // synced (see remoteSubmitState above) — otherwise falls back to the previous plain quiz
      // link rather than risk pinning a stale/older completion.
      const shareUrl = await createShareUrl();
      await Share.share({
        message: `I got ${result.resultDisplayTitle} on Apparently You 😂\n${definition.title}\n${shareUrl}`,
      });
    } catch {
      // Share can reject/cancel (user dismissed the sheet, or no share target available on
      // this platform/context) — nothing to recover, the result card itself is still on
      // screen and screenshot-able.
    }
  };

  // "THEY HAVE NOTES." — same share link AND same message text as handleShare (still pinned
  // to this exact completion): the recipient landing (/s/[token]) already offers "Give my
  // version of [Name] →" itself, so this CTA is simply a second, friend-focused entry point
  // into the identical share link — no separate native-share copy is invented here. Only
  // offered for structuredRead (Apparently Private) results — see ResultScreen below.
  const handleAskForNotes = async () => {
    if (!result) {
      return;
    }
    try {
      const shareUrl = await createShareUrl();
      await Share.share({
        message: `I got ${result.resultDisplayTitle} on Apparently You 😂\n${definition.title}\n${shareUrl}`,
      });
    } catch {
      // Same non-fatal dismiss/no-target handling as handleShare.
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
              isPrivatePreview={definition.access === 'private-preview'}
              onShare={handleShare}
              onAskForNotes={handleAskForNotes}
              onSeeYou={() => router.push('/you')}
              onTakeAnother={() => router.push('/explore')}
              onBackToPrivate={() => router.push('/private')}
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
  isPrivatePreview,
  onShare,
  onAskForNotes,
  onSeeYou,
  onTakeAnother,
  onBackToPrivate,
}: {
  result: ResultDisplay;
  isPrivatePreview: boolean;
  onShare: () => void;
  onAskForNotes: () => void;
  onSeeYou: () => void;
  onTakeAnother: () => void;
  onBackToPrivate: () => void;
}) {
  return (
    <View style={styles.stepGap}>
      {result.structuredRead ? <PrivateStructuredResult result={result} /> : <StandardResultCard result={result} />}

      <Pressable onPress={onShare} style={styles.cta}>
        <ThemedText style={styles.ctaText}>Share this →</ThemedText>
      </Pressable>

      {/* "THEY HAVE NOTES." invite — only for Apparently Private's structuredRead results
          (the two quizzes Compare's friend-answering flow supports). A standard quiz result
          keeps exactly its previous three-button layout, unchanged. */}
      {result.structuredRead && (
        <View style={styles.notesCard}>
          <ThemedText style={styles.notesEyebrow}>THEY HAVE NOTES. {'\u{1F440}'}</ThemedText>
          <ThemedText style={styles.notesBody}>You&apos;ve told us your version.</ThemedText>
          <ThemedText style={styles.notesBody}>Now ask somebody who knows too much.</ThemedText>
          <Pressable onPress={onAskForNotes} style={styles.notesCta}>
            <ThemedText style={styles.notesCtaText}>Ask somebody who knows too much →</ThemedText>
          </Pressable>
        </View>
      )}

      <Pressable onPress={onSeeYou} style={styles.secondaryCta}>
        <ThemedText style={styles.secondaryCtaText}>See what else we know →</ThemedText>
      </Pressable>
      <Pressable onPress={onTakeAnother} style={styles.tertiaryCta}>
        <ThemedText style={styles.tertiaryCtaText}>Take another quiz</ThemedText>
      </Pressable>

      {isPrivatePreview && <PrivateCuriosityCard onBackToPrivate={onBackToPrivate} />}
    </View>
  );
}

// The standard, generic result presentation — every quiz except one using structuredRead
// (see PrivateStructuredResult below). Byte-for-byte the same markup that lived inline in
// ResultScreen before this quiz needed a second layout; unchanged for every existing quiz.
function StandardResultCard({ result }: { result: ResultDisplay }) {
  return (
    <>
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
    </>
  );
}

// Apparently Private's own structured result layout (THE READ / THE CALL-OUT / THE COST /
// TRY THIS) — used ONLY when result.structuredRead is set (currently keep-you-around).
// Deliberately does not render result.mix/result.percent/any five-way breakdown — Apparently
// Private shows exactly one primary result, plus an optional qualifying close second's TITLE
// only (never invented prose for it — see scoring.ts's pickCloseSecond).
function PrivateStructuredResult({ result }: { result: ResultDisplay }) {
  const read = result.structuredRead!;
  return (
    <View style={styles.verdictCard}>
      <ThemedText style={styles.verdictEyebrow}>THE VERDICT</ThemedText>
      <ThemedText style={styles.verdictTitle}>{result.resultTitle}</ThemedText>

      <View style={styles.privateSection}>
        <ThemedText style={styles.privateSectionHeading}>THE READ</ThemedText>
        {read.theRead.map((line, index) => (
          <ThemedText key={`the-read-${index}`} style={styles.privateSectionBody}>
            {line}
          </ThemedText>
        ))}
      </View>

      <View style={styles.privateSection}>
        <ThemedText style={styles.privateSectionHeading}>THE CALL-OUT</ThemedText>
        {read.theCallOut.map((line, index) => (
          <ThemedText key={`the-call-out-${index}`} style={styles.privateSectionBody}>
            {line}
          </ThemedText>
        ))}
      </View>

      <View style={styles.privateSection}>
        <ThemedText style={styles.privateSectionHeading}>THE COST</ThemedText>
        {read.theCost.map((line, index) => (
          <ThemedText key={`the-cost-${index}`} style={styles.privateSectionBody}>
            {line}
          </ThemedText>
        ))}
      </View>

      <View style={styles.privateSection}>
        <ThemedText style={styles.privateSectionHeading}>TRY THIS</ThemedText>
        {read.tryThis.map((line, index) => (
          <ThemedText key={`try-this-${index}`} style={styles.privateSectionBody}>
            {line}
          </ThemedText>
        ))}
      </View>

      {result.secondaryResult && (
        <View style={styles.closeSecondBlock}>
          <ThemedText style={styles.closeSecondEyebrow}>BUT THERE&apos;S ALSO THIS...</ThemedText>
          <ThemedText style={styles.closeSecondTitle}>{result.secondaryResult.resultDisplayTitle.toUpperCase()}</ThemedText>
        </View>
      )}
    </View>
  );
}

// Purely a curiosity nudge after the ONE free Private preview — never blocks "See what else we
// know →" above (You always stays reachable), never shows a price, never claims payment
// exists. A fixed, small curated sample from the locked catalog rather than the whole thing —
// this is a taste, not a menu.
const PRIVATE_CURIOSITY_IDS = ['shadow-side-blind-spot', 'love-soulmates-destined', 'career-ambition-made-for', 'life-match-city'];

function PrivateCuriosityCard({ onBackToPrivate }: { onBackToPrivate: () => void }) {
  const sample = PRIVATE_LOCKED_CATALOG.filter((entry) => PRIVATE_CURIOSITY_IDS.includes(entry.id));
  return (
    <View style={styles.curiosityCard}>
      <ThemedText style={styles.curiosityEyebrow}>THAT WAS THE FREE ONE. 👀</ThemedText>
      <ThemedText style={styles.curiosityBody}>Apparently Private gets a little more personal.</ThemedText>
      <View style={styles.curiosityList}>
        {sample.map((entry) => (
          <ThemedText key={entry.id} style={styles.curiosityItem}>
            {entry.title}
          </ThemedText>
        ))}
      </View>
      <Pressable onPress={onBackToPrivate} style={styles.curiosityCta}>
        <ThemedText style={styles.curiosityCtaText}>Back to Private →</ThemedText>
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
  // The post-preview curiosity nudge — plum, distinct from the cream result cards above it,
  // so it visibly reads as "a different room" the same way the Private portal card does.
  curiosityCard: {
    backgroundColor: Brand.plum,
    borderRadius: 24,
    padding: Spacing.four,
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  curiosityEyebrow: {
    color: Brand.coral,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  curiosityBody: {
    color: Brand.cream,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  curiosityList: {
    gap: Spacing.one,
  },
  curiosityItem: {
    color: 'rgba(255,249,245,0.75)',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  curiosityCta: {
    alignSelf: 'flex-start',
    backgroundColor: Brand.coral,
    borderRadius: 14,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    marginTop: Spacing.one,
  },
  curiosityCtaText: {
    color: Brand.plum,
    fontSize: 14,
    fontWeight: '800',
  },
  // "THEY HAVE NOTES." invite — a distinct violet card (matching the Compare comparison
  // panel's own palette, see compare-result-panel.tsx) between the standard share CTA and
  // "See what else we know", so it visibly reads as its own beat rather than a fourth button.
  notesCard: {
    backgroundColor: Brand.violet,
    borderRadius: 24,
    padding: Spacing.four,
    gap: Spacing.one,
  },
  notesEyebrow: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  notesBody: {
    color: '#F1EEFF',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '700',
  },
  notesCta: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    marginTop: Spacing.one,
  },
  notesCtaText: {
    color: Brand.violet,
    fontSize: 14,
    fontWeight: '800',
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
  // Apparently Private's structured result sections (THE READ / THE CALL-OUT / THE COST /
  // TRY THIS) — same violet verdict card as every other quiz's hero read, just with an
  // explicit heading per beat instead of one continuous hero/body/kicker flow.
  privateSection: {
    marginTop: Spacing.three,
    gap: Spacing.one,
  },
  privateSectionHeading: {
    color: '#DCD6FF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  privateSectionBody: {
    color: '#F1EEFF',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  closeSecondBlock: {
    marginTop: Spacing.four,
    paddingTop: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.16)',
    gap: 2,
  },
  closeSecondEyebrow: {
    color: '#DCD6FF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  closeSecondTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '900',
    letterSpacing: -0.3,
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
