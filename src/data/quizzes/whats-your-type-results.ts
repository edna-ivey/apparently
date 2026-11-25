import {
  ATTRACTION_ARCHETYPE_IDS,
  PARTNER_ARCHETYPE_IDS,
  WHATS_YOUR_TYPE_QUESTIONS,
  type AttractionArchetypeId,
  type PartnerArchetypeId,
} from './whats-your-type-content';
import type { DualDimensionQuizDefinition } from './types';

// "What's Your Type?" individual archetype reads and 36 paired combination reads --
// owner-supplied content, implemented verbatim. See whats-your-type-content.ts's header
// comment for the provenance note, and docs/whats-your-type-approved-copy.md for the full
// handoff record.

export type WhatsYourTypeIndividualResult = {
  id: AttractionArchetypeId | PartnerArchetypeId;
  title: string;
  hook: string;
  body: string;
  represents: string;
};

export const ATTRACTION_RESULTS: Record<AttractionArchetypeId, WhatsYourTypeIndividualResult> = {
  'walking-green-flag': {
    id: 'walking-green-flag',
    title: 'The Walking Green Flag',
    hook: 'Apparently, consistency is your kind of sexy.',
    body: "You fall for the person who means what they say and does what they promise. They're thoughtful, dependable, and emotionally present. You don't need someone to keep you guessing. You want someone who makes choosing them feel easy. Apparently, being treated right is your weakness. How scandalous.",
    represents: 'Consistency, emotional availability, dependable actions.',
  },
  'charming-menace': {
    id: 'charming-menace',
    title: 'The Charming Menace',
    hook: 'Apparently, you like a little trouble. Preferably with good teeth.',
    body: "You love someone who's confident, funny, and knows exactly how to keep you interested. The teasing, the flirting, the unexpected little moments? You're here for all of it. You don't necessarily want drama, but you do want chemistry that makes you forget what you were saying. Apparently, your type is a walking distraction. At least they're entertaining.",
    represents: 'Charisma, humor, confident flirting.',
  },
  'beautiful-mystery': {
    id: 'beautiful-mystery',
    title: 'The Beautiful Mystery',
    hook: 'Apparently, you love a little mystery. And a lot of unanswered questions.',
    body: "You notice the quiet one. The person who doesn't need to be the center of attention but somehow keeps yours. You're attracted to depth, subtle confidence, and discovering the sides of someone that not everybody gets to see. Apparently, the less they reveal, the more your curiosity starts acting like it's on payroll.",
    represents: 'Quiet confidence, intrigue, depth.',
  },
  'adventure-addiction': {
    id: 'adventure-addiction',
    title: 'The Adventure Addiction',
    hook: "Apparently, your type comes with a warning label. 'May cause spontaneous plans.'",
    body: "You're drawn to people who make an ordinary Tuesday feel like something worth remembering. They're curious, adventurous, and always finding something new to try. You want a partner who expands your world, not someone who keeps it on repeat. Apparently, your idea of romance occasionally requires comfortable shoes and a questionable itinerary.",
    represents: 'Adventure, spontaneity, novelty.',
  },
  'power-couple-material': {
    id: 'power-couple-material',
    title: 'The Power Couple Material',
    hook: 'Apparently, ambition looks good on somebody.',
    body: "You love a person with purpose. Someone who's passionate about what they're building and actually puts in the work. Confidence is attractive, but follow-through is what gets your attention. You're not looking for someone to impress everybody else. You want someone whose drive you genuinely admire. Apparently, competence is flirting now.",
    represents: 'Ambition, competence, purpose.',
  },
  'soft-spot': {
    id: 'soft-spot',
    title: 'The Soft Spot',
    hook: 'Apparently, being adored is your favorite plotline.',
    body: "You're drawn to warmth, affection, and people who make it easy to be yourself. You want someone who remembers the little things, isn't afraid to show how they feel, and makes you feel genuinely wanted. Grand gestures are nice, but emotional closeness is what wins you over. Apparently, you're a sucker for someone who actually likes you. Imagine that.",
    represents: 'Affection, tenderness, emotional closeness.',
  },
};

