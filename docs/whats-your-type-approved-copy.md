# What's Your Type? — Approved Copy & Implementation Record

## Provenance

This content was supplied directly by the product owner in the Build 16 implementation
conversation, as the literal text to implement. It was **not** independently verified by
Claude against any screen recording, video frame, or external attachment — no such files were
accessible in this environment, and the owner's own instruction was explicit that the inline
text in the handoff messages is the implementation input itself, not an assertion that
matching source files exist elsewhere that Claude could or should locate and cross-check.

The canonical, machine-readable source of truth is:
- `src/data/quizzes/whats-your-type-content.ts` — 10 questions, 60 answers, archetype
  assignments, Core personality evidence awards.
- `src/data/quizzes/whats-your-type-results.ts` — 12 individual archetype reads, 36 paired
  combination reads.

This document is a human-readable record of that handoff and the specific implementation
decisions made while turning it into code — not a second copy of the content to keep in sync
by hand.

## Structure

- **Part 1 (Q1–5, "Attraction Type")**: which of 6 Attraction archetypes (Walking Green Flag,
  Charming Menace, Beautiful Mystery, Adventure Addiction, Power Couple Material, Soft Spot)
  the respondent is drawn to. Zero Core personality evidence by design — never infer the
  respondent's own personality from traits they want in a partner.
- **Part 2 (Q6–10, "Partner Energy")**: which of 6 Partner Energy archetypes (Thoughtful One,
  Playful Instigator, Selectively Soft One, Wild Card, Intentional One, Independent Romantic)
  describes the respondent's own behavior. These questions describe the respondent's own
  actions in a scenario, so Core evidence is independently judged per choice against the real
  Scoring V2 pole standard — the supplied "provisional Core evidence" column was a starting
  point, not a mandate, per the handoff's own instruction.
- **Result**: three sections — "Your Type" (the won Attraction archetype's individual read),
  "Your Partner Energy" (the won Partner archetype's individual read), and "The Plot Twist"
  (one of 36 paired combination reads, looked up by the two winning archetypes together).

## Core evidence: where this implementation diverged from the supplied "provisional" column

Every entry in the supplied column was reviewed individually, not applied automatically. The
following were changed or omitted, with reasoning:

| Item | Supplied | Implemented | Reason |
|---|---|---|---|
| Q6-B | "Cautious expression, possible +1; exact pole unverified" | No award | The source itself flagged the pole as unverified. Guessing which of several plausible poles (Verify first? Reflective, which is Private and unawardable here regardless?) would be inventing, not implementing, the supplied evidence. |
| Q9-A | "Privacy preference; exact Core pole unverified" (plausibly Private, `private_open:positive`) | No award | This choice describes a hoped-for behavior from the respondent's **partner** ("they don't start telling everybody our business"), not the respondent's own action — the same reason every Q1–5 (Attraction) choice carries no Core evidence at all. Treated consistently with that rule rather than as an exception. |
| All other Q6–10 entries | As supplied | As supplied, independently confirmed against the real 64-pole `PersonalityPoleId` namespace | Every pole label in the supplied table (Independent, Playful, Direct, Vibe Checker, Verify First, Curious, Practical, Planner, Spontaneous, Sentimental) resolved to a real, valid Core pole id with no changes needed. |

No Private pole is awarded anywhere in this quiz (confirmed by `scripts/validate-whats-your-type-content.ts`) — this is a Free Explore quiz, and Private evidence is never awarded from Free content anywhere in the app.

## Open items for Build 17 (per explicit instruction: do not fabricate a fix)

- **Q7's "entire backstory" → Thoughtful One attribution**: the owner flagged this archetype
  attribution for reconsideration. No revised wording or attribution was supplied, so it is
  implemented exactly as given (`"I need to know the entire backstory. For educational
  purposes." → Thoughtful One`). Revisit once revised copy is approved.
- **Q9's gift-expectation choice as "weak Thoughtful evidence"**: flagged by the owner as weak.
  Implemented as supplied (Thoughtful One, zero Core award — the Core award was already
  independently judged out per the table above, which happens to also address the "weak
  evidence" concern for the Core side; the archetype attribution itself is unchanged).
- **"Weak Wild Card assignments"**: flagged generally, no specific replacement supplied.
  Implemented as given throughout; Wild Card's individual read and all 6 of its combination
  reads are unchanged from the supplied text.
- **Final answer-order rebalance**: the owner noted a final shuffle was approved in concept but
  the post-shuffle 60-answer table was not reproduced in the handoff. **This implementation
  uses the pre-shuffle answer order and wording exactly as supplied** — no shuffle has been
  applied, and none has been claimed. If a specific final order exists, supply it directly for
  a follow-up pass.

## Combination supersessions applied (owner-selected edits over the original 36-entry draft)

Ten explicit replacements plus one additional supersession were applied, per the handoff's own
reconciliation checklist — the version implemented in `whats-your-type-results.ts` is the
**post-edit** version in every case below:

1. Walking Green Flag + Playful Instigator → "The Green Flag With Jokes"
2. Walking Green Flag + Selectively Soft One → "The Security Clearance"
3. Walking Green Flag + Wild Card → "The Plot Twist With Standards"
4. Charming Menace + Wild Card → "The Chaos Collaboration"
5. Charming Menace + Intentional One → "The Responsible Bad Decision" (the final approved
   full-screen example, superseding an earlier draft)
6. Beautiful Mystery + Thoughtful One → "The Patient Detective"
7. Beautiful Mystery + Independent Romantic → "The Parallel Universe"
8. Adventure Addiction + Playful Instigator → "The Laughing Liability"
9. Adventure Addiction + Selectively Soft One → "The Cautious Adrenaline Junkie"
10. Power Couple Material + Selectively Soft One → "The Selective Investor"
11. Soft Spot + Intentional One → "The Love With Receipts"

Two individual-result supersessions were applied the same way: The Charming Menace (final
Option 3) and The Intentional One (final Option 3) — both implemented in
`whats-your-type-results.ts` exactly as the final, owner-selected text.

## Validation

`scripts/validate-whats-your-type-content.ts` verifies: exactly 60 answers across 10 questions
(5 Attraction + 5 Partner Energy), every choice maps to a valid archetype for its own axis, all
6 choices per question map to 6 distinct archetypes, every one of the 12 archetypes is
reachable from exactly 5 questions, all 12 individual results and all 36 (6×6) combinations
exist with nonempty text and correctly stable keys, every Core evidence award resolves to a
real Core (never Private) pole id, and the real scoring engine (`scoreDualDimensionQuiz`)
resolves every one of the 36 achievable answer-letter patterns to a real combination
deterministically.
