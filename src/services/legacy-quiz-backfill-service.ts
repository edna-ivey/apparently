import AsyncStorage from '@react-native-async-storage/async-storage';

import { getCurrentUserId } from './auth-service';
import { submitQuizResultRemote } from './quiz-result-service';
import { getQuizDefinition } from '@/data/quizzes';
import { getAllQuizResults } from '@/data/quizzes/results';
import { resolveStoredQuizProfileSignals } from '@/data/quizzes/scoring';

// Michelle's sister (and any other tester) may already have an OLDER TestFlight build
// installed, with local quiz history under apparently:quiz-results from before remote quiz
// submission existed. Updating the app must not forget those completions — this module
// resyncs local-only history into the same submit_quiz_result RPC every fresh completion
// already uses, so old quizzes join the SAME living You profile as everything else.
//
// No new database schema was needed: submit_quiz_result already accepts an explicit
// completed_at, and the (user_id, quiz_id, completed_at) unique index already makes this
// naturally idempotent — resyncing is just calling the same RPC with each local record's
// ORIGINAL timestamp instead of `new Date()`.

const MARKER_PREFIX = 'apparently:legacy-quiz-backfill:v1:';

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
      // ignore storage errors — worst case, backfill is attempted again next time
    }
  },
};

// Resyncs this user's local-only quiz history into Supabase. Safe to call often: a per-user
// marker skips the work entirely once everything recoverable has synced (or was confirmed
// already present remotely via the RPC's own idempotency), and even without the marker,
// re-running this is always safe — submit_quiz_result treats a resubmitted (user, quiz,
// completed_at) as a retry, never a duplicate.
export const syncLegacyQuizResultsToRemote = async (): Promise<void> => {
  const userId = await getCurrentUserId();
  if (!userId) {
    return;
  }

  const markerKey = `${MARKER_PREFIX}${userId}`;
  const alreadyDone = await storage.getItem(markerKey);
  if (alreadyDone === 'done') {
    return;
  }

  const localResults = await getAllQuizResults();
  if (localResults.length === 0) {
    // Nothing to backfill, ever, for this install — mark done so future launches don't keep
    // re-checking an empty history.
    await storage.setItem(markerKey, 'done');
    return;
  }

  // Oldest first — results.ts already appends in completion order, but sorting explicitly
  // here is what actually GUARANTEES the earliest real completion of a given quiz is the one
  // submit_quiz_result sees first, so it (correctly) becomes the profile-contributing
  // completion, exactly matching the current V1 first-completion-only rule.
  const chronological = [...localResults].sort(
    (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime(),
  );

  let everythingRecoverableSucceeded = true;

  for (const record of chronological) {
    const definition = getQuizDefinition(record.quizId);
    if (!definition) {
      // The quiz itself no longer exists in the current content library — genuinely
      // irrecoverable. Never crash, never block the marker on this one record.
      console.warn('[legacy-quiz-backfill] skipping local quiz result for unknown quizId:', record.quizId);
      continue;
    }

    const result = await submitQuizResultRemote({
      quizId: record.quizId,
      quizTitle: definition.title,
      quizCategory: definition.category,
      // The ORIGINAL local timestamp is this historical completion's identity — never
      // `new Date()`. Reusing it is what makes this idempotent against the unique index and
      // what lets the oldest real completion win the first-completion rule correctly.
      completedAt: record.completedAt,
      questionCount: definition.questions.length,
      score: record.score,
      percent: record.percent,
      resultId: record.resultId,
      resultTitle: record.resultTitle,
      traits: record.traits,
      mix: record.mix,
      // May be undefined if the resultId no longer exists on the current definition (content
      // changed since) — submitQuizResultRemote/the RPC both handle that as "no signals",
      // never as an error; the history row itself is still recovered either way.
      profileSignals: resolveStoredQuizProfileSignals(definition, record.resultId),
    });

    if (!result.ok) {
      everythingRecoverableSucceeded = false;
      console.warn('[legacy-quiz-backfill] failed to sync a legacy quiz result:', result.message);
    }
  }

  // Only mark complete once every RECOVERABLE record has either synced or was already present
  // remotely (both cases return result.ok: true) — a genuine failure (network, validation)
  // leaves the marker unset so this retries next time, but an unrecoverable record (unknown
  // quiz/content) never blocks it forever.
  if (everythingRecoverableSucceeded) {
    await storage.setItem(markerKey, 'done');
  }
};
