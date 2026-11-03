# Apparently Private | What Do People Keep Getting Wrong About You?

**Status:** LOCKED, owner-approved editorial replacement (2026-10-31). **NOT IMPLEMENTED.**
**Quiz ID:** `hidden-you-wrong`
**Category:** Hidden You
**Canonical approval:** All ten questions, forty answer choices, every verdict weight and numeric Creature/Relic award, four complete premium reveals, result gates, and tie rules.
**Supersedes:** `APPROVED_HIDDEN_YOU.md`. Archived predecessor: `archive/HIDDEN_YOU_PREVIOUS_LOCKED_VERSION.md`.
**Approval statement:** "Editorial decisions for Apparently Private: Quiz 3 APPROVED; Quiz 4 APPROVED. Lock and save only approved complete quizzes in canonical Apparently You project docs, archive their predecessors, and preserve implementation/deployment boundaries."

## Locked creative, scoring, and implementation contract

- The approved final content below is verbatim. Do not rewrite question wording, answer wording, punctuation, reveal copy, or section order without the owner's renewed approval. Its answer voices deliberately vary across direct, plainspoken, restrained, exhausted, playful, and candid respondents.
- Gender-inclusive and gender-expression-neutral; suitable for genderfluid users without assigning personality characteristics to gender identity, gender presentation, facial features, race, or protected personal attributes.
- Maintain a clear distinction from the Style & Vibe quiz: this quiz is about **being misunderstood**, not determining whether someone is inherently intimidating.
- Quiz ID `hidden-you-wrong`; stable logical question IDs q1–q10 and answer IDs a–d; any replacement MUST have immutable semantic content/scoring version protection. Never reinterpret old q1a etc. using changed answer meanings or mappings; first completion credit is once per logical quiz across versions.
- Verdict scores are separate from permanent numeric personality awards. **HIDDEN** = `hidden-feeling`; **FACE** = `face`; **FINE** = `fine`; **ATTENTION** = `attention`. Neither results nor display-only trait chips generate numeric awards. Creature/Core trait IDs 1–40, Relic/Private 41–64. **Trait #35 "Private" is Core/Creature.**
- Sparse awards are intentional. **Question 9 A/B/C/D gives absolutely NO Creature and NO Relic numeric awards**, because it asks directly which self-identified misunderstanding is relatable, not what behavior proves a trait. Being judged intimidating based on appearance/face alone does NOT prove guardedness or another identity trait.
- **FINE gate:** at least 3 FINE-supporting answers overall AND at least 1 strong signal among Q2A, Q3A, Q7A, Q9D, Q10B.
- **ATTENTION gate:** at least 3 ATTENTION-supporting answers overall AND at least 1 strong signal among Q3D, Q4A, Q5C, Q9C, Q10A.
- HIDDEN and FACE are ungated.
- **Tie order:** highest eligible total, then high-signal contributions Q3, Q5, Q7, Q9, Q10, then count full +3 selections, then Q10 as the final self-contribution discriminator, then HIDDEN → FACE → FINE → ATTENTION. No blended result. The Q10 tie step may require a carefully tested implementation adaptation beyond the current generic tie engine.
- **Reveal order:** TITLE → THE VERDICT → THE PRIVATE READ → THE CALL-OUT → THE COST → TRY THIS → THE KICKER (one short line, then a separate italic *Apparently,* signature) → YOUR TRAITS (three display-only chips).
- Premium Private presentation follows Quiz 1's familiar free-result-style emotional payoff + added Private depth, not a giant monochrome dev panel.
- **HOLD:** This editorial lock grants **no permission** for app code changes, database or migration changes, migration approval, data reconciliation, commits/pushes, EAS builds, TestFlight releases, or App Store submissions. Owner separately wants all seven Private quizzes and Build 22 in V1; separate implementation/deployment authorization is still required.

## Final approved introduction

**APPARENTLY PRIVATE · HIDDEN YOU**

