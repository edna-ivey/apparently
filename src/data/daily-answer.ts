import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

// The Daily captures a user's instinctive choice BEFORE they see how everyone else
// answered. Allowing a change after the reveal is shown would distort voting integrity,
// Commonality, and personality scoring, so a committed answer is permanent. This module
// holds the single source of truth for "has this device already answered question N, and
// with what" — keyed per question, not a single global slot, so answering today's Daily
// can never overwrite yesterday's record. There is no backend/auth yet, so "session" here
// means "this device's local storage," matching every other persistence mechanism in the
// prototype. This history is intentionally just {questionId: optionIndex} for now — it is
// the foundation Commonality, personality/profile evolution, rare-pick tracking, streaks,
// and recaps will eventually read from, but none of those are built here.
const STORAGE_KEY = 'apparently:daily-answers';

// Old single-slot shape, read once for a best-effort migration so an already-committed
// answer from before this change isn't silently lost.
const LEGACY_STORAGE_KEY = 'apparently:daily-answer';

export type DailyAnswerHistory = Record<string, number>;

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

const listeners = new Set<() => void>();
let answerHistory: DailyAnswerHistory = {};
let hasHydrated = false;

const notify = () => {
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => answerHistory;

// Scoped to one question, matching the "expose the answer for the requested/current
// question" API this is meant to serve — a screen never needs the whole history object,
// just "has THIS question been answered, and with what."
export const useCommittedDailyAnswer = (questionId: number): number | null => {
  const history = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const value = history[String(questionId)];
  return typeof value === 'number' ? value : null;
};

const isValidHistory = (value: unknown): value is DailyAnswerHistory =>
  !!value && typeof value === 'object' && !Array.isArray(value);

export const hydrateDailyAnswers = async () => {
  if (hasHydrated) {
    return;
  }
  hasHydrated = true;

  try {
    const stored = await storage.getItem(STORAGE_KEY);
    if (stored !== null) {
      // The new-format key exists — it's authoritative whether or not it parses cleanly.
      // A corrupted record fails safe to empty; it does NOT fall back to the legacy key,
      // which could resurrect a stale single answer and silently lose newer ones.
      try {
        const parsed = JSON.parse(stored);
        if (isValidHistory(parsed)) {
          const validated: DailyAnswerHistory = {};
          for (const [key, value] of Object.entries(parsed)) {
            if (/^\d+$/.test(key) && typeof value === 'number' && Number.isInteger(value)) {
              validated[key] = value;
            }
          }
          answerHistory = validated;
        }
      } catch {
        answerHistory = {};
      }
      notify();
      return;
    }
  } catch {
    // storage read itself failed — fail safe, still attempt the legacy migration below
  }

  // New-format key was never written on this device — a one-time migration from the old
  // single-answer shape, so a previously committed answer isn't silently dropped.
  try {
    const legacyStored = await storage.getItem(LEGACY_STORAGE_KEY);
    if (legacyStored) {
      const legacyParsed = JSON.parse(legacyStored);
      if (
        legacyParsed &&
        typeof legacyParsed === 'object' &&
        typeof legacyParsed.questionId === 'number' &&
        typeof legacyParsed.optionIndex === 'number'
      ) {
        answerHistory = { [String(legacyParsed.questionId)]: legacyParsed.optionIndex };
        await storage.setItem(STORAGE_KEY, JSON.stringify(answerHistory));
      }
    }
  } catch {
    // corrupt/unreadable legacy storage — behave as if nothing has been answered yet
  }

  notify();
};

// Returns false (and changes nothing) if this exact question already has a committed
// answer — the store-level guarantee that a Daily answer can never be silently replaced,
// even if a screen somehow calls this twice. Committing question N never touches any
// other question's entry, so prior Dailies' answers are always preserved.
export const commitDailyAnswer = (questionId: number, optionIndex: number): boolean => {
  const key = String(questionId);
  if (Object.prototype.hasOwnProperty.call(answerHistory, key)) {
    return false;
  }

  answerHistory = { ...answerHistory, [key]: optionIndex };
  void storage.setItem(STORAGE_KEY, JSON.stringify(answerHistory));
  notify();
  return true;
};
