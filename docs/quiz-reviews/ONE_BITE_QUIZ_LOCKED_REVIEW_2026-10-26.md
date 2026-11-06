# Someone Asks for a Bite | Quiz Review

**Status:** LOCKED: Q&A, revised Core mappings, four expanded reveals
**Reviewed:** 2026-10-26
**Scope:** Creative review documentation only. No application code changes, commits, or pushes.

## Presentation requirements (approved)

Center the complete reveal: archetype title, hero, full-length body, Apparently statement, and three trait tags. Do not print the label "Signature:". Preserve the complete expanded body exactly as reviewed; do not substitute the short existing app body. No em dashes in new copy.

## Approved existing question/answer source snapshot

The exact existing source text is included below as a reference for the approved question/answer wording and archetype votes. This is a documentation snapshot, not a code change.

```typescript
import type { ArchetypeQuizDefinition } from './types';

// Content-polish pass (post-launch content review). Results/archetypes unchanged — approved
// copy, do not rewrite. Questions replaced with the new authored set; display positions
// rebalanced (perfect 2-per-letter-per-archetype across the 8 questions — verified
// programmatically), preserving each choice's exact text and its archetype mapping.
export const ONE_BITE_QUIZ: ArchetypeQuizDefinition = {
  id: 'one-bite',
  scoringType: 'archetype',
  category: 'Food',
  access: 'free',
  title: 'Someone asks for a bite. How bad is this about to get?',
  eyebrow: 'PERSONALITY QUIZ',
  introSupport: ['A simple request.', 'A surprisingly complicated answer.'],
  meta: '8 questions · About 2 min',
  introCta: 'Defend your plate →',
  introNote: 'No judgment. Some judgment.',
  mixLabel: 'YOUR BITE MIX',
  recentReadMetricLabel: 'of your one-bite picks',
  archetypes: [
    {
      id: 'sharer',
      title: 'THE SHARER',
      heroRead: ['Your plate was never really yours.', 'You knew that going in.'],
      body: 'You order with the table in mind, not just yourself. Sharing doesn’t feel like a loss to you — more food on the table means more good moments, and you’d rather have variety than territory.',
      kicker: 'Communal by nature, not by pressure.',
      traits: ['Generous', 'Easygoing', 'Social'],
      profileSignals: [
        { dimension: 'independent_collaborative', value: -2 },
        { dimension: 'practical_idealistic', value: -1 },
      ],
    },
    {
      id: 'negotiator',
      title: 'THE NEGOTIATOR',
      heroRead: ['You’ll share.', 'You will also be keeping count.'],
      body: 'You’re not against sharing — you just want it to be fair. One bite is one bite, and everyone knows exactly where the line is because you drew it clearly, out loud, in real time.',
      kicker: 'Generosity, audited.',
      traits: ['Fair', 'Precise', 'Practical'],
      profileSignals: [
        { dimension: 'trust_verify', value: -1 },
        { dimension: 'practical_idealistic', value: 1 },
      ],
    },
    {
      id: 'plate-protector',
      title: 'THE PLATE PROTECTOR',
      heroRead: ['You ordered this.', 'You would like to eat this.'],
      body: 'You’re not stingy, you just believe food you chose for yourself should stay that way. You’ll split an appetizer out of politeness. Your entree is a closed border.',
      kicker: 'Sharing is caring. This isn’t that.',
      traits: ['Boundary-aware', 'Direct', 'Decisive'],
      profileSignals: [
        { dimension: 'direct_indirect', value: 1 },
        { dimension: 'independent_collaborative', value: 2 },
      ],
    },
    {
      id: 'order-your-own',
      title: 'THE "ORDER YOUR OWN"',
      displayTitle: 'The "Order Your Own"',
      heroRead: ['There’s a whole menu.', 'Use it.'],
      body: 'You’d genuinely rather everyone just get what they actually want. Splitting sounds like a logistics project you didn’t sign up for — order what you’re craving, eat it in peace, everybody wins.',
      kicker: 'Efficient. Slightly antisocial. Correct.',
      traits: ['Independent', 'Efficient', 'Low-drama'],
      profileSignals: [
        { dimension: 'independent_collaborative', value: 2 },
        { dimension: 'conflict_peacekeeping', value: -1 },
      ],
    },
  ],
  questions: [
    {
      id: 'q1',
      prompt: 'Your partner said they weren’t hungry. Your food arrives. Now they’re staring at your plate.',
      choices: [
        { id: 'a', label: 'I knew this was coming. Take some.', resultWeights: { sharer: 1 } },
        { id: 'b', label: 'Tell me exactly what you want before you start freelancing.', resultWeights: { negotiator: 1 } },
        { id: 'c', label: 'We specifically discussed whether you were hungry.', resultWeights: { 'plate-protector': 1 } },
        { id: 'd', label: 'I’m ordering you your own food.', resultWeights: { 'order-your-own': 1 } },
      ],
    },
    {
      id: 'q2',
      prompt: 'Someone reaches for your fries without asking.',
      choices: [
        { id: 'a', label: '“Ask first.” I’m still probably giving you some.', resultWeights: { negotiator: 1 } },
        { id: 'b', label: 'I move the fries. Instinctively.', resultWeights: { 'plate-protector': 1 } },
        { id: 'c', label: 'Absolutely not. Those are assigned fries.', resultWeights: { 'order-your-own': 1 } },
        { id: 'd', label: 'Go ahead. Fries are communal.', resultWeights: { sharer: 1 } },
      ],
    },
    {
      id: 'q3',
      prompt: 'The table wants to order everything family-style.',
      choices: [
        { id: 'a', label: 'Fine, but I’m also ordering something that belongs to me.', resultWeights: { 'plate-protector': 1 } },
        { id: 'b', label: 'I respect the concept from over here with my entrée.', resultWeights: { 'order-your-own': 1 } },
        { id: 'c', label: 'Perfect. I want to try everything.', resultWeights: { sharer: 1 } },
        { id: 'd', label: 'I’m in, but we need enough food and a real plan.', resultWeights: { negotiator: 1 } },
      ],
    },
    {
      id: 'q4',
      prompt: 'There is exactly one perfect bite left on your plate.',
      choices: [
        { id: 'a', label: 'Why are we even discussing MY final bite?', resultWeights: { 'order-your-own': 1 } },
        { id: 'b', label: 'If somebody wants it, they can have it.', resultWeights: { sharer: 1 } },
        { id: 'c', label: 'Depends what I’m getting in return.', resultWeights: { negotiator: 1 } },
        { id: 'd', label: 'There are several other bites available to you.', resultWeights: { 'plate-protector': 1 } },
      ],
    },
    {
      id: 'q5',
      prompt: 'You open the fridge and the leftovers you were thinking about all day are gone.',
      choices: [
        { id: 'a', label: 'I am way more upset than leftovers should legally make a person.', resultWeights: { 'plate-protector': 1 } },
        { id: 'b', label: 'This household will now be implementing labels.', resultWeights: { 'order-your-own': 1 } },
        { id: 'c', label: 'Honestly, I hope they enjoyed them.', resultWeights: { sharer: 1 } },
        { id: 'd', label: 'I need to know who ate them and whether they knew they were mine.', resultWeights: { negotiator: 1 } },
      ],
    },
    {
      id: 'q6',
      prompt: 'You bring snacks for a road trip. Two hours in...',
      choices: [
        { id: 'a', label: 'I’m making sure nobody kills one snack before everyone gets some.', resultWeights: { negotiator: 1 } },
        { id: 'b', label: 'Certain snacks were clearly for me, and we all knew that.', resultWeights: { 'plate-protector': 1 } },
        { id: 'c', label: 'Next trip everybody gets their own bag.', resultWeights: { 'order-your-own': 1 } },
        { id: 'd', label: 'Everybody is eating everything. That’s why I brought it.', resultWeights: { sharer: 1 } },
      ],
    },
    {
      id: 'q7',
      prompt: 'Your date says, “let’s just split an entrée.”',
      choices: [
        { id: 'a', label: 'That sounds romantic for somebody else.', resultWeights: { 'order-your-own': 1 } },
        { id: 'b', label: 'Sure. We can get appetizers too.', resultWeights: { sharer: 1 } },
        { id: 'c', label: 'Fine, but we need to agree on what we’re ordering.', resultWeights: { negotiator: 1 } },
        { id: 'd', label: 'We can taste each other’s food. I still want my own.', resultWeights: { 'plate-protector': 1 } },
      ],
    },
    {
      id: 'q8',
      prompt: 'Dinner is over. Which thing would irritate you MOST?',
      choices: [
        { id: 'a', label: 'Everybody ordered separately and nobody let me taste anything.', resultWeights: { sharer: 1 } },
        { id: 'b', label: 'The bill got split evenly when some people ordered way more.', resultWeights: { negotiator: 1 } },
        { id: 'c', label: 'Somebody boxed up MY leftovers without asking.', resultWeights: { 'plate-protector': 1 } },
        { id: 'd', label: 'We spent half the meal passing plates around.', resultWeights: { 'order-your-own': 1 } },
      ],
    },
  ],
};
```

