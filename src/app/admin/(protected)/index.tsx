import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScheduleDateField } from '@/components/admin/schedule-date-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AdminMaxContentWidth, Brand, BottomTabInset, Spacing } from '@/constants/theme';
import {
  approveDaily,
  archiveLiveDaily,
  createDaily,
  deleteDaily,
  getAdminDailyDistribution,
  listDailyOptions,
  listDailyQuestions,
  moveToDraft,
  publishDaily,
  rejectDaily,
  scheduleDaily,
  sendToRevision,
  submitForReview,
  unscheduleDaily,
  type AdminDistributionRow,
} from '@/services/admin-daily-service';
import { type AdminRole, getAdminRole, signOutAdmin } from '@/services/admin-auth-service';
import type { DailyQuestionRow } from '@/services/types';
import { canDeleteAdminDaily, DAILY_STATUS_LABELS } from '@/utils/admin-transitions';
import { confirmAction } from '@/utils/confirm-action';

// Production Admin dashboard — Sprint 1C-A. Loads REAL Supabase content via the admin_*
// RPCs (src/services/admin-daily-service.ts); the local prototype store
// (src/data/daily-questions.ts) is not used anywhere in this file. Real UUIDs throughout —
// never forced through the local numeric-id types.

type Status = DailyQuestionRow['status'];

