# Apparently Private | How Bad Do You Actually Want It?

**Status:** LOCKED — OWNER-APPROVED CREATIVE AND ANSWER-LEVEL MAPPINGS. NOT YET IMPLEMENTED.  
**Approved:** 2026-10-31  
**Quiz ID:** career-ambition-how-bad  
**Category:** Career & Ambition  
**Editorial version:** 2.0, replacing the previous Career/How Bad content and copy.  
**Canonical status:** This document supersedes the prior How Bad section in docs/private-quizzes/APPROVED_PRIVATE_QUIZZES.md and the currently implemented source in src/data/quizzes/career-how-bad.ts.  
**Archived predecessor:** docs/private-quizzes/archive/CAREER_HOW_BAD_PREVIOUS_LOCKED_VERSION.md  
**Approval scope:** All 10 questions, all 40 answer choices, verdict weights, 64-trait numeric Core/Private answer mapping choices as listed, four full shortened reveal texts, and exact reveal section order. The strict LAZY gate was explicitly required by the owner and independently verified against the existing scoring engine.  
**NOT AUTHORIZATION:** No source code, numeric catalog, database, migration, mapping activation, production data, build, commit, push, or release may be modified based only on this editorial approval.

## Locked content and implementation rules

1. **Gender-neutral language throughout.** No assumption about a user's gender, career role, partner gender, or preferred life path.
2. **This is ONE complete ten-question experience, not split into separate stages.** Stable quiz ID career-ambition-how-bad, stable question IDs q1–q10, stable answer IDs a–d. Content revisions reuse logical keys but are a distinct semantic content version. Do not reinterpret historical answers using rewritten choice meanings; preserve historical content-version identity.
3. Each answer has independent **verdict-category weights** and **permanent numeric personality trait awards**. Multiple verdict weights are supported. Personality awards are positive-only +1/+2/+3, never penalties. Do not infer awards from the winning result or its display tags.
4. Creature means **Core** trait IDs 1–40; Relic means **Private** trait IDs 41–64. **Core trait #35 is named “Private”** and remains a Creature/Core award, never Relic, despite the label.
5. Use only the trait IDs, points and category scores below. Sparse mappings and zero confident Relic awards are intentional. Do not manufacture additional awards to make every answer have four.
6. Quiz results have **four** distinct identities: REAL = want-it-for-real; COMFORT = comfort-keeps-winning; TALK = talk-great-game; LAZY = lazy-there-we-said-it. These are quiz-outcome identities, **not** personality traits. Do not award "Lazy" as a trait.
7. **LAZY is genuinely reachable but protected:** The winning score must be LAZY >= 6 points **and** at least **three of Q3B, Q8A, Q9B, Q10A** must be selected, **and** LAZY must win the eligible-outcome score/tie decision. The threshold >=6 is redundant when three of those four occur because those three alone award at least 8 LAZY points; retain it explicitly for audibility. Implement with a result gate requiring 3-of-4 high-confidence answers and at least 3 LAZY-supporting questions. A single night of rest, personal boundaries, a slower pace, or responsible reevaluation never justifies the harsh result.
8. **Tie order:** compare total verdict score; then high-signal verdict contributions from Q2, Q3, Q5, Q8, Q9, Q10; then count full +2 primary answer selections; then fixed fallback REAL → COMFORT → TALK → LAZY. No close-second verdict. Preserve exact intended semantics using the actual production score engine and simulate multiple coherent profiles.
9. **Reveal section order, unchangeable:** TITLE → THE VERDICT → THE PRIVATE READ → THE CALL-OUT → THE COST → TRY THIS → THE KICKER (plain line ending with a separate *Apparently,* signature) → YOUR TRAITS. Exactly three display-only trait tags at the end. No extra "WHY WE'RE SAYING THAT," no duplicate long text, no result percentages. The complete four reveals below are **verbatim approved**.
10. Premium styling must match the current Apparently Private design system and preserve the familiar free-quiz emotional payoff, with additional Private depth. Use the shared premium reveal component approved for Quiz 1, not a new separate old-violet development screen.
11. Core and Relic scoring from this paid quiz stays **held in backend** until its versioned mappings have been separately approved for migration and safe activation. Retakes must not grant new identity points; original answer meaning and first-completion permanence control all historical reconciliation.
12. There was an earlier, separately marked LOCKED Career quiz in the aggregate document; it has been archived unmodified as source history and explicitly superseded here. Never implement from the archive.

