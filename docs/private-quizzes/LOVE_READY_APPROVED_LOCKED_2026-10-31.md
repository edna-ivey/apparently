# Apparently Private | Are You Actually Ready for Love?

**Status:** LOCKED — OWNER-APPROVED CREATIVE AND ANSWER-LEVEL MAPPINGS. NOT YET IMPLEMENTED.  
**Approved:** 2026-10-31  
**Quiz ID:** love-soulmates-ready  
**Category:** Love & Soulmates  
**Editorial version:** 2.0, replacing the previous Love quiz copy  
**Canonical status:** This document is the approved source of truth for Quiz 1's copy, answer-level mapping proposals, and reveals. It supersedes the older Love section in APPROVED_PRIVATE_QUIZZES.md and the currently implemented wording in src/data/quizzes/love-ready.ts.  
**Previous version:** docs/private-quizzes/archive/LOVE_READY_PREVIOUS_LOCKED_VERSION.md  
**IMPORTANT:** This is an approved CONTENT specification, not authorization to change application code, apply SQL migrations, backfill accounts, build, commit, or deploy. Separate authorization is required before implementation.

## Owner-approved editorial rules

1. All language must remain gender-neutral, including partners, result copy, and sharing. Do not substitute gendered pronouns, gendered partner labels, or gendered stock copy.
2. The answer choices intentionally sound like real people and avoid one predictably recurring OPEN/TERMS/WALLS/BAE voice. Keep their order, stable letter IDs, phrasing, and quiz-result weights exactly as printed below.
3. Quiz-result category weights and **per-answer personality trait awards are independent**. An answer can contribute to two verdicts. Awards are all positive +1/+2/+3. Some answers may have fewer awards or none in the Relic layer. Do not create filler awards.
4. Creature means Core personality evidence (numeric IDs 1–40). Relic means Private personality evidence (numeric IDs 41–64). **Trait #35 “Private” is a Core/Creature trait** despite its name. Five original misclassifications were explicitly corrected as part of approval: Q1B, Q2D, Q3C, Q9C, Q10B.
5. Awards should be granted from the user's **first complete quiz submission only** using the approved authoritative numeric mapping, never from result-level labels. Retakes may create entertainment/history results but must not award permanent evidence again.
6. The quiz's four result categories are OPEN, TERMS, WALLS, and BAE. No percentages or artificial five-part breakdown should be shown in the Private reveal. Reveal traits are **display-only tags**, not additional scoring.
7. Final reveal section order is **TITLE → THE VERDICT → THE PRIVATE READ → THE CALL-OUT → THE COST → TRY THIS → THE KICKER (ending in the italic Apparently signature) → YOUR TRAITS**. The result copy is approved verbatim and is not to be extended.
8. The paid screen should feel like the free quiz result plus an additional Private layer, not a stripped-down free result or a giant development-purple verdict box. Reuse the established Apparently Private design system.
9. Preserve quiz ID, question IDs q1–q10, and choice IDs a–d. Do not renumber existing catalog numeric IDs. Old completed results and shared results must remain resolvable.
10. **Open engineering validation, not license to change creative content:** Existing result gates refer to the *previous* answer wording/letter meanings, so they cannot be silently reused. Recalibrate the eligibility gates, tie logic, and high-signal question treatment against this approved 40-choice set. Simulate representative paths, reachability of all four results, and harsh-result false positives. Present the proposed implementation gate values for separate owner approval before release.

## Approved intro

**Eyebrow:** APPARENTLY PRIVATE  
**Title:** Are You Actually Ready for Love?  
**Introduction:** Wanting a relationship and being ready for one are not the same thing.  
**Small print:** Choose what you'd actually do. Your ideal self can sit this one out.  
**Meta:** 10 questions · About 3 minutes  
**CTA:** Clock me →

## Complete approved questions and mappings

