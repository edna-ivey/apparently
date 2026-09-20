import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandSignature } from '@/components/brand-signature';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { getQuizDefinition } from '@/data/quizzes';
import { resolveShareableResultContent, type ShareableResultContent } from '@/data/quizzes/scoring';
import { useResponsiveContentWidth } from '@/hooks/use-responsive-content-width';
import { getSharedQuizResult } from '@/services/quiz-share-service';

// Result-first shared landing: a recipient opening this link sees the SHARER's result FIRST —
// never dumped into an unanswered quiz. Reuses only approved quiz definition/result copy (via
// resolveShareableResultContent) — no personality copy or result copy is invented here. Works
// for a fully anonymous visitor (no session at all): get_shared_quiz_result is granted to the
// anon role specifically so this page never needs to sign anyone in just to view it.
//
// `mode=compare` renders "THEY HAVE NOTES." — the approved direction/terminology for the
// future friend-answering Compare flow (YOUR STORY / THEIR VERSION), NOT the finished feature.
// No comparison questions are collected here; see the migration's "FUTURE" comment for the
// data contract that flow will eventually need. This is a real, honest intermediate state —
// never a CTA that silently does nothing.
type LoadState =
  | { phase: 'loading' }
  | { phase: 'error' }
  | { phase: 'ready'; quizId: string; quizTitle: string; sharerName: string; content: ShareableResultContent };

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
      content,
    });
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const showCompare = mode === 'compare';

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
                  <View style={styles.privateSection}>
                    <ThemedText style={styles.privateSectionHeading}>THE CALL-OUT</ThemedText>
                    {state.content.structuredRead.theCallOut.map((line, index) => (
                      <ThemedText key={`the-call-out-${index}`} style={styles.privateSectionBody}>
                        {line}
                      </ThemedText>
                    ))}
                  </View>
                  <View style={styles.privateSection}>
                    <ThemedText style={styles.privateSectionHeading}>THE COST</ThemedText>
                    {state.content.structuredRead.theCost.map((line, index) => (
                      <ThemedText key={`the-cost-${index}`} style={styles.privateSectionBody}>
                        {line}
                      </ThemedText>
                    ))}
                  </View>
                  <View style={styles.privateSection}>
                    <ThemedText style={styles.privateSectionHeading}>TRY THIS</ThemedText>
                    {state.content.structuredRead.tryThis.map((line, index) => (
                      <ThemedText key={`try-this-${index}`} style={styles.privateSectionBody}>
                        {line}
                      </ThemedText>
                    ))}
                  </View>
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
                onPress={() => router.push({ pathname: '/s/[token]', params: { token, mode: 'compare' } })}>
                <ThemedText style={styles.secondaryCtaText}>Give my version of {state.sharerName} →</ThemedText>
              </Pressable>
            </View>
          )}

          {state.phase === 'ready' && showCompare && (
            <View style={styles.stepGap}>
              <View style={styles.introGap}>
                <ThemedText style={styles.eyebrow}>THEY HAVE NOTES.</ThemedText>
                <ThemedText style={styles.quizTitle}>Your version of {state.sharerName}.</ThemedText>
              </View>

              <View style={styles.whyCard}>
                <ThemedText style={styles.compareRow}>
                  <ThemedText style={styles.compareLabel}>YOUR STORY  </ThemedText>
                  is what {state.sharerName} told Apparently about themselves.
                </ThemedText>
                <ThemedText style={styles.compareRow}>
                  <ThemedText style={styles.compareLabel}>THEIR VERSION  </ThemedText>
                  is what the people who actually know them would say. That&apos;s the part
                  we&apos;re still building — this is where it&apos;ll live.
                </ThemedText>
              </View>

              <Pressable
                style={styles.secondaryCta}
                onPress={() => router.push({ pathname: '/s/[token]', params: { token } })}>
                <ThemedText style={styles.secondaryCtaText}>← Back to {state.sharerName}&apos;s result</ThemedText>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
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
  ctaText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  secondaryCta: { backgroundColor: '#FFFFFF', borderRadius: 16, alignItems: 'center', paddingVertical: Spacing.three, borderWidth: 1, borderColor: '#F0E6E8' },
  secondaryCtaText: { color: Brand.violet, fontSize: 15, fontWeight: '800' },
  tertiaryCta: { alignItems: 'center', paddingVertical: Spacing.two },
  tertiaryCtaText: { color: Brand.inkSecondary, fontSize: 14, fontWeight: '700' },
  compareRow: { color: Brand.ink, fontSize: 15, lineHeight: 22, fontWeight: '600' },
  compareLabel: { color: Brand.violet, fontWeight: '800' },
});