## Approved intro

**Eyebrow:** APPARENTLY PRIVATE  
**Title:** How Bad Do You Actually Want It?  
**Category:** Career & Ambition  
**Subtitle:** Everybody wants the life. Fewer people want the Tuesday.  
**Support:** Ten questions. No motivational speech. We're checking the receipts.  
**Small print:** Choose what you actually do, not what your future successful self would say.  
**Meta:** 10 questions · About 3 minutes  
**CTA:** Clock me →

## Complete approved questions and answer-to-trait mappings

**Key:** REAL / COMFORT / TALK / LAZY refer only to verdict weights. Creature/Core = numeric IDs 1–40; Relic/Private = numeric IDs 41–64. All trait evidence values are positive 1–3 points. The exact answer IDs appear in brackets.

### Q1. Pick your poison. The goal you want needs six hours a week for six months. What usually happens when you try to make room?

- **A [a].** I block the time. I still grieve my free evenings a little.  
  **Verdict:** REAL +2; COMFORT +1.  
  **Creature/Core:** #1 Planner +2; #17 Practical +1; #37 Patient +1.  
  **Relic/Private:** #55 Duty-first +1.
- **B [b].** I start with two nights, then adjust if my energy doesn't hold.  
  **Verdict:** COMFORT +2; REAL +1.  
  **Creature/Core:** #17 Practical +1; #1 Planner +1.  
  **Relic/Private:** #47 Boundary-holding +2; #43 Reflective +1.
- **C [c].** I spend the first week researching the perfect approach. The calendar is still empty.  
  **Verdict:** TALK +2; COMFORT +1.  
  **Creature/Core:** #33 Curious +1; #1 Planner +1; #15 Control +1.  
  **Relic/Private:** #56 Self-preserving +1.
- **D [d].** I keep waiting for a quieter week. Apparently every week has opinions.  
  **Verdict:** LAZY +2; TALK +1.  
  **Creature/Core:** #12 Comfort-seeking +1; #16 Let it play out +1.  
  **Relic/Private:** #56 Self-preserving +1.

### Q2. Your big break finally shows up. Same destination. Less glamour. More grunt work. Your move?

- **A [a].** I keep browsing for the version I'd be prouder to tell people about.  
  **Verdict:** TALK +2; COMFORT +1.  
  **Creature/Core:** #18 Idealistic +2; #33 Curious +1; #7 Vibe checker +1.  
  **Relic/Private:** #48 Approval-seeking +2.
- **B [b].** I take it. I can complain in my notes about the fluorescent lighting.  
  **Verdict:** REAL +2; COMFORT +1.  
  **Creature/Core:** #39 Ambitious +2; #30 Serious +1; #35 Private +1.  
  **Relic/Private:** #55 Duty-first +1.
- **C [c].** I tell myself I'll read the offer tonight. It's been sixteen nights.  
  **Verdict:** LAZY +2; TALK +1.  
  **Creature/Core:** #12 Comfort-seeking +1; #2 Spontaneous +1.  
  **Relic/Private:** #56 Self-preserving +1.
- **D [d].** I ask about the workload and whether the path still gets me where I want to go.  
  **Verdict:** COMFORT +1; REAL +1.  
  **Creature/Core:** #17 Practical +2; #26 Verify first +1.  
  **Relic/Private:** #43 Reflective +1; #47 Boundary-holding +1.

### Q3. Which message from your group chat could actually be yours?

- **A [a].** "I can do it, just not on the timeline I said out loud."  
  **Verdict:** COMFORT +2; REAL +1.  
  **Creature/Core:** #1 Planner +1; #17 Practical +2.  
  **Relic/Private:** #47 Boundary-holding +1; #43 Reflective +1.
- **B [b].** "Next Monday. Yes, I've said that before. Please stop keeping receipts."  
  **Verdict:** LAZY +2; TALK +1.  
  **Creature/Core:** #12 Comfort-seeking +1; #16 Let it play out +1.  
  **Relic/Private:** #56 Self-preserving +1.
- **C [c].** "I tested it last week. Turns out half my plan was wrong."  
  **Verdict:** REAL +2.  
  **Creature/Core:** #17 Practical +1; #5 Direct +1.  
  **Relic/Private:** #41 Accountability +2; #43 Reflective +1.
- **D [d].** "New idea. I know, I know. The last one is still in drafts."  
  **Verdict:** TALK +2.  
  **Creature/Core:** #33 Curious +2; #2 Spontaneous +1.  
  **Relic/Private:** #63 Initiating +1; #43 Reflective +1.

