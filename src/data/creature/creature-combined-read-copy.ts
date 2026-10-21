import { PERSONALITY_DIMENSIONS, type PersonalityDimensionId, type SignatureTrait } from '@/data/personality';

// Authored combined-Creature-Read copy -- Build 16. This is a SEPARATE dataset from
// creature-read-copy.ts's individual-part-card copy (`explanation`/`apparentlyLine`); the
// combined Read is never derived from those fields. Exactly 40 entries: all 20 Core
// dimensions x both poles, same scope as creature-read-copy.ts and for the same reason (the
// Creature is Core-only; Private-12 dimensions never reach this module). Every component below
// is locked, editorially-approved copy -- preserve wording, punctuation, apostrophes, and
// capitalization exactly. Do not rewrite, shorten, paraphrase, or "fix" these strings; a
// change here is a content change, not a code change, and needs the same editorial approval
// any other locked copy would.
//
// Each pole has exactly four position-independent components (header/openingFragment/
// supportingCopy/shade). assembleCombinedRead below is the ONLY place that combines two poles'
// components into a Read, and it follows one fixed formula for every ordered pair of distinct
// Core dimensions -- Zorafox (Direct + Vibe Checker) is not a special case; it is just one of
// the 1,520 ordered combinations the same formula produces.

export type CombinedReadComponents = {
  header: string;
  openingFragment: string;
  supportingCopy: string;
  shade: string;
  // Build 19 editorial pass: both OPTIONAL, default-false join-mechanism controls for
  // buildParagraph1 below, used only for the handful of entries where the automatic join
  // reads awkwardly as plain "openingFragment and firstSentence." -- see each flag's own
  // comment on buildParagraph1. Neither affects paragraph 2 (buildParagraph2 never reads
  // them) or the headline formula; both default to false/undefined for every entry that
  // doesn't set them, which is exactly the Build 18 behavior the approved Zorafox fixture
  // and the other 36 untouched entries still rely on.
  commaJoin?: true;
  skipOpeningJoin?: true;
};

export const CREATURE_COMBINED_READ_COPY: Partial<
  Record<PersonalityDimensionId, { positive: CombinedReadComponents; negative: CombinedReadComponents }>
