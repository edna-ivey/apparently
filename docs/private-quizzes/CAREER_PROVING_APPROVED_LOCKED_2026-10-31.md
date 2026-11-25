# Apparently Private | Are You Ambitious... or Proving Something?

**Status:** LOCKED, owner-approved editorial replacement (2026-10-31). **NOT IMPLEMENTED.**
**Quiz ID:** `career-ambition-proving`
**Category:** Career & Ambition
**Canonical approval:** All ten questions, all forty answers, every result weight and numeric Creature/Relic award, four fully approved reveals, gates, ties, and the gender-inclusive/multi-voice editorial approach.
**Supersedes:** The previous §2 of `APPROVED_PRIVATE_QUIZZES.md`. Archived predecessor: `archive/CAREER_PROVING_PREVIOUS_LOCKED_VERSION.md`.
**Approval statement:** "Editorial decisions for Apparently Private: Quiz 3 APPROVED; Quiz 4 APPROVED. Lock and save only approved complete quizzes in canonical Apparently You project docs, archive their predecessors, and preserve implementation/deployment boundaries."

## Content and implementation contract

- This is the sole canonical **owner-approved creative content** for this quiz. Preserve the wording, punctuation, choice keys, four outcomes, reveal order, title, subtitle, and tag labels **verbatim**, including plain statements beside witty ones. The quiz narrator has personality; respondents do not all sound like the same narrator.
- Wording must stay **gender-inclusive, gender-expression-neutral, and usable by genderfluid users**. No gender identity or expression may be inferred or rewarded as a numeric personality trait.
- **Logical quiz ID:** `career-ambition-proving`; question IDs q1–q10, answer IDs a–d. This is an approved replacement of previous wording, so safeguard **semantic content version identity** in implementation. Do not apply new mappings retroactively to older answers with the same keys; preserve original first-completion credit across versions.
- **Verdict scores are separate from numeric personality evidence**. The four verdict families CLAP/SEEN/PROVE/PERFORM below are not traits. Creature = Core trait IDs 1–40; Relic = Private trait IDs 41–64, from the frozen catalog `supabase/migrations/20261028010000_personality_trait_catalog.sql`. Trait #35 Private is **Creature/Core**, despite its label. Empty award fields are intentional, not missing.
- **Results:** `nobody-clapped` = YOU'D STILL WANT IT IF NOBODY CLAPPED; `want-it-seen` = YOU WANT THE WIN... AND YOU WANT IT SEEN; `proving-something` = YOU'RE STILL TRYING TO PROVE SOMETHING; `performing-for` = WHO EXACTLY ARE WE PERFORMING FOR?
- **Gate:** PERFORM only eligible after at least **two** among Q1C, Q6D, Q10A, and at least **one** among Q3B, Q5C, Q9B, so at least 3 separate supporting questions. Winning still requires normal eligible-outcome comparison. A single recognition-loving answer must not make someone "performing."
- **Tie order:** highest eligible total, then high-signal contributions from Q1, Q3, Q5, Q6, Q9, Q10, then number of +2 primary selections, then CLAP → SEEN → PROVE → PERFORM. No close-second result. Ensure this precise tie semantics is implemented without approximating it.
- **Reveal display:** TITLE → THE VERDICT → THE PRIVATE READ → THE CALL-OUT → THE COST → TRY THIS → THE KICKER (short line plus separate italic *Apparently,* signature) → YOUR TRAITS (three **display-only** chips). Tags never grant personality points.
- Preserve premium design precedent from approved Love Quiz 1: familiar free-result emotional payoff plus Private depth. Do not restore a giant violet dev box.
- **HOLD:** This editorial lock grants **no permission** to change app code, databases, stored records, migrations, migrations' approvals, commits/pushes, TestFlight, or App Store. Implementation and production deployment must be separately authorized and checked. This user also requested that all Private quizzes and Build 22 ship in V1, but **editorial acceptance is not a database-deployment authorization**.

## Approved intro

**APPARENTLY PRIVATE · CAREER & AMBITION**

**ARE YOU AMBITIOUS... OR PROVING SOMETHING?**

