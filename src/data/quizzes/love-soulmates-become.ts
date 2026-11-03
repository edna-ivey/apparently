import type { ArchetypeQuizDefinition } from './types';

// Build 22 owner audit (2026-11-02): new premium quiz, approved in full from
// docs/private-quizzes/APPROVED_11_QUIZ_SOURCE_PACK_2026-11-02.md, source file 03, Quiz 1
// ("What Do You Become When You Really Like Somebody?"). Every choice has exactly one
// verdict target (no blended weights on this quiz's content), 5 choices per question (A-E).
export const LOVE_SOULMATES_BECOME_QUIZ: ArchetypeQuizDefinition = {
  id: 'love-soulmates-become',
  scoringType: 'archetype',
  category: 'Love & Soulmates',
  access: 'private',
  title: 'What Do You Become When You Really Like Somebody?',
  eyebrow: 'APPARENTLY PRIVATE · LOVE & SOULMATES',
  introSupport: [
    'Crushes have a funny way of introducing people to themselves.',
    'The texts. The overthinking. The disappearing personality. We are checking what attraction does to your behavior, not what you claim to be like when you are calm.',
  ],
  introNote: 'Answer for what you actually do, not the emotionally evolved version of you in your imagination.',
  meta: '10 questions · About 3 minutes',
  introCta: 'Clock my crush behavior →',
  mixLabel: 'YOUR LOVE & SOULMATES MIX',
  recentReadMetricLabel: 'your read',
  highSignalQuestionIds: ['q2', 'q3', 'q5', 'q7', 'q8', 'q9', 'q10'],
  tieFallbackOrder: ['steady', 'bold', 'guarded', 'needy', 'pickme'],
  resultGates: {
    needy: { minSignals: 4, requiredGroups: [{ answers: ['q2-c', 'q4-a', 'q7-c', 'q8-b', 'q10-e'], min: 3 }] },
    pickme: { minSignals: 4, requiredGroups: [{ answers: ['q3-c', 'q4-b', 'q7-d', 'q8-c', 'q9-b', 'q10-a'], min: 3 }] },
  },
  archetypes: [
    {
      id: 'steady',
      title: 'STEADY | YOU LIKE THEM. YOU STILL REMEMBER WHO YOU ARE.',
      kicker: 'You caught feelings. Your calendar survived.',
      apparentlySignature: 'Apparently, you can have a crush without filing a missing-person report on yourself.',
      traits: ['Grounded', 'Self-Respecting', 'Open to Connection'],
      structuredRead: {
        theVerdict: ['Attraction has entered the chat. Your entire personality has not left the building.'],
        theRead: ['You can be excited by somebody without rearranging your schedule, standards, opinions, and sense of worth around them. Your answers suggest you can make room for a connection while keeping your own life intact. You notice whether interest is mutual, speak up when something matters, and let an unanswered text remain just an unanswered text.'],
        theCallOut: ['Your composure is not proof that you never get nervous. It is proof that you do not hand every nervous feeling the steering wheel.'],
        theCost: ['You may occasionally underestimate how reassuring a direct sign of interest can be. Being steady should not become being unreadable.'],
        tryThis: ['Tell the person one thing you genuinely enjoy about them. No strategy, no performance, no three-day waiting period.'],
      },
    },
    {
      id: 'bold',
      title: 'BOLD | YOU MAKE THE FIRST MOVE. NO SECRET COMMITTEE REQUIRED.',
      kicker: 'You sent the text. The world continued spinning.',
      apparentlySignature: 'Apparently, your romantic strategy includes actually communicating.',
      traits: ['Direct', 'Initiating', 'Courageous'],
      structuredRead: {
        theVerdict: ['When you like somebody, you tend to let them know. Shocking behavior in this economy.'],
        theRead: ['You flirt, initiate, make plans, and say the warm thing while it still matters. You are not above nerves. You simply refuse to turn every possible rejection into a three-month research project. Your answers show an appetite for mutuality rather than endless guessing.'],
        theCallOut: ['Being brave is attractive. But if you are always the one starting everything, check whether the other person is showing up too. A connection is not a solo performance.'],
        theCost: ['Your momentum can keep you invested in a person who enjoys being pursued more than participating.'],
        tryThis: ['Make one clear invitation, then leave room for an equally clear answer and reciprocal effort.'],
      },
    },
    {
      id: 'guarded',
      title: 'GUARDED | YOU ACT UNBOTHERED. YOU ARE VERY BOTHERED.',
      kicker: 'You checked their story six times and still replied “haha.”',
      apparentlySignature: 'Apparently, your feelings have a password-protected guest entrance.',
      traits: ['Guarded', 'Observant', 'Slow to Reveal'],
      structuredRead: {
        theVerdict: ['Your heart is running a full production. Your face has denied the project exists.'],
        theRead: ['You are careful with your enthusiasm. When someone matters, you may pull back, rehearse your replies, or wait for them to show their hand first. You can genuinely feel a lot while giving the other person remarkably little to work with. The distance protects you from embarrassment, but it also hides your interest.'],
        theCallOut: ['You keep calling it playing it cool. Sometimes it is fear of being seen wanting something.'],
        theCost: ['Someone who likes you may conclude you are not interested and stop trying. They cannot respond to feelings they were never allowed to see.'],
        tryThis: ['Offer one unambiguous sign of interest. Not a cryptic emoji. A sentence.'],
      },
    },
    {
      id: 'needy',
      title: 'NEEDY | NEEDY. THERE, WE SAID IT.',
      kicker: 'They went grocery shopping. You opened a case file.',
      apparentlySignature: 'Apparently, your reassurance plan has no expiration date.',
      traits: ['Reassurance-Hungry', 'Hypervigilant', 'Emotionally Reactive'],
      structuredRead: {
        theVerdict: ['You do not just like attention. You keep needing confirmation that you have not lost it.'],
        theRead: ['Your answers describe a repeated pattern: the reply takes too long, the tone feels different, or the person makes ordinary plans without you, and suddenly the relationship is on trial. You look for signs, request reassurance, and feel settled only until the next uncertain moment. This is not about wanting affection. It is about making somebody continuously prove what they already told you.'],
        theCallOut: ['Your insecurity is becoming another person’s full-time assignment. Their phone is not a heart monitor for your self-worth.'],
        theCost: ['They can sincerely like you and still become exhausted by the constant checking, testing, and emotional emergencies.'],
        tryThis: ['When anxiety spikes, wait before sending the second interrogation text. Name what you fear privately, then ask one honest question if the concern remains.'],
      },
    },
    {
      id: 'pickme',
      title: 'PICKME | PICK-ME. AND IT SHOWS.',
      kicker: 'You said you love hiking. You own one pair of shoes and they are slippers.',
      apparentlySignature: 'Apparently, your crush met your public-relations department first.',
      traits: ['Approval-Seeking', 'Self-Editing', 'Overaccommodating'],
      structuredRead: {
        theVerdict: ['You are not dating them yet. You are already campaigning for the position.'],
        theRead: ['Your answers show you editing your preferences, canceling your own plans, and swallowing objections to look like the easiest person to choose. You become whatever seems most appealing to them, then call the performance chemistry. You might even resent them later for liking the version of you that you introduced.'],
        theCallOut: ['You keep volunteering to disappear and hoping somebody will call it love. Being chosen is not an achievement if you had to erase yourself to qualify.'],
        theCost: ['You can win someone’s attention while training them to overlook your needs, because you taught them those needs were negotiable.'],
        tryThis: ['Name one preference you would normally hide. Say it plainly, then watch whether this connection can make room for the real you.'],
      },
    },
  ],
  questions: [
    {
      id: 'q1',
      prompt: 'They suggest a restaurant you genuinely dislike. Your actual response?',
      choices: [
        { id: 'a', label: '“Not my favorite. Want to try the place across the street?”', resultWeights: { steady: 2 } },
        { id: 'b', label: '“I have a better idea. Let me make the reservation.”', resultWeights: { bold: 2 } },
        { id: 'c', label: '“Either is fine.” I will quietly hope they somehow guess my favorite.', resultWeights: { guarded: 2 } },
        { id: 'd', label: 'I agree, then privately worry that disagreeing would make them less interested.', resultWeights: { needy: 2 } },
        { id: 'e', label: '“I LOVE that place.” I absolutely do not. But they seem excited.', resultWeights: { pickme: 2 } },
      ],
    },
    {
      id: 'q2',
      prompt: 'They take four hours to reply after a really good date. What happens during hour three?',
      choices: [
        { id: 'a', label: 'I send one honest “I had fun” message, then leave it there.', resultWeights: { bold: 2 } },
        { id: 'b', label: 'I draft a reply in my head, then decide to look much less interested.', resultWeights: { guarded: 2 } },
        { id: 'c', label: 'I check their activity, reread the date, and wonder what changed.', resultWeights: { needy: 3 } },
        { id: 'd', label: 'I consider sending something they would find funnier, hotter, or more impressive.', resultWeights: { pickme: 2 } },
        { id: 'e', label: 'I notice. Then I get on with whatever I was doing.', resultWeights: { steady: 2 } },
      ],
    },
    {
      id: 'q3',
      prompt: 'Your crush mentions a hobby you know nothing about. Your first instinct?',
      choices: [
        { id: 'a', label: 'Listen closely, but keep my own interests mostly to myself.', resultWeights: { guarded: 2 } },
        { id: 'b', label: 'Wonder whether they would prefer someone who already shares that hobby.', resultWeights: { needy: 2 } },
        { id: 'c', label: '“Wait, I am OBSESSED with that too.” I learned about it 14 seconds ago.', resultWeights: { pickme: 3 } },
        { id: 'd', label: 'Ask about it because I am curious, not because I need a new personality.', resultWeights: { steady: 2 } },
        { id: 'e', label: 'Suggest we try it together. I am interested in the person, not auditioning.', resultWeights: { bold: 2 } },
      ],
    },
    {
      id: 'q4',
      prompt: 'You were looking forward to seeing them, but they cancel for a legitimate reason. You...',
      choices: [
        { id: 'a', label: 'Ask if everything is okay between us, even though they explained the reason.', resultWeights: { needy: 3 } },
        { id: 'b', label: 'Offer to rearrange three other commitments so they will still see me.', resultWeights: { pickme: 3 } },
        { id: 'c', label: 'Say no worries, reschedule if we both want to, and keep my evening.', resultWeights: { steady: 2 } },
        { id: 'd', label: 'Tell them I was disappointed and offer a different day.', resultWeights: { bold: 2 } },
        { id: 'e', label: 'Say “all good,” then decide they will have to initiate everything now.', resultWeights: { guarded: 2 } },
      ],
    },
    {
      id: 'q5',
      prompt: 'Your best friend says, “You have been acting different since you met them.” You think...',
      choices: [
        { id: 'a', label: 'I get defensive. My friend is noticing the things I stopped doing for myself.', resultWeights: { pickme: 2 } },
        { id: 'b', label: '“Have I? Tell me what you have noticed.”', resultWeights: { steady: 2 } },
        { id: 'c', label: '“I am excited! But tell me if I have been neglecting our plans.”', resultWeights: { bold: 2 } },
        { id: 'd', label: 'They cannot possibly know. I have been trying so hard to act normal.', resultWeights: { guarded: 2 } },
        { id: 'e', label: 'I start worrying my crush must be noticing something wrong with me too.', resultWeights: { needy: 2 } },
      ],
    },
    {
      id: 'q6',
      prompt: 'They say they want to take things slowly. Your honest reaction?',
      choices: [
        { id: 'a', label: '“Works for me if we are both clear about what that means.”', resultWeights: { steady: 2 } },
        { id: 'b', label: '“I like you. Here is what I am comfortable with. What about you?”', resultWeights: { bold: 2 } },
        { id: 'c', label: 'Great. Now I can pretend this matters less than it does.', resultWeights: { guarded: 2 } },
        { id: 'd', label: 'I hear “slowly” as “they are about to leave” and need them to explain it again.', resultWeights: { needy: 2 } },
        { id: 'e', label: '“Whatever pace YOU want.” Even if it is definitely not mine.', resultWeights: { pickme: 2 } },
      ],
    },
    {
      id: 'q7',
      prompt: 'Their close friend is attractive, funny, and clearly comfortable around them. You...',
      choices: [
        { id: 'a', label: 'Introduce myself and enjoy meeting someone important to them.', resultWeights: { bold: 2 } },
        { id: 'b', label: 'Become quieter. I would rather watch than admit I feel awkward.', resultWeights: { guarded: 2 } },
        { id: 'c', label: 'Compare myself immediately and later fish for reassurance about that friend.', resultWeights: { needy: 3 } },
        { id: 'd', label: 'Start competing to be the funniest, coolest, easiest person in the room.', resultWeights: { pickme: 3 } },
        { id: 'e', label: 'Notice it, but do not manufacture a rivalry from ordinary friendship.', resultWeights: { steady: 2 } },
      ],
    },
    {
      id: 'q8',
      prompt: 'They ask what you want from this connection. You actually say...',
      choices: [
        { id: 'a', label: '“Nothing serious, I guess.” I am lying to both of us.', resultWeights: { guarded: 2 } },
        { id: 'b', label: '“Do you still like me?” That question gets there before my actual answer.', resultWeights: { needy: 3 } },
        { id: 'c', label: '“Honestly, whatever you want.” I have a real answer; I just hide it.', resultWeights: { pickme: 3 } },
        { id: 'd', label: 'What I want, even if it means we might not be compatible.', resultWeights: { steady: 2 } },
        { id: 'e', label: '“I like you. I want to see where this could genuinely go.”', resultWeights: { bold: 2 } },
      ],
    },
    {
      id: 'q9',
      prompt: 'You disagree with them about something that matters to you. What happens?',
      choices: [
        { id: 'a', label: 'I backpedal, then need them to reassure me that disagreeing did not ruin things.', resultWeights: { needy: 2 } },
        { id: 'b', label: 'I suddenly “see their point” because I do not want to risk looking difficult.', resultWeights: { pickme: 3 } },
        { id: 'c', label: 'I explain my view and listen to theirs. Agreement is not the price of liking me.', resultWeights: { steady: 2 } },
        { id: 'd', label: 'I bring it up early. Better to know whether we can handle a real conversation.', resultWeights: { bold: 2 } },
        { id: 'e', label: 'I file it away and go quieter. They can guess that something changed.', resultWeights: { guarded: 2 } },
      ],
    },
    {
      id: 'q10',
      prompt: 'Finish this sentence honestly: “When I really like somebody, I tend to...”',
      choices: [
        { id: 'a', label: 'Become the person I think they would choose over everybody else.', resultWeights: { pickme: 3 } },
        { id: 'b', label: 'Make space for them without evicting myself.', resultWeights: { steady: 2 } },
        { id: 'c', label: 'Let them know, because mixed signals bore me.', resultWeights: { bold: 2 } },
        { id: 'd', label: 'Hide my hand until I am absolutely sure they are showing theirs.', resultWeights: { guarded: 2 } },
        { id: 'e', label: 'Need new proof they are interested, even after they have already shown me.', resultWeights: { needy: 3 } },
      ],
    },
  ],
};
