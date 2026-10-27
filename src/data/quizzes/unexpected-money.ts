import type { ArchetypeQuizDefinition } from './types';

// Content-polish pass (post-launch content review). Deliberately distinct from Spending:
// Spending is everyday purchase habits, this is specifically what a sudden windfall reveals.
// Questions replaced with the new authored set; THE LEVEL-UP result rewritten to be about
// leverage/capability (course, equipment, seed money), NOT "a nicer version of a product" —
// that phrasing belongs to Spending, not here. Display positions rebalanced (perfect
// 2-per-letter-per-archetype across the 8 questions — verified programmatically).
export const UNEXPECTED_MONEY_QUIZ: ArchetypeQuizDefinition = {
  id: 'unexpected-money',
  scoringType: 'archetype',
  category: 'Money',
  access: 'free',
  title: 'Unexpected money just hit your account. Be honest.',
  eyebrow: 'PERSONALITY QUIZ',
  introSupport: ["Your bank account just got an unexpected visitor.","Let's see how long the money survives."],
  meta: '8 questions · About 2 min',
  introCta: "Follow the money →",
  introNote: 'This is entirely hypothetical. Unfortunately.',
  mixLabel: 'YOUR MONEY MOVE MIX',
  recentReadMetricLabel: 'of your money-move picks',
  archetypes: [
    {
      id: 'safety-net',
      title: 'THE SAFETY NET',
      heroRead: ["The money didn't feel real yet.", 'So you protected it like it was.'],
      body: "Sudden money doesn't read as fun money to you. It reads as proof you should keep preparing. You're not scared of enjoying things. You just trust future-you more than a single lucky moment. While everybody else is planning vacations, you're calculating how many months of bills you could cover if life decided to get disrespectful. Watching your savings grow gives you a kind of satisfaction that a shopping spree never could. You might celebrate by transferring the money to an account you don't even have a debit card for.",
      kicker: "Apparently, your emergency fund gets spoiled more than you do.",
      traits: ['Prepared', 'Grounded', 'Responsible'],
      profileSignals: [
        { dimension: 'planner_spontaneous', value: 2 },
        { dimension: 'patient_urgent', value: 1 },
      ],
    },
    {
      id: 'little-treat',
      title: 'THE LITTLE TREAT',
      heroRead: ['The money showed up.', 'So did the joy, immediately.'],
      body: "You don't need a five-year plan to know what makes you happy right now. Sudden money reveals what you actually want, not what you think you should want, and you go get it without the guilt tax. You've spent enough time being responsible, comparing prices, and talking yourself out of things that would genuinely make you smile. So when a little unexpected money appears, you see permission to enjoy being alive. You're not necessarily reckless. You just don't believe every blessing needs to become a spreadsheet before it can become a memory.",
      kicker: "Apparently, the universe said direct deposit and you heard dinner reservations.",
      traits: ['Present', 'Joyful', 'Spontaneous'],
      profileSignals: [
        { dimension: 'planner_spontaneous', value: -2 },
        { dimension: 'emotional_intensity', value: 1 },
      ],
    },
    {
      id: 'level-up',
      title: 'THE LEVEL-UP',
      heroRead: ["You don't just spend money.", 'You look for leverage.'],
      body: "A course. Better equipment. A certification. Seed money for an idea. Something that makes you more capable, more valuable, or more able to earn. When extra money appears, your brain naturally asks how it could turn into more options later. You're the person who gets a surprise $1,500 and somehow turns it into a conversation about starting a business. People might tell you to relax and enjoy your money, but building something that could change your future genuinely excites you. The dangerous part is that you've probably got twelve ideas already, and now eleven of them think they've been funded.",
      kicker: "Apparently, you can't even receive free money without giving it a business plan.",
      traits: ['Ambitious', 'Resourceful', 'Growth-minded'],
      profileSignals: [
        { dimension: 'ambitious_content', value: 2 },
        { dimension: 'practical_idealistic', value: 1 },
        { dimension: 'planner_spontaneous', value: 1 },
      ],
    },
    {
      id: 'master-plan',
      title: 'THE MASTER PLAN',
      heroRead: ["Free money isn't free money to you.", "It's momentum."],
      body: "You don't see a windfall, you see a multiplier. Where it goes depends on what moves you forward fastest, and you already had that answer before the money even cleared. You've got goals with deadlines, numbers attached to them, and probably a mental ranking of which one deserves the money first. You can enjoy a little unexpected cash, but you're not about to let a temporary impulse derail something you've been building for months. Somebody could hand you a thousand dollars at your birthday party, and before the cake is cut, that money has already been assigned a department.",
      kicker: "Apparently, even your surprise money has a scheduled performance review.",
      traits: ['Strategic', 'Ambitious', 'Decisive'],
      profileSignals: [
        { dimension: 'ambitious_content', value: 2 },
        { dimension: 'curious_decisive', value: -1 },
      ],
    },
  ],
  questions: [
    {
      id: 'q1',
      prompt: "You check your account and there's an extra $1,500. The deposit is legitimate. What's happening in the next five minutes?",
      choices: [
        { id: 'a', label: "I'm transferring it before my checking account gets any ideas.", resultWeights: { "safety-net": 1 } },
        { id: 'b', label: "I'm reopening the tabs I've been pretending I don't have saved.", resultWeights: { "little-treat": 1 } },
        { id: 'c', label: "I'm revisiting that idea I said I'd start when I had extra money.", resultWeights: { "level-up": 1 } },
        { id: 'd', label: "I'm checking which goal just got an unexpected promotion.", resultWeights: { "master-plan": 1 } },
      ],
    },
    {
      id: 'q2',
      prompt: "Your best friend finds out about the money and says, 'We're going OUT tonight!' What's your response?",
      choices: [
        { id: 'a', label: "'Dinner's cute, but hear me out. I've got this idea...'", resultWeights: { "level-up": 1 } },
        { id: 'b', label: "'I'm down. I already set aside a little celebration money.'", resultWeights: { "master-plan": 1 } },
        { id: 'c', label: "'Going out is fine. Going broke celebrating money is crazy.'", resultWeights: { "safety-net": 1 } },
        { id: 'd', label: "'I've been waiting for somebody to say that. What time?'", resultWeights: { "little-treat": 1 } },
      ],
    },
    {
      id: 'q3',
      prompt: "An expensive thing you've wanted for MONTHS suddenly goes on sale. Today only. The surprise money covers it.",
      choices: [
        { id: 'a', label: "That checkout confirmation is about to be my new wallpaper.", resultWeights: { "little-treat": 1 } },
        { id: 'b', label: "I ask whether buying it would actually help me do something bigger.", resultWeights: { "level-up": 1 } },
        { id: 'c', label: "I check whether it fits my priorities. A discount doesn't outrank the plan.", resultWeights: { "master-plan": 1 } },
        { id: 'd', label: "I close the tab. A sale doesn't mean I suddenly need it.", resultWeights: { "safety-net": 1 } },
      ],
    },
    {
      id: 'q4',
      prompt: "Somebody asks to borrow $400 because they heard you came into money. Now what?",
      choices: [
        { id: 'a', label: "'What do you need it for, and when can you pay it back?'", resultWeights: { "master-plan": 1 } },
        { id: 'b', label: "'I care about you, but that money already has a safe place.'", resultWeights: { "safety-net": 1 } },
        { id: 'c', label: "I might help, but I'm not letting their emergency ruin my good mood.", resultWeights: { "little-treat": 1 } },
        { id: 'd', label: "I'd rather help them figure out a way to stop needing $400 next month.", resultWeights: { "level-up": 1 } },
      ],
    },
    {
      id: 'q5',
      prompt: "You get a notification: 'Your cart is waiting.' And unfortunately, it really is. What happens?",
      choices: [
        { id: 'a', label: "I delete half of it and replace it with something that'll actually help me grow.", resultWeights: { "level-up": 1 } },
        { id: 'b', label: "I check the list I made before the money arrived. If it's not there, it's not happening.", resultWeights: { "master-plan": 1 } },
        { id: 'c', label: "That cart has been waiting three months. It can develop patience.", resultWeights: { "safety-net": 1 } },
        { id: 'd', label: "The cart and I have been through a lot. It's time for closure.", resultWeights: { "little-treat": 1 } },
      ],
    },
    {
      id: 'q6',
      prompt: "A month later, your bank sends you a spending summary. Which headline is most likely?",
      choices: [
        { id: 'a', label: "'Unusual activity detected: customer appears to be enjoying life.'", resultWeights: { "little-treat": 1 } },
        { id: 'b', label: "'Multiple purchases classified as investments in future potential.'", resultWeights: { "level-up": 1 } },
        { id: 'c', label: "'Every transaction appears to have been authorized by a five-year plan.'", resultWeights: { "master-plan": 1 } },
        { id: 'd', label: "'Customer continues to behave like the economy might collapse Thursday.'", resultWeights: { "safety-net": 1 } },
      ],
    },
    {
      id: 'q7',
      prompt: "Someone says, 'Money can't buy happiness.' You have $1,500 worth of opinions.",
      choices: [
        { id: 'a', label: "'Maybe not, but it can buy me some peace of mind.'", resultWeights: { "safety-net": 1 } },
        { id: 'b', label: "'It can absolutely buy me a plane ticket. Let's not get philosophical.'", resultWeights: { "little-treat": 1 } },
        { id: 'c', label: "'It can buy opportunities. That's close enough for me.'", resultWeights: { "level-up": 1 } },
        { id: 'd', label: "'It can buy freedom if you stop spending it like it grows back overnight.'", resultWeights: { "master-plan": 1 } },
      ],
    },
    {
      id: 'q8',
      prompt: "Six months later, somebody asks what happened to your surprise money. What's the most satisfying answer?",
      choices: [
        { id: 'a', label: "'That little deposit helped me hit a goal six months early.'", resultWeights: { "master-plan": 1 } },
        { id: 'b', label: "'Most of it's still there. And I sleep beautifully.'", resultWeights: { "safety-net": 1 } },
        { id: 'c', label: "'You should've seen that weekend. No further questions.'", resultWeights: { "little-treat": 1 } },
        { id: 'd', label: "'It paid for something that's opening doors for me now.'", resultWeights: { "level-up": 1 } },
      ],
    },
  ],
};
