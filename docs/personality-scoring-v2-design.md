# Personality Scoring V2 — Design & Decision Record

Status: implemented as a **parallel system**, not yet wired into any live screen or write path.
Nothing in this document has been applied to the production database. See "Rollout" below for
exactly what that means and what remains to be explicitly approved.

## 1. Why this is a parallel system, not an in-place rewrite

The current engine (`src/data/personality.ts`, `src/data/quiz-personality-awards.ts`) is a
**signed, dimension-keyed, opposite-pole-resolving** model: every answer contributes a signed
value (`-3..3`) to one of 32 *dimensions*; `resolveActiveBoardPole`/`resolveWithinQuizQualification`
pick ONE winning pole per dimension by comparing the two poles' raw totals. This is fundamentally
incompatible with the requested V2 model — independent, positive-only evidence per **pole** (64 of
them, not 32 dimensions), where both poles of a dimension can accumulate evidence at once and
neither is ever subtracted from the other.

Reconciling that incompatibility by editing the existing engine in place would mean:

- Changing the meaning of the live `personality_evidence` table and its `effect` check constraint
  (`-2,-1,1,2`), which is read by the one real production account with meaningful history
  (`a857b23b-7dd8-4e55-91e4-8ae0a76742aa`, a857... "Michelle" — see
  `20261004121500_backfill_ranked_private_evidence_build11.sql`, which backfilled this exact table
  three weeks ago).
