import type { DailyOptionRow } from '@/services/types';

// Client-side mirror of the completeness gate enforced server-side inside
// admin_approve_daily() (supabase/migrations/20260913220000_admin_control_room.sql) — lets
// the Review Studio show the same issue list and disable Approve immediately, without
// waiting on a round trip. The DATABASE remains the real authority: this exists purely for
// UX, never as a substitute for the server check.

const PLACEHOLDER_OPTION_LABEL = /^Option [A-D]$/;

export const getAdminCompletenessIssues = (
  prompt: string,
  category: string,
  options: DailyOptionRow[],
): string[] => {
  const issues: string[] = [];

  if (!prompt.trim() || prompt.trim() === 'Untitled question') {
    issues.push('Question wording is missing.');
  }
  if (!category.trim()) {
    issues.push('Category is missing.');
  }
  if (options.length !== 4) {
    issues.push(`Expected 4 answer choices, found ${options.length}.`);
  }

  options.forEach((option, index) => {
    const letter = String.fromCharCode(65 + index);
    if (!option.label.trim() || PLACEHOLDER_OPTION_LABEL.test(option.label.trim())) {
      issues.push(`Answer ${letter} wording is missing.`);
    }
    if (!option.personality_effects || option.personality_effects.length === 0) {
      issues.push(`Answer ${letter} has no personality signal assigned.`);
    }
    if (!option.apparently_feedback || !option.apparently_feedback.trim()) {
      issues.push(`Answer ${letter} has no Apparently response assigned.`);
    }
  });

  return issues;
};
