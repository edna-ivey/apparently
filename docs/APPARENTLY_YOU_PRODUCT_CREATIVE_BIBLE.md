# Apparently You Product + Creative Bible

**Current governing edition: October 20, 2026 | Build 17 verified in internal TestFlight | original v1.4 retained as historical baseline**

This document is the canonical implementation-readable repository copy of the Apparently You Product + Creative Bible. The original September 27 v1.4 remains below as historical baseline; later dated, owner-approved addenda supersede conflicts. Implementation and deployment status must be verified separately.

When implementation behavior conflicts with this Bible, stop and surface the conflict for review rather than silently changing the product.

The decision-status meanings in the Bible remain authoritative:

- **LOCKED** = decided; do not change without Michelle explicitly changing it
- **APPROVED** = reviewed and accepted
- **WORKING** = current direction that may still be refined
- **OPEN** = deliberately undecided

---

## Apparently You — Product + Creative Bible

*Version 1.4 • September 27, 2026 • Build 8 starting point*

This document is the governing vision for Apparently You.

When a future idea conflicts with this bible, we stop and make a deliberate decision. We do not quietly change the product because something was convenient to code.

### Decision status

- **LOCKED** = decided. Do not change without Michelle explicitly changing it.
- **APPROVED** = content/design Michelle has reviewed and accepted.
- **WORKING** = current direction, but may still be refined.
- **OPEN** = deliberately undecided.

---

## 1. THE PRODUCT

### What Apparently You is

Apparently You is a social identity and personality game that learns people through the choices they make.

It is not a clinical personality assessment.
It is not therapy.
It is not a self-help app.
It is not a generic BuzzFeed quiz collection.
It is not a statistics dashboard.

Apparently You should feel like:

> The app has been paying attention.

The experience combines:

- daily questions
- personality quizzes
- real comparisons with other people
- an evolving read of the user
- a collectible identity/avatar
- friend comparison
- Apparently Private, which goes deeper and gets less polite

The product becomes more interesting the more the user answers.

---

## 2. THE CORE LOOP

**LOCKED**

Answer → Reveal → Compare → Discover → Unlock/Progress → Share/Compare → Return

Every major feature should strengthen at least one part of this loop.

If something is technically interesting but does not make the user want to answer, discover, compare, collect, share, or return, it probably does not belong near the center of the app.

---

## 3. BRAND PERSONALITY

Apparently You is:

Human · Curious · Magnetic · Alive · Mischievous/Shady · Fun

It should feel observant and emotionally intelligent without sounding clinical.

The voice can be warm.
The voice can be shady.
The voice can occasionally be ruthless.
But it should never sound cruel merely for entertainment.

### The ideal reaction

We want users to say:

“Why is this so accurate?”

or

“Damn. Okay, Apparently. 😭”

or

“I knew that about myself but I did not appreciate being called out like this.”

That last reaction is especially important to Apparently Private.

---

## 4. THE WRITING VOICE

### Public Apparently You

Public content is clever, playful, observational and highly relatable.

It can tease.
It should not constantly confront.

Examples of the energy:

- “Apparently, you have thoughts.”
- “The room has opinions too.”
- “Respectfully, you noticed.”
- “We're starting to see a pattern.”

Public should make someone want to keep answering.

---

## 5. APPARENTLY PRIVATE

### Core philosophy

**LOCKED**

Apparently Private is honest, not negative.

Private is allowed to say things the public side would soften.

It can identify:

- laziness
- defensiveness
- jealousy
- approval-seeking
- selfishness
- avoidance
- hypocrisy
- scorekeeping
- insecurity
- performative ambition
- punishment
- emotional armor
- unhealthy patterns

when the user's answers actually support those conclusions.

Private does NOT operate under the rule:

“Every result must ultimately be flattering.”

That rule would destroy the product.

A result may genuinely be:

LAZY. THERE, WE SAID IT.

or

YOU TALK A GREAT GAME

or

YOU WANT LOVE. YOU'RE STILL HIDING FROM IT.

Users often already know their flaws.

Recognition is part of the fun.

---

## 6. THE PRIVATE TRUTH RULE

**LOCKED**

The harshness must be earned.

Apparently You does not roast users randomly. Well, at least not often.

A negative result must emerge from a meaningful pattern across several answers.

One questionable answer does not justify:

“You're selfish.”

But, two might. Repeated evidence might.

This creates the central Private principle:

> We may hurt your feelings a little. We may not lie about you.

And that goes both directions.

If the evidence is genuinely positive, the user gets the positive result.

Private does not manufacture problems just to appear edgy.

---

## 7. PRIVATE INTENSITY

Private can use different levels of confrontation depending on the evidence.

Working language:

**KEEP IT CUTE**
Observational, playful, lighter read.

**SAY WHAT YOU SEE**
More direct. Names the pattern.

**CLOCK ME**
Little-to-no sugarcoating when the evidence is strong.

The content itself determines the intensity. We do not need to display these exact labels everywhere.

---

## 8. PRIVATE RESULT STRUCTURE

Strong Private results may use:

**THE READ**
What Apparently thinks is happening.

**THE CALL-OUT**
The uncomfortable part.

**THE COST**
What the pattern may be costing the user.

**TRY THIS**
One useful action or question.

Not every result needs all four sections.

The structure should adapt to the result.

A strong result should feel like somebody understood the person, not like a templated wellness worksheet.

---

## 9. QUIZ-WRITING PHILOSOPHY

### Questions should reveal, not simply ask

**LOCKED**

These can be asked, but not in repetition. Avoid repetitive:

- “Are you X?”
- “Do you Y?”
- “Would you say you are Z?”

Instead use variety:

- scenarios
- stories
- forced choices
- reactions
- interpretations
- quotations
- “what happens next?”
- “which one sounds most like you?”
- “what bothers you more?”
- “be serious…”
- “which answer makes you squirm?”
- “who are you most like?”
- “what would you actually do?”
- conflicting priorities

Apparently You should learn personality indirectly whenever possible.

---

## 10. BEHAVIOR > SELF-IMAGE

This becomes especially important in Private.

Bad:

“Are you ambitious?”

Everyone knows which answer they are supposed to choose.

Better:

You've been saying you want something for a year. What's the most honest explanation for why you don't have it yet?

The Private quiz should frequently distinguish between:

- what someone says they value

and

- what their behavior suggests they value.

That gap is prime Apparently You territory.

---

## 11. RESULTS COME FIRST

### NEW LOCKED CONTENT RULE

For All quizzes:

1. Define the result spectrum first.
2. Make sure that spectrum includes genuinely different outcomes.
3. Then write questions capable of distinguishing those results.
4. Then map the evidence.

We do not write ten cute questions and discover afterward that all four results mean:

"You are basically doing great."

That is exactly what we are avoiding.

### ANSWER PATTERNS MUST NOT REVEAL THE SCORING

**LOCKED**

A, B, C, and D positions must not consistently correspond to particular results, severity levels, or personality poles.

Questions should not repeatedly present the same four psychological buckets in different wording.

Each question should earn its place by revealing a meaningfully different angle, context, motive, tradeoff, or behavior.

The quiz should feel like it is getting more interesting - not asking the same question again wearing a different outfit.

Answer-order patterns must be mixed so a user cannot infer the result logic from position alone.

### EVERY ANSWER DOES NOT NEED TO MAP TO EVERY SYSTEM

**LOCKED**

An answer may contribute to the quiz result without contributing Core or Private personality evidence.

An answer may also contribute to Core evidence, Private evidence, or both when the behavior genuinely supports those traits.

Personality evidence is awarded only when the answer genuinely supports that trait.

---

## 12. PRIVATE RESULT SPECTRUM

A strong quiz usually needs meaningful range.

Example from *How Bad Do You Actually Want It?*

- Positive — YOU WANT IT FOR REAL
- Mixed — YOU WANT IT, BUT COMFORT KEEPS WINNING
- Call-out — YOU TALK A GREAT GAME
- Harsh — LAZY. THERE, WE SAID IT.

Not every quiz must have exactly one result at each severity level.

But the results must represent real differences, not four polite personality flavors.

### RESULT REACHABILITY

**LOCKED**

Every published quiz result must be genuinely achievable from the available answer choices and scoring logic.

Before a quiz is approved:

1. Every result must have at least one realistic answer path that produces it.
2. No result may depend on an impossible or contradictory combination of answers.
3. The questions must provide enough evidence to distinguish every result from the others.
4. Harsh results may require additional evidence thresholds, but those thresholds must still be realistically reachable.
5. If a result cannot be reached without gaming the quiz, forcing unnatural answers, or relying on a tie-breaker almost every time, the quiz is not finished.
6. If two results are effectively produced by the same answer pattern, the questions or results need more separation.

We test the completed scoring model using sample response profiles for every result.

If Apparently promises a result, the quiz must actually be capable of discovering that person.

### QUIZ APPROVAL CONTRACT

**LOCKED**

Every approved quiz specification must document:

- result signals or dimensions used by that quiz
- answer-level result weights or mappings
- result thresholds and tie logic
- any special gates required for harsh or high-confidence results
- Core personality mappings, when present
- Private personality mappings, when present
- the evidence threshold used to qualify mapped traits
- at least one realistic simulated respondent path for every possible result

The scoring model is not approved until every result is reachable and meaningfully distinguishable.

---

## 13. CORE PERSONALITY SYSTEM

Apparently You has 32 total dimensions across two distinct identity systems: 20 Core dimensions and 12 Private dimensions.

Only the 20 Core dimensions build the Creature.

### CORE YOU: 20 dimensions

**LOCKED DIRECTION**

These build the main identity and avatar.

| # | Dimension | Pole A | Pole B |
|---|---|---|---|
| 1 | planner_spontaneous | Planner | Spontaneous |
| 2 | emotional_intensity | Emotionally Intense | Even-Keeled |
| 3 | direct_indirect | Direct | Indirect |
| 4 | social_attunement | Vibe Checker | Face Value |
| 5 | protective_hands_off | Protective | Hands-off |
| 6 | adventure_comfort | Adventurous | Comfort-seeking |
| 7 | independent_collaborative | Independent | Collaborative |
| 8 | control_allowing | Control | Let it play out |
| 9 | practical_idealistic | Practical | Idealistic |
| 10 | sentimental_thick_skinned | Sentimental | Thick-skinned |
| 11 | rules_bending | Rule-oriented | Rule-bending |
| 12 | conflict_peacekeeping | Conflict-forward | Peacekeeping |
| 13 | trust_verify | Trust first | Verify first |
| 14 | forgiving_receipts | Forgiving | Holds the Receipt |
| 15 | playful_serious | Playful | Serious |
| 16 | competitive_cooperative | Competitive | Cooperative |
| 17 | curious_decisive | Curious | Decisive |
| 18 | private_open | Private | Open |
| 19 | patient_urgent | Patient | Urgent |
| 20 | ambitious_content | Ambitious | Content |

These are the source for Your Signature and the creature.

---

## 14. PRIVATE PERSONALITY SYSTEM

The deeper 12 dimensions belong to Apparently Private.

They do not build the creature.

| # | Dimension | Pole A | Pole B |
|---|---|---|---|
| 21 | accountability_defensiveness | Accountability | Defensiveness |
| 22 | reflective_reactive | Reflective | Reactive |
| 23 | self_secure_reassurance | Self-Secure | Reassurance-Seeking |
| 24 | boundary_holding_approval_seeking | Boundary-Holding | Approval-Seeking |
| 25 | vulnerable_armored | Vulnerable | Armored |
| 26 | repair_punishing | Repair-Oriented | Punishing |
| 27 | tactful_blunt | Tactful | Blunt |
| 28 | duty_first_self_preserving | Duty-First | Self-Preserving |
| 29 | supportive_challenging | Supportive | Challenging |
| 30 | gives_freely_keeps_score | Gives Freely | Keeps Score |
| 31 | perspective_taking_self_referencing | Perspective-Taking | Self-Referencing |
| 32 | initiating_responsive | Initiating | Responsive |

These power the deeper Private identity layer.

---

## 14A. CORE TRAIT DICTIONARY

**LOCKED**

These 20 Core dimensions describe the user's everyday, outwardly observable personality patterns.

Core traits build: Your Signature → Creature → Character Name.

Core traits are distinct from Apparently Private traits. Some concepts may overlap, but Core and Private measure different layers of behavior.

A single answer may legitimately provide evidence to both a Core trait and a Private trait when the behavior strongly supports both.

### 1. PLANNER / SPONTANEOUS

**What this dimension measures:** How naturally someone approaches preparation, structure, and deciding what happens next.

- **PLANNER** — Tends to think ahead, prepare, organize, and prefer having at least some idea of the plan before moving.
- **SPONTANEOUS** — Tends to respond in the moment, improvise easily, and feel comfortable deciding as things unfold.

*Important distinction:* Planner is not the same as Control. A Planner may prepare thoroughly and still be perfectly comfortable letting other people make decisions. Spontaneous does not mean careless or disorganized.

### 2. EMOTIONALLY INTENSE / EVEN-KEELED

**What this dimension measures:** How strongly emotions tend to be felt, expressed, and experienced in the moment.

- **EMOTIONALLY INTENSE** — Experiences emotions with noticeable depth or force. Excitement, anger, affection, disappointment, and other feelings may register strongly.
- **EVEN-KEELED** — Tends to experience and respond to emotional situations with greater steadiness and less emotional swing.

*Important distinction:* Emotionally Intense is not the same as Sentimental. Intensity measures the strength of emotional response. Sentimentality measures the emotional meaning attached to people, memories, gestures, and experiences. Even-Keeled does not mean emotionless.

### 3. DIRECT / INDIRECT

**What this dimension measures:** How naturally someone communicates what they actually mean.

- **DIRECT** — Tends to state the point clearly and prefers communication where the intended meaning is easy to identify.
- **INDIRECT** — Tends to communicate through implication, softened wording, context, hints, or allowing the other person to infer part of the meaning.

*Important distinction:* Direct is not the same as Blunt. Direct measures clarity. Blunt, a Private trait, measures how much tact or filtering someone uses when the truth may be uncomfortable. A person can be extremely Direct and extremely Tactful.

### 4. VIBE CHECKER / FACE VALUE

**What this dimension measures:** How much someone naturally looks beyond literal words and observable facts when reading people or situations.

- **VIBE CHECKER** — Notices tone, energy, body language, inconsistencies, subtext, social cues, and what may be happening underneath what was explicitly said.
- **FACE VALUE** — Tends to begin with what was actually said or done rather than assuming there is an additional hidden meaning.

*Important distinction:* Vibe Checker is not the same as Verify First. Vibe Checker is about reading social signals and subtext. Verify First is about how readily someone accepts information or trust without confirmation. Face Value does not mean socially unaware or gullible.

### 5. PROTECTIVE / HANDS-OFF

**What this dimension measures:** How readily someone steps in when they believe another person may need help, defense, guidance, or protection.

- **PROTECTIVE** — Tends to intervene, defend, help, warn, or actively look out for people they care about.
- **HANDS-OFF** — Tends to give people room to handle their own situations and respects their ability to make their own choices.

*Important distinction:* Protective is not the same as Control. Protection is motivated by safeguarding someone. Control is about wanting to influence or manage what happens. Hands-Off does not mean uncaring.

### 6. ADVENTUROUS / COMFORT-SEEKING

**What this dimension measures:** How someone balances novelty, uncertainty, and new experiences against familiarity, ease, and comfort.

- **ADVENTUROUS** — Tends to be drawn toward new experiences, unfamiliar situations, novelty, exploration, or a reasonable amount of risk.
- **COMFORT-SEEKING** — Tends to value familiarity, ease, predictability, and experiences that feel comfortable or known.

*Important distinction:* Adventurous is not the same as Spontaneous. Someone can carefully plan every detail of an adventure. Comfort-Seeking also does not mean lazy. A person can work extremely hard while strongly preferring stability and familiarity.

### 7. INDEPENDENT / COLLABORATIVE

**What this dimension measures:** Whether someone naturally prefers autonomy or shared involvement when accomplishing things and making decisions.

- **INDEPENDENT** — Tends to prefer handling things personally, maintaining autonomy, and relying on their own judgment or effort.
- **COLLABORATIVE** — Tends to prefer involving others, exchanging ideas, sharing responsibility, or working toward decisions and outcomes together.

*Important distinction:* Independent is not the same as Private. Independent describes how someone prefers to operate. Private describes how much of themselves they naturally disclose. Collaborative does not mean dependent.

### 8. CONTROL / LET IT PLAY OUT

**What this dimension measures:** How strongly someone prefers to influence, direct, or manage what happens.

- **CONTROL** — Tends to feel more comfortable when they can shape the plan, reduce uncertainty, make decisions, or actively influence the outcome.
- **LET IT PLAY OUT** — Tends to be more comfortable allowing events, people, or situations to develop without needing to direct every part of the outcome.

*Important distinction:* Control is not the same as Planner. Planning is about preparation. Control is about influence over what actually happens. Let It Play Out does not mean passive.

### 9. PRACTICAL / IDEALISTIC