**Notation:** C = Creature/Core; R = Relic/Private. IDs refer to the frozen personality trait catalog. All awards are positive evidence points, never penalties. Verdict weights are separate from awards.

### Q1. Three months in. Someone you really like follows through, remembers things, and makes plans. It feels... easy. What catches you off guard?

- **A [a].** I stop waiting for the plot twist. Boring in the best way.  
  **Verdict:** OPEN +2.  
  **Creature/Core:** #25 Trust first +1; #4 Even-Keeled +1; #16 Let it play out +1.  
  **Relic/Private:** #45 Self-secure +1.
- **B [b].** After our best dates, I somehow catch myself waiting longer to text back.  
  **Verdict:** WALLS +2; TERMS +1.  
  **Creature/Core:** #13 Independent +1; #35 Private +1.  
  **Relic/Private:** #50 Armored +2.
- **C [c].** I enjoy it. I'm curious whether “consistent” lasts through a bad week.  
  **Verdict:** TERMS +2; OPEN +1.  
  **Creature/Core:** #26 Verify first +2; #17 Practical +1.  
  **Relic/Private:** #43 Reflective +1.
- **D [d].** The dates are great. I'm already doing math on how much time they'll take.  
  **Verdict:** BAE +2.  
  **Creature/Core:** #13 Independent +1; #17 Practical +1.  
  **Relic/Private:** #56 Self-preserving +2; #62 Self-referencing +1.

### Q2. You had one completely free Saturday. Your person calls after a rough morning and asks to see you. You...

- **A [a].** Ask what they need and what can wait. You had plans, too.  
  **Verdict:** TERMS +2; OPEN +1.  
  **Creature/Core:** #17 Practical +2; #5 Direct +1.  
  **Relic/Private:** #47 Boundary-holding +2; #57 Supportive +1.
- **B [b].** Go. But you definitely notice that your day no longer belongs to you.  
  **Verdict:** BAE +2.  
  **Creature/Core:** #12 Comfort-seeking +1; #24 Peacekeeping +1.  
  **Relic/Private:** #56 Self-preserving +1; #60 Keeps score +1.
- **C [c].** Move a couple things around and ask where they want to meet.  
  **Verdict:** OPEN +2.  
  **Creature/Core:** #14 Collaborative +1.  
  **Relic/Private:** #55 Duty-first +2; #57 Supportive +2; #59 Gives freely +1.
- **D [d].** Check on them by text first. You need a second before walking into big feelings.  
  **Verdict:** WALLS +1; TERMS +1.  
  **Creature/Core:** #6 Indirect +1; #7 Vibe checker +1; #35 Private +1.  
  **Relic/Private:** #50 Armored +1.

### Q3. They tell you, “Sometimes when you're upset, I feel shut out.” Your first reply?

- **A [a].** I was quiet, not angry. Why does it need a meaning?  
  **Verdict:** BAE +1; TERMS +1.  
  **Creature/Core:** #8 Face value +1; #5 Direct +1.  
  **Relic/Private:** #42 Defensiveness +1.
- **B [b].** I was processing. What could I say so it doesn't feel like I'm leaving?  
  **Verdict:** OPEN +2.  
  **Creature/Core:** #5 Direct +2; #14 Collaborative +1.  
  **Relic/Private:** #41 Accountability +2; #51 Repair-oriented +2.
- **C [c].** I say we're okay. I'm just not ready to unpack the rest.  
  **Verdict:** WALLS +2.  
  **Creature/Core:** #6 Indirect +1; #24 Peacekeeping +1; #35 Private +2.  
  **Relic/Private:** #50 Armored +2.
- **D [d].** I hear that. I also need room to be quiet without it becoming a verdict.  
  **Verdict:** TERMS +2; OPEN +1.  
  **Creature/Core:** #5 Direct +1; #17 Practical +1.  
  **Relic/Private:** #47 Boundary-holding +2; #41 Accountability +1.

### Q4. You were sure you were right. Turns out your partner had receipts. Now what?

