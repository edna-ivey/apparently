# Quiz 01: How petty are you actually? | LOCKED CREATIVE REVIEW
Approved to lock by user on 2026-10-22. **Editorial specification, NOT implemented code.** No source code, migrations, deployment, or production changes made. Current quiz: `src/data/quizzes/petty.ts`. Current V2 awards: `src/data/quiz-pole-awards/petty.ts`.

## Policy for all 22 quizzes
Exactly TWO review rounds per quiz: (1) ALL questions, answer choices, quiz-specific score, and per-answer Core personality pole mappings together; (2) ALL result reveals together. Then lock and document. The petty score is NOT a personality trait. Personality awards belong **only to individual answers**, never result bands. Remove/disable legacy `resultBands[].profileSignals` during a separately authorized implementation, carefully testing the live V1/V2 paths. Reveals contain title, two hero lines, body, kicker, three descriptive tags. Tags are not personality evidence. Evaluate all 40 Core poles; use multiple supported signals (+1/+2/+3), without defaulting to the same handful. Respect canonical pole labels/polarities. No code edits authorized yet.

## Round 1: locked editorial answer set and proposed pole mapping
Values below are **pole award points**; where scores are specified they are quiz-specific petty scores, not personality evidence. Existing questions/answers are retained except explicit changes below.

### Q1: They reply “k” after you sent a whole paragraph.
A They’re probably busy. → Forgiving +2, Trust First +1.
B Oh, we’re doing tone? Bet. → Conflict-Forward +2, Emotionally Intense +1 (user requested, avoid excessive Vibe Checker).
C I’m sending “??” because what was THAT? → Direct +2, Vibe Checker +1.
D I notice. One eyebrow definitely goes up. → Vibe Checker +1, Let It Play Out +1 (user requested).
Petty scores A0 B3 C2 D1.

### Q2: Someone who’s been annoying you asks, “Does this outfit look good?”
A I ask why they're suddenly seeking my fashion expertise. → Holds the Receipt +2, Direct +1; petty 2.
B I finally have a chance to be honest about those shoes. → Holds the Receipt +2, Direct +2, Playful +1, Competitive +1, Conflict-Forward +1; petty 3.
C I find one nice thing to say. → Indirect +2, Peacekeeping +1; petty 1.
D Their outfit is unrelated to their crimes. → Forgiving +2; petty 0.
User approved revising Q2 and asked what petty behavior maps to in the canonical trait system; B was recommended as a more specific petty behavior. User explicitly approved exact Q2A and Q2B wording on 2026-10-22.

### Q3: Someone who owes you money posts brunch.
A I clock it. Quietly. → Holds the Receipt +2; petty 1.
B I comment, “Looks delicious. So does getting my money back.” → Direct +2, Conflict-Forward +2, Playful +1; petty 3. **User explicitly approved 3-point petty comment.**
C “Cute. Now Cash App me.” → Direct +3, Conflict-Forward +2; petty 2.
D I keep scrolling. → Peacekeeping +2, Let It Play Out +1; petty 0.

### Q4: Someone cuts the line like you don’t exist.
A Let it go. I have somewhere to be. → Even-Keeled +3, Cooperative +1, Patient +1 (user requested), plus Peacekeeping +2.
B “Excuse me. The line starts back there.” → Rule-Oriented +2 (user requested), Direct +2.
C My face says everything. → Indirect +2.
D Congratulations. The entire line now knows what you did. → Emotionally Intense +3 (user requested), Conflict-Forward +2.
Approved petty scores A0 B1 C1 D3. User explicitly approved Q4B score **1** (replacing original 2) on 2026-10-22. Preserve user's A Cooperative/Patient mapping.