**What this dimension measures:** Whether someone naturally prioritizes what is workable and realistic or what could and ideally should be possible.

- **PRACTICAL** — Tends to evaluate choices by usefulness, feasibility, consequences, resources, and what is likely to work in real life.
- **IDEALISTIC** — Tends to give greater weight to possibilities, principles, vision, values, and how things could be rather than limiting thinking to current constraints.

*Important distinction:* Practical does not mean unimaginative. Idealistic does not mean unrealistic. This dimension is about which lens someone naturally reaches for first.

### 10. SENTIMENTAL / THICK-SKINNED

**What this dimension measures:** How much emotional weight personal meaning, memories, words, gestures, and emotionally charged experiences tend to carry.

- **SENTIMENTAL** — Tends to attach emotional meaning to memories, gestures, objects, traditions, words, milestones, or experiences and may hold onto that meaning over time.
- **THICK-SKINNED** — Tends to be less emotionally affected by symbolic gestures, personal slights, emotionally loaded moments, or things that other people may carry with them for longer.

*Important distinction:* Sentimental is not the same as Emotionally Intense. Someone can feel emotions very strongly without being especially sentimental. Someone can also be sentimental about memories and relationships while remaining calm during emotional situations. Thick-Skinned does not mean insensitive.

### 11. RULE-ORIENTED / RULE-BENDING

**What this dimension measures:** How naturally someone treats rules, conventions, and established expectations as boundaries versus guidelines.

- **RULE-ORIENTED** — Tends to respect established rules, procedures, expectations, and agreed-upon standards unless there is a meaningful reason not to.
- **RULE-BENDING** — Tends to see rules as more flexible and may adapt, reinterpret, work around, or ignore them when the situation seems to justify it.

*Important distinction:* Rule-Bending does not automatically mean reckless or dishonest. Rule-Oriented does not automatically mean rigid. The dimension measures the person's default relationship with established boundaries.

### 12. CONFLICT-FORWARD / PEACEKEEPING

**What this dimension measures:** How someone naturally responds when disagreement, tension, or interpersonal conflict appears.

- **CONFLICT-FORWARD** — Tends to address tension directly rather than allowing an unresolved issue to remain simply to preserve peace.
- **PEACEKEEPING** — Tends to reduce tension, preserve harmony, choose battles carefully, or avoid escalating conflict when resolution may not be worth the disruption.

*Important distinction:* Conflict-Forward is not the same as Direct. Direct describes communication clarity in general. Conflict-Forward describes willingness to engage specifically when disagreement or tension exists. Peacekeeping does not mean weak or afraid of confrontation.

### 13. TRUST FIRST / VERIFY FIRST

**What this dimension measures:** Someone's default starting point when deciding whether information, intentions, promises, or people should be trusted.

- **TRUST FIRST** — Tends to begin by accepting good faith or believing what is presented unless something gives them reason to question it.
- **VERIFY FIRST** — Tends to want confirmation, evidence, consistency, or additional information before fully accepting something as true or trustworthy.

*Important distinction:* Verify First is not the same as Vibe Checker. Verify First asks, “What confirms this?” Vibe Checker asks, “What am I noticing underneath this?” Trust First does not mean naive.

### 14. FORGIVING / HOLDS THE RECEIPT

**What this dimension measures:** How strongly past hurts, mistakes, betrayals, or patterns continue to influence someone's view of a person or situation.

- **FORGIVING** — Tends to release past offenses more readily and is comparatively willing to allow new behavior to carry more weight than old mistakes.
- **HOLDS THE RECEIPT** — Tends to remember previous behavior and continue using that history as relevant evidence when deciding what to expect, trust, or tolerate.

*Important distinction:* Holds the Receipt does not automatically mean bitter or Punishing. Someone may forgive another person emotionally while still remembering exactly what happened and allowing that history to affect future trust. Forgiving does not mean forgetting.

### 15. PLAYFUL / SERIOUS

**What this dimension measures:** How naturally someone brings humor, lightness, teasing, play, or seriousness into everyday interaction.

- **PLAYFUL** — Tends to use humor, jokes, teasing, silliness, or lightheartedness as a natural part of relating to people and moving through life.
- **SERIOUS** — Tends to approach conversations, decisions, and situations with a more earnest, straightforward, or reserved tone.

*Important distinction:* Playful does not mean immature. Serious does not mean humorless. This dimension measures someone's natural interpersonal tone, not their capacity to behave appropriately when circumstances require it.

### 16. COMPETITIVE / COOPERATIVE

**What this dimension measures:** How strongly someone is motivated by winning, outperforming, comparison, and individual achievement versus shared success and mutual progress.

- **COMPETITIVE** — Tends to notice rankings, comparisons, winning, losing, and opportunities to outperform or improve relative to others.
- **COOPERATIVE** — Tends to place greater emphasis on mutual benefit, shared success, helping the group succeed, and outcomes where people can advance together.

*Important distinction:* Competitive is not the same as Independent. A highly Collaborative person can also be extremely Competitive. Cooperative also does not mean unambitious.

### 17. CURIOUS / DECISIVE

**What this dimension measures:** How naturally someone balances continued exploration with reaching a conclusion and moving forward.

- **CURIOUS** — Tends to keep asking questions, exploring alternatives, considering possibilities, and remaining open to additional information.
- **DECISIVE** — Tends to reach conclusions, choose a direction, and move forward once they believe they have enough information.

*Important distinction:* Curious does not mean indecisive. Decisive does not mean closed-minded. The distinction is how long someone naturally prefers to remain in exploration mode before committing.

### 18. PRIVATE / OPEN

**What this dimension measures:** How readily someone shares their internal thoughts, feelings, experiences, and personal information with others.

- **PRIVATE** — Tends to keep more of their internal world to themselves and may share selectively, gradually, or only with people they deeply trust.
- **OPEN** — Tends to share thoughts, feelings, experiences, or personal information more readily and allows others easier access to their internal world.

*Important distinction:* Private is not the same as Armored. Private describes disclosure. Armored, a Private trait, describes emotional self-protection and resistance to vulnerability. Someone can be Private but deeply Vulnerable with the few people they let in.

### 19. PATIENT / URGENT

**What this dimension measures:** How someone experiences waiting, pace, delay, and the desire for movement or resolution.

- **PATIENT** — Tends to tolerate waiting, slower progress, delayed outcomes, and processes that require time without feeling compelled to accelerate them.
- **URGENT** — Tends to want movement, answers, progress, or resolution sooner and may feel restless when situations remain unresolved or slow-moving.

*Important distinction:* Urgent does not automatically mean impatient in a negative sense. Urgency can create speed, responsiveness, and momentum. Patient does not mean passive or unmotivated.

### 20. AMBITIOUS / CONTENT

**What this dimension measures:** How strongly someone is driven toward expansion, advancement, achievement, or becoming something beyond their current state.

- **AMBITIOUS** — Tends to want more growth, achievement, progress, advancement, accomplishment, or expansion and is energized by pursuing what is next.
- **CONTENT** — Tends to place greater value on appreciating, maintaining, or enjoying what is already enough rather than constantly needing another level of achievement.

*Important distinction:* Content is not the same as lazy. A Content person may work extremely hard for the life, relationships, responsibilities, or goals they value without feeling a constant need for more. Likewise, Ambitious does not automatically mean hardworking. Ambition describes the desire for more. Behavior determines whether someone actually pursues it.

---

## 14B. PRIVATE TRAIT DICTIONARY

**LOCKED**

These 12 Private dimensions describe deeper patterns that tend to become more visible when things get personal, uncomfortable, emotionally charged, or revealing.

Private traits build: The Undercurrent → Relic.

Private traits do not build the Creature.

A single answer may legitimately generate both Core and Private evidence when the behavior genuinely supports both.

### 21. ACCOUNTABILITY / DEFENSIVENESS

**What this dimension measures:** How someone responds when their own behavior, choices, or mistakes are challenged.

- **ACCOUNTABILITY** — Tends to examine their own role, acknowledge when they contributed to a problem, and accept responsibility without needing every criticism to be perfectly delivered first.
- **DEFENSIVENESS** — Tends to protect themselves from criticism by explaining, justifying, redirecting, minimizing, or focusing on why the criticism is unfair before examining their own contribution.

*Important distinction:* Defensiveness does not mean someone is always wrong. A person may be genuinely misunderstood and still respond defensively. Accountability also does not mean accepting blame that does not belong to you.

### 22. REFLECTIVE / REACTIVE

**What this dimension measures:** How much space someone tends to create between an emotional trigger and their response.

- **REFLECTIVE** — Tends to pause, think, reconsider, or examine what is happening before deciding how to respond.
- **REACTIVE** — Tends to respond quickly from the immediate emotion, impulse, or interpretation of the moment.

*Important distinction:* Reactive is not the same as Emotionally Intense. A person can feel emotions very strongly and still respond Reflectively. Likewise, someone can appear calm while reacting quickly without much reflection.

### 23. SELF-SECURE / REASSURANCE-SEEKING

**What this dimension measures:** How much someone's sense of worth, standing, or security depends on outside confirmation.

- **SELF-SECURE** — Tends to trust their own sense of worth, relationships, abilities, or decisions without needing frequent confirmation from others.
- **REASSURANCE-SEEKING** — Tends to look for confirmation, validation, checking, or repeated signals that things are okay, they are valued, or they have not lost someone's approval.

*Important distinction:* Reassurance-Seeking is not the same as Approval-Seeking. Reassurance-Seeking asks, “Am I okay with you?” Approval-Seeking asks, “Do you approve of what I'm doing or who I am?” They can overlap, but they are not identical.

### 24. BOUNDARY-HOLDING / APPROVAL-SEEKING

**What this dimension measures:** How someone balances their own limits, values, and needs against the desire to remain liked, accepted, or approved of.

- **BOUNDARY-HOLDING** — Tends to maintain limits, say no, tolerate disappointment from others, and protect what matters to them even when doing so may create tension.
- **APPROVAL-SEEKING** — Tends to give significant weight to being liked, accepted, admired, or positively viewed and may adjust behavior to preserve that approval.

*Important distinction:* Boundary-Holding is not the same as Independent. Independent measures preference for autonomy. Boundary-Holding measures whether someone can maintain their limits when social pressure is present. Approval-Seeking also does not automatically mean insecure.

### 25. VULNERABLE / ARMORED

**What this dimension measures:** How willing someone is to let other people see the emotionally exposed parts of them.

- **VULNERABLE** — Tends to allow honest access to fears, needs, hurt, uncertainty, affection, or other emotionally exposed parts of themselves when the relationship or situation matters.
- **ARMORED** — Tends to protect emotionally sensitive parts of themselves through distance, toughness, humor, control, withdrawal, self-sufficiency, or withholding.

*Important distinction:* Armored is not the same as Private. Private describes how much someone shares. Armored describes why emotional access may be restricted. A person can talk openly about their life while remaining emotionally Armored.

### 26. REPAIR-ORIENTED / PUNISHING

**What this dimension measures:** What someone tends to want after another person has hurt, disappointed, or wronged them.

- **REPAIR-ORIENTED** — Tends to focus on resolution, understanding, changed behavior, restoring trust where possible, or deciding what would genuinely make the situation better.
- **PUNISHING** — Tends to want the other person to feel consequences emotionally, relationally, or behaviorally before the issue feels settled.

*Important distinction:* Punishing is not the same as Holds the Receipt. Holds the Receipt remembers past behavior and uses it as evidence. Punishing is about what someone wants the other person to experience because of what they did. Repair-Oriented does not mean avoiding consequences.

### 27. TACTFUL / BLUNT

**What this dimension measures:** How someone balances honesty with delivery when the truth may sting.

- **TACTFUL** — Tends to preserve the truth while consciously shaping timing, wording, tone, and delivery around its likely impact.
- **BLUNT** — Tends to prioritize saying the unvarnished thing over softening or carefully packaging it, especially when they believe clarity matters more than comfort.

*Important distinction:* Blunt is not the same as Direct. Direct measures whether the message itself is clear. Blunt measures how much cushioning, tact, or filtering is used when delivering that message. A person can be Direct + Tactful or Direct + Blunt, and both combinations make sense.

### 28. DUTY-FIRST / SELF-PRESERVING

**What this dimension measures:** How someone balances obligations to others against protecting their own energy, needs, resources, and well-being.

- **DUTY-FIRST** — Tends to prioritize responsibility, commitment, obligation, or what others are depending on them to do, sometimes even when it costs them personally.
- **SELF-PRESERVING** — Tends to protect their own capacity, needs, peace, time, or resources rather than automatically sacrificing themselves to meet expectations.

*Important distinction:* Self-Preserving is not the same as selfish. Duty-First is not automatically noble. Either pattern can become unhealthy when taken too far. This is also different from Comfort-Seeking. Self-Preservation is about protecting capacity or well-being, not simply preferring ease.

### 29. SUPPORTIVE / CHALLENGING

**What this dimension measures:** How someone tends to help people they care about when those people are struggling, stuck, or making questionable choices.

- **SUPPORTIVE** — Tends to lead with encouragement, empathy, reassurance, emotional presence, or helping someone feel understood.
- **CHALLENGING** — Tends to push, question, confront, raise standards, or tell someone what they believe that person needs to hear rather than only what feels supportive.

*Important distinction:* Challenging is not the same as Conflict-Forward. Conflict-Forward measures willingness to engage in disagreement. Challenging measures the style someone uses when trying to help another person improve or face something difficult. Supportive does not mean enabling.

### 30. GIVES FREELY / KEEPS SCORE

**What this dimension measures:** How much someone tracks balance, reciprocity, effort, and what is owed within relationships.

- **GIVES FREELY** — Tends to give time, effort, help, affection, or resources without closely tracking whether the exchange remains perfectly equal.
- **KEEPS SCORE** — Tends to notice who initiated, who helped, who apologized, who sacrificed, who reciprocated, and whether effort feels balanced over time.

*Important distinction:* Keeps Score does not automatically mean selfish or transactional. Sometimes scorekeeping develops because someone repeatedly feels taken for granted. Gives Freely also does not mean having no boundaries.

### 31. PERSPECTIVE-TAKING / SELF-REFERENCING

**What this dimension measures:** Whose perspective someone instinctively uses first when interpreting another person's behavior or an interpersonal situation.

- **PERSPECTIVE-TAKING** — Tends to consider the other person's circumstances, motives, feelings, limitations, or point of view before deciding what their behavior means.
- **SELF-REFERENCING** — Tends to interpret another person's behavior first through what it means for, says about, or does to them personally.

*Important distinction:* Self-Referencing does not mean selfish. Everyone interprets experiences through themselves to some degree. This dimension measures whether someone naturally expands beyond their own perspective before forming a conclusion.

### 32. INITIATING / RESPONSIVE

**What this dimension measures:** Whether someone naturally creates movement in relationships and personal interactions or more often responds once another person begins.

- **INITIATING** — Tends to reach out, start conversations, make plans, check in, repair distance, express interest, or create momentum without waiting for someone else to go first.
- **RESPONSIVE** — Tends to engage readily once another person creates the opening but is less naturally inclined to be the person who starts it.

*Important distinction:* Responsive does not mean passive, uninterested, or avoidant. Initiating is also not the same as Ambitious. This dimension is about relational and interpersonal initiation, not general drive, career ambition, or productivity.

---

## 15. CORE AND PRIVATE ARE DISTINCT IDENTITY LAYERS

**LOCKED PRODUCT DIRECTION**

Eventually:

Public Dailies + Public quizzes
→ Core evidence
→ Core 20
→ Your Signature
→ Creature

Private Dailies + Private quizzes
→ Core evidence when genuinely supported
→ Core 20
→ Your Signature
→ Creature

AND

Private Dailies + Private quizzes
→ Private evidence
→ Private 12
→ The Undercurrent
→ Relic

Private evidence never directly builds the creature.

Core evidence never builds the Relic.

A Private answer may generate both types of evidence when the behavior genuinely supports both.

---

## 15A. QUIZ PERSONALITY EVIDENCE AWARDS

**LOCKED**

Quiz-result scoring and personality-trait evidence are related but separate systems. An answer may affect the quiz result, Core evidence, Private evidence, both identity layers, or neither identity layer when the answer does not genuinely support a personality trait.

Core and Private are separate identity systems. Core evidence feeds the Creature. Private evidence feeds the Undercurrent and Relic.

A single answer may contribute to both systems when strongly justified. For example, the same answer may earn Direct +2 in Core and Blunt +2 in Private.

### RAW EVIDENCE SCALE

**LOCKED**

+1 = supporting evidence for that specific trait pole.
+2 = strong/direct evidence for that specific trait pole.
+3 = reserved exclusively for the rank #1 LOCKED PRIVATE QUIZ RANKED EVIDENCE award (see
APPARENTLY PRIVATE QUIZZES below) — never an individual answer-level value, never used by
Daily, never used by Core awards.

An individual answer may award zero, one, or multiple trait-pole scores when each mapping is genuinely supported.

