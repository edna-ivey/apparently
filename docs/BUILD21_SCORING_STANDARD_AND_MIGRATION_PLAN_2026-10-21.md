# Build 21 scoring standard + migration plan — owner review required
Prepared 2026-10-21. Nothing in this document has been applied to production. Build 21 is held
until this plan is reviewed and the two open parameters below are resolved.

## 1. The correction, in one sentence

Every new personality-evidence mapping (quiz or Daily) must award positive points to the
specific trait pole an answer actually demonstrates — never a dimension plus a signed value
where a negative number stands in for the opposite trait.

## 2. The canonical trait identifier system already exists

This is the most important fact for planning this correction: the exact system the owner is
asking for was already designed and substantially built, under the working name "Scoring V2,"
over the last several passes — as a **parallel, inert system that has never been applied to
production**. Nothing below is new invention; it is promotion of existing, reviewed work to
mandatory status, plus the specific new content/fixes this pass adds.

- **64 canonical pole ids**, one per pole of the 32 approved dimensions (`src/data/
  personality-v2/pole-ids.ts`), derived mechanically from the Bible's own §13/§14 dimension
  tables — never hand-authored, can never drift out of sync.
- **991 rows of already-calibrated, positive-only content** for all 21 existing quizzes
  (`src/data/quiz-pole-awards/*.ts` → `supabase/migrations/20261019010000_quiz_choice_pole_
  awards_seed.sql`), reviewed and generated, staged, not yet applied.
- **A full parallel database schema** (`supabase/migrations/20261018010000_personality_scoring_
  v2_schema.sql`): `personality_pole_evidence` (positive-only evidence table), `quiz_choice_
  pole_awards` (server-authoritative seed), an additive `daily_options.pole_personality_effects`
  column, two new triggers/RPCs. Staged, not yet applied.
- **A tested ranking/eligibility engine** (`src/data/personality-v2/scoring-engine.ts`) and a
  gap-fill bridge into the existing Creature/Your Signature/Relic consumers
  (`src/data/personality-v2/activation.ts`) that is already wired into live client code — inert
  today only because the schema migration above has not been applied (every call fails closed).

See `docs/personality-scoring-v2-design.md` for the full original design record (updated this
pass, see §6 below) and Bible §94 for the product-level ruling that makes this the mandatory
standard going forward, not an optional parallel experiment.

## 3. What this pass adds (new work, not previously built)

1. **Audit + recalibration of the actual LIVE Daily content.** Pulled all 27 canonical
   production `daily_questions` via direct, read-only `supabase db query --linked` access (not
   the unrelated local prototype file `src/data/daily-questions.ts`, which has entirely
   different content). 15 of the 27 carry a real signed personality mapping (60 options); the
   other 12 are deliberately ROOM_ONLY. Every one of the 60 options was individually
   re-examined against what it actually demonstrates — not mechanically repolarized — turning up
   one genuine correction (a mapping that was evidence-mismatched, not just sign-flipped; see
   `docs/DAILY_LIVE_CONTENT_POLE_RECALIBRATION_2026-10-21.md` for the full per-answer writeup).
2. **A new staged migration**, `supabase/migrations/20261021160000_daily_live_content_pole_
   awards.sql`, writing those 60 recalibrated awards onto the real production `daily_options`
   rows (by their real UUIDs) via UPDATE statements — additive only, the existing signed
   `personality_effects` column on those same rows is untouched. Includes a verification guard
   that aborts the migration if the target rows don't match what it was built against.
3. **A compatibility fix** to `advance_daily_rotation` (bundled in the same migration): the live
   function that creates each day's fresh Daily occurrence copies option content forward via
   `insert ... select`, but only ever named the old signed `personality_effects` column. Without
   this fix, every recycled occurrence of this content would silently lose its new V2 awards
   the moment it rotates back into rotation. Fixed to also carry `pole_personality_effects`
   forward — byte-for-byte identical to the live function otherwise.
4. **A new validator**, `scripts/validate-positive-only-scoring-standard.ts`, proving the three
   automated-test requirements the owner's instruction named explicitly (full detail in §5).
