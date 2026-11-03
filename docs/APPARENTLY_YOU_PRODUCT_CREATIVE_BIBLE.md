# Apparently You Product + Creative Bible

**Current governing product specification | November 2, 2026**

This file contains CURRENT requirements. If a feature is not yet built, its status is tracked in engineering manifests rather than old rules or obsolete drafts here.

**Decision status:** LOCKED = decided; APPROVED = accepted content; WORKING = open to refinement; OPEN = not decided. Approved content must never be silently rewritten.

For exact approved questions, answer choices, reveal copy, result weights, and mappings, use the current approved quiz source documents in `docs/private-quizzes/`. This Bible defines behavior and architecture, not duplicate or historical copies of quizzes.

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

## 15A. ANSWER-LEVEL PERSONALITY SCORING

**LOCKED | Owner-confirmed November 2, 2026. Applies to ALL Daily and quiz questions, public and Private.**

1. **Only a selected answer earns personality trait points.** The selected answer is scored using its individually approved mappings to the 64 frozen trait poles (40 Core, 24 Private). This is the ONLY source of Core/Private trait points. Nothing earns extra identity points at quiz completion, from a result title, a verdict, an archetype, a display tag, a milestone, or a completed quiz as a whole.
2. **Point values are positive +1, +2, or +3 for each supported pole on that answer.** +1 = supporting evidence; +2 = strong evidence; +3 = especially clear, high-confidence behavioral evidence. There is no restriction reserving +3 for any special quiz, ranking, or completion.
3. **No artificial trait-count cap per answer.** One answer may support zero, one, or any number of distinct Core/Private poles when individually justified. Do not pad mappings; never infer a mapping from a joke or result label; do not award both opposite poles of the same dimension from the same choice.
4. **No quiz-level reduction or ranked award.** No top-3/top-5 selection, qualification-before-writing, flattening, multiplier, fixed result-level bonus, or cap on the number of supported traits earned across an answered quiz. Write only the selected answers' approved points, independently, exactly once per eligible answered question.
5. **Result/verdict scoring is distinct and adds ZERO trait points.** Answer-specific result weights determine which quiz reveal the user earns, subject to approved outcome gates and tie-breaking. The earned result is saved as the quiz result. Its text, title, visual tags and result score NEVER award traits.
6. **Core vs Private is determined by the trait dimension, not by where the question appears.** A Private quiz answer may award both Core and Private traits; a public/Daily answer only awards poles that are explicitly approved for that specific answer. There is no automatic Core/Private award because a quiz belongs to a category.
7. **Frozen numeric identity.** Each of the 32 dimensions has two distinct poles and a frozen numeric trait ID (1–64). All evidence records identify the actual pole directly, with a positive magnitude. A negative pole such as Spontaneous or Blunt is not a negative point or penalty.
8. **Profile display is downstream, not another scoring event.** The active profile reads saved answer evidence, resolves the higher qualifying pole per dimension, and ranks qualifying poles for Your Signature, The Undercurrent, Creature and Relic. The approved current eligibility threshold is 9 earned points; up to 7 Core and 3 Private qualifying poles may be displayed. This does not alter, recalculate or award the original answer points. Resolve score ties with the approved earliest-reached timestamp rule.
9. **First completion and retakes.** On the first valid completion of a specific semantic quiz version, each completed question's selected answer may write its approved trait evidence once. A retake can produce a new displayed quiz verdict but NEVER writes additional personality points for that version. A material semantic revision must not reinterpret old answer IDs or previously awarded points.
10. **Daily recurrence.** A specific published Daily occurrence is a scoring opportunity; answering a newly published occurrence can earn its own answer-level evidence. Replaying an already recorded occurrence cannot generate duplicate points.
11. **Active identity window.** Answer evidence remains recorded for audit and lifetime totals; only unexpired evidence influences the current rolling identity according to the locked 12-month active-window rule. This is an eligibility/display calculation, not a new award.
12. **Server authority.** Validate selected choices, the frozen IDs, points, entitlement, version and first-completion uniqueness on the server; the client must agree with server scoring. No unapproved production migrations or data rewrites.

**Single rule to remember: selected answer → approved +1/+2/+3 pole evidence once. Quiz verdict → display/result history only, zero extra trait points.**

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

## 31. APPARENTLY PRIVATE LAUNCH CONTENT

**LOCKED owner-approved editorial target | Local implementation / device QA must still be verified.**

17 playable quizzes total: 3 free previews and 14 premium quizzes. This is the launch scope; additional concepts are not active quizzes.

