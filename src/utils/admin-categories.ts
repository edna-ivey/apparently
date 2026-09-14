// Daily's category field has always been free-text (public.daily_questions.category is a
// plain `text` column, and the local prototype's seed data used ad-hoc values like
// "Friendship"/"Social"/"Love"/"Work"/"Routine" with no enforced taxonomy). Quizzes have
// their own separate, already-established QuizCategory enum (src/data/quizzes/types.ts) —
// a different content type with different values; reusing it here would conflate two
// unrelated taxonomies. Since no formal Daily-specific category list exists anywhere in the
// repo, this is a new one, used only to power the Review Studio's category picker — it does
// not constrain what the database will accept (an "Other" custom entry is still just text).
export const DAILY_CATEGORIES = [
  'Everyday',
  'Relationships',
  'Social',
  'Work',
  'Money',
  'Food',
  'Family',
  'Dating',
  'Personality',
  'Other',
] as const;