**WHAT DO PEOPLE KEEP GETTING WRONG ABOUT YOU?**

**People have a whole story about you. Cute. Let's see if it's accurate.**

Sometimes they're completely wrong. Sometimes you're accidentally helping.

*Answer as the person people actually deal with, not the person narrating your good intentions.*

**10 questions · About 3 minutes**

**CTA:** Read me →

## Complete approved 10 questions, all 40 choices, verdict weights and numeric personality awards

**Key:** HIDDEN = hidden-feeling, FACE = face, FINE = fine, ATTENTION = attention. Creature = Core numeric ID 1–40; Relic = Private numeric ID 41–64. Deliberately blank awards must remain blank.

### Q1. You walk into a room where you barely know anybody. What's the most familiar experience?

- **A [a].** Somebody asks why I look annoyed. I'm literally looking for somewhere to put my coat.
  - **Verdict:** FACE +2
  - **Creature:** No confident award
  - **Relic:** No confident award
- **B [b].** I usually find one person I feel comfortable talking to. That's enough for me.
  - **Verdict:** HIDDEN +1
  - **Creature:** #35 Private +1
  - **Relic:** No confident award
- **C [c].** Before introductions are over, I've noticed who's uncomfortable and who's being left out.
  - **Verdict:** ATTENTION +2
  - **Creature:** #7 Vibe checker +2; #33 Curious +1
  - **Relic:** #61 Perspective-taking +1
- **D [d].** Small talk? Fine. Smiling? Fine. Social battery? Approximately 2%.
  - **Verdict:** FINE +1
  - **Creature:** #35 Private +1; #4 Even-Keeled +1
  - **Relic:** #50 Armored +1

### Q2. Someone close to you asks, "Are you okay?" You're really not. What comes out?

- **A [a].** "That's sweet of you. Just a lot going on." Then I change the subject.
  - **Verdict:** FINE +2
  - **Creature:** #24 Peacekeeping +1; #35 Private +1
  - **Relic:** #50 Armored +2
- **B [b].** They asked. They're getting the whole story, including the part nobody noticed.
  - **Verdict:** ATTENTION +2
  - **Creature:** #5 Direct +1; #7 Vibe checker +1
  - **Relic:** #49 Vulnerable +2
- **C [c].** "Wait, I LOOK upset?" I thought this was my normal face.
  - **Verdict:** FACE +1
  - **Creature:** No confident award
  - **Relic:** No confident award
- **D [d].** "I'm fine." But I really wish they'd stay and ask one more time.
  - **Verdict:** HIDDEN +2
  - **Creature:** #6 Indirect +2; #35 Private +1
  - **Relic:** #46 Reassurance-seeking +1; #50 Armored +1

### Q3. Which piece of feedback have you heard more than once?

- **A [a].** "You don't ask for help until things are already falling apart."
  - **Verdict:** FINE +2
  - **Creature:** #13 Independent +2
  - **Relic:** #50 Armored +1
- **B [b].** "I thought you were mad at me before we even spoke."
  - **Verdict:** FACE +2
  - **Creature:** No confident award
  - **Relic:** No confident award
- **C [c].** "I can never tell when something is bothering you."
  - **Verdict:** HIDDEN +2
  - **Creature:** #35 Private +2
  - **Relic:** #50 Armored +1
- **D [d].** "How did you even notice that? The rest of us missed it."
  - **Verdict:** ATTENTION +2
  - **Creature:** #7 Vibe checker +2
  - **Relic:** No confident award

### Q4. Someone's tone changes halfway through a conversation. What do you do?

- **A [a].** "Did something just change? I want to make sure we're okay."
  - **Verdict:** ATTENTION +2
  - **Creature:** #7 Vibe checker +2; #5 Direct +2
  - **Relic:** #63 Initiating +1
- **B [b].** I don't decode sighs. If there's a problem, they can tell me.
  - **Verdict:** FACE +1
  - **Creature:** #8 Face value +1; #5 Direct +1
  - **Relic:** #47 Boundary-holding +1