**Success hits different when it has an audience.**

You can want success, recognition, and a little revenge. We're finding out who's actually driving.

*Choose what you'd really think or do. Your inspirational-caption version can sit this one out.*

**10 questions · About 3 minutes**

**CTA:** Expose me →

## Complete approved questions, answers, verdict weights, and numeric awards

**Key:** CLAP = nobody-clapped; SEEN = want-it-seen; PROVE = proving-something; PERFORM = performing-for. Creature/Core trait IDs: 1–40. Relic/Private trait IDs: 41–64. All + values are independent positive-only awards; never derive personality points from results.

### Q1. You land the dream opportunity. Nobody who ever underestimated you will hear about it. Does that change the win?

- **A [a].** "It still counts. Though I'd be lying if I said I didn't want to share the news."
  - **Verdict:** SEEN +2; CLAP +1
  - **Creature:** #19 Sentimental +1
  - **Relic:** No confident award
- **B [b].** Not really. I got the opportunity, not a press tour.
  - **Verdict:** CLAP +2
  - **Creature:** #40 Content +1
  - **Relic:** #45 Self-secure +2
- **C [c].** Honestly? A big part of the fantasy was imagining their reactions.
  - **Verdict:** PERFORM +3; SEEN +1
  - **Creature:** #31 Competitive +1
  - **Relic:** #48 Approval-seeking +3
- **D [d].** There's one specific person I would've liked to prove wrong. Just one.
  - **Verdict:** PROVE +2; SEEN +1
  - **Creature:** #28 Holds the Receipt +1; #31 Competitive +1
  - **Relic:** #48 Approval-seeking +2

### Q2. Someone you secretly compare yourself to announces a huge win. Your own life is going fine. What happens?

- **A [a].** I'm immediately wondering what they figured out that I haven't.
  - **Verdict:** PROVE +2; CLAP +1
  - **Creature:** #31 Competitive +1; #33 Curious +1
  - **Relic:** #43 Reflective +1
- **B [b].** Good for them. My plans haven't changed.
  - **Verdict:** CLAP +2
  - **Creature:** #40 Content +1
  - **Relic:** #45 Self-secure +1
- **C [c].** I'm happy for them. Also, when is it my turn to have something worth celebrating?
  - **Verdict:** SEEN +2; PROVE +1
  - **Creature:** #31 Competitive +1; #39 Ambitious +1
  - **Relic:** #48 Approval-seeking +1
- **D [d].** I start mentally explaining why they had it easier. Then I catch myself doing it.
  - **Verdict:** PROVE +2; PERFORM +1
  - **Creature:** #31 Competitive +1
  - **Relic:** #42 Defensiveness +1; #62 Self-referencing +2

### Q3. Four possible futures. You only get one. Which would you choose?

- **A [a].** Good income, control over my schedule, and no impressive title.
  - **Verdict:** CLAP +2
  - **Creature:** #13 Independent +2; #40 Content +1
  - **Relic:** #47 Boundary-holding +1
- **B [b].** A widely admired role, even if the day-to-day life is more demanding.
  - **Verdict:** PERFORM +2; SEEN +2
  - **Creature:** #39 Ambitious +1
  - **Relic:** #48 Approval-seeking +2
- **C [c].** Becoming exceptionally good at something most people won't understand.
  - **Verdict:** CLAP +2
  - **Creature:** #30 Serious +1; #17 Practical +1
  - **Relic:** #45 Self-secure +1
- **D [d].** Finishing the thing people said I couldn't, even if it takes years.
  - **Verdict:** PROVE +2; CLAP +1
  - **Creature:** #31 Competitive +1; #37 Patient +1
  - **Relic:** #55 Duty-first +1

### Q4. Which compliment would stay with you the longest?

- **A [a].** "I was wrong about what you could accomplish."
  - **Verdict:** PROVE +2
  - **Creature:** #28 Holds the Receipt +1
  - **Relic:** #48 Approval-seeking +2
- **B [b].** "We noticed how hard you worked for this."
  - **Verdict:** SEEN +2
  - **Creature:** #19 Sentimental +1
  - **Relic:** No confident award
