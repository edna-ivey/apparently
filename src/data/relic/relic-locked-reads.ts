// Locked, editorially-approved Relic Read overrides -- content that bypasses the combination-
// aware synthesis engine (relic-read-synthesis.ts) entirely for one specific BASE trait,
// because the approved copy was authored and signed off as one atomic headline + body, not
// decomposed into the TraitVoice shape (identityCore/asBase/strength/shadowByModifier/...)
// every other trait uses. Mirrors the same pattern already approved for the Creature system's
// locked combined-Read entries (src/data/creature/creature-combined-read-copy.ts) -- preserve
// wording, punctuation, apostrophes, and capitalization exactly. Do not rewrite, shorten,
// paraphrase, or silently alter this copy.
//
// Scope: this ONLY overrides "The Read" / "The Gift" / "The Shade" / "The Cost" / "Try This" --
// the mechanical "Why Your Relic Looks Like This" per-slot explainer (whyBase/whyColor/
// whyEffect) is intentionally left to the normal combination-aware system even when this
// override is active, exactly like the Creature combined-Read keeps its five individual part
// cards separate from and alongside the new combined narrative. Never fragment these
// paragraphs into the Gift/Shade/Cost/Try This boxes individually -- that would require
// guessing where one approved sentence ends and another begins, which is not this module's
// call to make.

export type LockedRelicRead = {
  headline: string;
  body: string[];
};

// Approved Anchor Relic Read, Version 4 -- the selfSecure trait's Base identity (objectLabel
// 'Anchor', see relic-trait-meta.ts). Supersedes the combination-aware synthesis for this one
// trait whenever it resolves as Base, regardless of Color/Effect.
export const ANCHOR_LOCKED_READ_V4: LockedRelicRead = {
  headline: "You're not stubborn. They're just going to need a better argument.",
  body: [
    "You trust your own judgment, and agreeing with everyone has never been on your to-do list. You can support someone without co-signing their nonsense. Apparently, that's a difficult concept for some people. They'll catch up. Eventually.",
    "But here's where it gets interesting. Sometimes you're so busy making sure you're understood that you forget being understood doesn't require agreement.",
    "Your strength is knowing what you believe. Your growth is recognizing when you've already made your point and can let it stand.",
  ],
};
