import type { QuizAccess } from '@/data/quizzes/types';
import type { DailyQuestionRow } from '@/services/types';

// Product access classification for the admin dashboard's Daily cards — derived ONLY from
// the Daily's own room/is_free_private_unlock columns, NEVER from the client-asserted
// TestFlight tester-access build flag (that's build/environment behavior, not product truth
// — a tester sees every Private Daily regardless of what this badge says). Public Daily =
// FREE. Private Daily = PREMIUM, unless this specific Daily's own is_free_private_unlock is
// set, in which case it's truthfully a free unlock, not a generic premium classification.
export const getDailyAccessBadge = (question: Pick<DailyQuestionRow, 'room' | 'is_free_private_unlock'>): string => {
  if (question.room === 'public') {
    return 'FREE';
  }
  return question.is_free_private_unlock ? 'FREE PRIVATE' : 'PREMIUM';
};

// Quiz product access classification — directly from the quiz definition's own `access`
// field (the same canonical value Explore/Private already merchandise off of), never
// inferred or duplicated into a second source of truth.
export const getQuizAccessBadge = (access: QuizAccess): string => {
  switch (access) {
    case 'free':
      return 'PUBLIC · FREE';
    case 'private-preview':
      return 'PRIVATE · OPEN / FREE PREVIEW';
    case 'private':
      return 'PRIVATE · PREMIUM';
    default:
      return access;
  }
};
