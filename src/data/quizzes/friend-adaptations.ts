// Approved "THEY HAVE NOTES." friend-answering adaptations for the two playable Private
// quizzes — transcribed exactly as given, with the owner's name/pronoun templated. Do not
// creatively rewrite; the approved Michelle-based rendering is the content authority.
//
// Templating design ("smallest grammatical templating layer practical"): {{name}} is the
// ONE runtime token, substituted with the owner's real display name everywhere the approved
// text used "Michelle" or a SUBJECT-position "she" (e.g. "Michelle tells" / "she'll save" ->
// "{{name}} tells" / "{{name}} will save") — this sidesteps verb-agreement entirely, since a
// proper name always takes the same verb form regardless of which name is substituted, and
// satisfies "always use the owner's display/first name where natural." Every OBJECT/
// POSSESSIVE/REFLEXIVE "her"/"herself" in the approved text (e.g. "her own head", "her
// friend", "hyping THEM") is written directly as invariant singular they/them/their/themself
// — never gendered, never re-tokenized, since it never changes based on the owner. No pronoun
// is ever inferred from the owner's name.
export type FriendAdaptedChoice = { id: string; label: string };
export type FriendAdaptedQuestion = { id: string; prompt: string; choices: FriendAdaptedChoice[] };
export type FriendQuizAdaptation = { questions: FriendAdaptedQuestion[] };

export const renderFriendTemplate = (template: string, ownerName: string): string => template.replace(/\{\{name\}\}/g, ownerName);