- **C [c].** Maybe something I said landed wrong. I'll wait and see before deciding.
  - **Verdict:** FINE +1
  - **Creature:** #26 Verify first +2
  - **Relic:** #43 Reflective +1
- **D [d].** I notice it, get a little quieter, and wait for the mood to pass.
  - **Verdict:** HIDDEN +2
  - **Creature:** #24 Peacekeeping +2; #6 Indirect +1
  - **Relic:** #50 Armored +1

### Q5. Someone says something that genuinely hurts you. What happens next?

- **A [a].** I pull back. If they pay attention, they'll figure out something's wrong.
  - **Verdict:** HIDDEN +2
  - **Creature:** #6 Indirect +2; #35 Private +1
  - **Relic:** #50 Armored +1
- **B [b].** I'll talk about it. Just not until I've finished what needs doing and calmed down.
  - **Verdict:** FINE +2
  - **Creature:** #37 Patient +1; #30 Serious +1
  - **Relic:** #43 Reflective +2
- **C [c].** "That isn't what you said yesterday." I don't mind having an uncomfortable conversation.
  - **Verdict:** ATTENTION +2
  - **Creature:** #5 Direct +2; #7 Vibe checker +1; #23 Conflict-forward +1
  - **Relic:** #58 Challenging +1
- **D [d].** I address it plainly. Later someone tells me I sounded angry. I wasn't.
  - **Verdict:** FACE +1
  - **Creature:** #5 Direct +2
  - **Relic:** No confident award

### Q6. Someone tells you, "You're intimidating." What's your first honest response?

- **A [a].** "I've heard that before." Maybe I could sound a little less like a performance review.
  - **Verdict:** FACE +2
  - **Creature:** No confident award
  - **Relic:** #43 Reflective +1
- **B [b].** "Is it because I don't explain myself much? I can work on that."
  - **Verdict:** HIDDEN +1
  - **Creature:** #35 Private +1; #5 Direct +1
  - **Relic:** #43 Reflective +1
- **C [c].** "Was that before or after I pointed out the thing nobody wanted to discuss?"
  - **Verdict:** ATTENTION +1
  - **Creature:** #5 Direct +2; #7 Vibe checker +1
  - **Relic:** #58 Challenging +1
- **D [d].** "Oh, no, we're good!" Meanwhile, I'm too exhausted to explain anything.
  - **Verdict:** FINE +1
  - **Creature:** #35 Private +2; #24 Peacekeeping +1
  - **Relic:** #50 Armored +2

### Q7. Your entire week is falling apart. What can most people tell?

- **A [a].** Deadlines met. Messages answered. Cheerful "all done!" I'm barely holding it together.
  - **Verdict:** FINE +2
  - **Creature:** #30 Serious +1; #35 Private +1
  - **Relic:** #55 Duty-first +2; #50 Armored +1
- **B [b].** One trusted person knows everything. Everyone else gets the abbreviated version.
  - **Verdict:** HIDDEN +2
  - **Creature:** #35 Private +2
  - **Relic:** #47 Boundary-holding +1; #49 Vulnerable +1
- **C [c].** They think I'm in a bad mood. I'm actually trying not to cry.
  - **Verdict:** FACE +1
  - **Creature:** #35 Private +1
  - **Relic:** #50 Armored +1
- **D [d].** Somehow I'm still noticing who else is struggling and checking on them.
  - **Verdict:** ATTENTION +1
  - **Creature:** #7 Vibe checker +1; #14 Collaborative +1
  - **Relic:** #57 Supportive +2

### Q8. Somebody makes a comment that might be a little shady. Your reaction?

- **A [a].** "Okay." Apparently that sounded like a threat. It wasn't.
  - **Verdict:** FACE +1
  - **Creature:** No confident award
  - **Relic:** No confident award
