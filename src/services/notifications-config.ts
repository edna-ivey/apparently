// Shared notification types/constants -- the categories named in the task brief, plus the
// local-storage keys the permission/preferences/reminder services below all read from the
// same place rather than redefining their own.

export type NotificationCategory = 'daily_reminder' | 'friend_activity' | 'creature_evolution' | 'new_quizzes' | 'private_updates';

export const NOTIFICATION_CATEGORY_LABELS: Record<NotificationCategory, string> = {
  daily_reminder: 'Daily reminders',
  friend_activity: 'Friend activity',
  creature_evolution: 'Creature evolution',
  new_quizzes: 'New quizzes',
  private_updates: 'Private updates',
};

// Local flag for "has this device already seen the contextual pre-permission explainer and
// either accepted or declined the real system prompt" -- never re-shown automatically once
// set, regardless of the OS-level answer (the task's own "respect system-level permission
// denial" -- re-showing our OWN explainer repeatedly would itself be a form of not respecting
// a no, even though only the real OS settings screen can change the actual permission).
export const NOTIFICATION_CONTEXTUAL_PROMPT_SHOWN_KEY = 'apparently:notifications:contextual-prompt-shown';

// The single pending local Daily-reminder notification's identifier, so it can be precisely
// cancelled/rescheduled -- see daily-reminder-service.ts.
export const DAILY_REMINDER_NOTIFICATION_ID_KEY = 'apparently:notifications:daily-reminder-id';