- **A [a].** I admit it, then spend the evening a little harder to reach.  
  **Verdict:** WALLS +2.  
  **Creature/Core:** #6 Indirect +1; #24 Peacekeeping +1.  
  **Relic/Private:** #50 Armored +2; #42 Defensiveness +1.
- **B [b].** Sorry first, timeline review second. I want us aligned on what happened.  
  **Verdict:** TERMS +2; WALLS +1.  
  **Creature/Core:** #17 Practical +2; #26 Verify first +1.  
  **Relic/Private:** #41 Accountability +1; #43 Reflective +1.
- **C [c].** I say sorry, then ask if we can please retire the whole postmortem.  
  **Verdict:** BAE +3.  
  **Creature/Core:** #38 Urgent +1; #34 Decisive +1.  
  **Relic/Private:** #42 Defensiveness +2; #56 Self-preserving +1.
- **D [d].** I own it and ask what I can do to actually repair it.  
  **Verdict:** OPEN +3.  
  **Creature/Core:** #5 Direct +1; #33 Curious +1.  
  **Relic/Private:** #41 Accountability +3; #51 Repair-oriented +2.

### Q5. Six months in, you're being folded into the ordinary stuff. Dinners, errands, family plans. Your reaction?

- **A [a].** I'm in. I start suggesting a few things we can make ours.  
  **Verdict:** OPEN +2.  
  **Creature/Core:** #14 Collaborative +2; #29 Playful +1.  
  **Relic/Private:** #63 Initiating +2; #57 Supportive +1.
- **B [b].** I love being included. Being expected to organize things myself? Less exciting.  
  **Verdict:** BAE +3.  
  **Creature/Core:** #13 Independent +1; #12 Comfort-seeking +1.  
  **Relic/Private:** #56 Self-preserving +2; #62 Self-referencing +1.
- **C [c].** I enjoy it, but I book solo time before the calendar fills itself.  
  **Verdict:** TERMS +2; OPEN +1.  
  **Creature/Core:** #13 Independent +2; #1 Planner +1; #17 Practical +1.  
  **Relic/Private:** #47 Boundary-holding +2.
- **D [d].** I say yes more than I mean to, then start dodging invitations.  
  **Verdict:** WALLS +2.  
  **Creature/Core:** #12 Comfort-seeking +1; #24 Peacekeeping +1.  
  **Relic/Private:** #50 Armored +2; #48 Approval-seeking +1.

### Q6. They say “I'm fine,” but their whole energy says “maybe not.” Your move?

- **A [a].** They said fine. I heard fine. They know where to find me.  
  **Verdict:** BAE +1; OPEN +1.  
  **Creature/Core:** #8 Face value +2; #10 Hands-off +1.  
  **Relic/Private:** No confident award.
- **B [b].** I ask whether they'd rather talk or have space. Either works.  
  **Verdict:** TERMS +2; OPEN +1.  
  **Creature/Core:** #5 Direct +2; #17 Practical +1.  
  **Relic/Private:** #47 Boundary-holding +1; #57 Supportive +1.
- **C [c].** I start rewinding our last conversation to see what I missed.  
  **Verdict:** WALLS +2.  
  **Creature/Core:** #7 Vibe checker +2; #26 Verify first +1.  
  **Relic/Private:** #46 Reassurance-seeking +1; #50 Armored +1.
- **D [d].** I give it room, then check back later without making it a test.  
  **Verdict:** OPEN +2.  
  **Creature/Core:** #25 Trust first +2; #16 Let it play out +1; #37 Patient +1.  
  **Relic/Private:** #61 Perspective-taking +2.

### Q7. They forget something important to you, apologize, and offer to make it up. You...

- **A [a].** Take the apology, then watch what changes next time.  
  **Verdict:** TERMS +3.  
  **Creature/Core:** #26 Verify first +2; #17 Practical +1.  
  **Relic/Private:** #47 Boundary-holding +1; #43 Reflective +1.
