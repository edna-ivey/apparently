import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AdminMaxContentWidth, Brand, BottomTabInset, Spacing } from '@/constants/theme';
import {
  archiveQuestion as archiveQuestionInStore,
  canDeleteQuestion,
  DAILY_STATUS_LABELS,
  type DailyQuestion,
  type DailyStatus,
  deleteQuestion as deleteQuestionInStore,
  getPublishNextTargetDate,
  getScheduleInsertionPreview,
  hydrateQuestions,
  insertQuestionAtDate as insertQuestionAtDateInStore,
  isValidDateValue,
  moveQuestion as moveQuestionInStore,
  moveToDraft as moveToDraftInStore,
  rejectQuestion as rejectQuestionInStore,
  scheduleQuestion as scheduleQuestionInStore,
  sendToRevision as sendToRevisionInStore,
  submitForReview as submitForReviewInStore,
  useDailyQuestions,
} from '@/data/daily-questions';
import { confirmAction } from '@/utils/confirm-action';

// Statuses where the Review Studio has something meaningful to review or act on. Live
// and Archived still get a "View" link (useful read-only reference), everything else
// gets "Review".
const REVIEWABLE_ACTION_LABEL: Record<DailyStatus, string> = {
  Idea: 'Review →',
  Draft: 'Review →',
  ReadyForReview: 'Review & Approve →',
  NeedsRevision: 'Review →',
  Rejected: 'Review →',
  Approved: 'Review →',
  Scheduled: 'Review →',
  Live: 'View →',
  Archived: 'View →',
};

const SECTION_ORDER: { title: string; status: DailyStatus; emptyLabel: string }[] = [
  { title: 'Ready for review', status: 'ReadyForReview', emptyLabel: 'nothing waiting on your approval' },
  { title: 'Needs revision', status: 'NeedsRevision', emptyLabel: 'nothing currently needs revision' },
  { title: 'Drafts', status: 'Draft', emptyLabel: 'no drafts right now' },
  { title: 'Ideas', status: 'Idea', emptyLabel: 'no raw ideas queued up' },
  { title: 'Approved (unscheduled)', status: 'Approved', emptyLabel: 'nothing waiting to be scheduled' },
  { title: 'Scheduled', status: 'Scheduled', emptyLabel: 'nothing scheduled yet' },
  { title: 'Live today', status: 'Live', emptyLabel: 'nothing is live yet' },
  { title: 'Rejected', status: 'Rejected', emptyLabel: 'nothing rejected right now' },
  { title: 'Archived', status: 'Archived', emptyLabel: 'nothing archived yet' },
];