5. **Bible §94**: the product-level ruling making this the mandatory standard, explicitly
   superseding the signed-value notation in §15A while preserving its ranking philosophy, and
   flagging two parameters this pass does not unilaterally decide (§4 below).
6. **Mechanical notation conversion** of the not-yet-approved Build 21 Daily workbook (428 draft
   answer options) from signed to positive-only notation — see §7.

## 4. Two open parameters requiring owner confirmation before Build 21 proceeds

The owner's instruction is unambiguous about storage (never signed) and about multiplicity (no
arbitrary cap on traits per answer) — both are resolved, no further input needed. Two further
questions it does not itself settle:

1. **Can both poles of one dimension simultaneously appear as a person's "current" traits?**
   Today's Bible (§15A OPPOSITE-POLE MATH) is explicit: only the higher-scoring pole ever
   displays. The already-built V2 ranking engine has no such suppression — if a user genuinely
   earns enough evidence toward both poles of a dimension, both can rank and display.
   **Recommendation: keep single-winner-per-dimension display for now** (minimal product-
   visible change; every existing approved Creature/Signature read stays exactly as designed).
   This does not weaken the "both poles independently represented" requirement — that is
   satisfied at the evidence layer regardless (both poles always accumulate independently now,
   never subtracting from each other); this question is purely about what Your Signature/the
   Creature displays when both happen to qualify.
2. **Does the existing LOCKED 3-point qualification threshold carry forward, or does V2's
   9-point threshold replace it?** The Bible's existing MINIMUM TO MAKE THE BOARD / ACTIVE
   BOARD QUALIFICATION rules use 3 points. The already-built V2 engine uses 9 lifetime points —
   a deliberate choice made during V2's own earlier design pass, not something "positive-only"
   itself requires. **Recommendation: keep the existing 3-point threshold** (same reasoning as
   above — minimal visible change) unless the owner specifically wants the stricter 9-point bar.

Both are written up in full, with the reasoning for each recommendation, in Bible §94. Neither
has been decided unilaterally; both are presented here for explicit sign-off.

## 5. Automated tests (owner requirement #8)

`scripts/validate-positive-only-scoring-standard.ts`, 18 assertions, all passing:

1. **Negative awards are rejected** — at three independent layers: (a) every real points/
   pointsEarned type in the engine and the calibration-authoring type is a positive-literal
   TypeScript union, so a negative value cannot even compile; (b) every real database CHECK
   constraint on a points column (`personality_pole_evidence.points_earned`/`max_available`,
   `quiz_choice_pole_awards.points`) is asserted against its exact SQL text and algebraically
   excludes negative integers; (c) a defensive content scan of all 21 quiz-pole-award files plus
   this pass's new 60-row Daily migration confirms zero negative/zero point literals exist
   anywhere in real calibrated content.
2. **Both opposing traits independently represented** — proven against REAL content from this
   pass (not only synthetic fixtures): a fixture user who answered one Daily question earning
   Protective (`protective_hands_off:positive`) and a different Daily question earning
   Hands-off (`protective_hands_off:negative`) accumulates both poles' evidence simultaneously,
   neither reducing the other. (The pure-engine-level version of this same guarantee was already
   covered by `scripts/validate-personality-v2-scoring.ts`'s own #1/#2 assertions; this pass adds
   the real-content version.)
3. **Accumulated evidence produces the intended profile** — an end-to-end fixture using this
   pass's actual recalibration of "Pack a bag..." option 3 (`planner_spontaneous:positive +2`,
   `control_allowing:positive +2`): a user who answers this way enough times reaches eligibility
   and ranks for Planner and Control, while Spontaneous and Let-it-play-out — the poles this
   exact answer explicitly does NOT support — receive zero evidence and never rank. This is the
   owner's own stated example ("Do not represent Spontaneous as Planner -2"), proven to hold at
   the engine level against the actual recalibrated content, not just asserted in prose.

## 6. Quiz mapping compatibility (owner requirement #5)

