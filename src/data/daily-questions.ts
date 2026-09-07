import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import type { PersonalityEffect } from '@/data/personality';

export type DailyStatus =
  | 'Idea'
  | 'Draft'
  | 'ReadyForReview'
  | 'Approved'
  | 'Scheduled'
  | 'Live'
  | 'Archived'
  | 'NeedsRevision'
  | 'Rejected';

export const DAILY_STATUS_LABELS: Record<DailyStatus, string> = {
  Idea: 'Idea',
  Draft: 'Draft',
  ReadyForReview: 'Ready for Review',
  Approved: 'Approved',
  Scheduled: 'Scheduled',
  Live: 'Live',
  Archived: 'Archived',
  NeedsRevision: 'Needs Revision',
  Rejected: 'Rejected',
};

const DAILY_STATUS_SET = new Set<DailyStatus>([
  'Idea',
  'Draft',
  'ReadyForReview',
  'Approved',
  'Scheduled',
  'Live',
  'Archived',
  'NeedsRevision',
  'Rejected',
]);

// Single source of truth for the personality-signal cap per answer. An answer may
// reasonably carry 1, 2, or 3 signals — this is a ceiling, not a requirement (the
// completeness gate below only requires at least 1). Referenced by both normalization
// (persistence) and the Review Studio's Add Signal UI so the two can never drift apart.
export const MAX_PERSONALITY_EFFECTS_PER_OPTION = 3;

export type DailyOption = {
  id: number;
  label: string;
  percent: number;
  personalityEffects?: PersonalityEffect[];
  apparentlyFeedback?: string;
};

export type DailyQuestion = {
  id: number;
  prompt: string;
  category: string;
  status: DailyStatus;
  order: number;
  scheduledFor: string | null;
  options: DailyOption[];
  // Human editorial approval. There is no real authentication yet — approvedBy is a fixed
  // local prototype value. This shape is designed so a real authenticated user id can
  // replace the string later without touching the transition/invalidation logic below.
  approvedBy: string | null;
  approvedAt: string | null;
  approvedContentVersion: string | null;
  // Short editorial note left when a reviewer sends a question to NeedsRevision (e.g.
  // "Answer D is too obviously funny compared with the others."). Not a full revision
  // history — just the most recent note, cleared on approval.
  reviewNote: string | null;
  // The local calendar date this question was (or is) the Live Daily for. Set once, when
  // a question is promoted to Live (by reconcileDailyLifecycle or the emergency publish
  // primitive), and preserved through Live → Archived — scheduledFor gets cleared on
  // promotion (it's a future plan, not a historical record), so without this field an
  // Archived question would have no way to answer "which date was this the Daily for."
  publishedFor: string | null;
};

const STORAGE_KEY = 'apparently:daily-questions';

// Prototype-only stand-in for a real authenticated editor identity.
const PROTOTYPE_EDITOR = 'Michelle (prototype editor)';

// Fixed placeholder timestamp used only to backfill approval metadata on seed data that
// predates the approval system. Deliberately not "now" so seed data stays deterministic.
const SEED_APPROVED_AT = '2026-09-01T12:00:00.000Z';

// ---------------------------------------------------------------------------
// Deterministic content fingerprint
//
// Covers every editorially material field so the app can tell whether the content
// currently on screen is the same content a human approved. No randomness — the same
// question content always produces the same fingerprint. When new material fields are
// added later (Commonality metadata, sensitivity flags, reveal/share copy), add them to
// `materialShape` below and every caller of this function keeps working unchanged.
// ---------------------------------------------------------------------------