> = {
  planner_spontaneous: {
    positive: {
      header: 'You like knowing what comes next',
      openingFragment: 'organized enough to make a plan before making a move',
      supportingCopy: 'You think ahead, prepare for what could go wrong, and feel better when the important details are handled.',
      shade: "Apparently, 'we'll figure it out' is not the reassuring statement people think it is.",
    },
    negative: {
      header: 'You know how to go with the flow',
      openingFragment: 'flexible enough to enjoy a change of plans without losing your cool',
      supportingCopy: 'You leave room for surprises and can turn an unexpected detour into the best part of the day.',
      shade: 'Apparently, not every good memory needs a reservation.',
    },
  },
  emotional_intensity: {
    positive: {
      header: 'You feel things deeply',
      openingFragment: 'passionate enough to experience emotions at full volume',
      supportingCopy: "When something matters to you, it really matters. Your excitement, disappointment, and affection aren't things you experience halfway.",
      shade: "Apparently, you're not being dramatic. You're just very emotionally invested. In everything.",
    },
    negative: {
      header: 'You know how to keep your cool',
      openingFragment: 'steady enough to stay composed when emotions run high',
      supportingCopy: 'You give yourself time to process what happens instead of letting every feeling decide your next move.',
      shade: 'Apparently, not every situation deserves a dramatic season finale.',
    },
  },
  direct_indirect: {
    positive: {
      header: 'You say what you mean',
      openingFragment: 'direct enough to make your point clear',
      supportingCopy: "You don't make people decode your intention. When something needs to be said, you say it.",
      shade: 'Whether everyone was ready to hear it is another conversation.',
    },
    negative: {
      header: 'You know how to say things without saying everything',
      openingFragment: 'thoughtful enough to choose your words with the situation in mind',
      supportingCopy: 'You pay attention to timing, tone, and how your message might land before deciding what to say.',
      shade: 'Apparently, you prefer to deliver the message with a little bubble wrap.',
    },
  },
  social_attunement: {
    positive: {
      header: "You hear what everyone else doesn't",
      openingFragment: 'perceptive enough to catch what people leave unsaid',
      supportingCopy: "A shift in tone? Noticed. A change in energy? Clocked. You don't just listen to words.",
      shade: "You read the room they're spoken in.",
    },
    negative: {
      header: 'You take people at their word',
      openingFragment: 'straightforward enough to hear what someone says without searching for a hidden meaning',
      supportingCopy: "You prefer clear communication and don't automatically assume every pause, glance, or comment carries a secret message.",
      shade: "Apparently, not every 'okay' requires a three-hour investigation.",
    },
  },
  protective_hands_off: {
    positive: {
      header: "You don't play about the people you love",
      openingFragment: 'protective enough to step in when someone you care about needs backup',
      supportingCopy: "You pay attention to how people treat your loved ones, and you're not afraid to speak up when something feels wrong.",
      shade: 'Apparently, some people need a reminder that being nice and being easy to mess with are two different things.',
    },
    negative: {
      header: 'You know when to let people handle their own business',
      openingFragment: 'respectful enough to give others room to make their own decisions',
      supportingCopy: 'You can care about someone without taking responsibility for every choice they make. Sometimes the best support is giving them space.',
      shade: "Apparently, you've mastered the art of minding your business while still caring about theirs.",
    },
  },
  adventure_comfort: {
    positive: {
      header: "You'd rather try it than wonder about it",
      openingFragment: 'adventurous enough to step outside your usual routine',
      supportingCopy: 'New places, unfamiliar experiences, and a little uncertainty can make life more exciting for you.',
      shade: "Apparently, 'we've never done that before' sounds more like an invitation than a warning.",
    },
    negative: {
      header: "You know what you like, and you're good with it",
      openingFragment: 'comfortable enough with your favorites to resist chasing every new thing',
      supportingCopy: "You appreciate familiar places, reliable routines, and the simple pleasure of knowing exactly what you're getting.",
      shade: 'Apparently, your favorite spot is still your favorite spot. Shocking.',
    },
  },
  independent_collaborative: {
    positive: {
      header: 'You make your own choices',
      openingFragment: 'independent enough to follow your own path without waiting for approval',
      supportingCopy: "You value good advice, but you're comfortable making the final call yourself.",
      shade: 'Apparently, the committee meeting about your life has been canceled.',
    },
    negative: {
      header: 'You believe good things are better together',
      openingFragment: "team-minded enough to value other people's ideas alongside your own",
      supportingCopy: 'You like sharing decisions, hearing different perspectives, and making sure the people involved feel included.',
      shade: 'Apparently, the group project actually has someone who wants to be in the group.',
    },
  },
  control_allowing: {
    positive: {
      header: 'You like having a say in how things turn out',
      openingFragment: 'hands-on enough to take charge when something needs to get done',
      supportingCopy: 'You notice what needs attention and would rather handle a problem early than wait around hoping it fixes itself.',
      shade: "Apparently, 'just trust the process' is easier when you're the one running it.",
    },
    negative: {
      header: 'You know when to let things unfold',
      openingFragment: 'comfortable enough with uncertainty to see how things play out',
      supportingCopy: "You don't feel the need to control every outcome. Sometimes you give a situation room to work itself out before stepping in.",
      shade: 'Apparently, not everything needs your supervision. Imagine that.',
    },
  },
  practical_idealistic: {
    positive: {
      header: 'You keep your feet on the ground',
      openingFragment: "grounded enough to trust what's tried and proven over what merely sounds good",
      supportingCopy: 'You appreciate a good idea, but you want to see how it will work in real life.',
      shade: 'Apparently, good intentions still need a plan.',
    },
    negative: {
      header: 'You see what could be, not just what is',
      openingFragment: "hopeful enough to believe there's more possible than what's right in front of you",
      supportingCopy: "You imagine better outcomes and aren't quick to dismiss an idea just because nobody has figured out how to make it happen yet.",
      shade: 'Apparently, reality is just the starting point for your imagination.',
    },
  },
  sentimental_thick_skinned: {
    positive: {
      header: 'You hold on to what matters',
      openingFragment: 'sentimental enough to find meaning in the little things others overlook',
      supportingCopy: 'You keep memories close because the people, places, and feelings behind them still matter.',
      shade: "Apparently, that drawer full of keepsakes is not clutter. It's history.",
    },
    negative: {
      header: "You don't let every little thing get to you",
      openingFragment: 'resilient enough to brush off things that might bother someone else',
      supportingCopy: 'You can take criticism, handle an awkward moment, and move on without replaying every word in your head.',
      shade: 'Apparently, your feelings have a pretty solid security system.',
    },
  },
  rules_bending: {
    positive: {
      header: 'You believe rules exist for a reason',
      openingFragment: 'principled enough to value consistency over convenient exceptions',
      supportingCopy: "You appreciate clear expectations and think standards should apply even when following them isn't the easiest option.",
      shade: "Apparently, 'but everybody does it' has never been a convincing argument.",
    },
    negative: {
      header: 'You know when the rules need a little flexibility',
      openingFragment: 'resourceful enough to question a rule when it stops making sense',
      // Owner-approved rewording, 2026-10-21 (Build 19 final editorial pass) -- replaces the
      // earlier "You consider the situation before deciding whether the usual way is actually
      // the best way." for tighter, more conversational phrasing; paired with commaJoin below.
      supportingCopy: "You'd rather size up the situation than assume the usual way is the best way. You're more interested in what works than in blindly following instructions.",
      shade: "Apparently, you read the rules. You just didn't promise to agree with them.",
      commaJoin: true,
    },
  },
  conflict_peacekeeping: {
    positive: {
      header: "You'd rather address the problem than pretend it's fine",
      openingFragment: 'bold enough to face uncomfortable conversations instead of avoiding them',
      supportingCopy: "When there's tension, you want to talk about what's happening and find out where everyone stands.",
      shade: 'Apparently, you saw the elephant in the room and decided it was time for introductions.',
    },
    negative: {
      header: 'You know how to keep things from escalating',
      openingFragment: 'considerate enough to choose calm over unnecessary conflict',
      supportingCopy: 'You pay attention to how conversations are going and look for ways to resolve tension without making the situation worse.',
      shade: 'Apparently, you have a gift for calming things down. Too bad nobody asked if you wanted the job.',
    },
  },
  trust_verify: {
    positive: {
      header: 'You give people a chance before doubting them',
      openingFragment: 'open enough to offer trust without demanding proof of every little thing',
      supportingCopy: 'You prefer to believe people mean well until their actions give you a reason to reconsider.',
      shade: 'Apparently, you give people the benefit of the doubt. Sometimes with a little too much enthusiasm.',
    },
    negative: {
      header: "You don't believe everything you hear",
      openingFragment: 'cautious enough to question a story before accepting it as truth',
      supportingCopy: 'You listen, ask questions, and pay attention to whether the answers actually make sense.',
      shade: 'Apparently, asking a few questions is enough to make some people nervous.',
    },
  },
  forgiving_receipts: {
    positive: {
      header: 'You know how to let go of what happened',
      openingFragment: 'forgiving enough to move forward without keeping every mistake on file',
      supportingCopy: "You recognize when someone has made a genuine effort to change and don't automatically hold their past against them forever.",
      shade: "Apparently, you believe in second chances. Unlimited chances? Let's not get carried away.",
    },
    negative: {
      header: 'You keep track of what actually happened',
      openingFragment: 'observant enough to recall the details people conveniently forget',
      supportingCopy: "Past behavior matters to you, especially when someone promises they've changed but keeps doing the same thing.",
      shade: "Apparently, a new chapter doesn't erase the previous ones.",
    },
  },
  playful_serious: {
    positive: {
      header: 'You know how to make life a little more fun',
      openingFragment: 'playful enough to find humor in everyday life',
      supportingCopy: 'You can lighten the mood with one well-timed joke, even when everyone else is taking things too seriously.',
      shade: 'Apparently, growing up came with responsibilities, not a ban on having fun.',
    },
    negative: {
      header: "You know when it's time to get down to business",
      openingFragment: 'focused enough to give important things the attention they deserve',
      supportingCopy: 'You appreciate meaningful conversations and prefer dealing with what matters instead of turning everything into a joke.',
      shade: 'Apparently, not every moment needs a punchline. Especially yours.',
    },
  },
  competitive_cooperative: {
    positive: {
      header: "You didn't come this far to finish second",
      openingFragment: 'competitive enough to turn almost anything into a chance to win',
      supportingCopy: 'You enjoy the thrill of a challenge, especially when someone thinks they can beat you.',
      shade: "Apparently, you can lose gracefully. You'd just prefer not to demonstrate that skill.",
    },
    negative: {
      header: "You'd rather win together than win alone",
      openingFragment: "generous enough to care about everyone's success, not just your own",
      supportingCopy: 'You enjoy working toward a shared goal and believe good results feel even better when everyone gets to contribute.',
      shade: "Apparently, you brought enough good energy for the whole team. You're welcome.",
    },
  },
  curious_decisive: {
    positive: {
      header: 'You always have one more question',
      openingFragment: 'curious enough to keep digging long after everyone else has moved on',
      supportingCopy: 'You love discovering how things work, exploring new ideas, and following an interesting question wherever it leads.',
      shade: "Apparently, you've never met a rabbit hole you couldn't turn into a research project.",
    },
    negative: {
      header: "You know when you've heard enough to make a call",
      openingFragment: 'confident enough to make a decision without exploring every possible option',
      supportingCopy: 'You gather what you need, trust your judgment, and move forward instead of getting stuck wondering what else might be out there.',
      shade: 'Apparently, you know what you want. Period.',
    },
  },
  private_open: {
    positive: {
      header: "You don't give everyone access to your personal life",
      // Owner-approved rewording, 2026-10-21 (Build 19 final editorial pass) -- replaces the
      // earlier "selective enough to keep certain parts of yourself for people who've earned
      // your trust" / "You value personal space and prefer choosing what to share rather than
      // feeling obligated to explain everything about yourself." pairing, paired with
      // commaJoin below.
      openingFragment: 'selective about who gets to know the real you',
      supportingCopy:
        "You don't feel the need to explain yourself to everybody. Some parts of your life are yours to share when you're ready, not because someone thinks they're entitled to know.",
      shade: "Apparently, your life isn't a public newsletter. Subscriptions are limited.",
      commaJoin: true,
    },
    negative: {
      header: "You're not afraid to let people know the real you",
      // Owner-approved rewording, 2026-10-21 (Build 19 final editorial pass) -- replaces the
      // earlier "open enough to share your thoughts and feelings without hiding behind a
      // perfect image" / "You connect through honest conversations and feel comfortable
      // letting people see the experiences that have shaped you." pairing, paired with
      // commaJoin below.
      openingFragment: 'comfortable letting people see who you really are',
      supportingCopy:
        "You don't feel the need to present some perfectly polished version of yourself. You connect through honest conversations because, to you, being real matters more than looking perfect.",
      shade: 'Apparently, your life comes with commentary, bonus scenes, and behind-the-scenes footage.',
      commaJoin: true,
    },
  },
  patient_urgent: {
    positive: {
      header: 'You understand that good things take time',
      openingFragment: 'patient enough to give people and situations room to develop',
      // Owner-approved rewording, 2026-10-21 (Build 19 final editorial pass) -- merges the
      // earlier two supportingCopy sentences ("You can tolerate delays without immediately
      // assuming something is going wrong." / "You'd rather allow things to unfold than force
      // them before they're ready.") into one via ", and" ("allow" -> "let"), paired with
      // skipOpeningJoin below so the opening fragment's own "people and situations" never
      // doubles up with a second "and" from the paragraph-1 join.
      supportingCopy:
        "You can tolerate delays without immediately assuming something is going wrong, and you'd rather let things unfold than force them before they're ready.",
      shade: 'Apparently, you got the memo that not everything needs to happen by Friday.',
      skipOpeningJoin: true,
    },
    negative: {
      header: "You'd rather make a move than wait around",
      openingFragment: 'motivated enough to act quickly when something needs attention',
      supportingCopy: 'You notice delays, look for ways to move things forward, and feel better when progress is actually happening.',
      shade: "Apparently, 'I'll get to it eventually' is your least favorite love language.",
    },
  },
  ambitious_content: {
    positive: {
      header: "You always have your eye on what's next",
      openingFragment: 'ambitious enough to keep reaching for bigger goals even after a win',
      supportingCopy: 'You set high expectations for yourself and enjoy working toward something that challenges you to grow.',
      shade: 'Apparently, your idea of relaxing is thinking about your next big move.',
    },
    negative: {
      header: "You know how to appreciate the life you're living",
      openingFragment: 'secure enough to enjoy what you have without constantly chasing more',
      supportingCopy: "You recognize what makes your life meaningful and don't feel pressured to measure your happiness against someone else's achievements.",
      shade: "Apparently, you're allowed to be happy right where you are.",
    },
  },
};