### Q4. The thing you worked so hard for FLOPS. Publicly. Spectacularly. What happens in the first 48 hours?

- **A [a].** I explain all the reasons it wasn't a fair shot before reviewing my own choices.  
  **Verdict:** TALK +2.  
  **Creature/Core:** #5 Direct +1; #15 Control +1.  
  **Relic/Private:** #42 Defensiveness +2; #56 Self-preserving +1.
- **B [b].** I take a week to regroup, then test a smaller version.  
  **Verdict:** COMFORT +2; REAL +1.  
  **Creature/Core:** #17 Practical +2; #1 Planner +1.  
  **Relic/Private:** #43 Reflective +1; #47 Boundary-holding +1.
- **C [c].** I feel awful, ask what failed, and start fixing one part.  
  **Verdict:** REAL +2; COMFORT +1.  
  **Creature/Core:** #3 Emotionally Intense +1; #17 Practical +1.  
  **Relic/Private:** #41 Accountability +1; #43 Reflective +2.
- **D [d].** I start telling people it wasn't that serious, even though I was obsessed last week.  
  **Verdict:** TALK +2; COMFORT +1.  
  **Creature/Core:** #6 Indirect +1; #12 Comfort-seeking +1.  
  **Relic/Private:** #50 Armored +2; #56 Self-preserving +1.

### Q5. Somebody deposits $10 million into your account tomorrow. Be serious: what's left of the dream?

- **A [a].** I'd still want it, but I'd plan a slower pace and finally take weekends back.  
  **Verdict:** COMFORT +2; REAL +1.  
  **Creature/Core:** #40 Content +1; #17 Practical +1; #1 Planner +1.  
  **Relic/Private:** #47 Boundary-holding +1.
- **B [b].** I'd find a new mountain. A few people still owe me an apology for doubting me.  
  **Verdict:** TALK +2; REAL +1.  
  **Creature/Core:** #31 Competitive +1; #39 Ambitious +1.  
  **Relic/Private:** #48 Approval-seeking +2; #60 Keeps score +1.
- **C [c].** I'd still build it. I'd just stop checking my bank account every hour.  
  **Verdict:** REAL +2.  
  **Creature/Core:** #39 Ambitious +2; #18 Idealistic +1.  
  **Relic/Private:** #45 Self-secure +1; #63 Initiating +1.
- **D [d].** I might drop that goal. Turns out I wanted freedom more than the title.  
  **Verdict:** COMFORT +2; TALK +1.  
  **Creature/Core:** #40 Content +1; #13 Independent +1; #17 Practical +1.  
  **Relic/Private:** #43 Reflective +2.

### Q6. What are you secretly chasing when you picture success?

- **A [a].** The people who doubted me suddenly acting like they always knew.  
  **Verdict:** TALK +2.  
  **Creature/Core:** #31 Competitive +1; #39 Ambitious +1.  
  **Relic/Private:** #48 Approval-seeking +2; #60 Keeps score +1.
- **B [b].** Knowing I finished something I nearly talked myself out of.  
  **Verdict:** REAL +2.  
  **Creature/Core:** #39 Ambitious +1; #37 Patient +1.  
  **Relic/Private:** #41 Accountability +1; #45 Self-secure +1.
- **C [c].** Being able to say no without panicking about the bill.  
  **Verdict:** COMFORT +2.  
  **Creature/Core:** #13 Independent +2; #40 Content +1.  
  **Relic/Private:** #47 Boundary-holding +2; #45 Self-secure +1.
- **D [d].** A random Tuesday that feels like the life I meant to build.  
  **Verdict:** COMFORT +1; REAL +1.  
  **Creature/Core:** #40 Content +2; #17 Practical +1.  
  **Relic/Private:** #43 Reflective +1; #45 Self-secure +1.

### Q7. Your friend started after you and already passed you. Badly. First uncensored reaction?

- **A [a].** I congratulate them. Later I spend three days comparing my timeline.  
  **Verdict:** COMFORT +1; TALK +1.  
  **Creature/Core:** #31 Competitive +2; #3 Emotionally Intense +1.  
  **Relic/Private:** #48 Approval-seeking +1; #62 Self-referencing +1.
- **B [b].** Good for them. So... what did they figure out that I didn't?  
  **Verdict:** REAL +2.  
  **Creature/Core:** #32 Cooperative +1; #33 Curious +1; #39 Ambitious +1.  
  **Relic/Private:** #43 Reflective +2.
