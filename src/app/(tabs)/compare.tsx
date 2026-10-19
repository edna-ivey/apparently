import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CompareResultPanel } from '@/components/compare-result-panel';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, BottomTabInset, Spacing } from '@/constants/theme';
import { Elevation, Radius } from '@/constants/design-system';
import { Celestial, CelestialType, CelestialWash, Panel, PortalRings } from '@/components/today/celestial';
import { getQuizDefinition } from '@/data/quizzes';
import type { ArchetypeQuizDefinition } from '@/data/quizzes/types';
import { useResponsiveContentWidth, useResponsiveTopInset } from '@/hooks/use-responsive-content-width';
import { ensureAnonymousSession } from '@/services/auth-service';
import {
  getApparentlyItsAThing,
  getCompareResult,
  listCompareResponsesForOwner,
  markCompareResponseViewed,
  type ApparentlyItsAThingRow,
  type CompareResponseListRow,
  type CompareResultRow,
} from '@/services/compare-service';

// The owner-facing side of "THEY HAVE NOTES." — every response a friend has left across every
// share the signed-in owner has created, grouped by quiz (never merged across quizzes). Reuses
// the EXACT same CompareResultPanel a friend sees right after submitting (see
// src/app/s/[token].tsx) for the one-to-one detail view, per the approved spec ("Opening shows
// the exact same one-to-one comparison friend received"). APPARENTLY, IT'S A THING is fetched
// per quiz_id and rendered ONLY to this owner — never exposed to any friend/respondent view.

type QuizGroup = {
  quizId: string;
  quizTitle: string;
  definition: ArchetypeQuizDefinition;
  responses: CompareResponseListRow[];
  aggregate: ApparentlyItsAThingRow[];
};

type ListState = { phase: 'loading' } | { phase: 'error'; message: string } | { phase: 'ready'; groups: QuizGroup[] };

