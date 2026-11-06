import AsyncStorage from '@react-native-async-storage/async-storage';

import { submitQuizCompletion, type SubmitQuizCompletionPayload } from '@/services/quiz-result-service';

// A network failure while submitting a freshly-completed quiz must never block the result
// screen (that already works off local state — see quiz/[quizId].tsx), but the profile
// contribution must not just silently vanish either. This is intentionally small: one flat
// queue, retried opportunistically (You opening, app/session init) — not a general offline-
// sync framework. submit_quiz_completion is idempotent on (user_id, quiz_id, completed_at)
// for the quiz_results row it writes, and its first-completion decision is a separate,
// independently idempotent (user_id, quiz_id) insert -- retrying a submission that already
// succeeded server-side (response merely lost) is always safe, just comes back as
// was_retry: true / is_first_completion: false on the second attempt.
//
// Build 22 final cleanup (owner-authorized clean V1 reset, 2026-11-02): a payload already
// sitting in this AsyncStorage queue from a build installed BEFORE the original Build 22
// cutover is shaped like the now-retired SubmitQuizResultPayload (field `quizId`, no
// `quizKey`). Previously this was routed to the legacy submitQuizResultRemote/submit_quiz_result
// RPC to preserve it as V1 history. The owner has since authorized a clean V1 data reset --
// "We do NOT need to preserve obsolete beta quiz scores... old TestFlight clients must fail
// safely instead of allowing them to write incompatible scoring data after cutover." Such a
// stale payload is now DISCARDED outright (never submitted through any RPC) rather than kept
// queued or forced through a retired path -- this is the fail-safe behavior, not a bug.
const isLegacyPayload = (payload: SubmitQuizCompletionPayload | Record<string, unknown>): boolean => !('quizKey' in payload);

const STORAGE_KEY = 'apparently:pending-quiz-submissions';

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
      // ignore storage errors — worst case, a failed submission isn't retried later
    }
  },
};

type PendingPayload = SubmitQuizCompletionPayload | Record<string, unknown>;

const readPending = async (): Promise<PendingPayload[]> => {
  try {
    const stored = await storage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writePending = async (payloads: PendingPayload[]): Promise<void> => {
  await storage.setItem(STORAGE_KEY, JSON.stringify(payloads));
};

export const queuePendingQuizSubmission = async (payload: SubmitQuizCompletionPayload): Promise<void> => {
  const pending = await readPending();
  pending.push(payload);
  await writePending(pending);
};

// Retries every queued submission in order; a payload that still fails stays queued, a
// payload that succeeds is removed. Safe to call opportunistically and often — a no-op when
// the queue is empty.
export const flushPendingQuizSubmissions = async (): Promise<void> => {
  const pending = await readPending();
  if (pending.length === 0) {
    return;
  }

  const stillPending: PendingPayload[] = [];
  for (const payload of pending) {
    if (isLegacyPayload(payload)) {
      // See this file's header note -- a stale pre-cutover queued payload is discarded, not
      // submitted through any RPC. Fail-safe by design: never retried, never blocks the queue.
      console.warn('[pending-quiz-submissions] discarding a stale legacy-shaped queued payload (pre-V1-reset cutover)');
      continue;
    }
    const result = await submitQuizCompletion(payload as SubmitQuizCompletionPayload);
    if (!result.ok) {
      stillPending.push(payload);
    }
  }

  await writePending(stillPending);
};