**Free previews (3):** `keep-you-around`, `be-so-serious`, `secretly-love` (restored as active without duplicating historical completion evidence).

**Premium (14):**
- Love & Soulmates: `love-soulmates-ready`, `love-soulmates-become`
- Career & Ambition: `career-ambition-how-bad`, `career-ambition-proving`
- Hidden You: `hidden-you-wrong`, `hidden-you-hide`
- Shadow Side: `shadow-side-hypocrisy`
- The Good Stuff: `good-stuff-trust`
- Life Match: `life-match-dream-life`, `life-match-freedom`
- Style & Vibe: `style-vibe-intimidating`, `style-vibe-attention`
- Private Private. 😈: `private-private-trouble`, `private-private-proof` (**both adult-eligible subscribers only, enforced server-side; no anonymous mature-result sharing**).

**Approved source:** the full locked 11-change source pack in `docs/private-quizzes/APPROVED_11_QUIZ_SOURCE_PACK_2026-11-02.md`, plus the six separately owner-approved premium specs already in `docs/private-quizzes/`.

Replacing an approved quiz's obsolete definition means editing its active content in place with version-safe user data preservation. Do NOT insert its old questions, old results, or old draft copy as additional active database catalog rows or as extra playable quizzes.

**New quiz writing standard:** aim for 5 genuinely different A–E choices when appropriate; realistic distinct human voices, no predictable letter/result positions, no forced trait mappings; at least 1–2 strong, earned call-out results in each newly approved quiz. Never change the approved copy or approved choice positions without fresh owner authorization.

---

## 32. ACTIVE CONTENT AUTHORITY

Approved quiz copy, answer choices, result scores, answer-level trait awards, result gates and tie-breaks are locked in their canonical current-source files. Code may implement the approved source; it may not rewrite it. An obsolete draft is not an alternative implementation option.

---

## 33. LOVE & SOULMATES SOURCE

The one approved `love-soulmates-ready` quiz source is `docs/private-quizzes/LOVE_READY_APPROVED_LOCKED_2026-10-31.md`. Do not reproduce alternate older result families inside this Bible.

---

## 34. CAREER & AMBITION SOURCE

The one approved `career-ambition-how-bad` quiz source is `docs/private-quizzes/CAREER_HOW_BAD_APPROVED_LOCKED_2026-10-31.md`. Its strict LAZY gate and its complete answer-level mappings are implemented from that document without embellishing or softening any result.

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

## 35A. CURRENT APPROVED CONTENT REGISTRY

**LOCKED.** Keep one current, authoritative definition for each playable quiz key and each published Daily occurrence.

- The canonical editorial libraries are Public Quiz, Apparently Private Quiz and Daily. Check all three for duplicated scenarios and formulaic answer choices before adding content.
- Approved questions, choices, results, verdict weights and numeric evidence mappings must match the current owner-approved source exactly. No creative edits during engineering implementation.
- The active quiz registry and database catalog contain ONLY current playable definitions. Replace superseded question/choice/result definitions rather than duplicating an obsolete version as another playable row.
- Historical user completions, their earned evidence, and any required content fingerprint/semantic identity are data-integrity records, NOT obsolete playable quiz content. Keep them safe against reinterpretation or duplication. Use Git history for obsolete editorial drafts; do not republish or seed them as active quizzes.
- Do not perform destructive production deletes against actual user records. Any necessary schema migration must reconcile foreign keys and historical completion identity and pass migration tests before separately authorized production execution.
- A material content change has a distinct immutable semantic-version/fingerprint identity for scoring and audit, but does not introduce an extra active copy of the quiz. Retakes cannot inflate evidence.
- Only selected answers generate personality points. Saved quiz verdicts do not award trait points. The first-completion rule and the 12-month active identity window apply.
- The owner has APPROVED the 11 changes in the current source pack, including the revised After Dark content and the new `private-private-proof`. These are ready for local implementation without repeated editorial sign-off.
- Implementation, passing tests, staging, deployment, and App Store release are separate states. Local implementation is authorized; production migrations, live backfills, commit/push and distribution remain separately gated until approved.

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

## 43. PROFILE EVIDENCE AND TIME WINDOW

**LOCKED.** Personality identity comes from selected answers only; the winning quiz result never adds trait points.

**Quizzes:** Each answered question on the first valid completion of a specific quiz semantic version writes its approved +1, +2 or +3 evidence once, for each genuinely supported trait pole. Retakes may update the user's displayed result but cannot add any more points for that version.

