import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

// Completed Explore quiz results — deliberately separate from apparently:daily-answers
// (Daily is its own immutable-answer concept with its own scoring/Commonality path) and from
// apparently:onboarding/user-profile/self-perception. A quiz result is neither of those: it's
// entertainment content the user finished, not a Daily commitment or a self-perception claim.
export type QuizResultRecord = {
  quizId: string;
  completedAt: string;
  score: number;
  percent: number;
  resultId: string;
  resultTitle: string;
  traits: string[];
};

const STORAGE_KEY = 'apparently:quiz-results';

// Same dual web/native storage shim used by onboarding.ts/daily-answer.ts — kept local so
// this module has no import-order coupling to unrelated storage.
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

const isValidQuizResultRecord = (value: unknown): value is QuizResultRecord => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.quizId === 'string' &&
    typeof candidate.completedAt === 'string' &&
    typeof candidate.score === 'number' &&
    typeof candidate.percent === 'number' &&
    typeof candidate.resultId === 'string' &&
    typeof candidate.resultTitle === 'string' &&
    Array.isArray(candidate.traits) &&
    candidate.traits.every((trait) => typeof trait === 'string')
  );
};

// A flat, append-only history (not one-slot-per-quiz) — retaking a quiz adds a new record
// rather than destroying the previous one, per the approved spec. `hydrated` lives inside the
// snapshot object itself (not a sibling variable) so useSyncExternalStore's identity check
// actually fires on hydration even when the stored list is empty — see onboarding.ts's
// useOnboardingState for the full explanation of why that matters.
type QuizResultsSnapshot = {
  hydrated: boolean;
  results: QuizResultRecord[];
};

const listeners = new Set<() => void>();
let snapshot: QuizResultsSnapshot = { hydrated: false, results: [] };
let hydrationPromise: Promise<void> | null = null;

const notify = () => listeners.forEach((listener) => listener());

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => snapshot;

export const hydrateQuizResults = async (): Promise<void> => {
  if (snapshot.hydrated) {
    return;
  }
  if (hydrationPromise) {
    return hydrationPromise;
  }

  hydrationPromise = (async () => {
    let results: QuizResultRecord[] = [];
    try {
      const stored = await storage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            results = parsed.filter(isValidQuizResultRecord);
          }
        } catch {
          // Corrupt JSON — fail safe to an empty history rather than crashing the app.
        }
      }
    } catch {
      // Storage read itself failed — fail safe to an empty history.
    } finally {
      snapshot = { hydrated: true, results };
      hydrationPromise = null;
      notify();
    }
  })();

  return hydrationPromise;
};

// Reactive: a screen that's already mounted (e.g. You, if it was pre-mounted by the tab
// navigator) sees a freshly-saved result immediately — no restart needed, same reasoning as
// useUserProfile in onboarding.ts.
export const useQuizResults = (): QuizResultRecord[] | 'loading' => {
  const current = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return current.hydrated ? current.results : 'loading';
};

// Convenience selector for "the most recent completion of this quiz" — You's Recent Read
// only ever needs the latest, but the full history stays available for future use (a past
// results list, re-take comparisons, etc.) without re-reading storage.
export const useLatestQuizResult = (quizId: string): QuizResultRecord | 'loading' | null => {
  const results = useQuizResults();
  if (results === 'loading') {
    return 'loading';
  }
  const matches = results.filter((result) => result.quizId === quizId);
  return matches.length > 0 ? matches[matches.length - 1] : null;
};

// Appends a completed quiz result and persists the full history. Never overwrites or removes
// prior records for the same quiz — a retake is a new entry.
export const saveQuizResult = async (record: QuizResultRecord): Promise<void> => {
  await hydrateQuizResults();
  const results = [...snapshot.results, record];
  snapshot = { hydrated: true, results };
  notify();
  await storage.setItem(STORAGE_KEY, JSON.stringify(results));
};