export const KEEP_YOU_AROUND_FRIEND_ADAPTATION: FriendQuizAdaptation = {
  questions: [
    {
      id: 'q1',
      prompt: '{{name}}’s friend is dating somebody {{name}} cannot stand. What is {{name}} actually doing?',
      choices: [
        { id: 'a', label: '{{name}} tells them exactly what {{name}} doesn’t like about this person. Once. After that, they’re grown.' },
        { id: 'b', label: 'If it blows up, they can call {{name}} without hearing “I told you so.” {{name}} will save that thought for their own head. 😂' },
        { id: 'c', label: 'Their relationship does not get every weekend now. {{name}} is still making plans, inviting their friend out, and keeping their friendship fun.' },
        { id: 'd', label: '{{name}} has already clocked three things about this person their friend hasn’t noticed yet. {{name}} is not saying all of it unless asked.' },
        { id: 'e', label: 'If their friend is happy, {{name}} is still hyping THEM. Their relationship does not get to swallow their whole identity.' },
      ],
    },
    {
      id: 'q2',
      prompt: '{{name}}’s friend gets something {{name}} really wanted too. Be honest, it stings. What does {{name}} do?',
      choices: [
        { id: 'a', label: '{{name}} congratulates them and lets themself be jealous later. Their win is not something they did to {{name}}.' },
        { id: 'b', label: 'Oh, they’re celebrating. {{name}}’s jealousy can sit in the car. 😂' },
        { id: 'c', label: '{{name}} needs details. How did it happen? What did they do differently? What can {{name}} learn?' },
        { id: 'd', label: '{{name}} is making their win feel HUGE. {{name}} knows what it took for them to get there.' },
        { id: 'e', label: '{{name}} is probably going to admit it: “I’m happy for you and a little sick for me.” 😂 Then {{name}} is still showing up.' },
      ],
    },
    {
      id: 'q3',
      prompt: '{{name}}’s friend sends them two thirst traps and says, “Which one should I post? My ex just hard-launched somebody.” What does {{name}} do?',
      choices: [
        { id: 'a', label: 'The hotter one. If they’re being petty, {{name}} thinks they should at least be excellent at it.' },
        { id: 'b', label: 'Neither. If the whole point is making the ex react, {{name}} thinks the ex already has way too much power.' },
        { id: 'c', label: 'Wait. Their ex hard-launched WHO? {{name}} needs the post.' },
        { id: 'd', label: 'Whichever one makes their friend feel hottest. If the ex sees it, cute. They’re not the audience.' },
        { id: 'e', label: 'Pick one if you want, post it, then {{name}} is taking the phone. They are not refreshing views all night.' },
      ],
    },
    {
      id: 'q4',
      prompt: '{{name}}’s friend accidentally sends a screenshot ABOUT somebody TO the exact person it was about. What does {{name}} do?',
      choices: [
        { id: 'a', label: '{{name}} needs to see exactly what was sent and whether they opened it. Details matter.' },
        { id: 'b', label: '{{name}} is completely useless for the first 30 seconds because {{name}} is laughing too hard.' },
        { id: 'c', label: 'If the screenshot was cruel, {{name}} is saying that. The problem isn’t only that they got caught.' },
        { id: 'd', label: 'Okay. What fixes this fastest? Call? Apology? Own it? {{name}} is helping handle the damage.' },
        { id: 'e', label: 'They did something dumb. They did not commit a federal crime. {{name}} tells them to own it, fix what they can, and please stop planning their move to another state. 😂' },
      ],
    },
    {
      id: 'q5',
      prompt: 'At a party, one of {{name}}’s closest friends is very obviously being iced out by people they both know.',
      choices: [
        { id: 'a', label: 'If that’s {{name}}’s person, then {{name}} guesses they’re both iced out. {{name}} is not leaving them standing there alone.' },
        { id: 'b', label: '{{name}} is saying something. “Are we going to talk about the problem or keep doing this weird middle-school silent treatment all night?”' },
        { id: 'c', label: '{{name}} already knows why this is happening. This beef started before tonight.' },
        { id: 'd', label: 'Oh, {{name}} and their friend are about to have the BEST time in the room. Dancing. Pictures. People around them. If they wanted their friend to look bothered, unfortunate. 😂' },
        { id: 'e', label: '{{name}} is in their friend’s ear like, “Head up. Do NOT start shrinking because they’re acting weird.” Then they’re walking right back in.' },
      ],
    },
    {
      id: 'q6',
      prompt: '{{name}}’s friend tells them they’re thinking about moving across the country for somebody they’ve been dating for four months.',
      choices: [
        { id: 'a', label: 'If they’re really going, {{name}} is helping them make an actual plan. Job, money, housing, and a way home if this thing crashes and burns.' },
        { id: 'b', label: 'Do it. Seriously. {{name}} thinks worst case, they come home with character development and an insane story. 😂' },
        { id: 'c', label: 'Give {{name}} their full name and the city. {{name}} just wants to look at a few things. 👀' },
        { id: 'd', label: 'Four months?! {{name}} is telling them to be serious. They are changing ZIP codes for somebody they haven’t even seen through all four seasons.' },
        { id: 'e', label: '{{name}} asks one thing: “If that person disappeared tomorrow, would you still want that life?” If yes, {{name}} is all for it.' },
      ],
    },
    {
      id: 'q7',
      prompt: '{{name}} is furious with somebody they love, and {{name}} has a legitimate reason. What does {{name}} actually do first?',
      choices: [
        { id: 'a', label: 'They’re talking about it. {{name}} cannot walk around doing fake-normal while everybody knows something is wrong.' },
        { id: 'b', label: '{{name}} leaves it alone until {{name}} cools down. Angry-{{name}} has excellent vocabulary and terrible judgment.' },
        { id: 'c', label: '{{name}} is mad as hell, but if they call {{name}} with a real emergency tonight, {{name}} is still answering. Unfortunately, that’s their person.' },
        { id: 'd', label: '{{name}} is calling the ONE person who already knows the entire backstory and presenting their case.' },
        { id: 'e', label: 'Sometimes {{name}} gets quiet on purpose. Part of {{name}} wants them to feel the distance before {{name}} explains it.' },
      ],
    },
    {
      id: 'q8',
      prompt: 'A friend tells {{name}} a secret that completely changes how {{name}} sees something they did.',
      choices: [
        { id: 'a', label: '{{name}} needs more context now. What else doesn’t {{name}} know?' },
        { id: 'b', label: 'If this changes {{name}}’s opinion of what they did, {{name}} is telling them. {{name}} is not giving them the reaction they came hoping to get.' },
        { id: 'c', label: 'Whatever {{name}} thinks about it, it stays with {{name}}. They told {{name}}, not the group chat.' },
        { id: 'd', label: 'There is a very high chance {{name}} makes one wildly inappropriate joke because this conversation desperately needs oxygen.' },
        { id: 'e', label: '{{name}} may look at them differently for a minute, but {{name}} is not letting them turn one confession into “I’m a terrible person forever.” Own it. Fix what you can. Keep moving.' },
      ],
    },
    {
      id: 'q9',
      prompt: 'It’s 9:07 PM. {{name}} is home. The group chat suddenly says: “We need you. Come out.”',
      choices: [
        { id: 'a', label: 'If somebody actually needs {{name}}, {{name}} is coming. If this is FOMO bait, goodnight.' },
        { id: 'b', label: 'Where are they going? {{name}} can be dressed in 12 minutes.' },
        { id: 'c', label: 'Who said “we need you” and WHY? {{name}} thinks that wording is suspicious.' },
        { id: 'd', label: 'If “we need you” means somebody wants {{name}} to pick a side before {{name}} knows what happened, absolutely not. Give {{name}} the story first.' },
        { id: 'e', label: 'Fine. But if {{name}} is coming, they are not sitting around miserable. {{name}} is turning this night around.' },
      ],
    },
    {
      id: 'q10',
      prompt: 'Which sentence has somebody who loves {{name}} probably said to {{name}} with a completely straight face?',
      choices: [
        { id: 'a', label: '“You are not everybody’s emergency contact.”' },
        { id: 'b', label: '“This was supposed to be ONE drink.”' },
        { id: 'c', label: '“I didn’t ask if it was true. I asked you not to SAY it.”' },
        { id: 'd', label: '“Why do you have screenshots from February?”' },
        { id: 'e', label: '“I just wanted to complain. I did not ask for a motivational speech.”' },
      ],
    },
  ],
};

