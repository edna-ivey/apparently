import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { commitDailyAnswer, hydrateDailyAnswers, useCommittedDailyAnswer } from '@/data/daily-answer';
import { initialQuestions, useDailyQuestions } from '@/data/daily-questions';
import { isRemoteDailyEnabled } from '@/lib/supabase';
import type { PersonalityEffect } from '@/data/personality';
import { ensureAnonymousSession } from '@/services/auth-service';
import { commitDailyAnswerRemote, getDailyAnswer, getDailyDistribution, getLiveDailyQuestion } from '@/services/daily-service';
import type { DailyDistributionRow } from '@/services/types';

// Sprint 1B-A — "Make Today real." Today has two possible Daily sources during the
// local→remote transition, with deliberately incompatible identifier types (local: numeric
// question/option ids from src/data/daily-questions.ts; remote: Supabase uuid ids). This
// module is the ONE place that reconciles them into a single consumer-facing shape, so
// src/app/(tabs)/index.tsx never has to know or care which source it's rendering — it works
// entirely off OPTION INDEX (0-3), never a raw id of either type. Neither the local editorial
// store nor the remote services are changed to accommodate this; this is a pure adapter.

export type ConsumerDailyOption = {
  label: string;
  personalityEffects: PersonalityEffect[];
  apparentlyFeedback: string | null;
};

export type ConsumerDailyQuestion = {
  prompt: string;
  category: string;
  options: ConsumerDailyOption[];
};

// The vote itself (committedIndex) and The Room's tally (distribution) are DELIBERATELY
// decoupled — a vote can be locked in successfully while its distribution fetch is still
// loading or has failed, and that must never be hidden behind fabricated numbers. 'idle'
// means "not committed yet, nothing requested" (matches the answer-first rule — see below).
// 'ready' is the only status that ever carries real percentages; 'loading'/'error' never do.
// `totalAnswers` is the real server-derived population size behind `percentages` (see
// DailyDistributionRow.total_answers) — null for local prototype data, which has no real
// population count and must never invent one. Only ever non-null via a successful remote
// get_daily_distribution response.
export type DistributionState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; percentages: number[]; totalAnswers: number | null }
  | { status: 'error'; message: string };

export type ConsumerDailyExperience =
  | { source: 'local'; question: ConsumerDailyQuestion; committedIndex: number | null; distribution: DistributionState }
  | { source: 'remote'; phase: 'loading' }
  // Deliberate, distinct empty state: the database genuinely has no Live question right now.
  // Never silently substituted with local/prototype content.
  | { source: 'remote'; phase: 'no-live-daily' }
  // A real network/DB failure — distinct from no-live-daily. The caller should offer retry,
  // never fall back to local content (that could create two conflicting Dailies).
  | { source: 'remote'; phase: 'error'; message: string }
  | { source: 'remote'; phase: 'ready'; question: ConsumerDailyQuestion; committedIndex: number | null; distribution: DistributionState };

const fallbackLocalQuestion = initialQuestions.find((item) => item.id === 5) ?? initialQuestions[0];

const toConsumerQuestion = (
  prompt: string,
  category: string,
  options: { label: string; personalityEffects?: PersonalityEffect[]; apparentlyFeedback?: string | null }[],
): ConsumerDailyQuestion => ({
  prompt,
  category,
  options: options.map((option) => ({
    label: option.label,
    personalityEffects: option.personalityEffects ?? [],
    apparentlyFeedback: option.apparentlyFeedback ?? null,
  })),
});

// Maps a successful distribution RPC result back onto the four displayed option ids, in
// index order. Only ever called with a genuinely successful result — an error never reaches
// here, so this can never manufacture a 0% row out of a failed request.
const toPercentages = (optionIds: string[], rows: DailyDistributionRow[]): number[] =>
  optionIds.map((id) => rows.find((row) => row.option_id === id)?.percent ?? 0);

// Every row from a successful get_daily_distribution call carries the same real
// total_answers value — read it from the first row. A successful call that unexpectedly
// returns zero rows has no real population count to report, so this is null rather than a
// fabricated 0.
const toTotalAnswers = (rows: DailyDistributionRow[]): number | null => rows[0]?.total_answers ?? null;