export const PARTNER_RESULTS: Record<PartnerArchetypeId, WhatsYourTypeIndividualResult> = {
  'thoughtful-one': {
    id: 'thoughtful-one',
    title: 'The Thoughtful One',
    hook: 'You remember the little things. All of them.',
    body: "When you like somebody, you pay attention. Their favorite snack, the story they told three weeks ago, the thing they mentioned wanting but never bought. You show affection by noticing what matters and doing something about it. Apparently, you're the reason somebody says, 'I can't believe you remembered that.' Of course you did.",
    represents: 'Remembering details, personalized gestures.',
  },
  'playful-instigator': {
    id: 'playful-instigator',
    title: 'The Playful Instigator',
    hook: 'Apparently, flirting is your favorite recreational activity.',
    body: "You bring laughter, teasing, and a little harmless trouble into romance. You want someone who can keep up with your jokes and give the energy right back. Even when things get serious, you know how to make somebody smile. Apparently, if you're roasting somebody affectionately, they should probably feel special.",
    represents: 'Humor, teasing, playful affection.',
  },
  'selectively-soft-one': {
    id: 'selectively-soft-one',
    title: 'The Selectively Soft One',
    hook: 'You have feelings. Access is restricted.',
    body: "You're not the person who falls apart in front of just anybody. You observe, take your time, and decide who deserves to see your softer side. But when you trust somebody, there's real tenderness underneath that composure. Apparently, your heart isn't closed. It just doesn't accept walk-ins.",
    represents: 'Guarded openness, trust-building, selective vulnerability.',
  },
  'wild-card': {
    id: 'wild-card',
    title: 'The Wild Card',
    hook: 'Apparently, predictable is not your love language.',
    body: "When you like somebody, you bring the unexpected. A surprise outing, a spontaneous invitation, an idea that sounded ridiculous until it became the best part of the weekend. You keep things interesting because you're genuinely excited to experience life together. Apparently, 'What are we doing tonight?' is a dangerous question to ask you.",
    represents: 'Spontaneous gestures, adventure, novelty.',
  },
  'intentional-one': {
    id: 'intentional-one',
    title: 'The Intentional One',
    hook: "You don't just say you're interested. You act like it.",
    body: "When you're interested, you show it. You make time, follow through, and put genuine effort into building something. You're not interested in playing guessing games when you could be getting to know somebody. Apparently, you have the audacity to communicate clearly and make actual plans. Somebody alert the dating apps.",
    represents: 'Clear interest, initiative, consistency, follow-through.',
  },
  'independent-romantic': {
    id: 'independent-romantic',
    title: 'The Independent Romantic',
    hook: 'You want love. You also want your own life.',
    body: "You can be deeply invested in someone without needing to do absolutely everything together. You value trust, personal space, and having interests that belong to you. Your affection is intentional, not dependent on constant attention. Apparently, you can miss somebody and still enjoy having the house to yourself.",
    represents: 'Independence, commitment, personal space.',
  },
};

export type WhatsYourTypeCombinationResult = {
  key: string;
  title: string;
  body: string;
};

const combo = (attraction: AttractionArchetypeId, partner: PartnerArchetypeId, title: string, body: string): WhatsYourTypeCombinationResult => ({
  key: `${attraction}:${partner}`,
  title,
  body,
});