- Changing `scorePersonalityProfile`'s ranking algorithm, which is what `topTraits` (Your
  Signature) and `getCoreCreatureInputTraits` (the Creature) are built from — an in-place change
  would alter which traits are "top" for that account the next time they open the app, which is
  exactly the kind of Creature-identity disruption this task was told to avoid ("Existing weekly
  Creature transformations still functioning").
- Redefining `QuizChoice.traitSignals` (currently signed, already live on 7 premium quizzes) out
  from under the old engine it still feeds.

None of that is necessary. **Decision (recommend confirming before any cutover): V2 is built as a
fully independent module tree, reading and writing nothing the old engine depends on.** Old
behavior is 100% unchanged today. A future, separately-approved "cutover" work package decides
if/when/how a real call site starts reading V2 output instead of the old engine's — this document
and the adapter in `signature-adapter.ts` exist so that decision has a ready, tested bridge rather
than a fresh design exercise.

## 2. The 64 poles

`src/data/personality-v2/pole-ids.ts` derives all 64 pole ids mechanically from
`PERSONALITY_DIMENSIONS` (`${dimensionId}:positive` / `${dimensionId}:negative`) — never a
hand-authored second list, so it can never drift out of sync with `personality.ts`. 40 Core poles
(20 dimensions), 24 Private poles (12 dimensions).

## 3. Evidence model

One row = one (user, presented question, pole) observation:

```
PoleEvidenceRow {
  userId, sourceType ('daily_answer' | 'quiz_result'), sourceId,
  questionStableId, choiceStableId, poleId,
  pointsEarned (0-3), maxAvailable (0-3),
  scoringVersion, occurredAt
}
```

`buildPoleEvidenceForPresentedQuestion` (in `scoring-engine.ts`) builds one row for **every pole any
choice of the presented question could award**, not just the poles the chosen choice happened to
award — this is what makes "zero-earned opportunities" real and gives every pole a user-specific
denominator (`maxAvailable` is the single best choice's points for that pole, never summed across
mutually exclusive choices).

## 4. Ranking

`rankPoles` (in `scoring-engine.ts`):

1. Dedupe by `(questionStableId, poleId)`, keeping the **earliest** `occurredAt` row — the
   canonicalization policy for replays (see §6).
2. Sum `pointsEarned` and `maxAvailable` per pole across the deduped rows.
3. A pole is eligible once lifetime earned points reach 9. (A single question caps a pole's
   contribution at 3 points, so eligibility structurally requires at least 3 distinct questions —
   verified as its own test, not just an implication.)
4. Eligible poles are sorted by earned percentage (`lifetimeEarned / maxAvailableForUser`), ties
   broken by raw lifetime earned points, final ties broken by a fixed canonical pole order (never
   random, never insertion-order-dependent).

Verified against the brief's own example: a pole at 15/15 (100%) outranks one at 30/45 (66.7%)
despite the second having more raw points — see `scripts/validate-personality-v2-scoring.ts`.

## 5. Question identity and replay/duplicate handling

**Quizzes**: `questionStableId = "${quizId}:${question.id}"`. Quiz question ids are already
stable, authored strings in the static content files — no new concept needed. A quiz retake
reuses the same id; the dedupe-by-earliest-occurrence rule (§6) is what prevents that retake from
inflating anything.

**Daily**: the brief reports that the same real-world scenario sometimes exists under more than
one `daily_questions.id` (a re-authoring, not a retake). `computeDailyScenarioFingerprint` (in
`daily-scenario-fingerprint.ts`) derives `questionStableId` from a normalized, order-independent
fingerprint of the prompt + option label set — two database rows for the same scenario (reordered
options, trivial copy polish) fingerprint identically; a genuinely different scenario does not.
The real `daily_questions.id`/`daily_options.id` are preserved separately (as `source_question_db_id`
/ `source_choice_db_id` in the proposed schema, §8) purely for audit/reconstruction — they are
never the ranking identity.

## 6. Replay and correction policy (documented, not invented silently)

> "If an answer is legitimately corrected or changed, preserve the historical event and apply a
> documented, deterministic canonicalization policy." — brief §3

**Policy**: every submission writes a real, permanent row (nothing is ever deleted or overwritten).
For ranking purposes only, the **earliest** row for a given `(questionStableId, poleId)` pair is
the one that counts; every later row for the same pair is excluded from the ranking sum but still
exists in full for history/audit.

This exactly matches current product reality: Daily answers are immutable today (no edit feature
exists — `daily_answers` has no UPDATE/DELETE policy at all), and a quiz retake is a fresh
attempt, not a "correction" of a specific prior answer — there is no UX today that would ever
intentionally want a *later* row to supersede an earlier one for the same question. The proposed
schema (§8) adds a nullable `supersedes_source_id` column, unused by any current code path, as a
forward-compatible hook: if a "change my answer" feature is ever built, it can mark its new row as
explicitly superseding a prior one, and ranking can be changed to prefer the superseding row
instead of the earliest one for that specific chain — without a new migration.

## 7. Historical signed evidence — migration policy (documented, not invented silently)

> "Do not convert negative signed evidence into positive opposite-pole evidence without a
> documented and validated migration rule... Never silently discard prior evidence." — brief §3

**Policy**: **no conversion is performed.** The existing `personality_evidence` table (signed,
dimension-keyed) is left completely untouched — not read, not written, not migrated — by anything
in this pass. It continues to power the old engine's live ranking exactly as today. V2 evidence
accumulates independently in a new table (§8), starting from zero for every user, including the
one account with real history. This is the only policy that satisfies every constraint at once
(no destruction, no fabrication, no silent conversion, fully reversible) without inventing a
signed-to-positive conversion formula the brief explicitly says not to invent. A future cutover
decision may choose to leave this as permanent (two parallel histories, V2 simply starts later) or
commission a separate, explicitly-validated backfill — that choice is out of scope for this pass.

## 8. Proposed schema (additive — not yet applied to any database)

```sql
-- New, additive. Old personality_evidence table is untouched.
create table public.personality_pole_evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source_type text not null check (source_type in ('daily_answer', 'quiz_result')),
  source_id text not null,
  question_stable_id text not null,
  choice_stable_id text not null,
  source_question_db_id text,   -- audit only: real daily_questions.id when applicable
  source_choice_db_id text,     -- audit only: real daily_options.id when applicable
  pole_id text not null,        -- one of the 64 canonical pole ids
  points_earned smallint not null check (points_earned between 0 and 3),
  max_available smallint not null check (max_available between 0 and 3 and max_available >= points_earned),
  scoring_version text not null,
  supersedes_source_id text,    -- forward-compat hook, unused today (see doc section 6)
  created_at timestamptz not null default now(),
  constraint personality_pole_evidence_unique unique (user_id, source_type, source_id, pole_id)
);
-- RLS: select-own only, same shape as personality_evidence. No insert/update/delete policy for
-- `authenticated` -- written only by SECURITY DEFINER functions, exactly like today's table.

-- New, additive. Server-authoritative scoring data for quizzes (static app content, so there is
-- no other server-side source of truth for it) -- the RPC joins against this using the
-- (quiz_id, question_id, choice_id) triples already present in p_answers, instead of trusting
-- client-submitted point values at all.
create table public.quiz_choice_pole_awards (
  quiz_id text not null,
  question_id text not null,
  choice_id text not null,
  pole_id text not null,
  points smallint not null check (points between 1 and 3),
  scoring_version text not null,
  primary key (quiz_id, question_id, choice_id, pole_id)
);

-- Additive column on the existing daily_options table -- the OLD signed personality_effects
-- column is untouched; this is a new, parallel column for V2.
alter table public.daily_options
  add column pole_personality_effects jsonb not null default '[]'::jsonb;
```

## 9. Server-authoritative scoring (closing a real, pre-existing gap)

Today's `submit_quiz_result` RPC validates the SHAPE of client-submitted `p_profile_effects`
(known dimension, value in range, max 6 entries, no duplicate dimension) but never verifies the
VALUES actually correspond to the submitted quiz content — a client could submit arbitrary
`{dimension, value}` pairs with no connection to real answers. This is the exact "do not trust
arbitrary client-submitted personality points" gap the brief asked to find and close.

**V2 RPC design**: the client already sends `p_answers` (`{questionId: choiceId}`) on every
submission (used today only by Compare's exact-match count). The proposed `submit_quiz_result`
revision additionally joins `p_answers` against `quiz_choice_pole_awards` **server-side** and
computes/writes `personality_pole_evidence` rows itself — the client's submitted point values are
never consulted for V2 at all. This requires no client payload change (the data the server needs
is already being sent). The Daily side is already correctly server-authoritative today (the
trigger reads `daily_options.personality_effects` directly); extending it to also read the new
`pole_personality_effects` column and write `personality_pole_evidence` is the same pattern,
additive.

## 10. Access tier parity

Free quizzes may only award Core poles under V2 — mirroring the old engine's "Public/Free quizzes
do not generate Private/Relic personality awards" rule exactly. This was enforced during
calibration (see `src/data/quiz-pole-awards/`) and should be enforced again server-side in the
`quiz_choice_pole_awards` seed data (a free quiz's rows should simply never reference a Private
pole id) and, defensively, in the RPC itself.

## 11. Rollout — what is and isn't live

**Implemented, tested, not wired into any live path:**
- `src/data/personality-v2/*` (pole ids, scoring engine, Daily fingerprint, SignatureTrait bridge)
- `src/data/quiz-pole-awards/*` (per-quiz calibration, additive data files)
- Draft migration SQL (this doc; files staged, **not applied** to any database)

**Explicitly not touched:** `personality.ts`, `quiz-personality-awards.ts`, every file in
`src/data/quizzes/*.ts` (existing fields), the live `submit_quiz_result` RPC, the live
`daily_answers` trigger, `creature-identity.ts`, `creature-progression.ts`, and every screen that
reads `scorePersonalityProfile`/`topTraits` today.

**Open decision for the product owner**, flagged per the brief's own instruction to document
rather than invent: when (if ever) does a real call site start reading V2's ranking instead of the
old engine's, and does that happen all at once or behind a flag? This document's answer (§1, §7)
is the recommended default — a fully parallel accumulation with no automatic cutover — not a
decision made unilaterally on the team's behalf.
