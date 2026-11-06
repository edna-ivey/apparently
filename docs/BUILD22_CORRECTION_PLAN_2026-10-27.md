# Build 22 correction plan — owner review required

Status: **PROPOSAL ONLY. Nothing in this document has been applied.** No migration has been
run, no historical evidence has been rewritten, no Creature logic has been modified, and
nothing has been committed, pushed, or built. Every number below comes from read-only queries
against the linked Supabase project and read-only re-derivations using the existing, unmodified
scoring code. Two scratch files back the findings:
`supabase/migrations/20261026170000_reconcile_quiz_choice_pole_awards.sql` (already committed,
regenerated this pass and confirmed byte-identical — zero drift) and a one-off dry-run
simulation script (not part of the app, not committed) used only to print comparisons to the
terminal.

This plan also folds in the Friday-only Creature evolution requirement given mid-review. That
request and the Build 21 database correction are one workstream, not two: the evolution
cadence sits on top of whatever trait ranking the V1/V2 merge produces, so it inherits every
data-quality problem found below unless the reconciliation lands first.

---

## 1. Live mappings vs. the staged reconciliation migration

**What was checked:** every `(quiz_id, question_id, choice_id, pole_id)` row currently live in
`public.quiz_choice_pole_awards` for the 12 **approved, owner-locked free quizzes**, compared
against the same rows the staged migration would write, regenerated fresh from
`src/data/quiz-pole-awards/*.ts` this pass (output unchanged from the committed file — the
generator is not drifting).

| | count |
|---|---|
| Live rows (12 free quizzes only) | 495 |
| Staged rows (12 free quizzes only) | 1,198 |
| Added (new key, not live today) | 814 |
| Removed (live today, absent from staged) | 111 |
| Changed (`points` differs, same key) | 170 |
| Unchanged | 214 |

Per-quiz breakdown:

| quiz_id | live | staged | added | removed | changed | unchanged |
|---|---:|---:|---:|---:|---:|---:|
| crisis | 53 | 139 | 86 | 0 | 27 | 26 |
| dating | 44 | 129 | 87 | 2 | 17 | 25 |
| era | 43 | 131 | 108 | 20 | 17 | 6 |
| food-order | 34 | 70 | 39 | 3 | 15 | 16 |
| friendship | 31 | 104 | 76 | 3 | 19 | 9 |
| group-chat | 30 | 102 | 75 | 3 | 18 | 9 |
| ick | 32 | 108 | 83 | 7 | 13 | 12 |
| kid-you | 33 | 100 | 67 | 0 | 13 | 20 |
| one-bite | 45 | 91 | 46 | 0 | 6 | 39 |
| petty | 49 | 69 | 31 | 11 | 3 | 35 |
| spending | 48 | 62 | 50 | 36 | 8 | 4 |
| unexpected-money | 53 | 93 | 66 | 26 | 14 | 13 |

**Finding, re-scoped:** this is not a small drift correction. Only 214/495 live rows (43%) are
byte-identical to what the approved client source now specifies. The live table — the Oct 19
seed the prior forensic audit already flagged as stale — covers only 41% of the mappings the
current, approved free-quiz source code defines. The majority of the staged migration's effect
on free quizzes is **filling in mappings that were simply never seeded**, not correcting wrong
ones. That changes the risk framing: applying it is closer to "complete an incomplete original
seed" than "patch a few stale rows," which is lower-risk in one sense (no previously-*working*
mapping regresses to a different pole) but means far more of a user's historical V2 evidence
would newly become possible than a casual read of "reconciliation" suggests. The 111 "removed"
and 170 "changed" rows are the ones that actually alter a mapping a past answer could have hit
(see §5 for how the reconciliation strategy accounts for all three categories separately).

**Does the migration, as currently staged, apply only approved scoring? No.** The single staged
file bundles three sources together:

