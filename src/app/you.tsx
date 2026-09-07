import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { getDemoPersonalityProfile } from '@/data/personality';

type DailyStatus = 'Draft' | 'Approved' | 'Live';

type DailyQuestion = {
  id: number;
  prompt: string;
  category: string;
  status: DailyStatus;
  order: number;
};

const initialQuestions: DailyQuestion[] = [
  { id: 1, prompt: 'Your best friend is dating someone you cannot stand. What do you do?', category: 'Friendship', status: 'Approved', order: 1 },
  { id: 2, prompt: 'You get a surprise invite to a party you are not excited about. Do you go?', category: 'Social', status: 'Approved', order: 2 },
  { id: 3, prompt: 'You find out your ex is posting a very curated version of their life. What do you do?', category: 'Love', status: 'Draft', order: 99 },
  { id: 4, prompt: 'The office group chat starts a new rumor. Are you the first to check facts?', category: 'Work', status: 'Draft', order: 100 },
  { id: 5, prompt: 'It is Sunday night and you are already overthinking Monday. What is your move?', category: 'Routine', status: 'Live', order: 0 },
];

export default function YouScreen() {
  const [showAdmin, setShowAdmin] = useState(false);
  const [questions, setQuestions] = useState(initialQuestions);

  const approvedQuestions = useMemo(
    () => [...questions].filter((question) => question.status !== 'Draft').sort((a, b) => a.order - b.order),
    [questions]
  );

  const draftQuestions = useMemo(
    () => questions.filter((question) => question.status === 'Draft'),
    [questions]
  );

  const personalityProfile = useMemo(() => getDemoPersonalityProfile(), []);
  const topPatterns = personalityProfile.topTraits;
  const answersCount = personalityProfile.answeredCount;
  const remainingToReveal = Math.max(0, 50 - answersCount);

  const nextRelease = approvedQuestions.find((question) => question.status === 'Approved') ?? approvedQuestions[0];

  const approveQuestion = (id: number) => {
    setQuestions((current) => {
      const nextOrder = Math.max(...current.map((q) => q.order), 0) + 1;
      return current.map((question) =>
        question.id === id ? { ...question, status: 'Approved', order: nextOrder } : question
      );
    });
  };

  const publishQuestion = (id: number) => {
    setQuestions((current) =>
      current.map((question) =>
        question.id === id ? { ...question, status: 'Live', order: 0 } : question.status === 'Live' ? { ...question, status: 'Approved', order: question.order + 1 } : question
      )
    );
  };

  const moveQuestion = (id: number, direction: 'up' | 'down') => {
    setQuestions((current) => {
      const reordered = [...current].filter((question) => question.status !== 'Draft').sort((a, b) => a.order - b.order);
      const index = reordered.findIndex((question) => question.id === id);
      if (index < 0) return current;
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= reordered.length) return current;
      const [item] = reordered.splice(index, 1);
      reordered.splice(targetIndex, 0, item);
      const nextOrderMap = new Map(reordered.map((question, idx) => [question.id, idx + 1]));
      return current.map((question) =>
        question.status !== 'Draft' ? { ...question, order: nextOrderMap.get(question.id) ?? question.order } : question
      );
    });
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <ThemedText style={styles.wordmark}>apparently.</ThemedText>
            <Pressable onPress={() => setShowAdmin(true)} style={styles.editButton}>
              <ThemedText style={styles.editText}>Admin</ThemedText>
            </Pressable>
          </View>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}><ThemedText style={styles.avatarText}>M</ThemedText></View>
            <ThemedText style={styles.name}>Michelle, apparently.</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.subline}>43 answers · 7 day streak</ThemedText>
          </View>
          <View style={styles.scoreCard}>
            <ThemedText style={styles.eyebrow}>YOUR COMMONALITY</ThemedText>
            <ThemedText style={styles.score}>37%</ThemedText>
            <ThemedText style={styles.scoreLabel}>Uncommon</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.copy}>
              You tend to zig when the room zags. Respectfully.
            </ThemedText>
          </View>
          <ThemedText style={styles.sectionTitle}>Your patterns</ThemedText>
          <View style={styles.patterns}>
            {topPatterns.map((pattern, index) => (
              <View key={pattern.id} style={[styles.pattern, { backgroundColor: [Brand.pink, '#DDF5EE', '#FFF0D2', '#E8F1FF', '#FDE9D2'][index % 5] }]}>
                <ThemedText style={styles.patternNumber}>0{index + 1}</ThemedText>
                <ThemedText style={styles.patternName}>{pattern.name}</ThemedText>
                <ThemedText style={styles.patternPercent}>{pattern.percent}%</ThemedText>
              </View>
            ))}
          </View>
          <View style={styles.progressCard}>
            <View style={styles.progressTop}><ThemedText style={styles.eyebrow}>YOUR 7, APPARENTLY</ThemedText><ThemedText style={styles.progressCount}>{answersCount} / 50</ThemedText></View>
            <ThemedText style={styles.progressTitle}>{remainingToReveal > 0 ? `${remainingToReveal} more answers until Your 7.` : 'Your 7 is live.'}</ThemedText>
            <View style={styles.track}><View style={[styles.fill, { width: `${Math.min(100, (answersCount / 50) * 100)}%` }]} /></View>
          </View>
        </ScrollView>
      </SafeAreaView>

      <Modal transparent visible={showAdmin} animationType="slide" onRequestClose={() => setShowAdmin(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowAdmin(false)} />
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View>
              <ThemedText style={styles.eyebrow}>APPROVED DAILY QUEUE</ThemedText>
              <ThemedText style={styles.modalTitle}>Manage what goes live.</ThemedText>
            </View>
            <Pressable onPress={() => setShowAdmin(false)} style={styles.closeButton}>
              <ThemedText style={styles.closeText}>Close</ThemedText>
            </Pressable>
          </View>

          <View style={styles.modalPanel}>
            <ThemedText style={styles.sectionTitle}>Next in line</ThemedText>
            {nextRelease ? (
              <>
                <ThemedText style={styles.nextPrompt}>{nextRelease.prompt}</ThemedText>
                <ThemedText style={styles.nextMeta}>{nextRelease.category} · {nextRelease.status}</ThemedText>
              </>
            ) : (
              <ThemedText style={styles.emptyText}>Add an approved question to begin the queue.</ThemedText>
            )}
          </View>

          <View style={styles.modalSection}>
            <ThemedText style={styles.sectionTitle}>Drafts</ThemedText>
            {draftQuestions.length === 0 ? (
              <ThemedText style={styles.emptyText}>No draft questions right now.</ThemedText>
            ) : (
              draftQuestions.map((question) => (
                <View key={question.id} style={styles.queueCard}>
                  <View style={styles.cardHeader}>
                    <ThemedText style={styles.cardBadge}>Draft</ThemedText>
                    <ThemedText style={styles.cardCategory}>{question.category}</ThemedText>
                  </View>
                  <ThemedText style={styles.cardPrompt}>{question.prompt}</ThemedText>
                  <Pressable style={styles.primaryButton} onPress={() => approveQuestion(question.id)}>
                    <ThemedText style={styles.primaryText}>Approve</ThemedText>
                  </Pressable>
                </View>
              ))
            )}
          </View>

          <View style={styles.modalSection}>
            <ThemedText style={styles.sectionTitle}>Approved basket</ThemedText>
            {approvedQuestions.length === 0 ? (
              <ThemedText style={styles.emptyText}>No approved dailies yet.</ThemedText>
            ) : (
              approvedQuestions.map((question) => (
                <View key={question.id} style={styles.queueCard}>
                  <View style={styles.cardHeader}>
                    <ThemedText style={[styles.cardBadge, question.status === 'Live' && styles.liveBadge]}>{question.status}</ThemedText>
                    <ThemedText style={styles.cardCategory}>#{question.order}</ThemedText>
                  </View>
                  <ThemedText style={styles.cardPrompt}>{question.prompt}</ThemedText>
                  <View style={styles.actionRow}>
                    <Pressable style={[styles.secondaryButton, question.order === 1 && styles.disabledButton]} onPress={() => moveQuestion(question.id, 'up')} disabled={question.order === 1}>
                      <ThemedText style={styles.secondaryText}>Move up</ThemedText>
                    </Pressable>
                    <Pressable style={styles.secondaryButton} onPress={() => moveQuestion(question.id, 'down')}>
                      <ThemedText style={styles.secondaryText}>Move down</ThemedText>
                    </Pressable>
                    <Pressable style={styles.primaryButton} onPress={() => publishQuestion(question.id)}>
                      <ThemedText style={styles.primaryText}>Publish</ThemedText>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9F5' },
  safeArea: { flex: 1, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  content: { padding: Spacing.four, paddingBottom: BottomTabInset + Spacing.five, gap: Spacing.three },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  wordmark: { fontSize: 26, lineHeight: 30, fontWeight: '800', letterSpacing: -1 },
  editButton: { paddingHorizontal: Spacing.two, paddingVertical: Spacing.one },
  editText: { color: Brand.pink, fontSize: 14, fontWeight: '800' },
  profileHeader: { alignItems: 'center', gap: Spacing.one, paddingVertical: Spacing.three },
  avatar: { width: 92, height: 92, borderRadius: 46, backgroundColor: Brand.violet, alignItems: 'center', justifyContent: 'center', borderWidth: 6, borderColor: '#E8E2FF' },
  avatarText: { color: '#FFFFFF', fontSize: 36, fontWeight: '800' },
  name: { fontSize: 22, fontWeight: '800' },
  subline: { fontSize: 13, fontWeight: '600' },
  scoreCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: Spacing.four, gap: Spacing.one, borderWidth: 1, borderColor: '#F0E6E8' },
  eyebrow: { color: Brand.pink, fontSize: 11, fontWeight: '800', letterSpacing: 1.3 },
  score: { fontSize: 54, lineHeight: 58, fontWeight: '900' },
  scoreLabel: { color: Brand.violet, fontSize: 16, fontWeight: '800' },
  copy: { fontSize: 13, lineHeight: 19, marginTop: Spacing.one },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  patterns: { flexDirection: 'row', gap: Spacing.two },
  pattern: { flex: 1, minHeight: 105, borderRadius: 18, padding: Spacing.two, justifyContent: 'space-between' },
  patternNumber: { color: 'rgba(23,21,29,0.45)', fontSize: 12, fontWeight: '800' },
  patternName: { fontSize: 16, lineHeight: 19, fontWeight: '800' },
  patternPercent: { fontSize: 13, fontWeight: '800', color: 'rgba(23,21,29,0.7)' },
  progressCard: { backgroundColor: '#FFE5EF', borderRadius: 24, padding: Spacing.four, gap: Spacing.two },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between' },
  progressCount: { color: Brand.pink, fontSize: 13, fontWeight: '800' },
  progressTitle: { fontSize: 18, fontWeight: '800' },
  track: { height: 10, borderRadius: 5, overflow: 'hidden', backgroundColor: '#FFFFFF' },
  fill: { width: '86%', height: '100%', backgroundColor: Brand.pink },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(23, 21, 29, 0.35)' },
  modalCard: { position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '85%', backgroundColor: '#FFF9F5', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: Spacing.four, gap: Spacing.three },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.two },
  modalTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.8, marginTop: Spacing.one },
  closeButton: { backgroundColor: '#FFFFFF', borderRadius: 99, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, borderWidth: 1, borderColor: '#F0E6E8' },
  closeText: { color: Brand.ink, fontSize: 12, fontWeight: '800' },
  modalPanel: { backgroundColor: '#E8E3FF', borderRadius: 24, padding: Spacing.three, gap: Spacing.one },
  nextPrompt: { fontSize: 19, lineHeight: 26, fontWeight: '800' },
  nextMeta: { color: '#5D5571', fontSize: 12, fontWeight: '700' },
  modalSection: { gap: Spacing.two },
  queueCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: Spacing.three, gap: Spacing.two, borderWidth: 1, borderColor: '#F0E6E8' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardBadge: { backgroundColor: '#FFF0D2', paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, borderRadius: 99, fontSize: 10, fontWeight: '800', letterSpacing: 1, color: '#9B6812', textTransform: 'uppercase' },
  liveBadge: { backgroundColor: '#DDF5EE', color: '#1B6A54' },
  cardCategory: { color: Brand.violet, fontSize: 12, fontWeight: '800' },
  cardPrompt: { fontSize: 17, lineHeight: 24, fontWeight: '700' },
  primaryButton: { alignSelf: 'flex-start', backgroundColor: Brand.pink, borderRadius: 12, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  primaryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
  secondaryButton: { backgroundColor: '#F5F0FF', borderRadius: 10, paddingHorizontal: Spacing.two, paddingVertical: Spacing.two },
  secondaryText: { color: Brand.violet, fontSize: 12, fontWeight: '800' },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  disabledButton: { opacity: 0.5 },
  emptyText: { color: '#746D79', fontSize: 13, fontWeight: '600' },
});