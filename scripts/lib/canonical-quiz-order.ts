// FROZEN. The one, permanent, append-only ordering numeric quiz/question/choice ids are
// derived from (scripts/generate-quiz-content-identity-sql.ts). Once a quiz/question/choice
// has been assigned an id from this ordering, that id is PERMANENT -- a future addition must
// be appended to the END of the relevant list, never inserted, never re-sorted alphabetically
// (the previous version of this generator re-derived order via `[...new Set(...)].sort()`
// every run, which would silently renumber every existing id the moment a new quiz_key or
// question_key sorted earlier -- fixed here by hand-freezing the order once, now).
//
// Quiz order: the 22 QUIZ_REGISTRY entries in their registry-file order, then whats-your-type
// last (it is not part of QUIZ_REGISTRY -- see src/app/quiz/whats-your-type.tsx, a dedicated
// screen/content file, not the generic [quizId].tsx runner).
export const CANONICAL_QUIZ_ORDER: readonly string[] = [
  'petty', 'crisis', 'dating', 'friendship', 'food-order', 'spending', 'era', 'ick',
  'group-chat', 'one-bite', 'unexpected-money', 'kid-you',
  'secretly-love', 'keep-you-around', 'be-so-serious',
  'private-private-trouble', 'life-match-dream-life', 'style-vibe-intimidating',
  'hidden-you-wrong', 'career-ambition-how-bad', 'career-ambition-proving', 'love-soulmates-ready',
  'love-soulmates-become', 'shadow-side-hypocrisy', 'private-private-proof', 'hidden-you-hide',
  'life-match-freedom', 'style-vibe-attention', 'good-stuff-trust',
  'whats-your-type',
];

if (new Set(CANONICAL_QUIZ_ORDER).size !== CANONICAL_QUIZ_ORDER.length) {
  throw new Error('CANONICAL_QUIZ_ORDER contains a duplicate -- refusing to proceed with an ambiguous id assignment.');
}