export type CombinedCreatureRead = {
  headline: string;
  paragraph1: string;
  paragraph2: string;
};

const lowercaseFirstLetter = (value: string): string => (value.length === 0 ? value : `${value[0].toLowerCase()}${value.slice(1)}`);

// Splits on whitespace that follows a sentence-ending ./?/!, keeping the terminal punctuation
// attached to each sentence -- e.g. "A shift in tone? Noticed." -> ["A shift in tone?",
// "Noticed."]. Used only to find the FIRST/LAST sentence of a supportingCopy string so the
// join logic below can touch just that boundary sentence, never the fragments in between.
const SENTENCE_SPLIT_REGEX = /(?<=[.?!])\s+/;
const splitSentences = (text: string): string[] =>
  text.split(SENTENCE_SPLIT_REGEX).map((sentence) => sentence.trim()).filter(Boolean);

// Only a sentence ending in "." is a complete declarative clause safe to fold into "and ...";
// a sentence ending in "?"/"!" is a rhythm fragment (e.g. "A shift in tone?") that reads as
// awkward, dangling grammar if forced after "and" -- those are left exactly as authored.
const isJoinableSentence = (sentence: string): boolean => sentence.endsWith('.');
const stripTrailingPeriod = (sentence: string): string => sentence.slice(0, -1);
const startsWithApparently = (text: string): boolean => text.trim().toLowerCase().startsWith('apparently');

