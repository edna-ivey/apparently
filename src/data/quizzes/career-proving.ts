import type { ArchetypeQuizDefinition } from './types';
export const CAREER_PROVING_QUIZ: ArchetypeQuizDefinition = {
  id: 'career-ambition-proving',
  scoringType: 'archetype',
  category: 'Career & Ambition',
  access: 'private',
  contributesToProfile: true,
  answerLevelPersonalityEvidence: true,
  title: 'Are you ambitious... or proving something?',
  eyebrow: 'APPARENTLY PRIVATE',
  introSupport: ['Success hits different when it has an audience.'],
  meta: '10 questions · About 3 min',
  introCta: 'Expose me →',
  mixLabel: 'YOUR CAREER & AMBITION MIX',
  recentReadMetricLabel: 'your read',
  highSignalQuestionIds: ['q1', 'q3', 'q5', 'q6', 'q9', 'q10'],
  tieFallbackOrder: ['nobody-clapped', 'want-it-seen', 'proving-something', 'performing-for'],
  resultGates: { 'performing-for': { minSignals: 3, requiredGroups: [{ answers: ['q1-d', 'q6-c', 'q10-d'], min: 2 }, { answers: ['q3-c', 'q5-c', 'q9-c'], min: 1 }] } },
  archetypes: [
    {
      id: 'nobody-clapped',
      title: 'YOU’D STILL WANT IT IF NOBODY CLAPPED',
      structuredRead: {
        theRead: ['You actually want the life.', 'Not just the announcement.', 'Not just the title.', 'Not just the moment somebody who underestimated you has to quietly update their opinion.', 'You care about what success changes in your real life: what you get to build, learn, afford, choose, become, or experience.', 'Recognition can still feel good. You’re human.', 'It just isn’t carrying much weight.'],
        theCallOut: ['Internal ambition has its own problem.', 'You can become so focused on the next meaningful thing that you forget the current meaningful thing already happened.', 'There is always another level if you refuse to define “enough.”', 'Apparently, nobody has to clap.', 'But you might occasionally need to.'],
        theCost: [],
        tryThis: [],
      },
    },
    {
      id: 'want-it-seen',
      title: 'YOU WANT THE WIN... AND YOU WANT IT SEEN',
      structuredRead: {
        theRead: ['Yes, you want the thing.', 'And yes, you would also like witnesses.', '😂', 'That does not automatically make your ambition fake.', 'Recognition matters to you because achievement feels even better when it is acknowledged.', 'You like knowing the work landed.', 'That people noticed.', 'That the thing you sacrificed for became visible enough to count.'],
        theCallOut: ['Just watch the math.', 'There is a difference between:', '“I’m proud and I want people to celebrate with me.”', 'and', '“If nobody is impressed, did I choose the wrong dream?”', 'The first one is human.', 'The second one means the audience is beginning to get a vote.'],
        theCost: [],
        tryThis: [],
      },
    },
    {
      id: 'proving-something',
      title: 'YOU’RE STILL TRYING TO PROVE SOMETHING',
      structuredRead: {
        theRead: ['Oh.', 'Somebody is in this room with us.', '😂', 'Maybe it is a parent.', 'An ex.', 'A former boss.', 'A sibling.', 'A classmate.', 'The people who doubted you.', 'Or an earlier version of you who felt overlooked, underestimated, ordinary, rejected, broke, behind, or not quite enough.', 'Your ambition is real.', 'But so is the little file folder labeled:', 'WATCH ME.', 'And listen, spite has launched some very successful careers.', 'We are simply asking whether it is still supposed to be CEO.'],
        theCallOut: ['Proving people wrong can get you moving.', 'The problem is that it gives people you claim not to care about an extraordinary amount of influence over your life.', 'If your goals keep getting bigger every time somebody fails to be impressed...', 'you may not actually be chasing success anymore.', 'You may be chasing a verdict.'],
        theCost: ['There is no finish line if the goal is finally feeling undeniable.', 'Somebody can always be richer.', 'More respected.', 'More attractive.', 'More accomplished.', 'Further ahead.', 'And the person you wanted to prove wrong may never give you the reaction you wrote for them anyway.', 'That is a terrible person to put in charge of your satisfaction.'],
        tryThis: ['Take one major goal and finish this sentence:', '> “If nobody from my past ever found out, I would still want this because ______.”', 'If you cannot answer it without mentioning how you will look to somebody else...', 'Apparently has located the assignment. 👀'],
      },
    },
    {
      id: 'performing-for',
      title: 'WHO EXACTLY ARE WE PERFORMING FOR?',
      structuredRead: {
        theRead: ['Okay.', 'We may have lost the plot a little.', 'You are not only asking:', '“What life do I want?”', 'You are also asking:', '“What life would make people think I won?”', 'Those are not the same question.', 'And some of your ambition may be less about enjoying success than being visibly successful enough that nobody can dismiss you.', 'That is a rough job.', 'Because the audience is never fully satisfied.'],
        theCallOut: ['You can build an extremely impressive life that does not actually fit you.', 'The right title.', 'The right money.', 'The right house.', 'The right story.', 'The right thing to say when somebody asks what you have been up to.', 'And privately?', 'You are tired.', 'Or bored.', 'Or still comparing.', 'Or already looking for the next thing impressive enough to finally make you feel settled.', '👀'],
        theCost: ['Performance is expensive.', 'You spend years earning things you may not have chosen without an audience.', 'Then you are stuck maintaining a life designed partly for people who do not even live in it.'],
        tryThis: ['For one goal, remove the audience completely.', 'No announcement.', 'No imagined reaction.', 'No revenge fantasy.', 'No “wait until they see.”', 'Just ask:', 'Would I actually like the life on the other side of this?', 'If the answer changes...', 'well.', 'That was kind of the point.'],
      },
    },
  ],
  questions: [
    {
      id: 'q1',
      prompt: 'You get the thing. Big promotion, successful launch, huge milestone. Then you find out absolutely nobody from your past will ever hear about it. Does the win change?',
      choices: [
        { id: 'a', label: 'Not really. I still have the thing I wanted.', resultWeights: {'nobody-clapped': 2}, traitSignals: [{dimension: 'self_secure_reassurance', value: 2}] },
        { id: 'b', label: 'A little. I’m not proud of it, but part of the fantasy included them knowing.', resultWeights: {'want-it-seen': 2}, traitSignals: [{dimension: 'boundary_holding_approval_seeking', value: -1}] },
        { id: 'c', label: 'Depends who “they” are. There are definitely one or two people I would like informed. 😂', resultWeights: {'proving-something': 2}, traitSignals: [{dimension: 'boundary_holding_approval_seeking', value: -1}] },
        { id: 'd', label: 'A lot, actually. If nobody knows I made it, something about it feels less satisfying.', resultWeights: {'performing-for': 2}, traitSignals: [{dimension: 'boundary_holding_approval_seeking', value: -2}] },
      ],
    },
    {
      id: 'q2',
      prompt: 'Somebody you secretly compare yourself to announces a huge win. Your life is going fine. What happens inside first?',
      choices: [
        { id: 'a', label: '“Good for them.” Then I go back to my own life.', resultWeights: {'nobody-clapped': 2}, traitSignals: [{dimension: 'self_secure_reassurance', value: 1}] },
        { id: 'b', label: 'Immediate comparison. Then I have to talk myself back down.', resultWeights: {'want-it-seen': 1, 'proving-something': 1}, traitSignals: [{dimension: 'reflective_reactive', value: 2}, {dimension: 'competitive_cooperative', value: 1}] },
        { id: 'c', label: 'Motivation spike. Oh, we’re doing things now.', resultWeights: {'proving-something': 2}, traitSignals: [{dimension: 'competitive_cooperative', value: 2}, {dimension: 'ambitious_content', value: 1}] },
        { id: 'd', label: 'I start mentally listing all the reasons their win does not count the same as mine would. 👀', resultWeights: {'proving-something': 2}, traitSignals: [{dimension: 'competitive_cooperative', value: 1}, {dimension: 'perspective_taking_self_referencing', value: -2}] },
      ],
    },
    {
      id: 'q3',
      prompt: 'Which version of success sounds best if you cannot have all four?',
      choices: [
        { id: 'a', label: 'Excellent work, good money, almost no public recognition', resultWeights: {'nobody-clapped': 2} },
        { id: 'b', label: 'Freedom, even if the job itself is not impressive', resultWeights: {'nobody-clapped': 2} },
        { id: 'c', label: 'A title or accomplishment people immediately respect', resultWeights: {'want-it-seen': 2, 'performing-for': 1}, traitSignals: [{dimension: 'boundary_holding_approval_seeking', value: -2}] },
        { id: 'd', label: 'Building something difficult enough that I know I earned it', resultWeights: {'nobody-clapped': 2}, traitSignals: [{dimension: 'ambitious_content', value: 1}, {dimension: 'self_secure_reassurance', value: 1}] },
      ],
    },
    {
      id: 'q4',
      prompt: 'Be serious. Which sentence has the most emotional charge?',
      choices: [
        { id: 'a', label: '“I knew you could do it.”', resultWeights: {'want-it-seen': 1} },
        { id: 'b', label: '“I didn’t think you had it in you.”', resultWeights: {'proving-something': 2}, traitSignals: [{dimension: 'boundary_holding_approval_seeking', value: -1}] },
        { id: 'c', label: '“You’re doing really well for yourself.”', resultWeights: {'want-it-seen': 2}, traitSignals: [{dimension: 'boundary_holding_approval_seeking', value: -1}] },
        { id: 'd', label: '“Wow. I was wrong about you.”', resultWeights: {'proving-something': 2}, traitSignals: [{dimension: 'boundary_holding_approval_seeking', value: -2}] },
      ],
    },
    {
      id: 'q5',
      prompt: 'You could become wildly successful doing something that does not sound impressive at parties. Nobody is jealous. Nobody is fascinated. Your life is great.',
      choices: [
        { id: 'a', label: 'Sold. My actual life matters more than the résumé line.', resultWeights: {'nobody-clapped': 2}, traitSignals: [{dimension: 'self_secure_reassurance', value: 2}, {dimension: 'practical_idealistic', value: 1}] },
        { id: 'b', label: 'Probably yes, but I’d need to get over the fact that it sounds boring.', resultWeights: {'want-it-seen': 2}, traitSignals: [{dimension: 'boundary_holding_approval_seeking', value: -1}] },
        { id: 'c', label: 'I don’t know. Part of success to me is being proud to tell people what I do.', resultWeights: {'want-it-seen': 2, 'performing-for': 1}, traitSignals: [{dimension: 'boundary_holding_approval_seeking', value: -2}] },
        { id: 'd', label: 'No. If I’m going to work that hard, I want something that feels significant too.', resultWeights: {'want-it-seen': 1}, traitSignals: [{dimension: 'ambitious_content', value: 1}] },
      ],
    },
    {
      id: 'q6',
      prompt: 'When you picture finally “making it,” which part feels the best?',
      choices: [
        { id: 'a', label: 'Waking up and actually liking what my everyday life looks like', resultWeights: {'nobody-clapped': 2} },
        { id: 'b', label: 'Having the money and freedom to do what I want', resultWeights: {'nobody-clapped': 2} },
        { id: 'c', label: 'People seeing what I accomplished and knowing I really did it', resultWeights: {'performing-for': 2}, traitSignals: [{dimension: 'boundary_holding_approval_seeking', value: -2}] },
        { id: 'd', label: 'Knowing I became genuinely great at something', resultWeights: {'nobody-clapped': 2}, traitSignals: [{dimension: 'ambitious_content', value: 2}, {dimension: 'self_secure_reassurance', value: 1}] },
      ],
    },
    {
      id: 'q7',
      prompt: 'Somebody who once underestimated you asks for advice because you are now doing better than they are. First reaction.',
      choices: [
        { id: 'a', label: 'I help them. Life moved on.', resultWeights: {'nobody-clapped': 2}, traitSignals: [{dimension: 'forgiving_receipts', value: 1}] },
        { id: 'b', label: 'I help them, but I would be lying if I said the irony does nothing for me. 😂', resultWeights: {'want-it-seen': 1, 'proving-something': 1}, traitSignals: [{dimension: 'reflective_reactive', value: 1}, {dimension: 'forgiving_receipts', value: 1}] },
        { id: 'c', label: 'Oh, I am helping beautifully. They are also going to understand exactly who they asked.', resultWeights: {'proving-something': 2}, traitSignals: [{dimension: 'competitive_cooperative', value: 1}, {dimension: 'boundary_holding_approval_seeking', value: -1}, {dimension: 'gives_freely_keeps_score', value: -1}] },
        { id: 'd', label: 'I don’t really want to help. They can figure it out like I had to.', resultWeights: {'proving-something': 2}, traitSignals: [{dimension: 'gives_freely_keeps_score', value: -2}, {dimension: 'repair_punishing', value: -1}] },
      ],
    },
    {
      id: 'q8',
      prompt: 'You hit a goal and the feeling lasts... three days. Then your brain immediately picks a bigger one. What does that sound like?',
      choices: [
        { id: 'a', label: 'Me. I genuinely like growth and challenge.', resultWeights: {'nobody-clapped': 2}, traitSignals: [{dimension: 'ambitious_content', value: 2}] },
        { id: 'b', label: 'Me, but sometimes I wonder whether I know how to enjoy anything.', resultWeights: {'want-it-seen': 1}, traitSignals: [{dimension: 'reflective_reactive', value: 2}, {dimension: 'ambitious_content', value: 1}] },
        { id: 'c', label: 'Definitely me. Standing still feels a little too much like falling behind.', resultWeights: {'proving-something': 2}, traitSignals: [{dimension: 'ambitious_content', value: 2}] },
        { id: 'd', label: 'That sounds exhausting. I actually want to arrive somewhere eventually.', resultWeights: {'nobody-clapped': 2}, traitSignals: [{dimension: 'ambitious_content', value: -2}] },
      ],
    },
    {
      id: 'q9',
      prompt: 'Which failure would bother you the longest?',
      choices: [
        { id: 'a', label: 'Knowing I could have done more but didn’t', resultWeights: {'nobody-clapped': 2}, traitSignals: [{dimension: 'accountability_defensiveness', value: 1}] },
        { id: 'b', label: 'Failing at something I deeply cared about', resultWeights: {'nobody-clapped': 2} },
        { id: 'c', label: 'People seeing me fail after I talked about it', resultWeights: {'want-it-seen': 2, 'performing-for': 1}, traitSignals: [{dimension: 'boundary_holding_approval_seeking', value: -2}] },
        { id: 'd', label: 'Watching somebody I considered my peer pass me', resultWeights: {'proving-something': 2}, traitSignals: [{dimension: 'competitive_cooperative', value: 2}, {dimension: 'perspective_taking_self_referencing', value: -1}] },
      ],
    },
    {
      id: 'q10',
      prompt: 'Last one. You get everything you’ve been chasing, but the person whose approval you wanted most says... nothing.',
      choices: [
        { id: 'a', label: 'It would sting, but it would not change what I built.', resultWeights: {'nobody-clapped': 2}, traitSignals: [{dimension: 'self_secure_reassurance', value: 2}] },
        { id: 'b', label: 'That would hurt more than I want to admit.', resultWeights: {'want-it-seen': 2, 'proving-something': 1}, traitSignals: [{dimension: 'self_secure_reassurance', value: -2}, {dimension: 'boundary_holding_approval_seeking', value: -1}] },
        { id: 'c', label: 'I would immediately want to achieve something even harder.', resultWeights: {'proving-something': 2}, traitSignals: [{dimension: 'ambitious_content', value: 2}, {dimension: 'boundary_holding_approval_seeking', value: -1}] },
        { id: 'd', label: 'If I’m being real, part of me would wonder what the point was. ## Result copy ### YOU’D STILL WANT IT IF NOBODY CLAPPED #### THE READ You actually want the life. Not just the announcement. Not just the title. Not just the moment somebody who underestimated you has to quietly update their opinion. You care about what success changes in your real life: what you get to build, learn, afford, choose, become, or experience. Recognition can still feel good. You’re human. It just isn’t carrying much weight. #### THE CALL-OUT Internal ambition has its own problem. You can become so focused on the next meaningful thing that you forget the current meaningful thing already happened. There is always another level if you refuse to define “enough.” Apparently, nobody has to clap. But you might occasionally need to. ### YOU WANT THE WIN... AND YOU WANT IT SEEN #### THE READ Yes, you want the thing. And yes, you would also like witnesses. 😂 That does not automatically make your ambition fake. Recognition matters to you because achievement feels even better when it is acknowledged. You like knowing the work landed. That people noticed. That the thing you sacrificed for became visible enough to count. #### THE CALL-OUT Just watch the math. There is a difference between: “I’m proud and I want people to celebrate with me.” and “If nobody is impressed, did I choose the wrong dream?” The first one is human. The second one means the audience is beginning to get a vote. ### YOU’RE STILL TRYING TO PROVE SOMETHING #### THE READ Oh. Somebody is in this room with us. 😂 Maybe it is a parent. An ex. A former boss. A sibling. A classmate. The people who doubted you. Or an earlier version of you who felt overlooked, underestimated, ordinary, rejected, broke, behind, or not quite enough. Your ambition is real. But so is the little file folder labeled: WATCH ME. And listen, spite has launched some very successful careers. We are simply asking whether it is still supposed to be CEO. #### THE CALL-OUT Proving people wrong can get you moving. The problem is that it gives people you claim not to care about an extraordinary amount of influence over your life. If your goals keep getting bigger every time somebody fails to be impressed... you may not actually be chasing success anymore. You may be chasing a verdict. #### THE COST There is no finish line if the goal is finally feeling undeniable. Somebody can always be richer. More respected. More attractive. More accomplished. Further ahead. And the person you wanted to prove wrong may never give you the reaction you wrote for them anyway. That is a terrible person to put in charge of your satisfaction. #### TRY THIS Take one major goal and finish this sentence: > “If nobody from my past ever found out, I would still want this because ______.” If you cannot answer it without mentioning how you will look to somebody else... Apparently has located the assignment. 👀 ### WHO EXACTLY ARE WE PERFORMING FOR? #### THE READ Okay. We may have lost the plot a little. You are not only asking: “What life do I want?” You are also asking: “What life would make people think I won?” Those are not the same question. And some of your ambition may be less about enjoying success than being visibly successful enough that nobody can dismiss you. That is a rough job. Because the audience is never fully satisfied. #### THE CALL-OUT You can build an extremely impressive life that does not actually fit you. The right title. The right money. The right house. The right story. The right thing to say when somebody asks what you have been up to. And privately? You are tired. Or bored. Or still comparing. Or already looking for the next thing impressive enough to finally make you feel settled. 👀 #### THE COST Performance is expensive. You spend years earning things you may not have chosen without an audience. Then you are stuck maintaining a life designed partly for people who do not even live in it. #### TRY THIS For one goal, remove the audience completely. No announcement. No imagined reaction. No revenge fantasy. No “wait until they see.” Just ask: Would I actually like the life on the other side of this? If the answer changes... well. That was kind of the point.', resultWeights: {'performing-for': 2}, traitSignals: [{dimension: 'boundary_holding_approval_seeking', value: -2}, {dimension: 'self_secure_reassurance', value: -2}] },
      ],
    },
  ],
};
