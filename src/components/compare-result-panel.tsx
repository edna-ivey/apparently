import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import type { ArchetypeQuizDefinition } from '@/data/quizzes/types';
import { countExactMatches, findPartYouMissed, resolveShareableResultContent } from '@/data/quizzes/scoring';

// The ONE rendering of a one-to-one Compare comparison — used both by the friend right after
// they submit (NOTED -> "See the comparison") and by the owner opening the same comparison
// from their response list. Identical content either way, per the approved spec ("Opening
// shows the exact same one-to-one comparison the friend received"). Never renders THE
// CALL-OUT / THE COST / TRY THIS for either side — only the approved share-safe subset
// (result title + THE READ + exact kicker), via resolveShareableResultContent, the same
// function the public /s/[token] landing already uses.
export type CompareResultPanelProps = {
  definition: ArchetypeQuizDefinition;
  ownerName: string;
  friendName: string;
  ownerResultId: string;
  friendResultId: string;
  ownerAnswers: Record<string, string> | null;
  friendAnswers: Record<string, string>;
  // Server-computed exact match count. Only meaningful when ownerAnswers is non-null (a
  // pre-Compare-migration completion has no stored answers, so match-count is honestly
  // unavailable rather than fabricated as 0).
  matchCount: number | null;
  note: string | null;
  // Whose screen this is rendering on, for the ONE MORE THING note's exact approved wording.
  noteViewer: 'owner' | 'friend';
};

const ShareSafeResult = ({
  definition,
  resultId,
}: {
  definition: ArchetypeQuizDefinition;
  resultId: string;
}) => {
  const content = resolveShareableResultContent(definition, resultId);
  if (!content) {
    return null;
  }
  return (
    <View style={styles.resultBlock}>
      <ThemedText style={styles.resultTitle}>{content.resultTitle}</ThemedText>
      {content.structuredRead ? (
        <>
          <View style={styles.resultSection}>
            <ThemedText style={styles.resultSectionHeading}>THE READ</ThemedText>
            {content.structuredRead.theRead.map((line, index) => (
              <ThemedText key={`read-${index}`} style={styles.resultSectionBody}>
                {line}
              </ThemedText>
            ))}
          </View>
          {content.shareKicker && content.shareKicker.length > 0 && (
            <View style={styles.resultSection}>
              {content.shareKicker.map((line, index) => (
                <ThemedText key={`kicker-${index}`} style={styles.resultSectionBody}>
                  {line}
                </ThemedText>
              ))}
            </View>
          )}
        </>
      ) : (
        <>
          {content.heroRead.map((line) => (
            <ThemedText key={line} style={styles.resultSectionBody}>
              {line}
            </ThemedText>
          ))}
          {content.kicker ? <ThemedText style={styles.resultSectionBody}>{content.kicker}</ThemedText> : null}
        </>
      )}
    </View>
  );
};

