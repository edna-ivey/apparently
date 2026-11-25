# Build 22: unified scoring + Creature evolution — consolidated plan (Revision 6)

Status: **PROPOSAL ONLY.** Revision 4's product direction is approved; this revision incorporates
five final correctness requirements into the execution checklist before implementation is
authorized. Nothing has been applied, migrated, reset, recalculated, committed, pushed, or built.
**Two real corrections surfaced this pass, not just restatements** — flagged in §5 and §6 below,
both caught while working through your requirements rather than asserted without checking:
(a) today's Friday-evolution code evaluates against *live, current* evidence, not a
timestamp-bounded snapshot of what existed as of the missed Friday — a genuine gap against
requirement 3, not something already handled; (b) Revision 4's §6 added the first-mixed-form
reveal as a second push-notification trigger, which requirement 4 correctly identifies as wrong
— that reveal is always detected while the user is already in-app, so a push for it is both
redundant and specifically what you've asked to avoid. Both are corrected below.

**Actual implementation blockers in this revision (not product decisions — these are
engineering must-dos, called out so they aren't missed during build):**
1. The publish RPC must filter evidence by `created_at <= cycle cutoff`, not read live state —
   new logic, not a reuse of existing code (§5.4).
2. Both backfill scripts must explicitly stamp `created_at` with the real original timestamp;
   the column's `now()` default will silently corrupt blocker #1 above if left alone (§2, §3).
3. The quiz backfill's `max_available` must be computed from every choice of a question, not
   just the one chosen — a different query shape than "just replay the chosen answer" (§2).
4. Backfill upserts use `ON CONFLICT ... DO UPDATE`, not `DO NOTHING` — the live trigger keeps
   `DO NOTHING` (§2, §3).
None of these are new product decisions — they're correctness requirements the implementation
must satisfy; §10 lists what's still actually awaiting your approval.

**Revision 6 adds one more, smallest-possible fix, caught by checking how the two timestamps
in play were about to collide:** Revision 5 fixed the backfill scripts to stamp
`personality_pole_evidence.created_at` with the *original* answer/completion timestamp (needed
for cycle-cutoff correctness, §5.4). That's correct, but it left no record of *when the backfill
itself ran* — the single `created_at` column can't carry both meanings at once. §2/§3 now add one
new, nullable, purely additive column for that. Separately, §5.1's `creature_published_recipes`
design has always been append-only in spirit ("current recipe = latest row per slot"), but
nothing enforced that a correction or backfill couldn't later overwrite a past cycle's already-
published row — made an explicit, DB-enforced constraint below, not just a procedural
convention.
`docs/BUILD22_CORRECTION_PLAN_2026-10-27.md` §1/§7 (free-quiz mapping diff,
style-vibe-intimidating Q7) still holds, referenced rather than repeated.

**Locked this revision:** the existing binary Creature reveal experience is preserved exactly as
it is today — **Option A from Revision 3 is approved; Option B (progressive per-slot fill, new
placeholder assets/logic) is withdrawn and will not appear in this plan again.** No new Creature
asset, type, or fallback-rendering work of any kind is in scope. The server-controlled Friday
reference timezone is locked to `America/Anchorage` (no longer an open decision). Everything
else locked in Revision 3 — seven Signature traits, five Creature parts, Friday-only evolution
after the full mixed Creature is revealed, V2 as sole authoritative engine, the 70/8/112/22
backfill-and-retake plan, held Private mapping sets, atomic server-side publication, publish-only
notifications, uncalibrated anti-flap thresholds — remains unchanged and is restated only where
needed for context.

**Correction to Revision 2's numbers — found by doing exactly what you asked (checking all
relevant tables/columns before concluding anything was unrecoverable):** Revision 2 said 92 of
100 historical quiz completions were unrecoverable. That was wrong. I had only checked the
original (Sept 13) `quiz_results` schema. A later migration
(`20260921010000_compare_they_have_notes.sql`) added a real `quiz_results.answers jsonb` column
— a `{"q1":"a","q2":"c",...}` question-id→choice-id map, populated for every completion made
after Sept 21, originally added for Compare's exact-match feature but populated for every quiz
regardless. Re-querying against it: **only 22 of 100 completions (6 users) are genuinely
unrecoverable** (predate Sept 21, no raw answers exist anywhere); the other **78 (8 already
V2-scored, 70 recoverable by replaying real stored answers against corrected calibration) can be
recovered without any retake.** Full breakdown in §2.

---

## 1. Signature (7 traits) and Creature (5 parts) — locked design, confirmed implementation path

**Your Signature.** Ranks the top 7 Core traits by the unified V2 engine
(`rankPoles` → `collapseToOneCorePerDimension` → `poleIsCore` filter → top 7). Shows fewer than 7
when fewer qualify — never padded. The collapse step (unchanged from Revision 2 §2) guarantees
no dimension ever contributes two entries (its opposing-pole requirement), by construction:

```
collapseToOneCorePerDimension(ranked: RankedPole[]): RankedPole[]
  1. filter to poleIsCore
  2. group by poleDimensionId
  3. within each group, keep only the higher-ranked pole (rankPoles' own comparator:
     earnedPercent desc, then lifetimeEarned desc, then comparePoleOrder)
  4. re-sort the one-per-dimension survivors with that same comparator
```

Top 7 of this list = Your Signature, in strength order. "Becomes more complete as you answer
more" is a direct, truthful description of this list simply growing from 0 toward 7 real,
independently-qualified entries — no UX invention needed beyond copy.

