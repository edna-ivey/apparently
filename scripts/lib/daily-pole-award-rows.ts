// Parses the approved Daily V2 pole-award calibration directly from the already-reviewed,
// staged migration (supabase/migrations/20261021160000_daily_live_content_pole_awards.sql) --
// unlike the quiz calibration, this one is hand-authored directly against real production
// option ids (see that migration's own header comment), not generated from a separate TS
// source file, so this IS the one canonical source for it.

declare const require: (id: string) => { readFileSync: (p: string, e: string) => string };
declare const __dirname: string;
const { readFileSync } = require('fs');
const { join } = require('path') as unknown as { join: (...parts: string[]) => string };

export type DailyPoleAward = { pole: string; points: number };
export type DailyOptionAwards = { optionId: string; awards: DailyPoleAward[] };

// Archived (never applied, superseded by the numeric design) -- see
// supabase/migrations_archive/README.md.
const MIGRATION_PATH = join(__dirname, '../../supabase/migrations_archive/20261021160000_daily_live_content_pole_awards.sql');

export const readDailyOptionPoleAwards = (): DailyOptionAwards[] => {
  const content = readFileSync(MIGRATION_PATH, 'utf8');
  const matches = content.matchAll(/update public\.daily_options set pole_personality_effects = '(\[.*?\])'::jsonb where id = '([0-9a-f-]+)';/g);
  const result: DailyOptionAwards[] = [];
  for (const match of matches) {
    const [, jsonText, optionId] = match;
    const parsed = JSON.parse(jsonText) as { pole: string; points: number }[];
    result.push({ optionId, awards: parsed.map((a) => ({ pole: a.pole, points: a.points })) });
  }
  if (result.length === 0) {
    throw new Error(`No Daily option awards parsed from ${MIGRATION_PATH} -- refusing to proceed empty.`);
  }
  return result;
};
