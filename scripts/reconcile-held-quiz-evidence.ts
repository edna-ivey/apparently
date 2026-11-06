// Build 22 owner audit (2026-10-31), item 4 (second round) + item 2 (third round): "Protect
// held Private quizzes" / "Enforce live approved trait mappings inside the held-quiz
// reconciliation."
//
// All 7 paid Private quizzes ('career-ambition-how-bad', 'career-ambition-proving',
// 'hidden-you-wrong', 'life-match-dream-life', 'love-soulmates-ready',
// 'private-private-trouble', 'style-vibe-intimidating') have contributesToProfile: true in
// their content definitions, but their editorial review is still in progress -- the numeric
// trait-award mappings for these quizzes are DELIBERATELY WITHHELD from
// scripts/lib/quiz-pole-award-rows.ts's APPROVED_NON_PRIVATE_QUIZ_IDS scope, so
// generate-quiz-content-identity-sql.ts already correctly writes ZERO quiz_choice_trait_awards
// rows for them. A tester who completes a held quiz still correctly earns zero evidence (never
// fabricated), but user_quiz_completions/user_quiz_answers ARE written and PERMANENT -- their
// one-time first-completion slot is used up with nothing to show for it if the mapping is
// later approved, unless something retroactively reconciles their first-completion answers.
// This script is that explicit, controlled, idempotent reconciliation path.
//
// CORRECTED (owner audit, 2026-10-31, third round, item 2 -- found before this ever shipped):
// the first version of this script took a `<live-approved-awards.json>` export and BAKED ITS
// POINTS VALUES DIRECTLY into the generated INSERT, trusting the export completely. The owner
// independently supplied a forged export containing a mapping absent from the real database,
// and the generated SQL wrote that fabricated evidence anyway -- "the script cannot claim
// database-authoritative scoring while trusting a separate exported file without
// verification." FIXED: the generated SQL no longer uses ANY award values from the export for
// the actual write. It:
//   1. VALIDATES, inside its own transaction, that the exported award set EXACTLY matches the
//      LIVE quiz_choice_trait_awards rows for this quiz_key, read fresh at execution time --
//      zero missing, zero extra/forged, zero mismatched points. Any discrepancy ABORTS the
//      whole transaction (fail closed) before a single evidence row is written.
//   2. Computes points_earned/max_available by joining the LIVE user_quiz_answers directly
//      against the LIVE quiz_choice_trait_awards table -- the exact same aggregation
//      submit_quiz_completion's own per-question loop uses -- so even if the export happened
//      to validate, the WRITE never trusts it either. The export's role is now purely an
//      explicit, reviewable declaration of intent that must match reality, never the source
//      of what gets written.
//   3. Reads created_at/user_id/trait scope from the LIVE user_quiz_answers row too (not the
//      export's answeredAt), preserving original evidence timestamps robustly against a
//      forged export on that axis as well.
//
// "Only their FIRST original answers may receive approved evidence. Retakes never earn
// additional evidence": structurally guaranteed -- user_quiz_answers' own table comment
// (20261028040000) states it is "written ONLY alongside the user_quiz_completions row that
// first earned it ... A retake never writes here." Every row this script touches is therefore
// ALREADY, by construction, a first-completion answer.
//
// Idempotent: INSERT ... ON CONFLICT DO UPDATE on user_trait_evidence's own (source_answer_id,
// trait_id) unique constraint. Core/Private distinction is unaffected (driven entirely by
// trait_id, untouched here). Transactional: validation and the write happen in the SAME
// transaction -- a validation failure rolls back everything, nothing partial is ever left.
//
// THIS SCRIPT NEVER CONNECTS TO ANY DATABASE ITSELF -- same contract as every other backfill
// script in this engagement. user_trait_totals/user_trait_active_totals are deliberately NOT
// rebuilt here -- run scripts/rebuild-user-trait-totals.ts afterward.
//
// Run with: npx tsx scripts/reconcile-held-quiz-evidence.ts <quiz-key> <existing-first-completion-answers.json> <live-approved-awards.json> <output-sql-path>
//   existing-first-completion-answers.json: { rows: [{ userId, questionKey, choiceKey }] }
//     -- an export identifying WHICH existing user_quiz_answers rows to reconcile (scoping
//     the blast radius to exactly what was reviewed before running this). answeredAt/points
//     are NEVER read from this file -- the generated SQL re-reads both live, from the real
//     user_quiz_answers/quiz_choice_trait_awards rows, at execution time.
//   live-approved-awards.json: { rows: [{ questionKey, choiceKey, traitId, points }] }
//     -- a declared snapshot of this quiz's REAL, ALREADY-APPLIED quiz_choice_trait_awards
//     rows, taken from the live database after the owner's own separate approval migration.
//     The generated SQL VALIDATES this against the live table at execution time and ABORTS on
//     any mismatch -- it is never trusted as the source of what gets written.

