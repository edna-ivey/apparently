import type { PersonalityPoleId } from '@/data/personality-v2/pole-ids';

// "What's Your Type?" -- Free Explore quiz, owner-supplied content handoff (Build 16).
//
// PROVENANCE, stated plainly and accurately: this content was supplied directly by the
// product owner in the Build 16 implementation conversation, as the literal text to
// implement -- not independently verified by Claude against any video recording, screenshot,
// or external attachment (no such files were accessible in this environment; the owner's own
// instruction was explicit that this inline text IS the implementation input, not a claim that
// matching files exist elsewhere). See docs/whats-your-type-approved-copy.md for the full
// handoff record, including the specific items flagged below as open for Build 17.
//
// Deliberately NOT a QuizDefinition (src/data/quizzes/types.ts) -- this quiz has its own
// two-independent-archetype-dimension shape (DualDimensionQuizDefinition, scoring.ts), kept
// standalone precisely so the existing 21 QuizDefinition-shaped quizzes and the shared
// scoring.ts functions that pattern-match over that union are never touched. See
// src/app/quiz/whats-your-type.tsx (a dedicated static route, not the [quizId] dynamic route)
// for the rendering side of that same isolation.

export type AttractionArchetypeId =
  | 'walking-green-flag'
  | 'charming-menace'
  | 'beautiful-mystery'
  | 'adventure-addiction'
  | 'power-couple-material'
  | 'soft-spot';

export type PartnerArchetypeId =
  | 'thoughtful-one'
  | 'playful-instigator'
  | 'selectively-soft-one'
  | 'wild-card'
  | 'intentional-one'
  | 'independent-romantic';

export const ATTRACTION_ARCHETYPE_IDS: readonly AttractionArchetypeId[] = [
  'walking-green-flag',
  'charming-menace',
  'beautiful-mystery',
  'adventure-addiction',
  'power-couple-material',
  'soft-spot',
];

export const PARTNER_ARCHETYPE_IDS: readonly PartnerArchetypeId[] = [
  'thoughtful-one',
  'playful-instigator',
  'selectively-soft-one',
  'wild-card',
  'intentional-one',
  'independent-romantic',
];

export type CoreAward = { pole: PersonalityPoleId; points: 1 | 2 | 3 };

export type WhatsYourTypeChoice = {
  id: 'a' | 'b' | 'c' | 'd' | 'e' | 'f';
  label: string;
  archetype: AttractionArchetypeId | PartnerArchetypeId;
  // Empty for every Q1-5 (Attraction) choice -- "never infer personality from traits someone
  // wants in a partner" applies by construction, not by omission. For Q6-10 (Partner Energy,
  // about the respondent's OWN behavior), populated only where independently judged
  // defensible against the real Scoring V2 pole standard -- the supplied "provisional Core
  // evidence" column was a starting point, not a mandate; see the implementation log in
  // docs/whats-your-type-approved-copy.md for every place this diverged from that column
  // (an explicitly flagged "unverified"/"no reliable evidence" entry, or Q9's "A" choice,
  // judged out for the same reason Q1-5 carries no Core evidence at all -- it describes a
  // hoped-for PARTNER behavior, not the respondent's own).
  coreAwards: CoreAward[];
};

export type WhatsYourTypeQuestion = {
  id: string;
  axis: 'attraction' | 'partnerEnergy';
  prompt: string;
  choices: WhatsYourTypeChoice[];
};