## Approved revised Core mappings

Each line corresponds to question number and answer position A–D in the source snapshot above. Positive-only Core evidence, 1–3 points per supported pole; no arbitrary two-trait cap.

### Q1
- **A:** Collaborative +2; Protective +1; Let It Play Out +1
- **B:** Direct +2; Control +1; Practical +1
- **C:** Direct +2; Independent +1; Holds the Receipt +1
- **D:** Independent +2; Practical +2; Decisive +1

### Q2
- **A:** Direct +2; Collaborative +1; Rule-Oriented +1
- **B:** Independent +2; Protective +1
- **C:** Direct +3; Rule-Oriented +1; Independent +2
- **D:** Collaborative +2; Let It Play Out +2

### Q3
- **A:** Independent +2; Practical +1
- **B:** Independent +2; Direct +1
- **C:** Adventurous +2; Collaborative +2; Curious +1
- **D:** Planner +2; Practical +2; Collaborative +1; Control +1

### Q4
- **A:** Direct +2; Independent +2; Protective +1
- **B:** Collaborative +2; Let It Play Out +2
- **C:** Practical +2; Control +1
- **D:** Independent +2; Indirect +1; Protective +1

### Q5
- **A:** Emotionally Intense +2; Holds the Receipt +1
- **B:** Control +2; Planner +2; Practical +1
- **C:** Forgiving +2; Let It Play Out +2; Hands-Off +1
- **D:** Verify First +2; Curious +2; Direct +1; Holds the Receipt +1