export const BE_SO_SERIOUS_FRIEND_ADAPTATION: FriendQuizAdaptation = {
  questions: [
    {
      id: 'q1',
      prompt: 'Someone {{name}} is close to cancels on {{name}} at the last minute. Again. What is {{name}} actually doing?',
      choices: [
        { id: 'a', label: '{{name}} asks what’s going on. Twice feels like a pattern, but {{name}} wants the story before {{name}} decides what it means.' },
        { id: 'b', label: '{{name}} says “It’s fine.” It is not fine. And {{name}} will remember this the next time they ask {{name}} for something. 😂' },
        { id: 'c', label: '{{name}} stops making plans around them. {{name}} is not arguing about it. {{name}} is just adjusting their access to {{name}}’s time.' },
        { id: 'd', label: '{{name}} tells them exactly why {{name}} is annoyed. If they keep wasting {{name}}’s time, {{name}} is going to say they keep wasting {{name}}’s time.' },
        { id: 'e', label: '{{name}} immediately starts thinking about how to prevent this from happening again. Earlier confirmations, firmer plans, something.' },
      ],
    },
    {
      id: 'q2',
      prompt: 'Someone tells {{name}}: “What you did really hurt my feelings.” What happens FIRST?',
      choices: [
        { id: 'a', label: '“Okay. Tell me what part hurt you.”' },
        { id: 'b', label: '“That is absolutely not what I meant.”' },
        { id: 'c', label: '“Interesting, because you had no problem hurting MY feelings.”' },
        { id: 'd', label: '“What did I even say that was so bad?”' },
        { id: 'e', label: '{{name}} immediately feels defensive, but {{name}} knows enough not to let the first reaction drive the whole conversation.' },
      ],
    },
    {
      id: 'q3',
      prompt: 'Someone {{name}} loves tells {{name}} NO about something {{name}} really wants. {{name}} thinks their reason is weak. What now?',
      choices: [
        { id: 'a', label: '{{name}} asks once whether there’s room to reconsider. If the answer is still no, {{name}} leaves it alone.' },
        { id: 'b', label: '{{name}} keeps explaining because {{name}} genuinely thinks they’d agree if they understood the whole thing.' },
        { id: 'c', label: 'Fine. {{name}} stops asking. But {{name}} is probably noticeably colder afterward.' },
        { id: 'd', label: '{{name}} says okay, then goes and figures out another way to get what {{name}} wanted without involving them. 😂' },
        { id: 'e', label: '{{name}} brings up all the times {{name}} said yes when THEY wanted something because suddenly reciprocity matters very much.' },
      ],
    },
    {
      id: 'q4',
      prompt: '{{name}} gave someone advice. They ignored it. Now the exact thing {{name}} warned them about has happened. What does {{name}} do?',
      choices: [
        { id: 'a', label: '{{name}} helps if they need {{name}}. They already know. {{name}} doesn’t need to rub their face in it.' },
        { id: 'b', label: '{{name}} helps, but first {{name}} needs one tiny moment to say, “Now... what did I tell you?” 😂' },
        { id: 'c', label: '{{name}} is honestly annoyed. If they ignored everything {{name}} said, why is {{name}} now being recruited to clean it up?' },
        { id: 'd', label: '{{name}} is way too pleased that {{name}} was right. {{name}} may try to hide it. {{name}} may fail.' },
        { id: 'e', label: 'Depends how bad the situation is. If this is serious, {{name}} handles it first. The lecture can wait.' },
      ],
    },
    {
      id: 'q5',
      prompt: '{{name}}’s partner or person has been repeatedly liking somebody’s very obvious thirst traps. {{name}} notices. What is {{name}} doing?',
      choices: [
        { id: 'a', label: '{{name}} brings it up directly. “I know it may seem small to you, but it’s bothering me.”' },
        { id: 'b', label: '{{name}} does not bring it up immediately. First {{name}} needs to know who this person is, how long they’ve followed each other, and whether {{name}} should already know this name. 👀' },
        { id: 'c', label: '{{name}} starts moving different. Less affectionate. Less available. If they’re paying attention, they’ll notice.' },
        { id: 'd', label: 'Oh, {{name}} can like pictures too. Everybody can be supportive on Instagram. 😂' },
        { id: 'e', label: '{{name}} tells them to stop. {{name}} is not interested in pretending {{name}} is okay with something just because somebody else would be.' },
      ],
    },
    {
      id: 'q6',
      prompt: '{{name}} is arguing with someone and halfway through {{name}} realizes something awful: they might actually be right. 😭 Now what?',
      choices: [
        { id: 'a', label: '{{name}} says it. “Okay. You’re right about that part.” Painful. Horrible. Character-building.' },
        { id: 'b', label: '{{name}} stops fighting that specific point, but {{name}} is absolutely not helping them turn one win into “therefore I was right about everything.”' },
        { id: 'c', label: '{{name}} starts explaining WHY {{name}} did it because context still matters even if {{name}} was wrong.' },
        { id: 'd', label: 'If they’re being smug about it, {{name}}’s ability to admit anything drops dramatically. 😂' },
        { id: 'e', label: '{{name}} probably keeps arguing a little longer, then comes back later after {{name}}’s pride finishes dying.' },
      ],
    },
    {
      id: 'q7',
      prompt: '{{name}} is mad. They ask: “Are you okay?” What do they get?',
      choices: [
        { id: 'a', label: '“No. I’m mad about what happened earlier. Can we talk?”' },
        { id: 'b', label: '“I’m fine.” {{name}} is visibly not fine. Nobody believes {{name}}. 😂' },
        { id: 'c', label: '“I don’t want to talk yet. Give me a little time.” And {{name}} actually plans to come back to it.' },
        { id: 'd', label: '{{name}} tells them exactly why {{name}} is mad immediately, and depending on how mad {{name}} is, the delivery may be... energetic.' },
        { id: 'e', label: 'Sometimes {{name}} wants them to figure it out. They were THERE.' },
      ],
    },
    {
      id: 'q8',
      prompt: 'Someone tells {{name}}: “You always have to have things your way.” What is {{name}}’s immediate reaction?',
      choices: [
        { id: 'a', label: '“Do I?” {{name}} may hate hearing it, but if {{name}} trusts them, {{name}} is thinking about it.' },
        { id: 'b', label: '“No. I just get tired of everything becoming harder because nobody listens until it goes wrong.”' },
        { id: 'c', label: '“Okay. Give me actual examples.”' },
        { id: 'd', label: '“Funny how nobody complains about my way when my way works.” 😂' },
        { id: 'e', label: '{{name}} starts listing every time {{name}} compromised because apparently the historical record needs correcting.' },
      ],
    },
    {
      id: 'q9',
      prompt: '{{name}} does something {{name}} has absolutely criticized somebody else for doing before. And they catch {{name}}. What happens?',
      choices: [
        { id: 'a', label: '“Yep. That’s hypocritical. You got me.” {{name}} hates this conversation. 😂' },
        { id: 'b', label: 'Okay, yes, but the situations really are different, and {{name}} is going to explain exactly how.' },
        { id: 'c', label: '{{name}} admits it, but if they start acting like this erases everything THEY did, now there’s another problem.' },
        { id: 'd', label: '{{name}} gets defensive first. Later, after the irritation wears off, {{name}} usually knows whether they were right.' },
        { id: 'e', label: '{{name}} makes a joke because being publicly caught in {{name}}’s own hypocrisy is apparently their personal hell.' },
      ],
    },
    {
      id: 'q10',
      prompt: 'Which sentence has somebody who loves {{name}} probably wanted to say at least once?',
      choices: [
        { id: 'a', label: '“You do not have to manage everything.”' },
        { id: 'b', label: '“If you’re mad, just SAY you’re mad.”' },
        { id: 'c', label: '“Being right did not require all of that.” 😂' },
        { id: 'd', label: '“Stop telling me what I did every time I’m trying to talk about what YOU did.”' },
        { id: 'e', label: '“Not every disagreement needs a winner.”' },
      ],
    },
  ],
};

export const FRIEND_ADAPTATIONS: Record<string, FriendQuizAdaptation> = {
  'keep-you-around': KEEP_YOU_AROUND_FRIEND_ADAPTATION,
  'be-so-serious': BE_SO_SERIOUS_FRIEND_ADAPTATION,
};
