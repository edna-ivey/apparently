import { getSignatureStrengthLabel, type PersonalityDimensionId, type PersonalityProfile } from '@/data/personality';

// Pure card-selection logic for You's "YOUR SIGNATURE" cards — deliberately kept
// dependency-free (no react-native import anywhere in this file) so it can be exercised
// directly by a plain Node validation script, unlike src/app/(tabs)/you.tsx itself.
// src/app/(tabs)/you.tsx imports everything it needs from here rather than defining any of
// this inline.
//
// Bible v1.4 §16 reconciliation (replaces the retired buildYouProfileCards/buildYourSevenCards
// "Your 7" mechanic): that mechanic deliberately mixed real-but-unqualified "early signal"
// Core dimensions (evidenceCount >= 1, below the active-board threshold) in with genuinely
// qualified ones to approach a fixed 5 (or, past the 50-profile-answer milestone, 7) card
// count -- exactly the "old consumer-facing Your Patterns / Your 7 presentation" the Bible
// says is "being replaced." There is now exactly ONE Core ranking -- profile.topTraits (see
// personality.ts's own header comment on topTraits) -- already qualification-gated
// (activeBoardQualified), already ranked by signatureStrength, already capped at 7. This
// module no longer does any filtering/ranking/capping of its own; it only maps that list into
// the display shape You's UI expects. The user's answered-question count (profileAnswerCount)
// plays NO role here at all -- it is a Creature-reveal concern (Bible §17, not yet
// implemented in this codebase), never a Your Signature qualification substitute.

export type YouProfileCard = {
  dimension: PersonalityDimensionId;
  label: string;
  strengthLabel: string;
};

// "YOUR SIGNATURE" -- up to seven strongest qualifying Core trait poles (Bible v1.4 §16).
// Never pads: 0 qualifying traits returns an empty array (the You screen's existing
// zero-activity empty state already covers that case; see you.tsx), 2 qualifying traits
// returns exactly 2, 10 qualifying traits returns the strongest 7 (profile.topTraits itself
// already caps at 7 -- see personality.ts). Every card traces back to a real, qualified
// dimension; there is no "early signal" tier and no evidenceCount>=1 fallback.
export const buildYourSignatureCards = (profile: PersonalityProfile): YouProfileCard[] =>
  profile.topTraits.map((trait) => ({
    dimension: trait.id,
    label: trait.name,
    strengthLabel: getSignatureStrengthLabel(trait.signatureStrength),
  }));