**Creature.** `CREATURE_SLOT_BY_RANK` stays exactly 5 (`eyes`, `earsHorns`, `wings`, `body`,
`tail` — unchanged). Creature input = the same collapsed list, `.slice(0, 5)`. Ranks 6 and 7
remain visible in Your Signature and are explicitly excluded from Creature input and from
triggering any evolution/notification (see §6, §7). No type, asset, or rendering work for a
6th/7th slot is scoped here or implied as pending — this is the approved, final visual scope,
not a deferred gap.

**Locked reveal behavior — Option A, confirmed to already match the existing implementation
exactly, zero new work required:**
- `isFirstFormEligible` (≥8 answers, ≥1 qualified Core trait): reveal a complete five-part
  Creature using that one trait's characteristic across all 5 slots. Already implemented exactly
  this way (`creature-progression.ts`, `you.tsx`'s `remoteFirstFormIdentity`/`firstFormEligible`
  branch) — no change.
- `isFirstMixedFormEligible` (≥50 answers, all 5 slots independently qualified,
  `isComplete === true`): reveal the full mixed Creature, each of the 5 slots driven by one of
  the top 5 qualified Core traits. Already implemented exactly this way — no change.
- **No progressive per-slot filling, no neutral placeholder assets, no intermediate mixed
  forms.** This is the existing, approved experience, preserved as-is. Nothing in this plan
  implies building Option B; it is withdrawn, not deferred.
- Neither the 8-answer nor the 50-answer threshold changes without its own separate evidence +
  approval, per your instruction.

**Confirmed by reading the actual wiring (`you.tsx:607-650`), not assumed — directly answers
your request to verify this transition isn't incorrectly delayed:** the first-mixed-form reveal
fires from a code path (`evolutionState.mixedSnapshot === null && firstMixedEligible`) that is
**entirely separate from, and runs before, any Friday-gating logic.** The Friday-gated
`checkEvolution` callback explicitly requires `mixedSnapshot` to already be non-null
(`if (!pendingEvolutionDate || !mixedSnapshot || !evolutionState) return;`) — it is structurally
incapable of running before the first mixed-form reveal has already happened. **The transition
from single-trait first-form to full five-trait mixed-form is not, and cannot be, delayed by
Friday-only evolution — this is already correct in the current code**, and stays correct as long
as the server-side persistence work in §5 preserves this same ordering (the server publish RPC
must likewise treat "first mixed-form reveal" as its own unconditional, immediate path, distinct
from the weekly evaluation path that only ever runs afterward). See §8, test #2a for the explicit
acceptance test this claim becomes.

---

## 2. V1→V2 migration — corrected recoverability, no fabrication, retake strategy

No V1 aggregate is ever converted into synthetic V2 evidence — unchanged, confirmed. Corrected
counts, all from re-querying `quiz_results` directly against both `personality_pole_evidence`
existence and the real `answers` column:

| Category | Completions | Notes |
|---|---:|---|
| Already has a real `personality_pole_evidence` row (recompute in place from corrected calibration) | 8 | Across 4 users — unchanged from Revision 2 |
| **No pole-evidence row yet, but `quiz_results.answers` has the real stored question→choice map** | **70** | Across 20 users — **new this revision**; fully recoverable by replaying the real answer against corrected `quiz_choice_pole_awards`, same non-fabrication standard as the Daily backfill you already approved |
| `answers` is null (completion predates the Sept 21 migration that added the column) — no raw data exists anywhere | 22 | Across 6 users — genuinely, permanently unrecoverable at answer-level |
| **Total** | 100 | Across 24 users (category user-counts overlap where one user has completions in more than one bucket) |

The 8-row recompute-in-place step is an *update* to existing rows, not an insert — same
`last_corrected_at` rule applies (new column defined in the 70-row section below): the update
sets `last_corrected_at` to the correction's run time and leaves `created_at` (the real original
`completed_at`) untouched, since correcting the scoring of a real historical answer doesn't
change when that answer actually happened.

**Recommendation — a new decision parallel to the Daily backfill you already approved:**
back-score the 70 recoverable completions using the exact same approach as Daily: a one-time,
auditable script that reads each completion's real `answers` map and the corrected
`quiz_choice_pole_awards`, and writes the resulting `personality_pole_evidence` rows. This is
real stored data being scored once by the approved rules, not fabrication — structurally
identical to the Daily case, just a different source table. Presented as its own decision rather
than assumed to be covered by your Daily approval, since it's a new finding you haven't seen
before this plan.

**Exact reconstruction method — both `points_earned` and `max_available`, per your requirement
1, specified precisely because getting only one of the two right is a real, easy mistake here:**
for each `(question_id, chosen_choice_id)` pair in a completion's stored `answers` map:
- `points_earned` for a pole = the corrected `quiz_choice_pole_awards` row for
  `(quiz_id, question_id, chosen_choice_id, pole)`, or 0 if that exact combination isn't present.
- `max_available` for a pole = the **highest** points any choice of that same `question_id`
  offers for that pole — this requires querying `quiz_choice_pole_awards` for **every** `choice_id`
  of that `question_id`, not just the chosen one (the live trigger does this by scanning every
  `PresentedChoice` it was handed; the backfill has no `PresentedChoice` object, so it must
  reconstruct the equivalent by grouping `quiz_choice_pole_awards` rows by `(quiz_id, question_id,
  pole_id)` and taking `max(points)`). A backfill script that only looks up the chosen choice's
  row and skips this step would silently write `max_available = points_earned` for poles the user
  didn't earn — which is wrong and would also violate `personality_pole_evidence_earned_le_max`
  the moment a different choice's unselected pole/points combination should have produced a
  higher denominator.
