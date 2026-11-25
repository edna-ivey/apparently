// Ad-hoc scan (not a validator) to find the longest approved question prompts and answer
// choice labels across every registered quiz, for layout QA against real copy rather than
// guessed/sample text. Run with: npx tsx scripts/find-longest-quiz-text.ts
import { QUIZ_REGISTRY } from '@/data/quizzes';

type PromptHit = { quizId: string; questionId: string; len: number; text: string };
type ChoiceHit = PromptHit & { choiceId: string };

const prompts: PromptHit[] = [];
const choices: ChoiceHit[] = [];

for (const [quizId, def] of Object.entries(QUIZ_REGISTRY)) {
  for (const q of def.questions) {
    prompts.push({ quizId, questionId: q.id, len: q.prompt.length, text: q.prompt });
    for (const c of q.choices) {
      choices.push({ quizId, questionId: q.id, choiceId: c.id, len: c.label.length, text: c.label });
    }
  }
}

prompts.sort((a, b) => b.len - a.len);
choices.sort((a, b) => b.len - a.len);

console.log('=== TOP 10 LONGEST QUESTION PROMPTS ===');
for (const p of prompts.slice(0, 10)) {
  console.log(`[${p.len}] ${p.quizId} / ${p.questionId}: ${JSON.stringify(p.text)}`);
}

console.log('\n=== TOP 10 LONGEST ANSWER CHOICES ===');
for (const c of choices.slice(0, 10)) {
  console.log(`[${c.len}] ${c.quizId} / ${c.questionId} / ${c.choiceId}: ${JSON.stringify(c.text)}`);
}

console.log(`\nTotal quizzes scanned: ${Object.keys(QUIZ_REGISTRY).length}`);
console.log(`Total questions scanned: ${prompts.length}`);
console.log(`Total choices scanned: ${choices.length}`);