// Paragraph 1: the brief calls for joining related sentences naturally with "and" rather than
// always starting a new sentence -- e.g. Zorafox's "...make your point clear and you don't
// make people decode your intention." This folds the opening fragment into supportingCopy's
// FIRST sentence via "and" whenever that sentence is a real declarative clause (see
// isJoinableSentence); any remaining supportingCopy sentences follow unchanged. A
// non-joinable first sentence (a "?"/"!" rhythm fragment) falls back to the original
// period-separated join instead of forcing an unnatural conjunction onto it -- this is the
// guard against the "simplistic global string replacement" the brief explicitly warns against.
// Exported for scripts/validate-combined-creature-read.ts -- the validator tests this exact
// join/fallback logic directly against fixture components, rather than re-deriving the same
// formula a second time (which would drift from the real implementation over time).
// `skipOpeningJoin` (Build 19): an explicit per-entry escape hatch for the rare case where
// joining the opening fragment into supportingCopy's first sentence reads as a pileup no
// matter how it's punctuated (e.g. patient_urgent.positive, where the opening fragment
// already has its own "and" -- "people AND situations" -- so a second "and" joining it to the
// first sentence doubles up). Forces the plain period-separated fallback regardless of
// joinability; owner-approved per entry, never applied automatically by a heuristic.
export const buildParagraph1 = (first: CombinedReadComponents): string => {
  if (first.skipOpeningJoin) {
    return `You're ${first.openingFragment}. ${first.supportingCopy}`;
  }
  const [firstSentence, ...restSentences] = splitSentences(first.supportingCopy);
  if (!firstSentence || !isJoinableSentence(firstSentence)) {
    return `You're ${first.openingFragment}. ${first.supportingCopy}`;
  }
  // `commaJoin` (Build 19): some owner-approved joins read more naturally with a comma before
  // "and" (a full, standalone-reading independent clause on each side) than Zorafox's plain
  // "clear and you don't..." -- an editorial call per entry, not a universal rule (changing it
  // globally would alter the locked Zorafox fixture). Defaults to the original no-comma join.
  const connector = first.commaJoin ? ',' : '';
  const joinedOpening = `You're ${first.openingFragment}${connector} and ${lowercaseFirstLetter(stripTrailingPeriod(firstSentence))}.`;
  return restSentences.length > 0 ? `${joinedOpening} ${restSentences.join(' ')}` : joinedOpening;
};