declare const require: (id: string) => { readFileSync: (p: string, e: string) => string; writeFileSync: (p: string, c: string) => void };
declare const process: { argv: string[]; exit: (code: number) => void };
const { readFileSync, writeFileSync } = require('fs');

type ExistingAnswerRow = { userId: string; questionKey: string; choiceKey: string };
type DeclaredAwardRow = { questionKey: string; choiceKey: string; traitId: number; points: number };

const readJsonRows = <T>(path: string): T[] => {
  const raw = readFileSync(path, 'utf8');
  const parsed = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1));
  return parsed.rows as T[];
};

const [, , quizKey, answersPath, awardsPath, outputSqlPath] = process.argv;
if (!quizKey || !answersPath || !awardsPath || !outputSqlPath) {
  console.error('Usage: npx tsx scripts/reconcile-held-quiz-evidence.ts <quiz-key> <existing-first-completion-answers.json> <live-approved-awards.json> <output-sql-path>');
  process.exit(1);
}

const existingAnswers = readJsonRows<ExistingAnswerRow>(answersPath);
const declaredAwards = readJsonRows<DeclaredAwardRow>(awardsPath);

if (existingAnswers.length === 0) {
  console.error('Zero existing-answer rows supplied -- nothing to reconcile. Refusing to generate a no-op SQL file.');
  process.exit(1);
}
if (declaredAwards.length === 0) {
  console.error(
    `Zero declared award rows supplied for quiz_key '${quizKey}'. This script reconciles evidence AFTER a held quiz's mapping is approved and actually applied to the live database -- it never invents mappings itself. Export the real, already-applied quiz_choice_trait_awards rows for this quiz and pass them as <live-approved-awards.json> first.`,
  );
  process.exit(1);
}

