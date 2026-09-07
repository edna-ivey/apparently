export type PersonalityDimensionId =
  | 'planner_spontaneous'
  | 'emotional_intensity'
  | 'direct_indirect'
  | 'social_attunement'
  | 'protective_hands_off'
  | 'adventure_comfort'
  | 'independent_collaborative'
  | 'control_allowing'
  | 'practical_idealistic'
  | 'sentimental_thick_skinned'
  | 'rules_bending'
  | 'conflict_peacekeeping'
  | 'trust_verify'
  | 'forgiving_receipts'
  | 'playful_serious'
  | 'competitive_cooperative'
  | 'curious_decisive'
  | 'private_open'
  | 'patient_urgent'
  | 'ambitious_content';

export type PersonalityEffectValue = -2 | -1 | 1 | 2;

export type PersonalityEffect = {
  dimension: PersonalityDimensionId;
  value: PersonalityEffectValue;
};

export type PersonalityDimension = {
  id: PersonalityDimensionId;
  name: string;
  positivePole: string;
  positiveLabel: string;
  negativePole: string;
  negativeLabel: string;
  explanation: string;
  flavor?: string;
};

export type PersonalityAnswerEvidence = {
  question: string;
  category: string;
  chosenAnswer: string;
  effects: PersonalityEffect[];
};

export type DimensionEvidence = {
  dimension: PersonalityDimensionId;
  question: string;
  category: string;
  chosenAnswer: string;
  effect: PersonalityEffectValue;
  normalized: number;
  date: string;
};

export type DimensionResult = {
  dimension: PersonalityDimensionId;
  name: string;
  positivePole: string;
  positiveLabel: string;
  negativePole: string;
  negativeLabel: string;
  explanation: string;
  normalizedScore: number;
  evidenceCount: number;
  positiveEvidenceCount: number;
  negativeEvidenceCount: number;
  categories: string[];
  uniqueCategoryCount: number;
  confidence: number;
  breadth: number;
  signatureStrength: number;
  displayPole: string;
  displayName: string;
  displayPercent: number;
  evidence: DimensionEvidence[];
};

export type SignatureTrait = {
  id: PersonalityDimensionId;
  name: string;
  displayName: string;
  percent: number;
  normalizedScore: number;
  signatureStrength: number;
  confidence: number;
  breadth: number;
  evidenceCount: number;
};

export type PersonalityProfile = {
  dimensions: DimensionResult[];
  topTraits: SignatureTrait[];
  totalEvidence: number;
  answeredCount: number;
};