// Paragraph 2: works "Apparently," into the closing thought per the brief, rather than only
// ever appearing when an authored shade happens to already open with it. The "closing thought"
// is supportingCopy's LAST sentence immediately followed by the shade (e.g. Zorafox's "...you
// don't just listen to words. You read the room they're spoken in." is one connected beat).
// "Apparently," is prepended there ONLY when the shade doesn't already start with it -- most
// authored shades already do (e.g. "Apparently, not every good memory needs a reservation."),
// in which case the shade already IS the closing thought and nothing is injected, avoiding a
// doubled "Apparently, ... Apparently, ...". Same isJoinableSentence guard as paragraph 1:
// never injects ahead of a "?"/"!" rhythm fragment.
// Exported for the same reason as buildParagraph1 above.
export const buildParagraph2 = (second: CombinedReadComponents): string => {
  const sentences = splitSentences(second.supportingCopy);
  const lastSentence = sentences.pop();
  if (!lastSentence || !isJoinableSentence(lastSentence) || startsWithApparently(second.shade)) {
    return `You're also ${second.openingFragment}. ${second.supportingCopy} ${second.shade}`;
  }
  const leadingCopy = sentences.length > 0 ? `${sentences.join(' ')} ` : '';
  const closingThought = `Apparently, ${lowercaseFirstLetter(stripTrailingPeriod(lastSentence))}. ${second.shade}`;
  return `You're also ${second.openingFragment}. ${leadingCopy}${closingThought}`;
};