export const COMBINATION_RESULTS: Record<string, WhatsYourTypeCombinationResult> = Object.fromEntries(
  [
    combo('walking-green-flag', 'thoughtful-one', 'The Soft Landing', 'You want somebody who feels like peace, and you offer that same peace right back. Apparently, your biggest relationship scandal might be healthy communication.'),
    combo('walking-green-flag', 'playful-instigator', 'The Green Flag With Jokes', "You want stability, but you're bringing the entertainment. Apparently, a peaceful relationship doesn't have to be boring. You're the reason date night never feels like a staff meeting."),
    combo('walking-green-flag', 'selectively-soft-one', 'The Security Clearance', "You want somebody emotionally available, but your own feelings have a screening process. Apparently, they're ready to get close. You're still deciding whether they deserve the Wi-Fi password."),
    combo('walking-green-flag', 'wild-card', 'The Plot Twist With Standards', 'You want consistency, but you\'re the one suggesting a spontaneous road trip at 9 p.m. Apparently, you like your relationships secure and your plans completely negotiable.'),
    combo('walking-green-flag', 'intentional-one', 'The Mutual Investment', "You want someone who shows up, and you're already making room for them in your future. Apparently, you've skipped the situationship and gone straight to infrastructure planning."),
    combo('walking-green-flag', 'independent-romantic', 'The Peaceful Escape Artist', 'You want someone who feels safe without feeling trapped. Apparently, your ideal relationship has loyalty, trust, and separate phone chargers.'),

    combo('charming-menace', 'thoughtful-one', "The Menace's Favorite Person", "You fall for charm, then show affection through thoughtful little details. Apparently, you're out here remembering their coffee order while they're remembering how to flirt."),
    combo('charming-menace', 'playful-instigator', 'Double Trouble, Respectfully', "You want somebody funny and unpredictable, and you're bringing the exact same energy. Apparently, nobody in this relationship is supervising the decisions."),
    combo('charming-menace', 'selectively-soft-one', 'The Suspiciously Soft Target', "You love a charming personality, but you're not giving away your trust for free. Apparently, they can flirt all they want. You're still checking the references."),
    combo('charming-menace', 'wild-card', 'The Chaos Collaboration', 'You like a little trouble, and you come with your own itinerary of bad ideas. Apparently, the chemistry is excellent. Adult supervision would be helpful.'),
    combo('charming-menace', 'intentional-one', 'The Responsible Bad Decision', 'You want a walking distraction, but you\'re the one showing up with actual plans and emotional maturity. Somebody has to have sense. Somehow, it\'s you.'),
    combo('charming-menace', 'independent-romantic', 'The Uncatchable Catch', 'You love a confident flirt, but you still need your space. Apparently, you want to be pursued, not tracked like a missing package.'),

    combo('beautiful-mystery', 'thoughtful-one', 'The Patient Detective', 'You notice every small detail about someone who reveals very little. Apparently, you call it being thoughtful. Your friends call it stalking.'),
    combo('beautiful-mystery', 'playful-instigator', "The Mystery's Comic Relief", 'You fall for the quiet one, then spend your time trying to make them laugh. Apparently, your favorite sound is the laugh nobody else gets to hear.'),
    combo('beautiful-mystery', 'selectively-soft-one', 'The Two Locked Diaries', "You like mysterious people, and you're not exactly an open book yourself. Apparently, this relationship could be beautiful once somebody shares a single personal detail."),
    combo('beautiful-mystery', 'wild-card', 'The Secret Adventure', "You want someone intriguing, but you bring enough spontaneity to pull them out of their shell. Apparently, you're not solving the mystery. You're taking it on vacation."),
    combo('beautiful-mystery', 'intentional-one', 'The Slow-Burn Architect', "You love discovering someone's layers, and you're willing to build something meaningful over time. Apparently, you don't need instant sparks. You want a fire that stays lit."),
    combo('beautiful-mystery', 'independent-romantic', 'The Parallel Universe', 'You like depth, privacy, and people who have their own world. Apparently, you want deep love, separate hobbies, and absolutely no need to report your every movement.'),

    combo('adventure-addiction', 'thoughtful-one', 'The Thoughtful Thrill-Seeker', 'You want the unexpected, but you remember every detail that makes an experience special. Apparently, your spontaneous adventures come with suspiciously personalized snacks.'),
    combo('adventure-addiction', 'playful-instigator', 'The Laughing Liability', "You want adventure, and you're bringing jokes to every questionable decision. Apparently, the memories will be legendary. The explanations might require a lawyer."),
    combo('adventure-addiction', 'selectively-soft-one', 'The Cautious Adrenaline Junkie', 'You crave excitement, but your heart still wants proof that it\'s safe. Apparently, you want butterflies, not a heart attack.'),
    combo('adventure-addiction', 'wild-card', 'The No-Itinerary Couple', "You want somebody who says yes to adventure, and you're already halfway out the door. Apparently, the destination is optional. The chemistry isn't."),
    combo('adventure-addiction', 'intentional-one', 'The Adventure Strategist', "You love excitement, but you know how to make it last beyond the first rush. Apparently, you're building a future with someone who keeps the present interesting."),
    combo('adventure-addiction', 'independent-romantic', 'The Two-Passport Romance', "You want freedom, adventure, and a partner who doesn't confuse independence with distance. Apparently, your love language might be 'I'll meet you there.'"),

    combo('power-couple-material', 'thoughtful-one', 'The Personal Hype Department', "You admire ambition and quietly remember everything that matters to your person. Apparently, you're the supportive partner who knows their goals, their deadlines, and their favorite victory meal."),
    combo('power-couple-material', 'playful-instigator', 'The Boardroom Comedian', 'You want somebody with big goals, but you refuse to make life one long performance review. Apparently, your contribution to the empire is keeping everybody human.'),
    combo('power-couple-material', 'selectively-soft-one', 'The Selective Investor', "You're drawn to driven people, but you're careful about who gets access to your softer side. Apparently, impressive credentials might get you an interview. They won't get you the job."),
    combo('power-couple-material', 'wild-card', 'The Empire With Detours', 'You love someone with a plan, but you bring the unexpected. Apparently, you\'re the reason the five-year vision board now includes a surprise trip to Italy.'),
    combo('power-couple-material', 'intentional-one', 'The Joint Venture', "You want ambition, and you're ready to build alongside it. Apparently, date night might accidentally turn into a quarterly planning meeting. Please order dessert."),
    combo('power-couple-material', 'independent-romantic', 'The Two-CEO Situation', 'You admire somebody with a life of their own, and you insist on keeping yours. Apparently, this relationship has two leaders, two calendars, and hopefully one shared vacation.'),

    combo('soft-spot', 'thoughtful-one', 'The Love in the Details', "You want tenderness, and you express yours through little acts that say 'I see you.' Apparently, you're both trying to out-care each other. Disgustingly wholesome."),
    combo('soft-spot', 'playful-instigator', 'The Soft Heart, Loud Laugh', "You want emotional closeness, but you bring humor into the heavy moments. Apparently, you're proof that being deeply in love doesn't require being serious every minute."),
    combo('soft-spot', 'selectively-soft-one', 'The Tender Contradiction', 'You love emotionally open people, but your own heart has a velvet rope. Apparently, you want vulnerability on the menu while you\'re still deciding whether to order.'),
    combo('soft-spot', 'wild-card', 'The Romantic Wild Card', 'You want deep affection, and you bring surprise, play, and new experiences. Apparently, your ideal love story is both a warm hug and an unexpected plane ticket.'),
    combo('soft-spot', 'intentional-one', 'The Love With Receipts', 'You want emotional connection, and you show it through consistency and effort. Apparently, your love language is following through. Imagine that.'),
    combo('soft-spot', 'independent-romantic', 'The Softly Independent', 'You want closeness without losing yourself. Apparently, you\'re perfectly capable of loving someone deeply and still wanting the entire couch to yourself.'),
  ].map((result) => [result.key, result]),
);

