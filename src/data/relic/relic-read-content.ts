import type { ColorFamilyKey, EffectKey, RelicTraitKey } from './relic-trait-meta';

// =========================================================================================
// RELIC READ — deterministic content source. 24 Trait Voice Modules + a small set of
// combination-aware rule tables. No LLM, no network, no randomness: the same three ranked
// traits always produce the same Read, forever. See relic-read-synthesis.ts for the pure
// assembly functions that consume this data; this file is content ONLY.
//
// COMBINATION-AWARENESS (Build 12 refinement): the earlier draft made Gift/Shade/Cost/Try
// This primarily rank-#1 content with rank-#2/#3 appended as a clause. That's not enough —
// the SAME rank-#1 trait must produce a materially different Shadow/Cost/Try This depending
// on what's modifying it. Rather than 552 pairwise rules or thousands of full combinations,
// each trait's shadow/cost/practice is authored as 4 variants, one per STANCE (see below) --
// the system picks the variant matching whichever of rank #2/#3 most differs from rank #1's
// own stance, so two reads sharing a Base but differing in Color/Effect genuinely diverge.
// =========================================================================================

export type Stance = 'steady' | 'assert' | 'connect' | 'seek';

// Coarse categorical tag per trait (NOT a pairwise relationship table) -- describes the
// trait's fundamental mode. Used only to SELECT which pre-authored variant of a trait's own
// shadow/cost/practice applies; it never substitutes for a trait's own specific content.
//   steady  — grounded, self-referential, internally anchored
//   assert  — pushes, confronts, initiates, defends territory
//   connect — reaches toward others, gives, repairs, attunes
//   seek    — oriented around others' reaction, validation, or reciprocity
export const STANCE_BY_TRAIT: Record<RelicTraitKey, Stance> = {
  accountability: 'steady',
  reflective: 'steady',
  selfSecure: 'steady',
  boundaryHolding: 'steady',
  armored: 'steady',
  selfPreserving: 'steady',
  defensiveness: 'assert',
  punishing: 'assert',
  blunt: 'assert',
  challenging: 'assert',
  initiating: 'assert',
  vulnerable: 'connect',
  repairOriented: 'connect',
  tactful: 'connect',
  dutyFirst: 'connect',
  supportive: 'connect',
  givesFreely: 'connect',
  perspectiveTaking: 'connect',
  responsive: 'connect',
  reactive: 'seek',
  reassuranceSeeking: 'seek',
  approvalSeeking: 'seek',
  keepsScore: 'seek',
  selfReferencing: 'seek',
};

// The modifier a given secondary trait (rank #2, falling back to rank #3 if rank #2 shares
// rank #1's own stance) applies to rank #1's content. Prefers rank #2 (Color) since it's
// structurally the nearer modifier; falls back to rank #3 (Effect) only when rank #2 adds no
// new stance information, so the MOST differentiating available signal always wins.
export function resolveModifierStance(primary: RelicTraitKey, secondary: RelicTraitKey, tertiary: RelicTraitKey | null): Stance {
  const primaryStance = STANCE_BY_TRAIT[primary];
  const secondaryStance = STANCE_BY_TRAIT[secondary];
  if (secondaryStance !== primaryStance) return secondaryStance;
  if (tertiary) {
    const tertiaryStance = STANCE_BY_TRAIT[tertiary];
    if (tertiaryStance !== primaryStance) return tertiaryStance;
  }
  return secondaryStance; // all three share one stance -- genuinely the most honest answer.
}

export type TraitVoice = {
  key: RelicTraitKey;
  label: string;
  /** One sentence: the essential truth about this trait, usable standalone in The Read. */
  identityCore: string;
  /** Used when this trait resolves as Base (rank #1) in "WHY YOUR RELIC LOOKS LIKE THIS". */
  asBase: string;
  /** Used when this trait resolves as Color (rank #2). */
  asColor: string;
  /** Used when this trait resolves as Effect-source (rank #3). */
  asEffect: string;
  /** Opens The Gift when this trait is rank #1. */
  strength: string;
  /** The Shade, keyed by modifier stance (see resolveModifierStance). */
  shadowByModifier: Record<Stance, string>;
  /** The Cost, keyed by modifier stance. */
  costByModifier: Record<Stance, string>;
  /** Try This, keyed by modifier stance -- the ACTUAL intervention for this combination. */
  practiceByModifier: Record<Stance, string>;
};

