import type { DailyStatusRemote } from '@/services/types';

// Client-side mirror of STATUS_TRANSITIONS in src/data/daily-questions.ts, for gating which
// buttons the Admin UI shows. The DATABASE is the real authority (every admin_* lifecycle
// RPC re-checks the current status itself before acting) — this exists only so the UI
// doesn't offer a button the server would refuse anyway.
const STATUS_TRANSITIONS: Record<DailyStatusRemote, DailyStatusRemote[]> = {
  Idea: ['Draft'],
  Draft: ['ReadyForReview', 'Rejected'],
  ReadyForReview: ['Approved', 'NeedsRevision', 'Rejected'],
  NeedsRevision: ['Draft', 'ReadyForReview'],
  Approved: ['Scheduled', 'NeedsRevision'],
  Scheduled: ['Live', 'NeedsRevision', 'Approved'],
  Live: ['Archived'],
  Rejected: ['Draft'],
  Archived: [],
};

export const canTransitionAdminStatus = (from: DailyStatusRemote, to: DailyStatusRemote): boolean => {
  if (from === to) {
    return false;
  }
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
};

const DELETABLE_STATUSES = new Set<DailyStatusRemote>(['Idea', 'Draft', 'ReadyForReview', 'NeedsRevision', 'Rejected']);

export const canDeleteAdminDaily = (status: DailyStatusRemote): boolean => DELETABLE_STATUSES.has(status);

export const DAILY_STATUS_LABELS: Record<DailyStatusRemote, string> = {
  Idea: 'Idea',
  Draft: 'Draft',
  ReadyForReview: 'Ready for review',
  Approved: 'Approved',
  Scheduled: 'Scheduled',
  Live: 'Live',
  Rejected: 'Rejected',
  Archived: 'Archived',
  NeedsRevision: 'Needs revision',
};
