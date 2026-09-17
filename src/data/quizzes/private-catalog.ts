import type { PrivateQuizCategory } from './types';

// Apparently Private's LOCKED teaser catalog — breadth/curiosity metadata only, deliberately
// NOT QuizDefinitions. These titles have no questions, no scoring, no results, and never
// appear in QUIZ_REGISTRY — there is nothing here for the quiz runner to run. The point this
// sprint is to show the room's breadth and let beta testers signal what they want unlocked
// next, not to ship 14 more fully-authored quizzes. Only secretly-love (a real
// QuizDefinition, access: 'private-preview') is playable inside Apparently Private today.
export type PrivateCatalogEntry = {
  id: string;
  category: PrivateQuizCategory;
  title: string;
};

export const PRIVATE_LOCKED_CATALOG: PrivateCatalogEntry[] = [
  { id: 'love-soulmates-destined', category: 'Love & Soulmates', title: 'What type of person are you destined to end up with?' },
  { id: 'love-soulmates-chaser', category: 'Love & Soulmates', title: 'Are you a Chaser, Avoider, Fixer, or Romantic?' },
  { id: 'career-ambition-made-for', category: 'Career & Ambition', title: 'What career were you actually made for?' },
  { id: 'career-ambition-types', category: 'Career & Ambition', title: 'Employee, Entrepreneur, Creator, or Leader?' },
  { id: 'hidden-you-personality', category: 'Hidden You', title: 'What’s your hidden personality?' },
  { id: 'hidden-you-meet-last', category: 'Hidden You', title: 'Which side of you do people meet last?' },
  { id: 'shadow-side-toxic-trait', category: 'Shadow Side', title: 'What’s your toxic trait?' },
  { id: 'shadow-side-blind-spot', category: 'Shadow Side', title: 'What’s your emotional blind spot?' },
  { id: 'good-stuff-hard-to-forget', category: 'The Good Stuff', title: 'What makes you hard to forget?' },
  { id: 'good-stuff-feel-safe', category: 'The Good Stuff', title: 'What makes people feel safe around you?' },
  { id: 'life-match-city', category: 'Life Match', title: 'What city matches your personality?' },
  { id: 'life-match-built-for', category: 'Life Match', title: 'What kind of life are you actually built for?' },
  { id: 'style-vibe-perfume', category: 'Style & Vibe', title: 'What perfume are you?' },
  { id: 'style-vibe-aesthetic', category: 'Style & Vibe', title: 'What aesthetic are you without trying?' },
];

export const PRIVATE_CATEGORIES: PrivateQuizCategory[] = [
  'Love & Soulmates',
  'Career & Ambition',
  'Hidden You',
  'Shadow Side',
  'The Good Stuff',
  'Life Match',
  'Style & Vibe',
];