// The one fixed assembly formula -- every ordered pair of distinct Core dimensions goes
// through this exact shape. Paragraph 1 carries only the first trait's opening fragment and
// supporting copy (its shade is deliberately dropped -- the brief is explicit that the first
// trait's shade never appears in a combined Read). Paragraph 2 carries the second trait's
// opening fragment, supporting copy, AND shade, since the shade is what gives the Read its
// final, personality-specific landing line.
const assembleCombinedRead = (first: CombinedReadComponents, second: CombinedReadComponents): CombinedCreatureRead => ({
  headline: `${first.header}, and ${lowercaseFirstLetter(second.header)}.`,
  paragraph1: buildParagraph1(first),
  paragraph2: buildParagraph2(second),
});

// Resolves which pole's combined-Read components apply for a real, already-qualified trait --
// mirrors getCreatureReadPoleCopy's own resolution in creature-read-copy.ts exactly (same
// SignatureTrait.name-vs-.displayName distinction; see that function's comment for why).
export function getCombinedReadComponents(trait: SignatureTrait): CombinedReadComponents {
  const dimension = PERSONALITY_DIMENSIONS.find((d) => d.id === trait.id);
  const entry = CREATURE_COMBINED_READ_COPY[trait.id];
  if (!dimension || !entry) {
    throw new Error(`No combined Creature Read copy for Core trait dimension: ${trait.id}`);
  }
  if (trait.name === dimension.positiveLabel) {
    return entry.positive;
  }
  if (trait.name === dimension.negativeLabel) {
    return entry.negative;
  }
  throw new Error(`Combined Creature Read copy pole could not be resolved for ${trait.id}: "${trait.name}"`);
}

// Label-based counterpart for the persisted mixed-Creature snapshot shape
// (CreatureSnapshotTrait in creature-progression.ts), which stores only the pole LABEL string
// (e.g. "Direct"), not the dimension id. Returns the owning dimension id alongside the
// components so callers can reject same-dimension pairs without a second lookup. Mirrors
// getCreatureReadCopyByLabel's reasoning in creature-read-copy.ts (pole labels are globally
// unique across all 32 canonical dimensions).
export function getCombinedReadComponentsByLabel(
  traitLabel: string,
): { dimensionId: PersonalityDimensionId; components: CombinedReadComponents } {
  for (const dimension of PERSONALITY_DIMENSIONS) {
    if (dimension.type !== 'core') {
      continue;
    }
    const entry = CREATURE_COMBINED_READ_COPY[dimension.id];
    if (!entry) {
      continue;
    }
    if (dimension.positiveLabel === traitLabel) {
      return { dimensionId: dimension.id, components: entry.positive };
    }
    if (dimension.negativeLabel === traitLabel) {
      return { dimensionId: dimension.id, components: entry.negative };
    }
  }
  throw new Error(`No combined Creature Read copy found for trait label: "${traitLabel}"`);
}

// Builds the combined Read from two live, already-ranked SignatureTraits (rank 1 and rank 2).
// Opposite poles of the same dimension can never both be a profile's top two in practice (a
// dimension resolves to exactly one pole), but this still rejects first.id === second.id
// explicitly rather than silently producing a malformed Read if that invariant is ever broken
// upstream.
export function buildCombinedCreatureRead(first: SignatureTrait, second: SignatureTrait): CombinedCreatureRead {
  if (first.id === second.id) {
    throw new Error(`Combined Creature Read requires two distinct Core dimensions, got "${first.id}" for both ranks`);
  }
  return assembleCombinedRead(getCombinedReadComponents(first), getCombinedReadComponents(second));
}

// Label-based counterpart of buildCombinedCreatureRead, for the persisted mixed-Creature
// snapshot's traitName strings -- this is what creature-read.tsx actually calls.
export function buildCombinedCreatureReadByLabel(firstLabel: string, secondLabel: string): CombinedCreatureRead {
  const firstEntry = getCombinedReadComponentsByLabel(firstLabel);
  const secondEntry = getCombinedReadComponentsByLabel(secondLabel);
  if (firstEntry.dimensionId === secondEntry.dimensionId) {
    throw new Error(`Combined Creature Read requires two distinct Core dimensions, got "${firstEntry.dimensionId}" for both ranks`);
  }
  return assembleCombinedRead(firstEntry.components, secondEntry.components);
}