Raw answer evidence is temporary within the quiz for ranking purposes; the approved permanent award is applied only after completion.

### MINIMUM TO MAKE THE BOARD

**LOCKED**

A trait pole must accumulate at least 3 raw points before it is eligible to make the board or receive a permanent quiz award.

The 3-point minimum may be reached as +2 and +1 from separate answers, or +1 +1 +1 from separate answers.

Because a single answer can award at most +2 to one trait pole, one answer alone can never qualify a trait.

If a trait received zero evidence, it receives zero permanent points regardless of how many ranking slots remain.

### OPPOSITE-POLE MATH

**LOCKED**

Evidence may accumulate toward both poles of the same dimension.

Within a quiz, the higher raw-evidence pole is the eligible pole for that dimension when quiz awards are ranked.

Across the active identity ledger, the higher active cumulative score is the current winning expression and may rank on the board.

The losing pole does not appear beside the winning pole as a separate current trait.

If opposing poles are tied at the relevant scoring layer, the pole that first reached that tied high score by timestamp wins the dimension.

### RANKING TIES

**LOCKED**

When two qualifying winning trait poles have the same score, the trait that first reached that high score by timestamp ranks higher.

### EVIDENCE MUST EXIST

A ranking position does not create evidence. We never invent, pad, or force traits merely to fill Top 3, Top 5, Top 7, or Top 3 Private positions.

### ACTIVE BOARD QUALIFICATION

**LOCKED**

The active identity ledger combines unexpired permanent quiz awards and approved Daily evidence for each trait pole.

A trait pole must have at least 3 active cumulative evidence points before it may appear in Your Signature or The Undercurrent or drive a Creature or Relic characteristic.

This active-board threshold is separate from the within-quiz raw-evidence threshold used to decide whether a quiz may award that trait.

After the threshold is met, opposite-pole and ranking rules determine the current winning expression and order.

### PUBLIC / FREE QUIZZES

Core / Creature permanent awards:

- Top 3 qualifying supported Core traits: +2 each.
- 4th and 5th qualifying supported Core traits: +1 each.
- If fewer than five Core traits qualify, only the qualifying traits receive awards.

Public / Free quizzes do not generate Private / Relic personality awards unless Michelle explicitly approves a future exception.

### APPARENTLY PRIVATE QUIZZES

Core / Creature permanent awards:

- Top 3 qualifying supported Core traits: +1 each.

Private / Relic permanent awards — **LOCKED PRIVATE QUIZ RANKED EVIDENCE (Build 11)**:

- Rank #1 qualifying supported Private trait: ±3.
- Rank #2 qualifying supported Private trait: ±2.
- Rank #3 qualifying supported Private trait: ±1.

This replaces the earlier equal-weight model (flat +2 for all three ranks). The strongest Private
finding a quiz produces now outweighs its secondary and tertiary findings instead of all three
counting equally — #1 is the strongest thing this quiz learned about the user's Private identity,
#2 a meaningful secondary signal, #3 a lighter supporting signal. Total possible ranked award
when all three ranks qualify is still 3+2+1 = 6 points, no longer three equal conclusions.

If fewer than three traits qualify in either layer, only the qualifying traits receive awards —
two qualifying Private traits award only #1 (±3) and #2 (±2); one qualifying trait awards only #1
(±3). Never invent a third (or second) trait merely to fill a rank.

Core awards from Apparently Private quizzes are unaffected by this change and remain flat +1 each
(top 3 qualifying Core traits) — Private quizzes must never be allowed to outweigh Core/Creature
identity.

### COMPLETION AND VERSIONING

**LOCKED**

The first fully submitted completion of a specific quiz version creates permanent personality evidence.

Retakes may show a different quiz result, but retakes do not add or replace permanent personality evidence.

A material quiz version change that is released to users is treated as a new quiz version and may create new permanent evidence when completed.

### SCORING FLOW

Answers -> temporary raw trait evidence -> 3-point qualification check -> resolve opposite poles -> rank qualifying winning poles -> apply permanent profile awards.

Quiz-result logic is calculated separately from permanent personality awards.

---

## 16. YOUR SIGNATURE

**LOCKED**

The old consumer-facing Your Patterns / Your 7 presentation is being replaced.

The underlying system selects up to seven strongest qualifying Core trait poles after opposite-pole resolution.

The user sees:

YOUR SIGNATURE

These are the strongest qualifying Core traits shaping their avatar.

No fake traits are added just to reach seven.

If only five Core traits currently qualify, show five. If seven qualify, show seven.

---

## 17. THE CREATURE

**LOCKED — Creature v1 progression model (October 2026)**

The user's primary collectible identity is a generated creature.

The Creature is based entirely on Core You. Private traits never build the Creature.

### LOCKED V1 STRUCTURAL ORDER

Creature v1 uses the five strongest qualifying Core traits only:

- #1 Core trait -> Eyes
- #2 Core trait -> Ears / Horns
- #3 Core trait -> Wings
- #4 Core trait -> Body
- #5 Core trait -> Tail

The body rig and shared production calibration are locked. Crown/headpiece and chestplate/medal are not part of Creature v1 and must not be invented as active slots.

### FIRST FORM

**LOCKED**

The user receives an early Creature payoff instead of waiting until 50 answers.

First Form becomes eligible when both are true:

- the user has at least 8 profile answers; and
- at least one Core trait qualifies.

First Form uses the user's current #1 qualifying Core trait characteristic for all five visual parts. It is intentionally a pure, single-family Creature. For example, a Curious First Form uses Curious eyes, ears/horns, wings, body, and tail.

First Form uses that characteristic's first naming root only, such as Curious -> Lumi or Bold -> Zora.

Before First Form eligibility, show the neutral Creature placeholder. Do not fabricate a trait to reveal early.

Before the first mixed form, First Form may reflect the current top characteristic as the profile continues learning, but its first-reveal celebration should not replay repeatedly.

### FIRST MIXED FORM

**LOCKED**

The first mixed Creature reveals immediately when both are true:

- `profileAnswerCount >= 50`; and
- five qualifying Core traits exist.

The first mixed reveal never waits for Evolution Day.

The five ranked Core traits map to the five locked parts above. If five Core traits do not yet qualify, keep First Form visible and continue learning rather than inventing missing traits.

### GLOBAL EVOLUTION DAY

**LOCKED**

After the first mixed form has been revealed, visible Creature changes happen only at the global weekly Evolution Day.

Evolution Day is **Friday** for the entire app. This is one shared app cadence, not a rolling seven-day timer per user.

The personality profile continues learning from real evidence every day. Between Evolution Days, the visible mixed Creature remains the last revealed mixed form even if the live candidate changes underneath it.

On or after the latest Friday the user has not checked, present:

**Did you evolve?**

The user chooses **Find out**. The app compares the last revealed mixed Creature with the current derived mixed Creature.

- If the derived identity changed, reveal **You evolved.** and persist the new visible mixed form.
- If it did not change, reveal **Still you.** and keep the existing visible form.

If the user misses multiple Fridays, do not replay a backlog. Offer one catch-up check against the latest Friday and the current derived identity.

If the first mixed form is revealed on a Friday, that same Friday does not immediately trigger another evolution check. The next eligible check is the following Friday. If first mixed reveal occurs on Thursday, the next day's Friday check is eligible.

The personality profile remains the source of truth for the current candidate identity. A small presentation snapshot may be stored to remember the last revealed mixed Creature and the last checked Evolution Day; that snapshot must not replace the live personality profile as identity truth.

---

## 18. CHARACTER NAMING

**LOCKED**

Mixed Creature names come from the characteristics represented by the user's first two strongest qualifying Core traits.

The top characteristic supplies the first-word root. The second characteristic supplies the second-word root.

Locked roots:

- Strong: Vara / Stone
- Sentimental: Sera / Pearl
- Grounded: Tera / Moss
- Curious: Lumi / Fox
- Playful: Jovi / Dash
- Visionary: Nova / Moon
- Bold: Zora / Blaze
- Harmonious: Mira / Sage

Example: Bold + Curious = **Zorafox**.

First Form uses only the first naming root of its single characteristic, such as Curious -> **Lumi**.

Do not invent or randomize names outside this locked system.

---

## 19. APPARENTLY PRIVATE'S VISUAL OBJECT

**LOCKED**

Private does not mutate the Creature.

Private creates something the character carries: THE RELIC.

The Relic is a separate visual object and does not touch or overlap the Creature.

### APPROVED IDENTITY-HERO DIRECTION

- Creature / avatar -> left.
- Private identity stack -> right.
- Character name -> large, above the Relic.
- Relic -> smaller, below the character name.

Exact sizing and spacing are determined visually, but this hierarchy is the current approved direction.

---

## 20. RELIC LOGIC

**LOCKED CONCEPT**

Up to three strongest qualifying Private traits determine the deeper identity layer.

- #1 Private trait -> RELIC object
- #2 Private trait -> COLOR
- #3 Private trait -> EFFECT

Every Private trait pole should eventually have all three authored properties so any qualifying trait can occupy any of the three positions.

Example structure only: Blunt -> Relic: Blade; Color: Crimson; Effect: Sparks.

Actual trait-to-Relic mappings are OPEN until reviewed and approved by Michelle.

### RELIC REVEAL

**LOCKED (Build 11 — progressive, replaces the earlier all-or-nothing reveal)**

The Relic is no longer all-or-nothing. It forms over time, visibly, as real qualifying Private
evidence accumulates — the same production renderer and the same locked global calibration at
every stage, never a separate visual path for a partial Relic:

- 0 qualifying Private traits: the Relic stays the intentional locked/mysterious silhouette.
- 1 qualifying Private trait (the strongest): the real BASE RELIC OBJECT reveals, in an
  intentionally early/forming presentation (base layer only — no color tint, no effect yet).
- 2 qualifying Private traits: the COLOR layer joins the base.
- 3 qualifying Private traits: the EFFECT layer joins — the user's complete first Relic, a
  meaningful collectible reveal moment.

Mapping stays exactly as before: #1 qualifying trait -> object, #2 -> color, #3 -> effect.

Do not invent a missing Private trait to complete, or advance, the Relic at any stage.

Target pacing (evidence-driven, not a quiz-count quota): a typical engaged user should normally
begin seeing a Relic forming within roughly 2-3 Apparently Private quizzes, have multiple layers
by roughly 3-5, and have earned a complete first Relic by roughly 5-7 — see
scripts/simulate-relic-pacing.ts for the simulation this is calibrated against.

---

## 21. PRIVATE TOP THREE

The user should see up to three strongest qualifying Private traits underneath Your Signature.

It will not be called "Private Top 3."

Current preferred working name: THE UNDERCURRENT

**WORKING**, not yet permanently locked.

Concept:

Your Signature = what tends to define you.
The Undercurrent = what tends to show up underneath, especially when things become personal.

If fewer than three Private traits qualify, show only the qualifying traits; never pad the list.

---

## 22. YOU PAGE

The You page should become one of the most desirable parts of the app.

It should feel like: My Apparently identity. Not: account dashboard.

### CURRENT HIERARCHY

- Gear icon upper-right.
- Main identity hero: Creature on the left; character name large on the right with the smaller Relic beneath the name.
- Then: Meki, apparently. / answer count shaping your read / Daily and quiz counts.
- Then: YOUR SIGNATURE -> Core identity.
- Then: deeper Private section -> working title THE UNDERCURRENT.
- Then: YOUR COMMONALITY -> real comparison with respondents.
- Then: RECENT READ -> latest active quiz result.

### FREE-USER PRIVATE IDENTITY TREATMENT

**LOCKED**

Apparently Private remains visible on the You page for all users.

The goal is to make the deeper identity layer desirable and understandable without giving away a user's personalized Private identity before they have access to it.

### FREE USER - NO EARNED PRIVATE IDENTITY

The You page shows:

- full Core Creature once earned
- character name once earned
- full Your Signature
- visible Apparently Private / Undercurrent section
- concealed or locked Undercurrent trait positions
- Relic silhouette / locked state
- a concise explanation that Apparently Private learns what tends to show up underneath when things get personal
- an entry point into Apparently Private

Do not display fake Private traits, placeholder personality conclusions, or a fabricated Relic.

The Private section should create curiosity without turning the You page into a paywall.

The Private tab remains the primary place for premium discovery, previews, categories, and subscription messaging.

### ACTIVE APPARENTLY PRIVATE SUBSCRIBER

The You page shows the user's actual earned Private identity.

Show up to three qualifying Undercurrent traits. Never pad to three.

The Relic follows the normal reveal rule.

Until three qualifying Private traits exist, the Relic remains a silhouette.

Once three qualifying Private traits exist, reveal the Relic using the approved #1 object / #2 color / #3 effect logic.

Do not show acquisition or free-preview language to an active subscriber.

### FORMER SUBSCRIBER

Canceling Apparently Private does not confiscate identity the user already earned.

A former subscriber retains visibility of Private identity information and Relic progress already earned while subscribed.

They lose access to new premium quizzes, new Private Dailies, new premium-only content, and new Private evidence collection while unsubscribed.

Previously earned Creature or Relic unlocks are not reversed merely because the subscription ended.

If the user had not yet fully revealed the Relic before cancellation, the Relic remains in its previously earned progression state rather than inventing missing characteristics.

Normal personality-evidence expiration rules still apply.

Future UX for a long-inactive former subscriber whose qualifying Private evidence has aged out may be refined in a later build. This does not block the current subscription experience.

### PRINCIPLE

Show free users that there is more to discover. Do not show them the personalized answer before they have earned access to it. Do not take away identity they already earned simply because they stopped subscribing.

---

## 23. WHAT DOES NOT BELONG ON YOU

**LOCKED**

Remove:

- Restore Purchases
- Manage Subscription
- “Apparently Private Active”
- subscription mechanics
- completed “57 / 50” milestone bars
- unnecessary account/settings information

The user already sees how many answers are shaping their read.

We do not need to repeatedly congratulate them for crossing 50.

---

## 24. PROFILE DEPTH

**NOT APPROVED AS VISIBLE UI**

Profile Depth was proposed as an internal measure of how broad and well-supported the user's personality evidence is.

Possible inputs:

- number of dimensions with evidence
- repeated evidence
- category diversity
- total observations

This may be useful internally for confidence/ranking.

But there is currently no reason to display another meter on You.

Do not add a Profile Depth section unless Michelle later approves it.

---

## 25. COMMONALITY

**LOCKED DIRECTION**

Commonality compares the user against actual Apparently You respondents.

It must not claim to represent the general population unless the dataset someday justifies that claim.

Bad: "You are more unusual than 84% of people" when the data only comes from a small app audience.

Better: "Across the questions we can compare, your choices were shared by about 31% of the room."

### MINIMUM DATA REQUIREMENTS

**LOCKED**

A specific question becomes Commonality-eligible only after at least 10 respondents have answered that question.

A user-level aggregate Commonality number is shown only when that user has at least 10 answered questions that are themselves Commonality-eligible.

If either threshold is not met, show STILL LEARNING THE ROOM or equivalent instead of a percentage.

### NON-NEGOTIABLE

No fake percentages. No invented population claims. No invented statistic is preferable to a fake impressive statistic.

---

## 26. SETTINGS

**LOCKED**

Settings is accessed with a gear in the top-right of You.

Settings is not a primary tab.

### PROFILE

- First name
- Age range
- Gender/custom gender

Editing should update the existing profile rather than rerunning onboarding.

### APPARENTLY PRIVATE

- Subscription status
- Manage Subscription
- Restore Purchases

### SUPPORT

- Contact Us
- Send Feedback (eventually)

Temporary contact address:

**edna.tyus@gmail.com**

### LEGAL

- Privacy Policy
- Terms/EULA

These require real hosted pages before public submission.

### DATA

Future account/data controls.

### ABOUT

- Version
- Build number

> Repository transcription note: in the four bullet groups above (PROFILE, APPARENTLY PRIVATE, SUPPORT/second item, ABOUT), the source RTF's bullet-list items were each missing their leading letter (e.g. "ge range", "ender/custom gender", "anage Subscription", "estore Purchases", "end Feedback eventually", "erms/EULA", "uild number") — an apparent artifact of the source document's own bullet-list formatting, reproduced identically whether the RTF is read as plain text or as HTML. The leading letters have been restored here as the obviously intended words (Age, Gender, Manage, Restore, Send, Terms, Build). This is a mechanical transcription correction, not a product/content decision, and is called out per the source-of-truth rule rather than silently fixed without note.

---

## 27. APPARENTLY PRIVATE SUBSCRIPTION UX

**LOCKED**

Apparently Private subscription UX recognizes three entitlement states: free/no earned Private identity, active subscriber, and former subscriber with earned Private identity or progress.

### FREE USER

May see appropriate premium discovery, available previews, and subscription entry points.

On You, personalized Private traits remain concealed and the Relic remains in its silhouette/locked state unless Private identity had previously been earned during an earlier subscription.

### ACTIVE SUBSCRIBER

Playable Private content should simply be playable.

Do not show acquisition language intended for a free user.

No meaningless FREE PREVIEW labels for content the user already pays to access.