- **B [b].** "What did you mean by that?" If it's nothing, great. If not, now we know.
  - **Verdict:** ATTENTION +2
  - **Creature:** #5 Direct +2; #26 Verify first +1
  - **Relic:** #58 Challenging +1; #53 Tactful +1
- **C [c].** I change the subject. I'll think about it later, privately.
  - **Verdict:** HIDDEN +1
  - **Creature:** #35 Private +1; #24 Peacekeeping +1
  - **Relic:** #43 Reflective +1
- **D [d].** Not today. I have bigger problems than somebody's possibly weird comment.
  - **Verdict:** FINE +1
  - **Creature:** #16 Let it play out +1
  - **Relic:** #56 Self-preserving +1

### Q9. Which misunderstanding gets under your skin the most?

- **A [a].** People think my face is a review of their entire personality.
  - **Verdict:** FACE +3
  - **Creature:** No award
  - **Relic:** No award
- **B [b].** They assume my silence means I don't care.
  - **Verdict:** HIDDEN +3
  - **Creature:** No award
  - **Relic:** No award
- **C [c].** They think asking questions means I'm trying to start an argument.
  - **Verdict:** ATTENTION +3
  - **Creature:** No award
  - **Relic:** No award
- **D [d].** They assume that because I'm handling everything, I'm not struggling.
  - **Verdict:** FINE +3
  - **Creature:** No award
  - **Relic:** No award

**Q9 RULE: ZERO numeric Creature and Relic awards for ALL four answers.** Recognizing a misunderstanding is not independent evidence of actual personality behavior.

### Q10. They're sometimes getting you wrong. But which part might actually be your contribution?

- **A [a].** Once I notice a pattern, I can keep pressing even when the conversation needs a break.
  - **Verdict:** ATTENTION +3
  - **Creature:** #7 Vibe checker +2; #38 Urgent +1
  - **Relic:** #58 Challenging +1
- **B [b].** I automatically say "I'm good" even when I wish somebody would help.
  - **Verdict:** FINE +3
  - **Creature:** #35 Private +2; #13 Independent +1
  - **Relic:** #50 Armored +2
- **C [c].** Sometimes I hint at what I need instead of saying it. Then I'm disappointed.
  - **Verdict:** HIDDEN +3
  - **Creature:** #6 Indirect +2; #35 Private +1
  - **Relic:** #46 Reassurance-seeking +1
- **D [d].** My tone doesn't always communicate the kindness I actually feel.
  - **Verdict:** FACE +3
  - **Creature:** #5 Direct +1
  - **Relic:** #54 Blunt +2; #43 Reflective +1

## Four final approved premium reveals — verbatim

### HIDDEN | THEY THINK YOU DON'T CARE.

**THE VERDICT**

Oh, you care. You've just given everybody access to approximately 3% of the evidence. 😂

**THE PRIVATE READ**

You feel more than you show. You can miss somebody without calling, feel hurt without explaining, and love deeply without making a presentation about it. People mistake your privacy for indifference.

**THE CALL-OUT**

You can't keep your feelings password-protected and expect everybody to know what's inside.

**THE COST**

People close to you may feel less important than they actually are.

**TRY THIS**

Tell someone one thing you usually assume they already know.

**THE KICKER**

Feelings aren't automatically communication.

*Apparently, your heart needs subtitles.*

**YOUR TRAITS**

Private · Emotionally Selective · Hard to Read

### FACE | APPARENTLY, YOUR FACE HAS A REPUTATION.

**THE VERDICT**

You walked into the room. That was apparently the incident. 😭

**THE PRIVATE READ**

People see your quiet expression or direct delivery and start writing fictional backstories. Angry. Judgmental. Intimidating. Meanwhile, you may have been thinking about dinner. You're not required to perform constant warmth, but your presentation can affect how others approach you.

**THE CALL-OUT**

You don't have to fake sweetness. But pretending your delivery has no impact isn't helping.

**THE COST**

People may avoid approaching you before discovering you'd actually welcome them.

