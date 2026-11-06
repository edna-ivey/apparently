import type { QuizPoleAwardMap } from './types';

// V2 answer-level pole calibration for 'style-vibe-intimidating'. Independently recalibrated
// from the choice wording in src/data/quizzes/style-vibe-intimidating.ts -- the authored
// traitSignals on that file are a reference input only, not copied forward. See
// docs/personality-scoring-v2-design.md.
export const STYLE_VIBE_INTIMIDATING_POLE_AWARDS: QuizPoleAwardMap = {
  q1: {
    a: {
      wording: "Little smile or nod. We're strangers, not enemies. 😂",
      awards: [{ pole: 'tactful_blunt:positive', points: 1 }],
      rationale: 'Offering a small warm gesture to strangers reflects a modestly tactful, socially easing instinct.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'I hold eye contact for a second, then go back to what I was doing.',
      awards: [{ pole: 'self_secure_reassurance:positive', points: 1 }],
      rationale: 'Comfortably holding eye contact without escalating or looking away nervously shows modest self-assurance.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: "Honestly? Probably nothing. I don't think about what my face is doing.",
      awards: [{ pole: 'self_secure_reassurance:positive', points: 1 }],
      rationale: 'Not worrying about how one is coming across reflects modest self-security more precisely than the privacy/disclosure axis, which this does not clearly fit.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: "I usually say something first if there's an opening.",
      awards: [{ pole: 'initiating_responsive:positive', points: 2 }],
      rationale: 'Habitually speaking first is clear initiating behavior, a more precise fit than the privacy/disclosure axis.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
  },
  q2: {
    a: {
      wording: 'I ask a question that gives them a chance to realize it themselves.',
      awards: [
        { pole: 'tactful_blunt:positive', points: 2 },
        { pole: 'supportive_challenging:positive', points: 1 },
      ],
      rationale: 'Using a gentle, face-saving question is clear tact, and letting the person self-correct rather than being corrected is modestly supportive, the opposite of the originally mapped challenging pole.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: "I let them finish. This isn't important enough to embarrass anybody over.",
      awards: [{ pole: 'tactful_blunt:positive', points: 1 }],
      rationale: 'Choosing not to correct someone over a low-stakes matter to spare embarrassment is modest tactfulness.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: "“That's not right.” We can skip the ceremony.",
      awards: [
        { pole: 'direct_indirect:positive', points: 2 },
        { pole: 'tactful_blunt:negative', points: 1 },
      ],
      rationale: 'Stating the correction flatly and skipping social cushioning is clear directness with modest bluntness.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: "I don't even have to say anything. Apparently my face has entered the conversation. 😭",
      awards: [],
      rationale: 'Involuntary facial expressiveness is about legibility, not a deliberate choice, and does not map cleanly to any of the defined poles.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q3: {
    a: {
      wording: "“Why would you think I'd be mad?”",
      awards: [],
      rationale: 'Surprise at being perceived as intimidating describes a reaction to others’ perception rather than a demonstrated personal behavior, so no pole is a clear fit.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: "“Okay... what did you do?” 👀",
      awards: [{ pole: 'trust_verify:negative', points: 1 }],
      rationale: 'Immediately assuming something happened rather than giving the benefit of the doubt is modest verify-first evidence, a better fit than reading social vibes.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: "I immediately wonder whether I've made it hard for them to bring me things.",
      awards: [
        { pole: 'perspective_taking_self_referencing:positive', points: 2 },
        { pole: 'accountability_defensiveness:positive', points: 1 },
      ],
      rationale: 'Actively considering one’s own impact on the other person’s comfort is clear perspective-taking, with modest self-accountability in questioning one’s own role.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: "“You should've just told me.” I don't have patience for the buildup.",
      awards: [
        { pole: 'patient_urgent:negative', points: 2 },
        { pole: 'direct_indirect:positive', points: 1 },
      ],
      rationale: 'Explicitly naming impatience with the buildup is clear urgency evidence, with a modest direct instruction attached.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
  },
  q4: {
    a: {
      wording: "I find what they did well and celebrate that. They're proud. Let them have it.",
      awards: [{ pole: 'supportive_challenging:positive', points: 2 }],
      rationale: 'Choosing to affirm and protect someone’s pride rather than critique is clear supportive behavior.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'I say something nice, but apparently my enthusiasm has a strict authenticity policy. 😂',
      awards: [{ pole: 'tactful_blunt:negative', points: 1 }],
      rationale: 'Refusing to fake more enthusiasm than genuinely felt shows a modest unwillingness to oversell tact in favor of honesty.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: "If they ask what I think, I'm going to tell them what I think.",
      awards: [
        { pole: 'tactful_blunt:negative', points: 2 },
        { pole: 'direct_indirect:positive', points: 1 },
      ],
      rationale: 'Clear commitment to honest opinion-giving is strong blunt evidence, with a modest additional lean toward directness.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: "My brain immediately notices what would make it better, even if I don't say it.",
      awards: [{ pole: 'supportive_challenging:negative', points: 1 }],
      rationale: 'A reflexive critical, evaluative eye, even when unspoken, reflects a modest challenging orientation rather than purely supportive acceptance.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
  },
  q5: {
    a: {
      wording: "Very. If I say we're good, we're good.",
      awards: [
        { pole: 'control_allowing:negative', points: 1 },
        { pole: 'vulnerable_armored:negative', points: 1 },
      ],
      rationale: 'Letting an issue drop once stated reflects modest letting-things-play-out, and masking true feelings is modest armored evidence.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'My words say we\'re fine. My face has apparently released a separate statement.',
      awards: [{ pole: 'vulnerable_armored:positive', points: 1 }],
      rationale: 'Involuntarily leaking true feelings despite trying to hide them shows limited capacity to fully armor against visible emotion.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: "Why am I pretending we're good if we're not? We're talking about it.",
      awards: [
        { pole: 'conflict_peacekeeping:positive', points: 2 },
        { pole: 'direct_indirect:positive', points: 1 },
      ],
      rationale: 'Refusing to pretend and raising the issue directly is clear conflict-forward behavior, with modest directness.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: "I can stay pleasant, but I'm definitely quieter until I've decided whether it matters.",
      awards: [{ pole: 'reflective_reactive:positive', points: 1 }],
      rationale: 'Taking time to internally process before deciding how much weight to give the annoyance reflects a modest reflective, non-impulsive response style.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
  },
  q6: {
    a: {
      wording: 'Good. Tell me why.',
      awards: [{ pole: 'self_secure_reassurance:positive', points: 2 }],
      rationale: 'Welcoming public disagreement without defensiveness is clear self-secure evidence; the response is about handling disagreement, not about independence versus collaboration, so that mapping is dropped.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'I push back. If you disagree, come with an argument.',
      awards: [
        { pole: 'supportive_challenging:negative', points: 2 },
        { pole: 'direct_indirect:positive', points: 1 },
      ],
      rationale: 'Demanding a reasoned counter-argument rather than deferring is clear challenging evidence, with a modest additional directness.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: "I'll debate it, but I'm probably smiling or joking while we do it.",
      awards: [
        { pole: 'playful_serious:positive', points: 2 },
        { pole: 'tactful_blunt:positive', points: 1 },
      ],
      rationale: 'Explicitly smiling and joking through a disagreement is clear playful evidence, with modest tact in keeping things light.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: "Depends whether they actually know what they're talking about. 👀",
      awards: [
        { pole: 'trust_verify:negative', points: 2 },
        { pole: 'supportive_challenging:negative', points: 1 },
      ],
      rationale: 'Conditioning the response on the other person’s credibility is clear verify-first evidence, with a modest evaluative, challenging stance.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
  },
  q7: {
    a: {
      wording: "Someone says, “I thought you were mean before I got to know you.”",
      awards: [],
      rationale: 'This describes other people’s first impressions of the chooser rather than a demonstrated choice or behavior, so no pole clearly applies.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'People ask for my opinion and then immediately start explaining themselves. 😂',
      awards: [{ pole: 'supportive_challenging:negative', points: 1 }],
      rationale: 'Having a reputation for opinions that prompt others to justify themselves modestly suggests an evaluative, challenging presence.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Somebody tells me later they were nervous to bring something to me.',
      awards: [],
      rationale: 'This describes others’ reported perception of the chooser rather than a specific behavior the chooser enacts, so no pole clearly applies.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'People I barely know start telling me their entire life story.',
      awards: [{ pole: 'private_open:negative', points: 2 }],
      rationale: 'Being someone strangers readily open up to reflects an approachable, open presentation that invites disclosure.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
  },
  q8: {
    a: {
      wording: "“It's fine. Just fix it.” And I genuinely move on.",
      awards: [
        { pole: 'forgiving_receipts:positive', points: 2 },
        { pole: 'repair_punishing:positive', points: 1 },
      ],
      rationale: 'Genuinely moving on without holding the mistake against them is clear forgiving evidence, with a modest repair-oriented focus on just fixing it.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: "I want to know how it happened so it doesn't happen again.",
      awards: [{ pole: 'trust_verify:negative', points: 1 }],
      rationale: 'Wanting to understand the root cause before moving on reflects a modest verify-first, fact-checking orientation.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: "I'm irritated, and they're probably going to know I'm irritated.",
      awards: [
        { pole: 'direct_indirect:positive', points: 2 },
        { pole: 'repair_punishing:negative', points: 1 },
      ],
      rationale: 'Visibly showing irritation rather than masking it is clear directness, with a modest punishing lean in letting the other person feel it.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: "I joke about it unless it keeps happening. Then we're having a different conversation.",
      awards: [
        { pole: 'playful_serious:positive', points: 1 },
        { pole: 'boundary_holding_approval_seeking:positive', points: 1 },
      ],
      rationale: 'Defusing a single mistake with humor is modest playful evidence, and naming a clear threshold for escalation is modest boundary-holding evidence.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
  },
  q9: {
    a: {
      wording: 'I probably looked skeptical. 😭',
      awards: [{ pole: 'social_attunement:positive', points: 1 }],
      rationale: 'Noticing how one’s own skeptical expression likely drove the other person’s reaction reflects modest attunement to social dynamics.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: "They know I'm going to ask questions if something doesn't add up.",
      awards: [{ pole: 'trust_verify:negative', points: 2 }],
      rationale: 'Having a reputation for probing inconsistencies is clear verify-first, fact-checking evidence.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: "I usually try to rescue them. “You're good. I get what you mean.”",
      awards: [
        { pole: 'supportive_challenging:positive', points: 2 },
        { pole: 'tactful_blunt:positive', points: 1 },
      ],
      rationale: 'Actively stepping in to rescue someone from discomfort is clear supportive behavior, with a modest tactful softening.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: "Maybe they're nervous. People occasionally get weird around me.",
      awards: [{ pole: 'self_secure_reassurance:positive', points: 1 }],
      rationale: 'Attributing others’ nervousness externally rather than to self-doubt is modest evidence of a secure self-image.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q10: {
    a: {
      wording: "“I know. I don't mean to be, but I've heard that my whole life.”",
      awards: [],
      rationale: 'Resigned acceptance of a lifelong label, without further detail about actual behavior, does not clearly demonstrate any specific pole.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: "“Intimidated by WHAT?!” 😂",
      awards: [{ pole: 'self_secure_reassurance:positive', points: 1 }],
      rationale: 'Genuine surprise at being seen as intimidating reflects a modestly secure self-image unclouded by self-doubt.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: "“They're probably not intimidated. They just know I'm paying attention.”",
      awards: [{ pole: 'trust_verify:negative', points: 1 }],
      rationale: 'Reframing others’ caution as a response to one’s own scrutiny reflects a modest verify-first, detail-oriented self-concept.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: "“Okay. But do you ever feel like you can't tell me something?”",
      awards: [{ pole: 'perspective_taking_self_referencing:positive', points: 2 }],
      rationale: 'Turning the conversation to genuinely check the other person’s comfort and openness is clear perspective-taking evidence.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
  },
};