const stableStringify = (value: unknown): string => {
  if (value === null || value === undefined) {
    return 'null';
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    return `{${keys.map((key) => `${key}:${stableStringify(record[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
};

// Small deterministic 32-bit FNV-1a hash. No crypto dependency, no randomness.
const fnv1aHash = (input: string): string => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
};

export const computeContentFingerprint = (question: Pick<DailyQuestion, 'prompt' | 'category' | 'options'>): string => {
  const materialShape = {
    prompt: question.prompt.trim(),
    category: question.category.trim(),
    // Array order is preserved by stableStringify, which covers "answer ordering".
    options: question.options.map((option) => ({
      id: option.id,
      label: option.label.trim(),
      personalityEffects: option.personalityEffects ?? [],
      apparentlyFeedback: option.apparentlyFeedback ?? '',
    })),
  };

  return fnv1aHash(stableStringify(materialShape));
};

export const isApprovalCurrent = (question: DailyQuestion): boolean => {
  if (!question.approvedContentVersion) {
    return false;
  }
  return computeContentFingerprint(question) === question.approvedContentVersion;
};

// ---------------------------------------------------------------------------
// Editorial completeness gate
//
// This is a structural completeness check only — it never judges whether content is
// GOOD, only whether the Daily package has the pieces a human needs to review at all.
// It is enforced centrally in approveQuestion below, not left to the UI to remember.
// ---------------------------------------------------------------------------

const PLACEHOLDER_OPTION_LABEL = /^Option [A-D]$/;

export const getCompletenessIssues = (question: Pick<DailyQuestion, 'prompt' | 'category' | 'options'>): string[] => {
  const issues: string[] = [];

  if (!question.prompt.trim() || question.prompt.trim() === 'Untitled question') {
    issues.push('Question wording is missing.');
  }

  if (!question.category.trim()) {
    issues.push('Category is missing.');
  }

  if (question.options.length !== 4) {
    issues.push(`Expected 4 answer choices, found ${question.options.length}.`);
  }

  question.options.forEach((option, index) => {
    const letter = String.fromCharCode(65 + index);

    if (!option.label.trim() || PLACEHOLDER_OPTION_LABEL.test(option.label.trim())) {
      issues.push(`Answer ${letter} wording is missing.`);
    }
    if (!option.personalityEffects || option.personalityEffects.length === 0) {
      issues.push(`Answer ${letter} has no personality signal assigned.`);
    }
    if (!option.apparentlyFeedback || !option.apparentlyFeedback.trim()) {
      issues.push(`Answer ${letter} has no Apparently response assigned.`);
    }
  });

  return issues;
};

export const isQuestionComplete = (question: Pick<DailyQuestion, 'prompt' | 'category' | 'options'>): boolean =>
  getCompletenessIssues(question).length === 0;

// ---------------------------------------------------------------------------
// Status transition graph — the single source of truth for what moves are legal.
// Every store action below checks against this before mutating anything, so no
// screen can push a question into an invalid status just by rendering a button.
// ---------------------------------------------------------------------------

const STATUS_TRANSITIONS: Record<DailyStatus, DailyStatus[]> = {
  Idea: ['Draft'],
  Draft: ['ReadyForReview', 'Rejected'],
  ReadyForReview: ['Approved', 'NeedsRevision', 'Rejected'],
  NeedsRevision: ['Draft', 'ReadyForReview'],
  Approved: ['Scheduled', 'NeedsRevision'],
  // 'Approved' here is the unschedule move (clearing the release date) — it is not a
  // downgrade, Approved is still fully upstream-safe. Everything else matches the spec.
  Scheduled: ['Live', 'NeedsRevision', 'Approved'],
  Live: ['Archived'],
  Rejected: ['Draft'],
  Archived: [],
};

export const canTransitionStatus = (from: DailyStatus, to: DailyStatus): boolean => {
  if (from === to) {
    return false;
  }
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
};

export const getAvailableTransitions = (status: DailyStatus): DailyStatus[] => STATUS_TRANSITIONS[status] ?? [];

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

type SeedQuestion = Omit<
  DailyQuestion,
  'approvedBy' | 'approvedAt' | 'approvedContentVersion' | 'reviewNote' | 'publishedFor'
> & {
  approvedBy?: string | null;
  approvedAt?: string | null;
  approvedContentVersion?: string | null;
  reviewNote?: string | null;
  publishedFor?: string | null;
};

const APPROVAL_BACKED_STATUSES = new Set<DailyStatus>(['Approved', 'Scheduled', 'Live']);

// Backfills approval metadata for seed/legacy content that predates the approval system,
// so Approved/Scheduled/Live seed questions have a real fingerprint baseline to compare
// future edits against, instead of silently having no recorded approval at all.
//
// publishedFor is deliberately left null for seed data even for the bootstrap Live
// question — it was never actually promoted through reconcileDailyLifecycle, so claiming
// a specific historical publish date for it would be fabricated. Real promotions (from
// here on) always stamp it.
const withBackfilledApproval = (question: SeedQuestion): DailyQuestion => {
  const reviewNote = question.reviewNote ?? null;
  const publishedFor = question.publishedFor ?? null;

  if (!APPROVAL_BACKED_STATUSES.has(question.status)) {
    return { ...question, approvedBy: null, approvedAt: null, approvedContentVersion: null, reviewNote, publishedFor };
  }

  return {
    ...question,
    approvedBy: question.approvedBy ?? `${PROTOTYPE_EDITOR} — seed data`,
    approvedAt: question.approvedAt ?? SEED_APPROVED_AT,
    approvedContentVersion: question.approvedContentVersion ?? computeContentFingerprint(question),
    reviewNote,
    publishedFor,
  };
};

const rawInitialQuestions: SeedQuestion[] = [
  {
    id: 1,
    prompt: 'Your best friend is dating someone you cannot stand. What do you do?',
    category: 'Friendship',
    status: 'Approved',
    order: 1,
    scheduledFor: null,
    options: [
      {
        id: 1,
        label: 'Tell them immediately.',
        percent: 18,
        personalityEffects: [
          { dimension: 'protective_hands_off', value: 2 },
          { dimension: 'direct_indirect', value: 2 },
        ],
        apparentlyFeedback: 'Apparently, watching quietly was never really on the table.',
      },
      {
        id: 2,
        label: 'Stay quiet unless they ask.',
        percent: 34,
        personalityEffects: [
          { dimension: 'protective_hands_off', value: -2 },
          { dimension: 'conflict_peacekeeping', value: -1 },
        ],
        apparentlyFeedback: 'Apparently, you are letting people manage their own plot twists.',
      },
      {
        id: 3,
        label: 'Drop hints until they figure it out.',
        percent: 27,
        personalityEffects: [
          { dimension: 'direct_indirect', value: -2 },
          { dimension: 'social_attunement', value: 1 },
        ],
        apparentlyFeedback: 'Apparently, the message can arrive in a few carefully placed hints.',
      },
      {
        id: 4,
        label: 'I am investigating first. 🔎',
        percent: 21,
        personalityEffects: [
          { dimension: 'trust_verify', value: -2 },
          { dimension: 'social_attunement', value: 2 },
        ],
        apparentlyFeedback: 'Apparently, you are not entering the group chat without receipts.',
      },
    ],
  },
  {
    id: 2,
    prompt: 'You get a surprise invite to a party you are not excited about. Do you go?',
    category: 'Social',
    status: 'Scheduled',
    order: 2,
    scheduledFor: '2026-09-08',
    options: [
      { id: 1, label: 'Absolutely not.', percent: 42 },
      { id: 2, label: 'I will go for one hour.', percent: 31 },
      { id: 3, label: 'I will go and make it fun.', percent: 17 },
      { id: 4, label: 'I will send a fake excuse.', percent: 10 },
    ],
  },
  {
    id: 3,
    prompt: 'You find out your ex is posting a very curated version of their life. What do you do?',
    category: 'Love',
    status: 'Draft',
    order: 99,
    scheduledFor: null,
    options: [
      {
        id: 1,
        label: 'Delete them from my life.',
        percent: 26,
        personalityEffects: [],
        apparentlyFeedback: 'Apparently, the block button is sometimes a complete sentence.',
      },
      {
        id: 2,
        label: 'Laugh privately and move on.',
        percent: 35,
        personalityEffects: [],
        apparentlyFeedback: 'Apparently, you can turn a little chaos into private entertainment.',
      },
      {
        id: 3,
        label: 'Check if they are doing well.',
        percent: 24,
        personalityEffects: [
          { dimension: 'sentimental_thick_skinned', value: 1 },
        ],
        apparentlyFeedback: 'Apparently, curiosity and concern can share a group chat.',
      },
      {
        id: 4,
        label: 'Send a very calm text.',
        percent: 15,
        personalityEffects: [],
        apparentlyFeedback: 'Apparently, the calm text has entered the building.',
      },
    ],
  },
  {
    id: 4,
    prompt: 'The office group chat starts a new rumor. Are you the first to check facts?',
    category: 'Work',
    status: 'Rejected',
    order: 100,
    scheduledFor: null,
    options: [
      { id: 1, label: 'I check facts before I say anything.', percent: 46 },
      { id: 2, label: 'I forward it immediately.', percent: 20 },
      { id: 3, label: 'I just quietly leave the chat.', percent: 18 },
      { id: 4, label: 'I start a fact-checking thread.', percent: 16 },
    ],
  },
  {
    id: 5,
    prompt: 'It is Sunday night and you are already overthinking Monday. What is your move?',
    category: 'Routine',
    status: 'Live',
    order: 1,
    scheduledFor: null,
    options: [
      {
        id: 1,
        label: 'Plan the entire week out.',
        percent: 28,
        personalityEffects: [
          { dimension: 'planner_spontaneous', value: 2 },
          { dimension: 'control_allowing', value: 2 },
        ],
        apparentlyFeedback: 'Apparently, Monday is not getting the chance to surprise you.',
      },
      {
        id: 2,
        label: 'Pretend to be okay until Tuesday.',
        percent: 32,
        personalityEffects: [
          { dimension: 'emotional_intensity', value: -1 },
          { dimension: 'private_open', value: 1 },
        ],
        apparentlyFeedback: 'Apparently, “I am fine” has a very specific expiration date.',
      },
      {
        id: 3,
        label: 'Make a comfort ritual for the night.',
        percent: 22,
        personalityEffects: [
          { dimension: 'adventure_comfort', value: -2 },
          { dimension: 'sentimental_thick_skinned', value: 1 },
        ],
        apparentlyFeedback: 'Apparently, the Sunday night reset is part of the personality.',
      },
      {
        id: 4,
        label: 'Start a dramatic to-do list.',
        percent: 18,
        personalityEffects: [
          { dimension: 'control_allowing', value: 1 },
          { dimension: 'emotional_intensity', value: 1 },
        ],
        apparentlyFeedback: 'Apparently, the to-do list needed a little theater.',
      },
    ],
  },
];

export const initialQuestions: DailyQuestion[] = rawInitialQuestions.map(withBackfilledApproval);

const listeners = new Set<() => void>();
let questions: DailyQuestion[] = initialQuestions;
let hasHydrated = false;

const notify = () => {
  listeners.forEach((listener) => listener());
};

export const isValidDateValue = (value: string | null | undefined) => {
  if (typeof value !== 'string') {
    return false;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  // Date.UTC silently rolls an out-of-range day/month into the next month/year (e.g.
  // Feb 31 becomes Mar 3). Round-tripping the parsed components back out and comparing
  // catches that roll-over, so impossible calendar dates (Feb 31, Apr 31, Feb 29 on a
  // non-leap year) are rejected instead of silently accepted as some other date.
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

const normalizeDateValue = (value: string | null | undefined) => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return isValidDateValue(trimmed) ? trimmed : trimmed;
};

const normalizeQuestion = (question: Partial<DailyQuestion>, fallbackId: number): DailyQuestion => {
  const initialQuestion = initialQuestions.find((item) => item.id === question.id);
  const normalizedOptions = Array.isArray(question.options)
    ? question.options.map((option, index) => {
        const optionId = typeof option?.id === 'number' ? option.id : index + 1;
        const defaultOption = initialQuestion?.options.find((item) => item.id === optionId);

        // Persisted values win. Seed values are only a fallback for when the persisted
        // record has no value at all (e.g. an option that has never been edited).
        const persistedEffects = Array.isArray(option?.personalityEffects)
          ? option.personalityEffects.slice(0, MAX_PERSONALITY_EFFECTS_PER_OPTION)
          : undefined;
        const persistedFeedback =
          typeof option?.apparentlyFeedback === 'string' && option.apparentlyFeedback.trim()
            ? option.apparentlyFeedback
            : undefined;

        return {
          id: optionId,
          label: typeof option?.label === 'string' && option.label.trim() ? option.label : `Option ${index + 1}`,
          percent: Number.isFinite(option?.percent) ? Math.max(0, Number(option.percent)) : 0,
          personalityEffects: persistedEffects ?? defaultOption?.personalityEffects,
          apparentlyFeedback: persistedFeedback ?? defaultOption?.apparentlyFeedback,
        };
      })
    : [];

  const safeStatus: DailyStatus =
    typeof question.status === 'string' && DAILY_STATUS_SET.has(question.status as DailyStatus)
      ? (question.status as DailyStatus)
      : 'Draft';

  const options =
    normalizedOptions.length > 0
      ? normalizedOptions
      : [
          { id: 1, label: 'Option A', percent: 25 },
          { id: 2, label: 'Option B', percent: 25 },
          { id: 3, label: 'Option C', percent: 25 },
          { id: 4, label: 'Option D', percent: 25 },
        ];

  const prompt = typeof question.prompt === 'string' && question.prompt.trim() ? question.prompt : 'Untitled question';
  const category = typeof question.category === 'string' && question.category.trim() ? question.category : 'General';

  const persistedApprovedBy = typeof question.approvedBy === 'string' ? question.approvedBy : null;
  const persistedApprovedAt = typeof question.approvedAt === 'string' ? question.approvedAt : null;
  const persistedApprovedContentVersion =
    typeof question.approvedContentVersion === 'string' ? question.approvedContentVersion : null;

  let approvedBy = persistedApprovedBy;
  let approvedAt = persistedApprovedAt;
  let approvedContentVersion = persistedApprovedContentVersion;

  if (APPROVAL_BACKED_STATUSES.has(safeStatus)) {
    if (!approvedContentVersion) {
      // Data saved before approval metadata existed. Grandfather it in as approved-as-is
      // so the invalidation mechanism has a real baseline to compare future edits against.
      approvedBy = approvedBy ?? `${PROTOTYPE_EDITOR} — legacy import`;
      approvedAt = approvedAt ?? null;
      approvedContentVersion = computeContentFingerprint({ prompt, category, options });
    }
  } else {
    // Non-approval-backed statuses never carry stale approval metadata.
    approvedBy = null;
    approvedAt = null;
    approvedContentVersion = null;
  }

  return {
    id: typeof question.id === 'number' ? question.id : fallbackId,
    prompt,
    category,
    status: safeStatus,
    order: Number.isFinite(question.order) ? Number(question.order) : 99,
    scheduledFor: normalizeDateValue(question.scheduledFor),
    options,
    approvedBy,
    approvedAt,
    approvedContentVersion,
    reviewNote: typeof question.reviewNote === 'string' && question.reviewNote.trim() ? question.reviewNote : null,
    publishedFor: typeof question.publishedFor === 'string' ? question.publishedFor : null,
  };
};

const reindexApprovedQueue = (items: DailyQuestion[]) => {
  const sorted = [...items]
    .filter((question) => question.status === 'Approved')
    .sort((a, b) => a.order - b.order);

  const approvedOrderMap = new Map(sorted.map((question, index) => [question.id, index + 1]));

  return items.map((question) => {
    if (question.status === 'Approved') {
      return {
        ...question,
        order: approvedOrderMap.get(question.id) ?? question.order,
      };
    }

    if (question.status === 'Live') {
      return {
        ...question,
        order: 1,
      };
    }

    if (question.status === 'Scheduled') {
      return {
        ...question,
        order: Math.max(question.order, 1),
      };
    }

    return question;
  });
};

const storage = {
  getItem: async (key: string) => {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        return window.localStorage.getItem(key);
      }
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        window.localStorage.setItem(key, value);
        return;
      }
      await AsyncStorage.setItem(key, value);
    } catch {
      // ignore storage errors in development, keep the in-memory state working
    }
  },
};

export const getQuestions = () => questions;

export const getLiveQuestion = () => {
  return [...questions]
    .filter((question) => question.status === 'Live')
    .sort((a, b) => a.order - b.order)[0] ?? null;
};

export const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getSnapshot = () => questions;

export const useDailyQuestions = () => useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

export const hydrateQuestions = async () => {
  if (hasHydrated) {
    return;
  }

  hasHydrated = true;

  try {
    const storedValue = await storage.getItem(STORAGE_KEY);
    if (!storedValue) {
      questions = [...initialQuestions];
      notify();
      return;
    }

    const parsed = JSON.parse(storedValue);
    const nextQuestions = Array.isArray(parsed) ? parsed.map((question, index) => normalizeQuestion(question, index + 1)) : [...initialQuestions];
    questions = reindexApprovedQueue(nextQuestions.length > 0 ? nextQuestions : [...initialQuestions]);
  } catch {
    questions = [...initialQuestions];
  }

  notify();
};

const saveQuestions = async (nextQuestions: DailyQuestion[]) => {
  questions = reindexApprovedQueue(nextQuestions);
  await storage.setItem(STORAGE_KEY, JSON.stringify(questions));
  notify();
};

export const setQuestions = (nextQuestions: DailyQuestion[]) => {
  void saveQuestions(nextQuestions);
};

// ---------------------------------------------------------------------------
// Status transition actions
//
// Every action re-validates against STATUS_TRANSITIONS itself — it never trusts that
// the caller (Admin UI) only offers valid moves. Functions are named by target status
// because several source statuses can legally reach the same target (e.g. Idea,
// NeedsRevision, and Rejected can all reach Draft); canTransitionStatus is what decides
// whether a given source→target move is actually allowed.
// ---------------------------------------------------------------------------

export const moveToDraft = (id: number): boolean => {
  const current = getQuestions().find((question) => question.id === id);
  if (!current || !canTransitionStatus(current.status, 'Draft')) {
    return false;
  }

  setQuestions(
    getQuestions().map((question) => (question.id === id ? { ...question, status: 'Draft' as DailyStatus } : question))
  );
  return true;
};

export const submitForReview = (id: number): boolean => {
  const current = getQuestions().find((question) => question.id === id);
  if (!current || !canTransitionStatus(current.status, 'ReadyForReview')) {
    return false;
  }

  setQuestions(
    getQuestions().map((question) =>
      question.id === id ? { ...question, status: 'ReadyForReview' as DailyStatus } : question
    )
  );
  return true;
};

// The only function in this file that may set status to 'Approved'. It is also the only
// function that stamps approval metadata. There is no code path anywhere that reaches
// 'Approved' automatically — a human calling this from the Review Studio is the only
// route. Also enforced here: a structurally incomplete Daily package cannot be approved,
// even if a screen somehow renders an enabled Approve control for one.
export const approveQuestion = (id: number): boolean => {
  const current = getQuestions().find((question) => question.id === id);
  if (!current || !canTransitionStatus(current.status, 'Approved') || !isQuestionComplete(current)) {
    return false;
  }

  const approvedContentVersion = computeContentFingerprint(current);

  setQuestions(
    getQuestions().map((question) =>
      question.id === id
        ? {
            ...question,
            status: 'Approved' as DailyStatus,
            approvedBy: PROTOTYPE_EDITOR,
            approvedAt: new Date().toISOString(),
            approvedContentVersion,
            reviewNote: null,
          }
        : question
    )
  );
  return true;
};

// `note` is an optional short editorial note (e.g. "Answer D reads too jokey next to the
// others") shown the next time this question is reviewed. It is not a full revision
// history — just the most recent note — and is cleared automatically on approval.
export const sendToRevision = (id: number, note?: string): boolean => {
  const current = getQuestions().find((question) => question.id === id);
  if (!current || !canTransitionStatus(current.status, 'NeedsRevision')) {
    return false;
  }

  const trimmedNote = note?.trim();

  setQuestions(
    getQuestions().map((question) =>
      question.id === id
        ? {
            ...question,
            status: 'NeedsRevision' as DailyStatus,
            approvedBy: null,
            approvedAt: null,
            approvedContentVersion: null,
            reviewNote: trimmedNote ? trimmedNote : question.reviewNote,
          }
        : question
    )
  );
  return true;
};

export const rejectQuestion = (id: number): boolean => {
  const current = getQuestions().find((question) => question.id === id);
  if (!current || !canTransitionStatus(current.status, 'Rejected')) {
    return false;
  }

  setQuestions(
    getQuestions().map((question) =>
      question.id === id ? { ...question, status: 'Rejected' as DailyStatus, order: 99, scheduledFor: null } : question
    )
  );
  return true;
};

// Clears a Scheduled question's release date, unscheduling it back to Approved (or just
// clears the field if it's already Approved with a stray date). This function only ever
// CLEARS — setting/changing a date is handled by insertQuestionAtDate below, which
// centralizes collision handling (Part 7/8). Clearing is always safe: removing a date can
// never collide with anything.
//
// scheduledFor is not an editorially material field (it doesn't change the approved
// content itself), so clearing it never touches approval metadata.
export const scheduleQuestion = (id: number, date: string): boolean => {
  const current = getQuestions().find((question) => question.id === id);
  if (!current) {
    return false;
  }

  if (date.trim()) {
    // Not this function's job — see insertQuestionAtDate.
    return false;
  }

  if (current.status === 'Scheduled' && canTransitionStatus('Scheduled', 'Approved')) {
    setQuestions(
      getQuestions().map((question) =>
        question.id === id ? { ...question, status: 'Approved' as DailyStatus, scheduledFor: null } : question
      )
    );
    return true;
  }

  if (current.status === 'Approved') {
    setQuestions(
      getQuestions().map((question) => (question.id === id ? { ...question, scheduledFor: null } : question))
    );
    return true;
  }

  return false;
};

const addOneDay = (dateValue: string): string => {
  const [year, month, day] = dateValue.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}-${String(next.getUTCDate()).padStart(2, '0')}`;
};

// "Today" in the device's own local timezone — deliberately not UTC, since Publish Next's
// target date must match the calendar day the editor is actually experiencing.
const getTodayLocalDateKey = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

// The single source of truth for "where would this question land, and what would it
// displace" — both getScheduleInsertionPreview (read-only, for confirmation copy) and
// insertQuestionAtDate (the actual mutation) are built on this exact same walk, so the
// number an editor is shown before confirming can never drift from what actually happens.
//
// The schedule is treated as ONE ordered future publishing queue, not a set of isolated
// dates: inserting at targetDate shifts EVERY Scheduled question whose date is on or after
// targetDate forward by exactly one day — including ones separated from the insertion
// point by a gap in the calendar. Shifting only stops-at-the-first-free-date would silently
// let a later Daily "absorb" a gap and land earlier than an editor intended; shifting the
// whole tail preserves relative editorial order regardless of gaps.
//
// Only Approved (first-time scheduling) or already-Scheduled (moving to a new date)
// questions are eligible — Live/Archived/Draft/etc. can never enter the schedule this way,
// and Live questions are never part of this at all.
const computeInsertionPlan = (questionId: number, targetDate: string): Map<number, string> | null => {
  const current = getQuestions().find((question) => question.id === questionId);
  if (!current || !isValidDateValue(targetDate)) {
    return null;
  }
  if (current.status !== 'Approved' && current.status !== 'Scheduled') {
    return null;
  }

  const dateAssignments = new Map<number, string>();
  dateAssignments.set(questionId, targetDate);

  getQuestions()
    .filter(
      (question) =>
        question.id !== questionId &&
        question.status === 'Scheduled' &&
        question.scheduledFor !== null &&
        question.scheduledFor >= targetDate
    )
    .forEach((question) => {
      dateAssignments.set(question.id, addOneDay(question.scheduledFor as string));
    });

  return dateAssignments;
};

// Read-only preview of what insertQuestionAtDate would do — for confirmation dialogs.
// shiftedCount excludes the question being placed itself, counting only the Dailies that
// would move as a result.
export const getScheduleInsertionPreview = (
  questionId: number,
  targetDate: string
): { targetDate: string; shiftedCount: number } | null => {
  const plan = computeInsertionPlan(questionId, targetDate);
  if (!plan) {
    return null;
  }
  return { targetDate, shiftedCount: plan.size - 1 };
};

// Places `questionId` at `targetDate`. If another Scheduled question already occupies that
// date, it (and anything after it, transitively) shifts forward one day at a time until
// every question has a unique date. Nothing is ever deleted or silently overwritten, and
// relative order is preserved — this is the ONE place that mutates the schedule, used by
// both Publish Next and manual date edits (Part 7/8).
export const insertQuestionAtDate = (questionId: number, targetDate: string): boolean => {
  const plan = computeInsertionPlan(questionId, targetDate);
  if (!plan) {
    return false;
  }

  const nextQuestions = getQuestions().map((question) => {
    const assignedDate = plan.get(question.id);
    if (!assignedDate) {
      return question;
    }
    return { ...question, status: 'Scheduled' as DailyStatus, scheduledFor: assignedDate };
  });

  setQuestions(nextQuestions);
  return true;
};

// Part 9's definition of "next": if there is a Live Daily today, Publish Next targets
// tomorrow's LOCAL calendar date — the Live question already owns "today," so the next
// available editorial slot is the day after. If there is somehow no Live question at all
// (never happens with the current seed data, but the architecture doesn't assume one always
// exists), this does not silently reuse "tomorrow" as a guess — it walks forward from today
// to the earliest date not already claimed by a Scheduled question, so the very first
// available slot is used rather than an arbitrary one.
export const getPublishNextTargetDate = (): string => {
  const today = getTodayLocalDateKey();
  const hasLiveQuestion = getQuestions().some((question) => question.status === 'Live');

  if (hasLiveQuestion) {
    return addOneDay(today);
  }

  const occupied = new Set(
    getQuestions()
      .filter((question) => question.status === 'Scheduled' && question.scheduledFor)
      .map((question) => question.scheduledFor as string)
  );

  let cursor = today;
  while (occupied.has(cursor)) {
    cursor = addOneDay(cursor);
  }
  return cursor;
};

// Publishes a Scheduled question Live. If another question is currently Live, it is
// archived (never silently demoted back to Approved — Live can only move to Archived).
//
// This is deliberately NOT called from the normal Admin dashboard — replacing an
// already-Live Daily is an emergency/privileged operation (Part 10/11), not a casual
// editorial action. It remains here as the underlying primitive for that future
// privileged workflow; for the current prototype it is a behind-the-scenes/developer
// operation only, reachable by calling this function directly, not through any button.
export const publishQuestion = (id: number): boolean => {
  const current = getQuestions().find((question) => question.id === id);
  if (!current || !canTransitionStatus(current.status, 'Live')) {
    return false;
  }

  const previousLive = getQuestions().find((question) => question.status === 'Live' && question.id !== id);

  const nextQuestions = getQuestions().map((question) => {
    if (question.id === id) {
      return {
        ...question,
        status: 'Live' as DailyStatus,
        order: 1,
        scheduledFor: null,
        publishedFor: getTodayLocalDateKey(),
      };
    }
    if (previousLive && question.id === previousLive.id) {
      return { ...question, status: 'Archived' as DailyStatus };
    }
    return question;
  });

  setQuestions(nextQuestions);
  return true;
};

// Runs at app/module initialization AND whenever the app returns to the foreground (see
// the bottom of this file) to promote today's Scheduled Daily to Live, if there is one.
// Idempotent by construction: it only acts when it finds a question with
// status === 'Scheduled' AND scheduledFor === today, and promotion always changes that
// question's status away from 'Scheduled' and clears scheduledFor — so a repeated call
// (same session, a fresh reload after the promoted state was persisted, or the app
// resuming from the background) simply finds no match and does nothing. Never touches a
// question that isn't Scheduled-for-exactly-today: Draft/ReadyForReview/NeedsRevision/
// Rejected and Approved-but-unscheduled are never eligible, and a future Scheduled date is
// never published early. If today's Daily is already Live, this never replaces it with
// anything else — that only happens through the emergency publishQuestion primitive
// above, never from reconciliation.
export const reconcileDailyLifecycle = (): boolean => {
  const today = getTodayLocalDateKey();

  // Defensive same-day guard, checked BEFORE looking for anything to promote: if today's
  // Live Daily is already correctly in place, reconciliation stops here — it never
  // considers replacing an already-published-today question with a different one
  // (e.g. a second question that also happens to be Scheduled for today), even
  // accidentally. Today's already-Live Daily always wins.
  const currentLive = getQuestions().find((question) => question.status === 'Live');
  if (currentLive && currentLive.publishedFor === today) {
    return false;
  }

  const todaysScheduled = getQuestions().find(
    (question) => question.status === 'Scheduled' && question.scheduledFor === today
  );

  if (!todaysScheduled) {
    return false;
  }

  const nextQuestions = getQuestions().map((question) => {
    if (question.id === todaysScheduled.id) {
      return {
        ...question,
        status: 'Live' as DailyStatus,
        order: 1,
        scheduledFor: null,
        publishedFor: today,
      };
    }
    if (currentLive && question.id === currentLive.id) {
      return { ...question, status: 'Archived' as DailyStatus };
    }
    return question;
  });

  setQuestions(nextQuestions);
  return true;
};

export const archiveQuestion = (id: number): boolean => {
  const current = getQuestions().find((question) => question.id === id);
  if (!current || !canTransitionStatus(current.status, 'Archived')) {
    return false;
  }

  setQuestions(
    getQuestions().map((question) => (question.id === id ? { ...question, status: 'Archived' as DailyStatus } : question))
  );
  return true;
};

// Published/publish-adjacent content is never casually deletable. Idea, Draft,
// ReadyForReview, NeedsRevision, and Rejected are all pre-publication editorial states
// and may be deleted freely. Approved and Scheduled require an explicit move back to an
// editorial state first (e.g. sendToRevision) before deletion is allowed. Live and
// Archived can never be deleted — that is the permanent published history.
const DELETABLE_STATUSES = new Set<DailyStatus>(['Idea', 'Draft', 'ReadyForReview', 'NeedsRevision', 'Rejected']);

export const canDeleteQuestion = (status: DailyStatus): boolean => DELETABLE_STATUSES.has(status);

// Enforced here, not just in the UI — a future screen that calls this directly still
// cannot delete Live/Archived/Approved/Scheduled content.
export const deleteQuestion = (id: number): boolean => {
  const current = getQuestions().find((question) => question.id === id);
  if (!current || !canDeleteQuestion(current.status)) {
    return false;
  }

  const nextQuestions: DailyQuestion[] = getQuestions().filter((question) => question.id !== id);
  setQuestions(nextQuestions);
  return true;
};

export const moveQuestion = (id: number, direction: 'up' | 'down') => {
  const currentList = getQuestions();
  const approvedQuestions = [...currentList]
    .filter((question) => question.status === 'Approved')
    .sort((a, b) => a.order - b.order);

  const index = approvedQuestions.findIndex((question) => question.id === id);
  if (index < 0) {
    return;
  }

  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= approvedQuestions.length) {
    return;
  }

  const [item] = approvedQuestions.splice(index, 1);
  approvedQuestions.splice(targetIndex, 0, item);

  const orderMap = new Map(approvedQuestions.map((question, orderIndex) => [question.id, orderIndex + 1]));

  const nextQuestions: DailyQuestion[] = currentList.map((question) =>
    question.status === 'Approved'
      ? ({ ...question, order: orderMap.get(question.id) ?? question.order } as DailyQuestion)
      : question
  );

  setQuestions(nextQuestions);
};

// ---------------------------------------------------------------------------
// Material content edits
//
// This is the ONLY place that mutates prompt/answer-label content. Every editor
// (today: Admin's prompt/label fields; later: category, personalityEffects,
// apparentlyFeedback, Commonality metadata, sensitivity flags, reveal/share copy
// editors) should route through applyMaterialEdit so the invalidation rule can never
// be forgotten by a screen. It is centralized here, not duplicated per-screen.
// ---------------------------------------------------------------------------

const applyMaterialEdit = (id: number, mutate: (question: DailyQuestion) => DailyQuestion): boolean => {
  const current = getQuestions().find((question) => question.id === id);
  if (!current) {
    return false;
  }

  // No silent in-place edits to content that is already public (Live) or historical
  // (Archived). An explicit status transition away from Live is required first.
  if (current.status === 'Live' || current.status === 'Archived') {
    return false;
  }

  const edited = mutate(current);
  const isApprovalBacked = current.status === 'Approved' || current.status === 'Scheduled';
  const contentChanged = computeContentFingerprint(edited) !== computeContentFingerprint(current);

  const finalQuestion: DailyQuestion =
    isApprovalBacked && contentChanged
      ? { ...edited, status: 'NeedsRevision', approvedBy: null, approvedAt: null, approvedContentVersion: null }
      : edited;

  setQuestions(getQuestions().map((question) => (question.id === id ? finalQuestion : question)));
  return true;
};

export const updateQuestionPrompt = (id: number, value: string): boolean =>
  applyMaterialEdit(id, (question) => ({ ...question, prompt: value }));

export const updateQuestionOption = (
  id: number,
  optionId: number,
  field: 'label' | 'percent',
  value: string
): boolean => {
  if (field === 'percent') {
    // Vote-distribution data is not editorial content (it will eventually come from real
    // votes), so changing it does not require re-review. Still blocked on Live/Archived
    // for the same reason as any other edit — no silent changes to public content.
    const current = getQuestions().find((question) => question.id === id);
    if (!current || current.status === 'Live' || current.status === 'Archived') {
      return false;
    }

    setQuestions(
      getQuestions().map((question) =>
        question.id === id
          ? {
              ...question,
              options: question.options.map((option) =>
                option.id === optionId ? { ...option, percent: Math.max(0, Number(value) || 0) } : option
              ),
            }
          : question
      )
    );
    return true;
  }

  return applyMaterialEdit(id, (question) => ({
    ...question,
    options: question.options.map((option) => (option.id === optionId ? { ...option, label: value } : option)),
  }));
};

// Both of the following route through applyMaterialEdit exactly like updateQuestionOption's
// label branch — same Live/Archived block, same Approved/Scheduled → NeedsRevision
// invalidation. Capped at MAX_PERSONALITY_EFFECTS_PER_OPTION effects per answer to match
// the cap normalizeQuestion already enforces on persisted data — without this cap here, a
// UI could add a 4th effect that silently disappears the next time the question reloads.
export const updateQuestionOptionEffects = (id: number, optionId: number, effects: PersonalityEffect[]): boolean =>
  applyMaterialEdit(id, (question) => ({
    ...question,
    options: question.options.map((option) =>
      option.id === optionId
        ? { ...option, personalityEffects: effects.slice(0, MAX_PERSONALITY_EFFECTS_PER_OPTION) }
        : option
    ),
  }));

export const updateQuestionOptionFeedback = (id: number, optionId: number, value: string): boolean =>
  applyMaterialEdit(id, (question) => ({
    ...question,
    options: question.options.map((option) =>
      option.id === optionId ? { ...option, apparentlyFeedback: value } : option
    ),
  }));

// Reconcile the Daily lifecycle once persisted question state has loaded — "when the
// store/app initializes," per spec.
void hydrateQuestions().then(() => {
  reconcileDailyLifecycle();
});

// A mobile app doesn't necessarily reload its JS module on a new calendar day — a user
// can leave Apparently backgrounded overnight and simply resume the same running session.
// Module-load reconciliation alone would leave them stuck on yesterday's Daily in that
// case, so this also reconciles every time the app returns to the foreground.
// reconcileDailyLifecycle is idempotent, so firing on every 'active' transition (including
// ones that aren't actually a day change) is safe by design, not just by luck.
AppState.addEventListener('change', (nextAppState) => {
  if (nextAppState === 'active') {
    reconcileDailyLifecycle();
  }
});
