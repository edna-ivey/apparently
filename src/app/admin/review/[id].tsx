import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AdminMaxContentWidth, Brand, BottomTabInset, Spacing } from '@/constants/theme';
import {
  approveQuestion as approveQuestionInStore,
  canTransitionStatus,
  DAILY_STATUS_LABELS,
  type DailyOption,
  getCompletenessIssues,
  hydrateQuestions,
  isApprovalCurrent,
  MAX_PERSONALITY_EFFECTS_PER_OPTION,
  rejectQuestion as rejectQuestionInStore,
  sendToRevision as sendToRevisionInStore,
  updateQuestionOption as updateQuestionOptionInStore,
  updateQuestionOptionEffects as updateQuestionOptionEffectsInStore,
  updateQuestionOptionFeedback as updateQuestionOptionFeedbackInStore,
  updateQuestionPrompt as updateQuestionPromptInStore,
  useDailyQuestions,
} from '@/data/daily-questions';
import {
  getEffectLabel,
  PERSONALITY_DIMENSIONS,
  type PersonalityDimensionId,
  type PersonalityEffect,
  type PersonalityEffectValue,
} from '@/data/personality';
import { confirmAction } from '@/utils/confirm-action';
import { formatDateTime } from '@/utils/format-date';

const MetaRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.metaRow}>
    <ThemedText style={styles.metaLabel}>{label}</ThemedText>
    <ThemedText style={styles.metaValue}>{value}</ThemedText>
  </View>
);

