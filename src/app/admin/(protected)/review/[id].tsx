import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AdminMaxContentWidth, Brand, BottomTabInset, Spacing } from '@/constants/theme';
import {
  getEffectLabel,
  PERSONALITY_DIMENSIONS,
  type PersonalityDimensionId,
  type PersonalityEffect,
} from '@/data/personality';
import {
  approveDaily,
  getDailyQuestion,
  listDailyOptions,
  rejectDaily,
  sendToRevision,
  updateDailyContent,
  updateDailyOption,
} from '@/services/admin-daily-service';
import type { DailyOptionRow, DailyQuestionRow } from '@/services/types';
import { getAdminCompletenessIssues } from '@/utils/admin-completeness';
import { canTransitionAdminStatus, DAILY_STATUS_LABELS } from '@/utils/admin-transitions';
import { confirmAction } from '@/utils/confirm-action';
import { formatDateTime } from '@/utils/format-date';

const MAX_PERSONALITY_EFFECTS_PER_OPTION = 3;

const MetaRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.metaRow}>
    <ThemedText style={styles.metaLabel}>{label}</ThemedText>
    <ThemedText style={styles.metaValue}>{value}</ThemedText>
  </View>
);

// Real Supabase UUID Daily, loaded/edited/reviewed through the admin_* RPCs — the local
// prototype numeric-id store (src/data/daily-questions.ts) is not used anywhere in this
// file. See src/services/admin-daily-service.ts for exactly what each action does and how
// the server enforces it.
export default function AdminReviewScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [question, setQuestion] = useState<DailyQuestionRow | null>(null);
  const [options, setOptions] = useState<DailyOptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');

  // ADD SIGNAL flow: step 1 picks a dimension, step 2 picks a human pole + strength — both
  // selectable before anything is saved, so a brand-new signal never needs a follow-up edit
  // just to reach +2. optionId identifies which answer's picker is open.
  const [effectPickerOpenFor, setEffectPickerOpenFor] = useState<string | null>(null);
  const [pickerDimension, setPickerDimension] = useState<PersonalityDimensionId | null>(null);
  const [pickerDirection, setPickerDirection] = useState<1 | -1 | null>(null);
  const [pickerStrength, setPickerStrength] = useState<1 | 2>(1);

  // EDIT EXISTING SIGNAL flow: tapping a chip opens an explicit direction+strength editor
  // pre-filled with its current value — replaces the old silent tap-to-cycle behavior, which
  // gave no visible indication of what a tap actually did.
  const [editingEffect, setEditingEffect] = useState<{ optionId: string; index: number } | null>(null);
  const [editDirection, setEditDirection] = useState<1 | -1>(1);
  const [editStrength, setEditStrength] = useState<1 | 2>(1);

  const [actionError, setActionError] = useState<string | null>(null);

  // Local drafts for text fields — committed on blur, matching the dashboard's own
  // schedule-field pattern, so an admin_update_* RPC isn't fired on every keystroke.
  const [promptDraft, setPromptDraft] = useState('');
  const [categoryDraft, setCategoryDraft] = useState('');
  const [optionDrafts, setOptionDrafts] = useState<Record<string, { label: string; feedback: string }>>({});

  const reload = useCallback(async () => {
    if (!id) return;
    const questionResult = await getDailyQuestion(id);
    if (!questionResult.ok || !questionResult.data) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    const optionsResult = await listDailyOptions(id);
    setQuestion(questionResult.data);
    setPromptDraft(questionResult.data.prompt);
    setCategoryDraft(questionResult.data.category);
    if (optionsResult.ok) {
      setOptions(optionsResult.data);
      setOptionDrafts(
        Object.fromEntries(
          optionsResult.data.map((option) => [option.id, { label: option.label, feedback: option.apparently_feedback ?? '' }]),
        ),
      );
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const openEffectPicker = (optionId: string) => {
    setEditingEffect(null);
    setEffectPickerOpenFor((current) => (current === optionId ? null : optionId));
    setPickerDimension(null);
    setPickerDirection(null);
    setPickerStrength(1);
  };

  const openEditEffect = (option: DailyOptionRow, index: number) => {
    const effect = (option.personality_effects ?? [])[index];
    if (!effect) return;
    setEffectPickerOpenFor(null);
    setEditingEffect((current) => (current?.optionId === option.id && current.index === index ? null : { optionId: option.id, index }));
    setEditDirection(effect.value > 0 ? 1 : -1);
    setEditStrength((Math.abs(effect.value) as 1 | 2));
  };

  if (loading) {
    return <ThemedView style={styles.container} />;
  }

  if (notFound || !question) {
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
  const issues = getAdminCompletenessIssues(question.prompt, question.category, options);
  const approvalTransitionValid = canTransitionAdminStatus(question.status, 'Approved');
  const canApprove = approvalTransitionValid && issues.length === 0;
  const canSendToRevision = canTransitionAdminStatus(question.status, 'NeedsRevision');
  const canReject = canTransitionAdminStatus(question.status, 'Rejected');
  const noActionsAvailable = !approvalTransitionValid && !canSendToRevision && !canReject;

  const runAction = async (action: () => Promise<{ ok: boolean; message?: string }>) => {
    setActionError(null);
    const result = await action();
    if (!result.ok) {
      setActionError(result.message ?? 'That failed.');
      return false;
    }
    return true;
  };

  const handleApprove = () => {
    confirmAction(
      'I reviewed the question and all answer experiences.',
      () => {
        void runAction(() => approveDaily(question.id)).then((ok) => {
          if (ok) router.push('/admin');
        });
      },
      { title: 'Approve Daily', confirmLabel: 'Yes, approve this Daily' },
    );
  };

  const handleSendToRevision = () => {
    void runAction(() => sendToRevision(question.id, revisionNote)).then((ok) => {
      if (ok) router.push('/admin');
    });
  };

  const handleReject = () => {
    confirmAction(
      'Reject this Daily Question? It stays in the archive of rejected content and can be restored to Draft later — nothing is deleted.',
      () => {
        void runAction(() => rejectDaily(question.id)).then((ok) => {
          if (ok) router.push('/admin');
        });
      },
      { title: 'Reject Daily' },
    );
  };

  const commitPrompt = () => {
    const trimmedPrompt = promptDraft.trim();
    const trimmedCategory = categoryDraft.trim();
    if (trimmedPrompt === question.prompt && trimmedCategory === question.category) return;
    void runAction(() => updateDailyContent(question.id, trimmedPrompt, trimmedCategory)).then((ok) => {
      if (ok) void reload();
    });
  };

  const commitOption = (option: DailyOptionRow, overrides?: Partial<{ label: string; personalityEffects: PersonalityEffect[]; feedback: string }>) => {
    const draft = optionDrafts[option.id] ?? { label: option.label, feedback: option.apparently_feedback ?? '' };
    const label = overrides?.label ?? draft.label;
    const feedback = overrides?.feedback ?? draft.feedback;
    const effects = overrides?.personalityEffects ?? option.personality_effects;
    void runAction(() => updateDailyOption(option.id, label, effects, feedback || null)).then((ok) => {
      if (ok) void reload();
    });
  };

  // Saves the exact pole + strength Michelle chose, in one shot — no follow-up tap is ever
  // needed to reach +2. `direction` is the human pole she picked (1 = positive pole button,
  // -1 = negative pole button); the signed raw value stored is direction * strength, which is
  // the ONLY place a negative number gets produced — Michelle herself never chooses "-2".
  const handleAddEffect = (option: DailyOptionRow, dimensionId: PersonalityDimensionId, direction: 1 | -1, strength: 1 | 2) => {
    const current = option.personality_effects ?? [];
    if (current.length >= MAX_PERSONALITY_EFFECTS_PER_OPTION || current.some((effect) => effect.dimension === dimensionId)) {
      return;
    }
    const next = [...current, { dimension: dimensionId, value: (direction * strength) as -2 | -1 | 1 | 2 }];
    commitOption(option, { personalityEffects: next as PersonalityEffect[] });
    setEffectPickerOpenFor(null);
    setPickerDimension(null);
    setPickerDirection(null);
    setPickerStrength(1);
  };

  const handleSaveEditedEffect = (option: DailyOptionRow) => {
    if (!editingEffect || editingEffect.optionId !== option.id) return;
    const current = option.personality_effects ?? [];
    const next = current.map((item, i) =>
      i === editingEffect.index ? { ...item, value: (editDirection * editStrength) as -2 | -1 | 1 | 2 } : item,
    );
    commitOption(option, { personalityEffects: next as PersonalityEffect[] });
    setEditingEffect(null);
  };

  const handleRemoveEffect = (option: DailyOptionRow, index: number) => {
    const current = option.personality_effects ?? [];
    commitOption(option, { personalityEffects: current.filter((_, i) => i !== index) as PersonalityEffect[] });
  };

  const renderAnswerCard = (option: DailyOptionRow, index: number) => {
    const letter = String.fromCharCode(65 + index);
    const effects = option.personality_effects ?? [];
    const hasFeedback = typeof option.apparently_feedback === 'string' && option.apparently_feedback.trim().length > 0;
    const pickerOpen = effectPickerOpenFor === option.id;
    const activeDimension = pickerOpen && pickerDimension ? PERSONALITY_DIMENSIONS.find((d) => d.id === pickerDimension) : null;
    const draft = optionDrafts[option.id] ?? { label: option.label, feedback: option.apparently_feedback ?? '' };

    return (
      <View key={option.id} style={styles.answerCard}>
        <View style={styles.answerHeaderRow}>
          <View style={styles.answerLetterBadge}>
            <ThemedText style={styles.answerLetterText}>{letter}</ThemedText>
          </View>
          {canEditContent ? (
            <TextInput
              value={draft.label}
              onChangeText={(value) => setOptionDrafts((c) => ({ ...c, [option.id]: { ...draft, label: value } }))}
              onBlur={() => commitOption(option)}
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
          {effects.map((effect, effectIndex) => {
            const isEditingThis = editingEffect?.optionId === option.id && editingEffect.index === effectIndex;
            return (
              <Pressable
                key={`${effect.dimension}-${effectIndex}`}
                style={[styles.traitChip, isEditingThis && styles.traitChipActive]}
                disabled={!canEditContent}
                onPress={() => openEditEffect(option, effectIndex)}>
                <ThemedText style={[styles.traitChipText, isEditingThis && styles.traitChipTextActive]}>
                  {getEffectLabel(effect as PersonalityEffect)}
                </ThemedText>
                {canEditContent && (
                  <Pressable hitSlop={8} onPress={() => handleRemoveEffect(option, effectIndex)}>
                    <ThemedText style={[styles.traitChipRemove, isEditingThis && styles.traitChipTextActive]}>✕</ThemedText>
                  </Pressable>
                )}
              </Pressable>
            );
          })}
          {canEditContent && effects.length < MAX_PERSONALITY_EFFECTS_PER_OPTION && (
            <Pressable style={styles.addTraitChip} onPress={() => openEffectPicker(option.id)}>
              <ThemedText style={styles.addTraitChipText}>{pickerOpen ? 'Close' : '+ Add signal'}</ThemedText>
            </Pressable>
          )}
        </View>

        {editingEffect?.optionId === option.id &&
          (() => {
            const effect = effects[editingEffect.index];
            const dimension = effect ? PERSONALITY_DIMENSIONS.find((d) => d.id === effect.dimension) : null;
            if (!effect || !dimension) return null;
            return (
              <View style={styles.effectPicker}>
                <ThemedText style={styles.effectPickerHint}>
                  {dimension.positiveLabel} / {dimension.negativeLabel}
                </ThemedText>
                <ThemedText style={styles.effectPickerCurrent}>
                  Current: {getEffectLabel(effect as PersonalityEffect)}
                </ThemedText>

                <ThemedText style={styles.effectPickerSectionLabel}>DIRECTION</ThemedText>
                <View style={styles.effectPickerPoleRow}>
                  <Pressable
                    style={[styles.effectPickerPoleButton, editDirection === 1 && styles.effectPickerButtonSelected]}
                    onPress={() => setEditDirection(1)}>
                    <ThemedText style={[styles.effectPickerPoleText, editDirection === 1 && styles.effectPickerTextSelected]}>
                      {dimension.positiveLabel}
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    style={[styles.effectPickerPoleButton, editDirection === -1 && styles.effectPickerButtonSelected]}
                    onPress={() => setEditDirection(-1)}>
                    <ThemedText style={[styles.effectPickerPoleText, editDirection === -1 && styles.effectPickerTextSelected]}>
                      {dimension.negativeLabel}
                    </ThemedText>
                  </Pressable>
                </View>

                <ThemedText style={styles.effectPickerSectionLabel}>STRENGTH</ThemedText>
                <View style={styles.effectPickerPoleRow}>
                  <Pressable
                    style={[styles.effectPickerStrengthButton, editStrength === 1 && styles.effectPickerButtonSelected]}
                    onPress={() => setEditStrength(1)}>
                    <ThemedText style={[styles.effectPickerPoleText, editStrength === 1 && styles.effectPickerTextSelected]}>+1</ThemedText>
                  </Pressable>
                  <Pressable
                    style={[styles.effectPickerStrengthButton, editStrength === 2 && styles.effectPickerButtonSelected]}
                    onPress={() => setEditStrength(2)}>
                    <ThemedText style={[styles.effectPickerPoleText, editStrength === 2 && styles.effectPickerTextSelected]}>+2</ThemedText>
                  </Pressable>
                </View>

                <Pressable style={styles.effectPickerSaveButton} onPress={() => handleSaveEditedEffect(option)}>
                  <ThemedText style={styles.effectPickerSaveText}>Save</ThemedText>
                </Pressable>
              </View>
            );
          })()}

        {pickerOpen && (
          <View style={styles.effectPicker}>
            {activeDimension ? (
              <>
                <Pressable
                  onPress={() => {
                    setPickerDimension(null);
                    setPickerDirection(null);
                    setPickerStrength(1);
                  }}
                  style={styles.effectPickerBack}>
                  <ThemedText style={styles.effectPickerBackText}>← Choose a different trait</ThemedText>
                </Pressable>

                <ThemedText style={styles.effectPickerSectionLabel}>DIRECTION</ThemedText>
                <View style={styles.effectPickerPoleRow}>
                  <Pressable
                    style={[styles.effectPickerPoleButton, pickerDirection === 1 && styles.effectPickerButtonSelected]}
                    onPress={() => setPickerDirection(1)}>
                    <ThemedText style={[styles.effectPickerPoleText, pickerDirection === 1 && styles.effectPickerTextSelected]}>
                      {activeDimension.positiveLabel}
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    style={[styles.effectPickerPoleButton, pickerDirection === -1 && styles.effectPickerButtonSelected]}
                    onPress={() => setPickerDirection(-1)}>
                    <ThemedText style={[styles.effectPickerPoleText, pickerDirection === -1 && styles.effectPickerTextSelected]}>
                      {activeDimension.negativeLabel}
                    </ThemedText>
                  </Pressable>
                </View>

                <ThemedText style={styles.effectPickerSectionLabel}>STRENGTH</ThemedText>
                <View style={styles.effectPickerPoleRow}>
                  <Pressable
                    style={[styles.effectPickerStrengthButton, pickerStrength === 1 && styles.effectPickerButtonSelected]}
                    onPress={() => setPickerStrength(1)}>
                    <ThemedText style={[styles.effectPickerPoleText, pickerStrength === 1 && styles.effectPickerTextSelected]}>+1</ThemedText>
                  </Pressable>
                  <Pressable
                    style={[styles.effectPickerStrengthButton, pickerStrength === 2 && styles.effectPickerButtonSelected]}
                    onPress={() => setPickerStrength(2)}>
                    <ThemedText style={[styles.effectPickerPoleText, pickerStrength === 2 && styles.effectPickerTextSelected]}>+2</ThemedText>
                  </Pressable>
                </View>

                <Pressable
                  style={[styles.effectPickerSaveButton, pickerDirection === null && styles.disabledButton]}
                  disabled={pickerDirection === null}
                  onPress={() => handleAddEffect(option, activeDimension.id, pickerDirection as 1 | -1, pickerStrength)}>
                  <ThemedText style={styles.effectPickerSaveText}>Save</ThemedText>
                </Pressable>
              </>
            ) : (
              <>
                <ThemedText style={styles.effectPickerHint}>
                  Choose a trait, then a direction and strength (up to {MAX_PERSONALITY_EFFECTS_PER_OPTION} per answer).
                </ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.effectPickerScrollRow}>
                  {PERSONALITY_DIMENSIONS.map((dimension) => (
                    <Pressable key={dimension.id} style={styles.effectPickerDimensionChip} onPress={() => setPickerDimension(dimension.id)}>
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
          <ThemedText style={styles.revealLabel}>APPARENTLY...</ThemedText>
          {canEditContent ? (
            <>
              {!hasFeedback && <ThemedText style={styles.suggestionNeededText}>Suggestion needed</ThemedText>}
              <TextInput
                value={draft.feedback}
                onChangeText={(value) => setOptionDrafts((c) => ({ ...c, [option.id]: { ...draft, feedback: value } }))}
                onBlur={() => commitOption(option)}
                multiline
                style={styles.revealInput}
                placeholder="Write the Apparently response for this answer..."
              />
            </>
          ) : hasFeedback ? (
            <ThemedText style={styles.revealText}>{option.apparently_feedback}</ThemedText>
          ) : (
            <ThemedText style={styles.missingText}>No Apparently response assigned yet.</ThemedText>
          )}
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
            {/* Always plain text, never a TextInput here — a large multiline TextInput
                inside this purple card was the source of a real mobile Safari/RN Web bug
                where the full question failed to show on initial render (internal scroll
                offset landing mid-string). This preview always reflects the last-saved
                prompt; the actual editable field lives in the card below. */}
            <ThemedText style={styles.questionText}>{question.prompt}</ThemedText>
          </View>

          {canEditContent && (
            <View style={styles.editFieldsCard}>
              <View style={styles.editField}>
                <ThemedText style={styles.editFieldLabel}>QUESTION</ThemedText>
                <TextInput
                  value={promptDraft}
                  onChangeText={setPromptDraft}
                  onBlur={commitPrompt}
                  multiline
                  style={styles.editFieldInput}
                />
              </View>
              <View style={styles.editField}>
                <ThemedText style={styles.editFieldLabel}>CATEGORY</ThemedText>
                <TextInput
                  value={categoryDraft}
                  onChangeText={setCategoryDraft}
                  onBlur={commitPrompt}
                  style={styles.editFieldInputSingle}
                  placeholder="e.g. Everyday"
                  placeholderTextColor={Brand.inkSecondary}
                />
              </View>
            </View>
          )}

          {actionError && (
            <View style={styles.issuesCard}>
              <ThemedText style={styles.issuesTitle}>{actionError}</ThemedText>
            </View>
          )}

          {question.review_note && (
            <View style={styles.noteCallout}>
              <ThemedText style={styles.noteCalloutEyebrow}>EDITORIAL NOTE FROM LAST REVIEW</ThemedText>
              <ThemedText style={styles.noteCalloutText}>{question.review_note}</ThemedText>
            </View>
          )}

          {options.map((option, index) => renderAnswerCard(option, index))}

          <View style={styles.metaCard}>
            <MetaRow label="CATEGORY" value={question.category} />
            <MetaRow label="STATUS" value={DAILY_STATUS_LABELS[question.status]} />
            {question.scheduled_for && <MetaRow label="SCHEDULED DATE" value={question.scheduled_for} />}
            {question.published_for && <MetaRow label="PUBLISHED FOR" value={question.published_for} />}
            {question.approved_by && (
              <MetaRow label="APPROVAL" value={`Approved ${formatDateTime(question.approved_at)}`} />
            )}
          </View>

          {issues.length > 0 && (
            <View style={styles.issuesCard}>
              <ThemedText style={styles.issuesTitle}>Before this can be approved:</ThemedText>
              {issues.map((issue) => (
                <ThemedText key={issue} style={styles.issueText}>• {issue}</ThemedText>
              ))}
            </View>
          )}

          <View style={styles.actionsCard}>
            <ThemedText style={styles.actionsTitle}>Editorial decision</ThemedText>

            {approvalTransitionValid && (
              <Pressable style={[styles.approveButton, !canApprove && styles.disabledButton]} disabled={!canApprove} onPress={handleApprove}>
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
  container: { flex: 1, backgroundColor: '#FFF9F5' },
  safeArea: { flex: 1, width: '100%', maxWidth: AdminMaxContentWidth, alignSelf: 'center' },
  content: { paddingHorizontal: Spacing.four, paddingTop: Spacing.three, paddingBottom: BottomTabInset + Spacing.five, gap: Spacing.three },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three, padding: Spacing.four },
  notFoundText: { color: Brand.ink, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  backButton: { backgroundColor: Brand.pink, borderRadius: 12, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  backButtonText: { color: '#FFFFFF', fontWeight: '800' },
  backLink: { alignSelf: 'flex-start' },
  backLinkText: { color: Brand.violet, fontSize: 13, fontWeight: '800' },
  header: { gap: 4, backgroundColor: Brand.violet, borderRadius: 24, padding: Spacing.four },
  eyebrow: { color: '#DCD6FF', fontSize: 11, fontWeight: '800', letterSpacing: 1.3 },
  headerMeta: { color: '#DCD6FF', fontSize: 13, fontWeight: '700' },
  questionText: { color: '#FFFFFF', fontSize: 24, lineHeight: 30, fontWeight: '800', letterSpacing: -0.5, marginTop: Spacing.one },
  editFieldsCard: { backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#F0E6E8', padding: Spacing.three, gap: Spacing.three },
  editField: { gap: Spacing.one },
  editFieldLabel: { color: Brand.violet, fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  editFieldInput: { color: Brand.ink, backgroundColor: '#F6F2FF', borderRadius: 12, borderWidth: 1, borderColor: '#E8E2FF', padding: Spacing.two, fontSize: 17, lineHeight: 23, fontWeight: '700', minHeight: 68 },
  editFieldInputSingle: { color: Brand.ink, backgroundColor: '#F6F2FF', borderRadius: 12, borderWidth: 1, borderColor: '#E8E2FF', paddingHorizontal: Spacing.two, paddingVertical: Spacing.two, fontSize: 15, fontWeight: '600' },
  noteCallout: { backgroundColor: '#FCE9ED', borderRadius: 16, padding: Spacing.three, gap: 2 },
  noteCalloutEyebrow: { color: '#9E2E4F', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  noteCalloutText: { color: '#9E2E4F', fontSize: 14, fontWeight: '600', lineHeight: 20 },
  answerCard: { backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: '#F0E6E8', padding: Spacing.four, gap: Spacing.three },
  answerHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  answerLetterBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: Brand.pink, alignItems: 'center', justifyContent: 'center' },
  answerLetterText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  answerTextDisplay: { flex: 1, color: Brand.ink, fontSize: 20, lineHeight: 26, fontWeight: '800', marginTop: 4 },
  answerTextInput: { flex: 1, color: Brand.ink, fontSize: 20, lineHeight: 26, fontWeight: '800', marginTop: 2, padding: 0 },
  traitRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one, alignItems: 'center' },
  traitChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F1ECF8', borderRadius: 99, paddingHorizontal: Spacing.two, paddingVertical: 6 },
  traitChipActive: { backgroundColor: Brand.violet },
  traitChipText: { color: Brand.violet, fontSize: 13, fontWeight: '800' },
  traitChipTextActive: { color: '#FFFFFF' },
  traitChipRemove: { color: Brand.violet, fontSize: 12, fontWeight: '800', opacity: 0.7 },
  addTraitChip: { backgroundColor: '#FFFFFF', borderRadius: 99, borderWidth: 1, borderColor: Brand.violet, paddingHorizontal: Spacing.two, paddingVertical: 6 },
  addTraitChipText: { color: Brand.violet, fontSize: 12, fontWeight: '800' },
  missingText: { color: '#9E2E4F', fontSize: 13, fontWeight: '700', fontStyle: 'italic' },
  suggestionNeededText: { color: '#9B6812', fontSize: 12, fontWeight: '700', fontStyle: 'italic' },
  effectPicker: { backgroundColor: '#F8F5FF', borderRadius: 16, padding: Spacing.two, gap: Spacing.two },
  effectPickerHint: { color: Brand.inkSecondary, fontSize: 11, fontWeight: '700' },
  effectPickerScrollRow: { gap: 6, paddingVertical: 2 },
  effectPickerDimensionChip: { backgroundColor: '#FFFFFF', borderRadius: 99, borderWidth: 1, borderColor: '#E8E2FF', paddingHorizontal: Spacing.two, paddingVertical: 6 },
  effectPickerDimensionText: { color: Brand.ink, fontSize: 12, fontWeight: '700' },
  effectPickerBack: { alignSelf: 'flex-start' },
  effectPickerBackText: { color: Brand.violet, fontSize: 12, fontWeight: '800' },
  effectPickerCurrent: { color: Brand.violet, fontSize: 13, fontWeight: '800' },
  effectPickerSectionLabel: { color: Brand.inkSecondary, fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginTop: 2 },
  effectPickerPoleRow: { flexDirection: 'row', gap: Spacing.two },
  effectPickerPoleButton: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E8E2FF', paddingVertical: Spacing.two, alignItems: 'center' },
  effectPickerStrengthButton: { width: 64, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E8E2FF', paddingVertical: Spacing.two, alignItems: 'center' },
  effectPickerButtonSelected: { backgroundColor: Brand.violet, borderColor: Brand.violet },
  effectPickerPoleText: { color: Brand.ink, fontSize: 13, fontWeight: '800' },
  effectPickerTextSelected: { color: '#FFFFFF' },
  effectPickerSaveButton: { backgroundColor: Brand.pink, borderRadius: 12, paddingVertical: Spacing.two, alignItems: 'center', marginTop: Spacing.one },
  effectPickerSaveText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  revealBlock: { backgroundColor: '#FFE9E0', borderRadius: 18, padding: Spacing.three, gap: 6 },
  revealLabel: { color: Brand.coral, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  revealText: { color: Brand.ink, fontSize: 16, lineHeight: 23, fontWeight: '700' },
  revealInput: { color: Brand.ink, fontSize: 16, lineHeight: 23, fontWeight: '700', padding: 0, minHeight: 46 },
  metaCard: { backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#F0E6E8', padding: Spacing.three, gap: Spacing.two },
  metaRow: { gap: 2 },
  metaLabel: { color: Brand.violet, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  metaValue: { color: Brand.ink, fontSize: 14, fontWeight: '600' },
  issuesCard: { backgroundColor: '#FCE9ED', borderRadius: 20, padding: Spacing.three, gap: Spacing.one },
  issuesTitle: { color: '#9E2E4F', fontSize: 14, fontWeight: '800' },
  issueText: { color: '#9E2E4F', fontSize: 13, fontWeight: '600', lineHeight: 19 },
  actionsCard: { backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#F0E6E8', padding: Spacing.three, gap: Spacing.two },
  actionsTitle: { color: Brand.ink, fontSize: 16, fontWeight: '800' },
  approveButton: { backgroundColor: Brand.pink, borderRadius: 14, paddingVertical: Spacing.three, alignItems: 'center' },
  approveButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
  disabledButton: { opacity: 0.4 },
  noteField: { gap: Spacing.one },
  noteLabel: { color: Brand.violet, fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  noteInput: { color: Brand.ink, backgroundColor: '#F6F2FF', borderRadius: 12, borderWidth: 1, borderColor: '#E8E2FF', padding: Spacing.two, fontSize: 14, minHeight: 60 },
  revisionButton: { backgroundColor: '#F5F0FF', borderRadius: 12, paddingVertical: Spacing.two, alignItems: 'center', marginTop: Spacing.one },
  revisionButtonText: { color: Brand.violet, fontSize: 14, fontWeight: '800' },
  rejectButton: { backgroundColor: '#FCE9ED', borderRadius: 12, paddingVertical: Spacing.two, alignItems: 'center' },
  rejectButtonText: { color: '#9E2E4F', fontSize: 14, fontWeight: '800' },
  noActionsText: { color: Brand.inkSecondary, fontSize: 13, fontWeight: '600', fontStyle: 'italic' },
});