### FORMER SUBSCRIBER

Previously earned Private identity and Relic progress remain visible on You, subject to normal evidence-expiration rules.

New premium quizzes, new Private Dailies, premium-only content, and new Private evidence require an active subscription.

Canceling does not reset or relock a Creature or Relic feature that was already earned.

### UNRELEASED CONTENT

Content that has not been built or released should say COMING SOON, not LOCKED, when the person's subscription is not what is blocking it.

---

## 28. PURCHASE BEHAVIOR

**LOCKED EXPECTATION**

When somebody successfully purchases Apparently Private:

- Private should unlock immediately.
- No force-close.
- No relaunch.
- No “try again tomorrow.”

Purchase → secure entitlement sync → premium content revalidation → unlocked UI.

Restore Purchases should behave the same way.

Server authorization remains the authority.

The client never gets to claim:

“Trust me, I paid.”

---

## 29. PRIVATE LANDING COPY

Approved core positioning:

> apparently private.
> The questions stop being polite in here.
> Some will gas you up. Some will clock you. Some might have you staring at the ceiling for a minute. 👀

Subscriber state should remove preview/sales messaging.

---

## 30. PRIVATE CATEGORIES

**LOCKED**

Apparently Private has eight categories:

- Love & Soulmates
- Career & Ambition
- Hidden You
- Shadow Side
- The Good Stuff
- Life Match
- Style & Vibe
- Private Private. 😈

---

## 31. CURRENT PLAYABLE PRIVATE QUIZZES

Approved/playable before Build 8:

**THE GOOD STUFF**
So why do people keep you around?

**SHADOW SIDE**
Be So Serious Right Now.

---

## 32. BUILD 8 MINIMUM PRIVATE CONTENT

**LOCKED IMMEDIATE GOAL**

At least one playable Private quiz in every category.

Therefore six new ones are required:

### LOVE & SOULMATES

Are you actually ready for love?
**APPROVED.**

### CAREER & AMBITION

How bad do you actually want it?
Result philosophy revised. Questions must now be rewritten to support the stronger result spectrum.

### HIDDEN YOU

Current candidate:
What do people keep getting wrong about you?

### LIFE MATCH

Current candidate:
Would your dream life actually fit you?

### STYLE & VIBE

Current candidate:
Are you actually intimidating?

### PRIVATE PRIVATE. 😈

Current candidate:
How much trouble are you after dark?

These last four titles are current choices but their actual content has not been reviewed.

---

## 33. APPROVED LOVE QUIZ

**SUPERSEDED (2026-10) — see docs/private-quizzes/APPROVED_PRIVATE_QUIZZES.md §3 instead.** This
section's result family (THE DOOR IS OPEN / READY, WITH FINE PRINT / YOU WANT IT. YOU'RE STILL
PROTECTING YOURSELF. / YOU LIKE LOVE BETTER IN THEORY) was an earlier draft. A later Private
Quiz Library pass locked a different, newer result family (THE DOOR IS OPEN. / LOVE, WITH TERMS
&amp; CONDITIONS. / YOUR HEART SAYS YES. YOUR WALLS SAY ABSOLUTELY NOT. / YOU WANT A BAE, NOT A
PARTNERSHIP.) in the per-quiz approved doc, confirmed as the shipping version — that is now the
canonical source for this quiz's content; the draft below is kept only for history and must not
be used to re-derive copy.

Are you actually ready for love?

Subtitle:

Wanting a relationship and being ready for one are not the same thing.

Approved result family:

**THE DOOR IS OPEN**
Actually available for real intimacy.

**READY, WITH FINE PRINT**
Capable of love, but security conditions matter.

**YOU WANT IT. YOU'RE STILL PROTECTING YOURSELF.**
Connection wanted, armor still operating.

**YOU LIKE LOVE BETTER IN THEORY**
Wants relationship benefits more readily than some of the demands of real intimacy.

The full 10-question draft and overall result concept were approved.

Michelle noted it had less shade than some Private content but agreed that the subject may appropriately require a softer touch.

---

## 34. CAREER QUIZ CORRECTION

The initial Career results were rejected because they were too kind and middle-ground.

The new direction is:

- YOU WANT IT FOR REAL
- YOU WANT IT, BUT COMFORT KEEPS WINNING
- YOU TALK A GREAT GAME
- LAZY. THERE, WE SAID IT.

Michelle specifically identified with:

YOU TALK A GREAT GAME

and emphasized an important product truth:

People often already know their flaws and may relate more strongly to being accurately called out than to receiving another flattering result.

The Career questions and answer choices therefore need to be rewritten.

---

## 35. PRIVATE CONTENT APPROVAL RULE

**CRITICAL. LOCKED.**

Michelle reviews every Apparently Private component before implementation:

- quiz concept
- title
- subtitle
- questions
- answers
- results
- reads
- call-outs
- costs
- Try This
- scoring
- personality mappings
- result logic

Nothing Private gets implemented simply because Forge or Claude wrote it.

Material edits after approval require reapproval.

---

## 35A. APPROVED CONTENT REGISTRY

**LOCKED**

Apparently You maintains one canonical Approved Content Registry.

The registry is the source of truth for playable quiz and Daily content.

Approved content should not live only in chat history, code, implementation notes, or scattered documents.

The registry contains three distinct canonical libraries: Public Quiz Library, Private Quiz Library, and Daily Library.

The libraries remain logically separate for organization, but all three must be searchable together for duplication and overlap checks.

### 1. PUBLIC QUIZ LIBRARY

Contains all approved free/public quizzes.

Each quiz record must include, where applicable: unique quiz ID; version number; category; title; subtitle; status; questions; answer choices; result set; quiz-result scoring logic; Core personality mappings; result thresholds and gates; tie-break logic; simulated response profiles proving every result is reachable; publish date; expiration date; prior-version reference when applicable; and approval date/status.

Public quizzes do not generate Private personality evidence unless Michelle explicitly changes that rule in the future.

### 2. PRIVATE QUIZ LIBRARY

Contains all approved Apparently Private quizzes.

Each quiz record must include: unique quiz ID; version number; Private category; title; subtitle; status; questions; answer choices; full result set; Reads; Call-Outs; Costs where used; Try This where used; quiz-result scoring logic; Core personality mappings where genuinely supported; Private personality mappings where genuinely supported; result thresholds and gates; harsh-result evidence requirements; tie-break logic; simulated response profiles proving every result is reachable; publish date; expiration date; prior-version reference when applicable; and Michelle approval status.

A Private quiz is not implementation-ready until its required content and scoring components have been reviewed and approved.

### 3. DAILY LIBRARY

Contains all approved Daily questions. Every Daily is marked PUBLIC or PRIVATE.

Each Daily record should include: unique Daily ID; Public or Private classification; prompt; answer choices; status; Core personality mappings if any; Private personality mappings if any; whether the Daily contributes personality evidence; publish/use history; approval status; and duplication/overlap notes where relevant.

Not every Daily must contribute personality evidence. A Daily may exist purely because it is interesting, funny, social, revealing, comparative, or worth answering.

If a Daily does contribute personality evidence, only mappings genuinely supported by the answer are used.

### CONTENT STATUS

Canonical content uses clear status labels:

- **DRAFT** — Still being created or reviewed. Not implementation-ready.
- **APPROVED** — Reviewed and approved by Michelle. May be implemented.
- **LIVE** — Approved and currently available to users.
- **RETIRED** — No longer active or presented to users.

A retired quiz or Daily remains preserved in the registry so its history, versioning, prior mappings, and duplication footprint are not lost.

### CROSS-LIBRARY DUPLICATION CHECK

**LOCKED**

Before any quiz question or Daily is approved, it must be checked against the entire Approved Content Registry.

This check is not limited to exact wording.

Also check for substantial conceptual duplication, including: the same question rewritten with different words; the same scenario with cosmetic changes; the same forced choice; the same joke or reveal mechanism; the same behavioral distinction being tested too similarly; a Daily duplicating a quiz question; a Public quiz duplicating a Private quiz; or one quiz repeating another quiz too closely.

Apparently You may explore the same broad personality theme more than once. It should not repeatedly ask essentially the same question and pretend it learned something new.

A similar question may be approved when the context, tradeoff, motive, or behavior being examined is meaningfully different.

### QUIZ VERSIONING

**LOCKED**

Every approved quiz has a version.

The first fully submitted completion of a specific quiz version may create permanent personality evidence.

Retaking that same version may produce a different quiz result for the user, but it does not create additional permanent personality evidence.

A materially changed quiz is published as a new version. A new version is treated as a new quiz for personality-evidence purposes.

Material changes include changes that meaningfully alter questions, answer choices, scoring logic, result thresholds, personality mappings, or result definitions.

Cosmetic corrections that do not change meaning or scoring do not require a new evidence-producing version.

Prior versions remain preserved in the registry.

### CONTENT EXPIRATION VS. CONTENT HISTORY

Quiz content may have a defined expiration or retirement date.

A quiz leaving active circulation does not erase its canonical record from the Approved Content Registry.

User-facing result history and active personality evidence follow the separate 12-month evidence expiration rule.

The registry preserves retired content so Apparently can avoid accidentally recreating old questions, understand previous scoring decisions, audit historical personality mappings, maintain version history, and distinguish genuinely new content from recycled content.

### IMPLEMENTATION AUTHORITY

**LOCKED**

Claude Code implements only the approved canonical version stored in the Approved Content Registry.

If code and the registry disagree, the registry is the creative/content authority unless Michelle explicitly approves a change.

Claude does not silently rewrite approved questions; reorder answers in a way that changes meaning or scoring; change personality mappings; change result thresholds; substitute a newer draft for an approved version; revive retired content; or create missing content.

Missing or contradictory registry information is surfaced for review rather than invented.

### CORE PRINCIPLE

One source of truth for what Apparently has already asked, what it learned from those answers, and what users are actually allowed to play.

---

## 36. AI ROLES

### Forge

Creative/product partner.

Forge may:

- propose
- write
- challenge
- organize
- design systems
- analyze
- recommend

Forge does not treat unreviewed creative content as final.

### Michelle

Final creative authority.

Michelle approves the actual product voice/content.

### Claude Code

Implementation.

Claude should implement approved decisions, not silently become a creative director.

Claude does not invent:

- quizzes
- results
- character names
- trait mappings
- relic mappings
- copy
- major UX changes

unless explicitly instructed.

---

## 37. VISUAL DESIGN DIRECTION

**LOCKED DIRECTION**

Apparently You uses one unified visual system with optional aesthetic expressions layered on top of it.

The default experience should use the neutral / balanced aesthetic.

Users may eventually choose a different look that feels more feminine, neutral, masculine, soft, bold, dreamy, grounded, edgy, or expressive — but these are visual treatments, not different personality systems.

The final consumer-facing names for the aesthetic options are OPEN. We should not necessarily label them Feminine / Neutral / Masculine.

### CORE DESIGN LANGUAGE

The underlying Apparently You design language remains:

Soft editorial + magical collectible + premium personality app

Characteristics:

- Warm cream and sophisticated neutral foundations.
- Rounded cards.
- Gentle depth and shadows.
- Elegant spacing.
- Strong typography hierarchy.
- Editorial rather than dashboard-like.
- Playful but grown.
- Magical without looking like a fantasy RPG.
- Premium without looking corporate.
- Colorful without looking juvenile.

The neutral/default aesthetic should feel broadly appealing and should not lean strongly feminine or masculine.

### CHOOSE YOUR LOOK

A user's aesthetic preference changes how Apparently You is presented, not what Apparently believes about them.

The same personality evidence must produce the same:

- Core traits
- Your Signature
- Creature structure
- creature name
- Private traits
- Undercurrent
- Relic logic

Changing aesthetics must never change personality meaning or evidence.

A user should be able to change their look without becoming a different Apparently identity.

### CREATURE AESTHETICS

We do not create three completely separate versions of every trait part.

The canonical creature system stays the same.

If Direct determines a specific eye structure, those are still the user's Direct eyes regardless of aesthetic.

The selected aesthetic may alter the visual treatment of those eyes through things such as:

- color palette
- material or texture
- line treatment
- highlights
- glow
- softness or sharpness
- small decorative overlays
- particles or effects

The underlying trait asset and silhouette should remain recognizable.

### REUSABLE STYLE SYSTEM

The art system should be designed as:

Canonical trait asset + aesthetic treatment + optional overlay/effect

Not:

Trait × three completely separate handcrafted assets

Whenever practical, creature assets should expose reusable visual regions such as:

- primary color
- secondary color
- accent
- glow/effect

The aesthetic system can then transform those regions consistently across the creature.

Small aesthetic-specific overlays may be added when needed — for example, softer sparkle/detail treatments, organic textures, sharper/angular accents, or other stylistic effects — without requiring an entirely new personality asset.

### APP-WIDE AESTHETIC

The selected look should extend beyond the creature.

It may influence:

- creature treatment
- Relic treatment
- backgrounds
- cards
- buttons
- trait pills
- decorative shapes
- particles
- lighting
- gradients
- accent colors
- supporting illustrations

This should make the app feel intentionally personalized rather than as though only the avatar received a costume change.

### DEFAULT

The neutral / balanced aesthetic is the default Apparently You experience.

It should be polished enough that a user never feels required to choose another aesthetic.

Alternative aesthetics are personalization, not a gender requirement and not part of personality scoring.

The user chooses how Apparently You looks.

Apparently determines who the evidence says they are.

---

## 38. VISUAL ANTI-GOALS

Apparently You should not resemble:

- therapy software
- a banking dashboard
- generic mobile SaaS
- a children's game
- a mental-health diagnostic
- a corporate HR personality assessment
- a random quiz website wrapped in an app
- a fantasy character builder with stats everywhere

---

## 39. APP-WIDE VISUAL TARGET

**LOCKED DIRECTION**

The Apparently You visual system should feel unified across the entire product while allowing each major experience to have its own purpose and emotional tone.

The user's selected aesthetic is an app-wide presentation layer. It may influence colors, accents, overlays, textures, effects, creature treatment, Relic treatment, and supporting visual details across the product.

However, each major surface retains its own recognizable role.

Aesthetic choice personalizes the product. It does not erase the identity of the screen.

### PRIMARY NAVIGATION

The primary bottom navigation is:

TODAY · EXPLORE · PRIVATE · COMPARE · YOU

Apparently Private is a first-class product experience and receives its own primary navigation tab.

Private should occupy the center position.

Settings remains accessed through the gear on You and is not a primary tab.

The navigation structure does not change depending on subscription status.

Free users and subscribers both see Private.

For a free user, Private opens the premium experience, available previews, and appropriate subscription entry points.

For a subscriber, Private opens directly into the full Private experience.

### TODAY

Beautiful hero question experience.

Today should make the current Daily feel like the main event.

The interface should prioritize answering, revealing, comparing, and discovering rather than presenting a dashboard of competing information.

Today should create a strong reason to return regularly.

### EXPLORE

Editorial discovery experience.

Explore is the home of public quizzes and browsable free content.

Quiz cards should feel curated, expressive, and desirable rather than like rows in a content database.

The goal is:

“I want to take that.”

### APPARENTLY PRIVATE

A deeper world inside the same product.

Private belongs to the same Apparently You design family but uses a darker, richer visual expression, with deep plum as a foundational direction.

Entering Private should feel like entering another layer of Apparently You — not opening another app.

The user's chosen aesthetic continues into Private, but Private retains its own recognizable atmosphere.

Think:

Private visual foundation + selected aesthetic treatment

Private contains its own Dailies, quizzes, categories, deeper identity experience, Undercurrent, and Relic-related content.

### COMPARE

Friend-focused and immediately understandable.

Compare prioritizes people, responses, similarities, differences, and reactions.

The visual system should support the social experience without making comparisons difficult to read.

Compare should make users want to say:

“Wait. You picked THAT?”

### YOU

The identity centerpiece.

You is where the accumulated Apparently identity becomes tangible.

This is the home of the user's:

- Creature
- character name
- Relic
- Your Signature
- Undercurrent
- Commonality
- recent identity/read information

You should feel like:

“This is my Apparently identity.”

Not:

“This is my account page.”

It should be one of the most visually desirable screens in the application.

### QUIZ RESULTS

Collectible, readable identity moments.

Quiz results are reward moments.

They should be easy to read but visually strong enough that users want to save, screenshot, share, discuss, and remember them.

Results should reinforce the feeling that Apparently learned something rather than simply calculated a score.

### PAYWALL

Premium, confident, and simple.

The paywall should clearly communicate the deeper value of Apparently Private without becoming cluttered, aggressive, or sales-heavy.

Private should feel desirable because of the experience itself.

Subscribers should not continue seeing acquisition messaging intended for free users.

### SETTINGS

Quiet and clean.

Settings should retain the Apparently You visual language while prioritizing clarity and utility.

It is not an entertainment surface and does not need to compete visually with Today, You, Explore, Compare, or Private.

### SYSTEM RULE

Every major screen has two visual layers:

**1. Surface Identity**

The visual character required by the function of that part of Apparently You.