### Q6
- **A:** Control +2; Protective +2; Cooperative +2
- **B:** Independent +2; Direct +1; Protective +1
- **C:** Planner +2; Control +1; Practical +2
- **D:** Collaborative +2; Cooperative +2; Let It Play Out +1

### Q7
- **A:** Independent +2; Playful +1; Direct +1
- **B:** Collaborative +2; Cooperative +1; Spontaneous +1
- **C:** Planner +2; Collaborative +1; Control +1
- **D:** Independent +2; Direct +1; Practical +1

### Q8
- **A:** Collaborative +2; Curious +1; Adventurous +1
- **B:** Practical +3; Rule-Oriented +1; Verify First +1
- **C:** Independent +2; Control +1; Protective +1
- **D:** Independent +2; Urgent +1; Practical +1

## Locked expanded result reveals

### THE SHARER

**Hero:** Your plate was never really yours. You knew that going in.

You order with the table in mind, not just yourself. Sharing doesn't feel like a loss to you. More food on the table means more good moments, and you'd rather have variety than territory. You're the person offering somebody a taste before they've even asked, then insisting they try the sauce too. The only problem is you sometimes forget that other people aren't nearly as generous with their plates. You've definitely offered somebody else's fries like they belonged to the community.

*Apparently, your plate is a public service and everybody's been approved for benefits.*

**Trait tags:** Generous · Easygoing · Social

### THE NEGOTIATOR

**Hero:** You'll share. You will also be keeping count.

You're not against sharing. You just want it to be fair. One bite is one bite, and everyone knows exactly where the line is because you drew it clearly, out loud, in real time. You can absolutely have some fries, but we're going to establish what *some* means before your hand enters the bag. You're generous when people respect the arrangement. What you cannot tolerate is somebody agreeing to one bite and then opening their mouth like they're trying to swallow the entire sandwich.

*Apparently, sharing with you comes with terms, conditions, and a legally binding bite limit.*

**Trait tags:** Fair · Precise · Practical

### THE PLATE PROTECTOR

**Hero:** You ordered this. You would like to eat this.

You're not stingy, you just believe food you chose for yourself should stay that way. You'll split an appetizer out of politeness. Your entrée is a closed border. You spent time studying that menu, made your decision, and have been mentally preparing for this meal since the waiter walked away. So when somebody who said they weren't hungry suddenly develops an interest in your plate, you have questions. And yes, you noticed they took the piece with the most cheese.

*Apparently, your love language is quality time, not unauthorized access to your plate.*

**Trait tags:** Boundary-aware · Direct · Decisive

### THE "ORDER YOUR OWN"

**Hero:** There's a whole menu. Use it.

You'd genuinely rather everyone just get what they actually want. Splitting sounds like a logistics project you didn't sign up for. Order what you're craving, eat it in peace, everybody wins. You don't understand why four grown adults need to negotiate ownership of six chicken wings when the restaurant will happily bring another order. You'll even pay for somebody else's meal if that's what it takes to protect yours. It's not about the money. It's about the principle, and the principle is that you ordered your own food for a reason.

*Apparently, you're happy to buy the whole table dinner as long as everybody stays out of yours.*

**Trait tags:** Independent · Efficient · Low-drama

## Implementation guardrails

This review file is the approved creative reference, not evidence that the live application has been updated. Preserve earlier nine locked quiz documents. Do not modify quiz TypeScript, award files, database, Git history, or deployment without a separate explicit request.
