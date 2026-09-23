import { useCallback, useEffect, useRef, useState } from 'react';

import type { ConsumerDailyOption, ConsumerDailyQuestion, DistributionState } from './consumer-daily';
import type { PersonalityEffect } from '@/data/personality';
import { isPrivateDailyTesterAccessEnabled, isRemoteDailyEnabled } from '@/lib/supabase';
import { ensureAnonymousSession } from '@/services/auth-service';
import { getDailyAnswer, getDailyDistribution, getPrivateDaily, submitPrivateDailyAnswer } from '@/services/daily-service';
import type { DailyDistributionRow, PrivateDailyOption } from '@/services/types';
import { useEffectivePremium } from '@/services/purchases-service';

// Apparently Private's Today experience — deliberately its own hook rather than folded into
// useConsumerDailyExperience(). Private has no local/prototype fallback (it's a remote-only
// concept) and a genuinely different shape (locked/free-unlock/tester access tiers instead of
// local-vs-remote source), so a parallel, additive hook keeps the existing, already-proven
// Public Daily hook completely untouched — zero risk to it from this feature.

export type PrivateDailyExperience =
  | { phase: 'loading' }
  // No Live Private question exists right now — a clean, real empty state, never hidden.
  | { phase: 'no-live-private' }
  | { phase: 'error'; message: string }
  // Server said 'locked' — no options/distribution were ever sent to this client at all.
  | { phase: 'locked'; prompt: string; category: string }
  | {
      phase: 'ready';
      access: 'free-unlock' | 'tester' | 'premium';
      question: ConsumerDailyQuestion;
      committedIndex: number | null;
      distribution: DistributionState;
    };

const toPrivateConsumerOptions = (options: PrivateDailyOption[]): ConsumerDailyOption[] =>
  [...options]
    .sort((a, b) => a.position - b.position)
    .map((option) => ({
      label: option.label,
      // personality_effects is jsonb server-side; the dimension strings are expected (by the
      // same application convention consumer-daily.ts already documents) to match real
      // PersonalityDimensionId values.
      personalityEffects: option.personalityEffects as unknown as PersonalityEffect[],
      apparentlyFeedback: option.apparentlyFeedback,
    }));

const toPercentages = (optionIds: string[], rows: DailyDistributionRow[]): number[] =>
  optionIds.map((id) => rows.find((row) => row.option_id === id)?.percent ?? 0);

const toTotalAnswers = (rows: DailyDistributionRow[]): number | null => rows[0]?.total_answers ?? null;

type InternalState =
  | { phase: 'loading' }
  | { phase: 'no-live-private' }
  | { phase: 'error'; message: string }
  | { phase: 'locked'; prompt: string; category: string }
  | {
      phase: 'ready';
      questionId: string;
      optionIds: string[];
      access: 'free-unlock' | 'tester' | 'premium';
      question: ConsumerDailyQuestion;
      committedIndex: number | null;
      distribution: DistributionState;
    };

export type UsePrivateDailyExperience = {
  experience: PrivateDailyExperience;
  draftIndex: number | null;
  selectDraftOption: (index: number) => void;
  confirmAnswer: () => void;
  isCommitting: boolean;
  commitError: string | null;
  retry: () => void;
  // No-op whenever there's nothing to retry. Re-requests ONLY the distribution — never
  // re-checks the question, never re-fetches the answer, never touches the committed answer —
  // for when `distribution.status === 'error'` on an already-answered Private Daily. Mirrors
  // consumer-daily.ts's retryDistribution exactly.
  retryDistribution: () => void;
};

