# Quiz 02: Which version of you shows up in a crisis? | LOCKED CREATIVE REVIEW
**Approval:** Round 1: all 8 questions approved; Round 2: all 4 reveals approved, 2026-10-22. **Editorial decisions only. No application code changes authorized or made.**
**Existing implementation:** `src/data/quizzes/crisis.ts`; `src/data/quiz-pole-awards/crisis.ts`.

## Rules
- Two rounds: all question text/choices/archetype weights/Core pole awards together, then all reveal text together.
- Every answer contributes exactly one vote to its assigned crisis archetype. Pole awards are **independent** of archetype vote and can contain multiple +1/+2/+3 Core pole signals.
- **No personality awards at reveal/result level**; the three reveal tags are descriptive, not scored. Existing legacy `profileSignals` should be removed or disabled **only after separate code authorization and scoring-engine verification**.
- Preserve existing answer order, letter, archetype assignment, and all existing question text except the two approved wording improvements explicitly identified below.
- The wording and personality award lists below are the approved creative target, not current deployed state.

## Round 1: all eight questions, answer choices, archetype votes, Core pole awards

### Q1: Group trip. The car won’t start. Everybody looks at you.
- A [Fixer] Hood’s up. I’m figuring out what’s wrong. | Practical +3; Curious +2; Decisive +1; Independent +1.
- B [Anchor] Everybody breathe. The car is broken, not the trip. | Even-Keeled +3; Peacekeeping +2; Protective +1. “Optimistic” is **not** a Core pole and receives **no award**.
- C [Commander] You call roadside. You call the hotel. I’ll handle the rest. | Control +3; Direct +3; Decisive +2; Collaborative +1; Urgent +1.
- D [Improviser] Uber, rental car, stranger with jumper cables. New plan. | Spontaneous +3; Adventurous +2; Decisive +2; Practical +1; Open +1.

### Q2: The restaurant lost your reservation for eight.
- A [Improviser] Fine. Drinks somewhere else. Dinner just became an adventure. | Spontaneous +3; Adventurous +3; Playful +1; Even-Keeled +1.
- B [Commander] I need the manager. Now. We had a reservation. | Direct +3; Conflict-Forward +3; Rule-Oriented +2; Urgent +2; Control +1.
- C [Fixer] I’m checking every restaurant nearby before anybody finishes complaining. | Practical +3; Urgent +3; Independent +2; Decisive +1.
- D [Anchor] Nobody be rude to the hostess. We are still eating tonight. | Protective +3; Peacekeeping +3; Even-Keeled +2; Cooperative +1; Direct +1.

### Q3: Your friend calls: “Okay, don’t freak out...”
- A [Anchor] Are you safe? Okay. I’m here. | Protective +3; Even-Keeled +2; Vibe Checker +2; Patient +1.
- B [Improviser] Is this “oops” bad or “come get me” bad? | Curious +3; Playful +2; Practical +1; Even-Keeled +1.
- C [Commander] Where are you? Who’s with you? | Protective +3; Direct +2; Urgent +2; Control +2; Decisive +1.
- D [Fixer] Start at the beginning. I need facts. | Verify First +3; Practical +2; Curious +2; Serious +1; Patient +1.

### Q4: Your flight gets canceled while you’re standing at the gate.
- A [Fixer] I’m checking every flight, airport, and route within 200 miles. | Practical +3; Urgent +3; Planner +2; Independent +1; Curious +1.
- B [Anchor] Everybody relax. Worst case, we stay another night. | Even-Keeled +3; Patient +3; Peacekeeping +2; Let It Play Out +1.
- C [Improviser] Bonus vacation day. Where are we eating? | Spontaneous +3; Content +2; Playful +2; Adventurous +2; Let It Play Out +1.
- D [Commander] Everybody stay here. I’m going to the desk. | Control +3; Direct +2; Decisive +2; Protective +1.

### Q5: Your phone disappears at a crowded event.
- A [Commander] Nobody moves. You check there. I’ll check here. | Control +3; Direct +3; Protective +1; Urgent +2; Planner +1.
- B [Fixer] Find My iPhone. Call it. Lock it. Done. | Practical +3; Decisive +3; Verify First +1; Urgent +2; Serious +1.
- C [Anchor] Okay. It’s a phone. You’re safe. One thing at a time. | Even-Keeled +3; Protective +3; Peacekeeping +1; Patient +2.
- D [Improviser] **Guess I'm off-grid. First, let's retrace my steps.** | Playful +3; Let It Play Out +2; Content +2; Spontaneous +1.
**Wording change approved in Round 1:** Q5D replaces “Well... apparently I’m off-grid now.” with the above.