export const PERSONALITY_DIMENSIONS: PersonalityDimension[] = [
  {
    id: 'planner_spontaneous',
    name: 'Planner ↔ Spontaneous',
    positivePole: 'I NEED A PLAN',
    positiveLabel: 'Planner',
    negativePole: 'PLAY IT BY EAR',
    negativeLabel: 'Spontaneous',
    explanation: 'Preference for structure, preparation, and predictability versus improvising in the moment.',
    flavor: 'Structure is a comfort blanket.',
  },
  {
    id: 'emotional_intensity',
    name: 'Emotional Intensity ↔ Even-Keeled',
    positivePole: 'BIG FEELINGS',
    positiveLabel: 'Emotionally Intense',
    negativePole: 'COOL & COLLECTED',
    negativeLabel: 'Even-Keeled',
    explanation: 'How strongly situations affect someone versus staying relatively steady and measured.',
    flavor: 'Feelings are not a bug; they are a signal.',
  },
  {
    id: 'direct_indirect',
    name: 'Direct ↔ Indirect',
    positivePole: 'SAY IT WITH YOUR CHEST',
    positiveLabel: 'Direct',
    negativePole: 'READ THE ROOM',
    negativeLabel: 'Indirect',
    explanation: 'Saying what you mean plainly versus communicating through hints, softening, or implication.',
    flavor: 'Some people prefer the truth in a clean line.',
  },
  {
    id: 'social_attunement',
    name: 'Social Radar ↔ Face Value',
    positivePole: 'VIBE CHECKER',
    positiveLabel: 'Vibe checker',
    negativePole: 'TAKES IT AT FACE VALUE',
    negativeLabel: 'Face value',
    explanation: 'Attention to tone, body language, subtext, and social energy versus taking situations at face value.',
    flavor: 'You can feel the room before it says anything.',
  },
  {
    id: 'protective_hands_off',
    name: 'Protective ↔ Hands-Off',
    positivePole: "DON'T PLAY WITH MINE",
    positiveLabel: 'Protective',
    negativePole: 'THEY GROWN',
    negativeLabel: 'Hands-off',
    explanation: 'Tendency to step in, warn, or defend people someone cares about versus letting others handle their own business.',
    flavor: 'This person treats caring like a job description.',
  },
  {
    id: 'adventure_comfort',
    name: 'Adventurous ↔ Comfort-Seeking',
    positivePole: "LET'S GO",
    positiveLabel: 'Adventurous',
    negativePole: "I'M GOOD HERE",
    negativeLabel: 'Comfort-seeking',
    explanation: 'Willingness to try something new and take risk versus preferring familiarity and ease.',
    flavor: 'Some people want the route, not the surprise.',
  },
  {
    id: 'independent_collaborative',
    name: 'Independent ↔ Collaborative',
    positivePole: 'I GOT IT',
    positiveLabel: 'Independent',
    negativePole: "LET'S DO THIS TOGETHER",
    negativeLabel: 'Collaborative',
    explanation: 'Preference for handling things solo versus involving others and making decisions together.',
    flavor: 'Some people believe in solo missions; some believe in a group chat.',
  },
  {
    id: 'control_allowing',
    name: 'Control ↔ Let It Play Out',
    positivePole: 'LET ME HANDLE IT',
    positiveLabel: 'Control',
    negativePole: 'LET IT RIDE',
    negativeLabel: 'Let it play out',
    explanation: 'Desire to influence outcomes, solve problems, and take charge versus tolerating uncertainty.',
    flavor: 'Not controlling. Just the opposite of being surprised by the outcome.',
  },
  {
    id: 'practical_idealistic',
    name: 'Practical ↔ Idealistic',
    positivePole: 'BE FOR REAL',
    positiveLabel: 'Practical',
    negativePole: 'BUT WHAT IF...',
    negativeLabel: 'Idealistic',
    explanation: 'Preference for workable outcomes and reality versus possibility, meaning, and imagination.',
    flavor: 'Some people play the long game; some people play the story.',
  },
  {
    id: 'sentimental_thick_skinned',
    name: 'Sentimental ↔ Thick-Skinned',
    positivePole: 'SOFTIE',
    positiveLabel: 'Sentimental',
    negativePole: 'BUILT DIFFERENT',
    negativeLabel: 'Thick-skinned',
    explanation: 'How much little things, nostalgia, and tenderness matter versus staying emotionally steady and less affected.',
    flavor: 'Some people keep a memory box in their chest.',
  },
  {
    id: 'rules_bending',
    name: 'Rule-Oriented ↔ Rule-Bending',
    positivePole: 'BY THE BOOK',
    positiveLabel: 'Rule-oriented',
    negativePole: "WHO GON' CHECK ME?",
    negativeLabel: 'Rule-bending',
    explanation: 'Preference for established rules and consistency versus evaluating the situation and bending rules when the context changes.',
    flavor: 'Some people are loyal to the system. Others are loyal to the moment.',
  },
  {
    id: 'conflict_peacekeeping',
    name: 'Conflict-Forward ↔ Peacekeeping',
    positivePole: 'SAY IT NOW',
    positiveLabel: 'Conflict-forward',
    negativePole: 'KEEP THE PEACE',
    negativeLabel: 'Peacekeeping',
    explanation: 'Willingness to directly address tension versus preserving harmony and minimizing escalation.',
    flavor: 'Conflict can be a flashlight or a fire.',
  },
  {
    id: 'trust_verify',
    name: 'Trusting ↔ Skeptical',
    positivePole: 'BENEFIT OF THE DOUBT',
    positiveLabel: 'Trust first',
    negativePole: 'SHOW ME THE RECEIPTS',
    negativeLabel: 'Verify first',
    explanation: 'Default willingness to trust people versus wanting evidence and consistency before deciding.',
    flavor: 'Some people trust the story. Others trust the paperwork.',
  },
  {
    id: 'forgiving_receipts',
    name: 'Forgiving ↔ Holds the Receipt',
    positivePole: 'LET IT GO',
    positiveLabel: 'Forgiving',
    negativePole: 'I REMEMBER EVERYTHING',
    negativeLabel: 'Holds the Receipt',
    explanation: 'How readily past hurt becomes less relevant versus how strongly previous behavior affects future decisions.',
    flavor: 'Not every person is a ledger, but some absolutely track it.',
  },
  {
    id: 'playful_serious',
    name: 'Playful ↔ Serious',
    positivePole: 'JOKESTER',
    positiveLabel: 'Playful',
    negativePole: 'BE SERIOUS PLEASE',
    negativeLabel: 'Serious',
    explanation: 'Use of humor and silliness versus preferring serious, direct, and sober interaction.',
    flavor: 'Some people make the room lighter without even trying.',
  },
  {
    id: 'competitive_cooperative',
    name: 'Competitive ↔ Cooperative',
    positivePole: 'I CAME TO WIN',
    positiveLabel: 'Competitive',
    negativePole: 'EVERYBODY EATS',
    negativeLabel: 'Cooperative',
    explanation: 'Motivation from winning and comparison versus shared success and cooperation.',
    flavor: 'Some people see a scoreboard; others see a table.',
  },
  {
    id: 'curious_decisive',
    name: 'Curious ↔ Decisive',
    positivePole: 'RABBIT HOLE',
    positiveLabel: 'Curious',
    negativePole: "I'VE HEARD ENOUGH",
    negativeLabel: 'Decisive',
    explanation: 'Desire to explore, ask why, and research alternatives versus deciding and moving forward.',
    flavor: 'This is the difference between asking five questions and making the call.',
  },
  {
    id: 'private_open',
    name: 'Private ↔ Open',
    positivePole: 'KEEP IT CUTE & PRIVATE',
    positiveLabel: 'Private',
    negativePole: 'WHOLE STORY, NO FILTER',
    negativeLabel: 'Open',
    explanation: 'Willingness to share thoughts, feelings, and personal information versus keeping things closer to the chest.',
    flavor: 'Some people are a diary. Others are a locked journal.',
  },
  {
    id: 'patient_urgent',
    name: 'Patient ↔ Urgent',
    positivePole: 'I CAN WAIT',
    positiveLabel: 'Patient',
    negativePole: 'WHY IS THIS TAKING SO LONG?',
    negativeLabel: 'Urgent',
    explanation: 'Tolerance for delay and ambiguity versus feeling pressure to act immediately.',
    flavor: 'Some people can wait. Others hear a clock in the room.',
  },
  {
    id: 'ambitious_content',
    name: 'Ambitious ↔ Content',
    positivePole: "WHAT'S NEXT?",
    positiveLabel: 'Ambitious',
    negativePole: "I'M GOOD RIGHT HERE",
    negativeLabel: 'Content',
    explanation: 'Drive toward growth, achievement, and the next big thing versus satisfaction with stability and current circumstances.',
    flavor: 'Not everyone needs a new mountain. Some just need a good couch and a calm night.',
  },
];