Examples:

- Today = bright, immediate, inviting
- Explore = editorial and discoverable
- Private = deeper, darker, richer
- Compare = social and readable
- You = collectible and identity-driven

**2. User Aesthetic**

The optional visual treatment chosen by the user.

The aesthetic may modify presentation but should not destroy the recognizable identity or usability of the underlying surface.

The product should always feel like Apparently You first, the user's chosen aesthetic second.

---

## 40. COMPARE

**LOCKED EXISTING CONCEPT**

Compare is built around:

THEY HAVE NOTES. 👀

Friends answer about/share with the user.

Friend responses do not become the user's self-evidence.

Compare must preserve identity boundaries.

Universal Links should open the installed app whenever supported.

Build 7 confirmed that the new share-link flow opens in the app on the tested device.

---

## 41. DEMOGRAPHICS

Demographics currently include:

- first name
- age range
- gender
- optional custom gender

These may be changed later from Settings.

The original onboarding self-perception questions are distinct from these demographics and should not silently be rewritten as behavioral evidence.

---

## 42. DATA HONESTY

This is one of the most important rules in the entire product.

Apparently You can be funny.

Apparently You can exaggerate linguistically.

Apparently You may not fabricate data.

That means:

- No fake percentages.
- No fake population comparisons.
- No fake traits.
- No fake completions.
- No fake entitlement.
- No pretending a locked metadata-only quiz exists.
- No invented certainty when evidence is thin.

The brand depends on users eventually trusting:

Apparently has receipts.

---

## 43. PROFILE EVIDENCE

**LOCKED**

Personality should evolve from actual user behavior and should represent the person the app is learning now, not an unlimited lifetime average.

### QUIZ COMPLETIONS

Only the first fully submitted completion of a specific quiz version creates permanent personality evidence.

Retakes may show a new result but do not add or replace permanent personality evidence.

A materially changed released quiz version is treated as a new quiz version and may create new evidence when completed.

### DAILY EVIDENCE

Not every Daily contributes personality evidence.

When an approved Daily answer genuinely supports a Core trait pole, it contributes directly to the cumulative Core evidence ledger using the same answer-level scale: +1 supporting or +2 strong/direct.

A Private Daily may also contribute +1 or +2 to approved Private trait poles when genuinely supported and explicitly mapped.

Daily evidence is not forced merely because the user answered a Daily.

### 12-MONTH ACTIVE EVIDENCE WINDOW

**LOCKED**

Personality evidence expires from the active identity calculation 12 months after it was created, regardless of whether it came from a quiz or a Daily.

When evidence expires, Core and Private totals are recalculated without that expired contribution so the identity can evolve over time.

Active quiz-result history also drops results from the current app experience after 12 months.

A future Past You / archive experience may preserve old identity history in a later build, but it is not part of the current build.

Aggregate/anonymized response data may remain available for Commonality and product analytics even after an individual completion stops influencing that user's active identity, subject to the product's data/privacy rules.

### UNLOCKS DO NOT RELOCK

Once the user has earned the 50-answer Creature reveal, that feature remains unlocked even as older evidence expires.

Once the Relic has been revealed by achieving three qualifying Private traits, the feature remains unlocked; the active trait expression may continue to evolve with current evidence.

---

## 44. AVATAR DETERMINISM

**LOCKED**

The avatar is not random decoration.

The same evidence should generate the same identity.

A change in the avatar should have a reason.

Eventually, users should be able to understand:

“My Direct trait is why I have these eyes.”

or

“My second Private trait made the relic violet.”

The character is a visualization of the evidence.

The visual identity should reflect the current qualifying winning trait poles inside the active evidence window, not expired evidence.

---

## 45. THE NAME MUST MEAN SOMETHING

The creature name is not randomly generated from a fantasy-name list.

It directly reflects the user's top two Core traits.

That makes names socially useful.

People can compare:

“I'm Lumifox.”

“Wait, I'm Blastanglo.”

and ask:

“What did you get?”

That supports collectibility and sharing.

---

## 46. FREE VS PREMIUM

Apparently Private must provide enough visible value that $3.99/month makes sense.

A subscriber should feel:

“I bought access to a real deeper layer of the product.”

Not:

“I paid $3.99 and got two quizzes and 30 advertisements for future quizzes.”

This is why Build 8 requires at least one playable quiz in each Private category before we feel good about testing the subscription experience.

---

## 47. LONGER-TERM PRIVATE CONTENT

Current year-one direction remains:

80 Private quizzes total

with continuing drops over time.

Current planned cadence:

approximately 4 premium quizzes per month, with free additions also continuing.

Public marketing should simply promise:

New quizzes and Private reads added regularly.

Do not publicly promise a precise publishing cadence unless we choose to later.

---

## 48. FREE CONTENT

Apparently You should also keep free users engaged.

Launch direction:

18 free quizzes across six categories, approximately three per category.

Free categories:

- Love
- Friendship
- Food
- Money
- Nostalgia
- Ridiculous

Apparently Private complements free content.

It should not make the free product feel abandoned.

---

## 49. LAUNCH

**LOCKED TARGET**

October 1, 2026

We do not move the target merely because the work expanded.

We change scope intelligently.

The goal is not to force unfinished garbage into the build.

The goal is to protect the date by knowing what is actually essential.

---

## 50. BUILD 8 PURPOSE

Build 8 is the transition from:

functional personality quiz app

to:

Apparently You as an identity product.

Major Build 8 areas:

**Product foundation**
Core vs Private architecture.

**Subscription**
Immediate unlock and proper subscriber states.

**Settings**
Actual account/profile utilities.

**You**
New identity-centered experience.

**Avatar**
Working prototype.

**Relic**
Separate working prototype.

**Character naming**
Logic prototype after mappings are approved.

**Commonality**
Real respondent data only.

**Private**
At least one playable quiz in every category.

**Design**
Beginning of the app-wide new visual language.

---

## 51. BUILD 8 DOES NOT REQUIRE FINAL ART

We do not need final creatures to test the avatar system.

Circles. Triangles. Bean bodies. Cloud wings. Lightning tails. Stars. Blocks. Ridiculous placeholder objects.

All acceptable.

The purpose is to answer:

- Does the logic work?
- Is it fun seeing my creature?
- Does each trait visibly change something?
- Does the relic make sense beside it?
- Does the character name feel collectible?

Then we create beautiful final assets.

---

## 52. SHADE CALIBRATION

Different quizzes deserve different amounts of shade.

**Love/readiness**
More emotionally careful.

**Career/ambition**
Can be much sharper.

**Shadow Side**
Can go hard.

**The Good Stuff**
More validating.

**Style & Vibe**
Funny/shady.

**Private Private**
Playful, provocative, observant.

Apparently Private should have range.

It should not sound like the same comedian wrote every result at the same volume.

---

## 53. THE FINAL TEST FOR A PRIVATE RESULT

Before approving a result, ask:

- Is it specific enough that someone recognizes themselves?
- Could the opposite kind of person plausibly get a very different result?
- Is the harshness supported by several answers?
- Did we actually say the uncomfortable thing?
- Are we still treating the user like an adult rather than insulting them for sport?
- Is there at least one line someone will screenshot and send to a friend?

If not, the result probably needs another pass.

---

## 54. THE APPARENTLY TEST

Before shipping any major feature or piece of copy, ask:

Could this exist in any other personality app?

If yes, push it farther.

Then ask:

Does this feel like Apparently has been paying attention?

If yes, we're close.

---

## 55. THE NORTH STAR SENTENCE

If we forget everything else:

Apparently You should make people feel seen, called out, curious about themselves, curious about everybody else, and excited to see what the app notices next.

And Apparently Private adds:

We don't have to be nice. We do have to be right.

That is the bible. 🔥


---

## 56. OWNER DECISION ADDENDUM: DAILY FRESHNESS, SCORING AND CONTINUITY (2026-10-19)

**Status: LOCKED where marked; WORKING where marked.** This later owner decision supersedes earlier conflicting per-answer scoring-cap language in this Bible. See `docs/APPARENTLY_YOU_CONTINUITY_PROTOCOL.md` for the detailed audit and backup procedure.

**LOCKED: Evidence breadth.** A Daily or Private Daily answer may genuinely support any number of distinct traits/poles, without a maximum count of traits per answer. Each supported trait/pole receives at most **3 points** per answer, based on evidentiary strength. Ten genuinely supported poles may all receive awards. Never confuse the three-points-per-pole limit with a three-traits-per-answer limit. Do not fabricate mappings simply to increase coverage.

**LOCKED: Freshness priority.** When newly approved Daily and Private Daily questions are published, schedule them ahead of previously scheduled repeat questions. Preserve history and rotation fallback. Implement and test priority safely before deploying new content.

**WORKING: New editorial program.** Develop 90 new Free Daily and 90 new Private Daily questions, in approval batches of 15 per room. New, fun content first; subsequently audit the existing pools and retire boring, redundant or weak questions without erasing their history. Free Daily blends outrageous/funny, insightful, character-choice, this-or-that, would-you-rather, confessions and other varied formats. Private Daily must be substantially bolder, shadier, more provocative and surprising than generic relationship quizzes. Avoid overlap with existing quiz content.

**NOT APPROVED:** The initial 15 Free and 15 Private Daily questions displayed in the 2026-10-19 conversation remain editorial drafts pending owner review. No publication or mapping approval is implied.

**LOCKED: Durable decisions.** On each project work session with repo access, reconcile owner-approved decisions with this Bible, exact approved-content files, and Git. Record discrepancies and distinguish local code, committed code, pushed code, migrations applied, and live functionality. Preserve original approved versions. Do not assert that any update is saved or deployed without verifying it.

**IMPLEMENTATION DISCREPANCY OPEN:** The current Daily editor/normalization code still imposes a three-effect cap. It conflicts with the owner decision and requires a tested code correction before new multi-trait mappings are published. The V2 schema's three-point-per-pole limit is compatible with this addendum.

## 57. OWNER CREATIVE DIRECTION ADDENDUM: UNPREDICTABLE DAILY RANGE (2026-10-19)

**LOCKED DIRECTION:** The Daily experience should be surprising in format and emotional register, not a predictable sequence of relationship or personality quizzes. Free Daily mixes playful, bizarre, soft, cinematic, musical, revealing and occasionally profound. Private Daily goes much farther than relationship drama: guilty pleasures, embarrassing admissions, private habits, pre-sleep thoughts, personal triggers, money, fears, ambitions, mortality, moral discomfort, taboo thoughts and relationships as just one area. Shady, bold and outrageous with softer moments interspersed.

**LOCKED FORMAT:** A question explicitly labeled This or That has exactly **two** genuinely difficult choices. Character prompts use plain text only: **movie title, character name, explanation/role**. No pictures. Select recognizable characters across mainstream movies, Black cinema and hood classics, and varied genres. Music-based prompts may use **song title, artist, short description**, not lyrics. This format is requested for earlier Free Daily drafts #2, #7, #12 and #14, and Private Daily #4.

**WORKING EXAMPLES, NOT APPROVED COPY:** See `docs/DAILY_CREATIVE_DIRECTION_2026-10-19.md` for user feedback, draft examples, and pending approval status. No exact new Daily content or evidence mappings are approved by this addendum.

## 58. DAILY BATCH 1 EDITORIAL REVIEW (2026-10-19)

**OWNER-REVIEWED, NOT PRODUCTION-APPROVED:** The first 30 new Daily draft prompts have been classified **24 KEEP, 5 REVISE, 1 CUT**. Exact prompt IDs, owner status, and revision notes are preserved in `docs/DAILY_BATCH1_EDITORIAL_REVIEW_2026-10-19.md`. The five revisions are movie/character formats for Free #2, #7, #12, #14 and Private #4 (one-based numbering). The cut is Private #12 (one-based). A KEEP is editorial acceptance of the concept, not approval of final answer copy, evidence mappings, or publication. Do not silently change live content.

## 59. APPROVED CHARACTER DAILY REVISIONS (2026-10-19)

**EDITORIALLY APPROVED:** The exact five character-question revisions for Free #2, #7, #12, #14 and Private #4, including all six character/movie/show choices and their descriptions, are preserved verbatim in `docs/DAILY_APPROVED_CHARACTER_REVISIONS_2026-10-19.md`. They are approved as editorial content, **not yet evidence-mapped, scheduled, or published**. The owner also approved diversifying character formats: trust with secrets, swap lives for 24 hours, worst roommate, and villain reasoning. **PAUSE** additional Daily batches until Claude's result is reviewed. No production changes authorized.

## 60. BUILD 16 DEPLOYMENT STATUS (2026-10-19)

**DEPLOYED (database):** Claude Code's live Supabase checks confirmed the Scoring V2 schema, age-eligibility gate and 991 quiz-choice pole awards from three applied migrations. **BUILT (iOS):** EAS Build 16 completed successfully, ID `f1e45967-7b88-434e-9aac-fcf6dd9ab0a7`. **NOT VERIFIED / NOT AUTHORIZED:** TestFlight submission, on-device acceptance testing, and hardening of the 13-argument `submit_quiz_result` PUBLIC/anon EXECUTE grant. The older 12-argument overload also needs review. Full evidence and audit notes: `docs/BUILD16_DEPLOYMENT_REVIEW_2026-10-19.md`. No new Daily content or scoring mappings published. New Daily batch remains paused pending owner direction.

## 61. BUILD 16 PERMISSION HARDENING AND SUBMISSION (2026-10-19)

**DEPLOYED:** Database migration `20261019020000_restrict_submit_quiz_result_execute.sql` restricted 13-argument quiz-submission RPC execution to authenticated and service roles. Live role checks confirmed anon=false and authenticated/service_role=true for both existing overloads. **SCHEDULED, NOT YET VERIFIED DISTRIBUTED:** Build 16 was submitted to the EAS iOS submission queue, ID `7df0ced8-8e1f-427c-a33b-733bf65f415a`. See `docs/BUILD16_DEPLOYMENT_REVIEW_2026-10-19.md`. No app logic, approved quiz copy, or Daily content changed.

## 62. DAILY NO-REPEATS AND MESSY FREE TONE (2026-10-19)

**LOCKED:** Do not reuse any specific fictional/movie/TV character or song anywhere across the Daily library; movie/show title or musical artist may repeat with different character/song. Audit existing and approved drafts before declaring uniqueness. **LOCKED:** Free Daily must include genuinely unflattering, petty, gross, embarrassing, dishonest, and otherwise imperfect human answers, mixed with soft, funny, deep, and surprising topics. **WORKING DRAFT:** An embarrassing-habits Free Daily question featuring toenail biting, booger flicking, smelling body odor, scratching dandruff, and the comedic refusal 'Ugh... y'all nasty!' is under editorial development, not yet approved. Existing approved character drafts contain collisions that must be resolved with owner approval before publication. See `docs/DAILY_NO_REPEAT_AND_MESSY_FREE_RULES_2026-10-19.md` for detailed rules, conflict examples and proposed wording. No production content changes authorized.

## 63. DAILY BATCH 2 OWNER EDITORIAL REVIEW (2026-10-19)

**EDITORIAL ONLY, NO PRODUCTION CHANGES.** Owner reviewed all 30 Daily Batch 2 proposals, IDs free:15–29 and private:15–29. **26 KEEP, 1 REVISE, 3 CUT.** Free: 14 KEEP, CUT free:22. Private: 12 KEEP, CUT private:20 and private:23, REVISE private:27. Exact owner note for private:27: 'I like where this is going but I feel like everyone would pick success.' The dilemma needs balanced alternatives, subject to owner approval. Full per-ID decision table and exact prompts preserved in `docs/DAILY_BATCH2_EDITORIAL_REVIEW_2026-10-19.md`. KEEP is concept retention, not approval to publish duplicated character/song choices or scoring maps. Enforce no-repeated-specific-character/song rule and audit answer options before finalization. Do not publish or alter app content without authorization.

## 64. DAILY COLLISION AUDIT AND PRIVATE #27 REVISION PROPOSAL (2026-10-19)

**DRAFTS ONLY, OWNER REVIEW REQUIRED.** Forge identified character collisions between approved Batch 1 character answers and proposed Batch 2 options, and drafted specific replacement characters. Proposed Private #27 binary revision: 'Would you rather know you deserved a success you'll never achieve, or discover you didn't deserve the greatest success of your life?' A: 'I deserved it, but I'll never have it. Knowing I was capable might haunt me forever.' B: 'I have it, but I didn't deserve it. Everybody celebrates me, and I know the truth.' These are **not approved**. Full proposed substitutions and limited song inventory: `docs/DAILY_CHARACTER_SONG_COLLISION_AUDIT_2026-10-19.md`. No production changes; full remote/live Daily inventory remains outstanding.

## 65. DAILY BATCH 3 DRAFT PRESENTED (2026-10-19)