### Q6: The power goes out during a storm.
- A [Improviser] Candles. Snacks. We live like pioneers now. | Playful +3; Adventurous +2; Spontaneous +2; Even-Keeled +1.
- B [Fixer] Flashlights. Chargers. Breaker. I’m checking everything. | Practical +3; Planner +2; Verify First +2; Urgent +1.
- C [Anchor] Everybody okay? Good. We’re fine. | Protective +3; Even-Keeled +3; Peacekeeping +1.
- D [Commander] Nobody open the fridge. Phones on low power. | Control +3; Direct +2; Practical +2; Rule-Oriented +1; Decisive +1.

### Q7: Water is pouring from under the kitchen sink.
- A [Commander] You grab towels. You move that. I’m shutting the water. | Control +3; Direct +3; Decisive +3; Practical +2; Urgent +2.
- B [Improviser] **Bucket down, water off. We can improvise the rest.** | Spontaneous +2; Practical +2; Let It Play Out +2; Patient +1.
- C [Fixer] Find the shutoff valve. Towels. Plumber. | Practical +3; Decisive +2; Planner +2; Urgent +2.
- D [Anchor] Get everybody out of the kitchen. Nobody panic. | Protective +3; Even-Keeled +2; Peacekeeping +2; Direct +1.
**Wording change approved in Round 1:** Q7B replaces “Bucket underneath. Temporary fix. Tomorrow problem.” with the above.

### Q8: Crisis over. What are you doing now?
- A [Anchor] Checking on everybody one more time. | Protective +3; Vibe Checker +2; Sentimental +1; Patient +1.
- B [Commander] Reviewing what went wrong so this never happens again. | Planner +3; Control +2; Practical +2; Verify First +2; Serious +1.
- C [Improviser] Telling the story like it was hilarious. | Playful +3; Open +2; Even-Keeled +1; Spontaneous +1.
- D [Fixer] Fixing the last thing nobody noticed. | Practical +3; Independent +2; Serious +2; Protective +1.

## Round 2: all four reveal results APPROVED VERBATIM
**No result-level personality scoring.** Three tags are display-only.

### THE COMMANDER
Everyone is panicking.
Congratulations, you’ve been promoted.

When things go sideways, you tend to get decisive fast. You organize the chaos, make the call, and start assigning jobs before anyone has officially agreed you’re in charge.

Nobody voted. Somehow you’re leading.

Tags: Decisive | Direct | Protective

### THE FIXER
You already have three solutions.
Nobody asked yet.

Your brain goes straight to the problem. What broke? What do we need? What can we do right now? You feel better when something useful is happening, preferably immediately.

Feelings are welcome after we solve the problem.

Tags: Resourceful | Practical | Focused

### THE ANCHOR
The situation may be a mess.
You are not adding to it.

When everyone else gets louder, you tend to get steadier. You notice who is overwhelmed, lower the temperature, and somehow make people feel like this might actually be okay.

Every chaotic group has one emotional support human.

Tags: Steady | Supportive | Observant

### THE IMPROVISER
Was there a plan?
Cute.

You adapt quickly when reality refuses to cooperate. You trust your instincts, work with what you have, and are surprisingly good at turning “well, this is bad” into “okay, here’s what we’re doing.”

Plan B is more of a lifestyle.

Tags: Adaptable | Instinctive | Creative

## Future implementation checks (not pending creative decisions)
1. Check the canonical 40 Core pole labels, dimension polarity, and the awards schema before encoding this spec. Do not silently omit user-approved awards.
2. Ensure the archetype-vote system remains independent of pole awards and preserve the original per-letter archetype balance.
3. Confirm current quiz result `profileSignals` are not also awarded after switching to answer-level-only personality scoring.
4. Confirm Q5D and Q7B wording is applied to both quiz question definitions and matching awards-file wording.
5. **No application code changes without separate explicit authorization.** Quiz #2 creative review is complete.