const dimensionMap = new Map(PERSONALITY_DIMENSIONS.map((dimension) => [dimension.id, dimension]));

const normalizeEffect = (value: PersonalityEffectValue): number => {
  if (value === -2) return -1;
  if (value === -1) return -0.5;
  if (value === 1) return 0.5;
  return 1;
};

export const getDimensionConfig = (dimensionId: PersonalityDimensionId) => {
  const dimension = dimensionMap.get(dimensionId);
  if (!dimension) {
    throw new Error(`Unknown personality dimension: ${dimensionId}`);
  }

  return dimension;
};

// Translates a single signed personality effect into the editorial label a human
// reviewer actually reads — e.g. { dimension: 'protective_hands_off', value: -2 } becomes
// "Hands-off +2", not "Protective -2". A positive value points at the dimension's
// positiveLabel pole, a negative value points at its negativeLabel pole; the magnitude is
// always shown as a plain positive number since the label itself already carries the
// direction. This is the single source of truth for human-readable effect labels — do not
// build a second/parallel label mapping elsewhere.
export const getEffectLabel = (effect: PersonalityEffect): string => {
  const dimension = getDimensionConfig(effect.dimension);
  const magnitude = Math.abs(effect.value);
  const label = effect.value > 0 ? dimension.positiveLabel : dimension.negativeLabel;
  return `${label} +${magnitude}`;
};