Already audited and already compatible: the 21 existing quizzes were calibrated to the
positive-only pole system in an earlier pass (`src/data/quiz-pole-awards/*.ts`, 991 seed rows,
covered by `scripts/validate-quiz-pole-award-matrix.ts`). No further quiz work is needed for
this correction — the only new content work this pass performed was the Daily recalibration in
§3. The old, signed `src/data/quizzes/*.ts` fields (`profileSignals`/`traitSignals`) and the
engine that resolves them (`src/data/quiz-personality-awards.ts`) are left completely
untouched — they continue to power the live V1 scoring path exactly as today, for every existing
user, with zero behavior change. V1 and V2 are two parallel systems; nothing about this
correction requires editing V1's existing, approved, signed-value code — only requires that no
*new* content is ever authored in that shape again.

## 7. Build 21 owner-review workbook (owner requirement #9)

`docs/DAILY_ONE_PASS_FULL_WORKBOOK_2026-10-20.md` (428 draft answer options, explicitly "NOT
OWNER-APPROVED") had its "Mapping" lines mechanically converted from signed dimension+value
notation (e.g. `trust_verify -3`) to positive-only pole+value notation (e.g. `Verify first +3`,
using the same `dimension:positive`/`dimension:negative` id and the dimension's own approved
positiveLabel/negativeLabel exactly as `getEffectLabel` in `src/data/personality.ts` already
derives it for the admin review UI). This is a **lossless notation conversion, not a fresh
editorial re-review** — every hand-reasoned proposal's underlying dimension and magnitude is
preserved exactly; only the signed-value representation is retired. The workbook remains
explicitly unapproved; converting its notation does not constitute approving its content, and a
genuine per-answer evidence review (matching the rigor applied to the 15 live Daily questions in
§3) has not been performed on these 428 draft options and should happen before any of them ship.

## 8. Migration sequencing and safety (owner requirements #7, #10)

**Nothing has been applied.** The recommended apply order, once authorized:

1. `20261018010000_personality_scoring_v2_schema.sql` — adds the new tables/column/triggers/
   RPCs. Purely additive; does not alter, drop, or rename anything `personality_evidence`/
   `daily_answers`/`submit_quiz_result`/the live Daily trigger depend on. Rollback plan already
   documented in `docs/personality-scoring-v2-design.md` §12.
2. `20261019010000_quiz_choice_pole_awards_seed.sql` — seeds the 991 already-calibrated quiz
   rows. Depends on step 1's tables existing.
3. `20261021160000_daily_live_content_pole_awards.sql` (new, this pass) — writes the 60
   recalibrated Daily awards + the `advance_daily_rotation` compatibility fix. Depends on step
   1's `pole_personality_effects` column existing; includes its own verification guard.

**Preserves existing user profiles, historical results, and earned rewards exactly as they are
today**: the live, signed `personality_evidence` table, `scorePersonalityProfile`, and every
existing user's Creature/Your Signature/Relic/quiz-result history are read from and written to
by none of the three migrations above. The one real production account with meaningful history
(the account referenced in `docs/personality-scoring-v2-design.md` §1) sees zero change in its
Creature shape, Signature traits, or Relic the next time it opens the app, as a direct
consequence of V2 being additive-only — not as an assumption, but as a property of the schema
(no `ALTER`/`DROP` touches any V1 table or column, confirmed by reading all three migration
files in full).

**No conversion of historical signed evidence is performed or proposed** — per
`docs/personality-scoring-v2-design.md` §7's already-documented policy, carried forward
unchanged: V1 evidence stays exactly as it is, forever, unless a future, separately-approved
backfill decision is made. This pass does not revisit that policy.

## 9. Build 21 status

**HELD.** Per the owner's explicit instruction, Build 21 does not proceed until: (a) the two
open parameters in §4 are resolved, (b) this migration plan is reviewed and the three migrations
in §8 are explicitly authorized (or explicitly declined), and (c) if authorized, the migrations
are applied and independently re-verified live before any build is cut. No `app.json` build
number bump, no EAS build, no TestFlight submission has been made or attempted for this pass.
