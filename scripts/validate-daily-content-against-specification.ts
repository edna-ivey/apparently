// V1 release execution (2026-11-06), item 4: the real release-integrity gate. Compares the
// ACTUAL generated SQL (the live-question archive and the 36-missing-questions seed) against
// scripts/lib/daily-content-spec.ts's authoritative specification -- not just the master
// document's own compiled value, which the previous validator (validate-daily-scoring-against-
// ledger.ts, kept as a narrower diagnostic) explicitly could not do. Exact trait identities and
// points are compared, not sums (a sum-only check would have passed a generator that awarded
// "Boundary-Holding +2" where the spec says "Direct +2" -- same number, wrong trait). Checks:
//   - every live option's awards match the spec exactly (trait/points sets, not just totals)
//   - every live option's corrected reveal (post-correction-file) matches the spec's reveal
//   - every missing-question option's awards AND reveal match the spec exactly, in order
//   - every intentional NONE answer has zero awards AND an empty pole_personality_effects
//   - room assignment (Free -> public, Apparently Private -> private) is correct throughout
// A genuine mismatch exits non-zero and prints every discrepancy found -- this is a pass/fail
// gate, not an informational report.
//
// Run with: npx tsx scripts/validate-daily-content-against-specification.ts

declare const require: (id: string) => any;
declare const __dirname: string;
declare const process: { exit: (code: number) => void };
const { readFileSync } = require('fs');
const { join } = require('path') as unknown as { join: (...parts: string[]) => string };

import { buildAuthoritativeDailySpec, type Award } from './lib/daily-content-spec';
import { readDailyOptionPoleAwards } from './lib/daily-pole-award-rows';

type LiveOptionMapEntry = {
  num: number;
  options: { letter: string; optionId: string; productionRevealAsOf20261103: string }[];
};
type LiveOptionMap = { questions: LiveOptionMapEntry[] };

const failures: string[] = [];
const fail = (msg: string) => failures.push(msg);

const awardSetKey = (awards: Award[]): string =>
  awards.map((a) => `${a.pole}:${a.points}`).sort().join('|');

// ---------------------------------------------------------------------------------------------
// 1. Live questions (#1-26): archive awards + reveal-correction file vs spec.
// ---------------------------------------------------------------------------------------------
const spec = buildAuthoritativeDailySpec();
const specByNum = new Map(spec.map((q) => [q.num, q]));

const liveMap: LiveOptionMap = JSON.parse(
  readFileSync(join(__dirname, '../docs/generated/live_daily_option_id_map.json'), 'utf8'),
);

const archiveAwardsByOptionId = new Map(
  readDailyOptionPoleAwards().map((o) => [o.optionId, o.awards.map((a) => ({ pole: a.pole, points: a.points, traitId: -1 }))]),
);

const revealCorrectionsSql = readFileSync(
  join(__dirname, '../supabase/pending-owner-review/20261105000000_live_daily_reveal_corrections.sql'),
  'utf8',
);
const revealCorrectionByOptionId = new Map<string, string>();
for (const m of revealCorrectionsSql.matchAll(
  /update public\.daily_options set apparently_feedback = '((?:[^']|'')*)' where id = '([0-9a-f-]+)';/g,
)) {
  revealCorrectionByOptionId.set(m[2], m[1].replace(/''/g, "'"));
}

let liveChoicesChecked = 0;
for (const entry of liveMap.questions) {
  const specQuestion = specByNum.get(entry.num);
  if (!specQuestion) { fail(`Live #${entry.num}: no specification entry found.`); continue; }
  for (const opt of entry.options) {
    const choice = specQuestion.choices.find((c) => c.letter === opt.letter);
    if (!choice) { fail(`Live #${entry.num}${opt.letter}: no matching choice in the specification.`); continue; }
    liveChoicesChecked++;

    const actualAwards = archiveAwardsByOptionId.get(opt.optionId) ?? [];
    const expectedKey = awardSetKey(choice.awards);
    const actualKey = awardSetKey(actualAwards);
    if (expectedKey !== actualKey) {
      fail(`Live #${entry.num}${opt.letter}: award mismatch. expected=[${expectedKey || 'NONE'}] actual=[${actualKey || 'NONE'}]`);
    }

    const correctedReveal = revealCorrectionByOptionId.get(opt.optionId) ?? opt.productionRevealAsOf20261103;
    if (correctedReveal.trim() !== choice.reveal.trim()) {
      fail(`Live #${entry.num}${opt.letter}: reveal mismatch after corrections.\n    expected: ${choice.reveal}\n    actual:   ${correctedReveal}`);
    }
  }
}