- **Idempotency via upsert, not insert-skip:** because the free-quiz mapping reconciliation
  (prior doc §5) may itself be revised before final sign-off, the backfill script should use
  `INSERT ... ON CONFLICT (user_id, source_type, source_id, pole_id) DO UPDATE SET
  points_earned = excluded.points_earned, max_available = excluded.max_available` — not
  `DO NOTHING`. `DO NOTHING` (correct for the *live* trigger, where each submission is a true
  one-time event) would silently freeze a backfill run's values even after a mapping correction,
  which fails your "cannot double-count" bar in the opposite direction: not duplicate rows, but
  stale, uncorrectable ones. `DO UPDATE` keeed to the same unique key still writes exactly one row
  per `(user_id, source_type, source_id, pole_id)` no matter how many times it's rerun — no
  duplication, and reruns always reflect the latest approved mappings.
- **Timestamp separation (new, minimal — your final correction):** `created_at` holds the real
  original `completed_at`, as above — required for cycle-cutoff filtering (§5.4) to work at all.
  That alone leaves no record of *when the backfill actually ran*. Smallest fix: add one new,
  nullable column, `personality_pole_evidence.last_corrected_at timestamptz`, set to the
  backfill script's own run time on every row it writes or updates. It stays `null` for every
  row written by the live, real-time submission path (never touched by a backfill) — `null`
  itself is the signal "this row's values are exactly what was recorded at the time," no
  separate flag needed. One additive column, no existing column's meaning disturbed, no new
  table.
- **Mathematical-correctness validation, concretely:** after the backfill, for every affected
  user, recompute `rankPoles` and assert (a) every row still satisfies `points_earned <=
  max_available` (the DB constraint already guarantees this, but assert it in the validation
  script too, as a second, independent check), (b) `earnedPercent` for every pole is a finite
  number in `[0, 1]` (never `NaN`/`Infinity` — only possible if `max_available` were 0 with a
  nonzero `points_earned`, which (a) already rules out), and (c) the reported before/after
  `rankPoles` diff only ever reflects the quizzes actually in scope for that run — nothing else
  shifts.

**The 22 genuinely unrecoverable completions (6 users):** no backfill is possible. Retake
strategy unchanged from Revision 2 — surface the exact `(user_id, quiz_id, completed_at)` list,
let affected accounts retake if you want full V2 fidelity for those specific quizzes; nothing is
auto-reset, no placeholder row is ever written in their place.

**V2 authoritative, no permanent V1 fallback:** unchanged from Revision 2. Once the
`activation.ts` rewrite ships, ranking reads only `personality_pole_evidence`.
`personality_evidence` (V1) and `quiz_results.answers`/`daily_answers.option_id` all stay
exactly as they are — nothing is deleted, nothing is reset — they simply stop being read for
ranking (the raw-answer columns instead become permanent inputs the recovery/backfill scripts can
always re-run against, which is a stronger "preserve historical records" guarantee than before).

---

## 3. Daily scoring and historical backfill (approved in principle) — design

1. **Sequencing, exactly as you specified:** apply + validate
   `20261021160000_daily_live_content_pole_awards.sql` first (this is what actually puts real
   point values into `daily_options.pole_personality_effects` — currently all `'[]'`). Only after
   that is confirmed correct does the backfill run.
2. **Backfill mechanics:** a script that, for each of the 112 existing `daily_answers` rows,
   runs the exact same computation `handle_daily_answer_pole_evidence()`'s trigger body already
   performs for new rows (max-available-per-pole across that question's options, earned-per-pole
   from the chosen `option_id`) — not reinvented logic, the same approved rule, applied once
   retroactively instead of only prospectively.
3. **Idempotent/transactional/safe to rerun, upsert not insert-skip:** same reasoning as §2's
   quiz backfill — use `ON CONFLICT (user_id, source_type, source_id, pole_id) DO UPDATE`, not
   `DO NOTHING`, so a rerun after a Daily-mapping correction reflects the correction rather than
   freezing the first run's values. Either way, rerunning writes exactly one row per key, never a
   duplicate — the "cannot double-count" requirement holds under both, but only `DO UPDATE` also
   lets a rerun actually fix a mistake. Wrapped in one transaction per batch so a mid-run failure
   doesn't leave some users backfilled and others not. `max_available` reconstruction is simpler
   here than for quizzes: the trigger's own logic already scans every option of the question
   (`cross join lateral jsonb_array_elements(o.pole_personality_effects)` across all options of
   `new.question_id`), so replaying that same query against each historical `daily_answers` row
   reproduces the correct per-user denominator with no separate max-lookup step needed. Same
   `last_corrected_at` column as the quiz backfill (§2) — `created_at` gets the real
   `daily_answers.created_at`, `last_corrected_at` gets the backfill's own run time.
4. **Before/after evidence counts:** the script reports, per affected user, the
   `personality_pole_evidence` row count and `rankPoles` output before and after — this is the
   concrete deliverable, not just a log line, so you can see exactly what changed.
5. **No midweek Creature change from the backfill itself:** this falls out automatically once
   §5's server-side published-recipe table exists — the backfill only ever writes
   `personality_pole_evidence` rows; it never touches `creature_published_recipes` directly.
   The next regular Friday evaluation is the only thing that can turn new evidence into a visible
   change, exactly the same as organic new evidence arriving mid-week. This needs to be an
   explicit rule the backfill script (and the quiz backfill in §2) is written to respect, not an
   incidental side effect — flagging it as a concrete implementation requirement, not just an
   assumption.