- **C [c].** "What you built made things better for everybody here."
  - **Verdict:** CLAP +2
  - **Creature:** #17 Practical +1; #32 Cooperative +1
  - **Relic:** #57 Supportive +1
- **D [d].** "I honestly didn't think you'd get this far."
  - **Verdict:** PROVE +2; PERFORM +1
  - **Creature:** #31 Competitive +1; #28 Holds the Receipt +1
  - **Relic:** #48 Approval-seeking +2; #60 Keeps score +1

### Q5. An opportunity would give you excellent money, freedom, and work you enjoy. Unfortunately, the job title sounds painfully boring.

- **A [a].** I'd take it. Might need to get creative when somebody asks what I do, though. 😂
  - **Verdict:** SEEN +2; CLAP +1
  - **Creature:** #29 Playful +1; #17 Practical +1
  - **Relic:** No confident award
- **B [b].** Boring title, great life? Where do I sign?
  - **Verdict:** CLAP +2
  - **Creature:** #40 Content +2; #17 Practical +1
  - **Relic:** #45 Self-secure +1
- **C [c].** I might choose a more respected role, even if the hours were worse.
  - **Verdict:** PERFORM +2; SEEN +2
  - **Creature:** #39 Ambitious +1; #31 Competitive +1
  - **Relic:** #48 Approval-seeking +3
- **D [d].** I'd need the work to challenge me. What people call it doesn't matter.
  - **Verdict:** CLAP +2; PROVE +1
  - **Creature:** #18 Idealistic +1; #30 Serious +1
  - **Relic:** #45 Self-secure +1; #55 Duty-first +1

### Q6. Picture the moment you finally think, "I made it." What's happening?

- **A [a].** It's a Tuesday. Bills are handled. I'm not dreading tomorrow.
  - **Verdict:** CLAP +2
  - **Creature:** #40 Content +2; #17 Practical +1
  - **Relic:** #45 Self-secure +1
- **B [b].** Someone who doubted me finally has to admit I pulled it off.
  - **Verdict:** PROVE +2
  - **Creature:** #28 Holds the Receipt +1; #31 Competitive +1
  - **Relic:** #48 Approval-seeking +1
- **C [c].** My people are there celebrating with me. I wanted to share this.
  - **Verdict:** SEEN +2; CLAP +1
  - **Creature:** #14 Collaborative +1; #19 Sentimental +1
  - **Relic:** No confident award
- **D [d].** I walk into a room and people immediately know I've become somebody important.
  - **Verdict:** PERFORM +3; SEEN +1
  - **Creature:** #31 Competitive +1; #39 Ambitious +1
  - **Relic:** #48 Approval-seeking +3

### Q7. Someone who once underestimated you asks for career advice. What's your first reaction?

- **A [a].** Of course I'll help. And yes, the irony is delicious.
  - **Verdict:** SEEN +1; PROVE +1
  - **Creature:** #29 Playful +1; #28 Holds the Receipt +1
  - **Relic:** #57 Supportive +1
- **B [b].** I'd send them the resources that helped me. No need to revisit the past.
  - **Verdict:** CLAP +2
  - **Creature:** #32 Cooperative +2
  - **Relic:** #57 Supportive +2
- **C [c].** First, I'd want to hear them acknowledge how wrong they were about me.
  - **Verdict:** PROVE +2; PERFORM +1
  - **Creature:** #28 Holds the Receipt +2; #5 Direct +1
  - **Relic:** #60 Keeps score +2; #48 Approval-seeking +1
- **D [d].** They'd get honest advice. Including the parts nobody helped me figure out.
  - **Verdict:** PROVE +2
  - **Creature:** #5 Direct +1; #13 Independent +1
  - **Relic:** #58 Challenging +1

### Q8. You finally achieve something you've wanted for years. Three days later, the excitement is gone. Why?

- **A [a].** There's always a bigger target. If I slow down, I start questioning myself.
  - **Verdict:** PROVE +2
  - **Creature:** #39 Ambitious +1; #38 Urgent +1
  - **Relic:** #46 Reassurance-seeking +1