// Internal remote state machine — a strict subset of ConsumerDailyExperience's remote
// variants, plus the bookkeeping (questionId/optionIds) the hook needs internally but the
// consumer screen never sees.
type RemoteState =
  | { phase: 'loading' }
  | { phase: 'no-live-daily' }
  | { phase: 'error'; message: string }
  | {
      phase: 'ready';
      questionId: string;
      optionIds: string[];
      question: ConsumerDailyQuestion;
      committedIndex: number | null;
      distribution: DistributionState;
    };

export type UseConsumerDailyExperience = {
  experience: ConsumerDailyExperience;
  draftIndex: number | null;
  selectDraftOption: (index: number) => void;
  confirmAnswer: () => void;
  isCommitting: boolean;
  commitError: string | null;
  // No-op for 'local'. Reloads the ENTIRE remote Daily from scratch — question, answer, and
  // distribution — for the question/answer-level 'error' phase.
  retry: () => void;
  // No-op for 'local' and whenever there's nothing to retry. Re-requests ONLY the
  // distribution — never re-checks the question or re-fetches the answer, and never touches
  // the committed answer — for when `distribution.status === 'error'` on an already-committed
  // Daily.
  retryDistribution: () => void;
};

export const useConsumerDailyExperience = (): UseConsumerDailyExperience => {
  // --- Local hooks are always mounted (rules of hooks), exactly mirroring what
  // src/app/(tabs)/index.tsx already did unconditionally before this sprint — so local
  // behavior is byte-for-byte unaffected whether or not remote mode is enabled. -------------
  const questions = useDailyQuestions();
  const liveLocalQuestion = questions.find((question) => question.status === 'Live') ?? null;
  const localQuestion = liveLocalQuestion ?? fallbackLocalQuestion;
  const committedLocalIndex = useCommittedDailyAnswer(localQuestion.id);
  const [localDraftIndex, setLocalDraftIndex] = useState<number | null>(null);

  useEffect(() => {
    void hydrateDailyAnswers();
  }, []);

  // A fresh local Daily always starts with nothing drafted — matches existing behavior.
  useEffect(() => {
    setLocalDraftIndex(null);
  }, [liveLocalQuestion?.id, localQuestion.id]);

  const localExperience: ConsumerDailyExperience = useMemo(
    () => ({
      source: 'local',
      question: toConsumerQuestion(
        localQuestion.prompt,
        localQuestion.category,
        localQuestion.options,
      ),
      committedIndex: committedLocalIndex,
      // Local prototype percentages are real, static product data (not a remote fetch), so
      // they're always immediately 'ready' — there is no loading/error state for local.
      // totalAnswers is null: the prototype has no real population count behind these
      // numbers, and must never invent one.
      distribution: {
        status: 'ready',
        percentages: localQuestion.options.map((option) => option.percent),
        totalAnswers: null,
      },
    }),
    [localQuestion, committedLocalIndex],
  );

  const selectLocalDraftOption = useCallback(
    (index: number) => {
      if (committedLocalIndex !== null) {
        return;
      }
      setLocalDraftIndex(index);
    },
    [committedLocalIndex],
  );

  const confirmLocalAnswer = useCallback(() => {
    if (committedLocalIndex !== null || localDraftIndex === null) {
      return;
    }
    commitDailyAnswer(localQuestion.id, localDraftIndex);
  }, [committedLocalIndex, localDraftIndex, localQuestion.id]);

  // --- Remote state. Only ever actively loaded when isRemoteDailyEnabled — see the effect
  // below — so there is zero additional network activity when the flag is off. -------------
  const [remoteState, setRemoteState] = useState<RemoteState>({ phase: 'loading' });
  const [remoteDraftIndex, setRemoteDraftIndex] = useState<number | null>(null);
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitError, setCommitError] = useState<string | null>(null);
  const committingRef = useRef(false);

  // Fetches distribution for an already-known ready question and writes ONLY the
  // `distribution` field of the current state — never touches committedIndex. Safe to call
  // any time the state is 'ready', regardless of why (initial load, just-committed, or a
  // manual retry) — every caller below funnels through this one place.
  const refreshDistribution = useCallback(async (questionId: string, optionIds: string[]) => {
    setRemoteState((previous) => (previous.phase === 'ready' ? { ...previous, distribution: { status: 'loading' } } : previous));
    const distributionResult = await getDailyDistribution(questionId);
    setRemoteState((previous) => {
      if (previous.phase !== 'ready') {
        return previous;
      }
      return {
        ...previous,
        distribution: distributionResult.ok
          ? {
              status: 'ready',
              percentages: toPercentages(optionIds, distributionResult.data),
              totalAnswers: toTotalAnswers(distributionResult.data),
            }
          : { status: 'error', message: distributionResult.message },
      };
    });
  }, []);

  const loadRemote = useCallback(async () => {
    setRemoteState({ phase: 'loading' });
    setRemoteDraftIndex(null);
    setCommitError(null);

    // Ensure/reuse anonymous Supabase session — idempotent and concurrent-safe even if the
    // root layout's own bootstrap call hasn't resolved yet (see auth-service.ts).
    const session = await ensureAnonymousSession();
    if (!session) {
      setRemoteState({ phase: 'error', message: 'Could not start a session.' });
      return;
    }

    const liveResult = await getLiveDailyQuestion();
    if (!liveResult.ok) {
      setRemoteState({ phase: 'error', message: liveResult.message });
      return;
    }
    if (!liveResult.data) {
      // Deliberate empty state — never silently substitutes local/prototype content.
      setRemoteState({ phase: 'no-live-daily' });
      return;
    }

    const { question: remoteQuestion, options: remoteOptions } = liveResult.data;
    const sortedOptions = [...remoteOptions].sort((a, b) => a.position - b.position);
    const optionIds = sortedOptions.map((option) => option.id);
    const question = toConsumerQuestion(
      remoteQuestion.prompt,
      remoteQuestion.category,
      sortedOptions.map((option) => ({
        label: option.label,
        // personality_effects is stored as jsonb; the dimension strings are expected (by
        // application convention, documented in the migration) to match real
        // PersonalityDimensionId values already defined in src/data/personality.ts — this
        // layer trusts that convention rather than re-validating it row by row.
        personalityEffects: option.personality_effects as PersonalityEffect[],
        apparentlyFeedback: option.apparently_feedback,
      })),
    );

    // Do NOT call get_daily_distribution before confirming this user already answered — the
    // server enforces that, but the client respects it too rather than making a call it
    // knows will come back empty.
    const answerResult = await getDailyAnswer(remoteQuestion.id);
    if (!answerResult.ok) {
      setRemoteState({ phase: 'error', message: answerResult.message });
      return;
    }

    if (!answerResult.data) {
      setRemoteState({ phase: 'ready', questionId: remoteQuestion.id, optionIds, question, committedIndex: null, distribution: { status: 'idle' } });
      return;
    }

    // Already answered on the server — restore that immediately (this is server truth, not
    // fabricated). Distribution is fetched as a SEPARATE step right after: if it fails, the
    // committed answer above must stay exactly as restored, never revert to "unanswered."
    const existingIndex = optionIds.indexOf(answerResult.data.option_id);
    setRemoteState({
      phase: 'ready',
      questionId: remoteQuestion.id,
      optionIds,
      question,
      committedIndex: existingIndex >= 0 ? existingIndex : null,
      distribution: { status: 'loading' },
    });
    await refreshDistribution(remoteQuestion.id, optionIds);
  }, [refreshDistribution]);

  useEffect(() => {
    if (isRemoteDailyEnabled) {
      void loadRemote();
    }
  }, [loadRemote]);

  const selectRemoteDraftOption = useCallback(
    (index: number) => {
      if (remoteState.phase !== 'ready' || remoteState.committedIndex !== null) {
        return;
      }
      setCommitError(null);
      setRemoteDraftIndex(index);
    },
    [remoteState],
  );

  const confirmRemoteAnswer = useCallback(async () => {
    if (remoteState.phase !== 'ready' || remoteState.committedIndex !== null || remoteDraftIndex === null) {
      return;
    }
    // Ref-based reentrancy guard: state updates aren't applied synchronously, so a rapid
    // double-press could otherwise pass an `isCommitting` state check twice before the first
    // press's setState flushes. The ref is checked and set synchronously, before any await.
    if (committingRef.current) {
      return;
    }
    committingRef.current = true;
    setIsCommitting(true);
    setCommitError(null);

    const { questionId, optionIds } = remoteState;
    const optionId = optionIds[remoteDraftIndex];
    const result = await commitDailyAnswerRemote(questionId, optionId);

    if (result.ok) {
      // The vote itself succeeded on the server — lock it in immediately and unconditionally.
      // Distribution is fetched next as an independently-retryable step; if THAT fails, the
      // answer above stays locked exactly as committed — never reverted, never re-insertable.
      setRemoteState((previous) =>
        previous.phase === 'ready' ? { ...previous, committedIndex: remoteDraftIndex, distribution: { status: 'loading' } } : previous,
      );
      setRemoteDraftIndex(null);
      await refreshDistribution(questionId, optionIds);
    } else if (result.reason === 'insert_failed' && result.code === '23505') {
      // The database says this user already answered (race / double tap / retried request
      // after a dropped response) — reconcile to the server's existing row rather than
      // showing a generic failure. Never overwrite/delete anything; just re-fetch truth.
      const answerResult = await getDailyAnswer(questionId);
      if (answerResult.ok && answerResult.data) {
        const existingIndex = optionIds.indexOf(answerResult.data.option_id);
        setRemoteState((previous) =>
          previous.phase === 'ready'
            ? { ...previous, committedIndex: existingIndex >= 0 ? existingIndex : previous.committedIndex, distribution: { status: 'loading' } }
            : previous,
        );
        setRemoteDraftIndex(null);
        await refreshDistribution(questionId, optionIds);
      } else {
        setCommitError('That didn’t go through. Try again.');
      }
    } else {
      // Real failure: do NOT reveal, do NOT pretend it succeeded. Selection stays intact so
      // the user can just press "Lock it in" again. No insert of any kind happened here.
      setCommitError('That didn’t go through. Try again.');
    }

    committingRef.current = false;
    setIsCommitting(false);
  }, [remoteState, remoteDraftIndex, refreshDistribution]);

  const retry = useCallback(() => {
    if (isRemoteDailyEnabled) {
      void loadRemote();
    }
  }, [loadRemote]);

  const retryDistribution = useCallback(() => {
    if (remoteState.phase !== 'ready' || remoteState.committedIndex === null) {
      return;
    }
    void refreshDistribution(remoteState.questionId, remoteState.optionIds);
  }, [remoteState, refreshDistribution]);

  const remoteExperience: ConsumerDailyExperience = useMemo(() => {
    if (remoteState.phase === 'ready') {
      return {
        source: 'remote',
        phase: 'ready',
        question: remoteState.question,
        committedIndex: remoteState.committedIndex,
        distribution: remoteState.distribution,
      };
    }
    return { source: 'remote', phase: remoteState.phase, ...(remoteState.phase === 'error' ? { message: remoteState.message } : {}) } as ConsumerDailyExperience;
  }, [remoteState]);

  if (isRemoteDailyEnabled) {
    return {
      experience: remoteExperience,
      draftIndex: remoteDraftIndex,
      selectDraftOption: selectRemoteDraftOption,
      confirmAnswer: () => void confirmRemoteAnswer(),
      isCommitting,
      commitError,
      retry,
      retryDistribution,
    };
  }

  return {
    experience: localExperience,
    draftIndex: localDraftIndex,
    selectDraftOption: selectLocalDraftOption,
    confirmAnswer: confirmLocalAnswer,
    isCommitting: false,
    commitError: null,
    retry: () => {},
    retryDistribution: () => {},
  };
};