**DRAFT, OWNER REVIEW PENDING.** Third 15 Free + 15 Private Daily editorial batch presented, IDs free:30–44 and private:30–44. New themes include embarrassing habits (including owner's 'y'all nasty' opt-out), pettiness, toxic everyday behavior, excuses, curses, moral discomfort, resentment, envy, anonymity, and existential questions. Binary 'This or That' options remain exactly two. Question index: `docs/DAILY_BATCH3_DRAFT_INDEX_2026-10-19.md`; exact option copy currently in ChatGPT Batch 3 review, not yet archived to file. Do not publish, map or schedule pending owner decisions. Earlier no-repeat character/song rule remains binding. The three batches do not yet fulfill the original 90 Free + 90 Private expansion target; a later scope decision is needed.

## 66. DAILY BATCH 3 OWNER REVIEW AND EXACT COPY ARCHIVE (2026-10-19)

**OWNER EDITORIAL DECISIONS LOCKED, NOT PUBLISHED.** Of 30 proposals, 28 KEEP, 1 REVISE, 1 CUT. Free: 13 KEEP, free:39 REVISE (owner note: 'e... the clapping airplane scene is getting redundant.' Replace the airplane-clapping option, not the entire question), free:44 CUT. Private: all 15 KEEP. **Every question and every exact original draft answer option, including cut/revise archival copy, is preserved in `docs/DAILY_BATCH3_FULL_COPY_AND_EDITORIAL_REVIEW_2026-10-19.md`.** Earlier §65 is the pre-review draft index, superseded for editorial status by this §66. No answer reveals, personality evidence mapping, publication or production code changes yet. Next: owner approval of free:39 replacement, reveal copy and evidence mapping, then production only with explicit authorization.

## 67. BATCH 3 FREE #39 REPLACEMENT APPROVED; DAILY REVEAL REVIEW STARTED (2026-10-19)

**OWNER APPROVED** replacing only free:39 option E ('People should stop clapping when airplanes land.') with exact copy: **'Just because we're related doesn't mean I have to like you.'** Question, other options, and free:44 CUT status unchanged. This is an editorial approval, **not** a production edit. The original option remains in the archived draft for traceability. Reveal review has started with five questions, free:30, free:31, free:34, private:32, private:41, six reveal drafts each, shown for owner review in ChatGPT. These reveals are **NOT YET OWNER APPROVED**. Personality scoring mappings are **NOT YET APPROVED**. No app changes or publication authorized.

## 68. FREE DAILY #30 REVEALS OWNER APPROVED (2026-10-19)

**EDITORIAL APPROVAL, NOT PUBLISHED.** Owner approved exact answer + reveal pairs for free:30 options **A, B, C, D, F**, and **CUT option E entirely** (scab picking answer and 'Leave It ALONE.' reveal). Five active approved choices remain; preserve original lettering in the audit record, with any display renumbering only upon authorized implementation. All approved exact titles, bodies, and answers plus cut historical copy are archived in `docs/DAILY_REVEAL_FREE30_APPROVED_2026-10-19.md`. The broader Batch 3 draft archive still includes the superseded E for historical reference, but §68 governs final editorial status. Other reveal questions from Round 1 remain unreviewed. No trait mappings, scoring, app code or production changes authorized.

## 69. CORRECTION TO FREE DAILY #30 REVEAL DECISIONS (2026-10-19)

**OWNER CORRECTION SUPERSEDES §68 WHERE CONFLICTING.** Free:30 **D (dandruff scratching) CUT answer and reveal**. **E (scab picking) KEEP answer, REVISE reveal**, rather than cutting the entire option. A, B, C, F remain fully approved. New E reveal proposal awaiting owner approval: **'The Healing Process Has Left the Chat.'** / 'Your body made a scab to protect the wound. You saw a tiny little edge and decided to start renovations.' Exact corrected statuses and original rejected reveal are preserved in `docs/DAILY_REVEAL_FREE30_CORRECTION_2026-10-19.md`. No production changes authorized.

## 70. FREE DAILY #30 SCAB-PICKING REVEAL APPROVED (2026-10-19)

**OWNER APPROVED, EXACT COPY, EDITORIAL ONLY.** Free:30 option E answer: 'Picking at a scab even though I know better.' Approved reveal title: **'The Scab Has Filed a Restraining Order.'** Approved body: **'Your skin is trying to heal, and you keep showing up to disturb the peace. LEAVE HER ALONE!'** This supersedes the rejected original reveal and the unapproved 'Healing Process' proposal in §69. **Final Free:30 editorial status: A, B, C, E, F approved answer + reveal; D dandruff answer and reveal CUT.** Canonical exact copy and audit trail: `docs/DAILY_REVEAL_FREE30_OPTION_E_FINAL_APPROVAL_2026-10-19.md`, `docs/DAILY_REVEAL_FREE30_APPROVED_2026-10-19.md`, and `docs/DAILY_REVEAL_FREE30_CORRECTION_2026-10-19.md`. No production changes or evidence mapping approval.

## 71. FREE DAILY #31 REVEAL OWNER REVIEW (2026-10-19)

**EDITORIAL DECISIONS SAVED, NOT PUBLISHED.** Free:31 A/B/E answer + reveal exact copy APPROVED; C/D answer retained but reveal marked REVISE; F answer and reveal CUT entirely. C owner instruction exact: 'use apparently here'; D marked REVISE with no specific explanation. Assistant proposed C: 'The Grammar Grudge.' / 'Apparently, they're the grammar police, and you're a repeat offender. Nobody asked them to patrol your sentences.' Assistant proposed D: 'Congratulations, I Guess' / 'We're all so proud of you. We were proud the first six times you mentioned it, too.' Both replacement reveals are **DRAFTS, NOT OWNER APPROVED**. Original answer/reveal wording, owner statuses, and proposed replacements archived in `docs/DAILY_REVEAL_FREE31_EDITORIAL_REVIEW_2026-10-19.md`. No production, scoring, or scheduling changes.

## 72. FREE DAILY #31 REVISED REVEALS APPROVED (2026-10-19)

**OWNER APPROVED** the two proposed replacement reveals in §71. C ('They kept correcting my grammar.') approved reveal: **The Grammar Grudge.** / **Apparently, they're the grammar police, and you're a repeat offender. Nobody asked them to patrol your sentences.** D ('Their fake humble-bragging was exhausting.') approved reveal: **Congratulations, I Guess** / **We're all so proud of you. We were proud the first six times you mentioned it, too.** Exact copy preserved in `docs/DAILY_REVEAL_FREE31_EDITORIAL_REVIEW_2026-10-19.md`. **Final Free:31: A/B/C/D/E approved answer + reveal; F cut entirely.** Editorial only, no production or scoring changes.

## 73. BUILD 17: CREATURE PREVIEW, PHOTO SAVE FIX, AGE RANGE (2026-10-19)