- **B [b].** Tell them it hurt, then talk about how to make it right.  
  **Verdict:** OPEN +3.  
  **Creature/Core:** #27 Forgiving +1; #23 Conflict-forward +1.  
  **Relic/Private:** #49 Vulnerable +1; #51 Repair-oriented +2.
- **C [c].** Say it's fine. Their next important day gets a little less effort from you.  
  **Verdict:** BAE +2.  
  **Creature/Core:** #6 Indirect +1; #24 Peacekeeping +1.  
  **Relic/Private:** #60 Keeps score +2; #52 Punishing +1.
- **D [d].** Forgive them aloud, then quietly wonder what else you'll be forgotten in.  
  **Verdict:** WALLS +2.  
  **Creature/Core:** #26 Verify first +1; #7 Vibe checker +1.  
  **Relic/Private:** #50 Armored +2; #46 Reassurance-seeking +1.

### Q8. A six-month opportunity they worked hard for would disrupt plans you've made together. You...

- **A [a].** Say you're excited, then run a private worst-case scenario in your head.  
  **Verdict:** WALLS +2.  
  **Creature/Core:** #26 Verify first +1; #1 Planner +1.  
  **Relic/Private:** #50 Armored +2; #46 Reassurance-seeking +1.
- **B [b].** Celebrate them. Later, catch yourself counting whose plans keep moving.  
  **Verdict:** BAE +3.  
  **Creature/Core:** #31 Competitive +1; #13 Independent +1.  
  **Relic/Private:** #60 Keeps score +2; #62 Self-referencing +1.
- **C [c].** Figure there's room for both dreams and start making a plan.  
  **Verdict:** OPEN +3.  
  **Creature/Core:** #18 Idealistic +1; #14 Collaborative +2.  
  **Relic/Private:** #57 Supportive +2; #63 Initiating +1.
- **D [d].** Ask which changes are temporary and what you're each agreeing to.  
  **Verdict:** TERMS +2; OPEN +1.  
  **Creature/Core:** #17 Practical +2; #1 Planner +1.  
  **Relic/Private:** #47 Boundary-holding +2; #61 Perspective-taking +1.

### Q9. They've seen your insecure side and stayed. Now what?

- **A [a].** I let them see another piece of me I usually edit out.  
  **Verdict:** OPEN +2.  
  **Creature/Core:** #25 Trust first +1; #36 Open +2.  
  **Relic/Private:** #49 Vulnerable +2; #63 Initiating +1.
- **B [b].** I appreciate it. I also catch myself asking if we're okay more often.  
  **Verdict:** TERMS +2; WALLS +1.  
  **Creature/Core:** #7 Vibe checker +1; #19 Sentimental +1.  
  **Relic/Private:** #46 Reassurance-seeking +2; #43 Reflective +1.
- **C [c].** I love that they stayed. I still start keeping more thoughts to myself.  
  **Verdict:** WALLS +3.  
  **Creature/Core:** #12 Comfort-seeking +1; #24 Peacekeeping +1; #35 Private +2.  
  **Relic/Private:** #50 Armored +2.
- **D [d].** Being understood is beautiful. Offering that same access back? Still working on it.  
  **Verdict:** BAE +3.  
  **Creature/Core:** #10 Hands-off +1.  
  **Relic/Private:** #56 Self-preserving +2; #62 Self-referencing +1.

### Q10. You both want different things from a decision that affects you equally. Neither person is wrong. What happens?

- **A [a].** Before agreeing, I catch myself totaling what I've already given up.  
  **Verdict:** BAE +3.  
  **Creature/Core:** #17 Practical +1; #13 Independent +1.  
  **Relic/Private:** #60 Keeps score +2; #62 Self-referencing +1.
- **B [b].** I say we'll come back to it. Then somehow it's next week.  
  **Verdict:** WALLS +3.  
  **Creature/Core:** #6 Indirect +2; #24 Peacekeeping +1; #35 Private +1.  
  **Relic/Private:** #50 Armored +2.
