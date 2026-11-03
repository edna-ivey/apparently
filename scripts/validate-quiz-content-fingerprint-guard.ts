// Build 22 owner audit (2026-10-31), item 4: proves the content-fingerprint guard
// (scripts/lib/quiz-content-fingerprint.ts) actually catches the real reported risk --
// against the REAL guard functions, nothing re-implemented. This test NEVER touches the
// real ledger/fingerprint files on disk (every check below uses its own in-memory copies) and
// NEVER writes, imports, or wires up any real quiz content -- it uses the two example
// sentences from the owner's own report purely as representative "meaning changed" fixture
// text, not as an implementation of the locked Love quiz replacement.
//
// Run with: npx tsx scripts/validate-quiz-content-fingerprint-guard.ts

declare const process: { exit: (code: number) => void };
import { assertContentFingerprintUnchanged, computeQuizContentFingerprint, type ContentFingerprintLedger } from './lib/quiz-content-fingerprint';

let failures = 0;
const assert = (condition: unknown, message: string): void => {
  if (!condition) {
    failures += 1;
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`OK: ${message}`);
  }
};

const oldContent = [
  {
    questionKey: 'q1',
    prompt: 'Something shifts after they like you back.',
    choices: [
      { choiceKey: 'a', label: "Suddenly I'm noticing flaws I didn't care about before they liked me back." },
      { choiceKey: 'b', label: 'placeholder-b-old' },
    ],
  },
];

// The REAL replacement text from the owner's report -- same question_key/choice_key ('q1'/
// 'a'), substantially different meaning (withdrawing from intimacy vs. trust/security).
const newContentSameKey = [
  {
    questionKey: 'q1',
    prompt: 'Something shifts after they like you back.',
    choices: [
      { choiceKey: 'a', label: "I stop waiting for the plot twist. Boring in the best way." },
      { choiceKey: 'b', label: 'placeholder-b-old' },
    ],
  },
];

// --- 1. First time seeing a quiz_key: records a baseline, does not throw.
const ledgerA: ContentFingerprintLedger = {};
let threwOnFirstSeen = false;
try {
  assertContentFingerprintUnchanged(ledgerA, 'test-love-quiz', computeQuizContentFingerprint(oldContent));
} catch {
  threwOnFirstSeen = true;
}
assert(!threwOnFirstSeen, 'first time a quiz_key is seen, the guard records a baseline and does not throw');
assert(typeof ledgerA['test-love-quiz'] === 'string' && ledgerA['test-love-quiz'].length > 0, 'the baseline fingerprint was actually recorded');

// --- 2. Regenerating with UNCHANGED content under the SAME quiz_key: still no throw.
let threwOnUnchanged = false;
try {
  assertContentFingerprintUnchanged(ledgerA, 'test-love-quiz', computeQuizContentFingerprint(oldContent));
} catch {
  threwOnUnchanged = true;
}
assert(!threwOnUnchanged, 'regenerating identical content under the same quiz_key never throws');

// --- 3. THE ACTUAL REPORTED RISK: revised content (the real Love q1:a replacement text)
// reusing the SAME quiz_key must be REFUSED, not silently reassigned.
let threwOnMeaningChange = false;
let errorMessage = '';
try {
  assertContentFingerprintUnchanged(ledgerA, 'test-love-quiz', computeQuizContentFingerprint(newContentSameKey));
} catch (e) {
  threwOnMeaningChange = true;
  errorMessage = String((e as Error).message);
}
assert(threwOnMeaningChange, 'THE FIX: revised content reusing the same quiz_key is REFUSED, never silently reassigned the same numeric identity');
assert(errorMessage.includes('test-love-quiz') && errorMessage.toLowerCase().includes('new'), `the refusal names the quiz_key and instructs using a new versioned key -- ${errorMessage.slice(0, 200)}`);

// --- 4. The SAME revised content under a genuinely NEW (versioned) quiz_key must succeed,
// getting its OWN fresh baseline, with the OLD quiz_key's baseline left completely untouched.
const ledgerB: ContentFingerprintLedger = { ...ledgerA };
let threwOnNewKey = false;
try {
  assertContentFingerprintUnchanged(ledgerB, 'test-love-quiz-v2', computeQuizContentFingerprint(newContentSameKey));
} catch {
  threwOnNewKey = true;
}
assert(!threwOnNewKey, 'the SAME revised content under a NEW, versioned quiz_key is accepted (fresh identity, zero collision)');
assert(ledgerB['test-love-quiz'] === ledgerA['test-love-quiz'], "the OLD quiz_key's recorded fingerprint is completely untouched by the new version's registration");
assert(ledgerB['test-love-quiz-v2'] !== ledgerB['test-love-quiz'], 'the old and new quiz_key versions have DIFFERENT fingerprints (confirming the content really did change)');

// --- 5. Sanity: two different fingerprints for old vs. new content directly (not just via
// the guard's throw behavior).
const fpOld = computeQuizContentFingerprint(oldContent);
const fpNew = computeQuizContentFingerprint(newContentSameKey);
assert(fpOld !== fpNew, 'the old and new content produce genuinely different fingerprints');
assert(computeQuizContentFingerprint(oldContent) === fpOld, 'fingerprinting the same content twice is deterministic');

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} check(s) FAILED`}`);
if (failures > 0) {
  process.exit(1);
}