- **C [c].** I tell everyone I don't care. Then quietly shelve my own project.  
  **Verdict:** TALK +2; COMFORT +1.  
  **Creature/Core:** #35 Private +1; #6 Indirect +1.  
  **Relic/Private:** #50 Armored +2; #48 Approval-seeking +1.
- **D [d].** They did have help. Have I been refusing the help that's available to me?  
  **Verdict:** REAL +1; COMFORT +1.  
  **Creature/Core:** #26 Verify first +1; #17 Practical +1.  
  **Relic/Private:** #41 Accountability +1; #43 Reflective +2.

### Q8. Apparently can see the last 90 days of your calendar. Not your captions. What's the biggest surprise?

- **A [a].** How often my "no time" evenings somehow included three hours of scrolling.  
  **Verdict:** LAZY +3.  
  **Creature/Core:** #12 Comfort-seeking +2; #16 Let it play out +1.  
  **Relic/Private:** #56 Self-preserving +2; #41 Accountability +1.
- **B [b].** How much unglamorous work happened before I posted anything.  
  **Verdict:** REAL +2.  
  **Creature/Core:** #35 Private +2; #30 Serious +1; #39 Ambitious +1.  
  **Relic/Private:** #55 Duty-first +1.
- **C [c].** Progress, actually. Just less than the pace I promised myself.  
  **Verdict:** COMFORT +2; REAL +1.  
  **Creature/Core:** #39 Ambitious +1; #17 Practical +1.  
  **Relic/Private:** #43 Reflective +1; #41 Accountability +1.
- **D [d].** Fourteen saved tutorials and a project board with no actual project.  
  **Verdict:** TALK +2.  
  **Creature/Core:** #33 Curious +1; #1 Planner +1.  
  **Relic/Private:** No confident award.

### Q9. Month seven. The work is repetitive, nobody's watching, and you're bored. What gets you through?

- **A [a].** I check what progress is real and revise the next month.  
  **Verdict:** COMFORT +2; REAL +1.  
  **Creature/Core:** #17 Practical +2; #1 Planner +1; #26 Verify first +1.  
  **Relic/Private:** #43 Reflective +1.
- **B [b].** I'd still call it my goal. The work hasn't moved since month two.  
  **Verdict:** LAZY +3; TALK +1.  
  **Creature/Core:** #12 Comfort-seeking +2; #16 Let it play out +1.  
  **Relic/Private:** #56 Self-preserving +2.
- **C [c].** I show up. I don't have to enjoy every minute.  
  **Verdict:** REAL +2; COMFORT +1.  
  **Creature/Core:** #30 Serious +1; #37 Patient +2.  
  **Relic/Private:** #55 Duty-first +2; #43 Reflective +1.
- **D [d].** I start something different. For a week, it feels like I'm moving again.  
  **Verdict:** TALK +2; LAZY +1.  
  **Creature/Core:** #33 Curious +1; #2 Spontaneous +1.  
  **Relic/Private:** #56 Self-preserving +1; #44 Reactive +1.

### Q10. Five years. No shortcut. Nobody's impressed until it's done. Do you still want the thing you keep saying you want?

- **A [a].** I want to say yes, but the number of restart dates says otherwise.  
  **Verdict:** LAZY +3; TALK +1.  
  **Creature/Core:** #12 Comfort-seeking +2; #16 Let it play out +1.  
  **Relic/Private:** #56 Self-preserving +2; #41 Accountability +1.
- **B [b].** Yes, but I refuse to sacrifice everything else to prove I'm serious.  
  **Verdict:** COMFORT +2; REAL +1.  
  **Creature/Core:** #17 Practical +1; #1 Planner +1.  
  **Relic/Private:** #47 Boundary-holding +2; #61 Perspective-taking +1.
- **C [c].** Yes. Five years is going to pass anyway, and I'd rather finish than relive year one.  
  **Verdict:** REAL +3.  
  **Creature/Core:** #37 Patient +2; #39 Ambitious +2.  
  **Relic/Private:** #55 Duty-first +1; #45 Self-secure +1.
- **D [d].** I keep imagining the finish line and rewriting the middle so I won't have to live it.  
  **Verdict:** TALK +3.  
  **Creature/Core:** #18 Idealistic +2; #33 Curious +1.  
  **Relic/Private:** #56 Self-preserving +1; #43 Reflective +1.