6. **Legacy V1 Daily trigger retirement:** checked directly — the only code anywhere that reads
   `personality_evidence` is `personality-service.ts` (which feeds `scorePersonalityProfile`,
   i.e. the V1 ranking path being retired in §2/§4). Once the `activation.ts` rewrite ships and
   nothing calls that path for ranking anymore, `handle_daily_answer_personality_evidence()`
   (the V1 trigger) has no remaining consumer and can be safely dropped. Recommend retiring it
   in the same PR as the `activation.ts` rewrite, not earlier (so there's no window where it's
   already dead but still running) and not as a separate, easy-to-forget cleanup later.

---

## 3a. Retake behavior — documented, not a new rule

Already governed by an existing, explicitly-commented rule in `scoring-engine.ts`
(`dedupeForRanking`), quoted directly: **"for RANKING purposes, only the EARLIEST row for a given
`(questionStableId, poleId)` pair counts... the later occurrence is excluded here so it can never
inflate lifetime earned points or the user's denominator."** Concretely: a retake of the same
quiz question produces a new row (new `source_id`/`occurredAt`) for the same
`questionStableId::poleId` key, and that new row is **never** read by `rankPoles` — the original
answer's row remains the one and only row counted, forever, no matter how many times the
question is re-answered. Every retake's row is still permanently stored (nothing is deleted or
overwritten at the storage layer — only the *ranking read* excludes it), so the raw history of
every attempt is preserved even though only the first attempt is authoritative for scoring.
**This already fully satisfies "a user must not be able to artificially increase a trait's
strength by repeatedly submitting the same quiz"** — a retake can never add, never supersede,
and never average-in with the original; it is simply invisible to ranking. This needs no new
code, only an explicit acceptance test (§8) confirming it, since it's easy to assume a retake
"updates" evidence when in fact it never does.

---

## 4. Unified Public/Private/Daily scoring — unchanged in substance

Reaffirmed from Revision 2, now explicitly in terms of the 7-trait/5-slot design:
- Core eligibility is determined solely by pole/dimension type, never by source section — Public,
  Private, and Daily evidence all feed the same `collapseToOneCorePerDimension` → top-7 list.
- A single Private answer may write both a Core and a Private pole row when both mappings are
  approved — already true in the authored content (confirmed by direct file inspection in
  Revision 1).
- Private-only dimensions never reach Your Signature or the Creature — enforced by the
  `poleIsCore` filter boundary, not a runtime check that could be bypassed.
- The nine unapproved Private quiz mapping sets stay held until reviewed individually — unchanged.
- The approved free-quiz mapping reconciliation (prior doc §1/§5) must land and validate before
  any of this activates for free quizzes specifically.
- One ranking function, one collapse rule, used identically for the Core/Signature list and (with
  `poleIsPrivate` instead) the Private/Relic list — no second implementation.

---

## 5. Friday Creature evolution — server durability, timezone, atomicity

**Reuse confirmed, not rebuilt** — `creature-progression.ts`/`creature-reveal-state.ts`'s actual
logic (`checkWeeklyEvolution`, `getPendingEvolutionCheckpointKey`, immediate first-form reveal,
missed-Friday catch-up) stays as the real implementation. What changes is where it's persisted
and how concurrent writers are handled:

1. **Server persistence, explicitly append-only (your final correction, made a hard DB
   constraint, not just a convention):** `creature_published_recipes` (user_id, slot,
   trait_dimension_id, trait_pole_sign, cycle_week, published_at), with a **unique constraint on
   `(user_id, cycle_week, slot)`** and **no `UPDATE` grant for any application role, ever** — the
   only operation this table's write path ever performs is `INSERT`. A cycle's published row,
   once written, is permanently immutable: a later mapping correction or backfill cannot alter
   it, by construction, not merely by procedural discipline. "What's the Creature showing right
   now" is answered by reading the row with the greatest `cycle_week` per `(user_id, slot)` —
   there is no "current" flag or "superseded" marker to maintain, because the most recent row
   already is the answer, and every older row stays exactly as it was published, forever. A
   correction's effect is visible only from the next cycle's new row onward — exactly "may affect
   future publications, must not silently change an already-published one." Plus the
   `(user_id, cycle_week)` evaluation-marker table, unchanged from Revision 2/5, for the
   race-to-publish mechanism in point 3 below.
2. **Account-consistent Friday timezone + server-controlled cycle identifier — locked.**
   `cycle_week` is computed **server-side**, from a single fixed reference timezone,
   **`America/Anchorage`**, rather than each device's local clock: an ISO-week-style string
   derived from "the most recent Friday 00:00 America/Anchorage at or before now," computed
   inside the publish RPC itself. This makes the cycle identifier a single, unambiguous value
   shared by every device on the account, instead of each device computing its own
   `getLatestFridayCheckpointKey` locally (today's behavior, which is what makes cross-device
   consistency impossible to guarantee as currently written).