export const TRAIT_VOICE: Record<RelicTraitKey, TraitVoice> = {
  selfSecure: {
    key: 'selfSecure',
    label: 'Self-secure',
    identityCore: 'You trust your own read of yourself before you trust anyone else’s.',
    asBase: 'You tend to trust your own read of yourself — other people’s opinions can matter without automatically becoming your truth. That’s why your Relic takes the form of an Anchor. Your center of gravity tends to live inside you.',
    asColor: 'Some of your calm comes from inside you, not from outside confirmation — you don’t need the room to agree with you to still feel steady. That gives your Relic its Recognition & Security energy, just not the needy kind.',
    asEffect: 'Even when something could rattle you, your delivery stays level — not cold, just unbothered. That’s why your Relic carries a calm, held-together kind of expression.',
    strength: 'You know who you are. You don’t need a committee meeting every time you make a decision, and you aren’t easily knocked off-center because somebody disagrees with you.',
    shadowByModifier: {
      steady: 'Being this grounded can quietly become being immovable — you stop checking whether you’re still right, because you’ve stopped expecting to be wrong.',
      assert: 'Sometimes “I know myself” quietly becomes “I’ve already decided I’m right.” Paired with how willing you are to say so, that’s a confident person who stopped taking notes.',
      connect: 'Your self-sufficiency can read as not needing anyone — even when someone’s genuinely trying to show up for you, your instinct is to handle it, which can make care feel declined rather than received.',
      seek: 'Your steadiness can look like patience, but it can also be a quiet impatience with how long everyone else needs to feel their way through something you already settled.',
    },
    costByModifier: {
      steady: 'When self-trust gets this rigid, feedback starts feeling optional — not rejected, just unnecessary. People stop offering it long before you notice they stopped.',
      assert: 'Add high standards and a willingness to say so, and the people around you may feel like they’re constantly being evaluated by someone who already graded her own paper. Your strength becomes distance if people stop believing they can influence you.',
      connect: 'People who want to take care of you may quietly give up trying — not because they stopped caring, but because every offer bounced off the same self-sufficient wall.',
      seek: 'People processing something slower than you may start hiding that process from you entirely, assuming you’ve already moved on and they’re behind.',
    },
    practiceByModifier: {
      steady: 'Before you close the door on an opinion, ask: “Have I actually reconsidered this, or did I just restate it to myself?”',
      assert: 'Before dismissing feedback, ask: “Is this actually wrong, or do I just not like hearing it?” You don’t have to surrender your judgment — just leave the door open long enough to check.',
      connect: 'Next time someone offers to help with something you’d normally handle alone, let them. Not because you need it. Just to see what it’s like to receive instead of absorb.',
      seek: 'Next time someone’s still processing something you’ve already settled, try asking one question about where they’re at instead of waiting for them to catch up.',
    },
  },

  reassuranceSeeking: {
    key: 'reassuranceSeeking',
    label: 'Reassurance-seeking',
    identityCore: 'You don’t always know you’re good until somebody tells you so.',
    asBase: 'Security, for you, often needs a second signature — a text back, a tone check, a “we’re good” said out loud. That’s why your Relic takes the form of a Bell. It rings best when someone else answers it.',
    asColor: 'Underneath your other signals is a real need to hear “we’re okay” out loud, not just assume it. That gives your Relic its Recognition & Security energy — it brightens when somebody confirms it.',
    asEffect: 'Even your most confident moments carry a small, checking-in undertone — a glance to see how it landed. That’s why your Relic’s expression has a soft, searching quality to it.',
    strength: 'You notice when something’s off between you and someone else almost immediately, and you’d rather check than assume — which means small ruptures rarely get the chance to become big ones.',
    shadowByModifier: {
      steady: 'Needing the check-in can start to look like not trusting your own read at all — even when you already know the answer, you wait for someone else to say it first.',
      assert: 'When you don’t get the reassurance fast enough, the need can curdle into a demand — pushing for confirmation instead of waiting for it, which tends to get the opposite result.',
      connect: 'You can end up over-giving as a way of earning the reassurance, which means the people closest to you can’t always tell if you’re showing up for them or auditioning for their approval.',
      seek: 'Two people both needing reassurance from each other can turn into neither of you ever just saying the thing — everyone’s waiting to be asked first.',
    },
    costByModifier: {
      steady: 'People may start managing what they say around you, pre-softening ordinary observations, because they’ve learned a flat statement can read as a verdict.',
      assert: 'Pushing for reassurance on your timeline can make the other person feel cornered into performing certainty they don’t actually feel yet — which gets you a reassurance you don’t fully trust anyway.',
      connect: 'The people you’re showing up for may eventually feel responsible for your sense of security, which is a heavy thing to quietly hand someone who never agreed to carry it.',
      seek: 'Important things can go unsaid for a long time while both people wait for the other to go first — and “we never talked about it” becomes its own kind of damage.',
    },
    practiceByModifier: {
      steady: 'Next time you want to ask “are we okay?”, wait one hour first. See if you still need the answer, or if you already knew it.',
      assert: 'Before pushing for a faster response, ask yourself: “Am I asking for clarity, or am I asking them to hurry up and comfort me?”',
      connect: 'Try doing one kind thing for someone without checking afterward whether it landed. Let it just be what it was.',
      seek: 'Be the one who says the thing first, once. Not because you’re sure how it’ll go — just to see what happens when somebody does.',
    },
  },

  boundaryHolding: {
    key: 'boundaryHolding',
    label: 'Boundary-holding',
    identityCore: 'You’d rather someone be mad at a real limit than love a version of you with none.',
    asBase: 'You maintain a limit even when somebody dislikes it, instead of dissolving it to keep the peace. That’s why your Relic takes the form of a Gate. It opens on purpose, not on pressure.',
    asColor: 'Underneath your other signals is a real willingness to hold a line, even an unpopular one. That gives your Relic its Protection & Defense energy — sturdy on purpose.',
    asEffect: 'Even when you’re being warm, there’s a clear edge somewhere underneath it — a sense that the warmth has limits and you know exactly where they are. That’s why your Relic’s expression reads as composed rather than soft.',
    strength: 'You don’t perform availability you don’t actually have, and you don’t let guilt talk you out of a limit you already know is right. People always know where they stand with you.',
    shadowByModifier: {
      steady: 'A limit can calcify into a rule that no longer fits the situation — you can hold a boundary out of consistency even after the reason for it has changed.',
      assert: 'Holding the line can tip into holding it loudly — stating a boundary like a verdict instead of a limit, which makes it harder for anyone to ask a genuine follow-up question.',
      connect: 'Your gate can stay a little too closed with people who’ve actually earned more access — consistency starts protecting you from closeness you might actually want.',
      seek: 'You can hold the boundary and still quietly hope nobody’s upset about it, which means you’re paying an emotional cost for a limit you already decided was worth holding.',
    },
    costByModifier: {
      steady: 'People may stop testing whether a limit has room to flex, because you’ve taught them it never does — even in the cases where it actually could.',
      assert: 'A boundary delivered like a verdict can end the conversation before the other person even understood what the limit was — they just know they hit something.',
      connect: 'People who’ve genuinely earned more trust can feel like they’re still being held at the same distance as everyone else, which reads as unfairness even when it isn’t meant that way.',
      seek: 'Holding a limit while hoping nobody’s upset about it is exhausting in a way nobody else can see — you pay the emotional tax alone.',
    },
    practiceByModifier: {
      steady: 'Pick one boundary you’ve held the same way for years and ask: “Is this still protecting something, or is it just familiar?”',
      assert: 'Next time you state a limit, add one sentence of why. Not an apology — just enough context that it lands as a boundary, not a sentence.',
      connect: 'Pick one person who’s actually earned it, and let the gate open a little wider than your default.',
      seek: 'Hold the boundary, and then let yourself NOT check whether they’re upset about it. You already decided it was right.',
    },
  },

  approvalSeeking: {
    key: 'approvalSeeking',
    label: 'Approval-seeking',
    identityCore: 'Some of your security comes from inside you, and some of it is waiting on everyone else’s face.',
    asBase: 'Part of your sense of okay-ness depends on whether the people around you still seem pleased with you. That’s why your Relic takes the form of a Crown — something that’s only fully worn when someone else looks at it.',
    asColor: 'Underneath your other signals is a real need for people to still be pleased with you. That gives your Relic its Recognition & Security energy — it brightens a little when somebody notices.',
    asEffect: 'Even your boldest moves carry a small check for the room’s reaction before you commit all the way. That’s why your Relic’s expression has a slightly performative polish to it — built to be seen going well.',
    strength: 'You read a room before you walk into it, and you generally know what will land well and what won’t — which makes you genuinely good at making people feel considered.',
    shadowByModifier: {
      steady: 'You can mistake the absence of visible approval for disapproval, even when nobody’s actually upset — just busy, or quiet, or having a normal day.',
      assert: 'When the approval doesn’t come fast enough, you can push for it — fishing for reassurance in a way that puts the other person on the spot to perform comfort they don’t owe you yet.',
      connect: 'Your generosity can become quietly transactional — giving in a way that’s hoping to be noticed, which means people sometimes can’t tell if you showed up for them or for the credit.',
      seek: 'You and whoever else is also waiting for a cue can both end up frozen, each one convinced the other should go first.',
    },
    costByModifier: {
      steady: 'You may read neutral silence as a problem that doesn’t exist, and spend real energy solving something nobody was actually upset about.',
      assert: 'Pushing for approval on your timeline can make people perform reassurance they don’t fully mean, just to get the moment to pass — which you can usually tell, and which helps nobody.',
      connect: 'If your kindness is quietly also an application for approval, people may start wondering what the real price of your help is — even when there isn’t one.',
      seek: 'Decisions that need somebody to just make the call can stall out entirely while everyone’s reading everyone else for permission.',
    },
    practiceByModifier: {
      steady: 'Next time someone goes quiet, resist inventing a reason. Just ask. Most of the time the answer is boring, and that’s good news.',
      assert: 'Before asking “are we good?” for the second time, ask yourself what you’re actually looking for — information, or permission to stop worrying.',
      connect: 'Try doing something generous and telling no one. Let it be invisible. Notice how that feels different.',
      seek: 'Be the one who makes the call, once, without waiting for a cue. The room will survive it.',
    },
  },

  vulnerable: {
    key: 'vulnerable',
    label: 'Vulnerable',
    identityCore: 'You don’t armor over what hurts — it shows, even when you’d rather it didn’t.',
    asBase: 'You don’t hide what hurts you — it’s visible, even when you’d rather it wasn’t. That’s why your Relic takes the form of a Locket. What’s inside isn’t hidden. It’s just protected.',
    asColor: 'Underneath your other signals is a real willingness to let feelings show instead of managing them out of sight. That gives your Relic its Initiation & Response energy — open before it’s safe to be.',
    asEffect: 'Even in a strong moment, something honest leaks through — a crack in the voice, a pause that says more than the sentence did. That’s why your Relic’s expression never fully seals over.',
    strength: 'You don’t make people guess how you feel, and you don’t let a hurt get buried just to keep things comfortable. That’s rare — a lot of people would rather perform “it’s fine” than let you see the real reaction.',
    shadowByModifier: {
      steady: 'Being this visible can tip into being unfiltered — every feeling gets air time, even the ones that would’ve passed on their own in twenty minutes.',
      assert: 'When the hurt shows AND you’re willing to act on it immediately, people can feel like they’re being confronted with a feeling before they even understood what happened.',
      connect: 'You can accidentally make the room responsible for managing your visible feelings — the moment becomes about comforting you rather than whatever was actually happening.',
      seek: 'Being easy to read can become performing the feeling a little, even unconsciously, because you’ve learned visible hurt gets a response.',
    },
    costByModifier: {
      steady: 'People may start treating you as fragile rather than honest, softening what they say around you in a way that actually distances you both.',
      assert: 'Someone confronted by a fast, visible reaction may spend the conversation managing YOUR feeling instead of addressing what actually happened.',
      connect: 'The room can start orbiting your visible reaction instead of the original issue, which means real problems get less airtime than your response to them.',
      seek: 'People may start wondering whether your reaction is about the moment or about being seen having one — even when it’s genuinely both.',
    },
    practiceByModifier: {
      steady: 'Before reacting, ask: “Is this feeling asking to be shown, or just felt?” Not everything needs an audience to be real.',
      assert: 'Let ten minutes pass between feeling it and saying it. The hurt will still be real. The delivery will be more yours.',
      connect: 'Name what you’re feeling out loud once, calmly, instead of letting the room read it off your face. Watch how much less work everyone has to do.',
      seek: 'Let one hurt pass without checking who noticed. See if it still mattered without an audience.',
    },
  },

  repairOriented: {
    key: 'repairOriented',
    label: 'Repair-oriented',
    identityCore: 'When something breaks between you and someone else, your first instinct is to fix it, not to win it.',
    asBase: 'When something breaks between you and someone else, your first move is toward fixing it, not toward winning it. That’s why your Relic takes the form of Needle & Thread — built to close a gap, not widen one.',
    asColor: 'Underneath your other signals is a real pull toward closing the gap after a rupture, not just surviving it. That gives your Relic its Repair & Conflict energy, tilted toward the mending side.',
    asEffect: 'Even mid-disagreement, part of you is already looking for the exit that gets you both back to okay. That’s why your Relic’s expression has a softening, stitched-together quality.',
    strength: 'You don’t let a rupture sit and rot — you go toward it, even when it’s uncomfortable, because staying disconnected bothers you more than the discomfort of fixing it does.',
    shadowByModifier: {
      steady: 'Your pull toward fixing it can override your own read of whether it actually NEEDS fixing yet — you can repair prematurely, before anyone’s actually ready.',
      assert: 'You can push for repair on your timeline, which can feel like being rushed back to okay before the other person’s finished being upset.',
      connect: 'You can become the one who always initiates repair, which quietly teaches the people around you that they never have to — you’ll handle it.',
      seek: 'You can chase repair partly to stop feeling the discomfort of the rupture yourself, which means the fix is sometimes more for you than for them.',
    },
    costByModifier: {
      steady: 'Repairing before the other person is ready can mean the rupture never actually resolves — it just goes quiet, and comes back later unaddressed.',
      assert: 'Pushing for resolution too fast can make the other person feel like their own timeline for being upset wasn’t allowed to exist.',
      connect: 'If you’re always the one who reaches out first, the relationship can quietly become unbalanced — you carrying all the repair labor, alone.',
      seek: 'If repair is partly about YOUR discomfort, the other person may sense the fix is rushed and not fully trust that it landed.',
    },
    practiceByModifier: {
      steady: 'Before reaching out to fix it, ask: “Am I ready to repair this, or am I ready to stop feeling uncomfortable about it?”',
      assert: 'Let the other person set the pace once. Offer repair, then wait, instead of leading them there.',
      connect: 'Next rupture, wait to see if the other person reaches out first. Notice what that waiting feels like.',
      seek: 'Ask yourself honestly: is this repair for them, or is it so you can stop sitting with the discomfort?',
    },
  },

  punishing: {
    key: 'punishing',
    label: 'Punishing',
    identityCore: 'When someone hurts you, your first instinct isn’t always toward fixing it together — sometimes it’s toward making sure they feel it.',
    asBase: 'When someone hurts you, your first instinct isn’t always toward fixing it together — sometimes it’s toward making sure they feel what they caused. That’s why your Relic takes the form of a Thorn. It doesn’t apologize for being sharp.',
    asColor: 'Underneath your other signals is a real pull toward consequence over resolution when you’ve been hurt. That gives your Relic its Repair & Conflict energy, tilted toward the sharper side.',
    asEffect: 'Even when you’re trying to be fair, there’s an edge in the delivery — a sense that this isn’t over just because you’ve stopped talking about it. That’s why your Relic’s expression keeps a quiet sting in it.',
    strength: 'You don’t let people walk away from hurting you without understanding that it mattered. You hold weight to consequences, which means your relationships rarely get to coast on unexamined behavior.',
    shadowByModifier: {
      steady: 'Your certainty about what’s fair can make the consequence feel permanent even after the other person’s actually changed.',
      assert: 'Wanting them to feel it and wanting it fixed are not the same ambition, even though they can feel identical in the moment.',
      connect: 'The consequence can outlast your own anger — you can still care about someone while also still quietly making them pay for something you’ve mostly moved past.',
      seek: 'Part of the punishment can be about making sure they KNOW they hurt you, which means it’s partly for an audience, not just for justice.',
    },
    costByModifier: {
      steady: 'Repair starts to feel pointless to the other person — why try, if the sentence is already decided and unlikely to be reconsidered?',
      assert: 'If every attempt to talk about it gets met with more consequence instead of an opening, people eventually stop trying to repair things with you at all.',
      connect: 'Someone who still genuinely cares about you can feel punished long after the original hurt has faded for both of you, which can quietly end the closeness instead of restoring it.',
      seek: 'If part of this is about being seen as wronged, the other person may sense that and respond to the performance instead of the actual repair.',
    },
    practiceByModifier: {
      steady: 'Ask yourself: “Has this person actually not changed, or have I just not updated the sentence?”',
      assert: 'Next time you’re hurt, ask: “Do I want them to understand what they did, or do I want them to pay for it?” You’re allowed to want both — just know only one ends the conflict.',
      connect: 'Notice if you’re still delivering consequence to someone you’ve actually forgiven. If so, tell them that too.',
      seek: 'Let one consequence happen privately, with no one watching you enforce it. See if it still feels like justice.',
    },
  },

  tactful: {
    key: 'tactful',
    label: 'Tactful',
    identityCore: 'You’re capable of delivering something difficult without choosing maximum damage.',
    asBase: 'You’re capable of saying a hard thing without choosing the most painful way to say it — the truth still lands, you’d just rather aim it than throw it. That’s why your Relic takes the form of a Fan. It can create a breeze or a gust, and you usually choose on purpose.',
    asColor: 'Underneath your other signals is a real instinct to protect the landing, even when the content itself isn’t soft. That gives your Relic its Expression & Delivery energy, tuned toward care.',
    asEffect: 'Even your firmest moments come wrapped — the verdict is final, but it doesn’t arrive like an attack. That’s why your Relic carries the Beamburst effect: a precise, directed burst, not a wide blast.',
    strength: 'You can say the hard thing and have the other person still feel respected afterward, which is a genuinely rare skill — most people have to pick one.',
    shadowByModifier: {
      steady: 'Because you’re this careful with delivery, your certainty can slip past people unnoticed — they hear the kindness and miss how final the verdict actually was.',
      assert: 'You can make a very firm judgment sound perfectly reasonable, which means somebody might not realize you stopped considering their side twenty minutes ago.',
      connect: 'Your tact can tip into over-softening — the message gets so cushioned that the other person walks away without actually understanding how serious it was.',
      seek: 'You can spend so much energy managing how it lands that you never actually confirm whether they understood what you said.',
    },
    costByModifier: {
      steady: 'People can leave a hard conversation with you feeling okay, without realizing nothing about the underlying issue was actually left open.',
      assert: 'Because the delivery is so smooth, people can agree with you in the moment and only realize later how little room there actually was to push back.',
      connect: 'If the message gets too cushioned, the other person may not register the problem as seriously as you meant it, and the same issue comes back around.',
      seek: 'You can walk away from hard conversations unsure if it actually landed, because you were more focused on the delivery than the confirmation.',
    },
    practiceByModifier: {
      steady: 'After a hard conversation, ask yourself honestly: did I soften the delivery, or did I soften the actual verdict too?',
      assert: 'Once you’ve delivered the hard thing kindly, ask one direct follow-up question to check it actually landed as serious.',
      connect: 'Say the firm thing once without the cushioning, just to practice what it feels like when the care is implied instead of explicit.',
      seek: 'After delivering something difficult, ask directly: “Does that make sense, or did I make it sound smaller than it is?”',
    },
  },

  blunt: {
    key: 'blunt',
    label: 'Blunt',
    identityCore: 'You say the true thing before you’ve softened it.',
    asBase: 'You say the sharp thing instead of the soft one — not because you enjoy the damage, but because translating the truth into something gentler can feel like lying a little. That’s why your Relic takes the form of a Blade. It doesn’t ask permission to be sharp.',
    asColor: 'Underneath your other signals is a real preference for the direct version over the comfortable one. That gives your Relic its Expression & Delivery energy, tuned toward edge.',
    asEffect: 'Even your kindest intentions arrive a little unfiltered — clear, fast, no cushioning. That’s why your Relic’s expression carries a precise, unmistakable sting.',
    strength: 'People always know exactly where they stand with you. You don’t make people guess, translate, or manage your subtext — what you say is what you mean.',
    shadowByModifier: {
      steady: '“I don’t sugarcoat things” and “I never consider how this lands” are not the same sentence, even though you sometimes perform them identically.',
      assert: 'When bluntness pairs with wanting to go first, the room doesn’t get a say in the timing — just the impact.',
      connect: 'Your directness can land harder than you meant with someone who was already feeling fragile, because the delivery doesn’t always check the room’s temperature first.',
      seek: 'You can say the blunt thing and then quietly hope it didn’t land as badly as it sounded — wanting both the honesty and the forgiveness for its edges.',
    },
    costByModifier: {
      steady: 'People stop bringing you things in progress — only finished ones, because the unfinished version felt too risky to show someone who leads with the Blade.',
      assert: 'People start waiting for YOU to open every hard conversation instead of trusting themselves to open one with you.',
      connect: 'Someone already struggling may remember the sting of your delivery longer than they remember the point you were making.',
      seek: 'People may start reading your bluntness as performance — wondering if the edge is really necessary or just how you’ve learned to be heard.',
    },
    practiceByModifier: {
      steady: 'Before you say the sharp thing, ask: “Does this need to be said right now, or does it just need to be said by me first?”',
      assert: 'Let someone else open the hard conversation once. Practice following instead of leading.',
      connect: 'Before delivering something direct, name the care out loud first — one sentence, then the truth.',
      seek: 'Say the blunt thing, then stop talking. Resist the urge to immediately check if it’s okay.',
    },
  },

  dutyFirst: {
    key: 'dutyFirst',
    label: 'Duty-first',
    identityCore: 'You feel responsible for showing up, even when nobody’s checking whether you will.',
    asBase: 'You feel responsible for showing up, helping, carrying your part — even when nobody’s checking whether you will. That’s why your Relic takes the form of a Lantern. It stays lit because somebody has to.',
    asColor: 'Underneath your other signals is a real sense of responsibility for the people around you. That gives your Relic its Care & Responsibility energy.',
    asEffect: 'Even your lighter moments carry a sense of “I’ve got this handled” underneath them. That’s why your Relic’s expression has a steady, carrying warmth to it.',
    strength: 'People can count on you, genuinely, not performatively. When you say you’ll be there, you’re there — which is rarer than it should be.',
    shadowByModifier: {
      steady: 'Your sense of duty can override your own limits — you keep showing up past the point where it’s actually sustainable, because stopping feels like failing someone.',
      assert: 'You can carry the responsibility AND resent it out loud, which confuses people who thought you wanted to be there.',
      connect: 'You can become the default carrier for everyone’s needs, which quietly trains people to stop asking and start assuming.',
      seek: 'Part of your showing-up can be about being seen as reliable, which means stepping back can feel like losing an identity, not just resting.',
    },
    costByModifier: {
      steady: 'You can burn out quietly, because you never flagged the limit before you hit it — duty doesn’t usually announce when it’s become too much.',
      assert: 'If the resentment leaks out, people can feel punished for needing you, even though you’re the one who never said no.',
      connect: 'The people you carry may never develop their own capacity, because you’ve never let the responsibility be shared.',
      seek: 'If you stop being needed, you may not know who you are without the role — which makes it hard to ever actually rest.',
    },
    practiceByModifier: {
      steady: 'Before saying yes to one more thing, ask: “Am I actually available, or am I just unwilling to say I’m not?”',
      assert: 'If you’re resentful about carrying something, say so before you’re asked again — not after.',
      connect: 'Let someone else carry something you’d normally take on, even if they do it differently than you would.',
      seek: 'Practice saying no to something small, just to prove to yourself you’re still you without the yes.',
    },
  },

  selfPreserving: {
    key: 'selfPreserving',
    label: 'Self-preserving',
    identityCore: 'You protect your own energy and limits, even when someone’s disappointed by that.',
    asBase: 'You protect your own energy and limits, even when it disappoints someone. That’s why your Relic takes the form of a Chalice. It holds what’s yours without spilling it for everyone who asks.',
    asColor: 'Underneath your other signals is a real instinct to protect your own capacity before you commit it elsewhere. That gives your Relic its Protection & Defense energy.',
    asEffect: 'Even your generosity has a quiet edge of self-accounting to it — giving, but tracking what’s left. That’s why your Relic’s expression never fully empties itself out.',
    strength: 'You don’t run yourself into the ground trying to prove your worth through exhaustion. You know your limit, and you actually respect it — which keeps you around for the long haul.',
    shadowByModifier: {
      steady: 'Protecting your limit can become protecting your comfort — the line moves earlier and earlier, even for things that would’ve been worth the stretch.',
      assert: 'You can protect your energy loudly, in a way that makes the ask itself feel like it was unreasonable, even when it wasn’t.',
      connect: 'People who genuinely need you can feel the limit before they even finish asking, which can read as “I stopped being a priority” even when it’s really just a boundary.',
      seek: 'You can protect your energy and then quietly feel guilty about it, wanting both the limit and everyone’s approval of the limit.',
    },
    costByModifier: {
      steady: 'People may stop asking you for the big things, not because you said no, but because they’ve learned to expect it.',
      assert: 'If the boundary comes out sharp, people can walk away feeling like the ask itself was the problem, not just the timing.',
      connect: 'Someone who needed you in a real moment may remember that you weren’t available, even if your reasons were completely valid.',
      seek: 'Holding the limit while feeling guilty about it means you pay an emotional cost for a boundary you already decided was fair.',
    },
    practiceByModifier: {
      steady: 'Once a month, say yes to something past your usual limit, on purpose, and see what you actually learn from the stretch.',
      assert: 'When you set the limit, add one sentence of context. It costs you nothing and changes how it lands.',
      connect: 'Pick one person and tell them in advance what your real capacity looks like, instead of letting them find the edge by asking.',
      seek: 'Hold the boundary and let the guilt pass without acting on it. You’re allowed to need less than everyone’s approval of your limit.',
    },
  },

  supportive: {
    key: 'supportive',
    label: 'Supportive',
    identityCore: 'Your instinct is to encourage before you challenge, to show up before you’re asked.',
    asBase: 'Your instinct is to encourage before you challenge, show up before you’re asked, carry what you can so somebody else doesn’t have to carry it alone. That’s why your Relic takes the form of a Torch. You’re built to make someone else’s path easier to see.',
    asColor: 'Underneath your other signals is a real instinct to encourage and reinforce the people around you. That gives your Relic its Care & Responsibility energy.',
    asEffect: 'Even your hard truths arrive wrapped in belief in the other person. That’s why your Relic’s expression carries a warm, steady glow rather than a sharp one.',
    strength: 'People feel genuinely carried by you, and that’s not a performance — you remember what they’re going through and show up for the specific thing they actually needed.',
    shadowByModifier: {
      steady: 'Your encouragement can stay constant even when someone genuinely needs to hear the harder, less comfortable version of the truth.',
      assert: 'You can switch from encouraging to confronting without warning, which can feel disorienting to someone who thought they were just getting support.',
      connect: 'Showing up for people while quietly needing them to notice is still showing up for people — it’s just showing up with a receipt you’re hoping nobody asks to see.',
      seek: 'Your support can become quietly tied to being seen as supportive, which means people can start performing gratitude instead of just receiving help.',
    },
    costByModifier: {
      steady: 'Someone who needed honest pushback may only ever get encouragement from you, which doesn’t actually serve them long-term.',
      assert: 'If support can flip to confrontation without warning, people may start bracing around you instead of relaxing into the care.',
      connect: 'People may start performing gratitude instead of just receiving help, because they’ve learned that’s part of what keeps you giving it.',
      seek: 'If every retelling of your support somehow centers you, people may eventually stop telling you the full story.',
    },
    practiceByModifier: {
      steady: 'Next time someone needs honesty more than encouragement, give them the honest version, even if it’s less comfortable to say.',
      assert: 'If you’re about to shift from supportive to confrontational, name the shift out loud first.',
      connect: 'Do something kind and don’t mention it for 24 hours. Notice whether the kindness still feels the same without being seen.',
      seek: 'Ask the person you helped how they’re actually doing, and let the conversation stay about them the whole time.',
    },
  },

  challenging: {
    key: 'challenging',
    label: 'Challenging',
    identityCore: 'You don’t always think supporting someone means agreeing with them.',
    asBase: 'You don’t think supporting someone always means agreeing with them — you push, question, expect effort, and tend to believe people are capable of more. That’s why your Relic takes the form of a Hammer. It builds things by applying real pressure.',
    asColor: 'Underneath your other signals is a real willingness to push rather than just affirm. That gives your Relic its Standards & Reciprocity energy.',
    asEffect: 'Even your encouragement comes with an expectation attached — belief in someone, with homework. That’s why your Relic’s expression carries a bit of pressure in it, on purpose.',
    strength: 'You believe the people you care about are capable of more, and you say so — which means the people around you actually grow instead of just feeling comfortable.',
    shadowByModifier: {
      steady: 'Your certainty about what someone’s capable of can become a verdict they never agreed to be held to — growth on your timeline, not theirs.',
      assert: 'The push can come paired with an edge, which can make it land as criticism instead of belief, even when you mean the belief part more.',
      connect: 'You can keep pushing someone who actually just needed to be held for a minute — the challenge arrives before the comfort does.',
      seek: 'You can push people and then quietly need them to prove the push worked, which turns encouragement into a kind of performance review.',
    },
    costByModifier: {
      steady: 'People may feel like they’re constantly being evaluated against a standard they never agreed to, even when your intentions are good.',
      assert: 'If the push feels sharp, people may hear “you’re not enough” instead of “you’re capable of more,” which was never the intended message.',
      connect: 'Someone who needed softness in the moment may feel unseen, even while you’re actually trying to help them grow.',
      seek: 'If you’re watching for proof the push worked, people may feel like your belief in them is conditional on results.',
    },
    practiceByModifier: {
      steady: 'Before pushing someone further, ask: “Is this about their growth, or about the version of them I’ve already decided on?”',
      assert: 'Lead with the belief sentence before the push. “I think you can do more” before the actual ask.',
      connect: 'Notice when someone needs comfort instead of challenge, and give them the comfort first. The push can wait a day.',
      seek: 'Push once, and then let go of needing to see the result. The belief was the point, not the proof.',
    },
  },

  givesFreely: {
    key: 'givesFreely',
    label: 'Gives freely',
    identityCore: 'Favors and sacrifices leave your hands without much tracking attached.',
    asBase: 'What you give — time, effort, favors — tends to leave your hands without much tracking attached. That’s why your Relic takes the form of a Fountain. It keeps giving because that’s just what it does, not because it’s counting.',
    asColor: 'Underneath your other signals is a real ease about giving without needing it remembered. That gives your Relic its Care & Responsibility energy, in its most unguarded form.',
    asEffect: 'Even your help arrives without strings you’re tracking — given and then genuinely let go of. That’s why your Relic’s expression feels open rather than measured.',
    strength: 'You give without an invoice attached, which means people around you can receive your help without the quiet math of owing you something back.',
    shadowByModifier: {
      steady: 'Giving this freely can mean you stop noticing when you’re actually running low, because tracking your own limits never became a habit either.',
      assert: 'Your generosity can come with a blind spot for people who take advantage of exactly how little you track — you may not notice the imbalance until it’s significant.',
      connect: 'You can give so freely that people stop offering you anything back, assuming you don’t need or want reciprocity — which isn’t always true.',
      seek: 'Giving without tracking can quietly mask a hope that it’ll be noticed anyway — untracked on the outside, counted somewhere on the inside.',
    },
    costByModifier: {
      steady: 'You can run yourself genuinely thin without realizing it, because the thing that would normally flag “this is too much” never gets triggered.',
      assert: 'Someone taking advantage of your generosity may do it for a long time before you notice, since noticing was never really the system.',
      connect: 'The relationship can quietly become one-directional, and nobody — including you — notices until it’s been that way for a while.',
      seek: 'If the untracked giving is secretly hoping to be noticed, the eventual disappointment can feel sharper because you never let yourself expect it out loud.',
    },
    practiceByModifier: {
      steady: 'Once a week, actually notice what you gave. Not to keep score — just to know your own real capacity.',
      assert: 'If you notice the same person always on the receiving end, say something. Generosity doesn’t require silence about imbalance.',
      connect: 'Let yourself receive something without immediately looking for a way to return it in kind.',
      seek: 'If you want something noticed, say so. Untracked giving doesn’t have to mean unspoken need.',
    },
  },

  keepsScore: {
    key: 'keepsScore',
    label: 'Keeps score',
    identityCore: 'Favors and sacrifices become part of an internal ledger, whether you mean them to or not.',
    asBase: 'What you give becomes part of an internal record — who did what, who owes what, whether it evened out. That’s why your Relic takes the form of a Ledger. Every page gets filled in, even the ones nobody asked you to track.',
    asColor: 'Underneath your other signals is a real awareness of what’s been given and what hasn’t been returned. That gives your Relic its Standards & Reciprocity energy, in its most exact form.',
    asEffect: 'Even your warmest moments carry a quiet audit underneath them — noted, filed, remembered. That’s why your Relic’s expression has a precise, accounted-for quality.',
    strength: 'You notice real imbalance before it becomes resentment nobody can name — you can usually say exactly what’s been uneven, which means it can actually get fixed instead of just felt.',
    shadowByModifier: {
      steady: 'The ledger can become permanent — an old imbalance stays on the books long after the relationship has actually evened back out.',
      assert: 'You can bring up the tally mid-conflict, which turns a specific disagreement into a referendum on the whole relationship’s fairness.',
      connect: 'You can keep giving while the ledger quietly fills with resentment, instead of saying the imbalance out loud while it’s still small.',
      seek: 'The tracking can become about being SEEN as the one who gives more, which turns reciprocity into a competition nobody else knew they were in.',
    },
    costByModifier: {
      steady: 'People may feel like they’re perpetually in debt to you for something that happened a long time ago and was never actually forgiven.',
      assert: 'Bringing up the full ledger in one conversation can make a small, fixable issue feel like an indictment of the entire relationship.',
      connect: 'If the resentment stays silent while you keep giving, it eventually leaks out sideways, and the other person won’t know what actually caused it.',
      seek: 'If reciprocity becomes about being seen as generous, people may start wondering whether your giving was ever really about them.',
    },
    practiceByModifier: {
      steady: 'Pick one old entry on the ledger and let it go on purpose. Not because it didn’t happen — because it’s been paid.',
      assert: 'Raise an imbalance when it’s small and specific, not during an unrelated conflict where it’ll carry more weight than it should.',
      connect: 'Say the imbalance out loud the first time you notice it, instead of letting the ledger fill quietly.',
      seek: 'Give one thing, once, and deliberately don’t track it. Notice if the relationship survives you not counting.',
    },
  },

  perspectiveTaking: {
    key: 'perspectiveTaking',
    label: 'Perspective-taking',
    identityCore: 'You can stay with someone else’s experience without immediately returning to your own.',
    asBase: 'You can stay with someone else’s experience without needing to immediately return to your own version of events. That’s why your Relic takes the form of a Prism. It bends toward whatever light is actually in the room.',
    asColor: 'Underneath your other signals is a real ability to hold someone else’s side without losing your own. That gives your Relic its Reflection & Perspective energy.',
    asEffect: 'Even your strongest opinions leave room for someone else’s read of the same situation. That’s why your Relic’s expression refracts rather than insists.',
    strength: 'You can disagree with someone and still genuinely understand why they see it differently — which means conflict with you rarely turns into someone feeling unheard.',
    shadowByModifier: {
      steady: 'You can hold every perspective so evenly that you lose track of your own — understanding everyone’s side can start to feel like not having one.',
      assert: 'You can understand someone’s perspective and still push hard against it, which can feel invalidating — “I hear you” followed immediately by “and here’s why you’re wrong.”',
      connect: 'You can spend so much energy holding other people’s experience that your own needs quietly go unspoken, because theirs always seem to make more sense to attend to first.',
      seek: 'You can take someone’s perspective so thoroughly that you start adjusting your own opinion to match it, just to stay in sync with the room.',
    },
    costByModifier: {
      steady: 'People close to you may not actually know where you stand on things, because you’ve gotten so good at holding everyone else’s position.',
      assert: 'Someone may feel like their perspective was acknowledged and then immediately overridden, which can feel worse than not being heard at all.',
      connect: 'Your own needs can go unspoken for so long that when they finally surface, they come out heavier than they needed to.',
      seek: 'If your opinions shift to match whoever you’re talking to, people may stop trusting that your agreement means what it says.',
    },
    practiceByModifier: {
      steady: 'After really understanding someone else’s side, say your own out loud too — even if it’s less fully formed.',
      assert: 'Try sitting with someone’s perspective for a full day before responding with your counterpoint.',
      connect: 'Next time you want something, say it directly, without first making sure it makes sense from everyone else’s side.',
      seek: 'Before agreeing with someone, pause and check: is this actually what you think, or just what’s easiest to align with right now?',
    },
  },

  selfReferencing: {
    key: 'selfReferencing',
    label: 'Self-referencing',
    identityCore: 'Even your most generous stories tend to circle back to your own experience of telling them.',
    asBase: 'Even your most generous stories tend to find their way back to your own experience of telling them — what you did, what you noticed, what it cost you. That’s why your Relic takes the form of a Mirror. Everything eventually shows you your own reflection.',
    asColor: 'Underneath your other signals is a real pull to return to your own frame when explaining what happened. That gives your Relic its Reflection & Perspective energy, turned inward.',
    asEffect: 'Even stories that start about someone else tend to orbit back toward your own role in them. That’s why your Relic carries the Orbit effect — everything near it eventually curves back to the center.',
    strength: 'You understand your own motives and reactions with real clarity — which means you rarely stay confused about why you did something, even when it was complicated.',
    shadowByModifier: {
      steady: 'Your self-understanding is strong enough that you can explain your own actions convincingly, even the ones worth reconsidering instead of explaining.',
      assert: 'When confronted, your instinct toward your own frame can arrive fast and firm — an explanation delivered like a closing argument before anyone finished the question.',
      connect: 'A story about supporting someone else can still end up centering your own experience of giving that support, which can leave the other person feeling like a supporting character in their own moment.',
      seek: 'You can retell a story enough times, from your own angle, that you start believing the retelling more than you remember the original moment.',
    },
    costByModifier: {
      steady: 'People may stop telling you the full story once they notice it tends to become about you — just the part that doesn’t require managing your reaction.',
      assert: 'Someone trying to raise a concern with you may find the conversation redirected to your reasoning before they finish explaining the concern.',
      connect: 'The person you supported may walk away from the story having heard a lot about how hard you worked to support them.',
      seek: 'If every retelling shifts slightly toward you, people close to you may start quietly fact-checking your version against what they remember.',
    },
    practiceByModifier: {
      steady: 'Next time you explain yourself, stop one sentence earlier than feels complete. See if the explanation was actually necessary.',
      assert: 'When confronted, answer the question first, before explaining your reasoning. The order changes everything.',
      connect: 'Tell a story about helping someone and leave yourself out of it entirely. Notice what that takes.',
      seek: 'Before retelling something, ask: “Am I remembering this, or improving it?”',
    },
  },

  initiating: {
    key: 'initiating',
    label: 'Initiating',
    identityCore: 'You don’t wait for the room to open the door.',
    asBase: 'You don’t wait for the room to open the door — you start the conversation, send the first text, name the tension before anyone else risks it. That’s why your Relic takes the form of a Spark. It doesn’t wait to be struck twice.',
    asColor: 'Underneath your other signals is a real willingness to go first. That gives your Relic its Initiation & Response energy.',
    asEffect: 'Even your reactions have a forward motion to them — less waiting, more moving. That’s why your Relic’s expression carries the Halo effect: the thing that moves before anyone asked it to.',
    strength: 'Things actually happen around you, because you don’t wait for permission to start them — the plan gets made, the hard conversation gets opened, the first move gets made.',
    shadowByModifier: {
      steady: 'Your willingness to go first can mean you rarely check whether the moment actually called for it, or just whether you were ready.',
      assert: 'Going first AND being direct about it can mean the room doesn’t get a say in the timing of a hard conversation — just the content.',
      connect: 'You can initiate so consistently that the people around you stop initiating altogether, assuming you’ll handle it, which isn’t always a compliment.',
      seek: 'Part of going first can be about not being able to stand the waiting — initiating to end your own discomfort with uncertainty, not just because the moment called for it.',
    },
    costByModifier: {
      steady: 'People may feel swept into moments they weren’t actually ready for, because your readiness became the deciding factor.',
      assert: 'A hard conversation opened on your timeline can leave the other person feeling like they never got to choose when to have it.',
      connect: 'People can stop developing their own initiative around you, because you’ll always get there first anyway.',
      seek: 'If initiating is partly about ending your own discomfort, the timing may serve you more than the actual moment needed.',
    },
    practiceByModifier: {
      steady: 'Before starting something, ask: “Is this the right moment, or just the moment I got impatient?”',
      assert: 'Let someone else open the hard conversation once, even if you’re ready first.',
      connect: 'Wait for someone else to make the first move on something small, and see what they do with the space.',
      seek: 'Sit in the uncertainty one extra beat before initiating. Notice if the discomfort was actually information, or just impatience.',
    },
  },

  responsive: {
    key: 'responsive',
    label: 'Responsive',
    identityCore: 'You engage once someone else opens the door, rather than opening it yourself.',
    asBase: 'You engage once someone else has opened the door, rather than opening it yourself. That’s why your Relic takes the form of a Moon. It doesn’t generate its own light — it reflects what reaches it, and reflects it well.',
    asColor: 'Underneath your other signals is a real comfort with meeting energy rather than creating it first. That gives your Relic its Initiation & Response energy, tuned toward reception.',
    asEffect: 'Even your strongest reactions wait for an opening before they arrive. That’s why your Relic’s expression feels responsive rather than announced.',
    strength: 'You’re genuinely present once something starts — attentive, engaged, easy to reach — which makes you a safe person to initiate with, because you’ll actually meet it.',
    shadowByModifier: {
      steady: 'Your comfort with waiting can mean real needs go unspoken for a long time, because voicing them first never became the habit.',
      assert: 'You can meet someone’s energy fully once they’ve opened the door, but rarely open one yourself, which can read as low investment even when it isn’t.',
      connect: 'You can become someone people have to consistently reach first, which quietly puts the entire burden of connection on the other person.',
      seek: 'Waiting to be reached can become waiting to be chosen, which makes the absence of someone reaching out feel heavier than it needs to.',
    },
    costByModifier: {
      steady: 'People may never learn what you actually need, because you’ve never been the one to say it first.',
      assert: 'Someone waiting for you to initiate may eventually stop waiting, assuming the lack of a first move means a lack of interest.',
      connect: 'The relationship can quietly become one-sided in effort, with one person always reaching and the other always receiving.',
      seek: 'If being reached first feels like being chosen, not being reached can feel like rejection, even when it’s really just someone else being busy.',
    },
    practiceByModifier: {
      steady: 'Say one need out loud before you’re asked about it. Just once, to see what changes.',
      assert: 'Open the door once, on purpose, with someone you’d normally wait for.',
      connect: 'Reach out first to someone who usually reaches out to you. Let them feel chosen for once.',
      seek: 'Notice when someone’s silence is really just their schedule, not a message about you.',
    },
  },

  reflective: {
    key: 'reflective',
    label: 'Reflective',
    identityCore: 'You examine a feeling before you act on it.',
    asBase: 'You tend to examine an emotional reaction before acting on it — the first feeling is information, not an instruction. That’s why your Relic takes the form of an Hourglass. It lets time pass through on purpose.',
    asColor: 'Underneath your other signals is a real instinct to think something through before responding. That gives your Relic its Reflection & Perspective energy.',
    asEffect: 'Even your fastest-feeling decisions got a beat of consideration first, even if nobody saw it happen. That’s why your Relic’s expression feels considered rather than immediate.',
    strength: 'You rarely say something in the heat of the moment that you have to walk back later — the pause you take protects both you and whoever you’re talking to.',
    shadowByModifier: {
      steady: 'The pause can extend indefinitely — reflection becomes a way to avoid ever actually landing on a response.',
      assert: 'You can reflect thoroughly and then deliver the conclusion like it was obvious the whole time, which can feel like you skipped the part where the other person got a say.',
      connect: 'While you’re reflecting, the other person may be sitting in real uncertainty, not knowing whether you’re processing or disengaging.',
      seek: 'You can reflect so long on how something will be received that the actual feeling underneath gets lost in the editing.',
    },
    costByModifier: {
      steady: 'Important conversations can stall out while you’re still privately processing, and the moment to say the thing can pass entirely.',
      assert: 'Someone on the receiving end of your conclusion may feel like the real conversation already happened without them, in your head.',
      connect: 'Someone waiting on your reflection may interpret the silence as distance, even when you’re actually still engaged, just quietly.',
      seek: 'If the reflection is mostly about managing the reaction, the actual feeling can get lost somewhere in the careful version.',
    },
    practiceByModifier: {
      steady: 'Give yourself an actual deadline for the reflection. A day, not an open-ended “I’ll think about it.”',
      assert: 'Share the reflection process out loud sometimes, not just the conclusion. Let the other person see the thinking, not just the verdict.',
      connect: 'Tell the person you’re still processing, so the silence reads as consideration instead of distance.',
      seek: 'Try saying the unedited version of the feeling once, before the careful version replaces it entirely.',
    },
  },

  reactive: {
    key: 'reactive',
    label: 'Reactive',
    identityCore: 'You respond directly from the feeling in the moment, before you’ve had time to think it over.',
    asBase: 'You respond directly from the feeling in the moment — the first reaction IS the reaction, not a draft of one. That’s why your Relic takes the form of a Matchbox. It doesn’t need much to go from nothing to lit.',
    asColor: 'Underneath your other signals is a real immediacy to how you respond. That gives your Relic its Expression & Delivery energy, in its rawest form.',
    asEffect: 'Even your composed moments carry a live-wire quality — close to the surface, quick to show. That’s why your Relic’s expression feels immediate rather than managed.',
    strength: 'Nobody has to guess what you’re actually feeling, because you don’t have a two-day delay between the feeling and the response — you’re genuinely easy to read in real time.',
    shadowByModifier: {
      steady: 'The first reaction arrives with total confidence, even on the days it isn’t actually the most accurate read of the situation.',
      assert: 'A fast reaction paired with a willingness to act on it can turn a small spark into a real confrontation before anyone’s had a chance to clarify anything.',
      connect: 'A quick reaction in a tender moment can land harder than intended, simply because there was no pause between feeling it and showing it.',
      seek: 'The speed of the reaction can sometimes be about needing the feeling witnessed immediately, not just about the feeling itself.',
    },
    costByModifier: {
      steady: 'People may start treating your first reaction as unreliable, waiting for the “real” response after you’ve calmed down — which means the real one gets less weight.',
      assert: 'A conflict can escalate in the first ten seconds, before either person has actually said what they meant.',
      connect: 'Someone who was already fragile may remember the speed of your reaction longer than the actual content of it.',
      seek: 'If the reaction needs to be witnessed to feel complete, people may start managing their own responses just to manage yours.',
    },
    practiceByModifier: {
      steady: 'Before trusting the first reaction completely, give it ten minutes. See if it’s still the same shape.',
      assert: 'In the first ten seconds of a reaction, say nothing. Just feel it. The response can come second.',
      connect: 'With someone you know is fragile right now, add one beat of pause before responding, even if it costs you something to wait.',
      seek: 'Let a reaction happen without announcing it right away. See if it still needed an audience to feel real.',
    },
  },

  accountability: {
    key: 'accountability',
    label: 'Accountability',
    identityCore: 'You can own your part when you’re confronted, without needing to explain your way out of it first.',
    asBase: 'You can own your part when confronted, without needing to explain your way out of it first. That’s why your Relic takes the form of a Seal. Once it’s set, it doesn’t need to be re-argued.',
    asColor: 'Underneath your other signals is a real willingness to own your part without a defense attached. That gives your Relic its Repair & Conflict energy, tilted toward resolution.',
    asEffect: 'Even your hardest admissions come clean — no asterisk, no “but.” That’s why your Relic’s expression feels settled rather than negotiated.',
    strength: 'You can hear “you hurt me” and actually sit with it instead of immediately defending yourself — which means repair with you is usually fast, because nobody has to convince you first.',
    shadowByModifier: {
      steady: 'Owning your part this easily can tip into owning MORE than your part — absorbing blame that was never fully yours just to get to resolution faster.',
      assert: 'You can own it and then immediately move to fixing it, without leaving room for the other person to actually finish being upset first.',
      connect: 'You can take responsibility so readily that the other person never gets to fully express what it cost them — the apology arrives before the hurt was heard.',
      seek: 'Owning it quickly can be partly about not wanting to sit in being seen as wrong, even while it looks like accountability.',
    },
    costByModifier: {
      steady: 'You can end up carrying blame in situations that were genuinely shared, because owning it is more comfortable than negotiating what’s actually yours.',
      assert: 'Moving to the fix too fast can make the other person feel like their hurt was a problem to be solved rather than something to be heard.',
      connect: 'The other person’s actual feelings about what happened can get skipped over in favor of your quick resolution.',
      seek: 'If accountability is partly about ending the discomfort of being seen as wrong, the apology may land as efficient rather than felt.',
    },
    practiceByModifier: {
      steady: 'Before owning something fully, pause and check: is this actually mine, or am I just the one willing to take it?',
      assert: 'After owning your part, stop talking. Let the other person respond before you move to how you’ll fix it.',
      connect: 'Ask “how did that actually affect you?” before moving to the apology. Let the hurt get airtime first.',
      seek: 'Sit in being seen as wrong for one full minute before responding. Notice what that minute actually costs you.',
    },
  },

  defensiveness: {
    key: 'defensiveness',
    label: 'Defensiveness',
    identityCore: 'When confronted, your first move tends to be explaining, countering, or defending — not owning it outright.',
    asBase: 'When confronted, your first move tends to be explaining, countering, or defending — not owning it outright. That’s why your Relic takes the form of a Shield. It goes up before you’ve even decided if you need it.',
    asColor: 'Underneath your other signals is a real instinct to explain before you own. That gives your Relic its Protection & Defense energy.',
    asEffect: 'Even your apologies tend to arrive with context attached — the light still gets through, just bent a little on the way out. That’s why your Relic carries the Prism Glint effect.',
    strength: 'You rarely accept blame that isn’t actually yours — you think through what really happened instead of just absorbing whatever version gets thrown at you first.',
    shadowByModifier: {
      steady: 'Your instinct to explain can become permanent — every confrontation gets met with the same reflexive context, even the ones that were simply true.',
      assert: 'When confronted, your explanation can arrive fast and firm, like a counter-argument, which can make the other person feel like they’re being out-debated instead of heard.',
      connect: 'The person confronting you may feel like they have to get through your explanation before they can even finish describing how they feel.',
      seek: 'The explanation can be partly about managing how you’re perceived in the moment, not just about getting the facts right.',
    },
    costByModifier: {
      steady: 'People may stop bringing you concerns at all, because every one of them turns into a negotiation about whether it’s valid.',
      assert: 'The person trying to repair things with you may find themselves debating the context of what happened instead of getting anywhere near an apology.',
      connect: 'Someone who needed to be heard may walk away from the conversation feeling like their experience got cross-examined instead of received.',
      seek: 'If every explanation is partly about your own image, people may start doubting whether your account of things is fully honest, even when it mostly is.',
    },
    practiceByModifier: {
      steady: 'Before explaining, say one sentence owning the part that’s actually true. Then explain, if it’s still needed.',
      assert: 'When confronted, let the other person finish completely before you say anything back.',
      connect: 'Ask “what did this feel like for you?” before offering any context at all.',
      seek: 'Let one explanation go unsaid. See if the relationship survives you not managing how it looked.',
    },
  },

  armored: {
    key: 'armored',
    label: 'Armored',
    identityCore: 'You protect what’s soft behind distance, strength, humor, or control until it feels earned.',
    asBase: 'You protect what’s soft — hurt, fear, need — behind distance, humor, or control, until someone’s earned the real version. That’s why your Relic takes the form of a Gauntlet. It doesn’t come off for just anyone.',
    asColor: 'Underneath your other signals is a real instinct to protect the soft spot rather than show it. That gives your Relic its Protection & Defense energy, in its most guarded form.',
    asEffect: 'Even your openness has a controlled edge to it — given on your terms, never pried loose. That’s why your Relic’s expression never fully drops its guard.',
    strength: 'You don’t hand your vulnerable moments to people who haven’t earned them, which means the people who DO get the real version know exactly how much that access means.',
    shadowByModifier: {
      steady: 'The armor can stay up even with people who’ve already proven themselves, because taking it off never quite feels safe enough.',
      assert: 'Your guard can come across as combative rather than protective, especially to someone who wasn’t trying to get past it in the first place.',
      connect: 'Someone trying to genuinely care for you may keep hitting the same wall, unsure if they’re not trusted or just not needed.',
      seek: 'You can want closeness and still make it hard to access, which leaves people guessing whether the distance is a test or a wall.',
    },
    costByModifier: {
      steady: 'People who’ve earned real access may still feel like they’re on the outside of something, because the armor never actually came down for them either.',
      assert: 'Someone offering genuine care can mistake your guard for rejection and stop trying before they ever got close.',
      connect: 'The people who most want to be let in may be the ones who feel the distance most acutely, which can read as being punished for caring.',
      seek: 'If closeness is wanted but guarded, the mixed signal can exhaust the people trying to figure out which one is true.',
    },
    practiceByModifier: {
      steady: 'Pick one person who’s already earned it, and let one small soft thing show, on purpose.',
      assert: 'Before meeting someone’s care with distance, ask yourself if they’re actually a threat, or just unfamiliar.',
      connect: 'Tell someone directly what “earning it” would actually look like, instead of making them guess.',
      seek: 'If you want someone closer, say that directly once, instead of leaving it to the armor to communicate.',
    },
  },
};

export type { RelicTraitKey, ColorFamilyKey, EffectKey };
