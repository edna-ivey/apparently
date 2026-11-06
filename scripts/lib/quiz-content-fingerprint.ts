// Build 22 owner audit (2026-10-31), item 4: "Preserve CONTENT VERSION, not merely numeric
// IDs." The numeric content-identity ledger (content-id-ledger.ts) freezes quiz_id/
// question_id/choice_id by (quizKey, questionKey, choiceKey) STRING keys -- correct for
// preventing a reorder/insertion from reassigning an id, but blind to MEANING. If a quiz's
// content is substantially revised while REUSING the same quiz_key (and the same
// question_key/choice_key strings, e.g. q1:a) -- exactly the real situation with the newly
// locked Love quiz replacement -- the ledger would silently hand the NEW content the SAME
// numeric identity the OLD content already has. A later reconciliation or new award mapping
// against that id would then misattribute the OLD historical answer's meaning to the NEW
// content's trait mappings, fabricating incorrect permanent personality evidence for anyone
// who answered under the old meaning.
//
// Fix: a content FINGERPRINT (a hash of each question's prompt + each choice's label -- the
// actual user-facing MEANING, not scores/traitSignals/ids) recorded per quiz_key the first
// time it's generated, in scripts/lib/quiz-content-fingerprints.json. Every later generation
// recomputes the fingerprint and compares -- identical content regenerates identically
// (no-op); a content change under an EXISTING quiz_key makes the generator refuse outright,
// forcing a deliberate decision (revert the change, or ship the revision under a NEW,
// versioned quiz_key so it gets its own fresh identity with zero collision risk). This
// applies to every quiz processed by the content-identity generator, not just Love.

declare const require: (id: string) => {
  readFileSync: (p: string, e: string) => string;
  writeFileSync: (p: string, c: string) => void;
  existsSync: (p: string) => boolean;
  createHash: (algo: string) => { update: (s: string, enc: string) => unknown; digest: (enc: string) => string };
};
declare const __dirname: string;
const { readFileSync, writeFileSync, existsSync } = require('fs');
const { createHash } = require('crypto');
const { join } = require('path') as unknown as { join: (...parts: string[]) => string };

const FINGERPRINT_PATH = join(__dirname, 'quiz-content-fingerprints.json');

export type FingerprintChoice = { choiceKey: string; label: string };
export type FingerprintQuestion = { questionKey: string; prompt: string; choices: FingerprintChoice[] };

// Deliberately MEANING-focused: question prompt + choice labels only -- never score/
// traitSignals/resultWeights (those are scoring calibration, not what this guard protects)
// and never array order beyond the questions'/choices' own authored order (changing which
// choice appears first without changing its text is still the SAME meaning, and reordering
// questions/choices is already separately guarded by the id ledger itself).
export const computeQuizContentFingerprint = (questions: FingerprintQuestion[]): string => {
  const canonical = questions
    .map((q) => `${q.questionKey}|${q.prompt}|${q.choices.map((c) => `${c.choiceKey}:${c.label}`).join(',')}`)
    .join(';');
  return (createHash('sha256').update(canonical, 'utf8') as { digest: (enc: string) => string }).digest('hex');
};

export type ContentFingerprintLedger = Record<string, string>;

export const loadContentFingerprints = (): ContentFingerprintLedger => {
  if (!existsSync(FINGERPRINT_PATH)) {
    return {};
  }
  return JSON.parse(readFileSync(FINGERPRINT_PATH, 'utf8')) as ContentFingerprintLedger;
};

export const saveContentFingerprints = (ledger: ContentFingerprintLedger): void => {
  writeFileSync(FINGERPRINT_PATH, JSON.stringify(ledger, null, 2) + '\n');
};

// Records a new quiz_key's baseline fingerprint the first time it's seen. Throws loudly
// (refusing to let the caller proceed to id assignment) if an ALREADY-recorded quiz_key's
// content has changed meaning since its ids were first assigned.
export const assertContentFingerprintUnchanged = (
  ledger: ContentFingerprintLedger,
  quizKey: string,
  currentFingerprint: string,
): void => {
  const recorded = ledger[quizKey];
  if (recorded === undefined) {
    ledger[quizKey] = currentFingerprint;
    return;
  }
  if (recorded !== currentFingerprint) {
    throw new Error(
      `Quiz content for quiz_key '${quizKey}' has changed meaning (recorded content fingerprint ${recorded}, current ${currentFingerprint}) but its numeric identity (quiz_id/question_id/choice_id) would be SILENTLY REUSED under the same quiz_key. A content revision that changes MEANING -- even one reusing the same question_key/choice_key strings (e.g. q1:a) -- must ship under a NEW, versioned quiz_key, never the existing one. Reusing the same quiz_key here would let a historical answer's permanent meaning be silently reinterpreted under new trait mappings (the exact risk the newly locked Love-quiz replacement content raised). Refusing to regenerate -- either revert this content change, or assign a new quiz_key for the revision.`,
    );
  }
};
