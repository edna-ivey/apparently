import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

// Whether the dismissible first-time welcome card on Today has already been dismissed on this
// device. Deliberately NOT derived from onboarding completion/profile answer count — this is
// purely "has this device ever closed the card," independent of how much real progress a user
// has made, so it can never reappear and interrupt a returning user. Mirrors the exact
// cross-platform storage pattern already established in src/data/daily-questions.ts and
// src/data/onboarding.ts (AsyncStorage on native, localStorage on web) rather than introducing
// a new persistence approach.
const STORAGE_KEY = 'apparently:today-welcome-dismissed';

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
      // ignore storage errors — worst case the card shows again next launch, never blocks
      // navigation or throws.
    }
  },
};

// 'unknown' while the stored flag hasn't loaded yet — the card must never flash visible before
// this resolves, only ever render once the real persisted value is known.
type DismissedState = 'unknown' | boolean;

let cachedDismissed: DismissedState = 'unknown';
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((listener) => listener());

void storage.getItem(STORAGE_KEY).then((value) => {
  cachedDismissed = value === 'true';
  notify();
});

export const useTodayWelcomeDismissed = (): DismissedState => {
  const [dismissed, setDismissed] = useState<DismissedState>(cachedDismissed);

  useEffect(() => {
    const listener = () => setDismissed(cachedDismissed);
    listeners.add(listener);
    listener();
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return dismissed;
};

export const dismissTodayWelcome = (): void => {
  cachedDismissed = true;
  notify();
  void storage.setItem(STORAGE_KEY, 'true');
};