export const usePrivateDailyExperience = (): UsePrivateDailyExperience => {
  const [state, setState] = useState<InternalState>({ phase: 'loading' });
  const [draftIndex, setDraftIndex] = useState<number | null>(null);
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitError, setCommitError] = useState<string | null>(null);
  const committingRef = useRef(false);
  // The real RevenueCat entitlement OR the tester-access build flag -- see
  // purchases-service.ts's useEffectivePremium. Reactive: an entitlement that becomes active
  // mid-session (a purchase completed from the paywall) flows straight into `load`'s next
  // call without requiring a manual refresh wiring here.
  const isPremium = useEffectivePremium();

  const refreshDistribution = useCallback(async (questionId: string, optionIds: string[]) => {
    setState((previous) => (previous.phase === 'ready' ? { ...previous, distribution: { status: 'loading' } } : previous));
    const result = await getDailyDistribution(questionId);
    setState((previous) => {
      if (previous.phase !== 'ready') {
        return previous;
      }
      return {
        ...previous,
        distribution: result.ok
          ? { status: 'ready', percentages: toPercentages(optionIds, result.data), totalAnswers: toTotalAnswers(result.data) }
          : { status: 'error', message: result.message },
      };
    });
  }, []);

  const load = useCallback(async () => {
    setState({ phase: 'loading' });
    setDraftIndex(null);
    setCommitError(null);

    const session = await ensureAnonymousSession();
    if (!session) {
      setState({ phase: 'error', message: 'Could not start a session.' });
      return;
    }

    // No client-asserted authorization parameter anymore — get_private_daily derives unlock
    // state entirely from server-side state (see 20260924010000_secure_entitlement_
    // authorization.sql). isPremium/isPrivateDailyTesterAccessEnabled below are used ONLY to
    // choose which already-true "why is this unlocked" label to show — never to ask the
    // server for anything, and never capable of unlocking content that the server itself
    // didn't already decide to unlock.
    const result = await getPrivateDaily();
    if (!result.ok) {
      setState({ phase: 'error', message: result.message });
      return;
    }
    if (!result.data) {
      setState({ phase: 'no-live-private' });
      return;
    }

    const row = result.data;
    if (row.access_level === 'locked' || !row.options) {
      setState({ phase: 'locked', prompt: row.prompt, category: row.category });
      return;
    }

    const sortedOptions = [...row.options].sort((a, b) => a.position - b.position);
    const optionIds = sortedOptions.map((option) => option.id);
    const question: ConsumerDailyQuestion = {
      prompt: row.prompt,
      category: row.category,
      options: toPrivateConsumerOptions(sortedOptions),
    };
    const access: 'free-unlock' | 'tester' | 'premium' = isPrivateDailyTesterAccessEnabled
      ? 'tester'
      : isPremium
        ? 'premium'
        : 'free-unlock';

    // "Unlocked" (free-unlock or tester) does NOT mean "already answered" — a free-unlock or
    // tester caller can see options before answering. Distribution must only ever be fetched
    // AFTER a real answer exists (get_daily_distribution's own server-side gate requires it
    // anyway), so this checks the same way Public's own hook does — via the existing,
    // unchanged getDailyAnswer() — rather than eagerly fetching and risking a fabricated-
    // looking 0%-everywhere "ready" distribution before any real vote exists.
    const answerResult = await getDailyAnswer(row.question_id);
    if (!answerResult.ok) {
      setState({ phase: 'error', message: answerResult.message });
      return;
    }
    if (!answerResult.data) {
      setState({ phase: 'ready', questionId: row.question_id, optionIds, access, question, committedIndex: null, distribution: { status: 'idle' } });
      return;
    }

    const existingIndex = optionIds.indexOf(answerResult.data.option_id);
    setState({
      phase: 'ready',
      questionId: row.question_id,
      optionIds,
      access,
      question,
      committedIndex: existingIndex >= 0 ? existingIndex : null,
      distribution: { status: 'loading' },
    });
    await refreshDistribution(row.question_id, optionIds);
  }, [refreshDistribution, isPremium]);

  useEffect(() => {
    // Private Daily is a remote-only concept — local prototype mode never fetches it, same
    // gating convention useConsumerDailyExperience's own remote branch already uses.
    if (isRemoteDailyEnabled) {
      void load();
    }
  }, [load]);

  const selectDraftOption = useCallback(
    (index: number) => {
      if (state.phase !== 'ready' || state.committedIndex !== null) {
        return;
      }
      setCommitError(null);
      setDraftIndex(index);
    },
    [state],
  );

  const confirmAnswer = useCallback(async () => {
    if (state.phase !== 'ready' || state.committedIndex !== null || draftIndex === null) {
      return;
    }
    if (committingRef.current) {
      return;
    }
    committingRef.current = true;
    setIsCommitting(true);
    setCommitError(null);

    const { questionId, optionIds } = state;
    const optionId = optionIds[draftIndex];
    // Same removal as get_private_daily above — submit_private_daily_answer re-derives
    // unlock state server-side; nothing client-asserted is sent.
    const result = await submitPrivateDailyAnswer(questionId, optionId);

    if (result.ok) {
      setState((previous) =>
        previous.phase === 'ready' ? { ...previous, committedIndex: draftIndex, distribution: { status: 'loading' } } : previous,
      );
      setDraftIndex(null);
      await refreshDistribution(questionId, optionIds);
    } else if (result.reason === 'insert_failed' && result.code === '23505') {
      // Already answered (race/double-tap/retry) — the option we tried IS the committed one
      // in the only realistic client flow (one draft selection per load), so reconcile to it
      // directly rather than a second read.
      setState((previous) =>
        previous.phase === 'ready' ? { ...previous, committedIndex: draftIndex, distribution: { status: 'loading' } } : previous,
      );
      setDraftIndex(null);
      await refreshDistribution(questionId, optionIds);
    } else {
      setCommitError('That didn’t go through. Try again.');
    }

    committingRef.current = false;
    setIsCommitting(false);
  }, [state, draftIndex, refreshDistribution, isPremium]);

  const retry = useCallback(() => {
    void load();
  }, [load]);

  const retryDistribution = useCallback(() => {
    if (state.phase !== 'ready' || state.committedIndex === null) {
      return;
    }
    void refreshDistribution(state.questionId, state.optionIds);
  }, [state, refreshDistribution]);

  const experience: PrivateDailyExperience =
    state.phase === 'ready'
      ? { phase: 'ready', access: state.access, question: state.question, committedIndex: state.committedIndex, distribution: state.distribution }
      : state.phase === 'locked'
        ? { phase: 'locked', prompt: state.prompt, category: state.category }
        : state.phase === 'error'
          ? { phase: 'error', message: state.message }
          : { phase: state.phase };

  return {
    experience,
    draftIndex,
    selectDraftOption,
    confirmAnswer: () => void confirmAnswer(),
    isCommitting,
    commitError,
    retry,
    retryDistribution,
  };
};
