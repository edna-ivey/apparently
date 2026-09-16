import AsyncStorage from '@react-native-async-storage/async-storage';

import { submitQuizResultRemote, type SubmitQuizResultPayload } from '@/services/quiz-result-service';

// A network failure while submitting a freshly-completed quiz must never block the result
// screen (that already works off local state — see quiz/[quizId].tsx), but the profile
// contribution must not just silently vanish either. This is intentionally small: one flat
// queue, retried opportunistically (You opening, app/session init) — not a general offline-
// sync framework. submit_quiz_result is idempotent on (user_id, quiz_id, completed_at), so
// retrying a submission that actually already succeeded server-side (response merely lost)
// is always safe — it just comes back as was_retry: true.

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

const readPending = async (): Promise<SubmitQuizResultPayload[]> => {
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

const writePending = async (payloads: SubmitQuizResultPayload[]): Promise<void> => {
  await storage.setItem(STORAGE_KEY, JSON.stringify(payloads));
};

export const queuePendingQuizSubmission = async (payload: SubmitQuizResultPayload): Promise<void> => {
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

  const stillPending: SubmitQuizResultPayload[] = [];
  for (const payload of pending) {
    const result = await submitQuizResultRemote(payload);
    if (!result.ok) {
      stillPending.push(payload);
    }
  }

  await writePending(stillPending);
};