- **C [c].** I want us to be specific about what each of us needs before choosing.  
  **Verdict:** TERMS +2; OPEN +1.  
  **Creature/Core:** #5 Direct +2; #17 Practical +1.  
  **Relic/Private:** #47 Boundary-holding +2; #61 Perspective-taking +1.
- **D [d].** I ask what's nonnegotiable for them, explain mine, and build from there.  
  **Verdict:** OPEN +3.  
  **Creature/Core:** #14 Collaborative +2; #32 Cooperative +1.  
  **Relic/Private:** #61 Perspective-taking +2; #53 Tactful +1.

## Approved result copy — VERBATIM

**Required render order for every result:** TITLE, THE VERDICT, THE PRIVATE READ, THE CALL-OUT, THE COST, TRY THIS, THE KICKER (first plain line followed by italic *Apparently,...* signature), YOUR TRAITS.

**Do not add a separate “WHY WE'RE SAYING THAT” section, extra body paragraphs, inferred trait scoring, percentages, or generic prose.** Preserve spelling, punctuation, emojis, case, and section order exactly.

### OPEN | OPEN FOR LOVE. CLOSED FOR NONSENSE.

**THE VERDICT**

You want the relationship, not just the butterflies. You're willing to show up when love gets inconvenient.

**THE PRIVATE READ**

You understand that real intimacy requires honesty, compromise, and occasional uncomfortable conversations. You're not afraid of the work. Just make sure you're not doing it alone.

**THE CALL-OUT**

Being emotionally available doesn't mean everybody deserves access.

**THE COST**

Your willingness to make things work could keep you fixing something somebody else keeps breaking.

**TRY THIS**

Stop asking, "Could we build something?" Ask, "Are they building with me?"

**THE KICKER**

Love is a partnership, not a solo project.

*Apparently, your heart is open, not on clearance.*

**YOUR TRAITS**

Emotionally Present · Collaborative · Repair-Oriented

### TERMS | LOVE, PENDING APPROVAL.

**THE VERDICT**

Your heart has a front desk. Identification, references, and proof of consistency required. 😂

**THE PRIVATE READ**

You want love, but certainty feels safer than vulnerability. Some of your caution is wisdom. Some of it is fear wearing a blazer.

**THE CALL-OUT**

Standards protect you. Surprise tests exhaust people. Stop making someone new pay for somebody else's mistakes.

**THE COST**

A good person can spend so long auditioning for your trust that the relationship never actually begins.

**TRY THIS**

Keep your nonnegotiables. Retire the moving goalposts.

**THE KICKER**

At some point, the background check has to end.

*Apparently, your standards have standards.*

**YOUR TRAITS**

Discerning · Independent · Careful With Trust

### WALLS | HEART OPEN. SECURITY SYSTEM ARMED.

**THE VERDICT**

You want somebody to know the real you. Your defenses would prefer they submit a request in writing.

**THE PRIVATE READ**

You crave closeness, but when someone gets close enough to hurt you, your instincts start looking for an exit. You don't necessarily want out. You just want guarantees love can't give.

**THE CALL-OUT**

You can't ask for deep connection while handing everybody an edited version of yourself.

**THE COST**

Your walls might prevent heartbreak. They might also turn away someone who was trying to stay.

**TRY THIS**

Before pulling away, ask: "Is this actually unsafe, or does being loved feel scary?"

**THE KICKER**

The lock works. Unfortunately, love is outside.

*Apparently, your heart RSVP'd yes. Your defenses canceled.*

**YOUR TRAITS**

Observant · Guarded · Emotionally Deep

### BAE | YOU WANT THE PERKS, NOT THE PARTNERSHIP.

**THE VERDICT**

You read the relationship brochure. The shared-responsibilities section? Apparently skipped. 😭

