import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { APP_URL } from '@/constants/app';
import { Brand, Spacing } from '@/constants/theme';
import { Radius } from '@/constants/design-system';
import { Celestial, CelestialType, CelestialWash, PortalRings } from '@/components/today/celestial';
import { isAdultEligible, setAgeEligibilityOnce, useAgeEligibility } from '@/data/age-eligibility';
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
import { submitQuizPoleEvidence } from '@/services/personality-v2-service';
import { useEffectivePremium } from '@/services/purchases-service';
import { useAdEligibility } from '@/services/ad-eligibility-service';
import { showInterstitialIfDue } from '@/services/ad-interstitial-service';
import { logAnalyticsEvent } from '@/services/analytics-service';

export default function QuizScreen() {
  const { quizId, view } = useLocalSearchParams<{ quizId: string; view?: string }>();
  const router = useRouter();
  const contentWidth = useResponsiveContentWidth();
  const definition = getQuizDefinition(quizId);

  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const savedResult = useRef(false);
  // Build 12 real-device fix: the ScrollView is never remounted across questions (only its
  // children swap), and nothing was resetting its scroll offset on Next/Back. A user who
  // scrolled even slightly to read a long question kept that same offset on the NEXT question
  // too -- which visually clips the top of the new prompt (the question itself, not the
  // answers) off the top edge, exactly matching "the question is cut off on some questions"
  // and exactly the kind of bug a static/source-only validator can never catch, since it
  // depends on real multi-question navigation + scroll state, not layout config alone.
  const scrollViewRef = useRef<ScrollView>(null);
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
  // Scroll to the top of the new step every time it changes (Next, Back, or landing on the
  // very first question) so a question is never rendered starting mid-scroll from wherever the
  // PREVIOUS question happened to leave the ScrollView -- see scrollViewRef's own comment above
  // for why this was clipping the TOP of long questions specifically. animated:false is
  // deliberate: this must already be in place before paint, never animate into view.
  useEffect(() => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  }, [stepIndex]);
  const sharerDisplayName = userProfile !== 'loading' && userProfile?.firstName?.trim() ? userProfile.firstName.trim() : null;

  // Called unconditionally (before the not-found early return below) to keep hook order
  // stable. Powers "See result →" from You: arriving with ?view=result jumps straight to the
  // last saved completion instead of restarting the quiz — see savedBand below.
  const latestResult = useLatestQuizResult(definition?.id ?? '');
  useEffect(() => {
    void hydrateQuizResults();
  }, []);

  // Real RevenueCat entitlement -- called unconditionally to keep hook order stable, same as
  // the hooks above. Gates the 7 registered premium Apparently Private quizzes (access:
  // 'private' -- see QUIZ_REGISTRY) below; 'free' and 'private-preview' quizzes never consult
  // this at all.
  const isPremium = useEffectivePremium();

  // Build 16: 18+ gate for the one 'Private Private. 😈' category quiz -- called
  // unconditionally for the same Rules-of-Hooks reason as every hook above. Premium
  // entitlement never substitutes for this: a subscriber who is 13-17 still needs to pass this
  // check, enforced for real server-side in submit_quiz_result (see the staged migration) --
  // this client-side check only controls what renders; it is never the actual authorization.
  const ageEligibility = useAgeEligibility();

  // The following derived values and the submission effect below are computed BEFORE the
  // !definition / premium-gate early returns (unlike the render-only values further down in
  // this file) specifically because the submission effect is a HOOK (useEffect) and must be
  // called unconditionally on every render per the Rules of Hooks -- it cannot sit after an
  // early return, or this component's hook call order would differ between a render that
  // redirects and one that doesn't. Each value below is null-safe for a missing `definition`
  // so the effect's own internal `!liveResult` guard naturally no-ops in that case, exactly
  // preserving this effect's old behavior of "does nothing when there's no real quiz."
  const wantsSavedResult = view === 'result';
  // The persisted record deliberately doesn't carry heroRead/body/kicker/mix titles (avoids
  // duplicated copy — see results.ts) — reconstructResultDisplay re-derives the full result
  // from resultId, for either scoring type. This is the "See result →" path from You.
  const savedResultDisplay: ResultDisplay | null =
    definition && wantsSavedResult && latestResult && latestResult !== 'loading'
      ? reconstructResultDisplay(definition, latestResult)
      : null;

  const stepOrder: string[] = definition ? ['intro', ...definition.questions.map((question) => question.id), 'result'] : ['intro', 'result'];
  const step = savedResultDisplay ? 'result' : stepOrder[stepIndex] ?? 'intro';

  // computeQuizResult is the ONE place scoringType branching happens for a fresh completion —
  // this screen never special-cases numericBand vs archetype itself.
  const liveResult: ResultDisplay | null = definition && !savedResultDisplay && step === 'result' ? computeQuizResult(definition, answers) : null;

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
    if (step !== 'result' || !liveResult || !definition || savedResult.current) {
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
      // This marks the start of a real network submission this same effect is about to kick
      // off a few lines below (submitQuizResultRemote) -- there is no render-time equivalent
      // for "an imperative side effect just started," which is exactly what useEffect exists
      // for. Scoped to this one line, not the rule or file.
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
          // Build 16: Scoring V2 additive write, alongside (never instead of) the
          // submit_quiz_result completion above. Needs the real quiz_results row id that call
          // just returned, so it can only run after that succeeds -- never blocks or affects
          // remoteSubmitState, which already reflects the V1 completion that matters for
          // sharing/history. A no-op for a quiz with no V2 calibration seeded; see
          // personality-v2-service.ts.
          if (remoteResult.quizResultId) {
            void submitQuizPoleEvidence(definition.id, remoteResult.quizResultId, answers);
          }
        } else {
          setRemoteSubmitState('failed');
          await queuePendingQuizSubmission(payload);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, savedResultDisplay]);

  // Advertising, 2026-10-22: the pre-reveal quiz interstitial. Deliberately a SEPARATE effect
  // from the save/submit effect above -- the result is already computed and persisted by that
  // effect regardless of this one (task requirement: "Calculate and persist the result before
  // requesting or presenting the ad"). This effect only ever delays the RESULT SCREEN'S OWN
  // RENDER, never the computation or submission that already happened above. Only ever runs
  // for a genuinely free, public quiz (access === 'free') -- 'private-preview'/'private' quizzes
  // live inside Apparently Private, which must stay completely ad-free, and skip straight to
  // showing the result with no gate at all. A revisited saved result (savedResultDisplay) never
  // re-triggers this either -- the ad is a once-per-fresh-completion moment, never shown again
  // for "See result →".
  const adGateStarted = useRef(false);
  // Only ever set true from an async callback (the ad-resolution callback below, or the
  // bounded safety-timeout effect further down) -- every "skip the ad entirely" case
  // (revisited saved result, non-free quiz, status resolved-and-ineligible) is a plain derived
  // boolean computed at render time just below instead of a setState call, so the main effect
  // never calls setState synchronously from its own body.
  const [freshCompletionAdResolved, setFreshCompletionAdResolved] = useState(false);
  const adEligibility = useAdEligibility('quizInterstitial');
  // While subscription status is still resolving (adEligibility.statusUncertain) for a free
  // quiz, this deliberately stays false -- the brief "Pulling your read together…" wait is for
  // a genuine pending check, not an ad failure, and the safety-timeout effect below bounds it
  // regardless so it can never become an indefinite stall.
  const adGatePassed =
    savedResultDisplay !== null ||
    definition?.access !== 'free' ||
    freshCompletionAdResolved ||
    (!adEligibility.statusUncertain && !adEligibility.eligible);
  useEffect(() => {
    if (savedResultDisplay || step !== 'result' || !definition || adGateStarted.current) {
      return;
    }
    // Wait for a real (non-uncertain) eligibility answer before locking in a decision -- this
    // effect's own dependency array includes adEligibility.statusUncertain/.eligible precisely
    // so it re-fires the moment subscription status actually resolves, rather than acting on a
    // premature 'loading' snapshot.
    if (definition.access === 'free' && adEligibility.statusUncertain) {
      return;
    }
    adGateStarted.current = true;

    logAnalyticsEvent({ name: 'quiz_completed', properties: { quiz_id: definition.id } });

    if (definition.access !== 'free' || !adEligibility.eligible) {
      logAnalyticsEvent({ name: 'result_revealed', properties: { quiz_id: definition.id, ad_shown: false } });
      return;
    }

    logAnalyticsEvent({ name: 'ad_eligible', properties: { placement: 'quiz_interstitial' } });
    logAnalyticsEvent({ name: 'ad_placement_variant', properties: { placement: 'quiz_interstitial', variant: 'pre-reveal' } });
    void showInterstitialIfDue('quiz_interstitial', !adEligibility.personalizedAdsAllowed).then((adShown) => {
      setFreshCompletionAdResolved(true);
      logAnalyticsEvent({ name: 'result_revealed', properties: { quiz_id: definition.id, ad_shown: adShown } });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, savedResultDisplay, adEligibility.statusUncertain, adEligibility.eligible]);

  // Safety net (task requirement: never delay access to an earned result): if subscription
  // status somehow never resolves, this forces the result through anyway after a bounded wait,
  // completely independent of the ad-load timeout above (which only bounds an AD that's already
  // loading -- this bounds the ELIGIBILITY CHECK itself, a different failure mode). Fails safe
  // -- forcing through means "no ad," never "show one without a resolved eligibility answer."
  useEffect(() => {
    if (savedResultDisplay || step !== 'result' || !definition || definition.access !== 'free' || freshCompletionAdResolved) {
      return;
    }
    const timer = setTimeout(() => setFreshCompletionAdResolved(true), 5000);
    return () => clearTimeout(timer);
  }, [step, savedResultDisplay, definition, freshCompletionAdResolved]);

  // Not thrown/notFound — a quiz route reached with an unknown id (a stale link, a typo)
  // should land somewhere real rather than crash. Explore is the natural home.
  if (!definition) {
    return <Redirect href="/explore" />;
  }

  // A registered 'private' (premium-gated) quiz that this device doesn't have entitlement
  // for — send to the paywall rather than rendering any question/result content. The 7
  // premium Apparently Private quizzes (career-ambition-how-bad, career-ambition-proving,
  // hidden-you-wrong, life-match-dream-life, love-soulmates-ready, private-private-trouble,
  // style-vibe-intimidating) all use access: 'private' and hit this gate on web/unentitled
  // devices today — see useEffectivePremium's own comment for how entitlement is determined.
  if (definition.access === 'private' && !isPremium) {
    return <Redirect href="/paywall" />;
  }

  // Build 16: the one 'Private Private. 😈' category quiz additionally requires 18+,
  // independent of (and checked after) premium entitlement above. 'loading' briefly shows
  // nothing extra -- the premium gate above has already resolved by the time this value is
  // read, so this is a short, real loading window, not a stuck state. null (never asked, e.g.
  // a pre-Build-16 account) gets a one-time confirmation prompt rather than a permanent block.
  if (definition.id === 'private-private-trouble' && ageEligibility !== 'loading' && !isAdultEligible(ageEligibility)) {
    return <AgeEligibilityGate status={ageEligibility} />;
  }

  const questionIndex = savedResultDisplay ? -1 : definition.questions.findIndex((question) => question.id === step);
  const currentQuestion: QuizQuestion | null = questionIndex >= 0 ? definition.questions[questionIndex] : null;
  const isLastQuestion = questionIndex === definition.questions.length - 1;

  const goNext = () => setStepIndex((index) => Math.min(index + 1, stepOrder.length - 1));
  const goBack = () => setStepIndex((index) => Math.max(index - 1, 0));

  const selectAnswer = (questionId: string, choiceId: string) => {
    setAnswers((previous) => ({ ...previous, [questionId]: choiceId }));
  };

  const result: ResultDisplay | null = savedResultDisplay ?? liveResult;

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

  // Audit finding (2026-10-21): 'private-private-trouble' is the one 18+-gated quiz, but
  // /s/[token] (the public shared-result landing) has NO session or age check at all -- it's
  // deliberately reachable by a fully anonymous web visitor of any age. A completed result
  // here contains the quiz's own mature/suggestive-themed copy (flirting, attraction,
  // chemistry -- see private-private-trouble.ts), so sharing it would hand that content to
  // anyone with the link, bypassing the 18+ gate entirely. Blocked here (never offered) AND
  // server-side in create_quiz_share/get_shared_quiz_result (see the staged migration) -- this
  // client check alone would never be sufficient on its own.
  const isShareRestricted = definition.id === 'private-private-trouble';

  const handleShare = async () => {
    if (!result || isShareRestricted) {
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
    if (!result || isShareRestricted) {
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
        <PortalRings />
        <CelestialWash />
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
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

          {step === 'result' && result && !adGatePassed && (
            <View style={styles.adGateWait}>
              <ThemedText style={styles.progress}>Pulling your read together…</ThemedText>
            </View>
          )}

          {step === 'result' && result && adGatePassed && (
            <ResultScreen
              result={result}
              isPrivatePreview={definition.access === 'private-preview'}
              canShare={!isShareRestricted}
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
      <ThemedText style={styles.wordmark}>apparently you.</ThemedText>
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
    <View style={styles.stepGap}>
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
      <Pressable disabled={!canContinue} onPress={onNext} style={[styles.cta, !canContinue && styles.ctaDisabled]}>
        <ThemedText style={styles.ctaText}>{isLastQuestion ? 'Read me →' : 'Next →'}</ThemedText>
      </Pressable>
    </View>
  );
}

function ResultScreen({
  result,
  isPrivatePreview,
  canShare,
  onShare,
  onAskForNotes,
  onSeeYou,
  onTakeAnother,
  onBackToPrivate,
}: {
  result: ResultDisplay;
  isPrivatePreview: boolean;
  canShare: boolean;
  onShare: () => void;
  onAskForNotes: () => void;
  onSeeYou: () => void;
  onTakeAnother: () => void;
  onBackToPrivate: () => void;
}) {
  return (
    <View style={styles.stepGap}>
      {result.structuredRead ? <PrivateStructuredResult result={result} /> : <StandardResultCard result={result} />}

      {/* canShare is false only for 'private-private-trouble' -- see isShareRestricted's
          comment above. The public /s/[token] landing has no age check, so this 18+ result
          is never offered a shareable link at all, not even a disabled-looking one. */}
      {canShare && (
        <Pressable onPress={onShare} style={styles.cta}>
          <ThemedText style={styles.ctaText}>Share this →</ThemedText>
        </Pressable>
      )}

      {/* "THEY HAVE NOTES." invite — only for Apparently Private's structuredRead results
          (the two quizzes Compare's friend-answering flow supports). A standard quiz result
          keeps exactly its previous three-button layout, unchanged. */}
      {result.structuredRead && canShare && (
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
        <View pointerEvents="none" style={styles.verdictGlow} />
        <ThemedText style={styles.verdictSparkle} accessibilityElementsHidden importantForAccessibility="no">
          ✦
        </ThemedText>
        <ThemedText style={styles.verdictEyebrow}>THE VERDICT</ThemedText>
        <ThemedText style={styles.verdictTitle}>{result.resultTitle}</ThemedText>
        {result.resultSubtitle ? <ThemedText style={styles.verdictSubtitle}>{result.resultSubtitle}</ThemedText> : null}
        {result.heroRead.map((line) => (
          <ThemedText key={line} style={styles.verdictHero}>
            {line}
          </ThemedText>
        ))}
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
      <View pointerEvents="none" style={styles.verdictGlow} />
      <ThemedText style={styles.verdictSparkle} accessibilityElementsHidden importantForAccessibility="no">
        ✦
      </ThemedText>
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

      {/* Not every approved result has a COST/TRY THIS section (e.g. career-ambition-how-bad's
          want-it-for-real, love-soulmates-ready's open) -- rendering the heading unconditionally
          previously showed a bare "THE COST"/"TRY THIS" label with nothing beneath it. */}
      {read.theCost.length > 0 && (
        <View style={styles.privateSection}>
          <ThemedText style={styles.privateSectionHeading}>THE COST</ThemedText>
          {read.theCost.map((line, index) => (
            <ThemedText key={`the-cost-${index}`} style={styles.privateSectionBody}>
              {line}
            </ThemedText>
          ))}
        </View>
      )}

      {read.tryThis.length > 0 && (
        <View style={styles.privateSection}>
          <ThemedText style={styles.privateSectionHeading}>TRY THIS</ThemedText>
          {read.tryThis.map((line, index) => (
            <ThemedText key={`try-this-${index}`} style={styles.privateSectionBody}>
              {line}
            </ThemedText>
          ))}
        </View>
      )}

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

// Build 16: renders in place of the quiz for 'private-private-trouble' whenever the device
// isn't confirmed 18+ -- see the age-gate check above. status === null (never asked, e.g. a
// pre-Build-16 account) gets a one-time self-attestation prompt rather than a permanent
// block; status === '13to17' gets a plain, honest "this needs 18+" message with no prompt
// (a 13-17 answer is final -- see setAgeEligibilityOnce's set-once semantics). This is a
// CLIENT-SIDE UX gate only -- the real authorization is is_adult_eligible() inside
// submit_quiz_result (staged migration), which this screen's own answer selection can never
// bypass even if someone patched this component out.
function AgeEligibilityGate({ status }: { status: '13to17' | '18plus' | null }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  const handleConfirmAdult = async () => {
    setConfirming(true);
    await setAgeEligibilityOnce('18plus');
    setConfirming(false);
  };
  const handleDeclineAdult = async () => {
    await setAgeEligibilityOnce('13to17');
  };

  return (
    <ThemedView style={styles.ageGateContainer}>
      <SafeAreaView style={styles.ageGateSafeArea}>
        <View style={styles.ageGateContent}>
          <ThemedText style={styles.ageGateEyebrow}>18+ ONLY</ThemedText>
          {status === '13to17' ? (
            <ThemedText style={styles.ageGateBody}>This content is for ages 18 and up.</ThemedText>
          ) : (
            <>
              <ThemedText style={styles.ageGateBody}>Confirm you&apos;re 18 or older to continue.</ThemedText>
              <Pressable style={styles.ageGateCta} onPress={() => void handleConfirmAdult()} disabled={confirming}>
                <ThemedText style={styles.ageGateCtaText}>{confirming ? 'Confirming…' : "I'm 18 or older"}</ThemedText>
              </Pressable>
              <Pressable style={styles.ageGateSecondaryCta} onPress={() => void handleDeclineAdult()}>
                <ThemedText style={styles.ageGateSecondaryCtaText}>I&apos;m under 18</ThemedText>
              </Pressable>
            </>
          )}
          <Pressable onPress={() => router.replace('/private')} style={styles.ageGateBackLink}>
            <ThemedText style={styles.ageGateBackLinkText}>← Back to Private</ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

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
  ageGateContainer: { flex: 1, backgroundColor: Celestial.background },
  ageGateSafeArea: { flex: 1 },
  ageGateContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.five, gap: Spacing.three },
  ageGateEyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.3, color: Brand.gold },
  ageGateBody: { color: Celestial.textPrimary, fontSize: 16, lineHeight: 23, fontWeight: '600', textAlign: 'center', maxWidth: 320 },
  ageGateCta: { backgroundColor: Brand.gold, borderRadius: Radius.sm, paddingHorizontal: Spacing.four, paddingVertical: Spacing.two, marginTop: Spacing.two },
  ageGateCtaText: { color: Brand.plum, fontSize: 14, fontWeight: '800' },
  ageGateSecondaryCta: { paddingVertical: Spacing.one },
  ageGateSecondaryCtaText: { color: Celestial.textSecondary, fontSize: 14, fontWeight: '700' },
  ageGateBackLink: { marginTop: Spacing.four },
  ageGateBackLinkText: { color: Celestial.textMuted, fontSize: 13, fontWeight: '600' },

  container: {
    flex: 1,
    backgroundColor: '#17000F',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: Celestial.background,
    ...Platform.select({
      web: {
        marginVertical: 28,
        borderRadius: 28,
        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.35)',
        overflow: 'hidden',
      },
      default: {},
    }),
  },
  // Without an explicit bounded style on the ScrollView itself (flexGrow on
  // contentContainerStyle alone isn't enough on native iOS), the ScrollView's own frame can
  // grow to match its content instead of staying clamped to the visible screen — so long
  // questions/answers that exceed one screen render past the bottom edge with no way to
  // reach them, instead of the content scrolling inside a fixed viewport. This reproduced
  // only on a real device, not the web preview (react-native-web always bounds scroll
  // containers via CSS regardless of this style).
  scrollView: {
    flex: 1,
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
    color: Brand.gold,
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
    color: Celestial.textSecondary,
    fontSize: 26,
    lineHeight: 26,
    fontWeight: '600',
  },
  progress: {
    color: Celestial.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  // Brief transitional state while the pre-reveal ad gate resolves (ad shown+closed, skipped,
  // or timed out) -- the result itself is already computed/persisted by this point; this is
  // purely a visual bridge, never a real loading state for the result itself.
  adGateWait: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
  },
  stepGap: {
    gap: Spacing.four,
  },
  wordmark: { color: Celestial.textPrimary, fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  introGap: {
    gap: Spacing.two,
  },
  eyebrow: CelestialType.eyebrow,
  // Build 15: unified type scale -- a quiz intro title is a witty editorial headline, same
  // serif-italic treatment as Explore/Private's own page headlines, replacing the old 32px
  // bold-sans heading that read as "generic oversized heading" out of step with the rest of
  // the app.
  introTitle: {
    ...CelestialType.editorialHeadline,
    fontSize: 28,
    lineHeight: 33,
  },
  subcopy: {
    color: Celestial.textSecondary,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  meta: {
    color: Brand.gold,
    fontSize: 13,
    fontWeight: '800',
    marginTop: Spacing.one,
  },
  introNote: {
    color: Celestial.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: -Spacing.two,
  },
  cta: {
    backgroundColor: Brand.gold,
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five,
  },
  ctaDisabled: {
    opacity: 0.35,
  },
  ctaText: {
    color: Brand.plum,
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryCta: {
    backgroundColor: Celestial.glassFill,
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderWidth: 1,
    borderColor: Celestial.glassBorder,
  },
  secondaryCtaText: {
    color: Celestial.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  tertiaryCta: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  tertiaryCtaText: {
    color: Celestial.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  // The post-preview curiosity nudge — a deeper, coral-bordered panel, distinct from the
  // violet verdict cards above it, so it still reads as "a different room" on the dark ground.
  curiosityCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,121,95,0.3)',
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
  // Build 15: same serif-italic question treatment Today's own Daily prompt uses -- a
  // personality-driven question reads as personality-driven everywhere now, not bold-sans
  // here and serif-italic there.
  questionPrompt: {
    ...CelestialType.question,
    fontSize: 24,
    lineHeight: 30,
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
    backgroundColor: Celestial.glassFill,
    borderWidth: 1,
    borderColor: Celestial.glassBorder,
  },
  choiceCardSelected: {
    backgroundColor: 'rgba(246,184,63,0.14)',
    borderColor: Brand.gold,
  },
  choiceBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  choiceBadgeSelected: {
    backgroundColor: Brand.gold,
  },
  choiceBadgeText: {
    color: Celestial.textSecondary,
    fontSize: 12,
    fontWeight: '800',
  },
  choiceBadgeTextSelected: {
    color: Brand.plum,
  },
  choiceText: {
    flex: 1,
    color: Celestial.textPrimary,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '700',
  },
  choiceCheck: {
    color: Brand.gold,
    fontSize: 18,
    fontWeight: '800',
  },
  // The result "verdict" card is the screenshot-worthy moment — a deliberately different
  // treatment from Today's violet question card (same family, bigger occasion): violet base,
  // a large percent readout, generous padding.
  // Build 15 "share-worthy result": kept the violet base (the app's established "big occasion"
  // card), added a soft radial glow + a decorative sparkle so the card reads as a collectible
  // reveal moment rather than a flat information card -- the one thing in the app a user should
  // want to screenshot.
  verdictCard: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: Brand.violet,
    borderRadius: 28,
    padding: Spacing.four,
    gap: Spacing.one,
    shadowColor: Brand.violet,
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  verdictGlow: {
    position: 'absolute',
    top: -50,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  verdictSparkle: {
    position: 'absolute',
    top: Spacing.three,
    right: Spacing.four,
    fontSize: 16,
    color: 'rgba(255,255,255,0.55)',
  },
  verdictEyebrow: {
    color: '#DCD6FF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  // Serif italic per the unified type scale -- the one true "verdict" moment in the app, now
  // visually distinct from a bold-sans heading everywhere else.
  verdictTitle: {
    ...CelestialType.verdict,
    fontSize: 29,
    lineHeight: 34,
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
    backgroundColor: Celestial.glassFill,
    borderRadius: 24,
    padding: Spacing.four,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: Celestial.glassBorder,
  },
  whyBody: {
    color: Celestial.textPrimary,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
  traitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.one,
    justifyContent: 'center',
  },
  traitPill: {
    backgroundColor: 'rgba(246,184,63,0.14)',
    borderRadius: 99,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  traitPillText: {
    color: Brand.gold,
    fontSize: 13,
    fontWeight: '800',
  },
  kicker: {
    color: Celestial.textMuted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    fontStyle: 'italic',
    marginTop: Spacing.one,
    textAlign: 'center',
  },
});