## Four final owner-approved reveals — VERBATIM

The only displayed sections are, in order: title; THE VERDICT; THE PRIVATE READ; THE CALL-OUT; THE COST; TRY THIS; THE KICKER; YOUR TRAITS. The Kicker **must terminate with the italic “Apparently,” signature**. Exactly three display-only trait tags.

### REAL | YOU WANT IT FOR REAL

**THE VERDICT**

You don't just love the idea. You'll do the Tuesday.

**THE PRIVATE READ**

You can survive slow progress, public flops, and the stretch where nobody claps. Your drive is real. Just remember: the goal isn't to prove how exhausted you can get.

**THE CALL-OUT**

You're great at pushing. Are you as good at stopping?

**THE COST**

You could build a beautiful life and be too burned out to live it.

**TRY THIS**

Schedule recovery like you schedule effort. Both count.

**THE KICKER**

The vision board finally has receipts.

*Apparently, your dreams clock in even when the applause clocks out.*

**YOUR TRAITS**

Driven · Patient · Self-Directed

### COMFORT | YOU WANT IT, BUT COMFORT KEEPS WINNING

**THE VERDICT**

You want the upgrade. Your current routine would like to remain employed.

**THE PRIVATE READ**

Your ambition is real. So is your desire for rest, stability, and a life outside the hustle. That's healthy until every inconvenient step becomes a new negotiation.

**THE CALL-OUT**

Sometimes "protecting my peace" is a boundary. Sometimes it's a beautifully dressed excuse.

**THE COST**

A year of reasonable delays can still leave you exactly where you started.

**TRY THIS**

Pick one inconvenient step you'll repeat for 30 days. Keep the rest of your life.

**THE KICKER**

You don't need to suffer. You do need to show up.

*Apparently, your ambition keeps hitting snooze.*

**YOUR TRAITS**

Ambitious · Comfort-Loving · Selectively Consistent

### TALK | YOU TALK A GREAT GAME

**THE VERDICT**

Your goals have excellent branding. The execution team hasn't been hired.

**THE PRIVATE READ**

You know how the life should look, what you'll do first, and what you'll say when it works. The planning feels like progress. The unfinished work tells a different story.

**THE CALL-OUT**

Another new idea isn't always growth. Sometimes it's an exit from the boring middle.

**THE COST**

You can spend years being almost ready to become who you keep announcing.

**TRY THIS**

Choose one project. Finish one deliverable. Then tell people.

**THE KICKER**

Your potential is fully booked. Your follow-through isn't.

*Apparently, your dreams have a publicist, not a project manager.*

**YOUR TRAITS**

Visionary · Curious · Restart-Prone

### LAZY | LAZY. THERE, WE SAID IT.

**THE VERDICT**

You want the result. The effort keeps getting left on read.

**THE PRIVATE READ**

This isn't about rest, real responsibilities, or going at your own pace. Your answers point to a repeated pattern of choosing what's easier even when you have room to act.

**THE CALL-OUT**

You know the next step. You just keep assigning it to a future version of yourself.

**THE COST**

Your promises get bigger. Your actual progress stays put.

**TRY THIS**

Do 20 minutes of the least glamorous task today. Not research. The task.

**THE KICKER**

Motivation might not show up. Your hands still can.

*Apparently, your dream is on read.*

**YOUR TRAITS**

Comfort-Seeking · Capable · Stalled

## LAZY reachability: independent actual-engine confirmation