- **B [b].** I celebrated. Now I'm curious about the next challenge.
  - **Verdict:** CLAP +2
  - **Creature:** #33 Curious +2; #39 Ambitious +1
  - **Relic:** #63 Initiating +1
- **C [c].** The announcement didn't get the reaction I expected. Maybe the next one will.
  - **Verdict:** SEEN +2; PROVE +1
  - **Creature:** #31 Competitive +1; #7 Vibe checker +1
  - **Relic:** #48 Approval-seeking +2
- **D [d].** That wouldn't be me. I want to enjoy what I've earned for a while.
  - **Verdict:** CLAP +2
  - **Creature:** #40 Content +2; #19 Sentimental +1
  - **Relic:** #43 Reflective +1

### Q9. Which failure would bother you the longest?

- **A [a].** Getting the impressive title and realizing I hate the actual life.
  - **Verdict:** CLAP +2
  - **Creature:** #17 Practical +1; #40 Content +1
  - **Relic:** #43 Reflective +2
- **B [b].** Failing publicly after telling everybody what I was about to accomplish.
  - **Verdict:** SEEN +2; PERFORM +2
  - **Creature:** #7 Vibe checker +1
  - **Relic:** #48 Approval-seeking +2
- **C [c].** Watching an old rival succeed at the thing I couldn't finish.
  - **Verdict:** PROVE +2
  - **Creature:** #31 Competitive +2
  - **Relic:** #60 Keeps score +1
- **D [d].** Never finding out whether I could have done something I truly cared about.
  - **Verdict:** CLAP +2
  - **Creature:** #39 Ambitious +1
  - **Relic:** No confident award

### Q10. You finally get everything you were chasing. The person whose approval mattered most says absolutely nothing. What next?

- **A [a].** That would honestly make me wonder what the point of all that work was.
  - **Verdict:** PERFORM +3; PROVE +1
  - **Creature:** #3 Emotionally Intense +1
  - **Relic:** #46 Reassurance-seeking +2; #48 Approval-seeking +3
- **B [b].** I'd be hurt. Then I'd celebrate with the people who actually showed up.
  - **Verdict:** SEEN +2; PROVE +1
  - **Creature:** #19 Sentimental +1; #14 Collaborative +1
  - **Relic:** #49 Vulnerable +1
- **C [c].** The silence would sting. But I'd still have the life I chose.
  - **Verdict:** CLAP +2
  - **Creature:** #40 Content +1; #17 Practical +1
  - **Relic:** #45 Self-secure +2; #43 Reflective +1
- **D [d].** I'd start working toward something bigger. Maybe that would finally change their mind.
  - **Verdict:** PROVE +2
  - **Creature:** #39 Ambitious +1; #38 Urgent +1
  - **Relic:** #50 Armored +1; #46 Reassurance-seeking +1

## Four final approved premium results — verbatim

### CLAP | YOU'D STILL WANT IT IF NOBODY CLAPPED

**THE VERDICT**

You actually want the life. The announcement is just a nice accessory.

**THE PRIVATE READ**

Your satisfaction comes from what you build, learn, earn, or experience. Recognition feels good, but it isn't carrying the whole dream. That's a freedom plenty of people don't realize they're missing.

**THE CALL-OUT**

Being internally driven doesn't automatically mean you're good at celebrating yourself.

**THE COST**

You can spend so much time climbing that every finished goal becomes yesterday's news.

**TRY THIS**

Name one thing you've already achieved that deserves a proper celebration.

**THE KICKER**

Nobody has to clap. But occasionally, you should.

*Apparently, your ambition doesn't need an audience. Just a purpose.*

**YOUR TRAITS**

Self-Directed · Grounded · Quietly Ambitious

### SEEN | YOU WANT THE WIN... AND YOU WANT IT SEEN

**THE VERDICT**

You want the achievement. And yes, you'd also appreciate a little applause. 😂

**THE PRIVATE READ**

You care about the work, but being acknowledged makes it sweeter. That's human. The danger starts when being seen becomes part of what makes a goal worth pursuing.