**TRY THIS**

When you like somebody, make it a little easier for them to tell.

**THE KICKER**

Your face is giving reviews you never wrote.

*Apparently, your resting face has its own publicist.*

**YOUR TRAITS**

Reserved · Direct · Frequently Misread

### FINE | EVERYBODY THINKS YOU'RE FINE.

**THE VERDICT**

Of course they do. Your entire life has excellent customer service. 👏

**THE PRIVATE READ**

You handle things, show up, make jokes, and keep everybody moving. Because you're capable, people assume the load isn't heavy. They don't always see the exhaustion behind the performance.

**THE CALL-OUT**

If every "Are you okay?" gets an automatic "I'm good," people will eventually believe you.

**THE COST**

You can become deeply loved while still feeling strangely unsupported.

**TRY THIS**

Ask for help while the problem is a four, not a forty-seven.

**THE KICKER**

Competence isn't proof you don't need care.

*Apparently, your strength could use a support team.*

**YOUR TRAITS**

Responsible · Self-Reliant · Quietly Overloaded

### ATTENTION | THEY CALL IT "TOO MUCH." YOU CALL IT PAYING ATTENTION.

**THE VERDICT**

You noticed the shift. The pause. The weird little tone. Unfortunately, everyone else would like fewer incident reports. 👀

**THE PRIVATE READ**

You pick up on things people miss, and sometimes you're absolutely right. But spotting a detail doesn't always mean it needs a confrontation or a full investigation.

**THE CALL-OUT**

Being observant doesn't make every interpretation correct. That's the annoying part.

**THE COST**

When every concern gets equal urgency, people may stop recognizing the genuinely important ones.

**TRY THIS**

Before reacting, ask: "Is this a pattern, a problem, or just a moment?"

**THE KICKER**

Keep the radar. Lower the siren occasionally.

*Apparently, your intuition has a case-management department.*

**YOUR TRAITS**

Perceptive · Intense · Detail-Oriented

## Independent result reachability check (prior to implementation)

The exact verdict weights above, with FINE and ATTENTION gates, were independently scored using the actual `scoreArchetypeQuiz` function.

- HIDDEN winner path: Q1B, Q2D, Q3C, Q4D, Q5A, Q6B, Q7B, Q8C, Q9B, Q10C. Winner `hidden-feeling`, 19 points.
- FACE winner path: Q1A, Q2C, Q3B, Q4B, Q5D, Q6A, Q7C, Q8A, Q9A, Q10D. Winner `face`, 17 points.
- FINE winner path: Q1D, Q2A, Q3A, Q4C, Q5B, Q6D, Q7A, Q8D, Q9D, Q10B. Winner `fine`, 18 points and gate met.
- ATTENTION winner path: Q1C, Q2B, Q3D, Q4A, Q5C, Q6C, Q7D, Q8B, Q9C, Q10A. Winner `attention`, 20 points and gate met.

**All four paths passed**. An independent 100,000-uniform-random-choice simulation produced HIDDEN 27.85%, FACE 21.14%, FINE 23.26%, ATTENTION 27.75%. That is an exploratory reachability check, not a real-world forecast.

**Critical edge case for implementation:** The approved Q10-specific tie step cannot be silently ignored if the generic engine does not natively implement it; test it directly after implementation.

## Engineering handoff (future, only with separate authorization)

- Use this document as the sole canonical content source for the new `hidden-you-wrong` content version and mappings. Archive is historical only.
- Preserve old answers with their original meanings, old saved reveals/shares, and original first-completion identity; never re-score older keys against revised meaning.
- Verify all 40 answers and traits against the frozen 64 numeric traits. Q9 has ZERO permanent awards.
- Implement the precise two confidence gates and all tie breakers. Test coherent all-four-winner paths, close ties, retakes, historical records, sharing, subscriber access, app accessibility, and device layout.
- No app/database/migration/commit/push/build/deployment action is authorized by this editorial lock alone.