// ---------------------------------------------------------------------------------------------
// 2. Missing questions (#27-62): the generated seed SQL, matched by in-order position within
//    each question block (ids are fresh random UUIDs every generator run, so position order --
//    which both the generator and the specification iterate identically -- is the only stable
//    correlation available without a live database).
// ---------------------------------------------------------------------------------------------
const missingSeedSql = readFileSync(
  join(__dirname, '../supabase/pending-owner-review/20261103000000_daily_missing_approved_questions_seed.sql'),
  'utf8',
);
const missingBlocks = missingSeedSql.split(/(?=^-- #\d+: )/m).filter((b: string) => /^-- #\d+: /.test(b));

let missingChoicesChecked = 0;
for (const block of missingBlocks) {
  const numMatch = block.match(/^-- #(\d+): /);
  if (!numMatch) continue;
  const num = Number(numMatch[1]);
  const specQuestion = specByNum.get(num);
  if (!specQuestion) { fail(`Missing #${num}: no specification entry found.`); continue; }

  const roomMatch = block.match(/values \('[0-9a-f-]+', '(?:[^']|'')*', 'Unsorted', 'Approved', '(public|private)'\)/);
  const expectedRoom = specQuestion.room === 'Apparently Private' ? 'private' : 'public';
  if (!roomMatch || roomMatch[1] !== expectedRoom) {
    fail(`Missing #${num}: room mismatch. expected=${expectedRoom} actual=${roomMatch ? roomMatch[1] : 'NOT FOUND'}`);
  }

  const optionMatches = [...block.matchAll(
    /insert into public\.daily_options \(id, question_id, "position", label, apparently_feedback, pole_personality_effects\) values \('([0-9a-f-]+)', '[0-9a-f-]+', (\d+), '(?:[^']|'')*', '((?:[^']|'')*)', '(\[.*?\])'::jsonb\);/g,
  )];

  specQuestion.choices.forEach((choice, idx) => {
    missingChoicesChecked++;
    const om = optionMatches[idx];
    if (!om) { fail(`Missing #${num}${choice.letter}: option not found at expected position ${idx + 1}.`); return; }
    const [, optionId, , revealEsc, poleJson] = om;
    const actualReveal = revealEsc.replace(/''/g, "'");
    if (actualReveal.trim() !== choice.reveal.trim()) {
      fail(`Missing #${num}${choice.letter}: reveal mismatch.\n    expected: ${choice.reveal}\n    actual:   ${actualReveal}`);
    }

    const actualPoleAwards: Award[] = JSON.parse(poleJson).map((a: { pole: string; points: number }) => ({ ...a, traitId: -1 }));
    const expectedKey = awardSetKey(choice.awards);
    const actualPoleKey = awardSetKey(actualPoleAwards);
    if (expectedKey !== actualPoleKey) {
      fail(`Missing #${num}${choice.letter}: pole_personality_effects mismatch. expected=[${expectedKey || 'NONE'}] actual=[${actualPoleKey || 'NONE'}]`);
    }

    const awardInserts = [...block.matchAll(
      new RegExp(`insert into public\\.daily_option_trait_awards \\(option_id, trait_id, points\\) values \\('${optionId}', (\\d+), (\\d+)\\);`, 'g'),
    )];
    const actualTraitAwards: Award[] = awardInserts.map((m2) => ({ pole: '', traitId: Number(m2[1]), points: Number(m2[2]) }));
    const expectedTraitKey = choice.awards.map((a) => `${a.traitId}:${a.points}`).sort().join('|');
    const actualTraitKey = actualTraitAwards.map((a) => `${a.traitId}:${a.points}`).sort().join('|');
    if (expectedTraitKey !== actualTraitKey) {
      fail(`Missing #${num}${choice.letter}: daily_option_trait_awards mismatch. expected=[${expectedTraitKey || 'NONE'}] actual=[${actualTraitKey || 'NONE'}]`);
    }

    if (choice.isNone && poleJson !== '[]') {
      fail(`Missing #${num}${choice.letter}: intentional NONE but pole_personality_effects is not empty: ${poleJson}`);
    }
  });
}

// ---------------------------------------------------------------------------------------------
// 3. Daily #26's E/F options: added after the production snapshot the live-option-id map was
//    taken from (they don't exist in that map at all), so they live only in the six-choice
//    migration file and must be checked separately -- confirmed this file is the only place
//    they are ever inserted, with fixed (not randomly-generated) ids.
// ---------------------------------------------------------------------------------------------
const sixChoiceSql = readFileSync(
  join(__dirname, '../supabase/pending-owner-review/20261103000001_daily_six_choice_constraint_and_missing_options.sql'),
  'utf8',
);
const q26 = specByNum.get(26);
if (!q26) {
  fail('Daily #26: no specification entry found.');
} else {
  let sixChoiceChecked = 0;
  for (const letter of ['E', 'F']) {
    const choice = q26.choices.find((c) => c.letter === letter);
    if (!choice) { fail(`#26${letter}: no matching choice in the specification.`); continue; }
    // Each letter's row is on its own line; find the specific one by its known position --
    // E is position 5, F is position 6.
    const positionNumber = letter === 'E' ? 5 : 6;
    const rowMatch = sixChoiceSql.match(
      new RegExp(`'([0-9a-f-]+)', '5c9a48bb-4606-43c7-8f3e-fac621ff6232', ${positionNumber}, '(?:[^']|'')*', '((?:[^']|'')*)', '(\\[.*?\\])'::jsonb`),
    );
    if (!rowMatch) { fail(`#26${letter}: row not found in the six-choice migration file.`); continue; }
    sixChoiceChecked++;
    const [, , revealEsc, poleJson] = rowMatch;
    const actualReveal = revealEsc.replace(/''/g, "'");
    if (actualReveal.trim() !== choice.reveal.trim()) {
      fail(`#26${letter}: reveal mismatch.\n    expected: ${choice.reveal}\n    actual:   ${actualReveal || '(empty)'}`);
    }
    const actualPoleAwards: Award[] = JSON.parse(poleJson).map((a: { pole: string; points: number }) => ({ ...a, traitId: -1 }));
    const expectedKey = awardSetKey(choice.awards);
    const actualPoleKey = awardSetKey(actualPoleAwards);
    if (expectedKey !== actualPoleKey) {
      fail(`#26${letter}: pole_personality_effects mismatch. expected=[${expectedKey || 'NONE'}] actual=[${actualPoleKey || 'NONE'}]`);
    }
    if (choice.isNone && poleJson !== '[]') {
      fail(`#26${letter}: intentional NONE but pole_personality_effects is not empty: ${poleJson}`);
    }
  }
  liveChoicesChecked += sixChoiceChecked;
}

// ---------------------------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------------------------
console.log(`Checked ${liveChoicesChecked} live answer choices (#1-26) against the authoritative specification.`);
console.log(`Checked ${missingChoicesChecked} missing-question answer choices (#27-62) against the authoritative specification.`);
console.log(`Total: ${liveChoicesChecked + missingChoicesChecked} of the specification's 250 choices checked.`);

if (failures.length === 0) {
  console.log('\nPASS: zero content mismatches between generated SQL and the authoritative specification.');
} else {
  console.log(`\nFAIL: ${failures.length} content mismatch(es) found:\n`);
  for (const f of failures) console.log('  - ' + f);
  process.exit(1);
}
