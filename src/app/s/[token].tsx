import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandSignature } from '@/components/brand-signature';
import { CompareResultPanel } from '@/components/compare-result-panel';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { getQuizDefinition } from '@/data/quizzes';
import { FRIEND_ADAPTATIONS, renderFriendTemplate } from '@/data/quizzes/friend-adaptations';
import { resolveShareableResultContent, scoreArchetypeQuiz, type ShareableResultContent } from '@/data/quizzes/scoring';
import type { ArchetypeQuizDefinition, QuizDefinition } from '@/data/quizzes/types';
import { useResponsiveContentWidth } from '@/hooks/use-responsive-content-width';
import { ensureAnonymousSession } from '@/services/auth-service';
import { getCompareResult, submitCompareResponse, type CompareResultRow } from '@/services/compare-service';
import { getSharedQuizResult } from '@/services/quiz-share-service';
import { getOrCreateRespondentToken } from '@/utils/respondent-token';

// Result-first shared landing: a recipient opening this link sees the SHARER's result FIRST —
// never dumped into an unanswered quiz. Reuses only approved quiz definition/result copy (via
// resolveShareableResultContent) — no personality copy or result copy is invented here. Works
// for a fully anonymous visitor (no session at all): get_shared_quiz_result is granted to the
// anon role specifically so this page never needs to sign anyone in just to view it.
//
// `mode=compare` renders the full "THEY HAVE NOTES." friend-answering flow: nickname -> friend
// quiz intro -> the same 10 questions (friend-adapted copy, real scoring) -> optional note ->
// NOTED -> the one-to-one comparison. Ensures its own anonymous session the same way "Take it
// myself" already does before writing anything.
type LoadState =
  | { phase: 'loading' }
  | { phase: 'error' }
  | {
      phase: 'ready';
      quizId: string;
      quizTitle: string;
      sharerName: string;
      definition: QuizDefinition;
      content: ShareableResultContent;
      resultId: string;
    };

type CompareStep =
  | 'checking'
  | 'unsupported'
  | 'nickname'
  | 'friend-intro'
  | 'quiz'
  | 'note'
  | 'submitting'
  | 'submit-error'
  | 'noted'
  | 'comparison';