export function CompareResultPanel({
  definition,
  ownerName,
  friendName,
  ownerResultId,
  friendResultId,
  ownerAnswers,
  friendAnswers,
  matchCount,
  note,
  noteViewer,
}: CompareResultPanelProps) {
  const totalQuestions = definition.questions.length;
  const sameResult = ownerResultId === friendResultId;
  const resolvedMatchCount = ownerAnswers ? (matchCount ?? countExactMatches(definition, ownerAnswers, friendAnswers)) : null;

  const partYouMissed = ownerAnswers ? findPartYouMissed(definition, ownerAnswers, friendAnswers, friendResultId) : null;
  const ownerMissedLabel = partYouMissed
    ? definition.questions.find((q) => q.id === partYouMissed.questionId)?.choices.find((c) => c.id === partYouMissed.ownerChoiceId)?.label
    : null;
  const friendMissedLabel = partYouMissed
    ? definition.questions.find((q) => q.id === partYouMissed.questionId)?.choices.find((c) => c.id === partYouMissed.friendChoiceId)?.label
    : null;

  return (
    <View style={styles.stepGap}>
      <View style={styles.storyCard}>
        <ThemedText style={styles.compareEyebrow}>
          {ownerName.toUpperCase()}, ACCORDING TO {ownerName.toUpperCase()}
        </ThemedText>
        <ThemedText style={styles.compareLabel}>YOUR STORY</ThemedText>
        <ShareSafeResult definition={definition} resultId={ownerResultId} />
      </View>

      <View style={styles.storyCard}>
        <ThemedText style={styles.compareEyebrow}>
          {ownerName.toUpperCase()}, ACCORDING TO {friendName.toUpperCase()}
        </ThemedText>
        <ThemedText style={styles.compareLabel}>THEIR VERSION</ThemedText>
        <ShareSafeResult definition={definition} resultId={friendResultId} />
      </View>

      {resolvedMatchCount !== null && (
        <ThemedText style={styles.matchLine}>
          You matched on {resolvedMatchCount} of {totalQuestions} answers.
        </ThemedText>
      )}

      {sameResult ? (
        <View style={styles.classificationCard}>
          <ThemedText style={styles.classificationHeading}>WELL... THAT TRACKS.</ThemedText>
          <ThemedText style={styles.classificationBody}>You two landed in the same place.</ThemedText>
          <ThemedText style={styles.classificationBody}>{ownerName} sees themselves as:</ThemedText>
          <ThemedText style={styles.classificationResult}>{definition.archetypes.find((a) => a.id === ownerResultId)?.title}</ThemedText>
          <ThemedText style={styles.classificationBody}>And apparently, {friendName} does too.</ThemedText>
          {resolvedMatchCount !== null && (
            <ThemedText style={styles.classificationSub}>
              {resolvedMatchCount >= 7
                ? 'Same result. A suspicious amount of the same evidence. \u{1F440}'
                : 'Same destination. Very different route. \u{1F602}'}
            </ThemedText>
          )}
        </View>
      ) : (
        <View style={styles.classificationCard}>
          <ThemedText style={styles.classificationHeading}>THE PLOT TWIST</ThemedText>
          <ThemedText style={styles.classificationBody}>
            {ownerName} said: {definition.archetypes.find((a) => a.id === ownerResultId)?.title}
          </ThemedText>
          <ThemedText style={styles.classificationBody}>
            {friendName} said: {definition.archetypes.find((a) => a.id === friendResultId)?.title}
          </ThemedText>
          <ThemedText style={styles.classificationSub}>
            Apparently, the disagreement is not whether {ownerName} has a personality.
          </ThemedText>
          <ThemedText style={styles.classificationSub}>It&apos;s which part is driving. {'\u{1F440}'}</ThemedText>
        </View>
      )}

      {partYouMissed && ownerMissedLabel && friendMissedLabel && (
        <View style={styles.classificationCard}>
          <ThemedText style={styles.classificationHeading}>THE PART YOU MISSED</ThemedText>
          <ThemedText style={styles.classificationBody}>
            {ownerName} said: {ownerMissedLabel}
          </ThemedText>
          <ThemedText style={styles.classificationBody}>
            {friendName} said: {friendMissedLabel}
          </ThemedText>
          <ThemedText style={styles.classificationSub}>Interesting. {'\u{1F440}'}</ThemedText>
        </View>
      )}

      {note && (
        <View style={styles.noteCard}>
          <ThemedText style={styles.classificationHeading}>ONE MORE THING...</ThemedText>
          {noteViewer === 'owner' ? (
            <ThemedText style={styles.classificationBody}>
              {friendName} left {ownerName} this note:
            </ThemedText>
          ) : (
            <ThemedText style={styles.classificationBody}>You left {ownerName} this note:</ThemedText>
          )}
          <ThemedText style={styles.noteText}>&quot;{note}&quot;</ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stepGap: { gap: Spacing.four },
  storyCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: Spacing.four, gap: Spacing.one, borderWidth: 1, borderColor: '#F0E6E8' },
  compareEyebrow: { color: Brand.pink, fontSize: 11, fontWeight: '800', letterSpacing: 1.1 },
  compareLabel: { color: Brand.violet, fontSize: 18, fontWeight: '900', letterSpacing: -0.3, marginBottom: Spacing.one },
  resultBlock: { gap: Spacing.one },
  resultTitle: { color: Brand.ink, fontSize: 22, lineHeight: 27, fontWeight: '800', letterSpacing: -0.4 },
  resultSection: { marginTop: Spacing.one, gap: Spacing.half },
  resultSectionHeading: { color: Brand.violet, fontSize: 11, fontWeight: '800', letterSpacing: 1.1 },
  resultSectionBody: { color: Brand.inkSecondary, fontSize: 15, lineHeight: 21, fontWeight: '600' },
  matchLine: { color: Brand.ink, fontSize: 16, fontWeight: '800', textAlign: 'center' },
  classificationCard: { backgroundColor: Brand.violet, borderRadius: 24, padding: Spacing.four, gap: Spacing.one },
  classificationHeading: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  classificationBody: { color: '#F1EEFF', fontSize: 15, lineHeight: 21, fontWeight: '700' },
  classificationResult: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', letterSpacing: -0.3 },
  classificationSub: { color: '#DCD6FF', fontSize: 14, lineHeight: 20, fontWeight: '700', fontStyle: 'italic', marginTop: Spacing.half },
  noteCard: { backgroundColor: Brand.coral, borderRadius: 24, padding: Spacing.four, gap: Spacing.one },
  noteText: { color: '#FFFFFF', fontSize: 16, lineHeight: 22, fontWeight: '700', fontStyle: 'italic' },
});