**Dailies:** Each first valid answer to a particular published Daily occurrence independently earns its approved +1, +2 or +3 trait evidence when any mapping is supported. A repeated template on a different publication date is a distinct occurrence. Dailies without supported mappings earn zero points.

**Active identity:** Identity display uses the 12-month rolling evidence window and the approved 9-point eligibility threshold, one displayed winning pole per dimension, up to 7 Signature and 3 Undercurrent traits. Lifetime evidence and historical user submissions may be retained without affecting expired active display. No profile ranking event writes points.

**Unlocks:** Once the Creature and Relic reveal milestones are unlocked they remain unlocked even if old evidence expires. Current appearance may evolve as the active answer-evidence window changes.

**History and safety:** Never reaward the same question/occurrence, remap historical answer text to a new meaning, or delete user evidence to clean up obsolete content. No retroactive rewriting of production records without separate explicit authorization.

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

The approved launch library contains 17 Apparently Private quizzes, including 14 premium and 3 free previews. Do not market metadata-only coming-soon entries as playable content.

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

**CURRENT GOAL:** Ship the approved, functioning Apparently You experience through device QA, staging verification, TestFlight and App Store review. Use the current deployment manifest for release dates.

**Scope:** Implement the 17 approved Apparently Private quizzes (3 previews and 14 premium), preserve the existing public and Daily experiences, and verify subscriptions, restores, age gating, result privacy, score integrity, analytics/ads disclosure and on-device accessibility before release.

Local implementation and tests are authorized. Do not deploy production migrations, production backfills, pushes, store submissions or live releases without explicit authorization.

---

## 50. SHADE CALIBRATION

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

## 51. THE FINAL TEST FOR A PRIVATE RESULT

Before approving a result, ask:

- Is it specific enough that someone recognizes themselves?
- Could the opposite kind of person plausibly get a very different result?
- Is the harshness supported by several answers?
- Did we actually say the uncomfortable thing?
- Are we still treating the user like an adult rather than insulting them for sport?
- Is there at least one line someone will screenshot and send to a friend?

If not, the result probably needs another pass.

---

## 52. THE APPARENTLY TEST

Before shipping any major feature or piece of copy, ask:

Could this exist in any other personality app?

If yes, push it farther.

Then ask:

Does this feel like Apparently has been paying attention?

If yes, we're close.

---

## 53. THE NORTH STAR SENTENCE

If we forget everything else:

Apparently You should make people feel seen, called out, curious about themselves, curious about everybody else, and excited to see what the app notices next.

And Apparently Private adds:

We don't have to be nice. We do have to be right.

---

## 54. CURRENT DAILY EXPERIENCE RULES

**LOCKED.** Daily content should be fresh, surprising and varied. Free Daily mixes funny, cinematic, introspective, practical, imaginative and social questions. Private Daily can be provocative and sharper, with genuine nuance and a wide range of life topics, not repetitive relationship-only questions.

Fresh approved Daily occurrences get publishing priority over scheduled repeats. A question explicitly called "This or That" has exactly two meaningful options. No Daily question has to generate trait points; if it does, only the selected answer's individually approved +1/+2/+3 mappings count, without an arbitrary count cap.

Full Daily editorial status, approved content and rotation schedules live in their respective current Daily content documents, not as conflicting dated build logs here.

## 55. ADS, NOTIFICATIONS AND PRIVACY

**LOCKED product rules; verify current deployment status separately.** Premium subscribers see zero advertising. Eligible free placements may include a maximum of one public-quiz interstitial, a completed Free Daily interstitial and clearly labeled sponsored Explore cards. No ads on Apparently Private, You/Creature, paywalls, Settings or mature content. If premium entitlement is uncertain, fail closed and show no ad.

Push permissions are requested contextually, not on cold launch. Daily reminders use the device's timezone; activity and Creature notifications derive from real user events and real profile data, not invented event triggers. Ad SDK disclosure, ATT/privacy answers, notification permissions and purchase restoration must be verified against the shipped app and current store submissions.

## 56. FROZEN IDENTITY AND ACCESS CONTRACT

The 32 personality dimensions comprise 20 Core and 12 Private dimensions. Each has two distinct poles, for 64 immutable numeric trait IDs. Every awarded point belongs to an actual chosen-answer trait ID. The 9-point display threshold and 12-month active window affect CURRENT identity presentation, never grant extra points. Approved mature Private quizzes require server-side subscription and 18+ eligibility, with sharing restrictions enforced server-side.

**Engineering status belongs in the current deployment manifest and test reports, not in this product specification.**