export default function SharedResultScreen() {
  const { token, mode } = useLocalSearchParams<{ token: string; mode?: string }>();
  const router = useRouter();
  const contentWidth = useResponsiveContentWidth();
  const [state, setState] = useState<LoadState>({ phase: 'loading' });

  const load = useCallback(async () => {
    setState({ phase: 'loading' });
    if (!token) {
      setState({ phase: 'error' });
      return;
    }

    const result = await getSharedQuizResult(token);
    if (!result.ok || !result.data) {
      setState({ phase: 'error' });
      return;
    }

    const definition = getQuizDefinition(result.data.quizId);
    const content = definition ? resolveShareableResultContent(definition, result.data.resultId) : null;
    if (!definition || !content) {
      setState({ phase: 'error' });
      return;
    }

    setState({
      phase: 'ready',
      quizId: definition.id,
      quizTitle: definition.title,
      sharerName: result.data.sharerDisplayName?.trim() || 'Someone',
      definition,
      content,
      resultId: result.data.resultId,
    });
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const showCompare = mode === 'compare';

  // --- Compare (THEY HAVE NOTES.) flow state -------------------------------------------
  const [compareStep, setCompareStep] = useState<CompareStep>('checking');
  const [respondentToken, setRespondentToken] = useState<string | null>(null);
  const [nickname, setNickname] = useState('');
  const [friendQuestionIndex, setFriendQuestionIndex] = useState(0);
  const [friendAnswers, setFriendAnswers] = useState<Record<string, string>>({});
  const [friendNote, setFriendNote] = useState('');
  const [compareResult, setCompareResult] = useState<CompareResultRow | null>(null);
  const [compareErrorMessage, setCompareErrorMessage] = useState<string>('');

  const friendAdaptation = state.phase === 'ready' ? FRIEND_ADAPTATIONS[state.quizId] : undefined;
  const isArchetypeQuiz = state.phase === 'ready' && state.definition.scoringType === 'archetype';

  useEffect(() => {
    if (!showCompare || state.phase !== 'ready') {
      return;
    }
    let cancelled = false;
    (async () => {
      setCompareStep('checking');
      if (!friendAdaptation || !isArchetypeQuiz) {
        if (!cancelled) setCompareStep('unsupported');
        return;
      }
      await ensureAnonymousSession();
      const respondent = await getOrCreateRespondentToken(token);
      if (cancelled) return;
      setRespondentToken(respondent);

      const existing = await getCompareResult(token, respondent);
      if (cancelled) return;
      if (existing.ok && existing.data) {
        setCompareResult(existing.data);
        setCompareStep('comparison');
        return;
      }
      setCompareStep('nickname');
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCompare, state.phase, token]);

  const resetCompareLocalState = () => {
    setNickname('');
    setFriendQuestionIndex(0);
    setFriendAnswers({});
    setFriendNote('');
    setCompareResult(null);
    setCompareErrorMessage('');
  };

  const handleSubmitCompare = async (note: string | null) => {
    if (state.phase !== 'ready' || !respondentToken || state.definition.scoringType !== 'archetype') {
      return;
    }
    setCompareStep('submitting');
    const { primary, secondary } = scoreArchetypeQuiz(state.definition as ArchetypeQuizDefinition, friendAnswers);
    const submitResult = await submitCompareResponse(
      token,
      respondentToken,
      nickname.trim(),
      friendAnswers,
      primary.id,
      secondary?.id ?? null,
      note,
    );
    if (!submitResult.ok) {
      setCompareErrorMessage(submitResult.message);
      setCompareStep('submit-error');
      return;
    }
    const fetched = await getCompareResult(token, respondentToken);
    if (!fetched.ok || !fetched.data) {
      setCompareErrorMessage('Something went wrong loading your comparison.');
      setCompareStep('submit-error');
      return;
    }
    setCompareResult(fetched.data);
    setCompareStep('noted');
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={[styles.safeArea, contentWidth ? { maxWidth: contentWidth } : null]}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <BrandSignature variant="full" />

          {state.phase === 'loading' && (
            <View style={styles.stateCard}>
              <ThemedText style={styles.stateText}>Loading…</ThemedText>
            </View>
          )}

          {state.phase === 'error' && (
            <View style={styles.stateCard}>
              <ThemedText style={styles.stateText}>This link isn&apos;t available right now.</ThemedText>
              <Pressable style={styles.cta} onPress={() => void load()}>
                <ThemedText style={styles.ctaText}>Try again →</ThemedText>
              </Pressable>
              <Pressable style={styles.tertiaryCta} onPress={() => router.replace('/')}>
                <ThemedText style={styles.tertiaryCtaText}>Go to Apparently You</ThemedText>
              </Pressable>
            </View>
          )}

          {state.phase === 'ready' && !showCompare && (
            <View style={styles.stepGap}>
              <View style={styles.introGap}>
                <ThemedText style={styles.sharerLine}>{state.sharerName}, apparently.</ThemedText>
                <ThemedText style={styles.quizTitle}>{state.quizTitle}</ThemedText>
              </View>

              {state.content.structuredRead ? (
                // Share-safe presentation for a Private structuredRead result: quiz title
                // (above), result title, THE READ, and the approved closing kicker ONLY.
                // THE CALL-OUT / THE COST / TRY THIS stay Private — never shown to a public
                // recipient. The owner's own in-app result (quiz/[quizId].tsx) is NOT this
                // component and still renders all four sections in full — see this file's
                // header comment and ShareableResultContent's own comment in scoring.ts.
                <View style={styles.verdictCard}>
                  <ThemedText style={styles.verdictEyebrow}>THE VERDICT</ThemedText>
                  <ThemedText style={styles.verdictTitle}>{state.content.resultTitle}</ThemedText>

                  <View style={styles.privateSection}>
                    <ThemedText style={styles.privateSectionHeading}>THE READ</ThemedText>
                    {state.content.structuredRead.theRead.map((line, index) => (
                      <ThemedText key={`the-read-${index}`} style={styles.privateSectionBody}>
                        {line}
                      </ThemedText>
                    ))}
                  </View>
                  {state.content.shareKicker && state.content.shareKicker.length > 0 && (
                    <View style={styles.privateSection}>
                      {state.content.shareKicker.map((line, index) => (
                        <ThemedText key={`share-kicker-${index}`} style={styles.privateSectionBody}>
                          {line}
                        </ThemedText>
                      ))}
                    </View>
                  )}
                </View>
              ) : (
                <>
                  <View style={styles.verdictCard}>
                    <ThemedText style={styles.verdictEyebrow}>THE VERDICT</ThemedText>
                    <ThemedText style={styles.verdictTitle}>{state.content.resultTitle}</ThemedText>
                    {state.content.resultSubtitle ? (
                      <ThemedText style={styles.verdictSubtitle}>{state.content.resultSubtitle}</ThemedText>
                    ) : null}
                    {state.content.heroRead.map((line) => (
                      <ThemedText key={line} style={styles.verdictHero}>
                        {line}
                      </ThemedText>
                    ))}
                  </View>

                  <View style={styles.whyCard}>
                    <ThemedText style={styles.eyebrow}>WHY {state.sharerName.toUpperCase()} GOT THAT</ThemedText>
                    <ThemedText style={styles.whyBody}>{state.content.body}</ThemedText>
                    <View style={styles.traitRow}>
                      {state.content.traits.map((trait) => (
                        <View key={trait} style={styles.traitPill}>
                          <ThemedText style={styles.traitPillText}>{trait}</ThemedText>
                        </View>
                      ))}
                    </View>
                    <ThemedText style={styles.kicker}>{state.content.kicker}</ThemedText>
                  </View>
                </>
              )}

              <Pressable style={styles.cta} onPress={() => router.push(`/quiz/${state.quizId}`)}>
                <ThemedText style={styles.ctaText}>Take it myself →</ThemedText>
              </Pressable>
              <Pressable
                style={styles.secondaryCta}
                onPress={() => {
                  resetCompareLocalState();
                  router.push({ pathname: '/s/[token]', params: { token, mode: 'compare' } });
                }}>
                <ThemedText style={styles.secondaryCtaText}>Give my version of {state.sharerName} →</ThemedText>
              </Pressable>
            </View>
          )}

          {state.phase === 'ready' && showCompare && compareStep === 'checking' && (
            <View style={styles.stateCard}>
              <ThemedText style={styles.stateText}>Loading…</ThemedText>
            </View>
          )}

          {state.phase === 'ready' && showCompare && compareStep === 'unsupported' && (
            <View style={styles.stateCard}>
              <ThemedText style={styles.stateText}>Compare isn&apos;t available for this quiz yet.</ThemedText>
              <Pressable style={styles.secondaryCta} onPress={() => router.push({ pathname: '/s/[token]', params: { token } })}>
                <ThemedText style={styles.secondaryCtaText}>← Back to {state.sharerName}&apos;s result</ThemedText>
              </Pressable>
            </View>
          )}

          {state.phase === 'ready' && showCompare && compareStep === 'nickname' && (
            <View style={styles.stepGap}>
              <View style={styles.introGap}>
                <ThemedText style={styles.eyebrow}>THEY HAVE NOTES. {'\u{1F440}'}</ThemedText>
                <ThemedText style={styles.quizTitle}>Oh, you know {state.sharerName}?</ThemedText>
                <ThemedText style={styles.compareRow}>Perfect.</ThemedText>
                <ThemedText style={styles.compareRow}>First, what should we call you?</ThemedText>
              </View>
              <View style={styles.whyCard}>
                <ThemedText style={styles.inputLabel}>First name or nickname</ThemedText>
                <TextInput
                  value={nickname}
                  onChangeText={(value) => setNickname(value.slice(0, 60))}
                  placeholder="Your name"
                  placeholderTextColor={Brand.inkSecondary}
                  style={styles.textInput}
                  maxLength={60}
                />
                <ThemedText style={styles.privacyNote}>
                  {state.sharerName} will see the name you enter with your comparison. Other friends won&apos;t see your answers or
                  result.
                </ThemedText>
              </View>
              <Pressable
                disabled={nickname.trim().length === 0}
                style={[styles.cta, nickname.trim().length === 0 && styles.ctaDisabled]}
                onPress={() => setCompareStep('friend-intro')}>
                <ThemedText style={styles.ctaText}>I have notes →</ThemedText>
              </Pressable>
            </View>
          )}

          {state.phase === 'ready' && showCompare && compareStep === 'friend-intro' && (
            <View style={styles.stepGap}>
              <View style={styles.introGap}>
                <ThemedText style={styles.eyebrow}>OKAY, {nickname.trim().toUpperCase()}. {'\u{1F440}'}</ThemedText>
                <ThemedText style={styles.compareRow}>
                  You&apos;re answering the same quiz {state.sharerName} answered about themselves.
                </ThemedText>
                <ThemedText style={styles.compareRow}>Same situations.</ThemedText>
                <ThemedText style={styles.compareRow}>Different witness.</ThemedText>
                <ThemedText style={styles.compareRow}>Let&apos;s see whether the stories match.</ThemedText>
                <ThemedText style={styles.metaLine}>
                  {friendAdaptation?.questions.length ?? 10} questions · About 3 min
                </ThemedText>
              </View>
              <Pressable style={styles.cta} onPress={() => setCompareStep('quiz')}>
                <ThemedText style={styles.ctaText}>Give my version →</ThemedText>
              </Pressable>
            </View>
          )}

          {state.phase === 'ready' && showCompare && compareStep === 'quiz' && friendAdaptation && (
            <FriendQuestionStep
              index={friendQuestionIndex}
              total={friendAdaptation.questions.length}
              question={friendAdaptation.questions[friendQuestionIndex]}
              ownerName={state.sharerName}
              selected={friendAnswers[friendAdaptation.questions[friendQuestionIndex].id] ?? null}
              onSelect={(choiceId) =>
                setFriendAnswers((prev) => ({ ...prev, [friendAdaptation.questions[friendQuestionIndex].id]: choiceId }))
              }
              onBack={() => setFriendQuestionIndex((i) => Math.max(0, i - 1))}
              onNext={() => {
                if (friendQuestionIndex + 1 >= friendAdaptation.questions.length) {
                  setCompareStep('note');
                } else {
                  setFriendQuestionIndex((i) => i + 1);
                }
              }}
            />
          )}

          {state.phase === 'ready' && showCompare && compareStep === 'note' && (
            <View style={styles.stepGap}>
              <View style={styles.introGap}>
                <ThemedText style={styles.eyebrow}>ONE MORE THING... {'\u{1F440}'}</ThemedText>
                <ThemedText style={styles.compareRow}>Anything else {state.sharerName} should know? Optional.</ThemedText>
              </View>
              <View style={styles.whyCard}>
                <TextInput
                  value={friendNote}
                  onChangeText={(value) => setFriendNote(value.slice(0, 240))}
                  placeholder="Leave a note…"
                  placeholderTextColor={Brand.inkSecondary}
                  style={[styles.textInput, styles.noteInput]}
                  maxLength={240}
                  multiline
                />
                <ThemedText style={styles.charCount}>{friendNote.length}/240</ThemedText>
              </View>
              <Pressable
                disabled={friendNote.trim().length === 0}
                style={[styles.cta, friendNote.trim().length === 0 && styles.ctaDisabled]}
                onPress={() => void handleSubmitCompare(friendNote.trim() || null)}>
                <ThemedText style={styles.ctaText}>Leave one more note →</ThemedText>
              </Pressable>
              <Pressable style={styles.secondaryCta} onPress={() => void handleSubmitCompare(null)}>
                <ThemedText style={styles.secondaryCtaText}>I&apos;ve said enough {'\u{1F602}'}</ThemedText>
              </Pressable>
            </View>
          )}

          {state.phase === 'ready' && showCompare && compareStep === 'submitting' && (
            <View style={styles.stateCard}>
              <ThemedText style={styles.stateText}>Recording your version…</ThemedText>
            </View>
          )}

          {state.phase === 'ready' && showCompare && compareStep === 'submit-error' && (
            <View style={styles.stateCard}>
              <ThemedText style={styles.stateText}>{compareErrorMessage || 'Something went wrong.'}</ThemedText>
              <Pressable style={styles.cta} onPress={() => void handleSubmitCompare(friendNote.trim() || null)}>
                <ThemedText style={styles.ctaText}>Try again →</ThemedText>
              </Pressable>
            </View>
          )}

          {state.phase === 'ready' && showCompare && compareStep === 'noted' && compareResult && (
            <View style={styles.stepGap}>
              <View style={styles.introGap}>
                <ThemedText style={styles.eyebrow}>NOTED. {'\u{1F440}'}</ThemedText>
                <ThemedText style={styles.compareRow}>Your version of {state.sharerName} is officially on the record.</ThemedText>
                <ThemedText style={styles.compareRow}>Now let&apos;s see where the two of you agree…</ThemedText>
                <ThemedText style={styles.compareRow}>
                  and where somebody may have been telling themselves a story. {'\u{1F602}'}
                </ThemedText>
              </View>
              <Pressable style={styles.cta} onPress={() => setCompareStep('comparison')}>
                <ThemedText style={styles.ctaText}>See the comparison →</ThemedText>
              </Pressable>
            </View>
          )}

          {state.phase === 'ready' && showCompare && compareStep === 'comparison' && compareResult && isArchetypeQuiz && (
            <View style={styles.stepGap}>
              <CompareResultPanel
                definition={state.definition as ArchetypeQuizDefinition}
                ownerName={state.sharerName}
                friendName={compareResult.respondent_nickname}
                ownerResultId={compareResult.owner_result_id}
                friendResultId={compareResult.friend_primary_result_id}
                ownerAnswers={compareResult.owner_answers}
                friendAnswers={compareResult.friend_answers}
                matchCount={compareResult.match_count}
                note={compareResult.note}
                noteViewer="friend"
              />
              <Pressable style={styles.secondaryCta} onPress={() => router.push({ pathname: '/s/[token]', params: { token } })}>
                <ThemedText style={styles.secondaryCtaText}>← Back to {state.sharerName}&apos;s result</ThemedText>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function FriendQuestionStep({
  index,
  total,
  question,
  ownerName,
  selected,
  onSelect,
  onBack,
  onNext,
}: {
  index: number;
  total: number;
  question: { id: string; prompt: string; choices: { id: string; label: string }[] };
  ownerName: string;
  selected: string | null;
  onSelect: (choiceId: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const canContinue = selected !== null;
  return (
    <View style={styles.stepGap}>
      <View style={styles.topRow}>
        {index > 0 ? (
          <Pressable onPress={onBack} hitSlop={12} style={styles.backButton}>
            <ThemedText style={styles.backText}>← Back</ThemedText>
          </Pressable>
        ) : (
          <View style={styles.backButton} />
        )}
        <ThemedText style={styles.progress}>
          {index + 1} of {total}
        </ThemedText>
      </View>
      <ThemedText style={styles.questionPrompt}>{renderFriendTemplate(question.prompt, ownerName)}</ThemedText>
      <View style={styles.choiceList}>
        {question.choices.map((choice, choiceIndex) => {
          const isSelected = selected === choice.id;
          return (
            <Pressable
              key={choice.id}
              onPress={() => onSelect(choice.id)}
              style={[styles.choiceCard, isSelected && styles.choiceCardSelected]}>
              <View style={[styles.choiceBadge, isSelected && styles.choiceBadgeSelected]}>
                <ThemedText style={[styles.choiceBadgeText, isSelected && styles.choiceBadgeTextSelected]}>
                  {String.fromCharCode(65 + choiceIndex)}
                </ThemedText>
              </View>
              <ThemedText style={styles.choiceText}>{renderFriendTemplate(choice.label, ownerName)}</ThemedText>
              {isSelected && <ThemedText style={styles.choiceCheck}>✓</ThemedText>}
            </Pressable>
          );
        })}
      </View>
      <Pressable disabled={!canContinue} onPress={onNext} style={[styles.cta, !canContinue && styles.ctaDisabled]}>
        <ThemedText style={styles.ctaText}>{index + 1 >= total ? 'Continue →' : 'Continue →'}</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0E8DD' },
  safeArea: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#FFF9F5',
    ...Platform.select({
      web: { marginVertical: 28, borderRadius: 28, boxShadow: '0 24px 64px rgba(23, 21, 29, 0.10)', overflow: 'hidden' },
      default: {},
    }),
  },
  content: { flexGrow: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.four, paddingBottom: Spacing.six, gap: Spacing.five },
  stepGap: { gap: Spacing.four },
  introGap: { gap: Spacing.one },
  stateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: Spacing.four,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: '#F0E6E8',
    alignItems: 'center',
  },
  stateText: { color: Brand.inkSecondary, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  eyebrow: { color: Brand.pink, fontSize: 11, fontWeight: '800', letterSpacing: 1.3 },
  sharerLine: { color: Brand.violet, fontSize: 15, fontWeight: '800' },
  quizTitle: { color: Brand.ink, fontSize: 28, lineHeight: 33, fontWeight: '800', letterSpacing: -0.6 },
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
  verdictEyebrow: { color: '#DCD6FF', fontSize: 11, fontWeight: '800', letterSpacing: 1.3 },
  verdictTitle: { color: '#FFFFFF', fontSize: 30, lineHeight: 34, fontWeight: '900', letterSpacing: -0.6, marginTop: Spacing.one },
  verdictSubtitle: { color: '#DCD6FF', fontSize: 13, fontWeight: '800', letterSpacing: 0.4, marginTop: -Spacing.half },
  verdictHero: { color: '#F1EEFF', fontSize: 18, lineHeight: 24, fontWeight: '700' },
  // Apparently Private's structured result sections (THE READ / THE CALL-OUT / THE COST /
  // TRY THIS) — mirrors quiz/[quizId].tsx's PrivateStructuredResult styling exactly, so a
  // shared structuredRead result reads identically here as it does in the quiz runner itself.
  privateSection: { marginTop: Spacing.three, gap: Spacing.one },
  privateSectionHeading: { color: '#DCD6FF', fontSize: 11, fontWeight: '800', letterSpacing: 1.3 },
  privateSectionBody: { color: '#F1EEFF', fontSize: 16, lineHeight: 22, fontWeight: '700' },
  whyCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: Spacing.four, gap: Spacing.two, borderWidth: 1, borderColor: '#F0E6E8' },
  whyBody: { color: Brand.ink, fontSize: 15, lineHeight: 22, fontWeight: '600' },
  traitRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.one },
  traitPill: { backgroundColor: '#F7F3FF', borderRadius: 99, paddingHorizontal: Spacing.three, paddingVertical: Spacing.one },
  traitPillText: { color: Brand.violet, fontSize: 13, fontWeight: '800' },
  kicker: { color: Brand.inkSecondary, fontSize: 13, lineHeight: 18, fontWeight: '600', fontStyle: 'italic', marginTop: Spacing.one },
  cta: { backgroundColor: Brand.pink, borderRadius: 16, alignItems: 'center', paddingVertical: Spacing.three },
  ctaDisabled: { opacity: 0.4 },
  ctaText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  secondaryCta: { backgroundColor: '#FFFFFF', borderRadius: 16, alignItems: 'center', paddingVertical: Spacing.three, borderWidth: 1, borderColor: '#F0E6E8' },
  secondaryCtaText: { color: Brand.violet, fontSize: 15, fontWeight: '800' },
  tertiaryCta: { alignItems: 'center', paddingVertical: Spacing.two },
  tertiaryCtaText: { color: Brand.inkSecondary, fontSize: 14, fontWeight: '700' },
  compareRow: { color: Brand.ink, fontSize: 15, lineHeight: 22, fontWeight: '600' },
  compareLabel: { color: Brand.violet, fontWeight: '800' },
  metaLine: { color: Brand.inkSecondary, fontSize: 13, fontWeight: '700', marginTop: Spacing.one },
  inputLabel: { color: Brand.inkSecondary, fontSize: 12, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  textInput: {
    borderWidth: 1,
    borderColor: '#F0E6E8',
    borderRadius: 14,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
    color: Brand.ink,
  },
  noteInput: { minHeight: 96, textAlignVertical: 'top' },
  charCount: { color: Brand.inkSecondary, fontSize: 12, fontWeight: '600', textAlign: 'right' },
  privacyNote: { color: Brand.inkSecondary, fontSize: 12, lineHeight: 17, fontWeight: '600' },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { minWidth: 60 },
  backText: { color: Brand.violet, fontSize: 14, fontWeight: '700' },
  progress: { color: Brand.inkSecondary, fontSize: 13, fontWeight: '700' },
  questionPrompt: { color: Brand.ink, fontSize: 22, lineHeight: 28, fontWeight: '800', letterSpacing: -0.4 },
  choiceList: { gap: Spacing.two },
  choiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0E6E8',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  choiceCardSelected: { borderColor: Brand.violet, backgroundColor: '#F7F3FF' },
  choiceBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0E6E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceBadgeSelected: { backgroundColor: Brand.violet },
  choiceBadgeText: { color: Brand.inkSecondary, fontSize: 13, fontWeight: '800' },
  choiceBadgeTextSelected: { color: '#FFFFFF' },
  choiceText: { flex: 1, color: Brand.ink, fontSize: 15, lineHeight: 21, fontWeight: '600' },
  choiceCheck: { color: Brand.violet, fontSize: 16, fontWeight: '800' },
});