export const calculateConfidence = (evidenceCount: number) => {
  return Math.min(1, 1 - Math.exp(-evidenceCount / 8));
};

export const calculateBreadth = (categories: string[]) => {
  return Math.min(1, new Set(categories).size / 5);
};

export const calculateSignatureStrength = (normalizedScore: number, confidence: number, breadth: number) => {
  const intensity = Math.abs(normalizedScore);
  const breadthFactor = 0.75 + (0.25 * breadth);
  return intensity * confidence * breadthFactor;
};

export const getDisplayedPole = (normalizedScore: number, dimension: PersonalityDimension) => {
  if (normalizedScore >= 0) {
    return {
      label: dimension.positivePole,
      name: dimension.positiveLabel,
      value: Math.round(((normalizedScore + 1) / 2) * 100),
    };
  }

  return {
    label: dimension.negativePole,
    name: dimension.negativeLabel,
    value: Math.round(((1 - ((normalizedScore + 1) / 2)) * 100)),
  };
};

export const scorePersonalityProfile = (answers: PersonalityAnswerEvidence[]): PersonalityProfile => {
  const dimensionValues = new Map<PersonalityDimensionId, { values: number[]; categories: Set<string>; evidence: DimensionEvidence[] }>();

  answers.forEach((answer) => {
    answer.effects.forEach((effect) => {
      const entry = dimensionValues.get(effect.dimension) ?? { values: [], categories: new Set<string>(), evidence: [] };
      const normalized = normalizeEffect(effect.value);
      entry.values.push(normalized);
      entry.categories.add(answer.category);
      entry.evidence.push({
        dimension: effect.dimension,
        question: answer.question,
        category: answer.category,
        chosenAnswer: answer.chosenAnswer,
        effect: effect.value,
        normalized,
        date: new Date().toISOString(),
      });
      dimensionValues.set(effect.dimension, entry);
    });
  });

  const dimensions: DimensionResult[] = PERSONALITY_DIMENSIONS.map((dimension) => {
    const entry = dimensionValues.get(dimension.id) ?? { values: [], categories: new Set<string>(), evidence: [] };
    const average = entry.values.length > 0
      ? entry.values.reduce((sum, value) => sum + value, 0) / entry.values.length
      : 0;
    const evidenceCount = entry.evidence.length;
    const positiveEvidenceCount = entry.evidence.filter((item) => item.effect > 0).length;
    const negativeEvidenceCount = entry.evidence.filter((item) => item.effect < 0).length;
    const categories = Array.from(entry.categories);
    const confidence = calculateConfidence(evidenceCount);
    const breadth = calculateBreadth(categories);
    const signatureStrength = calculateSignatureStrength(average, confidence, breadth);
    const displayedPole = getDisplayedPole(average, dimension);

    return {
      dimension: dimension.id,
      name: dimension.name,
      positivePole: dimension.positivePole,
      positiveLabel: dimension.positiveLabel,
      negativePole: dimension.negativePole,
      negativeLabel: dimension.negativeLabel,
      explanation: dimension.explanation,
      normalizedScore: Number(average.toFixed(3)),
      evidenceCount,
      positiveEvidenceCount,
      negativeEvidenceCount,
      categories,
      uniqueCategoryCount: categories.length,
      confidence: Number(confidence.toFixed(3)),
      breadth: Number(breadth.toFixed(3)),
      signatureStrength: Number(signatureStrength.toFixed(3)),
      displayPole: displayedPole.label,
      displayName: displayedPole.name,
      displayPercent: displayedPole.value,
      evidence: entry.evidence,
    };
  });

  const topTraits = dimensions
    .filter((dimension) => dimension.evidenceCount >= 2)
    .sort((a, b) => b.signatureStrength - a.signatureStrength)
    .slice(0, 5)
    .map((dimension) => ({
      id: dimension.dimension,
      name: dimension.displayName,
      displayName: dimension.displayPole,
      percent: Math.max(12, Math.min(88, dimension.displayPercent)),
      normalizedScore: dimension.normalizedScore,
      signatureStrength: dimension.signatureStrength,
      confidence: dimension.confidence,
      breadth: dimension.breadth,
      evidenceCount: dimension.evidenceCount,
    }));

  return {
    dimensions,
    topTraits,
    totalEvidence: answers.reduce((count, answer) => count + Math.max(1, answer.effects.length), 0),
    answeredCount: answers.length,
  };
};