const escapeLiteral = (value: string): string => value.replace(/'/g, "''");

const answerValuesSql = existingAnswers
  .map((a) => `('${escapeLiteral(a.userId)}', '${escapeLiteral(a.questionKey)}', '${escapeLiteral(a.choiceKey)}')`)
  .join(',\n    ');

const declaredAwardValuesSql = declaredAwards
  .map((a) => `('${escapeLiteral(a.questionKey)}', '${escapeLiteral(a.choiceKey)}', ${a.traitId}, ${a.points})`)
  .join(',\n    ');

const nowComment = new Date().toISOString();

const sql = `-- ============================================================================================
-- STAGED, NOT APPLIED. Generated by scripts/reconcile-held-quiz-evidence.ts on ${nowComment}.
-- PREREQUISITE: this quiz's REAL quiz_choice_trait_awards rows must already be applied to the
-- live database via their own separately reviewed migration.
--
-- FAIL CLOSED (owner audit, 2026-10-31, item 2): this transaction VALIDATES the declared
-- award export against the LIVE quiz_choice_trait_awards table for quiz_key = '${escapeLiteral(quizKey)}'
-- before writing anything -- any missing, extra/forged, or mismatched-points row aborts the
-- entire transaction. The actual evidence write below NEVER uses the declared export's point
-- values either way -- it joins LIVE user_quiz_answers directly against the LIVE
-- quiz_choice_trait_awards table, the same computation submit_quiz_completion's own per-
-- question loop already uses. Declared rows: ${declaredAwards.length}. Existing-answer rows to
-- reconcile: ${existingAnswers.length}.
--
-- Idempotent: ON CONFLICT (source_answer_id, trait_id) DO UPDATE. Does NOT rebuild
-- user_trait_totals/user_trait_active_totals -- run scripts/rebuild-user-trait-totals.ts
-- afterward.
-- ============================================================================================

begin;

create temporary table tmp_declared_awards (question_key text, choice_key text, trait_id smallint, points smallint) on commit drop;
insert into tmp_declared_awards (question_key, choice_key, trait_id, points) values
    ${declaredAwardValuesSql};

create temporary table tmp_live_awards (question_key text, choice_key text, trait_id smallint, points smallint) on commit drop;
insert into tmp_live_awards (question_key, choice_key, trait_id, points)
select qq.question_key, qc.choice_key, a.trait_id, a.points
from public.quiz_choice_trait_awards a
join public.quiz_choices qc on qc.choice_id = a.choice_id
join public.quiz_questions qq on qq.question_id = qc.question_id
join public.quizzes qz on qz.quiz_id = qq.quiz_id
where qz.quiz_key = '${escapeLiteral(quizKey)}';

-- FAIL CLOSED: the declared export must match the live table EXACTLY -- no missing row, no
-- extra/forged row, no mismatched points. Raising here rolls back the whole transaction,
-- including the temp tables -- nothing is written.
do $fail_closed$
declare
  v_extra_or_mismatched integer;
  v_missing integer;
begin
  select count(*) into v_extra_or_mismatched from (
    select * from tmp_declared_awards
    except
    select * from tmp_live_awards
  ) extra_rows;
  if v_extra_or_mismatched > 0 then
    raise exception 'Reconciliation ABORTED for quiz_key ''${escapeLiteral(quizKey)}'': % declared award row(s) do not match the LIVE quiz_choice_trait_awards table exactly (extra, forged, or mismatched points). Never trusting an unverified mapping -- re-export live-approved-awards.json from the current live table.', v_extra_or_mismatched;
  end if;

  select count(*) into v_missing from (
    select * from tmp_live_awards
    except
    select * from tmp_declared_awards
  ) missing_rows;
  if v_missing > 0 then
    raise exception 'Reconciliation ABORTED for quiz_key ''${escapeLiteral(quizKey)}'': % LIVE award row(s) are missing from the declared export (incomplete export). Regenerate live-approved-awards.json from the current live table before reconciling.', v_missing;
  end if;
end;
$fail_closed$;

-- Validation passed: the declared export is PROVEN identical to the live table. The write
-- below still never reads from either temp table -- it computes everything fresh from the
-- LIVE user_quiz_answers + LIVE quiz_choice_trait_awards, exactly like submit_quiz_completion.
create temporary table tmp_target_answers (answer_id uuid, question_id integer, choice_id integer) on commit drop;
insert into tmp_target_answers (answer_id, question_id, choice_id)
select uqa.id, uqa.question_id, uqa.choice_id
from (values
    ${answerValuesSql}
) as v(user_id, question_key, choice_key)
join public.quizzes qz on qz.quiz_key = '${escapeLiteral(quizKey)}'
join public.quiz_questions qq on qq.quiz_id = qz.quiz_id and qq.question_key = v.question_key
join public.quiz_choices qc on qc.question_id = qq.question_id and qc.choice_key = v.choice_key
join public.user_quiz_answers uqa on uqa.user_id = v.user_id::uuid and uqa.question_id = qq.question_id and uqa.choice_id = qc.choice_id;

insert into public.user_trait_evidence (user_id, source_type, source_answer_id, trait_id, points_earned, max_available, created_at, last_corrected_at)
select
  uqa.user_id, 'quiz_answer', ta.answer_id, awards.trait_id,
  coalesce(max(awards.points) filter (where qc2.choice_id = ta.choice_id), 0),
  max(awards.points),
  uqa.answered_at,
  now()
from tmp_target_answers ta
join public.user_quiz_answers uqa on uqa.id = ta.answer_id
join public.quiz_choice_trait_awards awards on true
join public.quiz_choices qc2 on qc2.choice_id = awards.choice_id and qc2.question_id = ta.question_id
group by uqa.user_id, ta.answer_id, awards.trait_id, uqa.answered_at
on conflict (source_answer_id, trait_id) do update set
  points_earned = excluded.points_earned,
  max_available = excluded.max_available,
  last_corrected_at = excluded.last_corrected_at;

commit;
`;

writeFileSync(outputSqlPath, sql);
console.log(`SQL written to ${outputSqlPath} (NOT executed). Validates against the live quiz_choice_trait_awards table at execution time -- fails closed on any discrepancy. Run scripts/rebuild-user-trait-totals.ts afterward.`);