**APPROVED UX DIRECTION.** Your Read (`creature-read.tsx`) shows the Creature exactly once — the existing primary avatar, now tappable, with a "Tap to view your Creature" cue. Tapping opens an immersive full-screen preview modal (dark plum celestial background, `PortalRings`/`CelestialWash` — the app's own existing look, not an invented one): the Creature large and centered with its atmospheric glow, its real name in the established serif-italic treatment, a visible close button, and two actions, **Share Creature** and **Save to Photos**, sized responsively so smaller iPhones never clip. The capture target used by both actions is a dedicated subtree (Creature + name + "apparently you." mark only) structurally separate from the modal's close button and action row, so a saved or shared image can never include app chrome. Same Creature recipe throughout — no regeneration, no identity-logic change. First Form and mixed Creatures both use the one shared modal.

**ROOT CAUSE FOUND (Save to Photos), not assumed.** Read the installed `expo-media-library@57.0.5` source directly: its default/"next" entry point's `saveToLibraryAsync` is a deprecated compatibility shim that unconditionally throws at runtime, regardless of permissions, capture success, or device state (`requestPermissionsAsync` on that same default export does still work, which is why the permission prompt succeeded right up until the save itself always failed). Fix: import from the package's own fully-functional `expo-media-library/legacy` entry point instead — no other logic change required. Verified against the live Info.plist config (`photosPermission: false` correctly deletes the read-permission key; `savePhotosPermission` correctly sets the add-only key) and confirmed this plugin config was never the problem.

**IMPLEMENTED:** native Share via `expo-sharing` (installed at the SDK-57-compatible version through `expo install`, config plugin added inert/no-op since no share-extension options were passed) — shares the real captured Creature image, never a text message or whole-screen screenshot; iOS resolves the share-sheet promise on cancel the same as on completion, so cancellation is never shown as an error.

**13-17 AGE RANGE:** confirmed present and selectable in both onboarding and Settings via the single shared `AGE_RANGES` array (`src/data/onboarding.ts`) — the two screens read the same source, so they cannot drift apart. **CRITICAL BOUNDARY REVERIFIED:** this is a demographic field only. Settings does not import anything from the separate, immutable age-eligibility module and cannot reach it; selecting an age range writes only the `ageRange` profile field through the ordinary profile-update path. The 13+/18+ eligibility gate controlling Apparently Private remains entirely separate, set once at onboarding's age-gate step, and unaffected by any later age-range edit.

**STATUS:** implemented and automated-validated locally (`scripts/validate-creature-preview-photo-and-age-range.ts`, full lint/typecheck/validator suite green). No production database change performed. No unrelated content (Daily, personality scoring, Creature identity, What's Your Type?, subscriptions/pricing) modified.

## 74. BUILD 17 EAS BUILD AND TESTFLIGHT SUBMISSION (2026-10-20)

**BUILT.** EAS iOS build `37749053-3eed-4173-816b-ed07ccdafb3e`, profile `testflight`, status FINISHED. Version 1.0.0, build number 17, from commit `8a42ace` (verified by matching `gitCommitHash` on the build record). Artifact: https://expo.dev/artifacts/eas/kHRzHuVYwUT3FPISWnLgVYcXgdjk8mjHdyMJuAFndcs.ipa. Build log: https://expo.dev/accounts/mekityus/projects/apparently-you/builds/37749053-3eed-4173-816b-ed07ccdafb3e.

**SUBMITTED.** EAS submission `467363e7-f309-4438-9950-9ea96d4edfd7`, status FINISHED (EAS successfully handed the exact Build 17 artifact off to Apple — submitted by explicit build ID, not `--latest`, to remove any ambiguity). ASC App ID `6809013466`.

**APPLE PROCESSING CONFIRMED** via `eas submit:status`: build **1.0.0 (17)** now appears in App Store Connect's TestFlight list — **internal: in beta testing** (internal testers can install now), **external: ready for beta submission** (external/public TestFlight distribution has NOT been submitted — that is a separate, not-yet-taken step). Build 16 (1.0.0 (16)) remains the most recent build previously fully distributed to both internal and external testers.

**NOT DONE, NOT AUTHORIZED THIS PASS:** submitting Build 17 for external beta review/distribution. **NOT YET VERIFIED:** any physical-device testing of the three Build 17 fixes — see `docs/BUILD17_DEVICE_TEST_CHECKLIST_2026-10-19.md` (unchecked). No Daily content, personality scoring, Creature identity/evolution, What's Your Type?, subscriptions/pricing, or database migrations touched.

## 75. SOURCE-OF-TRUTH RECONCILIATION: BUILD 17 AND OCTOBER 20 EDITORIAL WORK (2026-10-20)

**DOCUMENTATION UPDATE, NOT A NEW CREATIVE APPROVAL.** The canonical Markdown Bible is now indexed as the October 20 governing edition. The original v1.4 text remains preserved as historical baseline; later owner-approved addenda and exact approved-content files govern conflicting decisions. This entry records repository evidence, not a change to quiz copy, scoring, production data, or subscription behavior.

**GIT VERIFIED:** Repository `edna-ivey/apparently`; current working branch `feature/private-library-implementation`, clean working tree, local HEAD `41afb2cb25f1e49e6cbdcfa434a263cf27b91ca1` equals `origin/feature/private-library-implementation`. The newer development and documentation work is pushed on this feature branch. **NOT YET MERGED TO MASTER:** the repository's `master` branch is behind the feature branch; reviewing only master gives an obsolete picture of product progress. Never claim that master is the latest implementation without comparing branches.

**BUILD 17 TRACEABILITY:** §74 records EAS build 1.0.0 (17), built from commit `8a42ace`, submitted to Apple and processed for **internal TestFlight**. Later October 19–20 commits on the feature branch include editorial documents and asset maintenance that are **not automatically part of the Build 17 binary**. External TestFlight submission and physical-device acceptance of the Build 17 fixes remain unverified per §74 and `docs/BUILD17_DEVICE_TEST_CHECKLIST_2026-10-19.md`. Do not conflate latest repository HEAD with the build artifact.

**OCTOBER 20 DAILY EDITORIAL WORKBOOK, WORKING ONLY:** `docs/DAILY_ONE_PASS_FULL_WORKBOOK_2026-10-20.md` now consolidates **90 original question slots** (Free and Private combined, including CUT archival entries) for one-pass owner review. It is **not** 90 approved or published new questions per room. It includes 428 active answer options with proposed evidence mappings, 135 individually reasoned and 293 rough lexical candidates needing substantive review. Batch 2 original answer choices were not recovered; 27 answer sets are newly authored proposals. Only the explicitly owner-approved reveals/character revisions within the workbook retain their approved status; the rest are drafts. No publication, database change, or evidence-scoring implementation is authorized by the workbook.

**UNRESOLVED APPROVED-CONTENT COLLISIONS:** `docs/DAILY_COLLISION_AUDIT_2026-10-20.md` identifies Shuri (free:01 C / free:13 B) and Cleo (free:01 B / private:03 E) appearing twice in approved options. Do not silently replace either approved choice. Owner approval is needed to resolve. A full live-library duplication audit remains outstanding.

**KNOWN SCORING CONFLICT STILL OPEN:** §56 and the continuity protocol record that Daily answer mappings may support unlimited genuinely justified trait poles, at most 3 evidence points per pole, while normalization/editor code has imposed a three-effect count cap. No fix is asserted by this documentation update; verify current code and tests before changing its status.

**NEXT REQUIRED RECONCILIATION:** inspect current feature-branch implementation, live Supabase migrations/content, EAS/TestFlight acceptance, App Store Connect configuration, and owner-approved content registry. Mark each separately as APPROVED, IMPLEMENTED, DEPLOYED, TESTED, or OPEN. Reconcile outdated original sections through explicitly reviewed edits, not silent rewriting. Update this Bible and the continuity protocol in the same work cycle. No launch-ready assertion is made by this entry.

## 76. BUILD 17 PRODUCT-TO-CODE AUDIT (2026-10-20)

**AUDIT ONLY, NO IMPLEMENTATION AUTHORIZATION.** Detailed findings and verification boundaries are in `docs/BUILD17_PRODUCT_CODE_AUDIT_2026-10-20.md`. Repository TypeScript and lint checks passed. Current code still truncates Daily evidence to three effects per answer, contrary to §56. Current paywall/purchase-service UI implements monthly subscription only; owner-approved annual and first-year Founding Member plans are not yet represented in that purchase flow. Account deletion control was not found in targeted Settings inspection. Build 17 physical-device checklist remains unchecked. Daily workbook remains draft-only and approved character collisions unresolved. Live Supabase, RevenueCat/App Store Connect and iPhone functionality were NOT verified in this code audit. Do not call these deployed or launch-ready without independent evidence.

## 77. OWNER CONFIRMATION: BUILD 17 ACCEPTANCE AND BUILD 18 SCOPE (2026-10-20)

**OWNER-REPORTED APPROVAL:** The owner states the Build 17 physical-device checklist was completed, verified, and that Build 17 is fully approved and working as expected. This supersedes the earlier `unchecked` / `not verified` status as a **reported acceptance decision**, pending attached screenshot/test evidence for the audit archive. Do not erase the original checklist or retroactively represent independent execution by the assistant.

**LOCKED FOR BUILD 18:** Remove the limit of three personality traits/effects per Daily answer; retain the **maximum of three points per individual trait/pole** and only map evidence genuinely supported by the selected answer. Build 18 will include the October 20 Daily editorial work **only after the owner's mapping/copy approvals**. Draft workbook content is not automatically production approved.

**BUILD 18 ENGINEERING FOCUS:** Fix Daily evidence-count limit across editors, normalization, persistence and tests; implement owner-approved monthly, annual and Founding Member first-year subscription offers with accurate renewal disclosure and Apple/RevenueCat eligibility; implement in-app account deletion with server-side data cleanup, subscription cancellation warning, and policy/terms/support links. Keep unrelated UI/identity/content unchanged. Owner will review mappings in parallel.

**APP STORE DOCUMENTATION:** Pre-publication policy, terms, privacy worksheet, metadata, reviewer notes, owner action checklist and critical-path timeline are in `docs/app-store/`. These drafts are not published policies, final legal advice, or verified App Store Connect declarations. Finalize after service inventory and owner approval. Public App Store launch is a goal, not an assured date.

## 78. BUILD 18 IMPLEMENTATION SPRINT (2026-10-20)

**IMPLEMENTED, repository-verified (tsc/lint/39 validators green); NOT live-system-verified.**

**WP1 Daily trait-count cap removed.** `src/data/daily-questions.ts` and
`src/app/admin/(protected)/review/[id].tsx` no longer cap/slice the number of distinct
trait poles one Daily answer can carry (the removed `MAX_PERSONALITY_EFFECTS_PER_OPTION = 3`
conflated "points per pole" with "poles per answer" -- only the former is a real limit).
Duplicate-dimension-per-answer prevention is preserved (client editor guard + a new
`dedupeEffectsByDimension` dedup on load/save) and the real per-pole magnitude ceiling
(`PersonalityEffectValue` = -3..3) is untouched. The live `handle_daily_answer_personality_
evidence` trigger and `admin_update_daily_option` RPC were confirmed (by reading the actual
migration SQL) to have never had a count cap server-side -- this was a client-only bug.
**STAGED, NOT APPLIED:** `20261020010000_daily_option_effects_validation.sql` adds
defense-in-depth server-side validation (dimension allow-list, -3..3 range, duplicate-
dimension rejection) to `admin_update_daily_option`, explicitly with no count limit.
Verified: `scripts/validate-daily-trait-count-removal.ts` (0/1/3/5/10/20-trait matrix).

**WP2 Monthly + Annual + Founding Member subscription selection implemented.**
`src/services/purchases-service.ts`: `getApparentlyPrivateOfferings` resolves both real
packages from one live RevenueCat offering fetch; `checkApparentlyPrivateAnnualIntroEligibility`
checks REAL Apple/StoreKit eligibility via `checkTrialOrIntroductoryPriceEligibility` (fails
closed to "not eligible" on any error) -- Founding Member framing shows ONLY when a real
`introPrice` exists on the product AND this customer is confirmed eligible; otherwise the
plain annual price shows, never a false promise. **Verified Apple mechanism, not assumed:**
Apple has no "first N users" targeting for introductory offers -- Founding Member is modeled
as a real StoreKit Introductory Offer (Pay Up Front, 1 year, 1 cycle) on the annual product,
auto-granted by Apple to any customer new to the subscription group. `src/app/paywall.tsx`
shows both plans, always-visible renewal disclosure (real `product.priceString`, never
hardcoded), Privacy/Terms links. **OWNER ACTION REQUIRED, documented exactly:**
`docs/app-store/OWNER_APP_STORE_ACTIONS.md` item 2-3 now gives the precise App Store
Connect + RevenueCat steps (create `apparently_private_annual`, attach the Introductory
Offer, attach both products to the `apparently_private` entitlement, add annual to the
`default` offering). No product id asserted to already exist. Verified:
`scripts/validate-subscription-plans.ts`, including a regression guard that the tester
override still never ORs into real premium gating.

**WP3 In-app account deletion implemented.** New `supabase/functions/delete-account`
(not yet deployed) derives identity ONLY from the caller's own verified JWT (no target-user
parameter exists, which is what prevents one user from deleting another's data) and calls
`auth.admin.deleteUser`, which cascades through every user-linked table -- verified directly
against the real CREATE TABLE statements in every migration (`profiles`, `daily_answers`,
`quiz_results`, `personality_evidence`, `personality_pole_evidence`, `user_entitlements`,
`tester_access_grants`, `quiz_shares` via `sharer_user_id`, and `compare_responses` via
`quiz_shares`'s own cascade -- the same chain that invalidates a deleted user's share tokens).
`src/services/account-deletion-service.ts` clears local storage/session ONLY after the
server confirms real deletion. Settings now has a Delete Account action (explicit confirm,
explains what's removed, explicitly states this does NOT cancel an Apple subscription, links
to Manage Subscription) plus real in-app Privacy Policy / Terms of Use pages (`/privacy-
policy`, `/terms-of-use`) -- not external links to a page that may not exist yet; both
screens honestly show a "pre-publication draft" banner rather than presenting unfinished
legal text as final. Explicitly NOT deleted (documented in the Edge Function itself): the
RevenueCat customer record/Apple subscription history, prior diagnostic events already sent
to Sentry, and pre-deletion database backups until their own retention expires. Verified:
`scripts/validate-account-deletion.ts`.

**WP4 content boundary held.** No Daily question/answer/reveal content, mapping, or the
Shuri/Cleo collision was touched -- confirmed by diff (only normalization/editor MECHANISM
code changed in `daily-questions.ts`, zero content lines).

**NOT DONE THIS PASS, explicitly:** no EAS build, no TestFlight submission, no database
migration applied, no Supabase Edge Function deployed, no live RevenueCat/App Store Connect
configuration performed or verified, no physical-device test executed. See the Build 18
completion report for the full punch list and exact owner-action items.


## 78. APP STORE CONNECT OWNER SCREENSHOT RECONCILIATION (2026-10-20)
Owner-supplied screenshots confirm active paid agreement, banking, W-9, DSA, one existing monthly subscription product, unstarted privacy disclosure, incomplete version 1.0 listing and pending updated Apple developer agreement. Build 17 visual evidence and owner acceptance recorded. Exact findings and action order: `docs/app-store/APP_STORE_CONNECT_SCREENSHOT_AUDIT_2026-10-20.md`. Apple account is displayed under an individual's name; SGV legal operation does not by itself change App Store seller display. Company exact legal name and support domain email to be confirmed. Claude is actively editing Build 18 trait-limit files; do not overwrite its working tree.


## 79. BUSINESS EMAIL SETUP OWNER CONFIRMATION (2026-10-20)
Owner confirms Zoho Mail Lite domain aliases and send-as display names are configured, with incoming and outgoing email tests completed. Apparently You: `hello@apparentlyyou.com`, `support@apparentlyyou.com`, `privacy@apparentlyyou.com`; parent brand: `hello@supergreatventures.com`. Existing Zoho mailbox retained; no Google Workspace or extra licenses required. This closes the email provisioning item only, NOT legal-operator confirmation, published policy/terms, App Store metadata, subscriptions, testing, or release. Owner action list synchronized: `docs/app-store/OWNER_APP_STORE_ACTIONS.md`.


## 80. POST-CLAUDE BUILD 18 HANDOFF AND RELEASE PLAN (2026-10-20)
Reviewed owner-provided Claude sprint transcript (WP1 scoring count cap, WP2 subscription selection/eligibility, WP3 deletion and draft legal screens). Claude reported tsc, lint and 39 validators passing, migration dry-run only, commits 19482f7/52af00a/ef2183f/dd60177 pushed. Local Git verified synchronized at 01903f9 including Zoho email milestone. No Build 18 binary, Supabase deployment, live Apple/RevenueCat annual setup or real-device acceptance yet. Screenshot audit also shows updated Apple Developer Program agreement pending acceptance; verify current state. Updated `docs/app-store/OWNER_APP_STORE_ACTIONS.md` and `docs/app-store/LAUNCH_TIMELINE_ESTIMATE.md` with role-specific priorities and 3–6-day submission working estimate plus variable Apple review. Preserve separation of IMPLEMENTED versus DEPLOYED/TESTED/APPROVED.


## 81. APPLE AGREEMENT CONFIRMED AND THREE-WAY BUILD 18 HANDOFF (2026-10-20)
Owner explicitly confirms updated Apple Developer Program License Agreement accepted. Mark complete, not pending. Owner instructions, Claude deployment/build responsibilities, and Forge product/privacy/launch review are tracked in `docs/app-store/BUILD18_OWNER_CLAUDE_FORGE_HANDOFF_2026-10-20.md`. Annual and Founding Member setup, Supabase migration/function deployment, live TestFlight Build 18, legal signoff, and App Store listing still OPEN until independently verified.

## 82. BUILD 18 DEPLOYMENT-READINESS RE-VERIFICATION, NOT ASSUMED FROM PRIOR REPORTS (2026-10-20)

**RE-VERIFIED FRESH (not assumed from the Build 18 sprint report):** repo at `03e1aa6`, clean, matches origin. All four sprint commits (19482f7/52af00a/ef2183f/dd60177) confirmed present with their real files on disk. `npx tsc --noEmit`, `npm run lint`, all 39 validators: clean/green, run again this pass. Linked Supabase project confirmed live: `apparently-you` (ref `rjslgjxlpsjljbrlxfet`, ACTIVE_HEALTHY). `supabase migration list` confirms every migration through `20261019020000` is applied; `20261020010000` is NOT applied. `supabase functions list` confirms only `sync-revenuecat-entitlement`/`revenuecat-webhook` are deployed -- `delete-account` is NOT deployed. Nothing was deployed by anyone else either.

**NEW FINDING on fresh re-inspection (not in the sprint report):** `daily_questions.approved_by` and `tester_access_grants.granted_by` reference `auth.users(id)` with NO `ON DELETE` clause at all -- confirmed live via `pg_get_constraintdef`, defaults to `NO ACTION`. Irrelevant to a regular consumer's own deletion (they never appear in either column), but would block an ADMIN account's OWN self-deletion if that admin had approved a question or granted tester access (a safe failure -- no corruption -- just not the intended outcome). **STAGED, NOT APPLIED:** `20261021010000_admin_attribution_fk_set_null_on_delete.sql` fixes both to `ON DELETE SET NULL` (never CASCADE, which would wrongly delete the approved question/grant itself).

**Prepared, not yet run:** `scripts/test-delete-account-integration.ts` -- a real end-to-end smoke test against the LIVE linked project using a disposable anonymous account it creates itself (never a real user), verified via project-admin CLI query (not the app's own service-role key) that both the account and its cascaded data are actually gone post-deletion. Cannot run until delete-account is actually deployed.

**Phase 3 (subscriptions) code re-verified fresh, unchanged from the sprint:** monthly/annual/Founding-Member-eligible/ineligible/restore/failed-purchase/expiration-via-CustomerInfo-listener/renewal-disclosure/tester-override-independence all confirmed present in `purchases-service.ts`/`paywall.tsx` by direct re-read. **Cannot independently verify RevenueCat dashboard or App Store Connect product configuration from this environment** (no RevenueCat secret key, no App Store Connect API credential available here) -- owner/Forge confirmation required.

**Phase 5:** addressed the review-notes `[NEEDS CLAUDE]` item with the real, already-built, production-safe reviewer-access mechanism (`tester_access_grants`/`has_tester_access()`, additive to real entitlement checks, never a bypass) in `docs/app-store/REVIEW_NOTES_DRAFT_2026-10-20.md`. Verified the Sentry integration (`observability.ts`) actually matches the privacy draft's "we aim not to transmit quiz answer text" claim -- explicit allow-list event construction, `sendDefaultPii: false`, `attachScreenshot: false` -- no mismatch found. Updated Settings' temporary support email to the real, owner-confirmed `support@apparentlyyou.com` (the earlier `edna.tyus@gmail.com` placeholder predated the Zoho setup). Added a real `/support` in-app+web page and `vercel.json` rewrites for the public `/privacy`/`/terms` short paths to the existing real screens -- **prepared only; no `vercel` deploy command run, no change pushed to the live apparentlyyou.com site.**

**STILL OPEN, unchanged:** annual/Founding Member StoreKit+RevenueCat configuration, both staged migrations applied, delete-account deployed and integration-tested, Build 18 EAS/TestFlight, legal entity/contact finalization, App Store Connect metadata/App Privacy/age rating. See the Build 18 deployment report for the full APPROVED/IMPLEMENTED/DEPLOYED/TESTED table and exact next actions per owner/Claude/Forge.

## 83. SUBSCRIPTION IMPLEMENTATION COMPLETION: EXISTING-SUBSCRIBER "VIEW PLANS" (2026-10-20)

**OWNER-STATED (not independently re-verified against the RevenueCat dashboard from this
environment -- same credential limitation as §82):** RevenueCat now has entitlement
`apparently_private`, offering `default`, packages `$rc_monthly`/`$rc_annual`, products
`apparently_private_monthly`/`apparently_private_annual`, both attached to the one
entitlement. Confirmed by direct code re-read that `getApparentlyPrivateOfferings()` already
reads exactly these RevenueCat conventions (`offering.monthly`/`offering.annual`, which ARE
the typed accessors for `$rc_monthly`/`$rc_annual`) -- **no code change was needed for this
mapping; it was already correct.**

**REAL GAP FOUND AND FIXED:** the owner's own active monthly subscription only ever showed
"You're already in" on the paywall, with no way to see plan options at all -- which also
meant no reliable way to capture App Store review screenshots of both plans without
cancelling. Added a real **"View plans"** toggle to the existing-subscriber state in
`src/app/paywall.tsx`:
- Reveals the SAME real `PlanCard`s every free visitor sees (no second/fake purchase screen).
- Marks whichever plan is the real active one with a **CURRENT PLAN** badge, read from
  `CustomerInfo.entitlements.active[apparently_private].productIdentifier` -- never inferred
  from UI selection.
- The Subscribe/Switch button is disabled and labeled "Current Plan" when the selected plan
  IS the real active one (no duplicate-purchase tap possible); labeled "Switch Plan →" for a
  different plan while already a subscriber (Apple's own subscription-group upgrade/downgrade
  proration applies automatically via the same `Purchases.purchasePackage` call already used
  for a first subscription -- no separate switch code path was written, since both products
  already share one Apple subscription group).
- Restore Purchases is now reachable from this state too, not only the free-visitor state.
- The paywall never writes to premium/entitlement state directly anywhere -- confirmed by
  source check: it only reads `usePremiumStatus()` and calls the real
  `subscribeToPackage`/`restorePurchases` functions, so a paid entitlement can never be
  locally revoked, reset, or faked from this screen.

Full test-scenario matrix (what's code-complete vs. what's blocked on a real sandbox/device)
recorded in `docs/app-store/SUBSCRIPTION_TESTING_2026-10-20.md`. `scripts/validate-
subscription-plans.ts` extended with 11 new checks for this change. Full suite (tsc, lint, 39
validators) green.

## 84. BUILD 18 EAS/TESTFLIGHT DEPLOYMENT, FRESHLY VERIFIED (2026-10-20/21)

**Context:** a prior report described Build 18 as queuing; the owner relayed that Forge
independently checked EAS and still saw Build 17 as the latest build. This section records
only facts re-confirmed by direct, independent tool calls made after that correction --
not the earlier queuing report.

- EAS build `ff9c78bb-3066-426d-9c70-551120e8ca7d`, platform iOS, profile `testflight`,
  `appBuildVersion` 18, `appVersion` 1.0.0, status **FINISHED** (verified via
  `eas-cli build:view --json`, re-checked twice: first showed `IN_PROGRESS`, second
  showed `FINISHED`). This is why Forge's independent check still showed Build 17 as
  latest -- the archive upload had completed but Apple-side native compilation had not;
  the build was never lost, failed, or silently abandoned. No restart was needed or
  performed; `app.json`'s `ios.buildNumber` was NOT incremented again (still `"18"`).
- `gitCommitHash` on the finished build is `e9a688e804f3bcfd4562a17093c29cbbba656044`,
  confirmed equal to both local `HEAD` and `origin/feature/private-library-implementation`
  at verification time (`git rev-parse` both, identical hash) -- the exact commit included
  is this one, with no drift between the build and the pushed branch.
- Submitted to TestFlight via `eas-cli submit --platform ios --profile testflight --id
  ff9c78bb-3066-426d-9c70-551120e8ca7d` (explicit build id, not `--latest`). EAS submission
  `d3e30415-9a08-4828-a3d6-82136e7db9bc`, status **FINISHED** per `eas-cli submit:view
  --json`, no error.
- **Apple-side TestFlight processing, confirmed on a follow-up independent check
  (~3 minutes after submission):** `eas-cli submit:status --platform ios` now lists
  `1.0.0 (18) -- internal: in beta testing, external: ready for beta submission`. Internal
  testers (the owner's own internal TestFlight group) can install Build 18 now. External
  testing group distribution requires a separate, manual App Store Connect step (Apple's
  normal external-beta-review submission) -- "ready for beta submission" is the expected
  state before that manual step, not an error or stall.
- No public App Store release action was taken or requested; only the TestFlight
  submission above was performed, consistent with the standing constraint against
  submitting for public review.

## 85. BUILD 19: SETTINGS "VIEW PLANS" + CREATURE READ EDITORIAL POLISH (2026-10-21)

**Diagnosis of the reported Settings bug:** NOT a RevenueCat/App Store Connect/StoreKit
problem. Re-read `purchases-service.ts` and confirmed it already resolves monthly/annual
packages from the live RevenueCat offering with no hardcoded price (unchanged since §83/§84).
The real defect was pure app-code navigation: Settings' Apparently Private card gave an active
subscriber only "Manage Subscription →" (Apple's external page) with no path back into the
app's own paywall at all -- a free visitor already had a paywall link ("Subscribe →"), an
active one did not.

**Fix (`src/app/settings.tsx`, `src/app/paywall.tsx`):** added a real "View Plans →" action for
BOTH free and active subscribers, alongside the unchanged "Manage Subscription →" (active
only) and unchanged "Restore Purchases." For an active subscriber it links to
`/paywall?view=plans`; the paywall now reads that param via `useLocalSearchParams` and
initializes the existing "View plans" toggle (built in §83) to true, so the subscriber lands
directly on the real monthly/annual plan cards instead of needing a second tap past "You're
already in." Nothing requires cancelling or deleting anything first. Purchasing/eligibility/
duplicate-purchase-prevention logic itself is untouched this pass -- `scripts/validate-
subscription-plans.ts` extended with a new section 9 covering the Settings action; full 39/39
validators, tsc, and lint all green.

**Creature Read editorial pass (`src/data/creature/creature-combined-read-copy.ts`):**
implemented the owner-approved Zorafox grammar rule as general assembly logic, not a
hardcoded special case for Zorafox:
- Paragraph 1 folds supportingCopy's first sentence into the opening fragment via "and"
  whenever that sentence is a real declarative clause (ends in "."); a "?"/"!" rhythm fragment
  (e.g. social_attunement.positive's "A shift in tone?") falls back to the original
  period-separated join instead of forcing an unnatural conjunction onto it.
- Paragraph 2 works "Apparently," into the closing thought (supportingCopy's last sentence,
  immediately before the shade) ONLY when the shade doesn't already open with "Apparently"
  itself. Most authored shades already do, so most Reads are textually unchanged by this pass;
  it only activates for the two entries that lacked it (`direct_indirect.positive`,
  `social_attunement.positive`).
- Verified exactly, word for word, against the approved example: Zorafox (Direct + Vibe
  checker) headline "You say what you mean, and you hear what everyone else doesn't.",
  paragraph 1 "You're direct enough to make your point clear and you don't make people decode
  your intention. When something needs to be said, you say it.", paragraph 2 "You're also
  perceptive enough to catch what people leave unsaid. A shift in tone? Noticed. A change in
  energy? Clocked. Apparently, you don't just listen to words. You read the room they're spoken
  in."
- No underlying `CREATURE_COMBINED_READ_COPY` content (header/openingFragment/supportingCopy/
  shade strings) was rewritten -- only the assembly formula that joins them changed.
- `buildParagraph1`/`buildParagraph2` exported for direct validator testing (not a public
  product API). `scripts/validate-combined-creature-read.ts` extended with fixture-level
  join/fallback/inject unit tests plus a full 1,520-ordered-combination sweep confirming zero
  duplicated "Apparently," and zero double spaces anywhere in the output space.

**Flagged for owner review, NOT silently rewritten (data unchanged):** across a representative
sweep of all 40 trait poles used as the FIRST trait, four produce a long three-"and" compound
sentence under the new join rule -- grammatically valid, no garbled or duplicated text, just
longer than most: **Rule-bending**, **Private**, **Open**, **Patient**. Example (Open as
first): "You're open enough to share your thoughts and feelings without hiding behind a perfect
image and you connect through honest conversations and feel comfortable letting people see the
experiences that have shaped you." Owner should review these four and decide whether to accept
as-is, or tighten the underlying `supportingCopy` wording for those four entries in a separate,
explicitly-approved content change.

**Age range verification (item 3 of the Build 19 brief), verified not assumed:** confirmed by
code read that Settings' demographic `ageRange` field (`onboarding.ts`/`updateUserProfile`) and
the separate 18+ Private Private content gate `ageEligibility` (`age-eligibility.ts`/
`upsertAgeEligibility`) are structurally independent -- different storage keys, different
services, no shared code path, and neither touches RevenueCat/subscription state at all.
Changing the Settings age-range selector cannot bypass the 18+ gate or alter subscription
entitlement. No defect found; no code changed, per the brief's "no unrelated age-gating changes
unless a genuine defect is found."

**Verification performed this session:** `npx tsc --noEmit` clean, `npm run lint` clean, full
39/39 `scripts/validate-*.ts` suite green (including both extended validators above).
**NOT verified this session -- requires a physical iPhone or simulator, unavailable in this
environment:** small-iPhone visual layout (clipping/overlap/control reachability) for the new
Settings buttons and the Creature Read combined-card spacing; on-device purchase/restore/
plan-switch flows (same open sandbox/device blockers as §83's test matrix, unchanged by this
pass). Full test matrix: `docs/app-store/SUBSCRIPTION_TESTING_2026-10-20.md` (navigation
addition noted there too).

## 86. BUILD 19 CLEANUP PASS: RE-VERIFICATION + CREATURE READ EDITORIAL PROPOSALS (2026-10-21)

**Task 1 re-verification (code-level only, fresh re-read, nothing assumed from §85):**
- `purchases-service.ts` confirmed unchanged and correct: entitlement id is exactly
  `apparently_private`, offering id exactly `default`, `getApparentlyPrivateOfferings()`
  resolves `offering.monthly`/`offering.annual` (RevenueCat's own typed accessors for the
  `$rc_monthly`/`$rc_annual` predefined package slots) with a documented fallback scan by
  `PACKAGE_TYPE`/literal identifier, and returns `{monthly: null}`/`{annual: null}` as a
  normal non-error state rather than inventing a package.
- **What is NOT verifiable from this environment:** whether the LIVE RevenueCat `default`
  offering actually has `$rc_monthly`/`$rc_annual` attached to `apparently_private_monthly`/
  `apparently_private_annual` right now. Only the public iOS SDK key
  (`EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`) is present in this environment -- no RevenueCat
  dashboard/admin API credential exists here (same gap as every prior pass). This requires
  either RevenueCat dashboard access or a live device/sandbox fetch; the code is verified
  ready to read whatever is actually configured there, nothing more.
- Pricing preservation reconfirmed by grep: no literal `$3.99`/`$29.99`/`$19.99` string
  appears anywhere in rendered code paths (`paywall.tsx`, `settings.tsx`,
  `purchases-service.ts`) -- only in code comments documenting the owner-locked targets.
  Every displayed price is still `product.priceString`/`product.introPrice.priceString`.
- Founding Member gating reconfirmed unchanged: the "FOUNDING MEMBER" eyebrow/price only
  renders when BOTH `annualIntroEligible` (a real `checkTrialOrIntroductoryPriceEligibility`
  answer) AND `product.introPrice` (a real StoreKit-reported intro price) are truthy; any
  other case renders the plain "ANNUAL" framing with the plain `priceString`.
- Settings → View Plans reconfirmed intact: an active subscriber's "View Plans →" still links
  to `/paywall?view=plans`, which still initializes the "View plans" toggle to true on arrival
  -- no cancellation/deletion required anywhere in the path. Still code-verified only; the
  actual rendered navigation has not been exercised on a device this pass either (no
  simulator/physical iPhone in this environment, unchanged from §85).
- `npx tsc --noEmit`, `npm run lint`, and the full 39/39 `scripts/validate-*.ts` suite re-run
  fresh this pass: all clean, zero regressions (no code changed this pass -- verification
  only; see §87 note below on why no commit-worthy code change resulted from Task 1).

**Task 2: Creature Read editorial review of the four flagged first-trait passages.** On
close inspection, there is no single general assembly-logic rule that explains all four, nor
one that would fix exactly these four without also silently changing ~25 other currently-fine
combinations that share the same "openingFragment or supportingCopy already contains its own
'and'" shape (e.g. "Decisive," "Face value," "Idealistic," "Forgiving," "Content" all join an
opening fragment into a first sentence that already has its own "and," and none of those were
flagged or read as broken) -- a blanket formula change would be exactly the "simplistic
global... awkward grammar" risk the original brief warned against, just inverted. These four
are genuinely individual editorial judgment calls, not a code defect, which is why they are
presented below as PROPOSALS ONLY -- nothing in `creature-combined-read-copy.ts` was changed
this pass, and none of the four have been applied. See the Build 19 cleanup report for the
exact original/proposed text pairs; awaiting the owner's approval before any is applied.

**Task 3:** no genuine regression was found to fix (Task 1 was verification-only; Task 2's
proposals are explicitly unapplied pending approval), so this pass commits documentation
updates only -- see the Continuity Protocol entry for the same date.

## 87. CREATURE READ FINAL EDITORIAL PASS: FOUR APPROVED REWRITES + FULL 40-TRAIT REVIEW (2026-10-21)

**Owner approved the four §86 proposals verbatim; implemented exactly, mechanism documented
below.** Investigated each before touching anything, per the brief's own instruction to
determine whether an approved passage needs an assembly override, adjusted source fragments,
or a more flexible formatter -- found that three (Rule-bending, Private, Open) need the
existing opening-fragment-into-first-sentence join to use a COMMA before "and" (the approved
text reads as two full independent clauses, unlike Zorafox's plain "clear and you don't..."),
while one (Patient) needs the join SKIPPED entirely (its opening fragment already has its own
"and" -- "people AND situations" -- so joining it to the first supportingCopy sentence would
double up; the approved text instead joins supportingCopy's own two sentences together).

**Mechanism chosen: two new optional fields on `CombinedReadComponents`** (`src/data/
creature/creature-combined-read-copy.ts`), both default `undefined`/false so every other
entry -- including the locked Zorafox fixture -- is provably unaffected:
- `commaJoin?: true` -- `buildParagraph1` inserts a comma before "and" instead of the plain
  space. Set on `rules_bending.negative`, `private_open.positive`, `private_open.negative`.
- `skipOpeningJoin?: true` -- `buildParagraph1` always returns the plain period-separated
  fallback, never attempting the opening-fragment join regardless of joinability. Set on
  `patient_urgent.positive`.

This was deliberately NOT done by hardcoding each trait's complete paragraph-1 string as a
special case -- that would have duplicated the content the formula already assembles from
`openingFragment`/`supportingCopy`, and the brief explicitly warned against replacing source
text with complete paragraphs where doing so breaks how the same trait renders in a different
position. Paragraph 2 (the SECOND-trait rendering) never reads either new flag -- confirmed
all four entries still render naturally in the second position using the same, only
content-level-updated `supportingCopy`/`shade` fields (spot-verified by hand and covered by
the full-combination validator sweep).

**Content updated exactly as approved** (`openingFragment`/`supportingCopy`, never `header`
or `shade`, for all four): the exact final strings are in the Build 19 final editorial pass
report. Verified programmatically against the owner's verbatim approved text for all four --
exact match, zero deviation.

**Validator:** `scripts/validate-combined-creature-read.ts` extended with (1) a pinned fixture
for each of the four approved texts (same treatment as the Zorafox pin, so a future change
can't silently regress them), and (2) dedicated `commaJoin`/`skipOpeningJoin` fixture tests
independent of which real entries happen to use them. Full 1,520-combination sweep, Zorafox
fixture, and all other existing checks re-verified green.

**Full 40-trait (20 Core dimensions x 2 poles) review, paragraph 1 as first AND paragraph 2
as second, read end to end against the brief's criteria (flow, "and"-repetition, generic/
robotic phrasing, trait precision, voice, Zorafox preservation):** the four just-approved
entries are the only ones with a genuine run-on or grammar problem. Six additional entries
read slightly less smoothly than the rest -- not broken, but worth a look -- all fixable with
the exact same zero-wording-change `commaJoin` mechanism (a comma only, no word changes):
**Emotionally Intense, Conflict-forward** (a subordinate "and when..." clause reads a touch
abrupt without a comma boundary), **Adventurous, Holds the Receipt** (the joined clause
switches grammatical subject away from "you," which reads smoother with a comma marking the
clause break), and **Face value, Protective** (an existing internal "and" plus the join "and"
read slightly list-like). None of these were applied -- presented to the owner as proposals in
the session report, exact original/with-comma text for each. Every other reviewed entry
(including several with their own internal "and," e.g. Decisive's three-item list "gather...
trust... and move forward") reads naturally as an ordinary compound sentence or list and needs
no change.

**Second-paragraph "Apparently," transitions and shade endings, reviewed separately:** all 40
read naturally; the two existing short-fragment closers ("...You're just very emotionally
invested. In everything." / "...Apparently, you know what you want. Period.") are intentional,
pre-existing punchy stylistic choices consistent with the brand voice, not defects -- left
unchanged.

**Verification:** `npx tsc --noEmit` clean, `npm run lint` clean, full 39/39 validators green.
Build 19 still NOT created or submitted, per explicit instruction.

## 88. BUILD 19 COPY LOCK (TEN APPROVED REWRITES) + TESTFLIGHT PREP (2026-10-21)

**Owner approved the remaining six §87 proposals verbatim; implemented exactly.** All ten
Creature Read paragraph-1 rewrites across this and the prior two passes are now LOCKED,
owner-approved content: Rule-bending, Private, Open, Patient (§87) plus Emotionally Intense,
Conflict-forward, Adventurous, Holds the Receipt, Face value, Protective (this pass).

- **Emotionally Intense, Conflict-forward, Adventurous, Holds the Receipt:** zero wording
  change -- `openingFragment`/`supportingCopy` are exactly what they were before; only
  `commaJoin: true` was added. The owner's approved text was already reachable by the
  existing formula with a comma, confirming these four were genuinely just punctuation/flow
  fixes, not content rewrites.
- **Face value:** `openingFragment`/`supportingCopy` updated to the owner's exact wording
  ("straightforward enough to take people at their word" / "You don't automatically assume
  there's a hidden meaning behind every pause, glance, or comment."), `commaJoin: true`
  added. **Shade updated** to the owner's proposed "Apparently, sometimes a sentence is just
  a sentence." -- checked first against all 39 other shades in the table for duplication or
  conflict (`scripts/validate-combined-creature-read.ts` now asserts this shade appears
  exactly once across all 40 entries); none found, so the new shade was applied rather than
  retained-with-a-reported-conflict. `header` unchanged ("You take people at their word" --
  already consistent with the new opening fragment).
- **Protective:** `openingFragment`/`supportingCopy` updated to the owner's exact wording
  ("someone you love" / "You notice how people treat your people... feels off."),
  `skipOpeningJoin: true` added (its own internal ", and" must not collide with a second
  "and" from the paragraph-1 join -- the approved text keeps the opening fragment as its own
  sentence). `header` and `shade` unchanged, per the brief's explicit "preserve existing
  headers and shades except for the explicitly conditional Face value shade proposal."
- No hardcoded full-paragraph overrides anywhere -- every one of the ten still derives from
  `openingFragment`/`supportingCopy`/`shade` through the one general `assembleCombinedRead`
  formula (`buildParagraph1`/`buildParagraph2`), using only the existing `commaJoin`/
  `skipOpeningJoin` flags introduced in §87 (no new mechanism needed for any of the six).
- Zorafox headline/paragraph1/paragraph2 and the four §87-approved texts re-verified
  byte-for-byte unchanged this pass (confirmed via direct script execution, not assumed).
- `scripts/validate-combined-creature-read.ts` extended: the approved-passage pin list now
  covers all ten exact texts (was four); added a dedicated uniqueness/no-double-injection
  check for Face value's new shade. Full 1,520-ordered-combination sweep, double-space check,
  and double-"Apparently," check all re-run and green.
- Both paragraph positions reviewed by hand for all ten (as first AND as second trait) --
  no awkward transition, duplicate sentence, or misplaced shade found in any.

**Subscription readiness reconfirmed (Task 4), fresh re-check, nothing reused from memory:**
`settings.tsx`/`paywall.tsx`/`purchases-service.ts` are byte-for-byte unchanged since §86 --
confirmed via `git diff` showing no delta. Settings' "View Plans" still links to
`/paywall?view=plans` for an active subscriber; the paywall still reads that param to
pre-expand the real plan cards. `getApparentlyPrivateOfferings()` still resolves
`offering.monthly`/`offering.annual` from the live RevenueCat offering with no hardcoded
price anywhere (re-confirmed by grep: the only `$`-prefixed numbers in these three files are
in code comments documenting the locked targets). Founding Member framing still requires
both a real `annualIntroEligible` answer and a real `product.introPrice` before rendering.
**Still not independently verifiable from this environment:** the live RevenueCat dashboard
configuration itself -- only the public iOS SDK key is present (`EXPO_PUBLIC_REVENUECAT_IOS_
API_KEY`), re-confirmed via `env`/`.env.local` this pass; no dashboard/admin credential
exists here. No on-device/sandbox test was performed (no physical iPhone or simulator
available in this environment).

**Build 19 preparation (Task 6), not creation:** fresh `eas-cli build:list --platform ios`
confirms buildNumber 18 (`ff9c78bb-3066-426d-9c70-551120e8ca7d`) is genuinely still the latest
real build, same as recorded in §84. `app.json`'s `ios.buildNumber` bumped from `"18"` to
`"19"` -- required because the `testflight` EAS profile has `autoIncrement: false`, so without
this bump the next build would have silently reused buildNumber 18 (a duplicate), not
produced Build 19. `npx eas-cli config --platform ios --profile testflight` confirms the
resolved config now shows `buildNumber: "19"` with the correct bundle identifier, plugins, and
environment variables (production env + testflight's tester-access override). Branch is
`feature/private-library-implementation`, working tree clean before this session's edits. No
EAS build or submission was started -- per explicit instruction, Build 19 creation/submission
is deferred pending owner authorization.

**Verification this pass:** `npx tsc --noEmit` clean, `npm run lint` clean, full 39/39
`scripts/validate-*.ts` green (including the newly-extended combined-Creature-Read
validator).
