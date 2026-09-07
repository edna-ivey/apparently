import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import {
  approveQuestion as approveQuestionInStore,
  deleteQuestion as deleteQuestionInStore,
  hydrateQuestions,
  isValidDateValue,
  moveQuestion as moveQuestionInStore,
  publishQuestion as publishQuestionInStore,
  rejectQuestion as rejectQuestionInStore,
  scheduleQuestion as scheduleQuestionInStore,
  type DailyQuestion,
  updateQuestionOption as updateQuestionOptionInStore,
  updateQuestionPrompt as updateQuestionPromptInStore,
  useDailyQuestions,
  validateScheduledQuestion as validateScheduledQuestionInStore,
} from '@/data/daily-questions';

export default function DailyAdminScreen() {
  const router = useRouter();
  const questions = useDailyQuestions();
  const [expandedIds, setExpandedIds] = useState<number[]>([1]);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    void hydrateQuestions();
  }, []);

  const liveQuestions = useMemo(
    () => [...questions].filter((question) => question.status === 'Live').sort((a, b) => a.order - b.order),
    [questions]
  );

  const approvedQuestions = useMemo(
    () => [...questions].filter((question) => question.status === 'Approved').sort((a, b) => a.order - b.order),
    [questions]
  );

  const scheduledQuestions = useMemo(
    () =>
      [...questions]
        .filter((question) => question.status === 'Scheduled')
        .sort((a, b) => (a.scheduledFor ?? '').localeCompare(b.scheduledFor ?? '') || (a.order ?? 0) - (b.order ?? 0)),
    [questions]
  );

  const todayKey = new Date().toISOString().slice(0, 10);
  const readyQuestions = useMemo(
    () =>
      [...questions]
        .filter((question) => question.status === 'Approved')
        .filter((question) => !question.scheduledFor || !isValidDateValue(question.scheduledFor) || question.scheduledFor <= todayKey)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [questions, todayKey]
  );

  const queueQuestions = useMemo(
    () => [...approvedQuestions].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [approvedQuestions]
  );

  const draftQuestions = useMemo(
    () => questions.filter((question) => question.status === 'Draft'),
    [questions]
  );

  const rejectedQuestions = useMemo(
    () => questions.filter((question) => question.status === 'Rejected'),
    [questions]
  );

  const nextRelease = scheduledQuestions[0] ?? readyQuestions[0] ?? liveQuestions[0] ?? null;

  const toggleExpanded = (id: number) => {
    setExpandedIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );
  };

  const updateQuestionPrompt = (id: number, value: string) => {
    updateQuestionPromptInStore(id, value);
  };

  const updateQuestionOption = (id: number, optionId: number, field: 'label' | 'percent', value: string) => {
    updateQuestionOptionInStore(id, optionId, field, value);
  };

  const approveQuestion = (id: number) => {
    approveQuestionInStore(id);
  };

  const rejectQuestion = (id: number) => {
    rejectQuestionInStore(id);
  };

  const deleteQuestion = (id: number) => {
    deleteQuestionInStore(id);
  };

  const publishQuestion = (id: number) => {
    publishQuestionInStore(id);
  };

  const validateScheduledQuestion = (id: number) => {
    validateScheduledQuestionInStore(id);
  };

  const moveQuestion = (id: number, direction: 'up' | 'down') => {
    moveQuestionInStore(id, direction);
  };

  const formatScheduleLabel = (scheduledFor: string | null) => {
    if (!scheduledFor || !isValidDateValue(scheduledFor)) {
      return 'No release date';
    }

    const date = new Date(`${scheduledFor}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) {
      return 'No release date';
    }

    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  };

  const updateSchedule = (id: number, value: string) => {
    scheduleQuestionInStore(id, value);
  };

  const renderQuestionCard = (question: DailyQuestion) => {
    const expanded = expandedIds.includes(question.id);
    const isEditing = editingId === question.id;
    const scheduleMeta = question.scheduledFor ? ` • ${formatScheduleLabel(question.scheduledFor)}` : '';

    return (
      <View key={question.id} style={styles.card}>
        <Pressable onPress={() => toggleExpanded(question.id)} style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <ThemedText style={[styles.cardBadge, question.status === 'Live' && styles.liveBadge, question.status === 'Rejected' && styles.rejectedBadge]}>{question.status}</ThemedText>
            <ThemedText style={styles.cardCategory}>{question.category}</ThemedText>
          </View>
          <ThemedText style={styles.cardMeta}>{question.status === 'Approved' || question.status === 'Live' ? `#${question.order}${scheduleMeta}` : question.status === 'Scheduled' ? `#${question.order}${scheduleMeta}` : 'Review'}</ThemedText>
        </Pressable>

        {expanded && (
          <>
            {(question.status === 'Approved' || question.status === 'Scheduled') && (
              <View style={styles.scheduleField}>
                <ThemedText style={styles.scheduleLabel}>Release date</ThemedText>
                <TextInput
                  value={question.scheduledFor ?? ''}
                  onChangeText={(value) => updateSchedule(question.id, value)}
                  placeholder="YYYY-MM-DD"
                  keyboardType="default"
                  style={styles.scheduleInput}
                />
              </View>
            )}

            {isEditing ? (
              <>
                <TextInput
                  value={question.prompt}
                  onChangeText={(value) => updateQuestionPrompt(question.id, value)}
                  placeholder="Question prompt"
                  multiline
                  style={styles.textInput}
                />
                <View style={styles.optionList}>
                  {question.options.map((option, index) => (
                    <View key={option.id} style={styles.optionRow}>
                      <ThemedText style={styles.optionLetter}>{String.fromCharCode(65 + index)}</ThemedText>
                      <TextInput
                        value={option.label}
                        onChangeText={(value) => updateQuestionOption(question.id, option.id, 'label', value)}
                        style={[styles.optionInput, styles.optionLabelInput]}
                      />
                      <TextInput
                        value={String(option.percent)}
                        onChangeText={(value) => updateQuestionOption(question.id, option.id, 'percent', value)}
                        keyboardType="numeric"
                        style={[styles.optionInput, styles.optionPercentInput]}
                      />
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <>
                <ThemedText style={styles.cardPrompt}>{question.prompt}</ThemedText>
                <View style={styles.answerList}>
                  {question.options.map((option, index) => (
                    <View key={option.id} style={styles.answerItem}>
                      <ThemedText style={styles.answerLetter}>{String.fromCharCode(65 + index)}</ThemedText>
                      <ThemedText style={styles.answerText}>{option.label}</ThemedText>
                      <ThemedText style={styles.answerPercent}>{option.percent}%</ThemedText>
                    </View>
                  ))}
                </View>
              </>
            )}

            <View style={styles.actionsRow}>
              {question.status === 'Draft' ? (
                <Pressable style={styles.primaryButton} onPress={() => approveQuestion(question.id)}>
                  <ThemedText style={styles.primaryText}>Approve</ThemedText>
                </Pressable>
              ) : question.status === 'Rejected' ? (
                <Pressable style={styles.primaryButton} onPress={() => approveQuestion(question.id)}>
                  <ThemedText style={styles.primaryText}>Restore</ThemedText>
                </Pressable>
             ) : question.status === 'Scheduled' ? (
               <Pressable style={styles.primaryButton} onPress={() => validateScheduledQuestion(question.id)}>
                 <ThemedText style={styles.primaryText}>Validate</ThemedText>
                </Pressable>
             ) : (
               <Pressable style={styles.primaryButton} onPress={() => publishQuestion(question.id)}>
                 <ThemedText style={styles.primaryText}>Publish</ThemedText>
               </Pressable>
             )}

             {question.status !== 'Draft' && (
               <Pressable style={styles.secondaryButton} onPress={() => rejectQuestion(question.id)}>
                 <ThemedText style={styles.secondaryText}>Reject</ThemedText>
               </Pressable>
             )}

              <Pressable style={styles.secondaryButton} onPress={() => setEditingId((current) => (current === question.id ? null : question.id))}>
                <ThemedText style={styles.secondaryText}>{isEditing ? 'Done' : 'Edit'}</ThemedText>
              </Pressable>

              <Pressable style={styles.ghostButton} onPress={() => deleteQuestion(question.id)}>
                <ThemedText style={styles.ghostText}>Delete</ThemedText>
              </Pressable>

              {(question.status === 'Approved' || question.status === 'Live') && (
                <>
                  <Pressable
                    style={[styles.secondaryButton, question.order === 1 && styles.disabledButton]}
                    onPress={() => moveQuestion(question.id, 'up')}
                    disabled={question.order === 1}>
                    <ThemedText style={styles.secondaryText}>Move up</ThemedText>
                  </Pressable>
                  <Pressable style={styles.secondaryButton} onPress={() => moveQuestion(question.id, 'down')}>
                    <ThemedText style={styles.secondaryText}>Move down</ThemedText>
                  </Pressable>
                </>
              )}
            </View>
          </>
        )}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View>
              <ThemedText style={styles.eyebrow}>APPROVED DAILY QUEUE</ThemedText>
              <ThemedText style={styles.heading}>Manage what goes live.</ThemedText>
            </View>
            <Pressable onPress={() => router.push('/')} style={styles.backButton}>
              <ThemedText style={styles.backText}>Back</ThemedText>
            </Pressable>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <ThemedText style={styles.statValue}>{approvedQuestions.length}</ThemedText>
              <ThemedText style={styles.statLabel}>approved</ThemedText>
            </View>
            <View style={styles.statBox}>
              <ThemedText style={styles.statValue}>{draftQuestions.length}</ThemedText>
              <ThemedText style={styles.statLabel}>drafts</ThemedText>
            </View>
            <View style={styles.statBox}>
              <ThemedText style={styles.statValue}>{liveQuestions.length}</ThemedText>
              <ThemedText style={styles.statLabel}>live</ThemedText>
            </View>
          </View>

          <View style={styles.panel}>
            <ThemedText style={styles.sectionTitle}>Next in line</ThemedText>
            {nextRelease ? (
              <>
                <ThemedText style={styles.nextPrompt}>{nextRelease.prompt}</ThemedText>
                <ThemedText style={styles.nextMeta}>{nextRelease.category} · {nextRelease.status}</ThemedText>
              </>
            ) : (
              <ThemedText style={styles.empty}>Add an approved question to begin the queue.</ThemedText>
            )}
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Drafts</ThemedText>
            {draftQuestions.length === 0 ? (
              <ThemedText style={styles.empty}>No draft questions right now.</ThemedText>
            ) : (
              draftQuestions.map((question) => renderQuestionCard(question))
            )}
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Live today</ThemedText>
            {liveQuestions.length === 0 ? (
              <ThemedText style={styles.empty}>Nothing is live yet.</ThemedText>
            ) : (
              liveQuestions.map((question) => renderQuestionCard(question))
            )}
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Scheduled</ThemedText>
            {scheduledQuestions.length === 0 ? (
              <ThemedText style={styles.empty}>No scheduled questions yet.</ThemedText>
            ) : (
              scheduledQuestions.map((question) => renderQuestionCard(question))
            )}
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Approved queue</ThemedText>
            {queueQuestions.length === 0 ? (
              <ThemedText style={styles.empty}>No approved questions in the queue.</ThemedText>
            ) : (
              queueQuestions.map((question) => renderQuestionCard(question))
            )}
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Rejected</ThemedText>
            {rejectedQuestions.length === 0 ? (
              <ThemedText style={styles.empty}>No rejected questions right now.</ThemedText>
            ) : (
              rejectedQuestions.map((question) => renderQuestionCard(question))
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
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  content: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.two,
    marginBottom: 0,
  },
  headerLeft: {
    flexDirection: 'row',
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
    fontSize: 35,
    fontWeight: '800',
    letterSpacing: -1,
    marginTop: Spacing.one,
  },
  backButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderWidth: 1,
    borderColor: '#F0E6E8',
  },
  backText: {
    color: Brand.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: 0,
    marginBottom: 0,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: Spacing.two,
    borderWidth: 1,
    borderColor: '#F0E6E8',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.7,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Brand.violet,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  panel: {
    backgroundColor: '#E8E3FF',
    borderRadius: 18,
    padding: Spacing.two,
    gap: Spacing.one,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  nextPrompt: {
    fontSize: 20,
    lineHeight: 27,
    fontWeight: '800',
  },
  nextMeta: {
    color: '#5D5571',
    fontSize: 12,
    fontWeight: '700',
  },
  section: {
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: Spacing.three,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: '#F0E6E8',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  cardBadge: {
    backgroundColor: '#FFF0D2',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: 99,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#9B6812',
    textTransform: 'uppercase',
  },
  rejectedBadge: {
    backgroundColor: '#F9E6EB',
    color: '#9E2E4F',
  },
  liveBadge: {
    backgroundColor: '#DDF5EE',
    color: '#1B6A54',
  },
  cardCategory: {
    color: Brand.violet,
    fontSize: 12,
    fontWeight: '800',
  },
  cardMeta: {
    color: '#5D5571',
    fontSize: 11,
    fontWeight: '800',
  },
  cardPrompt: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '700',
  },
  answerList: {
    gap: Spacing.one,
  },
  answerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: '#F7F3FF',
    borderRadius: 12,
    padding: Spacing.two,
  },
  answerLetter: {
    width: 18,
    color: Brand.violet,
    fontSize: 12,
    fontWeight: '800',
  },
  optionLetter: {
    width: 18,
    color: Brand.violet,
    fontSize: 12,
    fontWeight: '800',
  },
  answerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  answerPercent: {
    color: Brand.pink,
    fontSize: 12,
    fontWeight: '800',
  },
  textInput: {
    backgroundColor: '#F8F5FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E2FF',
    padding: Spacing.two,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  },
  scheduleField: {
    gap: Spacing.one,
    marginBottom: Spacing.one,
  },
  scheduleLabel: {
    color: Brand.violet,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  scheduleInput: {
    backgroundColor: '#F6F2FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E2FF',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    fontSize: 13,
    fontWeight: '600',
  },
  optionList: {
    gap: Spacing.two,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  optionInput: {
    backgroundColor: '#F6F2FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E2FF',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    fontSize: 13,
  },
  optionLabelInput: {
    flex: 1,
  },
  optionPercentInput: {
    width: 60,
    textAlign: 'center',
  },
  primaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: Brand.pink,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  secondaryButton: {
    backgroundColor: '#F5F0FF',
    borderRadius: 10,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  secondaryText: {
    color: Brand.violet,
    fontSize: 12,
    fontWeight: '800',
  },
  ghostButton: {
    backgroundColor: '#FCE9ED',
    borderRadius: 10,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  ghostText: {
    color: '#9E2E4F',
    fontSize: 12,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.5,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  empty: {
    color: '#746D79',
    fontSize: 13,
    fontWeight: '600',
  },
});