**THE CALL-OUT**

Wanting people to celebrate with you is different from needing them to be impressed.

**THE COST**

Your confidence can become dependent on reactions you don't control.

**TRY THIS**

Celebrate your next accomplishment privately before telling anyone.

**THE KICKER**

The spotlight is fun. It shouldn't be your boss.

*Apparently, your ambition enjoys a standing ovation.*

**YOUR TRAITS**

Ambitious · Recognition-Motivated · Socially Aware

### PROVE | YOU'RE STILL TRYING TO PROVE SOMETHING

**THE VERDICT**

Oh. Somebody from your past is still sitting in the boardroom. 😂

**THE PRIVATE READ**

Your ambition is real, but so is that little file labeled **WATCH ME**. Maybe someone doubted you, rejected you, or made you feel behind. Proving them wrong became part of the fuel.

**THE CALL-OUT**

Spite can start an impressive career. It probably shouldn't be CEO.

**THE COST**

The people you claim not to care about can end up deciding when you're allowed to feel successful.

**TRY THIS**

Ask: "Would I still want this if they never found out?"

**THE KICKER**

Revenge makes a dramatic vision board. Peace makes a better life.

*Apparently, you've been winning arguments nobody knows are happening.*

**YOUR TRAITS**

Driven · Competitive · Validation-Sensitive

### PERFORM | WHO EXACTLY ARE WE PERFORMING FOR?

**THE VERDICT**

You may have built an entire success plan for an audience that doesn't pay rent. 👀

**THE PRIVATE READ**

Some of your goals appear designed to look impressive before they feel meaningful. The title, the lifestyle, the story. You've considered who would notice. Have you considered whether you'd enjoy living it?

**THE CALL-OUT**

A successful-looking life isn't automatically a successful-feeling life.

**THE COST**

You could spend years maintaining achievements you wouldn't have chosen without witnesses.

**TRY THIS**

Take one major goal and remove every imagined reaction. Would you still choose it?

**THE KICKER**

The audience can go home. You're the one who has to live there.

*Apparently, your dream has a seating chart.*

**YOUR TRAITS**

Image-Conscious · Achievement-Focused · Approval-Seeking

## Independently tested scoring and reachability (pre-implementation)

The proposed verdict weights and eligible-result gate were run against the actual `scoreArchetypeQuiz` implementation, using the locked answer IDs.

- CLAP path: Q1B, Q2B, Q3B, Q4B, Q5A, Q6B, Q7B, Q8B, Q9D, Q10C. Winner: `nobody-clapped`.
- SEEN path: Q1A, Q2C, Q3B, Q4B, Q5A, Q6C, Q7A, Q8C, Q9B, Q10B. Winner: `want-it-seen`.
- PROVE path: Q1D, Q2A, Q3D, Q4A, Q5D, Q6B, Q7C, Q8A, Q9D, Q10D. Winner: `proving-something`.
- PERFORM path: Q1C, Q2D, Q3B, Q4D, Q5C, Q6D, Q7C, Q8C, Q9B, Q10A. Winner: `performing-for` with 18 PERFORM vs 10 SEEN, 8 PROVE, 0 CLAP.

**All four winning paths were verified** against the actual scoring function. A separate 100,000-answer uniformly random simulation (reachability, not real-population prediction) returned CLAP 46.70%, SEEN 16.71%, PROVE 30.23%, PERFORM 6.36%. The harsh result is attainable but requires repeated audience-centered evidence.

## Engineering handoff, only after separate approval

- Reconcile UI copy and the above outcome/vote weights against `src/data/quizzes/career-proving.ts` when the owner explicitly authorizes implementation, preserving prior historical content meaning and old saved results/shares.
- Validate all numeric IDs against frozen catalog before proposing any database award migration. Held premium quiz mappings must not become active merely because this creative document is locked.
- Keep first-completion credit only once per logical quiz across versions, no retake score inflation.
- Run normal result, harsh-gate, tie, history, share, accessibility, and iPhone smoke tests. No source change, migration, production write, commit, push, build, or deploy authorized by this document alone.