export const WHATS_YOUR_TYPE_QUESTIONS: WhatsYourTypeQuestion[] = [
  {
    id: 'q1',
    axis: 'attraction',
    prompt: "You're at a party. Six people catch your attention. Who's getting a second look?",
    choices: [
      { id: 'a', label: 'The one who looks expensive and acts like they know it.', archetype: 'power-couple-material', coreAwards: [] },
      { id: 'b', label: 'The one making everybody laugh, including people who came with somebody else.', archetype: 'charming-menace', coreAwards: [] },
      { id: 'c', label: "The quiet one in the corner who looks like they know everybody's secrets.", archetype: 'beautiful-mystery', coreAwards: [] },
      { id: 'd', label: 'The one who just suggested everybody leave and go somewhere completely random.', archetype: 'adventure-addiction', coreAwards: [] },
      { id: 'e', label: 'The one checking that everybody got home safely. Annoyingly attractive.', archetype: 'walking-green-flag', coreAwards: [] },
      { id: 'f', label: "The one who looks at you like you're the only person in the room. Sir/Ma'am, relax. Actually, don't.", archetype: 'soft-spot', coreAwards: [] },
    ],
  },
  {
    id: 'q2',
    axis: 'attraction',
    prompt: "Your friends say somebody is NOT your type. What's making you defend them anyway?",
    choices: [
      { id: 'a', label: '"They\'re a little reckless, but I\'ve never been bored."', archetype: 'adventure-addiction', coreAwards: [] },
      { id: 'b', label: '"They might flirt with everybody, but the chemistry is CHEMISTRY."', archetype: 'charming-menace', coreAwards: [] },
      { id: 'c', label: '"They\'re clingy, but I kind of like being somebody\'s favorite person."', archetype: 'soft-spot', coreAwards: [] },
      { id: 'd', label: '"Y\'all don\'t know them like I do." (To be fair, neither do you.)', archetype: 'beautiful-mystery', coreAwards: [] },
      { id: 'e', label: '"They\'ve been consistent with me. That counts for something."', archetype: 'walking-green-flag', coreAwards: [] },
      { id: 'f', label: '"Okay, but they\'re actually trying to build something with their life."', archetype: 'power-couple-material', coreAwards: [] },
    ],
  },
  {
    id: 'q3',
    axis: 'attraction',
    prompt: 'Which red flag are you most likely to accidentally call a personality trait?',
    choices: [
      { id: 'a', label: "They're protective. Sometimes a little TOO protective.", archetype: 'walking-green-flag', coreAwards: [] },
      { id: 'b', label: "They're hilarious. Even when they should probably shut up.", archetype: 'charming-menace', coreAwards: [] },
      { id: 'c', label: "They're mysterious. Okay, maybe emotionally unavailable, but mysterious.", archetype: 'beautiful-mystery', coreAwards: [] },
      { id: 'd', label: "They're affectionate. Maybe they love-bomb a little. But the flowers are gorgeous.", archetype: 'soft-spot', coreAwards: [] },
      { id: 'e', label: "They're spontaneous. Nobody knows where we're going, including them.", archetype: 'adventure-addiction', coreAwards: [] },
      { id: 'f', label: "They're ambitious. Yes, they scheduled our date between two meetings.", archetype: 'power-couple-material', coreAwards: [] },
    ],
  },
  {
    id: 'q4',
    axis: 'attraction',
    prompt: "You're scrolling through somebody's profile. What's making you investigate further?",
    choices: [
      { id: 'a', label: 'Their comments are funnier than their actual posts.', archetype: 'charming-menace', coreAwards: [] },
      { id: 'b', label: 'They post romantic little things that make you think, "Must be nice."', archetype: 'soft-spot', coreAwards: [] },
      { id: 'c', label: "They're clearly successful, but somehow not obnoxious about it.", archetype: 'power-couple-material', coreAwards: [] },
      { id: 'd', label: 'They have about four pictures, no captions, and absolutely no explanation.', archetype: 'beautiful-mystery', coreAwards: [] },
      { id: 'e', label: 'Their friends and family clearly adore them. Suspiciously wholesome.', archetype: 'walking-green-flag', coreAwards: [] },
      { id: 'f', label: "Their pictures look like they haven't been home since 2022.", archetype: 'adventure-addiction', coreAwards: [] },
    ],
  },
  {
    id: 'q5',
    axis: 'attraction',
    prompt: 'Be serious. Which sentence could ruin your common sense?',
    choices: [
      { id: 'a', label: '"I\'ve never told anybody this before."', archetype: 'beautiful-mystery', coreAwards: [] },
      { id: 'b', label: '"Come here. I missed you."', archetype: 'soft-spot', coreAwards: [] },
      { id: 'c', label: '"I have a plan, and I want you in it."', archetype: 'power-couple-material', coreAwards: [] },
      { id: 'd', label: '"You always this difficult, or am I special?"', archetype: 'charming-menace', coreAwards: [] },
      { id: 'e', label: '"Pack a bag. I\'ll explain on the way."', archetype: 'adventure-addiction', coreAwards: [] },
      { id: 'f', label: '"I already handled it. You don\'t have to worry."', archetype: 'walking-green-flag', coreAwards: [] },
    ],
  },
  {
    id: 'q6',
    axis: 'partnerEnergy',
    prompt: "You like somebody, but they haven't texted back in six hours. What's happening?",
    choices: [
      { id: 'a', label: "Nothing. I have a life. They'll text when they text.", archetype: 'independent-romantic', coreAwards: [{ pole: 'independent_collaborative:positive', points: 3 }] },
      // Supplied as "Cautious expression, possible +1; exact pole unverified" -- left
      // unmapped rather than guessing which of several plausible poles (Verify first?
      // Reflective, a Private pole not awardable here anyway?) the source itself wasn't sure of.
      { id: 'b', label: "I've already drafted three messages and deleted all of them. I'm fine.", archetype: 'selectively-soft-one', coreAwards: [] },
      { id: 'c', label: "I send a meme. If they're alive, they'll laugh.", archetype: 'playful-instigator', coreAwards: [{ pole: 'playful_serious:positive', points: 3 }] },
      { id: 'd', label: "I text again. I want to talk, so I'm going to talk.", archetype: 'intentional-one', coreAwards: [{ pole: 'direct_indirect:positive', points: 3 }] },
      { id: 'e', label: "I'm remembering exactly what they said six hours ago and wondering if I missed something.", archetype: 'thoughtful-one', coreAwards: [{ pole: 'social_attunement:positive', points: 2 }, { pole: 'trust_verify:negative', points: 1 }] },
      { id: 'f', label: "I'm already out doing something fun. They can catch up.", archetype: 'wild-card', coreAwards: [{ pole: 'independent_collaborative:positive', points: 1 }] },
    ],
  },
  {
    id: 'q7',
    axis: 'partnerEnergy',
    prompt: "Your partner's ex is suspiciously attractive. What's your first private thought?",
    choices: [
      { id: 'a', label: '"I wonder if my partner needs reassurance that I\'m not bothered." (You are a little bothered.)', archetype: 'intentional-one', coreAwards: [{ pole: 'social_attunement:positive', points: 1 }] },
      { id: 'b', label: '"I might make one joke. Maybe seven."', archetype: 'playful-instigator', coreAwards: [{ pole: 'playful_serious:positive', points: 3 }] },
      // Archetype attribution ("Thoughtful One") is the one the owner flagged for
      // reconsideration -- kept exactly as supplied since no revised wording/attribution was
      // provided; see the implementation log.
      { id: 'c', label: '"I need to know the entire backstory. For educational purposes."', archetype: 'thoughtful-one', coreAwards: [{ pole: 'curious_decisive:positive', points: 2 }, { pole: 'trust_verify:negative', points: 1 }] },
      { id: 'd', label: '"Okay, so they have taste. Interesting."', archetype: 'independent-romantic', coreAwards: [] },
      { id: 'e', label: '"Cute. Anyway, what are WE doing this weekend?"', archetype: 'wild-card', coreAwards: [] },
      { id: 'f', label: "\"Let me not embarrass myself. We're going to observe quietly.\"", archetype: 'selectively-soft-one', coreAwards: [{ pole: 'trust_verify:negative', points: 2 }, { pole: 'social_attunement:positive', points: 1 }] },
    ],
  },
  {
    id: 'q8',
    axis: 'partnerEnergy',
    prompt: '"We need to talk." What\'s your immediate reaction?',
    choices: [
      { id: 'a', label: '"About WHAT?" I\'m already mentally reviewing the evidence.', archetype: 'selectively-soft-one', coreAwards: [{ pole: 'trust_verify:negative', points: 2 }] },
      { id: 'b', label: "\"Let's go somewhere different and talk it through. I can't do another couch interrogation.\"", archetype: 'wild-card', coreAwards: [{ pole: 'practical_idealistic:positive', points: 1 }] },
      { id: 'c', label: '"Am I in trouble, or are we pregnant?" Humor is a coping mechanism.', archetype: 'playful-instigator', coreAwards: [{ pole: 'playful_serious:positive', points: 2 }] },
      { id: 'd', label: "\"I hope this isn't about us needing to spend every waking minute together.\"", archetype: 'independent-romantic', coreAwards: [{ pole: 'independent_collaborative:positive', points: 3 }] },
      { id: 'e', label: '"Okay. When and where?" Let\'s handle it.', archetype: 'intentional-one', coreAwards: [{ pole: 'direct_indirect:positive', points: 2 }, { pole: 'practical_idealistic:positive', points: 1 }] },
      { id: 'f', label: '"I\'m already asking if they\'re okay. Wait, am I supposed to be worried about THEM or ME?"', archetype: 'thoughtful-one', coreAwards: [{ pole: 'social_attunement:positive', points: 1 }] },
    ],
  },
  {
    id: 'q9',
    axis: 'partnerEnergy',
    prompt: "Your partner wins $100,000. What's the first thing you're secretly hoping happens?",
    choices: [
      // Supplied as "Privacy preference; exact Core pole unverified" (plausibly
      // private_open:positive). Judged out: like Q1-5, this describes a hoped-for PARTNER
      // behavior ("they don't start telling everybody"), not the respondent's own -- the same
      // reason attraction questions carry no Core evidence at all.
      { id: 'a', label: "\"They don't start telling everybody our business. That money doesn't need to come with a press conference.\"", archetype: 'selectively-soft-one', coreAwards: [] },
      { id: 'b', label: '"We can finally execute some of those plans we\'ve been talking about."', archetype: 'intentional-one', coreAwards: [{ pole: 'planner_spontaneous:positive', points: 2 }] },
      { id: 'c', label: '"They remember that thing I\'ve wanted forever without me having to mention it."', archetype: 'thoughtful-one', coreAwards: [] },
      { id: 'd', label: '"I get to tease them about being rich while still stealing their fries."', archetype: 'playful-instigator', coreAwards: [{ pole: 'playful_serious:positive', points: 3 }] },
      { id: 'e', label: '"They don\'t suddenly expect me to quit my job and become their full-time sidekick."', archetype: 'independent-romantic', coreAwards: [{ pole: 'independent_collaborative:positive', points: 3 }] },
      { id: 'f', label: '"They book something ridiculous for us to experience together."', archetype: 'wild-card', coreAwards: [] },
    ],
  },
  {
    id: 'q10',
    axis: 'partnerEnergy',
    prompt: 'Which confession would you NEVER put on your dating profile?',
    choices: [
      { id: 'a', label: "I've absolutely planned a future with somebody who didn't know we were dating yet.", archetype: 'intentional-one', coreAwards: [{ pole: 'planner_spontaneous:positive', points: 1 }] },
      { id: 'b', label: 'I can love somebody deeply and still need them to leave me alone sometimes.', archetype: 'independent-romantic', coreAwards: [{ pole: 'independent_collaborative:positive', points: 3 }] },
      { id: 'c', label: "I've agreed to something wildly impulsive because the person suggesting it was fine.", archetype: 'wild-card', coreAwards: [{ pole: 'planner_spontaneous:negative', points: 2 }] },
      { id: 'd', label: "I've tested somebody's consistency without telling them they were being tested.", archetype: 'selectively-soft-one', coreAwards: [] },
      { id: 'e', label: 'Sometimes I flirt just to see if I still got it.', archetype: 'playful-instigator', coreAwards: [{ pole: 'playful_serious:positive', points: 2 }] },
      { id: 'f', label: "I remember tiny details about people I swear I don't care about.", archetype: 'thoughtful-one', coreAwards: [{ pole: 'social_attunement:positive', points: 2 }, { pole: 'sentimental_thick_skinned:positive', points: 1 }] },
    ],
  },
];

// Build 22 final cleanup (owner-authorized clean V1 reset, 2026-11-02): the old ranked/top-N
// result-level profileSignals reduction that used to live here (reduceWhatsYourTypeProfileSignals)
// is retired -- it was already dead code (computed, never sent to the server; see the Build 22
// final report). This quiz's real personality evidence comes exclusively from its own
// per-choice `coreAwards` below, seeded numerically into quiz_choice_trait_awards
// (scripts/generate-quiz-content-identity-sql.ts) and written by submit_quiz_completion on
// the selected choice alone -- the same single authoritative mechanism every other quiz uses.
