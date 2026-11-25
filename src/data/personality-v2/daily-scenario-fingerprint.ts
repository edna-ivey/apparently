// Stable "scenario identity" for a Daily question -- deliberately NOT the same thing as
// daily-questions.ts's computeContentFingerprint, which is exact-text/order-sensitive and
// answers a different question ("has this exact approved content been edited since
// approval?"). This fingerprint answers "is this the SAME real-world scenario as some other
// database row?" -- which the Build 16/V2 brief reports is a real, observed problem ("Some
// identical Daily scenarios appear under multiple database question IDs"). Two
// daily_questions rows with the same scenario but a reworded option or two still need to be
// recognized as the same question_stable_id so a replay/re-authoring of that scenario can
// never inflate a pole's lifetime earned points or distinct-question count -- see
// scoring-engine.ts's dedupeForRanking, which keys on exactly this id.
//
// Deliberately loose on wording, strict on substance: lowercases and collapses whitespace on
// the prompt, and uses the SET (order-independent) of normalized option labels -- a question
// re-entered with its four options in a different order, or with trivial copy polish, still
// fingerprints identically. A question with a materially different option SET (an actual
// content change, not a re-entry of the same scenario) gets a different fingerprint, which is
// correct: that is arguably a different question and should be tracked as its own
// opportunity, not silently merged with the original.
//
// Same FNV-1a hashing approach daily-questions.ts's own computeContentFingerprint already
// uses (no crypto dependency, no randomness, deterministic) -- reused here for consistency
// with that established convention, not reinvented.

const normalizeText = (value: string): string => value.trim().toLowerCase().replace(/\s+/g, ' ');

const fnv1aHash = (input: string): string => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
};

export const computeDailyScenarioFingerprint = (prompt: string, optionLabels: readonly string[]): string => {
  const normalizedPrompt = normalizeText(prompt);
  const normalizedOptions = optionLabels.map(normalizeText).sort();
  return `daily:${fnv1aHash(`${normalizedPrompt}|${normalizedOptions.join('|')}`)}`;
};