3. **Atomic, idempotent publication — no conflicting recipes, no duplicate notifications:** the
   publish step becomes a single `SECURITY DEFINER` RPC, called by whichever device happens to
   check in first for a given `(user_id, cycle_week)`, structured as:
   - `INSERT` the evaluation-marker row for `(user_id, cycle_week)` with `ON CONFLICT DO NOTHING
     RETURNING *` — exactly the same "only one writer wins the race" pattern already used by
     `sync_creature_traits` (§5 of the existing, approved `20261022030000` migration). If this
     insert returns no row, a second device/tab already published this cycle; the RPC returns
     immediately, writes nothing further, sends no notification — this is what makes duplicate
     publication and duplicate notifications structurally impossible, not just unlikely.
   - Only the device that won the marker-insert race goes on to compute the candidate recipe,
     write any changed `creature_published_recipes` rows, and conditionally enqueue the
     notification (§7) — all inside the same transaction, so a crash mid-way never leaves a
     half-published cycle.
   - **Retry safety, explicitly:** a retried call for a cycle that already has a marker row
     cannot reach the `creature_published_recipes` insert at all — the marker check short-
     circuits it first, every time, on every device. Combined with point 1's unique constraint
     and insert-only grant, a retry has two independent reasons it can never duplicate or alter a
     past publication, not just one.
4. **Missed-Friday evidence cutoff — a real gap against today's implementation, not a
   restatement.** Your scenario: a user misses Friday Oct 23, answers more questions Sat–Mon
   (Oct 24–26), opens the app Tuesday Oct 27. Checked directly: today's client code
   (`checkEvolution` in `you.tsx`, calling `checkWeeklyEvolution`) evaluates against
   `remoteCreatureIdentity` — the **live, current** candidate as of the moment the check runs
   (Tuesday), not a snapshot bounded to the missed Friday's actual cutoff. That means the Sat–Mon
   answers would, today, leak into the Oct 23 catch-up evaluation — exactly what you're asking me
   to prevent. **Required fix for the server-side publish RPC:** each cycle's candidate must be
   computed from `personality_pole_evidence` rows filtered to `created_at <= <that cycle's Friday
   00:00 America/Anchorage cutoff>`, not "whatever is live right now." Concretely for your
   scenario: the Tuesday catch-up evaluates the Oct 23 cycle using only evidence that existed
   by Oct 23's cutoff; the Sat–Mon evidence is correctly excluded from it and instead becomes
   eligible for the **next** cycle (Oct 30), evaluated separately whenever that cycle is next
   checked. This preserves the already-locked "exactly one reveal, never a backlog" behavior
   (only the single latest pending cycle is ever evaluated on a given open), while now also
   guaranteeing that cycle's result reflects that Friday's state, not today's. This is new work
   for the publish RPC (a `WHERE created_at <= cycle_cutoff` clause and passing the cycle's
   cutoff timestamp through, not a persistence-only change) — flagging it explicitly as
   implementation scope, not something §5's existing-reuse framing already covers.
5. **Historical recalculation must not bypass the Friday gate:** stated as an explicit rule here
   because it's load-bearing across §2/§3's backfills and any future mapping correction — none of
   those scripts are ever allowed to write to `creature_published_recipes` directly. They touch
   only the evidence tables; the next real Friday evaluation is the sole path to a visible change,
   with no exceptions carved out for "but this evidence came from a backfill." A backfilled
   Daily/quiz row must be subject to point 4's cutoff rule using the *original* answer's
   timestamp once the normal cycle evaluation picks it up — but
   `personality_pole_evidence.created_at` defaults to `now()` if not supplied explicitly, so a
   naive backfill `INSERT` would stamp every row with the backfill's own run time, making old
   evidence look brand-new and corrupting every future cycle-cutoff comparison in point 4.
   **Concrete requirement, not optional:** both backfill scripts (§2, §3) must explicitly set
   `created_at` to the real original timestamp (`quiz_results.completed_at` for the quiz
   backfill, `daily_answers.created_at` for the Daily backfill), never the column default —
   added to the validation checklist in §11.
6. **No margin numbers locked, unchanged from Revision 2.** The dev lab (§7, unchanged from
   Revision 2) runs real scenarios — weak evidence, decisive evidence, opposing poles, retakes,
   ties, `earnedPercent` denominator shifts from new eligible questions — before any margin or
   confirmation-window length is chosen. "Strong, well-supported changes publish next Friday, no
   extra week" stays the rule *shape* locked in Revision 2; the actual numbers are a calibration
   output, not asserted here.
7. Initial Creature appearance immediate on qualifying; subsequent appearance changes Friday-only;
   underlying scores/Signature update continuously — all unchanged, all already correct in the
   existing implementation.

---

## 6. Creature evolution notifications — fire only on a real, visible, 5-slot change

- The midweek notification call (`you.tsx:546`, fired on every profile reload) is removed
  outright — not relocated, not throttled, gone.