export default function DailyAdminScreen() {
  const router = useRouter();
  const questions = useDailyQuestions();
  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  // Local draft text for the release-date field, keyed by question id. The store now
  // rejects invalid dates outright (never persists them), so the input can't be a plain
  // controlled field bound to the persisted value — that would fight every keystroke of
  // an in-progress date. This draft holds whatever the editor is currently typing; it is
  // only ever reconciled with the store when a keystroke produces a valid date.
  const [scheduleDrafts, setScheduleDrafts] = useState<Record<number, string>>({});

  useEffect(() => {
    void hydrateQuestions();
  }, []);

  const getScheduleDraft = (question: DailyQuestion) => scheduleDrafts[question.id] ?? question.scheduledFor ?? '';

  const setScheduleDraft = (question: DailyQuestion, value: string) => {
    setScheduleDrafts((current) => ({ ...current, [question.id]: value }));
  };

  // Committed on blur, not per keystroke — a collision confirmation firing mid-typing
  // would be unusable. The draft above keeps typing responsive; this is the one moment
  // the store actually gets touched.
  const handleScheduleCommit = (question: DailyQuestion) => {
    const draft = getScheduleDraft(question).trim();

    if (draft === '') {
      scheduleQuestionInStore(question.id, '');
      return;
    }

    if (!isValidDateValue(draft)) {
      return;
    }

    const preview = getScheduleInsertionPreview(question.id, draft);
    if (!preview) {
      return;
    }

    if (preview.shiftedCount === 0) {
      insertQuestionAtDateInStore(question.id, draft);
      return;
    }

    confirmAction(
      `Insert this Daily on ${draft}? ${preview.shiftedCount} ${
        preview.shiftedCount === 1 ? 'Daily' : 'Dailies'
      } scheduled on or after ${draft} will move back one day.`,
      () => insertQuestionAtDateInStore(question.id, draft),
      { title: 'Insert & Shift', confirmLabel: 'Insert & Shift' }
    );
  };

  const handlePublishNext = (question: DailyQuestion) => {
    const targetDate = getPublishNextTargetDate();
    const preview = getScheduleInsertionPreview(question.id, targetDate);
    if (!preview) {
      return;
    }

    const shiftSentence =
      preview.shiftedCount > 0
        ? ` ${preview.shiftedCount} future ${preview.shiftedCount === 1 ? 'Daily' : 'Dailies'} will move back one day.`
        : '';

    confirmAction(
      `Publish this Daily next? It will be scheduled for ${targetDate}.${shiftSentence} Today's Live question will not change.`,
      () => insertQuestionAtDateInStore(question.id, targetDate),
      { title: 'Publish Next', confirmLabel: 'Publish Next' }
    );
  };

  const byStatus = useMemo(() => {
    const groups: Record<DailyStatus, DailyQuestion[]> = {
      Idea: [],
      Draft: [],
      ReadyForReview: [],
      NeedsRevision: [],
      Rejected: [],
      Approved: [],
      Scheduled: [],
      Live: [],
      Archived: [],
    };
    questions.forEach((question) => groups[question.status].push(question));
    Object.entries(groups).forEach(([status, list]) => {
      // The Scheduled queue is a date-ordered publishing line, not an `order`-ranked
      // list — sorting it by date is what makes Publish Next / Insert & Shift legible.
      if (status === 'Scheduled') {
        list.sort((a, b) => (a.scheduledFor ?? '').localeCompare(b.scheduledFor ?? ''));
      } else {
        list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      }
    });
    return groups;
  }, [questions]);

  const toggleExpanded = (id: number) => {
    setExpandedIds((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  };

  const handleDelete = (question: DailyQuestion) => {
    confirmAction(`Delete "${question.prompt}"? This cannot be undone.`, () => deleteQuestionInStore(question.id));
  };

  const handleArchive = (question: DailyQuestion) => {
    confirmAction(
      `Archive "${question.prompt}"? This retires it from Live. Archived Dailies are permanently locked — they cannot be edited, deleted, or returned to Live.`,
      () => archiveQuestionInStore(question.id)
    );
  };

  // Approve only ever happens from the Review Studio, where the reviewer has seen every
  // answer's complete experience — there is deliberately no quick "Approve" shortcut here.
  const renderActions = (question: DailyQuestion) => {
    switch (question.status) {
      case 'Idea':
        return (
          <Pressable style={styles.primaryButton} onPress={() => moveToDraftInStore(question.id)}>
            <ThemedText style={styles.primaryText}>Move to Draft</ThemedText>
          </Pressable>
        );
      case 'Draft':
        return (
          <>
            <Pressable style={styles.primaryButton} onPress={() => submitForReviewInStore(question.id)}>
              <ThemedText style={styles.primaryText}>Submit for Review</ThemedText>
            </Pressable>
            <Pressable style={styles.ghostButton} onPress={() => rejectQuestionInStore(question.id)}>
              <ThemedText style={styles.ghostText}>Reject</ThemedText>
            </Pressable>
          </>
        );
      case 'ReadyForReview':
        return (
          <>
            <Pressable style={styles.secondaryButton} onPress={() => sendToRevisionInStore(question.id)}>
              <ThemedText style={styles.secondaryText}>Send to Revision</ThemedText>
            </Pressable>
            <Pressable style={styles.ghostButton} onPress={() => rejectQuestionInStore(question.id)}>
              <ThemedText style={styles.ghostText}>Reject</ThemedText>
            </Pressable>
          </>
        );
      case 'NeedsRevision':
        return (
          <>
            <Pressable style={styles.secondaryButton} onPress={() => moveToDraftInStore(question.id)}>
              <ThemedText style={styles.secondaryText}>Back to Draft</ThemedText>
            </Pressable>
            <Pressable style={styles.primaryButton} onPress={() => submitForReviewInStore(question.id)}>
              <ThemedText style={styles.primaryText}>Resubmit for Review</ThemedText>
            </Pressable>
          </>
        );
      case 'Rejected':
        return (
          <Pressable style={styles.secondaryButton} onPress={() => moveToDraftInStore(question.id)}>
            <ThemedText style={styles.secondaryText}>Restore to Draft</ThemedText>
          </Pressable>
        );
      case 'Approved':
        return (
          <>
            <Pressable style={styles.primaryButton} onPress={() => handlePublishNext(question)}>
              <ThemedText style={styles.primaryText}>Publish Next</ThemedText>
            </Pressable>
            <Pressable style={styles.ghostButton} onPress={() => sendToRevisionInStore(question.id)}>
              <ThemedText style={styles.ghostText}>Send to Revision</ThemedText>
            </Pressable>
          </>
        );
      case 'Scheduled':
        // No "Publish Now" here — today's Live Daily cannot be casually replaced from
        // normal Admin (Part 4/10). A Scheduled question becomes Live on its own date;
        // forcing it Live early is an emergency/privileged operation, not built here.
        return (
          <Pressable style={styles.ghostButton} onPress={() => sendToRevisionInStore(question.id)}>
            <ThemedText style={styles.ghostText}>Send to Revision</ThemedText>
          </Pressable>
        );
      case 'Live':
        return (
          <Pressable style={styles.ghostButton} onPress={() => handleArchive(question)}>
            <ThemedText style={styles.ghostText}>Archive</ThemedText>
          </Pressable>
        );
      case 'Archived':
      default:
        return null;
    }
  };

  const renderQuestionCard = (question: DailyQuestion) => {
    const expanded = expandedIds.includes(question.id);
    const metaParts = [DAILY_STATUS_LABELS[question.status].toUpperCase(), question.category.toUpperCase()];
    if (question.status === 'Scheduled' && question.scheduledFor) {
      metaParts.push(question.scheduledFor);
    }

    return (
      <View key={question.id} style={styles.card}>
        <View style={[styles.metaRow]}>
          <View style={[styles.statusDot, STATUS_DOT_STYLES[question.status]]} />
          <ThemedText style={styles.metaText}>{metaParts.join(' · ')}</ThemedText>
        </View>

        <ThemedText style={styles.questionText}>{question.prompt}</ThemedText>

        {question.status === 'NeedsRevision' && question.reviewNote && (
          <ThemedText style={styles.reviewNotePreview} numberOfLines={2}>
            📝 {question.reviewNote}
          </ThemedText>
        )}

        <View style={styles.cardFooter}>
          <Pressable
            style={styles.reviewLink}
            onPress={() => router.push({ pathname: '/admin/review/[id]', params: { id: String(question.id) } })}>
            <ThemedText style={styles.reviewLinkText}>{REVIEWABLE_ACTION_LABEL[question.status]}</ThemedText>
          </Pressable>

          <Pressable onPress={() => toggleExpanded(question.id)}>
            <ThemedText style={styles.manageLinkText}>{expanded ? 'Hide actions' : 'Manage'}</ThemedText>
          </Pressable>
        </View>

        {expanded && (
          <View style={styles.expandedSection}>
            {(question.status === 'Approved' || question.status === 'Scheduled') && (
              <View style={styles.scheduleField}>
                <ThemedText style={styles.scheduleLabel}>Release date</ThemedText>
                <TextInput
                  value={getScheduleDraft(question)}
                  onChangeText={(value) => setScheduleDraft(question, value)}
                  onBlur={() => handleScheduleCommit(question)}
                  placeholder="YYYY-MM-DD"
                  keyboardType="default"
                  style={styles.scheduleInput}
                />
                {getScheduleDraft(question).trim() !== '' && !isValidDateValue(getScheduleDraft(question)) && (
                  <ThemedText style={styles.scheduleWarning}>Use the YYYY-MM-DD format.</ThemedText>
                )}
              </View>
            )}

            <View style={styles.actionsRow}>
              {renderActions(question)}

              {canDeleteQuestion(question.status) && (
                <Pressable style={styles.ghostButton} onPress={() => handleDelete(question)}>
                  <ThemedText style={styles.ghostText}>Delete</ThemedText>
                </Pressable>
              )}

              {question.status === 'Approved' && (
                <>
                  <Pressable
                    style={[styles.secondaryButton, question.order === 1 && styles.disabledButton]}
                    onPress={() => moveQuestionInStore(question.id, 'up')}
                    disabled={question.order === 1}>
                    <ThemedText style={styles.secondaryText}>Move up</ThemedText>
                  </Pressable>
                  <Pressable style={styles.secondaryButton} onPress={() => moveQuestionInStore(question.id, 'down')}>
                    <ThemedText style={styles.secondaryText}>Move down</ThemedText>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderSection = ({ title, status, emptyLabel }: (typeof SECTION_ORDER)[number]) => {
    const items = byStatus[status];

    if (items.length === 0) {
      return (
        <View key={status} style={styles.emptySectionRow}>
          <ThemedText style={styles.emptySectionText}>
            {title} — {emptyLabel}
          </ThemedText>
        </View>
      );
    }

    return (
      <View key={status} style={styles.section}>
        <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
        {items.map((question) => renderQuestionCard(question))}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View>
              <ThemedText style={styles.eyebrow}>DAILY QUESTION EDITORIAL</ThemedText>
              <ThemedText style={styles.heading}>Nothing goes live without a human.</ThemedText>
            </View>
            <Pressable onPress={() => router.push('/')} style={styles.backButton}>
              <ThemedText style={styles.backText}>Back</ThemedText>
            </Pressable>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <ThemedText style={styles.statValue}>{byStatus.ReadyForReview.length}</ThemedText>
              <ThemedText style={styles.statLabel}>needs review</ThemedText>
            </View>
            <View style={styles.statBox}>
              <ThemedText style={styles.statValue}>{byStatus.NeedsRevision.length}</ThemedText>
              <ThemedText style={styles.statLabel}>needs revision</ThemedText>
            </View>
            <View style={styles.statBox}>
              <ThemedText style={styles.statValue}>{byStatus.Scheduled.length}</ThemedText>
              <ThemedText style={styles.statLabel}>scheduled</ThemedText>
            </View>
            <View style={styles.statBox}>
              <ThemedText style={styles.statValue}>{byStatus.Live.length}</ThemedText>
              <ThemedText style={styles.statLabel}>live</ThemedText>
            </View>
          </View>

          {SECTION_ORDER.map(renderSection)}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const STATUS_DOT_STYLES: Record<DailyStatus, object> = {
  Idea: { backgroundColor: '#5D4FB8' },
  Draft: { backgroundColor: '#9B6812' },
  ReadyForReview: { backgroundColor: '#1C5CB8' },
  NeedsRevision: { backgroundColor: '#9E2E4F' },
  Approved: { backgroundColor: '#1B7A4E' },
  Scheduled: { backgroundColor: '#5D4FB8' },
  Live: { backgroundColor: '#1B6A54' },
  Rejected: { backgroundColor: '#9E2E4F' },
  Archived: { backgroundColor: '#5A5550' },
};

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
    paddingTop: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  eyebrow: {
    color: Brand.pink,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  heading: {
    color: Brand.ink,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginTop: Spacing.one,
    maxWidth: 420,
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
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  statBox: {
    flexGrow: 1,
    flexBasis: 130,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: Spacing.two,
    borderWidth: 1,
    borderColor: '#F0E6E8',
    alignItems: 'center',
  },
  statValue: {
    color: Brand.ink,
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
    textAlign: 'center',
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    color: Brand.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  emptySectionRow: {
    paddingVertical: Spacing.one,
  },
  emptySectionText: {
    color: Brand.inkSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: Spacing.three,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: '#F0E6E8',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  metaText: {
    color: Brand.inkSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  questionText: {
    color: Brand.ink,
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '700',
  },
  reviewNotePreview: {
    color: '#9E2E4F',
    fontSize: 12,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  reviewLink: {
    alignSelf: 'flex-start',
  },
  reviewLinkText: {
    color: Brand.pink,
    fontSize: 14,
    fontWeight: '800',
  },
  manageLinkText: {
    color: Brand.inkSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  expandedSection: {
    gap: Spacing.two,
    marginTop: Spacing.one,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: '#F5EFEC',
  },
  scheduleField: {
    gap: Spacing.one,
  },
  scheduleLabel: {
    color: Brand.violet,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  scheduleInput: {
    color: Brand.ink,
    backgroundColor: '#F6F2FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E2FF',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    fontSize: 13,
    fontWeight: '600',
  },
  scheduleWarning: {
    color: '#9E2E4F',
    fontSize: 11,
    fontWeight: '700',
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
});