export default function CompareScreen() {
  const router = useRouter();
  const contentWidth = useResponsiveContentWidth();
  const topInset = useResponsiveTopInset();
  const [listState, setListState] = useState<ListState>({ phase: 'loading' });
  const [selected, setSelected] = useState<{ shareId: string; quizId: string; responseId: string } | null>(null);
  const [detail, setDetail] = useState<{ phase: 'loading' } | { phase: 'error' } | { phase: 'ready'; result: CompareResultRow }>({
    phase: 'loading',
  });

  const loadList = useCallback(async () => {
    setListState({ phase: 'loading' });
    await ensureAnonymousSession();
    const responsesResult = await listCompareResponsesForOwner();
    if (!responsesResult.ok) {
      setListState({ phase: 'error', message: responsesResult.message });
      return;
    }

    const byQuiz = new Map<string, CompareResponseListRow[]>();
    responsesResult.data.forEach((row) => {
      const existing = byQuiz.get(row.quiz_id) ?? [];
      existing.push(row);
      byQuiz.set(row.quiz_id, existing);
    });

    const groups: QuizGroup[] = [];
    for (const [quizId, responses] of byQuiz.entries()) {
      const definition = getQuizDefinition(quizId);
      if (!definition || definition.scoringType !== 'archetype') {
        continue;
      }
      const aggregateResult = await getApparentlyItsAThing(quizId);
      groups.push({
        quizId,
        quizTitle: definition.title,
        definition,
        responses: responses.sort((a, b) => (a.created_at < b.created_at ? 1 : -1)),
        aggregate: aggregateResult.ok ? aggregateResult.data : [],
      });
    }

    setListState({ phase: 'ready', groups });
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const openResponse = async (row: CompareResponseListRow) => {
    setSelected({ shareId: row.share_id, quizId: row.quiz_id, responseId: row.response_id });
    setDetail({ phase: 'loading' });
    const result = await getCompareResult(row.share_id, null);
    if (!result.ok || !result.data) {
      setDetail({ phase: 'error' });
      return;
    }
    setDetail({ phase: 'ready', result: result.data });
    void markCompareResponseViewed(row.response_id);
  };

  const closeResponse = () => {
    setSelected(null);
    // Refresh once back on the list so the just-viewed response's unread dot/SOMEONE TALKED
    // card clear — deferred until now (rather than right after opening) so the list's brief
    // 'loading' phase never causes the detail screen itself to flicker back to the list mid-view.
    void loadList();
  };

  const selectedGroup = selected && listState.phase === 'ready' ? listState.groups.find((g) => g.quizId === selected.quizId) : null;

  if (selected && selectedGroup) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={[styles.safeArea, contentWidth ? { maxWidth: contentWidth } : null]}>
          <PortalRings />
          <CelestialWash />
          <ScrollView contentContainerStyle={[styles.content, { paddingTop: topInset }]} showsVerticalScrollIndicator={false}>
            <Pressable onPress={closeResponse} hitSlop={12} style={styles.backButton}>
              <ThemedText style={styles.backText}>← Back</ThemedText>
            </Pressable>
            <ThemedText style={styles.quizTitleHeading}>{selectedGroup.quizTitle}</ThemedText>

            {detail.phase === 'loading' && (
              <View style={styles.stateCard}>
                <ThemedText style={styles.stateText}>Loading…</ThemedText>
              </View>
            )}
            {detail.phase === 'error' && (
              <View style={styles.stateCard}>
                <ThemedText style={styles.stateText}>Couldn&apos;t load this comparison right now.</ThemedText>
              </View>
            )}
            {detail.phase === 'ready' && (
              <CompareResultPanel
                definition={selectedGroup.definition}
                ownerName={detail.result.owner_display_name?.trim() || 'You'}
                friendName={detail.result.respondent_nickname}
                ownerResultId={detail.result.owner_result_id}
                friendResultId={detail.result.friend_primary_result_id}
                ownerAnswers={detail.result.owner_answers}
                friendAnswers={detail.result.friend_answers}
                matchCount={detail.result.match_count}
                note={detail.result.note}
                noteViewer="owner"
              />
            )}
          </ScrollView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const allResponses = listState.phase === 'ready' ? listState.groups.flatMap((g) => g.responses) : [];
  const unread = allResponses.filter((row) => !row.viewed_at).sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={[styles.safeArea, contentWidth ? { maxWidth: contentWidth } : null]}>
        <PortalRings />
        <CelestialWash />
        <ScrollView contentContainerStyle={[styles.content, { paddingTop: topInset }]} showsVerticalScrollIndicator={false}>
          <ThemedText style={styles.wordmark}>apparently you.</ThemedText>
          <ThemedText style={styles.heading}>Find out where you two line up.</ThemedText>

          {listState.phase === 'loading' && (
            <View style={styles.stateCard}>
              <ThemedText style={styles.stateText}>Loading…</ThemedText>
            </View>
          )}

          {listState.phase === 'error' && (
            <View style={styles.stateCard}>
              <ThemedText style={styles.stateText}>Couldn&apos;t load your notes right now.</ThemedText>
              <Pressable style={styles.cta} onPress={() => void loadList()}>
                <ThemedText style={styles.ctaText}>Try again →</ThemedText>
              </Pressable>
            </View>
          )}

          {listState.phase === 'ready' && allResponses.length === 0 && (
            <View style={[Panel.shell, styles.hero]}>
              <View style={[Panel.glow, styles.heroGlow]} />
              <ThemedText style={styles.heroEmoji}>✦ + ✦</ThemedText>
              <ThemedText style={styles.heroTitle}>Find out who agrees with you.</ThemedText>
              <ThemedText style={styles.heroCopy}>
                Finish a Private quiz, share your result, and ask someone who knows too much to give their version.
                We&apos;ll tell you exactly where you line up — and where you really don&apos;t.
              </ThemedText>
              <Pressable style={styles.heroCta} onPress={() => router.push('/private')} accessibilityRole="button">
                <ThemedText style={styles.heroCtaText}>Take a Private quiz →</ThemedText>
              </Pressable>
            </View>
          )}

          {/* Real, functional "how it works" — fills the page intentionally for a new user
              without inventing any comparisons/friends/activity. Three real steps, the exact
              flow this screen's own CTA above and the quiz runner's share sheet already do. */}
          {listState.phase === 'ready' && allResponses.length === 0 && (
            <View style={styles.howItWorks}>
              <ThemedText style={styles.howItWorksTitle}>How it works</ThemedText>
              {[
                ['1', 'Take a Private quiz and get your real result.'],
                ['2', 'Share it — the link opens straight to your result.'],
                ['3', 'They give their own version. We show you both, side by side.'],
              ].map(([num, copy]) => (
                <View key={num} style={styles.howItWorksRow}>
                  <View style={styles.howItWorksNum}>
                    <ThemedText style={styles.howItWorksNumText}>{num}</ThemedText>
                  </View>
                  <ThemedText style={styles.howItWorksCopy}>{copy}</ThemedText>
                </View>
              ))}
            </View>
          )}

          {listState.phase === 'ready' && unread && (
            <Pressable
              style={styles.unreadCard}
              onPress={() => {
                const row = allResponses.find((r) => r.response_id === unread.response_id);
                if (row) void openResponse(row);
              }}>
              <ThemedText style={styles.unreadEyebrow}>SOMEONE TALKED. {'\u{1F440}'}</ThemedText>
              <ThemedText style={styles.unreadBody}>{unread.respondent_nickname} left notes.</ThemedText>
              <ThemedText style={styles.unreadCtaText}>See what they said →</ThemedText>
            </Pressable>
          )}

          {listState.phase === 'ready' &&
            listState.groups.map((group) => (
              <View key={group.quizId} style={styles.quizSection}>
                <ThemedText style={styles.quizTitleHeading}>{group.quizTitle}</ThemedText>
                <ThemedText style={styles.notesEyebrow}>THEY HAVE NOTES. {'\u{1F440}'}</ThemedText>
                <ThemedText style={styles.notesCount}>
                  {group.responses.length} {group.responses.length === 1 ? 'person has' : 'people have'} weighed in.
                </ThemedText>

                <View style={styles.responseList}>
                  {group.responses.map((row) => {
                    const resultTitle = group.definition.archetypes.find((a) => a.id === row.friend_primary_result_id)?.title ?? '';
                    return (
                      <Pressable key={row.response_id} style={styles.responseRow} onPress={() => void openResponse(row)}>
                        <View style={styles.responseRowText}>
                          <ThemedText style={styles.responseName}>{row.respondent_nickname}</ThemedText>
                          <ThemedText style={styles.responseResult}>{resultTitle}</ThemedText>
                        </View>
                        <ThemedText style={styles.responseMatch}>
                          {row.match_count}/{group.definition.questions.length} matched
                        </ThemedText>
                        {!row.viewed_at && <View style={styles.unreadDot} />}
                      </Pressable>
                    );
                  })}
                </View>

                {group.aggregate.map((entry) => {
                  const resultTitle = group.definition.archetypes.find((a) => a.id === entry.result_id)?.title ?? '';
                  return (
                    <View key={entry.result_id} style={styles.thingCard}>
                      <ThemedText style={styles.thingEyebrow}>APPARENTLY, IT&apos;S A THING.</ThemedText>
                      <ThemedText style={styles.thingBody}>
                        {entry.respondent_count} people independently landed here:
                      </ThemedText>
                      <ThemedText style={styles.thingResult}>{resultTitle}</ThemedText>
                      <ThemedText style={styles.thingSub}>
                        At some point, this stops being one person&apos;s opinion. {'\u{1F440}'}
                      </ThemedText>
                    </View>
                  );
                })}
              </View>
            ))}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
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
        borderRadius: Radius.xl,
        boxShadow: Elevation.shell,
        overflow: 'hidden',
      },
      default: {},
    }),
  },
  content: { paddingHorizontal: Spacing.four, paddingBottom: BottomTabInset + Spacing.five, gap: Spacing.three },
  wordmark: { color: Celestial.textPrimary, fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  heading: CelestialType.editorialHeadline,
  // Build 15: replaces the old solid-coral rectangle with the shared dark-glass Panel shell —
  // coral stays as an accent glow, not the whole fill — plus a real functional CTA (this was
  // previously a dead-end empty state with no next step at all).
  hero: { gap: Spacing.two, marginTop: Spacing.two, borderColor: 'rgba(255,121,95,0.35)' },
  heroGlow: { backgroundColor: 'rgba(255,121,95,0.22)' },
  heroEmoji: { color: Brand.coral, fontSize: 22, fontWeight: '800' },
  heroTitle: { ...CelestialType.question, fontSize: 21, lineHeight: 27, marginTop: 2 },
  heroCopy: { ...CelestialType.body, marginTop: 2 },
  heroCta: {
    alignSelf: 'flex-start',
    backgroundColor: Brand.coral,
    borderRadius: 14,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    marginTop: Spacing.two,
  },
  heroCtaText: { ...CelestialType.button, color: Brand.plum },
  howItWorks: { gap: Spacing.three, marginTop: Spacing.two, paddingHorizontal: Spacing.one },
  howItWorksTitle: CelestialType.heading,
  howItWorksRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three },
  howItWorksNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,121,95,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  howItWorksNumText: { color: Brand.coral, fontSize: 12, fontWeight: '800' },
  howItWorksCopy: { ...CelestialType.body, flex: 1, marginTop: 4 },
  stateCard: {
    backgroundColor: Celestial.glassFill,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: Celestial.glassBorder,
    alignItems: 'center',
  },
  stateText: { color: Celestial.textSecondary, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  cta: { backgroundColor: Brand.pink, borderRadius: 16, alignItems: 'center', paddingVertical: Spacing.three, alignSelf: 'stretch' },
  ctaText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  backButton: { paddingVertical: Spacing.two },
  backText: { color: Brand.pink, fontSize: 14, fontWeight: '700' },
  unreadCard: { backgroundColor: Brand.pink, borderRadius: Radius.lg, padding: Spacing.four, gap: Spacing.half, marginTop: Spacing.two },
  unreadEyebrow: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  unreadBody: { color: '#FFE5EF', fontSize: 15, fontWeight: '700' },
  unreadCtaText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', marginTop: Spacing.one },
  quizSection: { gap: Spacing.two, marginTop: Spacing.three },
  quizTitleHeading: { color: Celestial.textPrimary, fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  notesEyebrow: { color: Brand.pink, fontSize: 12, fontWeight: '800', letterSpacing: 0.6 },
  notesCount: { color: Celestial.textSecondary, fontSize: 14, fontWeight: '600' },
  responseList: { gap: Spacing.two },
  responseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Celestial.glassFill,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Celestial.glassBorder,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  responseRowText: { flex: 1, gap: Spacing.half },
  responseName: { color: Celestial.textPrimary, fontSize: 15, fontWeight: '800' },
  responseResult: { color: Brand.gold, fontSize: 13, fontWeight: '700' },
  responseMatch: { color: Celestial.textSecondary, fontSize: 13, fontWeight: '700' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Brand.pink },
  thingCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,121,95,0.3)', borderRadius: Radius.lg, padding: Spacing.four, gap: Spacing.one, marginTop: Spacing.one },
  thingEyebrow: { color: Brand.coral, fontSize: 12, fontWeight: '800', letterSpacing: 0.4 },
  thingBody: { color: Celestial.textPrimary, fontSize: 15, lineHeight: 21, fontWeight: '700' },
  thingResult: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', letterSpacing: -0.3 },
  thingSub: { color: Celestial.textSecondary, fontSize: 13, lineHeight: 19, fontWeight: '600' },
});
