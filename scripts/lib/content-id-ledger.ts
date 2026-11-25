// Build 22 truly-frozen numeric identity (owner audit, 2026-10-30): the previous generator
// recomputed quiz/question/choice ids from scratch on every run by walking CANONICAL_QUIZ_
// ORDER and each quiz's own authored array order -- stable ONLY as long as nothing is ever
// inserted in the middle of an existing quiz's questions/choices array. A content edit that
// inserts a new question before an existing one (not appended at the end) would silently
// renumber every question after it, and every question in every later quiz. That is not
// actually frozen -- it only looked frozen because nothing had changed yet.
//
// Real fix: a PERSISTED LEDGER. Every (quizKey, questionKey) and (quizKey, questionKey,
// choiceKey) pair that has EVER been assigned an id keeps that EXACT id forever, read from
// this file -- never recomputed from array position. A key seen for the first time gets a
// new id, strictly greater than every id ever assigned (tracked by nextQuestionId/
// nextChoiceId below), regardless of where in any array it appears. Committing this file
// (scripts/lib/content-id-ledger.json) after it's first generated is what makes ids
// permanent -- regenerating the catalog migration without an existing ledger file present
// would silently start a NEW ledger from scratch, so the ledger file itself, once created,
// must always be committed and never deleted/regenerated from nothing.

declare const require: (id: string) => { readFileSync: (p: string, e: string) => string; writeFileSync: (p: string, c: string) => void; existsSync: (p: string) => boolean };
declare const __dirname: string;
const { readFileSync, writeFileSync, existsSync } = require('fs');
const { join } = require('path') as unknown as { join: (...parts: string[]) => string };

const LEDGER_PATH = join(__dirname, 'content-id-ledger.json');

export type ContentIdLedger = {
  nextQuizId: number;
  nextQuestionId: number;
  nextChoiceId: number;
  quizIds: Record<string, number>; // quizKey -> id
  questionIds: Record<string, number>; // "quizKey::questionKey" -> id
  choiceIds: Record<string, number>; // "quizKey::questionKey::choiceKey" -> id
};

const EMPTY_LEDGER: ContentIdLedger = { nextQuizId: 1, nextQuestionId: 1, nextChoiceId: 1, quizIds: {}, questionIds: {}, choiceIds: {} };

// A migration that only makes sense AFTER a ledger exists -- if this file is present but the
// ledger is missing, the ledger was deleted/lost, not "never initialized." Treating that as a
// fresh start would silently restart numbering at 1, colliding with every id already
// committed and already live in the database. One frozen marker is enough: the FIRST
// migration a ledger-backed generator ever produced.
const FIRST_LEDGER_CONSUMING_MIGRATION = join(__dirname, '../../supabase/migrations/20261028020000_quiz_content_identity.sql');

const assertNoDuplicateIds = (table: Record<string, number>, label: string): void => {
  const ids = Object.values(table);
  const distinct = new Set(ids);
  if (distinct.size !== ids.length) {
    throw new Error(`Content-id ledger is CORRUPT: ${label} contains a duplicate id (${ids.length} entries, only ${distinct.size} distinct). Refusing to use a corrupt ledger -- restore it from version control rather than regenerating.`);
  }
};

const assertNextPointerAhead = (table: Record<string, number>, nextId: number, label: string): void => {
  const maxAssigned = Object.values(table).reduce((max, id) => Math.max(max, id), 0);
  if (nextId <= maxAssigned) {
    throw new Error(`Content-id ledger is CORRUPT: next${label}Id (${nextId}) is not strictly greater than the highest already-assigned id (${maxAssigned}) -- a new assignment would REUSE an existing id. Refusing to proceed.`);
  }
};

export const loadLedger = (): ContentIdLedger => {
  if (!existsSync(LEDGER_PATH)) {
    if (existsSync(FIRST_LEDGER_CONSUMING_MIGRATION)) {
      throw new Error(
        `Content-id ledger is MISSING (${LEDGER_PATH}) but ${FIRST_LEDGER_CONSUMING_MIGRATION} already exists -- this is a lost/deleted ledger, not a fresh project. Restore scripts/lib/content-id-ledger.json from version control. Refusing to silently start a new ledger at id 1, which would collide with every id already committed and already live.`,
      );
    }
    return { ...EMPTY_LEDGER, quizIds: {}, questionIds: {}, choiceIds: {} };
  }
  const ledger = JSON.parse(readFileSync(LEDGER_PATH, 'utf8')) as ContentIdLedger;
  assertNoDuplicateIds(ledger.quizIds, 'quizIds');
  assertNoDuplicateIds(ledger.questionIds, 'questionIds');
  assertNoDuplicateIds(ledger.choiceIds, 'choiceIds');
  assertNextPointerAhead(ledger.quizIds, ledger.nextQuizId, 'Quiz');
  assertNextPointerAhead(ledger.questionIds, ledger.nextQuestionId, 'Question');
  assertNextPointerAhead(ledger.choiceIds, ledger.nextChoiceId, 'Choice');
  return ledger;
};

export const saveLedger = (ledger: ContentIdLedger): void => {
  // Re-validate before writing too -- a bug in this same run's assignment logic should fail
  // loudly here rather than silently persist a corrupt ledger for the NEXT run to inherit.
  assertNoDuplicateIds(ledger.quizIds, 'quizIds');
  assertNoDuplicateIds(ledger.questionIds, 'questionIds');
  assertNoDuplicateIds(ledger.choiceIds, 'choiceIds');
  writeFileSync(LEDGER_PATH, JSON.stringify(ledger, null, 2) + '\n');
};

// Assigns an id for `key` from `table`, creating one from `getNextId`/`setNextId` only if
// `key` has never been seen before. Existing keys ALWAYS get their already-recorded id back,
// regardless of iteration order -- this is the entire fix.
const assign = (table: Record<string, number>, key: string, getNext: () => number, setNext: (n: number) => void): number => {
  const existing = table[key];
  if (existing !== undefined) return existing;
  const id = getNext();
  table[key] = id;
  setNext(id + 1);
  return id;
};

export const assignQuizId = (ledger: ContentIdLedger, quizKey: string): number =>
  assign(ledger.quizIds, quizKey, () => ledger.nextQuizId, (n) => { ledger.nextQuizId = n; });

export const assignQuestionId = (ledger: ContentIdLedger, quizKey: string, questionKey: string): number =>
  assign(ledger.questionIds, `${quizKey}::${questionKey}`, () => ledger.nextQuestionId, (n) => { ledger.nextQuestionId = n; });

export const assignChoiceId = (ledger: ContentIdLedger, quizKey: string, questionKey: string, choiceKey: string): number =>
  assign(ledger.choiceIds, `${quizKey}::${questionKey}::${choiceKey}`, () => ledger.nextChoiceId, (n) => { ledger.nextChoiceId = n; });
