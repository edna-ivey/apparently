import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import type { PersonalityEffect } from '@/data/personality';

export type DailyStatus = 'Draft' | 'Approved' | 'Live' | 'Rejected' | 'Scheduled';

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
};

const STORAGE_KEY = 'apparently:daily-questions';

export const initialQuestions: DailyQuestion[] = [
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

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return false;
  }

  const date = new Date(`${trimmed}T00:00:00Z`);
  return !Number.isNaN(date.getTime());
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

        return {
          id: optionId,
          label: typeof option?.label === 'string' && option.label.trim() ? option.label : `Option ${index + 1}`,
          percent: Number.isFinite(option?.percent) ? Math.max(0, Number(option.percent)) : 0,
          personalityEffects: defaultOption?.personalityEffects
            ?? (Array.isArray(option?.personalityEffects) ? option.personalityEffects.slice(0, 2) : undefined),
          apparentlyFeedback: defaultOption?.apparentlyFeedback
            ?? (typeof option?.apparentlyFeedback === 'string' ? option.apparentlyFeedback : undefined),
        };
      })
    : [];

  const safeStatus: DailyStatus = question.status === 'Draft' || question.status === 'Approved' || question.status === 'Live' || question.status === 'Rejected' || question.status === 'Scheduled'
    ? question.status
    : 'Draft';

  return {
    id: typeof question.id === 'number' ? question.id : fallbackId,
    prompt: typeof question.prompt === 'string' && question.prompt.trim() ? question.prompt : 'Untitled question',
    category: typeof question.category === 'string' && question.category.trim() ? question.category : 'General',
    status: safeStatus,
    order: Number.isFinite(question.order) ? Number(question.order) : 99,
    scheduledFor: normalizeDateValue(question.scheduledFor),
    options: normalizedOptions.length > 0 ? normalizedOptions : [
      { id: 1, label: 'Option A', percent: 25 },
      { id: 2, label: 'Option B', percent: 25 },
      { id: 3, label: 'Option C', percent: 25 },
      { id: 4, label: 'Option D', percent: 25 },
    ],
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

export const approveQuestion = (id: number) => {
  const currentList = getQuestions();
  const approvedMaxOrder = Math.max(...currentList.filter((question) => question.status === 'Approved').map((question) => question.order), 0);

  const nextQuestions: DailyQuestion[] = currentList.map((question) =>
    question.id === id
      ? ({ ...question, status: 'Approved' as DailyStatus, order: approvedMaxOrder + 1, scheduledFor: null } as DailyQuestion)
      : question
  );

  setQuestions(nextQuestions);
};

export const scheduleQuestion = (id: number, date: string) => {
  const nextDate = date.trim() || null;

  const nextQuestions: DailyQuestion[] = getQuestions().map((question) =>
    question.id === id
      ? ({
          ...question,
          status: nextDate ? ('Scheduled' as DailyStatus) : ('Approved' as DailyStatus),
          scheduledFor: nextDate,
        } as DailyQuestion)
      : question
  );

  setQuestions(nextQuestions);
};

export const rejectQuestion = (id: number) => {
  const nextQuestions: DailyQuestion[] = getQuestions().map((question) =>
    question.id === id
      ? ({ ...question, status: 'Rejected' as DailyStatus, order: 99, scheduledFor: null } as DailyQuestion)
      : question
  );

  setQuestions(nextQuestions);
};

export const deleteQuestion = (id: number) => {
  const nextQuestions: DailyQuestion[] = getQuestions().filter((question) => question.id !== id);
  setQuestions(nextQuestions);
};

export const publishQuestion = (id: number) => {
  const currentList = getQuestions();
  const previousLive = currentList.find((question) => question.status === 'Live');

  const nextQuestions: DailyQuestion[] = currentList.map((question) => {
    if (question.id === id) {
      return { ...question, status: 'Live' as DailyStatus, order: 1, scheduledFor: null } as DailyQuestion;
    }

    if (previousLive && question.id === previousLive.id) {
      return { ...question, status: 'Approved' as DailyStatus, order: Math.max(question.order, 1), scheduledFor: null } as DailyQuestion;
    }

    return question;
  });

  setQuestions(nextQuestions);
};

export const validateScheduledQuestion = (id: number) => {
  const nextQuestions: DailyQuestion[] = getQuestions().map((question) =>
    question.id === id
      ? ({ ...question, status: 'Live' as DailyStatus, order: 1, scheduledFor: null } as DailyQuestion)
      : question
  );

  setQuestions(nextQuestions);
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

export const updateQuestionPrompt = (id: number, value: string) => {
  setQuestions(
    getQuestions().map((question) =>
      question.id === id ? { ...question, prompt: value } : question
    )
  );
};

export const updateQuestionOption = (id: number, optionId: number, field: 'label' | 'percent', value: string) => {
  setQuestions(
    getQuestions().map((question) =>
      question.id === id
        ? {
            ...question,
            options: question.options.map((option) =>
              option.id === optionId
                ? {
                    ...option,
                    [field]: field === 'percent' ? Math.max(0, Number(value) || 0) : value,
                  }
                : option
            ),
          }
        : question
    )
  );
};

void hydrateQuestions();