export const MICRO_PERSONALITY_SAMPLE: PersonalityAnswerEvidence[] = [
  {
    question: 'It is Sunday night and you are already overthinking Monday. What is your move?',
    category: 'routine',
    chosenAnswer: 'Plan the entire week out.',
    effects: [
      { dimension: 'planner_spontaneous', value: 2 },
      { dimension: 'control_allowing', value: 2 },
    ],
  },
  {
    question: 'Your best friend is dating someone you cannot stand. What do you do?',
    category: 'friendship',
    chosenAnswer: 'Tell them immediately.',
    effects: [
      { dimension: 'protective_hands_off', value: 2 },
      { dimension: 'direct_indirect', value: 2 },
    ],
  },
  {
    question: 'You get a surprise invite to a party you are not excited about. Do you go?',
    category: 'social',
    chosenAnswer: 'I will go for one hour.',
    effects: [
      { dimension: 'adventure_comfort', value: -1 },
      { dimension: 'social_attunement', value: 1 },
    ],
  },
  {
    question: 'The office group chat starts a new rumor. Are you the first to check facts?',
    category: 'work',
    chosenAnswer: 'I check facts before I say anything.',
    effects: [
      { dimension: 'trust_verify', value: -1 },
      { dimension: 'social_attunement', value: 1 },
    ],
  },
  {
    question: 'You find out your ex is posting a very curated version of their life. What do you do?',
    category: 'love',
    chosenAnswer: 'Delete them from my life.',
    effects: [],
  },
  {
    question: 'You are about to leave for a trip and your friend says, “Let’s do it last minute.”',
    category: 'travel',
    chosenAnswer: 'I need a checklist and a plan.',
    effects: [
      { dimension: 'planner_spontaneous', value: 2 },
      { dimension: 'rules_bending', value: 1 },
    ],
  },
  {
    question: 'A friend is spiraling after a bad night. What do you do?',
    category: 'friendship',
    chosenAnswer: 'Ask what is really wrong and help them sort it out.',
    effects: [
      { dimension: 'protective_hands_off', value: 2 },
      { dimension: 'social_attunement', value: 2 },
    ],
  },
  {
    question: 'You see a tiny argument between friends at dinner. What do you do?',
    category: 'conflict',
    chosenAnswer: 'I say something before it gets worse.',
    effects: [
      { dimension: 'conflict_peacekeeping', value: 2 },
      { dimension: 'direct_indirect', value: 1 },
    ],
  },
  {
    question: 'A coworker leaves you out of a project update. How do you react?',
    category: 'work',
    chosenAnswer: 'I ask for the missing details and move forward.',
    effects: [
      { dimension: 'control_allowing', value: 1 },
      { dimension: 'curious_decisive', value: 1 },
    ],
  },
  {
    question: 'A group wants to do something chaotic on a Friday night. What do you say?',
    category: 'social',
    chosenAnswer: 'I need to know the plan before I commit.',
    effects: [
      { dimension: 'planner_spontaneous', value: 2 },
      { dimension: 'adventure_comfort', value: -1 },
    ],
  },
  {
    question: 'A friend shares a very personal story with you. How do you respond?',
    category: 'friendship',
    chosenAnswer: 'I hold space and listen carefully.',
    effects: [
      { dimension: 'sentimental_thick_skinned', value: 1 },
      { dimension: 'private_open', value: 1 },
    ],
  },
  {
    question: 'You get a chance to do something risky but exciting. Do you do it?',
    category: 'adventure',
    chosenAnswer: 'I am in if the plan is sensible.',
    effects: [
      { dimension: 'adventure_comfort', value: 1 },
      { dimension: 'practical_idealistic', value: 1 },
    ],
  },
  {
    question: 'A friend says, “I am fine,” but clearly is not. What do you do?',
    category: 'social',
    chosenAnswer: 'I ask what is really wrong.',
    effects: [
      { dimension: 'social_attunement', value: 2 },
      { dimension: 'emotional_intensity', value: 1 },
    ],
  },
  {
    question: 'A new idea sounds exciting but half-baked. What is your instinct?',
    category: 'work',
    chosenAnswer: 'I want to understand it before I say yes.',
    effects: [
      { dimension: 'curious_decisive', value: 1 },
      { dimension: 'practical_idealistic', value: 1 },
    ],
  },
  {
    question: 'A friend is late to something important. What do you do?',
    category: 'social',
    chosenAnswer: 'I ask for an update and stay calm.',
    effects: [
      { dimension: 'patient_urgent', value: 1 },
      { dimension: 'conflict_peacekeeping', value: 1 },
    ],
  },
];