### Q5: Your ex’s new person watches your story.
A Noted. → Vibe Checker +1, Let It Play Out +1.
B I'm happy over here. They can watch whatever they want. → Even-Keeled +2, Content +3; **remove Hands-Off** (explicit user request).
C Oh, you came to LOOK? Let me post something worth watching. → Spontaneous +1, Direct +2, Adventurous +1, Conflict-Forward +1, Playful +2, Competitive +1, Open +3, Urgent +1. **User explicitly said KEEP ALL these mappings, even where assistant questioned them.**
D Suddenly my next story needs better lighting. → Competitive +2; original Control +2 may remain.
User explicitly approved the assistant's rewritten B/C answers. Petty scores A1 B0 C3 D2.

### Q6: The group chat ignored your message, then started talking about something else.
A Cool. I’m unavailable for the next 24 business hours. → Holds the Receipt +2, Control +2; petty 3.
B Rude. Anyway. → Even-Keeled +2 (NOT invented "Calm"); petty 1.
C I genuinely do not care. → Even-Keeled +2, Content +1 (user request); petty 0.
D I’m not repeating myself. Scroll up. → Direct +2, Conflict-Forward +1 (user request); petty 2.

### Q7: They return something they borrowed... damaged.
A Congrats. Borrowing privileges revoked. → Control +2, Holds the Receipt +2; petty 2.
B I tell them it's damaged and ask how we're fixing it. → Direct +3, Serious +2; petty 1. **User explicitly approved exact replacement wording.**
C Stuff happens. → Forgiving +3, Peacekeeping +2 (user request); petty 0.
D I’m sending photos and replacement links. → Holds the Receipt +2, Verify First +2; petty 3.

### Q8: Finish the sentence: “I forgive...”
A ...who? Be specific. → Holds the Receipt +3; petty 3.
B ...pretty easily. → Forgiving +3; petty 0.
C ...but the screenshot lives forever. → Holds the Receipt +3; petty 2.
D ...eventually. → Forgiving +2, Patient +1; petty 1.
User requested Q8 revision but accepted the original wording and these mappings when locking.

## Round 2: FULL REVEALS APPROVED VERBATIM
All four result bands and their descriptive tags approved unchanged. **NO RESULT-LEVEL PERSONALITY AWARDS.**

### 0–6: MOSTLY UNBOTHERED
You really do let things go.
Suspicious, but admirable.

You tend to choose peace over proving a point. You notice more than people probably realize, but most things simply are not worth your energy.

Your group chat may have questions.

Tags: Easygoing | Measured | Low-drama

### 7–12: SELECTIVELY PETTY
You’re not petty.
You’re specific.

Most things get a pass. But when something hits the right nerve, suddenly you have principles, a memory, and excellent documentation.

Honestly, this feels reasonable.

Tags: Observant | Boundary-aware | Selective

### 13–18: QUIETLY CALCULATED
You don’t react to everything.
You file it away.

You usually know exactly what happened, exactly who did it, and exactly how much energy the situation deserves. You may not make a scene, but please believe the information has been retained.

Silence should not be confused with amnesia.

Tags: Strategic | Observant | Controlled

### 19–24: PETTY WITH PURPOSE
You believe actions have consequences.
Sometimes the consequence is you.

You are not looking for drama everywhere. But when the occasion presents itself, you are willing to participate with organization, creativity, and a very strong sense of fairness.

Some lessons require visual aids.

Tags: Direct | Bold | Justice-minded

## Implementation checks (NOT editorial reapproval)
- Verify V2 award constraints and server-authoritative persistence support for the full approved breadth of Q5C and other multi-pole mappings. Never silently truncate user choices.
- Verify canonical labels and polarity (e.g. Spontaneous, Even-Keeled, Open, Urgent, Content).
- Check all eight petty score permutations remain 0/1/2/3 each, max 24 and bands unchanged.
- Avoid double-awarding result-level legacy profileSignals, including on first completion and V1/V2 activation paths.
- Q2A/B exact wording and Q4B petty score **1** were explicitly approved on 2026-10-22. No outstanding editorial choices for Quiz #1.
- Quiz #2 may now be reviewed separately. Do not implement Quiz #1 without user authorization.