This approval was conditioned on LAZY being **realistically reachable** and not blocked by an impossible gate. On 2026-10-31, the proposed 40 answer verdict weights were fed to the actual imported \`scoreArchetypeQuiz\` implementation from \`src/data/quizzes/scoring.ts\`, with the proposed strict gate \`minSignals: 3\`, \`requiredGroups: [{ answers: ['q3-b','q8-a','q9-b','q10-a'], min: 3 }]\`, and original high-signal/tie configuration.

### Coherent behavior path, four of four signals

**Answers:** Q1D, Q2C, Q3B, Q4D, Q5D, Q6C, Q7C, Q8A, Q9B, Q10A.

Behavior story: waiting for an easier week, postponing the offer, repeated “next Monday,” downplaying a flop, choosing freedom over a title, pausing a project after comparison, losing time scrolling, admitting work has been stationary since month two, and repeated restart dates.

**Actual scoring engine:**
- REAL: 0
- COMFORT: 6
- TALK: 10
- **LAZY: 15 → WINNER**
- Qualifying high-confidence answers: Q3B, Q8A, Q9B, Q10A (4/4)

### Coherent behavior path, three of four signals

**Answers:** Q1D, Q2C, Q3B, Q4D, Q5D, Q6C, Q7C, Q8A, Q9B, Q10D.

This path changes only Q10 to preferring an imagined finish line to the actual middle work. This is consistent with the rest of the behavior pattern.

**Actual scoring engine:**
- REAL: 0
- COMFORT: 6
- TALK: 12
- **LAZY: 12 → WINNER by high-signal question tie-break**
- Qualifying high-confidence answers: Q3B, Q8A, Q9B (3/4)

### Exploratory distribution, not a user prediction

100,000 independent deterministic uniformly random 10-answer paths were scored with the same existing \`scoreArchetypeQuiz\` engine:

| Result | Wins | Simulated share |
|---|---:|---:|
| REAL | 37,538 | 37.54% |
| COMFORT | 24,595 | 24.59% |
| TALK | 34,442 | 34.44% |
| LAZY | 3,425 | 3.42% |

**Conclusion:** LAZY can win via realistic, thematically coherent choices while remaining appropriately rare. The distribution is NOT a forecast of real user behavior and not proof that every edge case is tested. The implementing engineer must rerun fixture paths after wiring the final definition and preserve this gate.

## Approved premium Private reveal contract

- Render the familiar punchy result **plus added insight**, not a stripped-down free experience.
- Standard visible order for all four results: TITLE, THE VERDICT, THE PRIVATE READ, THE CALL-OUT, THE COST, TRY THIS, THE KICKER ending in *Apparently,* signature, YOUR TRAITS.
- Use the current Apparently Private visual system: dark plum, celestial texture/light, readable type hierarchy, premium spacing, restrained motion, and accessible contrast. Do NOT restore the older huge solid-violet result card.
- Exactly three result trait tags, as approved above, not necessarily equal to the awarded numeric trait IDs. Tags are editorial labels and must never grant points.
- Keep sharing and standard next-quiz navigation; Private quiz navigation should lead to Private rather than Explore.
- No gendered respondent/partner assumptions.

## Implementation handoff for Claude (FUTURE, only when separately authorized)

1. Treat this document as **the single canonical owner-approved Quiz 2 content source**. The older library §1 and archived predecessor are historical only.
2. Reuse the established premium Private reveal template from locked Love Quiz 1. Do not reintroduce old THE READ walls of text, quizzes' fake score/mix percentages, or a different order of sections.
3. Replace all 10 question prompts, 40 choice wordings, result weights, and exact 4 reveals only after owner separately authorizes implementation. Preserve quiz ID and q1–q10 / a–d logical identities; protect old-vs-new semantic content versions.
4. Convert the approved Creature/Core and Relic/Private numeric awards into server-authoritative \`quiz_choice_trait_awards\` ONLY through separately reviewed and approved version-aware mapping activation; this quiz is still on HOLD in staged numeric migrations. Never award on a retake, never reinterpret historical answers based on reused choice keys.
5. Implement the explicitly approved LAZY gate (minimum 6 LAZY score, 3 of 4 specific high-confidence answers Q3B/Q8A/Q9B/Q10A, plus normal eligible-result winner decision). The current implementation's old \`minSignals:3\` alone is insufficient. Use \`requiredGroups\` or equivalent. Match the specified high-signal and fallback tie resolution.
6. Preserve all four actual-engine reachability and scoring fixture assertions above. Add coherent paths for the other three results plus mixed/boundary cases; no impossible or self-contradictory paths.
7. Validate the trait ID ledger and 40 answer mappings against the existing 64-trait catalog. Do not modify the locked Creative Bible or other approved quizzes without permission.
8. All application changes, database migrations, backfills, builds, commits, pushes, TestFlight, or production releases need a new explicit user instruction. Saving this editorial document alone authorizes **none** of them.

## Editorial provenance

On 2026-10-31 the owner said: “as long as lazy can realistically still win, all is approved.” This followed a complete 10-question, 40-answer rewrite with blended outcome weights, both Creature/Relic layer mappings, and four shorter premium reveals. The actual score engine was then run with the proposed gate: both a 4/4 and 3/4 coherent LAZY path produced LAZY as winner, and 3,425 of 100,000 random paths produced LAZY. This document freezes the approved version without enabling it in the app.