export default function DailyReviewScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const questions = useDailyQuestions();
  const [revisionNote, setRevisionNote] = useState('');
  const [effectPickerOpenFor, setEffectPickerOpenFor] = useState<number | null>(null);
  // Step 2 of the compact picker: once a trait is chosen from the scrollable list, this
  // narrows the picker down to just that trait's two poles instead of showing all 40
  // pole options at once.
  const [pickerDimension, setPickerDimension] = useState<PersonalityDimensionId | null>(null);

  const openEffectPicker = (optionId: number) => {
    setEffectPickerOpenFor((current) => (current === optionId ? null : optionId));
    setPickerDimension(null);
  };

  useEffect(() => {
    void hydrateQuestions();
  }, []);

  const questionId = Number(id);
  const question = questions.find((item) => item.id === questionId) ?? null;

  if (!question) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.notFound}>
            <ThemedText style={styles.notFoundText}>This Daily Question could not be found.</ThemedText>
            <Pressable style={styles.backButton} onPress={() => router.push('/admin')}>
              <ThemedText style={styles.backButtonText}>Back to Admin</ThemedText>
            </Pressable>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const canEditContent = question.status !== 'Live' && question.status !== 'Archived';
  const issues = getCompletenessIssues(question);
  const approvalTransitionValid = canTransitionStatus(question.status, 'Approved');
  const canApprove = approvalTransitionValid && issues.length === 0;
  const canSendToRevision = canTransitionStatus(question.status, 'NeedsRevision');
  const canReject = canTransitionStatus(question.status, 'Rejected');
  const noActionsAvailable = !approvalTransitionValid && !canSendToRevision && !canReject;

  const handleApprove = () => {
    confirmAction(
      'I reviewed the question and all answer experiences.',
      () => {
        const applied = approveQuestionInStore(question.id);
        if (applied) {
          router.push('/admin');
        }
      },
      { title: 'Approve Daily', confirmLabel: 'Yes, approve this Daily' }
    );
  };

  const handleSendToRevision = () => {
    sendToRevisionInStore(question.id, revisionNote);
    router.push('/admin');
  };

  const handleReject = () => {
    confirmAction(
      'Reject this Daily Question? It stays in the archive of rejected content and can be restored to Draft later — nothing is deleted.',
      () => {
        rejectQuestionInStore(question.id);
        router.push('/admin');
      },
      { title: 'Reject Daily' }
    );
  };

  const handleAddEffect = (option: DailyOption, dimensionId: PersonalityDimensionId, sign: 1 | -1) => {
    const current = option.personalityEffects ?? [];
    if (current.length >= MAX_PERSONALITY_EFFECTS_PER_OPTION || current.some((effect) => effect.dimension === dimensionId)) {
      return;
    }
    const next: PersonalityEffect[] = [...current, { dimension: dimensionId, value: sign }];
    updateQuestionOptionEffectsInStore(question.id, option.id, next);
    setEffectPickerOpenFor(null);
    setPickerDimension(null);
  };

  const handleCycleEffectWeight = (option: DailyOption, index: number) => {
    const current = option.personalityEffects ?? [];
    const effect = current[index];
    if (!effect) return;
    const nextMagnitude = Math.abs(effect.value) === 1 ? 2 : 1;
    const nextValue = (effect.value > 0 ? nextMagnitude : -nextMagnitude) as PersonalityEffectValue;
    const next = current.map((item, i) => (i === index ? { ...item, value: nextValue } : item));
    updateQuestionOptionEffectsInStore(question.id, option.id, next);
  };

  const handleRemoveEffect = (option: DailyOption, index: number) => {
    const current = option.personalityEffects ?? [];
    updateQuestionOptionEffectsInStore(
      question.id,
      option.id,
      current.filter((_, i) => i !== index)
    );
  };

  const renderAnswerCard = (option: DailyOption, index: number) => {
    const letter = String.fromCharCode(65 + index);
    const effects = option.personalityEffects ?? [];
    const hasFeedback = typeof option.apparentlyFeedback === 'string' && option.apparentlyFeedback.trim().length > 0;
    const pickerOpen = effectPickerOpenFor === option.id;
    const activeDimension = pickerOpen && pickerDimension
      ? PERSONALITY_DIMENSIONS.find((dimension) => dimension.id === pickerDimension)
      : null;

    return (
      <View key={option.id} style={styles.answerCard}>
        <View style={styles.answerHeaderRow}>
          <View style={styles.answerLetterBadge}>
            <ThemedText style={styles.answerLetterText}>{letter}</ThemedText>
          </View>
          {canEditContent ? (
            <TextInput
              value={option.label}
              onChangeText={(value) => updateQuestionOptionInStore(question.id, option.id, 'label', value)}
              multiline
              style={styles.answerTextInput}
              placeholder="Answer wording"
            />
          ) : (
            <ThemedText style={styles.answerTextDisplay}>{option.label || 'Answer wording missing.'}</ThemedText>
          )}
        </View>

        <View style={styles.traitRow}>
          {effects.length === 0 && <ThemedText style={styles.suggestionNeededText}>Suggestion needed</ThemedText>}
          {effects.map((effect, effectIndex) => (
            <Pressable
              key={`${effect.dimension}-${effectIndex}`}
              style={styles.traitChip}
              disabled={!canEditContent}
              onPress={() => handleCycleEffectWeight(option, effectIndex)}>
              <ThemedText style={styles.traitChipText}>{getEffectLabel(effect)}</ThemedText>
              {canEditContent && (
                <Pressable hitSlop={8} onPress={() => handleRemoveEffect(option, effectIndex)}>
                  <ThemedText style={styles.traitChipRemove}>✕</ThemedText>
                </Pressable>
              )}
            </Pressable>
          ))}
          {canEditContent && effects.length < MAX_PERSONALITY_EFFECTS_PER_OPTION && (
            <Pressable style={styles.addTraitChip} onPress={() => openEffectPicker(option.id)}>
              <ThemedText style={styles.addTraitChipText}>{pickerOpen ? 'Close' : '+ Add signal'}</ThemedText>
            </Pressable>
          )}
          {canEditContent && effects.length === 0 && (
            <Pressable style={styles.generateChip} disabled>
              <ThemedText style={styles.generateChipText}>✨ Generate suggestion</ThemedText>
            </Pressable>
          )}
        </View>

        {pickerOpen && (
          <View style={styles.effectPicker}>
            {activeDimension ? (
              <>
                <Pressable onPress={() => setPickerDimension(null)} style={styles.effectPickerBack}>
                  <ThemedText style={styles.effectPickerBackText}>← Choose a different trait</ThemedText>
                </Pressable>
                <View style={styles.effectPickerPoleRow}>
                  <Pressable
                    style={styles.effectPickerPoleButton}
                    onPress={() => handleAddEffect(option, activeDimension.id, 1)}>
                    <ThemedText style={styles.effectPickerPoleText}>{activeDimension.positiveLabel}</ThemedText>
                  </Pressable>
                  <Pressable
                    style={styles.effectPickerPoleButton}
                    onPress={() => handleAddEffect(option, activeDimension.id, -1)}>
                    <ThemedText style={styles.effectPickerPoleText}>{activeDimension.negativeLabel}</ThemedText>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <ThemedText style={styles.effectPickerHint}>
                  Choose a trait, then a direction (up to {MAX_PERSONALITY_EFFECTS_PER_OPTION} per answer).
                </ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.effectPickerScrollRow}>
                  {PERSONALITY_DIMENSIONS.map((dimension) => (
                    <Pressable
                      key={dimension.id}
                      style={styles.effectPickerDimensionChip}
                      onPress={() => setPickerDimension(dimension.id)}>
                      <ThemedText style={styles.effectPickerDimensionText}>
                        {dimension.positiveLabel} / {dimension.negativeLabel}
                      </ThemedText>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            )}
          </View>
        )}

        <View style={styles.revealBlock}>
          <View style={styles.revealLabelRow}>
            <ThemedText style={styles.revealLabel}>APPARENTLY...</ThemedText>
            {canEditContent && !hasFeedback && (
              <Pressable style={styles.generateChip} disabled>
                <ThemedText style={styles.generateChipText}>✨ Suggest this answer</ThemedText>
              </Pressable>
            )}
          </View>
          {canEditContent ? (
            <>
              {!hasFeedback && <ThemedText style={styles.suggestionNeededText}>Suggestion needed</ThemedText>}
              <TextInput
                value={option.apparentlyFeedback ?? ''}
                onChangeText={(value) => updateQuestionOptionFeedbackInStore(question.id, option.id, value)}
                multiline
                style={styles.revealInput}
                placeholder="Write the Apparently response for this answer..."
              />
              <ThemedText style={styles.revealPercent}>{option.percent}% agreed with you.</ThemedText>
            </>
          ) : hasFeedback ? (
            <ThemedText style={styles.revealText}>
              {option.apparentlyFeedback} {option.percent}% agreed with you.
            </ThemedText>
          ) : (
            <ThemedText style={styles.missingText}>No Apparently response assigned yet.</ThemedText>
          )}
          <ThemedText style={styles.demoCaption}>Demo percentage for prototype only</ThemedText>
        </View>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Pressable onPress={() => router.push('/admin')} style={styles.backLink}>
            <ThemedText style={styles.backLinkText}>← Back to Admin</ThemedText>
          </Pressable>

          <View style={styles.header}>
            <ThemedText style={styles.eyebrow}>DAILY REVIEW</ThemedText>
            <ThemedText style={styles.headerMeta}>
              {question.category} · {DAILY_STATUS_LABELS[question.status]}
            </ThemedText>
            {canEditContent ? (
              <TextInput
                value={question.prompt}
                onChangeText={(value) => updateQuestionPromptInStore(question.id, value)}
                multiline
                style={styles.questionInput}
              />
            ) : (
              <ThemedText style={styles.questionText}>{question.prompt}</ThemedText>
            )}
          </View>

          {question.reviewNote && (
            <View style={styles.noteCallout}>
              <ThemedText style={styles.noteCalloutEyebrow}>EDITORIAL NOTE FROM LAST REVIEW</ThemedText>
              <ThemedText style={styles.noteCalloutText}>{question.reviewNote}</ThemedText>
            </View>
          )}

          {question.options.map((option, index) => renderAnswerCard(option, index))}

          <View style={styles.metaCard}>
            <MetaRow label="CATEGORY" value={question.category} />
            <MetaRow label="STATUS" value={DAILY_STATUS_LABELS[question.status]} />
            {question.scheduledFor && <MetaRow label="SCHEDULED DATE" value={question.scheduledFor} />}
            {question.approvedBy && (
              <MetaRow
                label="APPROVAL"
                value={`Approved by ${question.approvedBy} · ${formatDateTime(question.approvedAt)}${
                  !isApprovalCurrent(question) ? ' — content changed since approval' : ''
                }`}
              />
            )}
          </View>

          {issues.length > 0 && (
            <View style={styles.issuesCard}>
              <ThemedText style={styles.issuesTitle}>Before this can be approved:</ThemedText>
              {issues.map((issue) => (
                <ThemedText key={issue} style={styles.issueText}>
                  • {issue}
                </ThemedText>
              ))}
            </View>
          )}

          <View style={styles.actionsCard}>
            <ThemedText style={styles.actionsTitle}>Editorial decision</ThemedText>

            {approvalTransitionValid && (
              <Pressable
                style={[styles.approveButton, !canApprove && styles.disabledButton]}
                disabled={!canApprove}
                onPress={handleApprove}>
                <ThemedText style={styles.approveButtonText}>Approve Daily</ThemedText>
              </Pressable>
            )}

            {canSendToRevision && (
              <View style={styles.noteField}>
                <ThemedText style={styles.noteLabel}>Editorial note (optional)</ThemedText>
                <TextInput
                  value={revisionNote}
                  onChangeText={setRevisionNote}
                  placeholder="e.g. Answer D is too obviously funny compared with the others."
                  multiline
                  style={styles.noteInput}
                />
                <Pressable style={styles.revisionButton} onPress={handleSendToRevision}>
                  <ThemedText style={styles.revisionButtonText}>Needs Revision</ThemedText>
                </Pressable>
              </View>
            )}

            {canReject && (
              <Pressable style={styles.rejectButton} onPress={handleReject}>
                <ThemedText style={styles.rejectButtonText}>Reject</ThemedText>
              </Pressable>
            )}

            {noActionsAvailable && (
              <ThemedText style={styles.noActionsText}>
                No editorial actions are available for a {DAILY_STATUS_LABELS[question.status]} question. This is a
                read-only view of its complete experience.
              </ThemedText>
            )}
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
    maxWidth: AdminMaxContentWidth,
    alignSelf: 'center',
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.five,
    gap: Spacing.three,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  notFoundText: {
    color: Brand.ink,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: Brand.pink,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  backLink: {
    alignSelf: 'flex-start',
  },
  backLinkText: {
    color: Brand.violet,
    fontSize: 13,
    fontWeight: '800',
  },
  header: {
    gap: 4,
    backgroundColor: Brand.violet,
    borderRadius: 24,
    padding: Spacing.four,
  },
  eyebrow: {
    color: '#DCD6FF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  headerMeta: {
    color: '#DCD6FF',
    fontSize: 13,
    fontWeight: '700',
  },
  questionText: {
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: Spacing.one,
  },
  questionInput: {
    color: '#FFFFFF',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginTop: Spacing.one,
    padding: 0,
  },
  noteCallout: {
    backgroundColor: '#FCE9ED',
    borderRadius: 16,
    padding: Spacing.three,
    gap: 2,
  },
  noteCalloutEyebrow: {
    color: '#9E2E4F',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  noteCalloutText: {
    color: '#9E2E4F',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  answerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F0E6E8',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  answerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  answerLetterBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Brand.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerLetterText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  answerTextDisplay: {
    flex: 1,
    color: Brand.ink,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
    marginTop: 4,
  },
  answerTextInput: {
    flex: 1,
    color: Brand.ink,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
    marginTop: 2,
    padding: 0,
  },
  traitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
    alignItems: 'center',
  },
  traitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1ECF8',
    borderRadius: 99,
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
  },
  traitChipText: {
    color: Brand.violet,
    fontSize: 13,
    fontWeight: '800',
  },
  traitChipRemove: {
    color: Brand.violet,
    fontSize: 12,
    fontWeight: '800',
    opacity: 0.7,
  },
  addTraitChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 99,
    borderWidth: 1,
    borderColor: Brand.violet,
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
  },
  addTraitChipText: {
    color: Brand.violet,
    fontSize: 12,
    fontWeight: '800',
  },
  missingText: {
    color: '#9E2E4F',
    fontSize: 13,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  // Deliberately a softer/warmer tone than missingText (red) — this isn't an error, it's
  // "AI hasn't proposed this yet," which is an expected, everyday state, not a mistake.
  suggestionNeededText: {
    color: '#9B6812',
    fontSize: 12,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  generateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F0EC',
    borderRadius: 99,
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
    opacity: 0.6,
  },
  generateChipText: {
    color: Brand.inkSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  // Compact two-step picker: step 1 is a horizontally-scrolling row of trait names (not
  // 40 pole chips flooding the card at once); tapping one narrows to just its two poles.
  effectPicker: {
    backgroundColor: '#F8F5FF',
    borderRadius: 16,
    padding: Spacing.two,
    gap: Spacing.two,
  },
  effectPickerHint: {
    color: Brand.inkSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  effectPickerScrollRow: {
    gap: 6,
    paddingVertical: 2,
  },
  effectPickerDimensionChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#E8E2FF',
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
  },
  effectPickerDimensionText: {
    color: Brand.ink,
    fontSize: 12,
    fontWeight: '700',
  },
  effectPickerBack: {
    alignSelf: 'flex-start',
  },
  effectPickerBackText: {
    color: Brand.violet,
    fontSize: 12,
    fontWeight: '800',
  },
  effectPickerPoleRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  effectPickerPoleButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E2FF',
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  effectPickerPoleText: {
    color: Brand.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  revealBlock: {
    backgroundColor: '#FFE9E0',
    borderRadius: 18,
    padding: Spacing.three,
    gap: 6,
  },
  revealLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  revealLabel: {
    color: Brand.coral,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  revealText: {
    color: Brand.ink,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '700',
  },
  revealInput: {
    color: Brand.ink,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '700',
    padding: 0,
    minHeight: 46,
  },
  revealPercent: {
    color: Brand.ink,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '800',
  },
  demoCaption: {
    color: '#B5654F',
    fontSize: 11,
    fontWeight: '700',
  },
  metaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0E6E8',
    padding: Spacing.three,
    gap: Spacing.two,
  },
  metaRow: {
    gap: 2,
  },
  metaLabel: {
    color: Brand.violet,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  metaValue: {
    color: Brand.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  issuesCard: {
    backgroundColor: '#FCE9ED',
    borderRadius: 20,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  issuesTitle: {
    color: '#9E2E4F',
    fontSize: 14,
    fontWeight: '800',
  },
  issueText: {
    color: '#9E2E4F',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
  },
  actionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0E6E8',
    padding: Spacing.three,
    gap: Spacing.two,
  },
  actionsTitle: {
    color: Brand.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  approveButton: {
    backgroundColor: Brand.pink,
    borderRadius: 14,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  disabledButton: {
    opacity: 0.4,
  },
  noteField: {
    gap: Spacing.one,
  },
  noteLabel: {
    color: Brand.violet,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  noteInput: {
    color: Brand.ink,
    backgroundColor: '#F6F2FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E2FF',
    padding: Spacing.two,
    fontSize: 14,
    minHeight: 60,
  },
  revisionButton: {
    backgroundColor: '#F5F0FF',
    borderRadius: 12,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  revisionButtonText: {
    color: Brand.violet,
    fontSize: 14,
    fontWeight: '800',
  },
  rejectButton: {
    backgroundColor: '#FCE9ED',
    borderRadius: 12,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#9E2E4F',
    fontSize: 14,
    fontWeight: '800',
  },
  noActionsText: {
    color: Brand.inkSecondary,
    fontSize: 13,
    fontWeight: '600',
    fontStyle: 'italic',
  },
});
