// V1 release execution (2026-11-06), item 4: writes the single, authoritative, machine-
// readable V1 content specification for all 62 approved Dailies -- docs/generated/
// DAILY_V1_CONTENT_SPECIFICATION.json. This supersedes docs/DAILY_MASTER_CONSOLIDATED_REVIEW.md
// as what any generator or validator should actually read for resolved scoring: the master
// document remains the human-readable source of prompts/answers/reveals and the historical
// audit record of original approvals, but its own compiled scoring is stale wherever a later
// Reassessment Round or Audit Round correction applies (see scripts/lib/daily-content-spec.ts
// for the full precedence and why). This file is generated, never hand-edited -- re-run it
// after either source document changes:
//
//   npx tsx scripts/generate-daily-content-specification.ts

declare const require: (id: string) => { writeFileSync: (p: string, c: string) => void; mkdirSync: (p: string, o: unknown) => void };
declare const __dirname: string;
const { writeFileSync, mkdirSync } = require('fs');
const { join } = require('path') as unknown as { join: (...parts: string[]) => string };

import { buildAuthoritativeDailySpec } from './lib/daily-content-spec';

const spec = buildAuthoritativeDailySpec();

const outDir = join(__dirname, '../docs/generated');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, 'DAILY_V1_CONTENT_SPECIFICATION.json');
writeFileSync(
  outPath,
  JSON.stringify(
    {
      generatedBy: 'scripts/generate-daily-content-specification.ts',
      generatedNote: 'Authoritative. Supersedes docs/DAILY_MASTER_CONSOLIDATED_REVIEW.md\'s own compiled scoring wherever a later Reassessment Round or Audit Round correction applies -- see scripts/lib/daily-content-spec.ts for precedence. Regenerate, never hand-edit.',
      questionCount: spec.length,
      questions: spec,
    },
    null,
    2,
  ) + '\n',
);

const totalChoices = spec.reduce((sum, q) => sum + q.choices.length, 0);
const noneCount = spec.reduce((sum, q) => sum + q.choices.filter((c) => c.isNone).length, 0);
console.log(`Wrote ${spec.length} questions / ${totalChoices} choices (${noneCount} intentional NONE) to ${outPath}`);