- **Correction to Revision 4:** that revision added the first-mixed-form reveal as a second push
  trigger alongside the Friday publish. Your requirement 4 catches a real problem with that:
  the first-mixed-form reveal can only ever be *detected* while the user is actively in the app
  (crossing the 50-answer/5-trait threshold requires them to have just submitted an answer,
  which by definition means they're using the app right now) — so a push for it would always be
  sent to someone already looking at the in-app reveal. **There is exactly one legitimate push
  trigger: the atomic weekly publish RPC (§5.3), on the branch where this device wins the race
  and `checkWeeklyEvolution`'s outcome is `changed` for at least one of the 5 slots.** The
  first-mixed-form reveal is in-app only — shown immediately via the existing reveal UI, no push,
  ever.
- A mid-week score shift, a rank-6/7 reorder, or a newly-*eligible*-but-not-yet-*published* pole
  triggers neither the in-app reveal nor a push.
- **User preferences and OS permission, per your requirement — already built, reuse don't
  rebuild:** `notification_preferences.creature_evolution_enabled` (default `true`) and the
  shared `quiet_hours_*`/timezone columns already exist and are already read by the deployed
  send function (`supabase/functions/_shared/push-notification-logic.ts`, confirmed directly —
  it selects `creature_evolution_enabled` and the quiet-hours columns before sending). OS-level
  permission is handled the same way every other category already handles it (no token, or a
  revoked token, means Expo's send silently no-ops for that device — not an error condition).
  The only requirement on the new Friday-publish notification is that it writes through the
  existing `notification_outbox` with `category = 'creature_evolution'` — the same path
  `sync_creature_traits` already uses — rather than any new, separately-gated send mechanism.
  Nothing new needs to be built here; this is a reuse constraint on the implementation, not an
  open question.
- A change to rank 6 or 7 (visible in Your Signature, never in the Creature) never reaches this
  code path at all — the notification input is derived from the published-recipe diff, which by
  construction only ever contains the 5 real slots.
- Notification copy stays generic (no trait name, no dimension, no Private quiz reference —
  consistent with the existing, already-approved `20261022030000` migration's privacy posture);
  detail is only ever visible after opening the app to Your Signature/Creature.
- Cross-device/duplicate-publish dedup is inherited directly from §5.3's atomicity — not a
  separate mechanism to build.

---

## 7. Development-only evolution testing mechanism

Unchanged from Revision 2 (`src/app/dev/creature-evolution-lab.tsx`, `__DEV__`-gated like
`observability-lab.tsx`/`png-experiment.tsx`/`relic-lab.tsx`). This is the tool §5.5's margin
calibration and the §8 matrix both depend on — first implementation step once approved, before
the margin/confirmation-window values get chosen.

---

## 8. Acceptance-test matrix (7-trait Signature / 5-part Creature)

"Actual result" stays **Pending** throughout — no code runs until you approve implementation.

| # | Scenario | Expected Signature (top 7, post-collapse) | Expected Creature (exactly 5 slots) | Actual result |
|---|---|---|---|---|
| 1 | New user, <8 answers | Empty/partial Signature, no Creature yet | None yet | Pending |
| 2 | New user, ≥8 answers, 1 qualified trait | 1 entry | First-form: all 5 slots = that one characteristic (locked Option A) | Pending |
| 2a | **Transition test, explicitly requested:** user crosses the 50-answer/5-qualified-trait full-mixed-form threshold on a non-Friday day, while already showing the first-form Creature | Signature shows 5 (or more) qualified entries | Full mixed Creature reveals **immediately**, same day — not held for the next Friday; confirmed structurally guaranteed by `you.tsx`'s reveal effect running before any Friday-gated path can execute | Pending |
| 3 | User with exactly 5 qualified Core traits | 5 entries | 5 distinct slots, one per trait, ranked | Pending |
| 4 | User with 7+ qualified Core traits | Exactly top 7 shown, ranked strongest→weakest | Top 5 of those 7 only | Pending |
| 5 | Opposing poles both independently eligible | Collapse rule keeps only the higher-ranked pole of that dimension — never both | Same — never two slots for one dimension | Pending |
| 6 | Rank-6/7 trait changes (new qualifier or reorder) | Signature list updates immediately | **No** Creature change, **no** notification | Pending |
| 7 | Public quiz evidence | Counted per corrected `quiz_choice_pole_awards` | Affects slots only via next Friday | Pending |
| 8 | Private quiz, dual Core+Private award | Core pole counted toward Signature; Private pole toward Relic only | Same Friday-gated rule; no cross-leak | Pending |
| 9 | Daily scoring, post-`20261021160000` apply | New Daily evidence counts like any other source | Same | Pending |
| 10 | Historical Daily backfill (§3) | Before/after `rankPoles` diff matches script's reported counts | No immediate visual change — only via next Friday | Pending |
| 11 | Historical quiz backfill (§2, pending your approval) | Same before/after requirement as #10 | Same Friday-gate rule | Pending |
| 12 | Retake, duplicate submission | No duplicate rows; retake's row never read by ranking (§3a) — re-answer the same quiz with a *deliberately different, higher-scoring* answer and confirm the ranking is unchanged from before the retake | Unchanged | Pending |
| 12a | Backfill max/earned sanity (§2) | Every backfilled row satisfies `points_earned <= max_available`; `earnedPercent` finite in `[0,1]` for every pole | No immediate visual change | Pending |
| 13 | Corrected mapping applied mid-week | Signature ranking changes immediately | Creature unchanged until next Friday | Pending |
| 14 | Weak evidence (just crosses `ELIGIBILITY_THRESHOLD`) | Ranks low, included if in top 7 | Does not displace a published slot below the calibrated margin | Pending |
| 15 | Decisive evidence | Clears the calibrated "decisive" margin | Publishes next Friday, no extra-week wait | Pending |
| 16 | Friday, real change | — | New recipe row(s) for the changed slot(s) only; one notification | Pending |
| 17 | No-change Friday | — | No recipe change, no notification, "nothing changed" weekly state | Pending |
| 18 | Missed Friday, late return | Candidate as of return vs. last published | Exactly one reveal, not a backlog | Pending |
| 18a | **Exact scenario from requirement 3:** misses Friday Oct 23, answers more Sat–Mon (Oct 24–26), opens app Tuesday Oct 27 | Oct 23 cycle evaluated using only evidence with `created_at <= Oct 23 00:00 America/Anchorage` — Sat–Mon answers excluded from this cycle | Published recipe reflects Oct 23's state only; Sat–Mon evidence carries over, untouched, to the Oct 30 cycle instead | Pending |
| 18b | No redundant push during an in-app reveal (requirement 4) | User crosses the full-mixed threshold while the You screen is open | In-app reveal shown immediately; **zero** push notification sent for this event, ever | Pending |
| 19 | Reinstall | Same account, new device | Published recipe read from server, not reset | Pending |
| 20 | Cross-device sync | Two devices, same account | Identical published recipe on both; exactly one publish/notification wins the race | Pending |
| 21 | Duplicate publish attempt (race) | — | Second attempt no-ops (§5.3); no duplicate notification | Pending |
| 21a | **Correction/backfill applied after a cycle is already published (your final requirement)** | A mapping correction or backfill runs after cycle N's recipe is published | Cycle N's `creature_published_recipes` rows are byte-identical before and after; only cycle N+1's evaluation (the next real Friday) can differ | Pending |
| 22 | Private information leakage | Private-only pole never appears in Signature | Never appears in Creature, notification, or sharing copy | Pending |
| 23 | No progressive/placeholder rendering exists anywhere | A user with 2–4 qualified traits | Still shows the single-trait first-form (all 5 slots = strongest trait's characteristic), never a partial-fill or placeholder state | Pending |

---

## 9. Final implementation sequence

**1. Database migrations and mapping reconciliation**
- Apply the free-quiz-only reconciliation migration (prior doc §5); validate per that doc's
  procedure.
- Apply + validate `20261021160000_daily_live_content_pole_awards.sql`.
- Hold the 9 Private-quiz mapping migrations pending your individual review.

**2. Historical evidence recovery and Daily backfill**
- Build and run the Daily backfill script (§3) — idempotent, transactional, before/after report.
- Build and run the quiz-answers backfill script (§2's 70 recoverable completions) — same
  pattern, pending your approval of that parallel decision.
- Produce the final `(user_id, quiz_id, completed_at)` list for the 22 genuinely unrecoverable
  completions, for your retake decision.

**3. Unified V2 scoring and seven-trait Signature ranking**
- Implement `collapseToOneCorePerDimension` and the `activation.ts` rewrite that replaces
  `mergeCoreTraitsWithV2Gaps`/`mergePrivateSignalsWithV2Gaps` with it.
- Remove the V1 ranking path from the live call sites (`you.tsx` and anywhere else reading
  `scorePersonalityProfile`'s output for ranking); retire the V1 Daily trigger in this same PR
  (§3.6).

**4. Five-part Creature recipe generation**
- Point `buildCreatureIdentity`/`buildFirstFormIdentity` at the collapsed top-5 — the existing
  first-form/full-mixed-form reveal logic and thresholds are otherwise unchanged (§1, locked).

**5. Friday publication, server persistence, and notifications**
- Build `creature_published_recipes` + the evaluation-marker table and the atomic publish RPC
  (§5.3).
- Resolve the reference-timezone decision (§5.2) before this ships.
- Port `checkWeeklyEvolution`'s comparison into the server RPC, with the margin/confirmation
  logic left as calibration parameters, not hardcoded.
- Remove the midweek notification call; wire the publish-time-only, 5-slot-only notification
  (§6).

**6. Development testing, acceptance validation, and Build 22 release readiness**
- Build the dev evolution lab (§7).
- Calibrate the anti-flap margin/confirmation-window using it against real scenarios.
- Run the full acceptance matrix (§8), filling in "actual result" for real.
- Resolve the Build 21 TestFlight artifact question (prior doc §6) via App Store Connect.
- Only then: commit, build, submit Build 22.

---

## 10. Decisions that still require your approval

Both Revision 3 open items (Option A/B, Friday reference timezone) are now locked and removed
from this list. What remains:

1. Each of the 9 Private quiz mapping sets, individually, before activation.
2. The anti-flap margin and confirmation-window length — deliberately not decided here; approved
   only after the dev lab (§7) produces real scenario data.
3. Whether the 6 users with genuinely unrecoverable completions (§2) should be asked/allowed to
   retake those specific quizzes, or simply left with a thinner profile for them.
4. Your test account's identity, if you want §2's numbers or the acceptance matrix (§8) traced
   against your specific account rather than the aggregate figures already gathered.

---

## 11. Final migration order, rollback strategy, and validation checkpoints

Each numbered step below is a single checkpoint: apply/implement, validate, confirm before
proceeding. Every data step has an independent rollback that doesn't depend on any later step
having happened.

| # | Step | What it does | Rollback | Validation checkpoint before proceeding |
|---|---|---|---|---|
| 1 | Backup | `supabase db dump --linked --data-only` for `quiz_choice_pole_awards`, `daily_options`, `personality_pole_evidence` | N/A — this *is* the rollback target for steps 2–5 | Dump file exists and is non-empty |
| 2 | Apply free-quiz reconciliation migration (prior doc §5) | Corrects `quiz_choice_pole_awards` for the 12 approved free quizzes | Restore step 1's dump for this table | Re-run the live-vs-source diff (prior doc §1): expect 0 added/removed/changed, 1,198 unchanged |
| 3 | Apply `20261021160000_daily_live_content_pole_awards.sql` | Populates real `pole_personality_effects` on the 60 live Daily options | Restore step 1's dump for `daily_options` | Spot-check a handful of options' `pole_personality_effects` against the source `src/data/...` content it was generated from |
| 4 | Quiz-answers backfill script (§2, the 70 recoverable completions) | Writes new `personality_pole_evidence` rows by replaying each completion's real `quiz_results.answers` against the now-corrected `quiz_choice_pole_awards`, computing `max_available` from every choice of each question (not just the chosen one), with `created_at` set explicitly to the real `quiz_results.completed_at` | Re-run the script — `ON CONFLICT DO UPDATE` recomputes every row back to the current approved mappings, which is itself the rollback for a bad first run; a clean removal (e.g. abandoning the approach entirely) deletes rows by this script's own batch id | Before/after row counts and `rankPoles` diffs match the script's own report; rerun writes the same row count with identical values (idempotency); every row's `created_at` equals its source completion's `completed_at`, never the backfill's run time; every row's `last_corrected_at` equals this run's actual timestamp; every row passes the §8 row 12a sanity check |
| 5 | Recalculate the 8 already-V2-scored completions | Updates `points_earned`/`max_available` in place for existing rows, from the same corrected calibration; sets `last_corrected_at`, leaves `created_at` untouched | Restore step 1's dump for `personality_pole_evidence` (or, more surgically, recompute from the pre-correction calibration dump — either works) | Diff each affected row's old vs. new `points_earned`/`max_available`; confirm `row count` is unchanged (update in place, never delete+reinsert) and `created_at` is unchanged while `last_corrected_at` is newly set |
| 6 | Daily backfill script (§3) | Writes new `personality_pole_evidence` rows for the 112 historical Daily answers, replaying the trigger's own logic against real `option_id`s, with `created_at` set explicitly to the real `daily_answers.created_at` | Re-run (upsert recomputes); a clean removal deletes rows by this script's own batch id | Before/after `rankPoles` output per affected user matches the script's report; rerun writes identical values; every row's `created_at` equals the source answer's real timestamp and `last_corrected_at` equals this run's time |
| 7 | `activation.ts` rewrite + `collapseToOneCorePerDimension` (code, not a migration) | Makes V2 the sole ranking engine; removes the V1 ranking call sites | Standard code revert (git) | Full acceptance matrix §8 rows 1–15 pass against a non-production/staging account set |
| 8 | Retire the V1 Daily trigger (`handle_daily_answer_personality_evidence`) | Drops the now-unused trigger | Re-create it from the original migration file if anything unexpected depends on it | Confirm zero rows have been written to `personality_evidence` for at least one full Daily cycle post-retirement, with no functional regression anywhere in the app |
| 9 | `creature_published_recipes` (unique `(user_id, cycle_week, slot)`, insert-only, no `UPDATE` grant) + evaluation-marker table + atomic publish RPC, with per-cycle evidence cutoff filtering (§5.4) | New, additive tables; new RPC | Drop the new tables/RPC — nothing existing depends on them yet | Acceptance matrix §8 rows 16–21, 18a, and 21a (Friday publish, missed-Friday cutoff correctness, reinstall, cross-device, duplicate-publish race, past-cycle immutability under correction) pass in staging; attempt a direct `UPDATE` against an existing published row in staging and confirm it's rejected by the missing grant, not just "discouraged" |
| 10 | Remove the midweek notification call; wire publish-only notification (§6) | Code change | Standard code revert | Confirm no notification fires for any mid-week scenario (§8 row 6), and confirm row 2a's non-Friday first-mixed-form transition fires its in-app reveal with **no** push at all (§8 row 18b) — the one push trigger that exists is the Friday publish RPC, full stop |
| 11 | Dev evolution lab (§7) + anti-flap calibration | New dev-only screen; calibration run | N/A — dev-only, never in a release build | Margin/confirmation values chosen from real scenario output, not asserted |
| 12 | Full acceptance matrix (§8), all rows | — | — | Every row's "Pending" replaced with a real result; no unresolved failures |
| 13 | Build 21 TestFlight artifact resolution (prior doc §6) | Your own App Store Connect check | N/A | Confirmed which artifact is live before Build 22 submission |
| 14 | Commit, build, submit Build 22 | — | Standard git/EAS revert if needed post-submission | — |

Steps 1–6 can proceed as soon as the corresponding content/mapping approvals (§10) are given;
steps 7–10 are one coordinated code change and should land together, reviewed as a unit, after
1–6 are validated; step 11 should happen before 7/9's review concludes, not after, so the
calibrated values are available when those are merged, not retrofitted.

---

## 12. Genuine technical blockers — none

Everything specified across all six revisions is buildable with patterns already proven
elsewhere in this codebase — no new kind of infrastructure, no unresolved technical question:

- The new `last_corrected_at` column (§2/§3): one additive, nullable `timestamptz`, same shape
  as any other audit column already in this schema.
- `creature_published_recipes`'s insert-only/no-`UPDATE`-grant design (§5.1): the same
  RLS/grant pattern every other table in this schema already uses (deny by default, grant only
  the specific operation a `SECURITY DEFINER` RPC needs).
- The marker-row race-to-publish pattern (§5.3): already shipped and approved, verbatim, in
  `20261022030000_creature_evolution_notification.sql`'s `sync_creature_traits` — this plan
  reuses it, doesn't invent it.
- The per-cycle evidence-cutoff filter (§5.4): a `WHERE created_at <= $cutoff` clause — standard
  SQL, no new capability.
- The backfill upsert-with-explicit-timestamp pattern (§2/§3): `INSERT ... ON CONFLICT ... DO
  UPDATE`, same conflict-target shape the live triggers already use, just with `DO UPDATE`
  instead of `DO NOTHING` and two explicit column values instead of relying on defaults.

**What remains is product decisions, not technical ones** — the four items already listed in
§10 (the 9 Private quiz mappings, the anti-flap calibration values, the retake-or-thin-profile
call for the 6 unrecoverable-completion users, and your test account's identity if you want the
numbers traced against it). None of them require further investigation to resolve technically;
they're waiting on your judgment, not on an unanswered engineering question.
