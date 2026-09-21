import type { PrivateQuizCategory } from './types';

// Apparently Private's LOCKED teaser catalog — breadth/curiosity metadata only, deliberately
// NOT QuizDefinitions. These titles+subtitles have no questions, no scoring, no results, and
// never appear in QUIZ_REGISTRY — there is nothing here for the quiz runner to run, nothing
// that can create quiz_results, nothing that affects You or completion counts, nothing
// shareable. Only keep-you-around and be-so-serious (real QuizDefinitions, access:
// 'private-preview') are playable inside Apparently Private today. Approved catalog content,
// transcribed exactly as given — do not rewrite/shorten/polish.
export type PrivateCatalogEntry = {
  id: string;
  category: PrivateQuizCategory;
  title: string;
  subtitle: string;
};

export const PRIVATE_LOCKED_CATALOG: PrivateCatalogEntry[] = [
  // LOVE & SOULMATES
  {
    id: 'love-soulmates-ready',
    category: 'Love & Soulmates',
    title: 'Are you actually ready for love?',
    subtitle: 'Wanting a relationship and being ready for one are not the same thing.',
  },
  {
    id: 'love-soulmates-become',
    category: 'Love & Soulmates',
    title: 'What do you become when you really like somebody?',
    subtitle: 'Cool and normal? Sure. Let’s check.',
  },
  {
    id: 'love-soulmates-really-care',
    category: 'Love & Soulmates',
    title: 'What happens when you really care?',
    subtitle: 'Your best qualities get louder. So do the weird ones.',
  },
  {
    id: 'love-soulmates-locked-in',
    category: 'Love & Soulmates',
    title: 'Are you in love... or just locked in?',
    subtitle: 'Chemistry can be loud. Compatibility has receipts.',
  },
  // CAREER & AMBITION
  {
    id: 'career-ambition-how-bad',
    category: 'Career & Ambition',
    title: 'How bad do you actually want it?',
    subtitle: 'Everybody wants the life. Fewer people want the Tuesday.',
  },
  {
    id: 'career-ambition-proving',
    category: 'Career & Ambition',
    title: 'Are you ambitious... or proving something?',
    subtitle: 'Success hits different when it has an audience.',
  },
  {
    id: 'career-ambition-boss',
    category: 'Career & Ambition',
    title: 'What kind of boss would you actually be?',
    subtitle: 'Power has a way of introducing you to yourself.',
  },
  {
    id: 'career-ambition-bet',
    category: 'Career & Ambition',
    title: 'Would you bet on yourself?',
    subtitle: 'Confidence is cute. Risk is where we find out.',
  },
  // HIDDEN YOU
  {
    id: 'hidden-you-hide',
    category: 'Hidden You',
    title: 'What do you hide even from people who know you?',
    subtitle: 'Not your secrets. The part of you you edit.',
  },
  {
    id: 'hidden-you-wrong',
    category: 'Hidden You',
    title: 'What do people keep getting wrong about you?',
    subtitle: 'Your reputation and your reality may not be dating.',
  },
  {
    id: 'hidden-you-nobody-needs',
    category: 'Hidden You',
    title: 'Who are you when nobody needs anything from you?',
    subtitle: 'No role. No performance. Just you.',
  },
  {
    id: 'hidden-you-feel-safe',
    category: 'Hidden You',
    title: 'What version of you comes out when you feel safe?',
    subtitle: 'Apparently, comfort has a personality.',
  },
  // SHADOW SIDE — "Be So Serious Right Now." is the playable entry for this category; these
  // are additional FUTURE entries, never duplicating it.
  {
    id: 'shadow-side-not-your-way',
    category: 'Shadow Side',
    title: 'What do you do when you don’t get your way?',
    subtitle: 'Because disappointment has a personality.',
  },
  {
    id: 'shadow-side-fight',
    category: 'Shadow Side',
    title: 'How do you fight when you actually care?',
    subtitle: 'Conflict reveals things good lighting cannot.',
  },
  {
    id: 'shadow-side-hypocrisy',
    category: 'Shadow Side',
    title: 'What are you doing that you swear you hate?',
    subtitle: 'The hypocrisy audit has entered the chat.',
  },
  // THE GOOD STUFF — "So why do people keep you around?" is the playable entry for this
  // category; these are additional FUTURE entries, never duplicating it.
  {
    id: 'good-stuff-trust',
    category: 'The Good Stuff',
    title: 'What do people trust you with?',
    subtitle: 'Everybody has a role in the group chat. Yours says a lot.',
  },
  {
    id: 'good-stuff-unforgettable',
    category: 'The Good Stuff',
    title: 'What makes you unforgettable?',
    subtitle: 'Not impressive. Not perfect. Unforgettable.',
  },
  {
    id: 'good-stuff-easier',
    category: 'The Good Stuff',
    title: 'What do you make easier just by being there?',
    subtitle: 'Some people change the room without trying.',
  },
  // LIFE MATCH
  {
    id: 'life-match-dream-life',
    category: 'Life Match',
    title: 'Would your dream life actually fit you?',
    subtitle: 'Wanting it and liking the day-to-day are different things.',
  },
  {
    id: 'life-match-thrive',
    category: 'Life Match',
    title: 'Where would you actually thrive?',
    subtitle: 'Not where looks good. Where you’d feel like yourself.',
  },
  {
    id: 'life-match-freedom',
    category: 'Life Match',
    title: 'How much freedom do you really need?',
    subtitle: 'Structure sounds great until somebody tells you what time to be there.',
  },
  {
    id: 'life-match-miserable',
    category: 'Life Match',
    title: 'What kind of life would quietly make you miserable?',
    subtitle: 'Some beautiful lives are absolutely not yours.',
  },
  // STYLE & VIBE
  {
    id: 'style-vibe-say',
    category: 'Style & Vibe',
    title: 'What does your vibe say before you do?',
    subtitle: 'People meet your energy before they meet your résumé.',
  },
  {
    id: 'style-vibe-intimidating',
    category: 'Style & Vibe',
    title: 'Are you actually intimidating?',
    subtitle: 'Maybe they’re scared. Maybe you’re just quiet.',
  },
  {
    id: 'style-vibe-attention',
    category: 'Style & Vibe',
    title: 'What kind of attention do you attract?',
    subtitle: 'The room is reading you too.',
  },
  {
    id: 'style-vibe-assume',
    category: 'Style & Vibe',
    title: 'What do people assume about you on sight?',
    subtitle: 'First impressions are rude. Also interesting.',
  },
  // PRIVATE PRIVATE. 😈 — the future sex/intimacy category. The user-facing category label is
  // exactly "Private Private. 😈" (never "Sex & Intimacy") — see PRIVATE_CATEGORIES below.
  {
    id: 'private-private-good-in-bed',
    category: 'Private Private. 😈',
    title: 'So... are you actually good in bed?',
    subtitle: 'Confidence is one thing. Being good at this is another.',
  },
  {
    id: 'private-private-door-closes',
    category: 'Private Private. 😈',
    title: 'What do you actually want when the door closes?',
    subtitle: 'Not what sounds sexy. What actually works for you.',
  },
  {
    id: 'private-private-proof',
    category: 'Private Private. 😈',
    title: 'Do you want sex... or proof?',
    subtitle: 'Sometimes desire is desire. Sometimes it wants reassurance.',
  },
  {
    id: 'private-private-trouble',
    category: 'Private Private. 😈',
    title: 'How much trouble are you after dark?',
    subtitle: 'Sweet in public tells us almost nothing. 😈',
  },
];

export const PRIVATE_CATEGORIES: PrivateQuizCategory[] = [
  'Love & Soulmates',
  'Career & Ambition',
  'Hidden You',
  'Shadow Side',
  'The Good Stuff',
  'Life Match',
  'Style & Vibe',
  'Private Private. 😈',
];