**THE PRIVATE READ**

You love attention, affection, and having somebody in your corner. But when love requires inconvenient effort, suddenly your availability gets complicated.

**THE CALL-OUT**

Wanting independence is healthy. Expecting someone to show up for you while your own participation stays optional? That's a benefits package, not a relationship.

**THE COST**

Someone can love you and still feel lonely doing all the showing up.

**TRY THIS**

Ask yourself: "Would I still choose this person when they're the one who needs me?"

**THE KICKER**

A partner is a person, not a subscription perk.

*Apparently, you love the perks. The terms of service need another look.*

**YOUR TRAITS**

Independent · Selectively Invested · Comfort-Seeking

## Approved Private reveal presentation contract

- Same familiar emotional payoff as free quizzes: a prominent VERDICT headline, relatable read, final punchline, and exactly three descriptive trait chips.
- Additional paid value: the deeper PRIVATE READ, CALL-OUT, COST, and TRY THIS, in the approved order. Do not repeat a separate free-quiz “Why we're saying that” section on top of these.
- A premium Apparently Private aesthetic consistent with the current Private landing page: rich dark plum, celestial light/texture, polished typography, elevated contrast, calm motion. Avoid the old giant solid-violet development result card.
- Brief progressive reveal is optional, never a long unskippable sequence. Accessibility, reduced motion, legibility, and scroll behavior must remain good.
- Keep sharing/Compare behavior where supported, existing mature-content sharing restrictions, and standard next actions. The “Take another quiz” action after a Private quiz should return to Private rather than Explore.
- Result title and display tags are **not additional personality evidence**. Creature/Core and Relic/Private evidence come solely from the answer-level mapping above, once official scoring activation is separately approved.
- Respect first-completion permanence, entitlement/age gates, legacy quiz history, and currently held numeric mapping migrations. Do not use old positional numeric trait IDs; resolve IDs from the frozen catalog/ledger.

## Implementation handoff for Claude (FUTURE, only when separately authorized)

1. Replace old LOVE_READY_QUIZ title/intro/questions/choices/result copy from this locked document, retaining stable quiz/question/choice keys.
2. Replace the old love-ready answer-to-pole mapping with precisely the 40 sets of awards above. Merge Creature and Relic awards correctly; #35 is Core/Creature. Do not reuse outdated individual answer mappings, result-level profileSignals, or old gendered result copy.
3. The older result's WALLS and BAE gates refer to outdated answer letters; do **not** copy them unchanged. Keep robust harsh-result eligibility concepts, but independently simulate all four results, tie paths, mixed answer paths, and the effects of cross-verdict weights. Submit gate/tie numeric values for separate approval. Never silently change the user's approved answer or result wording to fix test coverage.
4. Confirm whether the existing score engine supports multi-verdict weights on a single choice; this content deliberately uses that capability.
5. Confirm no Private quiz answers earn numeric personality credit until their approved award mappings are officially activated in the backend; handle previous real first completions carefully.
6. Implement a reusable premium reveal pattern shared by all paid quizzes, with these eight visible sections, free-quiz familiarity, and consistent Private styling. Do not implement it as a one-off for Love only.
7. Validate gender neutrality, 10 questions, 4 answers each, result reachability, mapping schema, IDs, and source-vs-runtime parity.
8. Changes to code, database, migration, TestFlight, or deployment require an explicit owner instruction. **Saving and locking this document does not authorize any of those changes.**

## Editorial provenance

The owner approved the complete revised 10-question / 40-answer Love quiz with layered Creature/Core and Relic/Private mappings, and then explicitly approved the **shortened** four reveal versions preserved above on 2026-10-31. Those shortened reveals supersede the longer intermediate rewrites. A prior classification correction moved trait #35 “Private” to the Core/Creature layer in Q1B, Q2D, Q3C, Q9C, and Q10B. No other copy, category points, or trait awards are intentionally changed from the owner-approved editorial draft.
