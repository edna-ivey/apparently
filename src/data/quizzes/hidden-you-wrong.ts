import type { ArchetypeQuizDefinition } from './types';

// Build 22 owner audit (2026-11-01): replaces the prior draft content verbatim from
// docs/private-quizzes/HIDDEN_YOU_WRONG_APPROVED_LOCKED_2026-10-31.md -- owner-approved
// editorial replacement, including exact gate/tie values (document's "Independent result
// reachability check" already ran all four winning paths against the real scoreArchetypeQuiz
// engine before approval). Quiz id, question ids (q1-q10), and choice ids (a-d) are preserved;
// no real production data exists under this quiz_key (its award-activation migration has
// never been applied). Q9 intentionally awards ZERO Creature/Relic points on every choice
// (see private-quiz-trait-awards.ts) -- the document's own explicit rule, not an omission.
export const HIDDEN_YOU_WRONG_QUIZ: ArchetypeQuizDefinition = {
  id: 'hidden-you-wrong',
  scoringType: 'archetype',
  category: 'Hidden You',
  access: 'private',
  contributesToProfile: true,
  title: 'What Do People Keep Getting Wrong About You?',
  eyebrow: 'APPARENTLY PRIVATE',
  introSupport: ['People have a whole story about you. Cute. Let’s see if it’s accurate.', "Sometimes they're completely wrong. Sometimes you're accidentally helping."],
  introNote: 'Answer as the person people actually deal with, not the person narrating your good intentions.',
  meta: '10 questions · About 3 minutes',
  introCta: 'Read me →',
  mixLabel: 'YOUR HIDDEN YOU MIX',
  recentReadMetricLabel: 'your read',
  // Owner-approved verbatim: "Tie order: highest eligible total, then high-signal
  // contributions Q3, Q5, Q7, Q9, Q10, then count full +3 selections, then Q10 as the final
  // self-contribution discriminator, then HIDDEN -> FACE -> FINE -> ATTENTION."
  highSignalQuestionIds: ['q3', 'q5', 'q7', 'q9', 'q10'],
  primaryTieWeight: 3,
  finalTieQuestionId: 'q10',
  tieFallbackOrder: ['hidden-feeling', 'face', 'fine', 'attention'],
  // Owner-approved verbatim: FINE requires >=3 FINE-supporting answers AND at least 1 among
  // Q2A/Q3A/Q7A/Q9D/Q10B; ATTENTION requires >=3 ATTENTION-supporting answers AND at least 1
  // among Q3D/Q4A/Q5C/Q9C/Q10A. HIDDEN and FACE are ungated.
  resultGates: {
    fine: { minSignals: 3, requiredAnyOf: [['q2-a', 'q3-a', 'q7-a', 'q9-d', 'q10-b']] },
    attention: { minSignals: 3, requiredAnyOf: [['q3-d', 'q4-a', 'q5-c', 'q9-c', 'q10-a']] },
  },
  archetypes: [
    {
      id: 'hidden-feeling',
      title: "HIDDEN | THEY THINK YOU DON'T CARE.",
      kicker: "Feelings aren't automatically communication.",
      apparentlySignature: 'Apparently, your heart needs subtitles.',
      traits: ['Private', 'Emotionally Selective', 'Hard to Read'],
      structuredRead: {
        theVerdict: ['Oh, you care. You’ve just given everybody access to approximately 3% of the evidence. 😂'],
        theRead: ['You feel more than you show. You can miss somebody without calling, feel hurt without explaining, and love deeply without making a presentation about it. People mistake your privacy for indifference.'],
        theCallOut: ["You can't keep your feelings password-protected and expect everybody to know what's inside."],
        theCost: ['People close to you may feel less important than they actually are.'],
        tryThis: ['Tell someone one thing you usually assume they already know.'],
      },
    },
    {
      id: 'face',
      title: 'FACE | APPARENTLY, YOUR FACE HAS A REPUTATION.',
      kicker: 'Your face is giving reviews you never wrote.',
      apparentlySignature: 'Apparently, your resting face has its own publicist.',
      traits: ['Reserved', 'Direct', 'Frequently Misread'],
      structuredRead: {
        theVerdict: ['You walked into the room. That was apparently the incident. 😭'],
        theRead: ["People see your quiet expression or direct delivery and start writing fictional backstories. Angry. Judgmental. Intimidating. Meanwhile, you may have been thinking about dinner. You're not required to perform constant warmth, but your presentation can affect how others approach you."],
        theCallOut: ["You don't have to fake sweetness. But pretending your delivery has no impact isn't helping."],
        theCost: ['People may avoid approaching you before discovering you’d actually welcome them.'],
        tryThis: ['When you like somebody, make it a little easier for them to tell.'],
      },
    },
    {
      id: 'fine',
      title: "FINE | EVERYBODY THINKS YOU'RE FINE.",
      kicker: "Competence isn't proof you don't need care.",
      apparentlySignature: 'Apparently, your strength could use a support team.',
      traits: ['Responsible', 'Self-Reliant', 'Quietly Overloaded'],
      structuredRead: {
        theVerdict: ['Of course they do. Your entire life has excellent customer service. 👏'],
        theRead: ['You handle things, show up, make jokes, and keep everybody moving. Because you’re capable, people assume the load isn’t heavy. They don’t always see the exhaustion behind the performance.'],
        theCallOut: ['If every "Are you okay?" gets an automatic "I\'m good," people will eventually believe you.'],
        theCost: ['You can become deeply loved while still feeling strangely unsupported.'],
        tryThis: ['Ask for help while the problem is a four, not a forty-seven.'],
      },
    },
    {
      id: 'attention',
      title: 'ATTENTION | THEY CALL IT "TOO MUCH." YOU CALL IT PAYING ATTENTION.',
      kicker: 'Keep the radar. Lower the siren occasionally.',
      apparentlySignature: 'Apparently, your intuition has a case-management department.',
      traits: ['Perceptive', 'Intense', 'Detail-Oriented'],
      structuredRead: {
        theVerdict: ['You noticed the shift. The pause. The weird little tone. Unfortunately, everyone else would like fewer incident reports. 👀'],
        theRead: ["You pick up on things people miss, and sometimes you're absolutely right. But spotting a detail doesn't always mean it needs a confrontation or a full investigation."],
        theCallOut: ["Being observant doesn't make every interpretation correct. That's the annoying part."],
        theCost: ['When every concern gets equal urgency, people may stop recognizing the genuinely important ones.'],
        tryThis: ['Before reacting, ask: "Is this a pattern, a problem, or just a moment?"'],
      },
    },
  ],
  questions: [
    {
      id: 'q1',
      prompt: "You walk into a room where you barely know anybody. What's the most familiar experience?",
      choices: [
        { id: 'a', label: "Somebody asks why I look annoyed. I'm literally looking for somewhere to put my coat.", resultWeights: { face: 2 } },
        { id: 'b', label: 'I usually find one person I feel comfortable talking to. That’s enough for me.', resultWeights: { 'hidden-feeling': 1 } },
        { id: 'c', label: "Before introductions are over, I've noticed who's uncomfortable and who's being left out.", resultWeights: { attention: 2 } },
        { id: 'd', label: 'Small talk? Fine. Smiling? Fine. Social battery? Approximately 2%.', resultWeights: { fine: 1 } },
      ],
    },
    {
      id: 'q2',
      prompt: 'Someone close to you asks, "Are you okay?" You’re really not. What comes out?',
      choices: [
        { id: 'a', label: '"That\'s sweet of you. Just a lot going on." Then I change the subject.', resultWeights: { fine: 2 } },
        { id: 'b', label: 'They asked. They’re getting the whole story, including the part nobody noticed.', resultWeights: { attention: 2 } },
        { id: 'c', label: '"Wait, I LOOK upset?" I thought this was my normal face.', resultWeights: { face: 1 } },
        { id: 'd', label: '"I\'m fine." But I really wish they\'d stay and ask one more time.', resultWeights: { 'hidden-feeling': 2 } },
      ],
    },
    {
      id: 'q3',
      prompt: 'Which piece of feedback have you heard more than once?',
      choices: [
        { id: 'a', label: '"You don\'t ask for help until things are already falling apart."', resultWeights: { fine: 2 } },
        { id: 'b', label: '"I thought you were mad at me before we even spoke."', resultWeights: { face: 2 } },
        { id: 'c', label: '"I can never tell when something is bothering you."', resultWeights: { 'hidden-feeling': 2 } },
        { id: 'd', label: '"How did you even notice that? The rest of us missed it."', resultWeights: { attention: 2 } },
      ],
    },
    {
      id: 'q4',
      prompt: "Someone's tone changes halfway through a conversation. What do you do?",
      choices: [
        { id: 'a', label: '"Did something just change? I want to make sure we\'re okay."', resultWeights: { attention: 2 } },
        { id: 'b', label: 'I don’t decode sighs. If there’s a problem, they can tell me.', resultWeights: { face: 1 } },
        { id: 'c', label: 'Maybe something I said landed wrong. I’ll wait and see before deciding.', resultWeights: { fine: 1 } },
        { id: 'd', label: 'I notice it, get a little quieter, and wait for the mood to pass.', resultWeights: { 'hidden-feeling': 2 } },
      ],
    },
    {
      id: 'q5',
      // Build 22 owner audit (2026-11-02): restored to the exact approved text/weights from
      // HIDDEN_YOU_WRONG_APPROVED_LOCKED_2026-10-31.md Q5 -- this question had drifted to
      // reworded prompt/choice text with different verdict weights, even though its real
      // numeric trait awards (private-quiz-trait-awards.ts) were already correctly
      // transcribed against THIS approved text, not the drifted version.
      prompt: 'Someone says something that genuinely hurts you. What happens next?',
      choices: [
        { id: 'a', label: "I pull back. If they pay attention, they'll figure out something's wrong.", resultWeights: { 'hidden-feeling': 2 } },
        { id: 'b', label: "I'll talk about it. Just not until I've finished what needs doing and calmed down.", resultWeights: { fine: 2 } },
        { id: 'c', label: '"That isn\'t what you said yesterday." I don\'t mind having an uncomfortable conversation.', resultWeights: { attention: 2 } },
        { id: 'd', label: "I address it plainly. Later someone tells me I sounded angry. I wasn't.", resultWeights: { face: 1 } },
      ],
    },
    {
      id: 'q6',
      // Build 22 owner audit (2026-11-02): restored to the exact approved text/weights from
      // HIDDEN_YOU_WRONG_APPROVED_LOCKED_2026-10-31.md Q6 -- see Q5's comment above.
      prompt: 'Someone tells you, "You\'re intimidating." What\'s your first honest response?',
      choices: [
        { id: 'a', label: '"I\'ve heard that before." Maybe I could sound a little less like a performance review.', resultWeights: { face: 2 } },
        { id: 'b', label: '"Is it because I don\'t explain myself much? I can work on that."', resultWeights: { 'hidden-feeling': 1 } },
        { id: 'c', label: '"Was that before or after I pointed out the thing nobody wanted to discuss?"', resultWeights: { attention: 1 } },
        { id: 'd', label: '"Oh, no, we\'re good!" Meanwhile, I\'m too exhausted to explain anything.', resultWeights: { fine: 1 } },
      ],
    },
    {
      id: 'q7',
      // Build 22 owner audit (2026-11-02): restored to the exact approved text/weights from
      // HIDDEN_YOU_WRONG_APPROVED_LOCKED_2026-10-31.md Q7 -- see Q5's comment above. This is
      // also the fix for the FINE/ATTENTION gates' Q7A/-- the gate always correctly referenced
      // this approved content; only the content file itself had drifted.
      prompt: 'Your entire week is falling apart. What can most people tell?',
      choices: [
        { id: 'a', label: 'Deadlines met. Messages answered. Cheerful "all done!" I\'m barely holding it together.', resultWeights: { fine: 2 } },
        { id: 'b', label: 'One trusted person knows everything. Everyone else gets the abbreviated version.', resultWeights: { 'hidden-feeling': 2 } },
        { id: 'c', label: "They think I'm in a bad mood. I'm actually trying not to cry.", resultWeights: { face: 1 } },
        { id: 'd', label: "Somehow I'm still noticing who else is struggling and checking on them.", resultWeights: { attention: 1 } },
      ],
    },
    {
      id: 'q8',
      // Build 22 owner audit (2026-11-02): restored to the exact approved text/weights from
      // HIDDEN_YOU_WRONG_APPROVED_LOCKED_2026-10-31.md Q8 -- see Q5's comment above.
      prompt: 'Somebody makes a comment that might be a little shady. Your reaction?',
      choices: [
        { id: 'a', label: '"Okay." Apparently that sounded like a threat. It wasn\'t.', resultWeights: { face: 1 } },
        { id: 'b', label: '"What did you mean by that?" If it\'s nothing, great. If not, now we know.', resultWeights: { attention: 2 } },
        { id: 'c', label: "I change the subject. I'll think about it later, privately.", resultWeights: { 'hidden-feeling': 1 } },
        { id: 'd', label: "Not today. I have bigger problems than somebody's possibly weird comment.", resultWeights: { fine: 1 } },
      ],
    },
    {
      id: 'q9',
      prompt: 'Which misunderstanding gets under your skin the most?',
      choices: [
        { id: 'a', label: "People think my face is a review of their entire personality.", resultWeights: { face: 3 } },
        { id: 'b', label: "They assume my silence means I don't care.", resultWeights: { 'hidden-feeling': 3 } },
        { id: 'c', label: "They think asking questions means I'm trying to start an argument.", resultWeights: { attention: 3 } },
        { id: 'd', label: "They assume that because I'm handling everything, I'm not struggling.", resultWeights: { fine: 3 } },
      ],
    },
    {
      id: 'q10',
      prompt: "They're sometimes getting you wrong. But which part might actually be your contribution?",
      choices: [
        { id: 'a', label: 'Once I notice a pattern, I can keep pressing even when the conversation needs a break.', resultWeights: { attention: 3 } },
        { id: 'b', label: 'I automatically say "I\'m good" even when I wish somebody would help.', resultWeights: { fine: 3 } },
        { id: 'c', label: "Sometimes I hint at what I need instead of saying it. Then I'm disappointed.", resultWeights: { 'hidden-feeling': 3 } },
        { id: 'd', label: "My tone doesn't always communicate the kindness I actually feel.", resultWeights: { face: 3 } },
      ],
    },
  ],
};