export const getDemoPersonalityAnswers = (answerCount = MICRO_PERSONALITY_SAMPLE.length) => {
  return Array.from({ length: Math.max(0, answerCount) }, (_, index) => {
    const answer = MICRO_PERSONALITY_SAMPLE[index % MICRO_PERSONALITY_SAMPLE.length];
    return {
      ...answer,
      effects: answer.effects.map((effect) => ({ ...effect })),
    };
  });
};

export const getDemoPersonalityProfile = (answerCount = MICRO_PERSONALITY_SAMPLE.length) => {
  return scorePersonalityProfile(getDemoPersonalityAnswers(answerCount));
};

export const getPersonalitySignalCopy = (displayName: string, evidenceCount: number) => {
  if (evidenceCount <= 1) {
    return `${displayName} noticed that. 👀`;
  }

  if (evidenceCount <= 3) {
    return `This nudged ${displayName}.`;
  }

  if (evidenceCount <= 6) {
    return `Okay... ${displayName} is showing up again.`;
  }

  return `${displayName} keeps making a case for Your 7.`;
};

export type ConsensusLanguage = {
  rank: number;
  label: 'very rare' | 'one of the rarer picks' | 'uncommon' | 'somewhere in the middle' | 'one of the popular choices' | 'majority choice';
  sentence: string;
};

export const getConsensusLanguage = (options: Array<{ percent: number }>, selectedIndex: number): ConsensusLanguage => {
  const selected = options[selectedIndex];
  if (!selected) {
    throw new Error(`No answer option exists at index ${selectedIndex}.`);
  }

  const rank = 1 + options.filter((option) => option.percent > selected.percent).length;
  let label: ConsensusLanguage['label'];

  if (selected.percent >= 50) {
    label = 'majority choice';
  } else if (rank <= 2 && selected.percent >= 30) {
    label = 'one of the popular choices';
  } else if (selected.percent < 10) {
    label = 'very rare';
  } else if (selected.percent <= 20) {
    label = 'one of the rarer picks';
  } else if (selected.percent <= 25) {
    label = 'uncommon';
  } else {
    label = 'somewhere in the middle';
  }

  return {
    rank,
    label,
    sentence: `${selected.percent}% chose this — ${label}.`,
  };
};