// The ONE shared DualDimensionQuizDefinition -- both the content-integrity validator
// (scripts/validate-whats-your-type-content.ts) and the real screen
// (src/app/quiz/whats-your-type.tsx) import this exact object, so there is no second,
// hand-duplicated copy that could drift from the real content.
export const WHATS_YOUR_TYPE_DEFINITION: DualDimensionQuizDefinition = {
  id: 'whats-your-type',
  title: "What's Your Type?",
  category: 'Love',
  access: 'free',
  eyebrow: 'FREE EXPLORE QUIZ',
  introSupport: ["Ten questions. Two sides of you. One slightly unsettling amount of accuracy."],
  meta: '10 questions · Love',
  introCta: "Let's find out →",
  questions: WHATS_YOUR_TYPE_QUESTIONS.map((q) => ({
    id: q.id,
    prompt: q.prompt,
    choices: q.choices.map((c) => ({ id: c.id, label: c.label, resultWeights: { [c.archetype]: 3 } })),
  })),
  scoringType: 'dualDimension',
  dimensionALabel: 'Attraction Type',
  dimensionBLabel: 'Partner Energy',
  dimensionAQuestionIds: WHATS_YOUR_TYPE_QUESTIONS.filter((q) => q.axis === 'attraction').map((q) => q.id),
  dimensionBQuestionIds: WHATS_YOUR_TYPE_QUESTIONS.filter((q) => q.axis === 'partnerEnergy').map((q) => q.id),
  dimensionAArchetypes: ATTRACTION_ARCHETYPE_IDS.map((id) => ({ id, title: ATTRACTION_RESULTS[id].title })),
  dimensionBArchetypes: PARTNER_ARCHETYPE_IDS.map((id) => ({ id, title: PARTNER_RESULTS[id].title })),
  combinations: Object.fromEntries(Object.entries(COMBINATION_RESULTS).map(([key, r]) => [key, { id: key, title: r.title, body: r.body }])),
};