- **1,198 rows** — the 12 approved free quizzes (checked above).
- **468 rows** — the 9 Apparently Private quizzes whose Core-trait mappings are **explicitly not
  yet owner-approved** per your own earlier instruction ("we still need to review and approve
  their answer-level Core trait mappings"). This includes the known `style-vibe-intimidating`
  Q7 bug (§7).
- **28 rows** — `whats-your-type`, already shipped and separate from this question.

Applying the file as it stands today would push unapproved Private-quiz calibration to
production in the same transaction as the approved free-quiz correction. **Recommendation:**
split the generator/migration into two artifacts — `reconcile_quiz_choice_pole_awards_free.sql`
(the 1,198 approved rows, safe once approved) and
`reconcile_quiz_choice_pole_awards_private.sql` (the 468 Private rows, held until you approve
each Private quiz's mapping review). Only the free-only file is a GO candidate for Build 22.

---

## 2. Why V2 was designed to fill only empty V1 dimensions

Quoting the exact, already-approved design intent from `src/data/personality-v2/activation.ts`
(comment above `mergeCoreTraitsWithV2Gaps`, written at the time V2's activation seam was
approved):

> "V2 is only ever used to fill a dimension the OLD engine (personality.ts) has LITERALLY ZERO
> evidence for. A dimension V1 already has any real evidence for (even a single answer, even if
> not yet "qualified") keeps its V1-derived value completely unchanged — V2 never overrides,
> re-ranks, or contradicts a single existing evidence-backed result. This is what "preserve
> historical evidence" means in practice: no existing user's already-earned
> Creature/Signature/Relic identity can regress or change shape because V2 shipped."

This matches `docs/personality-scoring-v2-design.md` §1/§11's "parallel accumulation" default,
and the stated goal was explicitly **zero regression risk** for existing users at V2 launch
time — not "V1 and V2 compete for best evidence." It does what it was designed to do.

**Does that design still match what you now want?** Not entirely, on your own re-reading. The
design optimized for "no existing Creature can ever change," which is a stronger guarantee than
"no existing Creature can ever get *worse*." The side effect you're flagging — a user who has
since built up far stronger, well-qualified V2 evidence on a dimension V1 already thinly covers
gets **no benefit from that new evidence at all**, forever, for that dimension — was accepted as
the cost of the zero-regression guarantee, but nothing in the design doc weighs that tradeoff
explicitly against "the Creature should be able to evolve." Section 3/4 below show this
concretely and propose the architecture change needed to support evolution without reopening
the regression risk the original rule was built to close.

---

## 3–4. Simulation: V1-priority merge vs. a V2-aware alternative, and new-answer impact

Dry-run only — used the real `scorePersonalityProfile`, `rankPoles`,
`buildPoleEvidenceForPresentedQuestion`, `mergeCoreTraitsWithV2Gaps`, `toSignatureTraits`, and
`buildCreatureIdentity` functions, unmodified, against a synthetic in-memory profile. No
database writes, no file changes to any production module.

**Setup:** a synthetic existing user has thin V1 evidence (2 answers each, from free quizzes
answered before V2 shipped) on 5 Core dimensions — just enough to qualify and fill all 5
Creature slots under today's rules. They then answer 6 new quiz questions that produce strong,
repeated, fully-qualified V2 evidence on two poles: `social_attunement:positive` (a dimension V1
has zero evidence for) and `forgiving_receipts:negative` (a dimension V1 already covers, but
only thinly, and — critically — V1's thin evidence currently resolves to the *opposite* pole,
`forgiving_receipts:positive` / "harmonious").

| | eyes | earsHorns | wings | body | tail |
|---|---|---|---|---|---|
| (0) Baseline, before the 6 new answers | grounded | bold | strong | **harmonious** | curious |
| (A) Current production logic, after the 6 new answers | grounded | bold | strong | **harmonious** | curious |
| (B) Hypothetical V2-can-override-weak-V1, after the same 6 answers | grounded | bold | strong | **strong** | curious |

Row (A) is byte-identical to row (0): six new, strong, consistent quiz answers produce **zero**
visible Creature change under today's logic, because `forgiving_receipts` already has any V1
evidence at all and V1-priority gap-fill never revisits a dimension once V1 has touched it. This
is the forensic audit's finding, now reproduced concretely rather than asserted.

Row (B) is an illustrative alternative only — not wired into any production file — that lets V2
replace a V1 trait for the *same* Creature slot when V2's distinct-qualifying-evidence count
strictly exceeds V1's for that dimension. Under it, the `body` slot flips from `harmonious` to
`strong`, reflecting the user's actual recent behavior rather than two old answers. This is the
shape of change needed to make the Creature "able to evolve when new personality evidence makes
different traits stronger," per your clarification — but see §9 below: a raw "whoever has more
evidence wins, recomputed live" rule is also exactly what produces *flapping* once combined with
a weekly reveal cadence, which is why the Friday-evolution design proposes a threshold + 
hysteresis gate rather than a plain override.

Ranked V2 output for reference (`ELIGIBILITY_THRESHOLD=9`):

```
rank 1: social_attunement:positive  earned=9/9  earnedPercent=1.00  evidenceCount=3  (Core, new dimension for this user)
rank 2: forgiving_receipts:negative earned=9/9  earnedPercent=1.00  evidenceCount=3  (Core, same dimension V1 already covers)
```

---

## 5. Historical-evidence reconciliation strategy (proposal, not applied)

Goals, in your own words: idempotent, preserves original answers, preserves user progress,
audit trail, backup, rollback, validation.

**5.1 Scope split (from §1).** Two migrations, not one:
- `..._reconcile_quiz_choice_pole_awards_free.sql` — the 1,198 approved rows. GO candidate.
- `..._reconcile_quiz_choice_pole_awards_private.sql` — the 468 Private rows. Held pending your
  per-quiz Core-mapping approval; not part of Build 22 unless you explicitly clear it.

**5.2 What this migration touches and doesn't.** `quiz_choice_pole_awards` is a **calibration
table** (quiz_id/question_id/choice_id/pole_id → points), not an evidence table. It defines what
a choice is *worth*; it is read at submission time by `submit_quiz_pole_evidence` to decide how
many points to award. It contains zero rows tied to any individual user. Correcting it:
- Never touches `personality_evidence` (V1) — untouched by design, as today.
- Never touches `personality_pole_evidence` (V2) — any row **already written** for a past
  submission keeps the points it was awarded *at the time of that submission*, per the existing,
  approved no-retroactive-recalculation policy (`docs/personality-scoring-v2-design.md` §7).
  Correcting the calibration table only changes what *future* submissions of the same quiz earn.
- Never touches `daily_answers`, `quiz_results`, or any raw stored answer — "preserves original
  answers" is automatic here because the raw answer tables are never in this migration's blast
  radius; only the lookup table consulted at award time changes.

This means the actual risk to existing users from the free-only migration is *lower* than
"reconciling 1,198 rows" sounds: it cannot retroactively change what any past answer already
earned, only what the *same quiz, answered again, or freshly* earns from now on. The one
category worth flagging for explicit sign-off is the 170 "changed" + 111 "removed" rows (§1) —
those are the cases where a choice's point value is corrected, not merely added; if a user
retakes one of those 12 quizzes after this ships, their new V2 evidence rows for that
quiz/question/choice will use the corrected value, which is the intended fix, but is worth a
one-line acknowledgment since it is the one place behavior for a *repeat* taker changes.

**5.3 Idempotency.** Already satisfied by the migration's own `DELETE FROM ... WHERE quiz_id =
$1` followed by `INSERT ...` per quiz_id (not `ON CONFLICT DO NOTHING`, which is what made the
original seed unable to ever fix itself). Running the free-only file twice produces the same
end state both times — confirmed by inspecting the generator's emitted SQL pattern.

**5.4 Backup.** Before applying either migration: `supabase db dump --linked --data-only -t
quiz_choice_pole_awards > backups/quiz_choice_pole_awards_pre_build22_<date>.sql`. This is a
29-row-wide, <1000-row table; a full data dump is cheap and gives an exact restore point.

**5.5 Rollback.** Two layers:
- Immediate: restore the pre-migration dump above (`psql ... < backups/....sql` against the
  linked project, after truncating the table) — restores exact prior state including the stale
  rows, in case the correction itself needs to be undone.
- Structural: because the migration is DELETE+INSERT per `quiz_id`, a partial failure mid-run
  (e.g. one quiz's INSERT fails) only affects that one quiz_id's rows; wrap the whole migration
  in a single transaction (it already is, implicitly, as one migration file) so Postgres rolls
  back atomically on any error rather than leaving some quizzes reconciled and others not.

**5.6 Audit trail.** The `scoring_version` column already present on every row (`'v2.0'`) gives
a cheap discriminator, but it is the same value before and after this change, so it doesn't by
itself distinguish pre/post-Build-22 rows. Recommend adding a one-off `migration_batch`
annotation — either a dedicated small `quiz_choice_pole_awards_migration_log` table (quiz_id,
rows_deleted, rows_inserted, applied_at, migration_file) populated by the migration itself, or
simply relying on the committed migration file + its applied timestamp in
`supabase_migrations.schema_migrations` as the audit record, since the file's row-level content
is already a complete, versioned specification of exactly what changed. The dedicated log table
is the stronger "audit trail" and is a ~15-line addition if you want it for Build 22.

**5.7 Validation (pre- and post-apply).**
- Pre-apply: re-run the generator (`npx tsx scripts/generate-quiz-pole-award-reconciliation-sql.ts`)
  and diff its output against the committed migration file — must be byte-identical (already
  confirmed this pass) before applying, so the migration can never silently drift from the
  approved client source between review and apply.
- Post-apply: re-run the same live-vs-source diff query from §1 — expect 0 added / 0 removed /
  0 changed / 1,198 unchanged for the free-only migration. Any non-zero count after apply means
  the migration did not fully take and must block Build 22 until resolved.
- Smoke test: for 2–3 real quiz_ids, pull one live `quiz_results` row predating the migration
  and confirm its already-recorded V2 evidence points are untouched (proves no retroactive
  rewrite occurred).

---

## 6. Which Build 21 artifact reached TestFlight

This could not be determined with available tooling, and I'm not going to guess. `eas-cli` in
this environment has no submission-listing command (confirmed via `eas build:view --help` and
`eas --help` — `eas submit` is a one-way upload command with no corresponding "what did I
submit" query). I also deliberately did not attempt to read `~/.expo/state.json` (the Expo CLI's
stored auth token) to reverse-engineer Expo's undocumented GraphQL submission history — that
would be using a credential outside its intended use to route around a missing CLI feature, and
the risk (potential credential exposure) isn't worth it for a question App Store Connect answers
directly. **The authoritative source is App Store Connect → TestFlight → Build 21's build
details**, which only you can access.

What I *can* confirm from the repo without that lookup: there are two candidate commits for
"Build 21" (`8b8fb75` and `6bf6346`), and `git diff --stat 8b8fb75 6bf6346` shows only three
files differ between them: `app.json`, `eas.json`, and `ads-config.ts`. No notification-related
file differs between the two commits, so **notification configuration is identical in both
candidates** regardless of which one is live. AdMob configuration **does** differ: `6bf6346`
contains the fix that switches to Google's official AdMob test ad unit IDs; `8b8fb75` does not.
If TestFlight is showing real (non-test) ad behavior or ad-related crashes, checking which
build number is actually listed in App Store Connect against these two commits' `buildNumber`
values in `app.json` will tell you definitively which artifact is live — I just can't query that
listing myself.

---

## 7. Private quiz Q7 mapping inconsistency (`style-vibe-intimidating`)

Reported separately, as requested — **no change proposed or made.** This quiz's own stated
scoring principle is "don't award points for how *other people* react to the user's choice,
only for what the choice itself reveals about the user." Q7's four choices apply that principle
inconsistently: Q7a and Q7c follow it (points reflect the user's own stated behavior only);
Q7b and Q7d violate it (their point award is keyed to the *other person's reaction* described in
the choice text, not the user's own action). This is a content-authoring inconsistency within
the Private quiz, independent of the live-vs-staged database diff in §1 — it exists in the
*source* mapping file itself, so fixing it is a content edit to `src/data/quiz-pole-awards/`
followed by its own regeneration pass, not a database-only fix. Flagged for your review; left
exactly as-is.

---

## 8. Friday-only Creature evolution — proposed architecture

This section addresses the mid-review requirement: personality scoring stays continuous:
the *visible* Creature updates only once per weekly cycle, with an evidence threshold and
anti-flapping rule, without permanently blocking stronger V2 evidence the way the current
gap-fill-only rule does.

### 8.1 What has to be added (nothing existing is removed)

Today, every layer (`scorePersonalityProfile`, V2 `rankPoles`, `mergeCoreTraitsWithV2Gaps`,
`buildCreatureIdentity`) is a **pure, on-the-fly recomputation** — there is no stored "current
Creature." The You/Creature screen just recomputes the full chain on every render from
whatever evidence exists *right now*. That's exactly why nothing currently enforces a weekly
cadence: there's no persisted state to hold a cadence against.

New pieces required:

1. **`creature_published_recipes` table** (new, additive — no existing table altered):
   `user_id, cycle_week (ISO week, e.g. '2026-W44'), slot, trait_dimension_id, trait_pole_sign,
   evidence_count_at_publish, published_at, superseded_by_cycle_week (nullable)`. One row set per
   user per cycle in which anything actually changed; unchanged slots simply aren't rewritten
   (carry-forward is implicit — "current recipe" = latest row per slot across all cycles).
   This *is* the audit trail for Creature changes, independent of the evidence audit trail
   already preserved in `personality_evidence`/`personality_pole_evidence`.

2. **Weekly evaluation job** (Friday, server-side — a Supabase scheduled function or equivalent,
   not client-triggered): for every user with any new eligible evidence since their last
   evaluation, compute the current candidate trait list (today's `mergeCoreTraitsWithV2Gaps`
   output, or its successor per §8.2) and compare each of the 5 Creature slots' candidate
   against that slot's currently-published trait using the threshold + anti-flapping rule in
   §8.3. Writes a new `creature_published_recipes` row only for slots that pass the rule.

3. **Per-user pending-reveal marker**: `creature_recipe_reveals(user_id, cycle_week,
   revealed_at)`. The You/Creature screen reads the latest *published* recipe (never the live
   candidate) and shows a reveal the first time a user opens the app after a new cycle_week's
   publish; `revealed_at` is set then, so a user who misses several Fridays in a row and opens
   the app on the following Tuesday sees exactly one reveal (the latest published recipe), never
   a backlog of per-week reveals, and reopening the app afterward shows no reveal at all — just
   the now-current recipe.

4. **Screen change**: `buildFirstFormIdentity`/`buildCreatureIdentity` gain a second call shape
   that takes the *published* recipe directly (trait dimension + pole per slot) instead of a
   live `PersonalityProfile`, for the user-facing Creature render. The existing profile-driven
   call stays available for any debug/preview surface that wants to show the "if evaluated right
   now" candidate — useful for your own QA, never shown to end users as the live Creature.

### 8.2 V1/V2 merge change this requires

The current `mergeCoreTraitsWithV2Gaps` gap-fill-only rule (§2) cannot produce evolution at all
— it permanently locks a slot to V1 the moment V1 has any evidence. Supporting "stronger V2
trait should eventually be able to win" requires the override-capable merge sketched in §3/§4's
row (B): V2 may replace a V1-derived trait for a dimension **only when V2's qualifying evidence
for that dimension exceeds the currently-published trait's evidence by the margin in §8.3** — not
a blind "most evidence wins" (that reopens the exact regression risk the original gap-fill rule
was built to prevent, just recomputed weekly instead of live). Concretely: the *candidate*
computation feeding the weekly job changes from "V1-priority, gap-fill only" to
"strength-aware, override-with-margin" — but the **gate that decides whether that candidate
actually gets published** is the new weekly job + anti-flap rule in §8.3, not the merge function
itself. This is the one change to `activation.ts` this plan proposes; it's a logic change, so it
needs your explicit approval and a new validation pass (not something to ship silently).

### 8.3 Evidence threshold and anti-flapping rule (recommendation)

Using the actual stats `rankPoles`/`PoleStats` already compute (`earnedPercent`,
`distinctQuestionsWithEarnedPoints`, `eligible`):

- **Qualification gate** (unchanged): a candidate must already be `eligible` (V2) or
  `activeBoardQualified` (V1) — no new trait is ever shown with fewer than the existing minimum
  evidence.
- **Override margin**: a candidate replaces the currently-published trait for a slot only if its
  `earnedPercent` (V2) or `signatureStrength` (V1) exceeds the published trait's **by at least 20
  percentage points**, not merely "higher." A small, noisy lead is not enough to flip a Creature
  part a user has already seen.
- **Persistence/confirmation window (the anti-flap rule)**: a candidate must be the stronger
  option for **two consecutive weekly evaluations** before it is published, not just the Friday
  it first crosses the margin. A one-week spike (e.g. a single quiz retake) cannot flip a slot;
  only a sustained trend can. This is a standard hysteresis/debounce pattern — necessary because
  without it, a slot sitting near the margin could oscillate week to week as ties and near-ties
  shift rank order slightly.
- Both conditions reset independently per slot — one slot flapping near its threshold never
  blocks another slot's unrelated, clear-cut change from publishing on schedule.

### 8.4 Test scenarios to validate before this ships

1. Existing user, no new evidence all week → no row written, no reveal, nothing changes.
2. Existing user, new V2 evidence on a dimension V1 never covered → publishes on the very next
   Friday (this already works today under gap-fill; confirm it still does under §8.2's merge).
3. Existing user, new V2 evidence crosses the 20-point margin on a dimension V1 already covers,
   for one week only, then regresses the following week → does NOT publish (fails the
   confirmation window) — proves anti-flap works.
4. Same as #3, but the lead holds for two consecutive weeks → publishes on the second Friday.
5. User who opens the app for the first time three weeks after a cycle they missed → sees one
   reveal, matching the latest published recipe, not three queued reveals.
6. User who opens the app twice in the same post-Friday session → second open shows no reveal
   (idempotent on `revealed_at`).
7. Apparently Private evidence feeding a Private-only dimension never appears as a public
   Creature slot candidate at any stage (existing `isCoreDimension`/`poleIsCore` filters already
   enforce this — confirm it holds through the new weekly job, since this is a new code path
   that must inherit the same filter, not re-derive it).
8. Running the free-quiz reconciliation migration (§5) mid-week does not trigger an immediate
   Creature change — it only affects what the *next* Friday's evaluation sees as current
   evidence, same as any other new evidence.

### 8.5 Migration/sequencing relative to §1–§7

The reconciliation (§1/§5) should land **before** the weekly evaluation job is turned on for any
user: turning on evolution against a known-incomplete calibration table means the first several
Fridays' "new, stronger evidence" could partly be artifacts of the under-seeded table filling in,
not genuine new user behavior. Sequence: reconcile free-quiz calibration → validate (§5.7) →
only then enable the weekly job with the new merge rule.

---

## 9. Risks to existing users

- **Free-quiz reconciliation (§1/§5), scoped to free-only migration:** low risk. Cannot alter
  any already-recorded evidence row; only changes what future submissions/retakes of the 12
  approved quizzes earn. The one visible user-facing effect is that quiz retakes of the 170
  changed / 111 removed mappings behave differently than before — expected and desired.
- **Private-quiz rows in the current staged file:** high risk if applied as-is — would ship
  unapproved, partially-buggy (§7) calibration to production. Mitigated by the split in §1/§5;
  do not include in Build 22.
- **Activation merge change (§8.2):** medium risk — this is the one actual logic change to
  scoring behavior this plan proposes. Mitigated by the qualification gate + margin + persistence
  window (§8.3), and by test scenarios #3/#4 specifically targeting flap risk. Needs its own
  explicit approval separate from the database reconciliation, since it changes *behavior*, not
  just *data*.
- **Weekly job / reveal infrastructure (§8.1):** low risk to existing data (additive tables
  only, nothing existing altered or read-modified), but is new infrastructure — needs the
  scheduling mechanism itself (Supabase cron/edge function) validated in staging before Build 22
  ships, since a failed weekly run should fail safe (no publish) rather than fail open (publish
  something wrong).
- **Build 21 TestFlight ambiguity (§6):** no code risk, but an open operational question —
  resolve via App Store Connect before relying on either candidate's AdMob config assumption for
  Build 22's own `app.json`.

---

## 10. Proposed implementation sequence

1. Approve the free-only/Private-only migration split (§1/§5.1); approve or hold the Private
   quizzes separately per your own content-review timeline.
2. Apply the free-only reconciliation migration (backup → apply → validate, per §5.4–§5.7).
3. Implement and review the override-with-margin merge change (§8.2) as its own PR, with the
   test scenarios in §8.4 as its acceptance criteria — reviewed and approved before merging,
   independent of the database work.
4. Build the `creature_published_recipes` + `creature_recipe_reveals` tables and the weekly
   evaluation job (§8.1), pointed at the new merge logic from step 3.
5. Switch the You/Creature screen's user-facing render path to read the published recipe instead
   of the live profile (§8.1.4), keeping the live-profile path available only for an internal
   debug view.
6. Validate end-to-end in a non-production environment against all 8 scenarios in §8.4.
7. Only then: commit, build, and submit Build 22 — with the `style-vibe-intimidating` Q7 issue
   (§7) and the Private-quiz migration (§1) explicitly still open and excluded unless you approve
   them separately.

## 11. GO / NO-GO recommendation

**NO-GO for Build 22 today.** Two items are genuinely ready for a GO decision on their own:
the free-only database reconciliation (§1/§5) and the Build-21-artifact investigation (§6, 
pending your App Store Connect check) are low-risk and well-validated. But the centerpiece of
this round's request — Creature evolution — requires a real logic change (§8.2) and new
infrastructure (§8.1) that have not been built, let alone tested, yet. Recommend: **approve the
free-only migration and the architecture in §8 now**, implement §10 steps 2–6, and revisit the
GO decision once step 6's validation is actually in hand — Build 22 should ship the reconciled
data and the evolution system together, not the data correction alone followed by a second
scramble to retrofit evolution on top of it.