const SECTION_ORDER: { title: string; status: Status; emptyLabel: string }[] = [
  { title: 'Live today', status: 'Live', emptyLabel: 'nothing is live yet' },
  { title: 'Ready for review', status: 'ReadyForReview', emptyLabel: 'nothing waiting on your approval' },
  { title: 'Needs revision', status: 'NeedsRevision', emptyLabel: 'nothing currently needs revision' },
  { title: 'Drafts', status: 'Draft', emptyLabel: 'no drafts right now' },
  { title: 'Ideas', status: 'Idea', emptyLabel: 'no raw ideas queued up' },
  { title: 'Approved (unscheduled)', status: 'Approved', emptyLabel: 'nothing waiting to be scheduled' },
  { title: 'Scheduled', status: 'Scheduled', emptyLabel: 'nothing scheduled yet' },
  { title: 'Rejected', status: 'Rejected', emptyLabel: 'nothing rejected right now' },
  { title: 'Archived', status: 'Archived', emptyLabel: 'nothing archived yet' },
];

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [role, setRole] = useState<AdminRole>('unauthorized');
  const [questions, setQuestions] = useState<DailyQuestionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [scheduleDrafts, setScheduleDrafts] = useState<Record<string, string>>({});
  const [revisionDrafts, setRevisionDrafts] = useState<Record<string, string>>({});
  const [liveDistribution, setLiveDistribution] = useState<AdminDistributionRow[] | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const result = await listDailyQuestions();
    if (result.ok) {
      setQuestions(result.data);
      const live = result.data.find((q) => q.status === 'Live');
      if (live) {
        const distribution = await getAdminDailyDistribution(live.id);
        setLiveDistribution(distribution.ok ? distribution.data : null);
      } else {
        setLiveDistribution(null);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void getAdminRole().then(setRole);
    void reload();
  }, [reload]);

  const byStatus = useMemo(() => {
    const groups: Record<Status, DailyQuestionRow[]> = {
      Idea: [], Draft: [], ReadyForReview: [], NeedsRevision: [], Rejected: [], Approved: [], Scheduled: [], Live: [], Archived: [],
    };
    questions.forEach((question) => groups[question.status].push(question));
    Object.entries(groups).forEach(([status, list]) => {
      if (status === 'Scheduled') {
        list.sort((a, b) => (a.scheduled_for ?? '').localeCompare(b.scheduled_for ?? ''));
      } else {
        list.sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''));
      }
    });
    return groups;
  }, [questions]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((current) => (current.includes(id) ? current.filter((v) => v !== id) : [...current, id]));
  };

  const runAction = async (label: string, action: () => Promise<{ ok: boolean; message?: string }>) => {
    setActionError(null);
    const result = await action();
    if (!result.ok) {
      setActionError(`${label} failed: ${result.message}`);
      return;
    }
    await reload();
  };

  const handleNewDaily = () => {
    void createDaily().then((result) => {
      if (result.ok) {
        void reload().then(() => router.push({ pathname: '/admin/review/[id]', params: { id: result.data } }));
      } else {
        setActionError(`New Daily failed: ${result.message}`);
      }
    });
  };

  const handleDelete = (question: DailyQuestionRow) => {
    confirmAction(`Delete "${question.prompt}"? This cannot be undone.`, () => {
      void runAction('Delete', () => deleteDaily(question.id));
    });
  };

  const handleArchive = (question: DailyQuestionRow) => {
    confirmAction(
      `Archive "${question.prompt}"? This retires it from Live. Archived Dailies are permanently locked — they cannot be edited, deleted, or returned to Live.`,
      () => void runAction('Archive', () => archiveLiveDaily(question.id)),
      { title: 'Archive Live Daily' },
    );
  };

  const handlePublishNow = (question: DailyQuestionRow) => {
    confirmAction(
      'Replace the currently Live Daily? The current question will be permanently Archived and can no longer accept new votes.',
      () => void runAction('Publish Now', () => publishDaily(question.id)),
      { title: 'Publish Now', confirmLabel: 'Yes, replace the Live Daily' },
    );
  };

  const getScheduleDraft = (q: DailyQuestionRow) => scheduleDrafts[q.id] ?? q.scheduled_for ?? '';
  const setScheduleDraft = (q: DailyQuestionRow, value: string) => setScheduleDrafts((c) => ({ ...c, [q.id]: value }));
  // Fires on native TextInput blur, and immediately on web's real date-input onChange (a
  // deliberate calendar selection, unlike free-text entry, needs no separate blur/Save step)
  // — see src/components/admin/schedule-date-field(.web).tsx for the platform split.
  const handleScheduleCommit = (q: DailyQuestionRow, value: string) => {
    const draft = value.trim();
    if (draft === '' || !/^\d{4}-\d{2}-\d{2}$/.test(draft) || draft === (q.scheduled_for ?? '')) {
      return;
    }
    void runAction('Schedule', () => scheduleDaily(q.id, draft));
  };

  const getRevisionDraft = (q: DailyQuestionRow) => revisionDrafts[q.id] ?? '';
  const setRevisionDraft = (q: DailyQuestionRow, value: string) => setRevisionDrafts((c) => ({ ...c, [q.id]: value }));

  const renderActions = (question: DailyQuestionRow) => {
    switch (question.status) {
      case 'Idea':
        return (
          <Pressable style={styles.primaryButton} onPress={() => void runAction('Move to Draft', () => moveToDraft(question.id))}>
            <ThemedText style={styles.primaryText}>Move to Draft</ThemedText>
          </Pressable>
        );
      case 'Draft':
        return (
          <>
            <Pressable style={styles.primaryButton} onPress={() => void runAction('Submit for Review', () => submitForReview(question.id))}>
              <ThemedText style={styles.primaryText}>Submit for Review</ThemedText>
            </Pressable>
            <Pressable style={styles.ghostButton} onPress={() => void runAction('Reject', () => rejectDaily(question.id))}>
              <ThemedText style={styles.ghostText}>Reject</ThemedText>
            </Pressable>
          </>
        );
      case 'ReadyForReview':
        return (
          <>
            <Pressable style={styles.primaryButton} onPress={() => void runAction('Approve', () => approveDaily(question.id))}>
              <ThemedText style={styles.primaryText}>Approve</ThemedText>
            </Pressable>
            <Pressable
              style={styles.secondaryButton}
              onPress={() => void runAction('Send to Revision', () => sendToRevision(question.id, getRevisionDraft(question)))}>
              <ThemedText style={styles.secondaryText}>Send to Revision</ThemedText>
            </Pressable>
            <Pressable style={styles.ghostButton} onPress={() => void runAction('Reject', () => rejectDaily(question.id))}>
              <ThemedText style={styles.ghostText}>Reject</ThemedText>
            </Pressable>
          </>
        );
      case 'NeedsRevision':
        return (
          <>
            <Pressable style={styles.secondaryButton} onPress={() => void runAction('Back to Draft', () => moveToDraft(question.id))}>
              <ThemedText style={styles.secondaryText}>Back to Draft</ThemedText>
            </Pressable>
            <Pressable style={styles.primaryButton} onPress={() => void runAction('Resubmit for Review', () => submitForReview(question.id))}>
              <ThemedText style={styles.primaryText}>Resubmit for Review</ThemedText>
            </Pressable>
          </>
        );
      case 'Rejected':
        return (
          <Pressable style={styles.secondaryButton} onPress={() => void runAction('Restore to Draft', () => moveToDraft(question.id))}>
            <ThemedText style={styles.secondaryText}>Restore to Draft</ThemedText>
          </Pressable>
        );
      case 'Approved':
        return (
          <>
            {role === 'owner' && (
              <Pressable style={styles.primaryButton} onPress={() => handlePublishNow(question)}>
                <ThemedText style={styles.primaryText}>Publish Now</ThemedText>
              </Pressable>
            )}
            <Pressable
              style={styles.secondaryButton}
              onPress={() => void runAction('Send to Revision', () => sendToRevision(question.id, getRevisionDraft(question)))}>
              <ThemedText style={styles.secondaryText}>Send to Revision</ThemedText>
            </Pressable>
          </>
        );
      case 'Scheduled':
        return (
          <>
            {role === 'owner' && (
              <Pressable style={styles.primaryButton} onPress={() => handlePublishNow(question)}>
                <ThemedText style={styles.primaryText}>Publish Now</ThemedText>
              </Pressable>
            )}
            <Pressable style={styles.secondaryButton} onPress={() => void runAction('Unschedule', () => unscheduleDaily(question.id))}>
              <ThemedText style={styles.secondaryText}>Unschedule</ThemedText>
            </Pressable>
            <Pressable
              style={styles.ghostButton}
              onPress={() => void runAction('Send to Revision', () => sendToRevision(question.id, getRevisionDraft(question)))}>
              <ThemedText style={styles.ghostText}>Send to Revision</ThemedText>
            </Pressable>
          </>
        );
      case 'Live':
        return role === 'owner' ? (
          <Pressable style={styles.ghostButton} onPress={() => handleArchive(question)}>
            <ThemedText style={styles.ghostText}>Archive</ThemedText>
          </Pressable>
        ) : null;
      case 'Archived':
      default:
        return null;
    }
  };

  const renderQuestionCard = (question: DailyQuestionRow) => {
    const expanded = expandedIds.includes(question.id);
    const metaParts = [DAILY_STATUS_LABELS[question.status].toUpperCase(), question.category.toUpperCase()];
    if (question.status === 'Scheduled' && question.scheduled_for) {
      metaParts.push(question.scheduled_for);
    }

    return (
      <View key={question.id} style={styles.card}>
        <View style={styles.metaRow}>
          <View style={[styles.statusDot, STATUS_DOT_STYLES[question.status]]} />
          <ThemedText style={styles.metaText}>{metaParts.join(' · ')}</ThemedText>
        </View>

        <ThemedText style={styles.questionText}>{question.prompt}</ThemedText>

        {question.status === 'Live' && (
          <View style={styles.liveSummary}>
            <ThemedText style={styles.liveSummaryText}>
              Published {question.published_for ?? 'unknown date'} ·{' '}
              {liveDistribution ? `${liveDistribution.reduce((sum, r) => sum + r.answer_count, 0)} real vote${liveDistribution.reduce((sum, r) => sum + r.answer_count, 0) === 1 ? '' : 's'}` : 'loading votes…'}
            </ThemedText>
            {liveDistribution?.map((row) => (
              <ThemedText key={row.option_id} style={styles.liveDistributionRow}>
                {row.label}: {row.percent}% ({row.answer_count})
              </ThemedText>
            ))}
          </View>
        )}

        {question.status === 'NeedsRevision' && question.review_note && (
          <ThemedText style={styles.reviewNotePreview} numberOfLines={2}>
            📝 {question.review_note}
          </ThemedText>
        )}

        <View style={styles.cardFooter}>
          <Pressable
            style={styles.reviewLink}
            onPress={() => router.push({ pathname: '/admin/review/[id]', params: { id: question.id } })}>
            <ThemedText style={styles.reviewLinkText}>
              {question.status === 'Live' || question.status === 'Archived' ? 'View →' : 'Review →'}
            </ThemedText>
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
                <ScheduleDateField
                  value={getScheduleDraft(question)}
                  onChangeText={(value) => setScheduleDraft(question, value)}
                  onCommit={(value) => handleScheduleCommit(question, value)}
                  style={styles.scheduleInput}
                />
              </View>
            )}
            {(question.status === 'ReadyForReview' || question.status === 'Approved' || question.status === 'Scheduled') && (
              <View style={styles.scheduleField}>
                <ThemedText style={styles.scheduleLabel}>Revision note (used by Send to Revision)</ThemedText>
                <TextInput
                  value={getRevisionDraft(question)}
                  onChangeText={(value) => setRevisionDraft(question, value)}
                  placeholder="e.g. Answer D is too obviously funny."
                  style={styles.scheduleInput}
                />
              </View>
            )}

            <View style={styles.actionsRow}>
              {renderActions(question)}
              {canDeleteAdminDaily(question.status) && (
                <Pressable style={styles.ghostButton} onPress={() => handleDelete(question)}>
                  <ThemedText style={styles.ghostText}>Delete</ThemedText>
                </Pressable>
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
          <ThemedText style={styles.emptySectionText}>{title} — {emptyLabel}</ThemedText>
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

  if (loading) {
    return <ThemedView style={styles.container} />;
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View>
              <ThemedText style={styles.eyebrow}>DAILY QUESTION EDITORIAL · {role.toUpperCase()}</ThemedText>
              <ThemedText style={styles.heading}>Nothing goes live without a human.</ThemedText>
            </View>
            <View style={styles.headerButtons}>
              <Pressable onPress={handleNewDaily} style={styles.newButton}>
                <ThemedText style={styles.newButtonText}>+ New Daily</ThemedText>
              </Pressable>
              <Pressable onPress={() => void signOutAdmin()} style={styles.backButton}>
                <ThemedText style={styles.backText}>Sign out</ThemedText>
              </Pressable>
            </View>
          </View>

          {actionError && (
            <View style={styles.errorBanner}>
              <ThemedText style={styles.errorBannerText}>{actionError}</ThemedText>
            </View>
          )}

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

const STATUS_DOT_STYLES: Record<Status, object> = {
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
  container: { flex: 1, backgroundColor: '#FFF9F5' },
  safeArea: { flex: 1, width: '100%', maxWidth: AdminMaxContentWidth, alignSelf: 'center' },
  content: { paddingHorizontal: Spacing.four, paddingTop: Spacing.four, paddingBottom: BottomTabInset + Spacing.four, gap: Spacing.four },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.two },
  headerButtons: { flexDirection: 'row', gap: Spacing.two },
  eyebrow: { color: Brand.pink, fontSize: 11, fontWeight: '800', letterSpacing: 1.3 },
  heading: { color: Brand.ink, fontSize: 26, fontWeight: '800', letterSpacing: -0.8, marginTop: Spacing.one, maxWidth: 420 },
  newButton: { backgroundColor: Brand.pink, borderRadius: 999, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one },
  newButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  backButton: { backgroundColor: '#FFFFFF', borderRadius: 999, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, borderWidth: 1, borderColor: '#F0E6E8' },
  backText: { color: Brand.ink, fontSize: 13, fontWeight: '800' },
  errorBanner: { backgroundColor: '#FCE9ED', borderRadius: 16, padding: Spacing.two },
  errorBannerText: { color: '#9E2E4F', fontSize: 13, fontWeight: '700' },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  statBox: { flexGrow: 1, flexBasis: 130, backgroundColor: '#FFFFFF', borderRadius: 18, padding: Spacing.two, borderWidth: 1, borderColor: '#F0E6E8', alignItems: 'center' },
  statValue: { color: Brand.ink, fontSize: 24, fontWeight: '800', letterSpacing: -0.7 },
  statLabel: { fontSize: 11, fontWeight: '800', color: Brand.violet, textTransform: 'uppercase', marginTop: 2, textAlign: 'center' },
  section: { gap: Spacing.two },
  sectionTitle: { color: Brand.ink, fontSize: 16, fontWeight: '800' },
  emptySectionRow: { paddingVertical: Spacing.one },
  emptySectionText: { color: Brand.inkSecondary, fontSize: 12, fontWeight: '700' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: Spacing.three, gap: Spacing.two, borderWidth: 1, borderColor: '#F0E6E8' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  metaText: { color: Brand.inkSecondary, fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  questionText: { color: Brand.ink, fontSize: 18, lineHeight: 25, fontWeight: '700' },
  liveSummary: { backgroundColor: '#F0FBF4', borderRadius: 12, padding: Spacing.two, gap: 2 },
  liveSummaryText: { color: '#1B6A54', fontSize: 12, fontWeight: '800' },
  liveDistributionRow: { color: '#1B6A54', fontSize: 12, fontWeight: '600' },
  reviewNotePreview: { color: '#9E2E4F', fontSize: 12, fontWeight: '700', fontStyle: 'italic' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  reviewLink: { alignSelf: 'flex-start' },
  reviewLinkText: { color: Brand.pink, fontSize: 14, fontWeight: '800' },
  manageLinkText: { color: Brand.inkSecondary, fontSize: 12, fontWeight: '700' },
  expandedSection: { gap: Spacing.two, marginTop: Spacing.one, paddingTop: Spacing.two, borderTopWidth: 1, borderTopColor: '#F5EFEC' },
  scheduleField: { gap: Spacing.one },
  scheduleLabel: { color: Brand.violet, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  scheduleInput: { color: Brand.ink, backgroundColor: '#F6F2FF', borderRadius: 10, borderWidth: 1, borderColor: '#E8E2FF', paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, fontSize: 13, fontWeight: '600' },
  primaryButton: { alignSelf: 'flex-start', backgroundColor: Brand.pink, borderRadius: 12, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  primaryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
  secondaryButton: { backgroundColor: '#F5F0FF', borderRadius: 10, paddingHorizontal: Spacing.two, paddingVertical: Spacing.two },
  secondaryText: { color: Brand.violet, fontSize: 12, fontWeight: '800' },
  ghostButton: { backgroundColor: '#FCE9ED', borderRadius: 10, paddingHorizontal: Spacing.two, paddingVertical: Spacing.two },
  ghostText: { color: '#9E2E4F', fontSize: 12, fontWeight: '800' },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
});
