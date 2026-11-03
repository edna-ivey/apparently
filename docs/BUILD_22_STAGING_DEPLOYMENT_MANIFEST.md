# Build 22 Staging Deployment Manifest

Generated 2026-10-31, updated same day after a third owner audit round (historical-completion
timestamp preservation, database-authoritative held-quiz reconciliation, quiz result metadata
validation, quiz content-version safeguard, clock-skew tolerance) on top of the second round
(frozen-id completion, historical-cutover fix, timestamp-trust fix, held-quiz protection,
test/deployment-safety hardening). **Updated again 2026-11-01** after a fourth round (V1 scope:
server-side result-integrity verification, access-tier/content-version inheritance, and —
this fifth pass the same day — the four owner-approved Private quiz replacements
(love-soulmates-ready, career-ambition-how-bad, career-ambition-proving, hidden-you-wrong),
their real Creature/Relic trait-award activation, and the configurable SQL scoring engine
their gates/ties require. **Updated again 2026-11-01 (same day, sixth pass)**: two more
owner-approved Private quiz replacements implemented and activated (life-match-dream-life,
style-vibe-intimidating), reusing the existing configurable scoring engine with zero new SQL
migrations. A seventh quiz, private-private-trouble, was NOT implemented that round — see
former §3c, a direct conflict between that round's instructions and the repository's own
canonical approval record at the time.

**Updated again 2026-11-02 (seventh round): FINAL PRIVATE QUIZ IMPLEMENTATION.** The owner
explicitly re-confirmed approval in full, updated the canonical approval index
(`docs/private-quizzes/APPROVED_PRIVATE_QUIZZES.md`) and the source-of-truth pack
(`docs/private-quizzes/APPROVED_11_QUIZ_SOURCE_PACK_2026-11-02.md`) accordingly, and this round
implemented the complete remaining scope: three revised free Private previews
(keep-you-around, be-so-serious, and secretly-love revived as an active preview), the final
approved After Dark replacement (private-private-trouble), and seven new premium quizzes
(love-soulmates-become, shadow-side-hypocrisy, private-private-proof, hidden-you-hide,
life-match-freedom, style-vibe-attention, good-stuff-trust) — bringing the full catalog to
**17 playable Apparently Private quizzes (3 free previews, 14 premium)**, the stated final
target. Both former §3c flagged conflicts are now resolved by this round's explicit owner
directive (see §3d): private-private-trouble's final content is owner-approved and
implemented, and the "top-3/flatten" award-qualification description was superseded by this
round's own LOCKED scoring model, which explicitly confirms the existing direct raw-evidence
mechanism (no per-quiz ranking/flattening) as final and non-negotiable. See §3d below for the
full seventh-round account.

**Updated again 2026-11-02/03 (eighth round): FINAL BUILD 22 CLEANUP AND V1 LAUNCH
READINESS.** The owner authorized a controlled, one-time clean V1 prelaunch data reset
(Apparently You has never publicly launched; obsolete beta quiz/personality data does not
need to be preserved) and a full retirement of every obsolete scoring pathway this
engagement's history had accumulated. This round: (1) prepared and locally rehearsed the
clean V1 reset (24/24 rehearsal checks passing); (2) retired
`profileSignals`/`applyPermanentQuizAwards`/`quiz-personality-awards.ts`, the legacy
`submit_quiz_result` client path, and the dead V2-pole-interim client path, confirming exactly
one authoritative personality-evidence mechanism remains; (3) resolved the After Dark Q8A
contradiction per explicit owner decision (keep #56 Self-preserving +2, drop #55 Duty-first
+1); (4) rewrote `validate-private-library-content-fidelity.ts` against the current locked
documents, independently verifying all 17 quizzes' prompts/choices/reveals (1592/1592 passing)
and catching + fixing 9 genuine pre-existing transcription bugs; (5) corrected the release
plan so the mature-content sharing-block migration is a hard prerequisite for this release,
proven end-to-end against the real RPCs (16/16 checks); (6) investigated the 378 scoring-
matrix warnings and confirmed all are stale wording-drift in a retired, non-authoritative
tooling snapshot, zero are live scoring defects. See §3e below for the full account.

**Updated again 2026-11-03 (deployment-safety review, resumed session): four corrections to
the eighth round above, required before owner authorization.** (1) The reset migration was
found to be only *informationally* gated — a normal `supabase db push` could still have
applied it — so it was physically moved to `supabase/manual_operations/`, a directory the
Supabase CLI never scans; the mature-content sharing-block migration, previously
miscategorized as unrelated, was confirmed to be a hard release prerequisite and moved into
the real candidate set (now §1, item 1). (2) A new migration,
`20261102040000_submit_quiz_result_version_guard.sql`, makes the legacy `submit_quiz_result`
RPC unconditionally reject every call with `UPDATE_REQUIRED: ...` and write nothing at all —
closing the gap where an old TestFlight client could still insert a bare `quiz_results` row
after the reset. (3) The reset's `user_trait_totals`/`user_trait_active_totals` recalculation
was moved inside the reset's own `SERIALIZABLE` transaction (no more separate manual rebuild
step, no stale-aggregate window), `CREATURE_EVOLUTION_SCHEMA_VERSION` was bumped 1→2 to
invalidate the one genuinely sticky client-side cache, and a single automatic retry on a
`40001` (serialization-conflict) response was added to the client's `submitQuizCompletion`
call so a real completion that happens to land mid-reset is retried once rather than merely
surfacing a bare failure. (4) The harness-total arithmetic in an earlier report was corrected
(see §4). **Also resolved this round: a genuine, read-only `supabase migration list --linked`/
`supabase db push --linked --dry-run` was run against the real linked production project
(`apparently-you`, ref `rjslgjxlpsjljbrlxfet`) — this environment does have CLI access via
`npx supabase` (confirmed working; only `which supabase` on PATH fails) — superseding the
prior round's filesystem-only simulation with a real, nonproduction-altering comparison. See
§1 and §5 item 4 for the result and its remaining limits.** See §3e's update and
`docs/BUILD_22_V1_RESET_INVENTORY.md` for the full account.

**No production writes, backfills, commits, pushes, EAS builds, TestFlight releases, or
database resets have been performed to produce this document.** Everything below is a plan
and a locally-verified (PGlite) proof, not an executed deployment or reset.

**This document is an engineering candidate set, not owner or production approval.** Nothing
in it authorizes a push. It exists so that an actual owner review has a single, accurate,
up-to-date artifact to review against.

## 1. Engineering candidate migration set, in chronological apply order

This list is this engagement's own determination of which migrations belong together and in
what sequence — it is **not** a statement that the owner has approved pushing them. Before any
real push is even considered, re-run `npx tsx scripts/verify-migration-allowlist.ts` against
the real linked project — it must report these 21 files as the `ENGINEERING CANDIDATE SET` and
report zero `UNKNOWN` pending migrations. **This was actually run** (deployment-safety review,
2026-11-03) via a genuine, read-only `supabase db push --linked --dry-run` against the real
linked production project (`apparently-you`, ref `rjslgjxlpsjljbrlxfet`): all 21 candidate-set
files, the 1 gated file, and the 4 independent files are currently pending there, zero unknowns,
and — confirmed separately via `supabase migration list --linked` — the reset file is absent
from the remote comparison entirely, since it no longer lives in `supabase/migrations/`. This
is a snapshot as of 2026-11-03 and must be re-run again immediately before any real push, since
the remote pending set can change. Order matters and must be preserved exactly —
Supabase's own migration history and `supabase db push` both apply strictly by filename
(chronological) order; this list is kept in that same order on purpose (and
`verify-migration-allowlist.ts`/its matching PGlite test both now assert this mechanically,
rather than trusting it stays correct by inspection).

**CORRECTED (deployment-safety review, 2026-11-03), item 1:** `20261021150000_block_
private_private_trouble_sharing.sql` was previously miscategorized as "independent,
unrelated to Build 22" despite being a hard prerequisite for this release — both quizzes it
protects (`private-private-trouble`, `private-private-proof`) are fully playable,
premium+18+-gated, real quizzes in this exact candidate set (§3d). It is now #1 below, an
ordinary member of this set, confirmed by `scripts/verify-reset-isolation.ts` to be among the
files a real `supabase db push` would apply.

1. `20261021150000_block_private_private_trouble_sharing.sql` — rejects/excludes BOTH
   `private-private-trouble` and `private-private-proof` in `create_quiz_share`/
   `get_shared_quiz_result`, since both are 18+-gated and the public `/s/[token]` landing has
   no age check. Proven end-to-end against the real RPCs (direct-call bypass, deep-link/
   retroactive share row, both quizzes, plus an ordinary quiz control case) by
   `run-mature-content-sharing-security-test.mjs`, 16/16 checks passing — see §4.
2. `20261028010000_personality_trait_catalog.sql`
3. `20261028020000_quiz_content_identity.sql` — **regenerated this (seventh) round**, now
   emitting the full, final 17-quiz Private catalog (3 free previews + 14 premium) plus all 13
   already-shipped free/dualDimension quizzes — 30 quizzes, 276 questions, 1214 choices, 3652
   award rows, 1199 result-weight rows total.
4. `20261028040000_user_quiz_evidence_schema.sql`
5. `20261028050000_daily_trait_identity_and_rotation_fix.sql`
6. `20261028060000_daily_trait_awards_seed.sql`
7. `20261028070000_creature_published_recipes.sql`
8. `20261028090000_daily_trait_awards_recurrence_reconciliation.sql`
9. `20261030010000_active_evidence_window.sql`
10. `20261030020000_legacy_quiz_result_completion_reservation.sql`
11. `20261030030000_active_profile_activity_counts.sql`
12. `20261030040000_user_trait_evidence_created_at_index.sql`
13. `20261031010000_quiz_completion_historical_reservation_and_timestamp_trust.sql`
14. `20261101010000_quiz_result_definitions_catalog.sql` — **regenerated this round** (same
    result catalog, now reflecting all 17 Private quizzes' real result ids/order — 162 result
    rows across 30 quizzes).
15. `20261101020000_quiz_completion_metadata_validation_and_clock_skew.sql`
16. `20261101030000_quiz_result_scoring_verification.sql`
17. `20261101040000_quiz_access_inheritance_and_content_versioning.sql`
18. `20261101050000_configurable_scoring_engine_and_private_quiz_activation.sql` — rewrites
    `resolve_archetype_result` to read `quizzes.scoring_config` (eligibility gates,
    high-signal tie-breaks, tie fallback order) instead of only the generic last-3-questions
    rule, and fixes a cross-version legacy `personality_evidence` double-credit loophole in
    `submit_quiz_result` (item 7, see §3b).
19. `20261102010000_archetype_fallback_result_and_tie_chain.sql` — **new this (seventh)
    round**: two small, targeted extensions to `resolve_archetype_result` (same signature, no
    callers changed) needed by this round's approved content — (a) `finalTieQuestionId` now
    accepts a SEQUENCE of questions checked in order (keep-you-around's approved Q8→Q6→Q5→Q3→Q1
    chain), not just one; (b) for a plain archetype quiz, the result "universe" is now sourced
    from `quiz_result_definitions` instead of only `quiz_choice_result_weights`, so a
    zero-weight safety-net result (be-so-serious's new ungated "MX" outcome) is discoverable
    and wins automatically once every real, gated outcome fails its gate. Fuzz-tested against
    the real `scoring.ts` engine for all 27 archetype/dualDimension quizzes (3,000 random
    answer sets each, zero mismatches) — see §4.
20. `20261102020000_final_scoring_cleanup_and_v1_reset.sql` — **new, eighth (final cleanup)
    round**: redefines the legacy `submit_quiz_result` RPC to stop writing
    `personality_evidence` entirely. Proven via `run-legacy-scoring-retirement-test.mjs`,
    9/9 checks passing — see §3e/§4. **Superseded in practice by #21 immediately below**,
    which goes further (see that item and the deployment-safety review note).
21. `20261102040000_submit_quiz_result_version_guard.sql` — **new, deployment-safety review
    round, item 2.** Goes further than #20: `submit_quiz_result` now writes NOTHING under any
    input, for any caller — not `personality_evidence` (already true from #20), and now not
    even the bare `quiz_results` history row #20 still wrote. Unconditionally raises a clear
    `UPDATE_REQUIRED: ...` exception after authenticating the caller (never a crash, never a
    generic permission-denied error) — the one remaining caller of this RPC is an
    already-installed pre-cutover client that has not yet updated; `submit_quiz_completion`
    is the one real, live submission path for every quiz, before AND after the V1 data reset
    (this guard is deliberately unconditional, not reset-date-gated). Proven via
    `run-submit-quiz-result-version-guard-test.mjs`, 11/11 checks passing (old client
    before/after reset, duplicate retries, current client unaffected, sharing/Compare
    unaffected for real completions) — see §3e/§4.

(Note: #6 and #7 [now #7/#8] were previously listed out of order relative to each other in an
earlier version of this document — corrected here to true chronological order; both verified
to have no dependency on one another. #12 [now #13]'s retroactive-reservation timestamp
behavior is itself superseded by #14 [now #15] — see §3's third-round fixes below.)

**Explicitly excluded, must NOT ship with this candidate set:**
`20261028080000_retire_legacy_pole_evidence_rpc.sql` — revokes client access to the legacy V1
pole-evidence RPC. Shipping it before every client is confirmed on the `submit_quiz_result`
reservation fix (#10 above) would silently stop evidence writes for any device still on an older
build. Lifting this gate requires its own separate, later owner review.

**Structurally (not merely informationally) isolated from this or any `supabase db push`:**
`supabase/manual_operations/20261102030000_clean_v1_prelaunch_data_reset.sql` — the one-time
clean V1 prelaunch DATA reset (item 1, §3e/§6). This file was MOVED out of
`supabase/migrations/` (deployment-safety review, item 1) specifically because the Supabase
CLI only ever scans `supabase/migrations/*.sql` for anything a push could touch — an
informational "gated" classification in a TypeScript bookkeeping list is advisory only and
was correctly flagged as an insufficient guarantee for a destructive, irreversible-without-a-
restore operation. It is now structurally unreachable by `supabase db push`,
`supabase migration list`, or `supabase db diff`, proven mechanically (this environment has no
`supabase` CLI installed to run a literal `--dry-run`) by `scripts/verify-reset-isolation.ts`.
Requires its own explicit, separate owner authorization and manual application (`psql`/the SQL
editor/`supabase db execute` targeted at this exact file), only AFTER the candidate set above
(including #1 and #21) is live. See `docs/BUILD_22_V1_RESET_INVENTORY.md` for the full
inventory, the atomic-cutover design (item 3), backup/rollback strategy, and post-reset
verification queries.

**Independent, unrelated to Build 22, awaiting their own separate sign-off (do not bundle with
this candidate set either way):** `20261022010000_analytics_events.sql`,
`20261022020000_push_notifications_schema.sql`, `20261022030000_creature_evolution_notification.sql`,
`20261022040000_schedule_push_notification_sends.sql`.

## 2. Pre-push checklist (engineering-side; does not substitute for owner review)

- [ ] `npx tsc --noEmit -p .` clean.
- [x] `npx tsx scripts/verify-migration-allowlist.ts` passes against the real linked project —
      already run successfully (deployment-safety review, 2026-11-03, see §1); re-run it again
      immediately before any real push, since the pending set can change between now and then.
- [ ] Every `scripts/pglite-harness/run-*.mjs` script passes (see §4 for the current list).
- [ ] `npx tsx scripts/validate-dimension-ids-frozen.ts` passes.
- [ ] No uncommitted changes to `scripts/lib/dimension-id-ledger.json` or
      `scripts/lib/content-id-ledger.json` beyond what this round intentionally added — both
      must be committed, never regenerated from nothing.
- [ ] ~~A fresh production snapshot for the historical-backfill cutover~~ — **SUPERSEDED,
      eighth round.** The owner's clean V1 reset decision ("we do NOT need to preserve
      obsolete beta quiz scores, historical quiz results, or old personality evidence")
      removes the need for a historical-backfill cutover of prelaunch data entirely. A
      pre-reset backup is still taken (see `docs/BUILD_22_V1_RESET_INVENTORY.md`), but its
      purpose is rollback safety for the reset itself, never a backfill source.

## 3. What this candidate set does NOT include (honest scope)

- **Creature publication is still local-only.** `creature_published_recipes`/
  `creature_evolution_cycle_markers` (migration #7 above) create the schema and its
  immutability guarantees, already proven under PGlite (`run-creature-immutability-test.mjs`).
  No publish RPC exists yet, and no client code reads from or writes to these tables —
  `you.tsx`/`creature-read.tsx` still use `creature-reveal-state.ts` (local AsyncStorage)
  exclusively. Cross-device Creature consistency is **not** delivered by this candidate set.
- **True concurrent-connection races are not literally reproduced, but the cutover's known
  conflict path now has an explicit, code-level mitigation beyond isolation alone.** Every
  correctness claim about "first completion wins the race" rests on a single Postgres mechanism
  (`INSERT ... ON CONFLICT` on a table's own PRIMARY KEY, the same pattern Postgres documents
  as race-safe under real concurrent connections) — not on anything this single-connection
  local harness can literally reproduce with two simultaneous connections. Separately
  (deployment-safety review, 2026-11-03, item 3): the reset's own `SERIALIZABLE` transaction
  means Postgres itself aborts any real completion that would otherwise interleave with it, and
  `submitQuizCompletion` (`src/services/quiz-result-service.ts`) now retries once, automatically,
  on exactly that abort (SQLSTATE `40001`), rather than only surfacing a bare failure to the
  user — so a submission that lands mid-reset self-heals instead of depending solely on the
  database refusing to corrupt it. This retry cannot be exercised by PGlite, which has no real
  concurrent-connection model; it is verified by code inspection only. Real verification of the
  underlying race (and of the retry firing under genuine concurrent load) requires the actual
  linked Supabase project — real, read-only linked-project migration comparisons were run this
  round (§1), but no concurrent-write load test was.
- **No staging environment distinct from the linked production project exists or was
  provisioned.** Every PGlite proof in this manifest runs against a hand-maintained stub mirror
  of the already-applied production schema, not a clone of the real database. A genuine,
  read-only comparison against the real linked production project was run this round (§1) —
  it confirms which migrations are actually pending there, but is not a staging clone and
  proves nothing about data already present in that database.
- **The placeholder Daily records in `run-engineering-candidate-set-apply-test.mjs` are a local
  smoke test only.** Two migrations in the candidate set (#6, #8) insert
  `daily_option_trait_awards` rows referencing real, pre-existing `daily_options.id` values.
  The PGlite test manufactures placeholder rows at those exact ids purely so the apply sequence
  can be proven end-to-end in isolation — this proves referential integrity of the migration
  SQL, **not** that the real production Daily content at those ids is itself correct, complete,
  or unchanged. Only a real run against the actual linked project can prove that.
- **As of the seventh round (2026-11-02), ZERO Private quizzes remain held/unmapped.** All 17
  registered Private quizzes (3 free previews, 14 premium, including both 18+-gated
  "Private Private" quizzes) now carry real, owner-approved content and real, server-activated
  Creature/Relic trait awards. `scripts/reconcile-held-quiz-evidence.ts` still exists and is
  still tested (`run-held-quiz-reconciliation-test.mjs`), but its scenarios now run against a
  fully SYNTHETIC fixture quiz (never real content, never QUIZ_REGISTRY) rather than any real
  quiz_key, since no real Private quiz is genuinely held any more to exercise it against. The
  mechanism (and its fail-closed forged-mapping validation) remains proven and ready for
  whatever FUTURE Private quiz is held pending its own approval.
- **All 17 Private quizzes (3 free previews: keep-you-around, be-so-serious, secretly-love;
  14 premium: love-soulmates-ready, love-soulmates-become, career-ambition-how-bad,
  career-ambition-proving, hidden-you-wrong, hidden-you-hide, shadow-side-hypocrisy,
  good-stuff-trust, life-match-dream-life, life-match-freedom, style-vibe-intimidating,
  style-vibe-attention, private-private-trouble, private-private-proof) are now APPROVED and
  ACTIVATED** — see §3b/§3d. This includes real, server-activated Creature/Relic trait awards
  (`scripts/lib/private-quiz-trait-awards.ts`), not merely a safeguard against future risk.
  Every quiz's quiz_key/question_key/choice_key identity was reused (or, for secretly-love,
  revived) per each source document's own instruction, after confirming no real production
  data exists under these keys (no migration from this entire engagement has ever been pushed
  to production) — see §3b/§3d for the full rationale. The content-version fingerprint guard
  (`scripts/lib/quiz-content-fingerprint.ts`) remains in place and active for any FUTURE
  revision of these now-real quizzes, or of any other quiz.

## 3a. Third-round fixes (2026-10-31, same day)

1. **Historical-completion timestamp preservation.** The second round's missed-record safety
   net (migration #12) retroactively reserved `user_quiz_completions` using this function's
   own `now()` rather than the historical row's real `completed_at` — an August 2025
   completion, discovered via an October 2026 retake, was wrongly reborn "active today."
   Migration #14 fixes this: the retroactive branch now preserves the historical row's REAL
   completed_at. Genuinely new completions are unaffected — still always server-trusted now().
2. **Held-quiz reconciliation now fails closed against the live database.** See above.
3. **Quiz result metadata validation.** `submit_quiz_completion` previously accepted an
   arbitrary `question_count`, an unbounded `score`, and any `result_id`/`result_title`, as
   long as the real submitted answers themselves were complete. Migration #13 adds a real
   (quiz, result_id, result_title) catalog mechanically derived from every quiz's own
   `resultBands`/`archetypes`/`whats-your-type` combinations; migration #14 makes
   `question_count` match the real catalog exactly, bounds `score` to `questionCount*3` (every
   real choice's flavor-score field across this codebase is in [0,3], confirmed directly), and
   rejects an unknown `result_id` outright — `result_title` actually stored is now ALWAYS the
   catalog's own approved title, never the client's, regardless of what the client sends.
4. **Quiz content-version safeguard.** See above.
5. **Clock-skew tolerance.** The second round's future-date rejection used an exact `now()`
   boundary, which could reject a legitimate submission from a client whose clock is merely a
   little fast. Migration #14 adds a 5-minute tolerance to both `submit_quiz_completion` and
   `submit_quiz_result`'s future-date checks — eligibility itself was already, and remains,
   server-controlled either way (never `p_completed_at`), so the tolerance only affects
   whether an honest submission is accepted, never what timestamp governs eligibility.

## 3b. Fourth-round changes (2026-11-01, V1 scope)

1. **Server-side result integrity (owner repro: Petty all-A claimed as score=24/
   mostly-unbothered).** `resolve_archetype_result` + real `flavor_score`/`quiz_choice_result_
   weights` summation now recompute every submission's actual score/percent/result_id
   server-side for all three scoring types, replacing the prior round's existence-only check.
2. **Access-tier/content-version inheritance.** `quizzes.access_tier`/`requires_age_
   verification`/`logical_quiz_key` replace the old hardcoded 7-quiz-key premium list and
   single age-gated key — a future content version inherits correct gating automatically from
   its own `QuizDefinition.access`/`category`, never a list someone has to remember to update.
3. **The four locked quiz replacements implemented and activated.** `love-soulmates-ready`,
   `career-ambition-how-bad`, `career-ambition-proving`, `hidden-you-wrong` now carry their
   owner-approved copy, verdict weights, gates/ties, and premium reveals verbatim from the
   locked documents, PLUS real server-activated Creature/Relic trait awards
   (`scripts/lib/private-quiz-trait-awards.ts`, 504 rows, directly transcribed from each
   document's own numeric trait IDs). No cap on awards per choice (some choices carry 4,
   confirmed by `validate-private-quiz-trait-awards.ts`); no contradictory same-dimension poles
   on any choice (same validator). **Important caveat on identity reuse:** each quiz keeps its
   original quiz_key/question_key/choice_key (q1-q10/a-d) per the documents' own instruction,
   rather than shipping under a new versioned key — verified safe because no production data
   has ever existed under these keys (their award-activation migration was never pushed to
   production in any prior round). This is a one-time, deliberate exception; the content-
   fingerprint guard's prior baseline for these 4 keys was reset accordingly
   (`scripts/lib/quiz-content-fingerprints.json`) and will fully re-protect them against any
   FUTURE revision.
4. **Configurable SQL scoring engine.** `quizzes.scoring_config` (JSON mirror of
   `ArchetypeQuizDefinition`'s opt-in `highSignalQuestionIds`/`resultGates`/`tieFallbackOrder`/
   `primaryTieWeight`/`finalTieQuestionId`/`countPrimaryMatchesTieBreak`) plus a rewritten
   `resolve_archetype_result` (now `plpgsql`, not `sql`) reproduce the FULL app-side tie-break/
   gate algorithm, not just the generic last-3-questions path — closing the exact scope gap
   20261101030000 had documented. Fuzz-tested against the real `scoring.ts` engine for all 20
   archetype-or-dualDimension quizzes (3,000 random answer sets each, 60,000 total
   comparisons, zero mismatches) — `run-configurable-scoring-engine-fuzz-test.ts`.
5. **Love's gate/tie values are a PROPOSED calibration, not owner-approved like the other
   three.** `LOVE_READY_APPROVED_LOCKED_2026-10-31.md` explicitly defers exact gate numbers to
   the implementing engineer and requires separate owner approval before release (its own rule
   10). The values shipped (`bae`/`walls` minSignals gates, high-signal questions, tie order)
   were calibrated and reachability-tested (100,000-path simulation: OPEN 43%, WALLS 21%,
   TERMS 18%, BAE 17%; all four reachable via coherent paths; a single stray harsh-result
   answer in an otherwise-clean profile does not trigger the gate) but are flagged here as
   **pending separate sign-off**, exactly as that document instructs.
6. **Legacy cross-version personality-evidence loophole fixed (item 7).** `submit_quiz_
   result`'s `v_is_first` flag governed the `personality_evidence` write independently of the
   cross-version `user_quiz_completions` check 20261101040000 added — a user completing
   content version A then legacy-submitting version B of the same logical quiz could earn a
   SECOND round of permanent evidence. Reproduced against the pre-fix migration set (2 writes)
   and proven fixed against the real post-fix set (1 write) —
   `run-private-quiz-activation-test.mjs`.
7. **Premium reveal UI unified.** `PrivateStructuredResult` (src/app/quiz/[quizId].tsx) now
   renders the full approved order — TITLE, THE VERDICT, THE PRIVATE READ, THE CALL-OUT, THE
   COST, TRY THIS, THE KICKER (+ separate italic signature), YOUR TRAITS — shared by every
   Private quiz using `structuredRead`, not a one-off. `QuizStructuredRead.theVerdict` is a
   new, optional field; every pre-existing structuredRead quiz (keep-you-around, be-so-serious,
   and the 3 still-held quizzes) never sets it and renders byte-identically to before.
   **Not verified on an iOS simulator or device in this pass** — see §5 blocker.

## 3c. Sixth-round changes and two flagged conflicts (2026-11-01, same day)

1. **life-match-dream-life and style-vibe-intimidating implemented and activated**, reusing
   the existing configurable scoring engine with ZERO new SQL migrations — confirming the
   engine built for the prior round's four quizzes generalizes without modification. Their
   gate/tie configuration was independently re-derived from each quiz's own locked document
   (`LIFE_MATCH_APPROVED_LOCKED_2026-11-01.md`, `STYLE_VIBE_APPROVED_LOCKED_2026-11-01.md`),
   not copied from the prior held draft: Life Match's draft gate letters already matched the
   new document exactly, but Style & Vibe's did NOT (its INTIMIDATING gate's Q4/Q5/Q7/Q8
   letters and its entire FACE gate list had drifted between content revisions) — rebuilt
   letter-for-letter from the document. Every outcome of both quizzes was confirmed reachable
   via the documents' own fixture answer paths, with exact winner match against the real
   `scoreArchetypeQuiz` engine (see §4a), and each quiz's own 50,000-trial random-distribution
   simulation independently reproduced the locked documents' own simulation numbers to within
   rounding (Life Match: FIT 58.8/13.3/19.5/8.4 vs the document's 58.81/13.12/19.41/8.66; Style
   & Vibe: 27.3/28.0/31.2/13.5 vs the document's 27.31/27.90/31.47/13.32) — strong evidence the
   transcription is faithful.
2. **FLAGGED CONFLICT — private-private-trouble was NOT implemented. RESOLVED 2026-11-02
   (see §3d).** The owner explicitly re-confirmed approval, updated the canonical approval
   index accordingly, and this round implemented private-private-trouble's final approved
   revision in full. This round's
   instructions stated all three remaining quizzes had "received editorial approval" and
   directed implementation of Private Private's "final owner-approved revision." The
   repository's own canonical approval index, `docs/private-quizzes/
   APPROVED_PRIVATE_QUIZZES.md` (updated 2026-11-01, i.e. more recently than this instruction
   was written), explicitly states the opposite for this one quiz: status **"REVISION IN
   PROGRESS — FINAL SPICIER REPLACEMENT NOT APPROVED,"** and explicitly warns: "Do not mistake
   the unapproved proposed replacement from November 1, 2026 for owner-approved content; do
   not implement it yet." No `PRIVATE_PRIVATE_TROUBLE_APPROVED_LOCKED_2026-11-01.md` (or
   similarly named) document exists anywhere in the repository, unlike the six quizzes that
   DO have one. The old `APPROVED_PRIVATE_PRIVATE.md` is explicitly downgraded by that same
   index to "historical source only until the owner approves a new replacement." There is
   therefore no document in the repository that is both (a) the final, intended Private
   Private replacement and (b) actually owner-approved. Per instruction ("if any necessary
   approved component is missing or contradictory, identify the exact issue instead of
   guessing" / "do not silently resolve approval conflicts by choosing your preferred
   version"), nothing about private-private-trouble was changed — its existing held content,
   age-gate, subscription-gate, and sharing-restriction behavior were verified intact and
   unmodified (see §7 of the original request this round answers), but no new copy, scoring,
   or trait mapping was authored or activated. **This needs explicit owner clarification**:
   either point to the actual approved document (if one exists outside this repository), or
   confirm the quiz remains unapproved for now.
3. **FLAGGED CONFLICT — item 4's described per-quiz award-qualification rule does not match
   the existing architecture. RESOLVED 2026-11-02 (see §3d).** The seventh round's explicit
   "FINAL PERSONALITY SCORING MODEL (LOCKED, NONNEGOTIABLE)" directive confirms: "ONLY THE
   ANSWER A USER SELECTS EARNS PERSONALITY TRAIT POINTS," with each answer's own explicit
   +1/+2/+3 mappings summed as raw evidence, no per-quiz top-N ranking or flattening step, and
   explicitly PROHIBITS "top-three/top-five completion awards" and "flattened +1/+2 completion
   awards." This resolves the conflict in favor of the existing, already-shipped direct
   raw-evidence mechanism described below — exactly what was preserved unchanged at the time.
   That round's instructions described: "A trait pole must
   accumulate at least 3 raw points within the quiz to qualify... Private quiz Core permanent
   awards: top 3 qualifying Core traits, +1 each. Private quiz Relic permanent awards: top 3
   qualifying Private traits, +2 each." No such per-quiz top-3/flatten-to-+1-or-+2 reduction
   exists anywhere in the codebase, in any of the six locked documents (every one of them
   specifies literal, varying +1/+2/+3 awards per specific answer, to be summed as raw
   evidence — not flattened to a uniform value after a ranking step), or in
   `submit_quiz_completion` as it has been implemented and approved across every round of
   this entire engagement (crisis, friendship, and all other already-shipped quizzes included
   — every one writes `quiz_choice_trait_awards.points` directly to `user_trait_evidence`,
   with no per-quiz ranking/qualification step). The ONLY matching pre-existing mechanism
   found is `src/data/personality-v2/totals-ranking.ts` — a PROFILE-WIDE (not per-quiz)
   ranking of `user_trait_totals` across every quiz/Daily a user has ever completed, with
   DIFFERENT real numbers: `ELIGIBILITY_THRESHOLD = 9` (not 3), `MAX_CORE_SIGNATURE_TRAITS = 7`
   (not 3), `MAX_PRIVATE_SIGNALS = 3` (matches Relic's "top 3," but not Core's), and
   proportional `earnedPercent`-based ranking rather than a flat +1/+2 per qualifying trait.
   That file was not touched this round and remains exactly as it was. Rather than build a
   second, per-quiz award-reduction mechanism that would contradict both the six locked
   documents' own notation and every already-shipped quiz's existing behavior (the explicit
   instruction was "do not build a second scoring engine"), the existing, already-approved
   direct raw-evidence-write mechanism was preserved and reused unchanged for both new
   quizzes. **This needs explicit owner clarification** on which description is correct.

## 3d. Seventh-round changes (2026-11-02): FINAL PRIVATE QUIZ IMPLEMENTATION

The owner's "APPARENTLY YOU: FINAL PRIVATE QUIZ IMPLEMENTATION" directive explicitly replaced
all previous implementation prompts, scoring guidance, approval requests, and superseded
requirements; confirmed all 11 described content changes as fully approved (including the
mature 18+ content); locked the final personality scoring model; and authorized full local
implementation now, without further editorial-approval rounds. Before implementing, this
round independently verified (read-only) that the canonical approval index
(`docs/private-quizzes/APPROVED_PRIVATE_QUIZZES.md`) and source pack
(`docs/private-quizzes/APPROVED_11_QUIZ_SOURCE_PACK_2026-11-02.md`) actually exist on disk,
that the Product Bible's scoring section now matches the real, pre-existing
`personality-v2/totals-ranking.ts` architecture exactly, and spot-checked that the quiz
content was byte-identical to what had already been reviewed — resolving the apparent
self-contradiction a prior, unapproved draft had raised.

1. **Three revised free Private previews implemented**: `keep-you-around` ("SO WHY DO PEOPLE
   KEEP YOU AROUND?"), `be-so-serious` ("BE SO SERIOUS RIGHT NOW."), and `secretly-love`
   ("WHAT DO PEOPLE SECRETLY LOVE ABOUT YOU?") — revived as an active free preview
   (`historicalOnly` removed, content fully rewritten). `be-so-serious` adds a sixth,
   deliberately ungated, zero-weight safety-net outcome ("MX") — see migration #18 above for
   the engine change this required.
2. **Final approved After Dark replacement implemented**: `private-private-trouble` ("How
   Much Trouble Are You After Dark? 😈") — the final owner-approved revision, replacing the
   previously-held content in place.
3. **Seven new premium quizzes implemented and activated**: `love-soulmates-become`,
   `shadow-side-hypocrisy`, `private-private-proof` (18+), `hidden-you-hide`,
   `life-match-freedom`, `style-vibe-attention`, `good-stuff-trust` ("The Good Stuff," the
   17th and final launch quiz). Each carries its full approved copy, verdict weights,
   eligibility gates, and real Creature/Relic trait awards, transcribed and verified cell-by-
   cell against the source pack.
4. **Six previously-approved premium quizzes re-verified**: `love-soulmates-ready`,
   `career-ambition-how-bad`, `career-ambition-proving`, `hidden-you-wrong`,
   `life-match-dream-life`, `style-vibe-intimidating` were confirmed still correctly
   implemented against their own separately-locked specs — no corrections were needed.
5. **Final registry: 17 playable Apparently Private quizzes (3 free previews, 14 premium)** —
   the stated final target, confirmed via `src/data/quizzes/index.ts`'s `QUIZ_REGISTRY` and
   `scripts/lib/canonical-quiz-order.ts`'s `CANONICAL_QUIZ_ORDER`.
6. **Engine extensions (migration #18)**: `finalTieQuestionId` now accepts a sequence of
   questions (string or string array, fully backward compatible); a plain archetype quiz's
   result "universe" is now sourced from `quiz_result_definitions` so an ungated, zero-weight
   safety-net result is discoverable. Both changes verified via the fuzz harness (zero
   mismatches across all 27 archetype/dualDimension quizzes) and the activation harness (zero
   regressions across the 13 pre-existing quizzes).
7. **Client wiring**: `src/app/(tabs)/private.tsx`'s `OPEN_PRIVATE_QUIZ_IDS` and
   `PREMIUM_PRIVATE_QUIZ_IDS` extended to the full 17; its age-eligibility gate (and
   `src/app/quiz/[quizId].tsx`'s `isShareRestricted`) now generalized to a
   `MATURE_PRIVATE_PRIVATE_QUIZ_IDS` list covering both `private-private-trouble` and
   `private-private-proof` identically, rather than a single hardcoded id.
8. **Two genuine content contradictions found in the locked source documents** (caught by
   `validate-private-quiz-trait-awards.ts`'s "no contradictory poles" check, confirmed against
   the literal source text — not transcription errors): After Dark source Q8A listed both
   "#55 Duty-first +1" and "#56 Self-preserving +2" (opposite poles of one dimension); initially
   resolved conservatively by dropping both conflicting entries — **RESOLVED differently, eighth
   round, per explicit owner decision**: keep #56 Self-preserving +2, drop #55 Duty-first +1
   (the answer describes going home to preserve capacity for tomorrow, which is
   self-preservation, not duty) — see §3e item 3. The Good Stuff source Q9 has two
   near-duplicate choices (A and B, same text, same `vault +2` mapping) — preserved verbatim as
   a flagged doc redundancy, not a scoring conflict, per "do not rewrite, soften, reorder, or
   reinterpret approved content."
9. **Scoring-model confirmation**: personality trait points come ONLY from
   `quiz_choice_trait_awards` rows tied to the exact selected answer, written by
   `submit_quiz_completion`/`submit_quiz_result` — no quiz-completion bonus, no result-derived
   award, no per-quiz top-N ranking exists anywhere in the codebase for any quiz, free or
   Private, old or new. `personality-v2/totals-ranking.ts` (profile-wide Signature/Undercurrent
   display ranking, `ELIGIBILITY_THRESHOLD=9`, `MAX_CORE_SIGNATURE_TRAITS=7`,
   `MAX_PRIVATE_SIGNALS=3`) was not touched — it only ever reads already-written evidence, it
   never grants points itself, and it already exactly matches the Bible's own scoring section.
   The 9 already-shipped free quizzes' (petty, crisis, era, etc.) existing per-answer award
   mechanism was deliberately left untouched — it already satisfies the answer-only model via
   the same `submit_quiz_completion` path every quiz uses, so no replacement mapping was
   invented for already-approved content.

## 3e. Eighth round (final cleanup, 2026-11-02/03): FINAL BUILD 22 CLEANUP AND V1 LAUNCH READINESS

The owner authorized a controlled, one-time clean V1 prelaunch data reset and a full
retirement of obsolete scoring pathways, superseding every earlier instruction requiring
preservation of/compatibility with obsolete prelaunch quiz data.

1. **Clean V1 database reset prepared and rehearsed**:
   `supabase/manual_operations/20261102030000_clean_v1_prelaunch_data_reset.sql` (STAGED, NOT
   APPLIED; **deployment-safety review, 2026-11-03: physically relocated** out of
   `supabase/migrations/` into `supabase/manual_operations/`, a directory the Supabase CLI
   never scans for `push`/`migration list`/`db diff` — a structural guarantee, not merely an
   informational "gated" bookkeeping entry; see `supabase/manual_operations/README.md` and
   `scripts/verify-reset-isolation.ts`, confirmed this round both by local filesystem check and
   by a genuine `supabase migration list --linked` against the real production project, which
   shows the file as entirely absent from the remote comparison). Removes old
   `user_quiz_completions`/`user_quiz_answers`/`quiz_results` (cascading `quiz_shares`/
   `compare_responses`), quiz-sourced `user_trait_evidence`/`personality_evidence` (Daily-
   sourced rows explicitly preserved via `source_type` filtering), the fully-retired
   `personality_pole_evidence`, and dependent Creature caches. Preserves `auth.users`/
   `profiles` (verified: no personality-derived fields exist on `profiles` to strip), the
   final approved catalog, and all unrelated operational data. Takes a full pre-delete backup
   into a dedicated `_reset_backup_20261102` schema inside the same `SERIALIZABLE` transaction,
   with a documented, exact rollback path. **Deployment-safety review, item 3:** that same
   transaction now also recalculates `user_trait_totals`/`user_trait_active_totals` from
   whatever `user_trait_evidence` remains and re-seeds `evidence_expiry_job_state`'s watermark —
   there is no longer a separate manual rebuild step and no window where the app could read
   stale pre-reset aggregates; `SERIALIZABLE` isolation means a real concurrent completion
   cannot silently interleave with it (aborted instead, and now retried once automatically by
   the client — see §3's update). Client-side, `CREATURE_EVOLUTION_SCHEMA_VERSION`
   (`src/data/creature/creature-reveal-state.ts`) was bumped 1→2 to invalidate the one
   genuinely sticky local Creature "first reveal" cache. Depends on
   `20261102040000_submit_quiz_result_version_guard.sql` (item 2 below) already being live, so
   an old client cannot recreate obsolete `quiz_results` rows before or after the reset. Does
   NOT touch `user_entitlements`/`tester_access_grants`
   at all — per instruction, TestFlight entitlements are real RevenueCat sandbox records, not
   something to assume-and-delete; inspection-only queries are provided in
   `docs/BUILD_22_V1_RESET_INVENTORY.md` for a separate, manually-reviewed owner decision.
   Rehearsed against an isolated PGlite instance seeded with representative pre-reset
   TestFlight data — `run-clean-v1-reset-rehearsal-test.mjs`, **27/27 checks passing**
   (was 24/24; the deployment-safety review round added 3 checks for the atomic-cutover
   guarantee), covering all required guarantees (old data removed, catalog intact, retake
   works, evidence awarded once, totals already correct immediately after the single
   transaction commits with no separate rebuild step, no stale shares,
   entitlements/Daily/accounts unaffected). The old-client version guard itself (before/after
   reset, duplicate submissions, sharing/Compare unaffected) is proven separately by
   `run-submit-quiz-result-version-guard-test.mjs`, 11/11 checks passing — see §4.
2. **Obsolete scoring logic retired.** Confirmed (by reading every call site) that
   `profileSignals`/`applyPermanentQuizAwards`/`quiz-personality-awards.ts` were already fully
   dead on the live submission path (computed, never sent) — deleted entirely, along with the
   now-pointless `src/services/legacy-quiz-backfill-service.ts` (its sole purpose, resyncing
   pre-V2 local-only history, is explicitly voided by the clean V1 reset decision) and the
   dead V2-pole-interim client path (`getMyPersonalityPoleEvidence`/`submitQuizPoleEvidence`/
   `toEnginePoleEvidenceRows`, zero live callers). The legacy `submit_quiz_result` RPC
   (`20261102020000_final_scoring_cleanup_and_v1_reset.sql`) now writes zero
   `personality_evidence` regardless of caller — an already-installed pre-cutover client
   fails safely (a normal response, never a crash) instead of writing stale evidence after
   cutover. `submit_quiz_completion` is confirmed the one, exclusively authoritative
   personality-evidence mechanism for every quiz — proven by
   `run-legacy-scoring-retirement-test.mjs`, 9/9 checks passing. Also removed 3 stale Build-16
   validator scripts (`validate-keep-you-around.ts`/`validate-be-so-serious.ts`/
   `validate-personality-dimensions.ts`) that tested editorial content superseded in an earlier
   round, and 6 one-off analysis/simulation scripts for the now-retired mechanism.
3. **After Dark Q8A contradiction resolved per explicit owner decision**: keep #56
   Self-preserving +2, drop #55 Duty-first +1 (see §3b item 8's update). Exact affected
   location: `scripts/lib/private-quiz-trait-awards.ts`'s `q('private-private-trouble', 'q8',
   'a', ...)` row. No other approved trait mapping was touched.
4. **`validate-private-library-content-fidelity.ts` rewritten** against the CURRENT locked
   documents (the prior version pointed at doc structures restructured out of existence
   earlier this engagement and crashed outright). Independently parses and diffs all 17
   quizzes' prompts, choice labels, and full reveal copy (verdict/read/call-out/cost/try-
   this/kicker/signature/traits) against four real heading/choice conventions found across
   the locked docs and the Nov-2 source pack, plus access/18+ classification. 1592/1592
   checks passing across 168 questions, 762 choices, 78 reveals — and in the process **found
   and fixed 9 genuine pre-existing transcription bugs**: a missing approved sentence in
   hidden-you-wrong's FACE reveal; a stray/missing emoji in 8 separate spots (hidden-you-wrong
   Q10, be-so-serious's CALL-OUT, private-private-trouble ×6); missing literal quote marks on
   career-ambition-proving Q1A; a missing "I say," prefix on hidden-you-hide Q9E. None of
   these affected scoring/trait-award correctness (verdict weights and numeric awards are
   independently validated elsewhere) — purely display-copy fidelity to the approved text.
5. **Mature-content release sequencing corrected** — see §1's correction and
   `run-mature-content-sharing-security-test.mjs` (16/16 checks, §4).
6. **378 scoring-matrix warnings investigated and classified**: 100% are stale wording-drift
   in `validate-quiz-pole-award-matrix.ts`'s legacy, non-authoritative Build-16/V2 calibration
   snapshot (confirmed tooling-only, never read by the live generator or runtime), concentrated
   exclusively in the 9 quizzes that have been through one or more owner-approved editorial
   revisions across this engagement (love-soulmates-ready, career-ambition-how-bad,
   career-ambition-proving, hidden-you-wrong, life-match-dream-life, style-vibe-intimidating,
   keep-you-around, be-so-serious, private-private-trouble) — zero warnings from any of the
   other 21 quizzes, whose wording has never changed since that snapshot was taken. **Zero
   represent a live scoring defect**: the real numeric trait-award data for all 9 affected
   quizzes is independently and repeatedly verified correct via
   `validate-private-quiz-trait-awards.ts`, the fuzz test, the fixture-reachability test, and
   the rewritten content-fidelity validator above — all passing. No code change was made in
   response; the warnings are an inherent, accepted tradeoff of keeping a historical
   structural-completeness check (award ranges, no-contradictory-poles, no-cap) running
   against content whose own "wording" field is expected to go stale after an editorial
   revision, exactly as this file's own header comment already documents.

## 4. Local verification already performed (PGlite, synthetic data only)

All of the following use synthetic, committed fixtures or fixtures generated at test-run time
with safe, fake UUIDs — never real user data. Run with `node scripts/pglite-harness/<file>`.

| Script | Proves |
|---|---|
| `run-engineering-candidate-set-apply-test.mjs` | **Extended, deployment-safety review.** All 21 candidate migrations (through #21, the version-guard migration; now also includes #1, the sharing-block migration, via a hand-written `quiz_shares` stub) apply cleanly, in chronological order, from scratch, in one isolated database; the gated migration is never touched; every expected table/function/index exists afterward. 50/50 checks passing (was 48/48). (Daily-content placeholder caveat: see §3.) |
| `run-end-to-end-identity-path-test.mjs` | The full narrative: quiz submission → permanent answers → evidence → active totals → Signature/Creature-eligibility inputs → retake (history-only) → new Daily occurrence → expiry (active changes, lifetime/unlocks intact) → offline retry (exactly-once) → a second independent read session. |
| `run-missed-historical-record-test.mjs` | The owner's exact repro of the historical-cutover failure, PLUS the third-round August-2025/October-2026 repro — the retroactive reservation now preserves the historical row's REAL completed_at, and `get_my_active_quiz_completions()` correctly excludes the 14-month-old quiz rather than reviving it. |
| `run-quiz-completion-timestamp-trust-test.mjs` | The owner's exact repro of a `2099-01-01` completion date — rejected outright; `user_quiz_completions.completed_at` is always server-trusted; old-date legacy-sync behavior unchanged; offline retries, first-completion permanence, and expiry boundaries all verified. |
| `run-clock-skew-tolerance-test.mjs` | **New (third round).** A client clock a couple of minutes fast is accepted (5-minute tolerance) on both submit RPCs; a wildly future date (2099) and a date just outside the tolerance are both still rejected; eligibility stays server-controlled even for an accepted slightly-ahead submission. |
| `run-quiz-completion-metadata-validation-test.mjs` | **New (third round).** The owner's exact repro (question_count=1, score=90000, fabricated result_id/title against 8 valid Petty answers) — now rejected outright; each of the four fabrications is also individually isolated and rejected; a legitimate submission is accepted and stores the catalog's real title, never the client's. |
| `run-held-quiz-reconciliation-test.mjs` | A held Private quiz earns zero evidence on completion (never fabricated) while still consuming the first-completion slot; the reconciliation script backfills evidence for first-completion answers only, never retakes, idempotently, with original timestamps preserved. **Third round:** a forged award export (a mapping absent from the live database) is now rejected outright — the generated SQL's own fail-closed validation aborts the transaction before anything is written. |
| `run-active-totals-backfill-test.mjs` | Historical backfill now initializes BOTH lifetime and active totals correctly across recent-only, expired-only, mixed, unrecoverable, and zero-earned users; idempotent reruns; original answers untouched. |
| `run-backfill-idempotency-test.mjs` | The quiz backfill script's generated SQL is idempotent and matches an independent **full-comparison** aggregation exactly (extra/missing/incorrect rows all checked explicitly — see §5 note below). |
| `run-totals-order-independence-test.mjs` | Quiz and Daily backfills produce identical totals regardless of apply order; active totals populated too. |
| `run-active-evidence-window-test.mjs` | Live submission writes both lifetime and active totals; expiry changes only active; lifetime/evidence rows untouched; idempotent. |
| `run-evidence-expiry-index-and-batch-test.mjs` | The new `created_at` index is actually used by the expiry job's realistic query plan (not a sequential scan); batch-correctness across hundreds of users via full-comparison (extra/missing/incorrect, not an inner join); a backdated row's expected outcome is checked explicitly, not merely "didn't error." |
| `run-legacy-completion-reservation-test.mjs` | The legacy `submit_quiz_result` fix reserves first-completion credit across mixed-version clients, delayed offline uploads, retries, cross-function races, and already-completed quizzes. |
| `run-active-activity-counts-test.mjs` | ROOM_ONLY exclusion and the 12-month active window for Daily/quiz activity counts; a retake never renews an expired completion back into the window. |
| `run-quiz-scoring-tests.mjs` / `run-daily-scoring-tests.mjs` | Core numeric scoring correctness (pre-existing, re-verified). |
| `run-creature-immutability-test.mjs` | `creature_published_recipes` rejects UPDATE/DELETE even as superuser. |
| `run-legacy-rpc-revoke-test.mjs` | The gated migration's revoke actually removes EXECUTE from `anon`/`authenticated`. |
| `run-quiz-result-scoring-verification-test.mjs` | **Fourth round.** The owner's exact Petty repro (score=24/mostly-unbothered rejected, real 12/50/selectively-petty accepted); score-only manipulation rejected; archetype clean win + manipulated-result rejection + a genuine tie resolved correctly; dualDimension both-axis verification. Re-run through 20261101050000 as a regression check — byte-identical outcomes against the new configurable engine. |
| `run-quiz-content-version-authorization-test.mjs` | **Fourth round.** The owner's exact synthetic `love-soulmates-ready-v2` repro (unauthorized submission accepted) — now rejected; accepted with entitlement; first-completion identity continuity across versions (updated this pass: the original quiz now legitimately earns real evidence since its activation, so the invariant checked is "v2 adds zero ADDITIONAL evidence," not "zero evidence ever"); regression safety for free/age-gated quizzes. |
| `run-configurable-scoring-engine-fuzz-test.ts` | **Extended seventh round** (now also loads migration #18; iterates `QUIZ_REGISTRY` generically, no code change needed for new quizzes). Fuzz-tests `resolve_archetype_result` against the real `scoring.ts` engine — 3,000 random answer sets per quiz, all 27 archetype/dualDimension quizzes (every quiz in the final 17-quiz Private catalog plus every free/dualDimension quiz), zero mismatches on winner/total/total_points. Run with `npx tsx`. |
| `run-private-quiz-activation-test.mjs` | **Extended seventh round** (now also loads migration #18). `PRIVATE_QUIZ_KEYS` covers all 14 premium quizzes (was 6) — 118 checks (was 52). Both `private-private-trouble` and `private-private-proof` are explicitly double-gate-tested: an entitled-but-unconfirmed-18+ user is rejected (entitlement never substitutes for age), and `requires_age_verification` is asserted true specifically for those two ids, false for the other 12. Same core guarantees otherwise: access enforcement via both RPC paths, multi-award correctness immune to a bogus client argument, retake/duplicate-credit safety, history preservation. |
| `validate-private-quiz-trait-awards.ts` | **Extended seventh round.** Structural validation of all 2426 hand-transcribed award rows across all 17 Private/free-preview quizzes: trait_id/points ranges, no duplicates, no contradictory same-dimension poles on one choice, no 2/3-award cap, sparse (zero-award) choices preserved. `totalRealChoices` is now computed dynamically from `QUIZ_REGISTRY`'s real per-quiz question/choice counts rather than a hardcoded formula (broke once 5-choice and 8-question quizzes were introduced this round). **Caught a second genuine content-authoring bug**: After Dark source Q8A lists both poles of one dimension ("#55 Duty-first +1", "#56 Self-preserving +2") on one choice — neither conflicting entry is awarded for that cell; see §3d item 8. |
| `run-held-quiz-reconciliation-test.mjs` | **Updated seventh round.** Every real Private quiz is now activated, so its HELD_QUIZ_KEY fixture (scenarios 1-6) was swapped from a real quiz_key to a fully synthetic one (`synthetic-held-quiz-reconciliation-fixture`), mirroring the exact synthetic-fixture pattern scenario 7's forged-export case already used. All 23 guarantees re-verified passing against the synthetic fixture. |
| `run-quiz-pole-award-matrix` (`validate-quiz-pole-award-matrix.ts`) | **Rescoped seventh round.** This legacy Build 16/V2 calibration-snapshot validator (tooling-only; not read by the live generator or any runtime path) was hardcoded to exactly 21 playable quizzes — now scoped to the fixed set of quizzes it actually tracks (its own map keys), since quizzes added after it was superseded as the live source of truth were never retrofitted into this older format. 0 structural failures (378 pre-existing wording-drift warnings as of the eighth round's own investigation — see §3e item 6 — unrelated to this round, left for a future editorial pass). |
| `run-legacy-scoring-retirement-test.mjs` | **New, eighth round (final cleanup).** Proves the legacy `submit_quiz_result` RPC (20261102020000) writes ZERO `personality_evidence` rows even when called with a full, otherwise-valid legacy `p_profile_effects` payload, while still succeeding and still writing `quiz_results` history (an old pre-cutover client fails safely, never crashes); a retake through the same legacy RPC is also still safe; the real `submit_quiz_completion` path is completely unaffected. 9/9 checks passing. |
| `run-mature-content-sharing-security-test.mjs` | **New, eighth round (final cleanup), item 5.** Proves the staged sharing-block migration (20261021150000) end-to-end via the REAL `create_quiz_share`/`get_shared_quiz_result` RPCs directly — never the client's own `isShareRestricted` check. Covers both mature quizzes: a direct RPC bypass attempt is rejected even for the legitimate completion owner; a pre-existing (retroactive) share row is unreadable via the fully anonymous `/s/[token]` landing; an entitled-but-not-18+ user and an 18+-but-unentitled user are each independently rejected at submission before a share could even be attempted; an ordinary non-mature quiz remains completely unaffected (still shareable, still anonymously readable). 16/16 checks passing. |
| `run-clean-v1-reset-rehearsal-test.mjs` | **Extended, deployment-safety review.** Rehearses the clean V1 prelaunch data reset (now `supabase/manual_operations/20261102030000_...`) against an isolated PGlite instance seeded with representative pre-reset TestFlight data (a real quiz completion with real trait evidence AND a real pre-reset aggregate total, a Daily answer, a share + Compare response, a sandbox RevenueCat entitlement row, a tester-access grant, a retired V2-pole-evidence row, a Creature trait marker) — then applies the version-guard migration and the real reset, and verifies all required guarantees including the **atomic-cutover proof**: tester A's lifetime total is already zero immediately after the single transaction commits, with no separate rebuild step, then correctly non-zero again after a post-reset retake. 27/27 checks passing (was 24/24). |
| `run-submit-quiz-result-version-guard-test.mjs` | **New, deployment-safety review, item 2.** Proves the legacy `submit_quiz_result` RPC (20261102040000) unconditionally rejects every call with `UPDATE_REQUIRED: ...` and writes zero `quiz_results` rows — before the reset, after a simulated reset, on repeated retries, and identically either way — while `submit_quiz_completion` (current-client path) and sharing/Compare for a real completion are completely unaffected. 11/11 checks passing. |
| `validate-private-library-content-fidelity.ts` | **Rewritten, eighth round (final cleanup), item 4.** Independently parses and diffs all 17 Private quizzes' prompts, choice labels, and full reveal copy against the current locked documents (four real heading/choice conventions) plus access/18+ classification — no comparison derived from the implementation itself. 1592/1592 checks passing across 168 questions, 762 choices, 78 reveals; found and fixed 9 genuine pre-existing transcription bugs (a missing approved sentence, 8 wrong/missing emoji, missing literal quote marks, a missing "I say," prefix) — see §3e item 4. |

`npx tsx scripts/validate-dimension-ids-frozen.ts` proves dimension/trait numeric ids survive a
simulated reorder AND insertion of `PERSONALITY_DIMENSIONS` unchanged; that the catalog
migration on disk matches what the ledger-backed generator produces today; that the REAL
client-side module (`numeric-trait-catalog.ts`) and both historical backfill generators
(`backfill-quiz-pole-evidence.ts`, `backfill-daily-pole-evidence.ts`) all resolve ids through
the same ledger, with the latter two structurally unable to depend on array order at all
(neither imports `PERSONALITY_DIMENSIONS` anymore).

`npx tsx scripts/validate-quiz-content-fingerprint-guard.ts` (**new, third round**) proves the
content-version safeguard against the real guard functions: a brand-new quiz_key records a
baseline; identical content regenerates without error; content that changes meaning under an
EXISTING quiz_key (using the real old/new Love q1:a text as fixture data) is refused outright;
the same revised content under a NEW, versioned quiz_key succeeds with its own fresh identity,
leaving the old quiz_key's baseline untouched.

**Test-rigor note (second round, item 5):** every cross-check in this suite that compares a
maintained table against an independently-aggregated expectation now uses a `FULL OUTER JOIN`
(or equivalent full comparison), explicitly asserting zero extra rows, zero missing rows, and
zero incorrect rows as three separate checks. An earlier version of two such checks used an
`INNER JOIN`, which silently ignores a row present on only one side — a real false-pass risk.
Both were found and fixed this round; a third check that passed merely because an expected row
was absent (rather than checking its specific expected value) was also found and fixed.

## 5. Remaining blockers before this can ship

1. **Owner review and explicit authorization** of the candidate set in §1, in that exact order,
   against the real linked project. A genuine, read-only dry-run comparison against that
   project was run this round (§1) and confirms exactly what is pending — that comparison is
   not itself authorization to push anything.
2. **Real-device verification** of the legacy `submit_quiz_result` reservation fix (#10) against
   an actual older TestFlight build, before `20261028080000` (the gated RPC retirement) is ever
   considered for its own separate review.
3. **Creature publication** (§3) requires its own scoped implementation pass — a publish RPC
   plus client read/write wiring — before cross-device Creature consistency can be claimed.
4. **Real concurrent-connection testing** against the actual linked project for the first-
   completion race and the expiry/submission/reset interleaving — this round's proof is
   mechanism-level (SERIALIZABLE isolation plus a client-side retry-once on the resulting
   `40001`), not a literal two-connection reproduction. A genuine read-only linked-project
   migration comparison was run this round (§1), but no concurrent-write load test was.
5. **SUPERSEDED, eighth round.** A historical-backfill production snapshot is no longer
   needed — the owner's clean V1 reset decision means obsolete prelaunch data is deleted, not
   backfilled/preserved. See items 12-13 below for what replaces this.
6. **RESOLVED 2026-11-02.** Private-private-trouble's mapping is no longer held — the
   seventh round implemented its final owner-approved revision in full (§3d). No Private quiz
   remains genuinely held; `scripts/reconcile-held-quiz-evidence.ts` is tested against a
   synthetic fixture only, ready for whatever future quiz needs it.
7. **RESOLVED 2026-11-02.** Love's (`love-soulmates-ready`) gate/tie-break values were
   re-verified this round against its own separately-locked spec as part of the "six
   previously-approved quizzes" recheck (§3d item 4) — no inconsistency found, no correction
   needed. The owner's seventh-round directive also explicitly states all editorial approvals
   (including previously-shipped quizzes' own locked specs) are final and not to be
   re-requested.
8. **RESOLVED 2026-11-02.** Private Private's replacement status is clarified — the owner
   explicitly re-confirmed approval and updated the canonical index; `private-private-trouble`
   is implemented, and a second 18+ quiz, `private-private-proof`, is newly approved and
   implemented alongside it (§3d).
9. **RESOLVED 2026-11-02.** The per-quiz Core/Relic award-qualification question is settled
   by the seventh round's own explicit "FINAL PERSONALITY SCORING MODEL (LOCKED,
   NONNEGOTIABLE)" directive, which confirms the existing direct raw-evidence mechanism (no
   top-N ranking, no flattening) as final (§3d item 9).
10. **No iOS simulator or device verification of the new premium reveal UI**, including the
    seventh round's 8 newly implemented/revised quizzes. The shared `PrivateStructuredResult`
    component was type-checked (`tsc --noEmit`) and manually reviewed against the approved
    section order, but not visually confirmed on-device — this environment has no running
    simulator. See the release-readiness checklist below for the exact on-device rehearsal
    needed before submission.
11. **No real-device or staging-backend performance measurement was possible in this
    environment** (startup speed, tab switching, Creature/Relic load times, offline recovery,
    purchase/restore flows, backend concurrency under load). Nothing in this round's changes
    touches data-fetching, caching, or retry logic — the content/scoring/UI changes are
    additive and structurally cannot introduce a new duplicate-fetch or blocked-interaction
    regression — but that is a structural argument, not a measurement. See the checklist
    below.
12. **Owner review and explicit, SEPARATE authorization of the clean V1 prelaunch data reset**
    (`supabase/manual_operations/20261102030000_clean_v1_prelaunch_data_reset.sql`, §3e item 1,
    `docs/BUILD_22_V1_RESET_INVENTORY.md`) — rehearsed locally (27/27 checks) but NOT executed
    anywhere. This is a one-time DATA operation, now structurally (not merely informationally)
    isolated from the schema candidate set, confirmed by both a local filesystem check and a
    real linked-project comparison (§1) — and requires its own authorization distinct from
    §1's, applied only via manual `psql`/SQL-editor/`supabase db execute`, never `db push`.
13. **Owner review of `user_entitlements`/`tester_access_grants`** against the real linked
    project (inspection queries in `docs/BUILD_22_V1_RESET_INVENTORY.md`) before deciding
    whether any entitlement/tester-access cleanup is warranted — per instruction, this is
    explicitly NOT auto-decided and NOT bundled into the reset above.
14. **Real-device verification of the retired legacy scoring paths** — confirm an
    already-installed pre-cutover TestFlight build, if any still exist among current testers,
    genuinely degrades gracefully (no crash, no error toast) when its background sync code
    calls the now-neutered `submit_quiz_result`, before and after the V1 reset is applied.
    This round's proof (`run-legacy-scoring-retirement-test.mjs`) is PGlite-level, not a
    literal old-binary-on-a-real-device reproduction.

## 6. Release-readiness checklist (App Store submission target: 2026-11-04, contingency 2026-11-06)

**What this round verified (PGlite + tsc + fuzz-testing, all green):** scoring correctness for
all 17 Private quizzes (exact app/server parity, gates, ties, boundary/randomized paths),
access/age enforcement through both RPC paths for all 14 premium quizzes (including both
18+-gated quizzes double-gate-tested independently), retake/duplicate-credit safety,
trait-award correctness and no-cap/no-contradictory-poles, migration apply order, zero
regressions across every free/dualDimension quiz. None of this requires a device.

**What still needs an actual iOS simulator/device + the real linked Supabase project before
submission — this environment can state the plan but cannot execute it:**

- [ ] Run all 17 Private quizzes start-to-finish on a real device (8 of them new or revised
      this round); confirm the premium reveal renders the full TITLE → THE VERDICT → THE
      PRIVATE READ → THE CALL-OUT → THE COST → TRY THIS → THE KICKER+signature → YOUR TRAITS
      order, legibly, in both light/dark and with Reduced Motion on.
- [ ] Startup speed, tab switching, and quiz-transition responsiveness — measured with Xcode
      Instruments or React Native's own perf monitor, not estimated.
- [ ] Creature and Relic load times on a real/throttled network.
- [ ] Cache/retry behavior and offline recovery for a quiz submission made mid-flight.
- [ ] No duplicate submissions possible from a double-tap on the quiz result CTA (review the
      submit button's own disabled-while-pending state — not changed this round, but worth a
      real-device confirmation given eight new/revised quiz flows now exercise it).
- [ ] Ads, purchases/restores, and account deletion flows, specifically re-confirming all 14
      premium quizzes correctly gate/ungate alongside an active Apparently Private purchase
      and its restore, and both 18+ quizzes additionally require confirmed adult eligibility.
- [ ] Accessibility pass (VoiceOver/Dynamic Type) on the new/revised reveal screens
      specifically.
- [ ] Real concurrent-connection check against the actual linked Supabase project (§5 item 4) —
      still mechanism-level only (SERIALIZABLE + client retry-once), never literally reproduced
      with two simultaneous connections or genuine concurrent write load.
- [ ] Confirm the sharing-block migration (§1 item 1, now part of the real candidate set, not
      the independent list) against the real linked project before it is ever pushed — it
      covers both `private-private-trouble` and `private-private-proof`.
- [ ] Review `docs/BUILD_22_V1_RESET_INVENTORY.md`'s inspection queries against the real
      `user_entitlements`/`tester_access_grants` tables before deciding on any entitlement/
      tester-access cleanup (§5 item 13) — separate from, and not required for, the data reset.
- [ ] If and when the clean V1 reset is authorized: take the pre-reset backup, apply
      `supabase/manual_operations/20261102030000_clean_v1_prelaunch_data_reset.sql` manually
      (never `db push`) — the reset's own single transaction now does the
      `user_trait_totals`/`user_trait_active_totals` recalculation atomically, no separate
      follow-up script needed — and run the post-reset verification queries in
      `docs/BUILD_22_V1_RESET_INVENTORY.md` against the real project. This environment has only
      rehearsed this against synthetic PGlite data, never executed it for real.

## 7. Next concrete action

All prior open editorial/approval questions (§5 items 6-9) are resolved as of the seventh
round — the full 17-quiz Private catalog (3 free previews, 14 premium) is implemented,
owner-approved, locally tested, and the final scoring model is locked. The eighth (final
cleanup) round retired every obsolete scoring pathway, resolved the After Dark Q8A
contradiction, rewrote the content-fidelity validator (catching and fixing 9 real bugs),
corrected the mature-content release sequencing, and prepared + locally rehearsed a clean V1
prelaunch data reset. The deployment-safety review round (2026-11-03) then corrected three
deployment-safety gaps in that reset plan (physical isolation, an old-client version guard,
and an atomic cutover with a concurrent-submission retry) and ran a genuine read-only
linked-project migration comparison. With the engineering work complete and fully tested
locally, the next concrete milestones toward TestFlight/App Store submission are:

1. **The on-device rehearsal** in §6 above — this environment has no iOS simulator or device,
   so none of it has been executed yet, only planned.
2. **Owner review and explicit authorization** of the 21-file candidate migration set in §1,
   in that exact order. A genuine, read-only `supabase db push --linked --dry-run` against the
   real linked production project (`apparently-you`, ref `rjslgjxlpsjljbrlxfet`) confirms these
   21 files, plus the 1 gated and 4 independent files, are exactly what is currently pending
   there, with zero unknowns — this comparison is not itself a push or an authorization.
3. **Separately, owner review and explicit authorization of the clean V1 prelaunch data
   reset** (§5 items 12-13) — its own distinct decision, never bundled with #2, and only ever
   applied (manually, never via `db push`) after #2's candidate set is live.
4. Once all three check out, proceed to the remaining real-infrastructure items in §5 (a
   genuine concurrent-write load test, Creature publication scoping) before a production push.
   Never a production migration, reset, backfill, deployment, TestFlight build, or App Store
   submission from this environment — none of which this round was authorized to perform.

**Note (2026-11-07):** §1-§7 above predate several later rounds (commits through `9b46b0b`)
that superseded parts of this plan without a full rewrite here — the candidate set is now 22
files, not 21 (see `supabase/release-manifest.json`, the current authoritative source); the
prelaunch reset became a full consumer wipe plus a separate obsolete-beta-content cleanup,
both staged in `supabase/manual_operations/` and rehearsed against the real production
snapshot; and all 62 approved canonical Dailies now pass a dedicated content-vs-specification
validator. §8 below is this round's own account and does not re-litigate any of that — see
`git log` for the intermediate history if reconstructing the full chain matters.

## 8. Ninth round (2026-11-07): Build 22 crash diagnostics and deployment readiness

Scope: fix the migration safety script's own drift risk, verify real (not just local-`.env`)
crash-reporting configuration, investigate both owner-reported crashes beyond the completion
ad, and determine Build 22's actual deployment readiness and backend-compatibility path. No
Daily content was reopened — the content validator and full rehearsal from the previous round
stand unchanged.

### 8a. Migration safety script — fixed and verified

An independent inspection correctly found `scripts/safe-migration-push.sh` hardcoded its own
copy of the excluded-files list and a stale "exactly 21" count, which had drifted the moment a
22nd engineering migration (`20261106010000_admin_activate_approved_daily_for_rotation.sql`)
was added — nothing forced that script and `scripts/verify-migration-allowlist.ts` to agree.

Fixed by introducing `supabase/release-manifest.json` — the one authoritative, version-
controlled manifest (generated by `scripts/generate-migration-manifest.ts`) — listing all four
buckets (22 engineering, 4 independent, 1 gated, 5 Daily content-ops) with a sha256 of each
file's exact content, plus `expectedProjectRef` and `lastRehearsedCommit`. Both scripts now
read ONLY this file:

- `verify-migration-allowlist.ts`: verifies every listed file's content hash, verifies the
  linked Supabase project ref matches, reports whether HEAD matches `lastRehearsedCommit`,
  then runs the existing read-only `supabase db push --remote --dry-run` categorization. Ran
  for real against the actual linked project (`apparently-you`, `rjslgjxlpsjljbrlxfet`): all
  32 manifest files hash-verified, project ref matched, HEAD matched `lastRehearsedCommit`
  (`9b46b0b`) exactly, and the dry-run confirmed exactly the 22 engineering + 4 independent + 1
  gated files are pending there, zero unknowns.
- `safe-migration-push.sh`: reads the same manifest via `jq` (no hardcoded list anywhere),
  verifies file hashes before touching anything, verifies the linked project ref, verifies (or
  warns on) the release commit, then excludes the gated/independent files, confirms the real
  dry-run's pending set is EXACTLY the 22 engineering filenames in the manifest's exact order
  (not just a count), and restores the excluded files via a trap on `EXIT INT TERM HUP`. New
  `--apply-daily-content` mode applies the 5 Daily content-ops files via the real
  `supabase db query --remote --file`, separately from the engineering push, stopping on the
  first failure rather than continuing into an unknown partial state.
- **Found and fixed two real bugs while testing, not assumed working:** (1) `--linked` is
  deprecated (removal in CLI v4) — switched both scripts to `--remote` throughout. (2)
  `mapfile` is a bash-4+ builtin; macOS ships bash 3.2, so the original rewrite failed
  immediately with `mapfile: command not found` — replaced with a portable
  `read_lines_into` helper. (3) Sent a real `SIGTERM` mid-run to prove the restore trap
  actually fires on a signal, not just normal exit — confirmed restoration happens, but is
  deferred (standard, unavoidable POSIX behavior) until a slow foreground network call already
  in flight returns; documented this honestly in the script's own header rather than
  overclaiming instant recovery, and noted the one signal no trap can ever catch (`SIGKILL`).
- A full dry-run was executed for real: confirmed the exact 22-file engineering candidate set,
  in order, with the 5 gated/independent files correctly excluded then restored. **No
  production migration was applied** — only `--dry-run` and the read-only verify script ran.

### 8b. Crash-reporting configuration — verified against the real EAS environment, not just `.env`

The previous round's report was wrong: it checked only `src/services/observability.ts` and
local `.env.local` and concluded `EXPO_PUBLIC_SENTRY_DSN` was unset. Checking the REAL EAS
environment (`npx eas-cli env:list production`) found it IS configured there, along with
`SENTRY_AUTH_TOKEN` (secret, builder-only), `SENTRY_ORG=super-great-ventures`, and
`SENTRY_PROJECT=apparently-you`. No value was displayed or requested — `env:list`'s default
output masks sensitive/secret variables; only variable NAMES and presence were confirmed.

- `eas.json`'s `testflight` build profile `extends: "production"` and sets no competing
  `environment` field, so it inherits this exact EAS environment scope, DSN included.
- `src/services/observability.ts` already sets `release: apparently-you@${version}+${buildNumber}`
  and `dist: buildNumber` from `Constants.expoConfig` — a captured event would be traceable to
  the exact binary (version 1.0.0, build 22) that produced it.
- `ios/` is gitignored AND `.easignore`d (confirmed: it is a local `expo run:ios` simulator
  artifact, never a real EAS build input) — the real build uses Expo's managed/CNG path, so
  the `@sentry/react-native` Expo config plugin (already in `app.json`'s `plugins`) is the
  correct, standard integration; it auto-wires native dSYM/source-map upload during the real
  EAS build using `SENTRY_AUTH_TOKEN`/`SENTRY_ORG`/`SENTRY_PROJECT` from this same environment.
- Privacy guardrails in `observability.ts` (`sendDefaultPii: false`, `attachScreenshot: false`,
  no session-replay integration, breadcrumb/event scrubbing) are unchanged and were not
  touched this round — no user answers, photos, personality content, or credentials are ever
  sent.
- **Not claimed as active monitoring**: configuration is real and strongly supports working
  crash capture for Build 22, but no event has actually been captured and observed in the
  Sentry dashboard — that requires a real build on a real device, neither available here.
  Until then, this is "correctly configured," not "verified operating." The supported
  fallback/complement that works with zero additional configuration: Xcode Organizer →
  Crashes (physical device, build installed via Xcode or TestFlight) and TestFlight's own
  crash log export in App Store Connect, both of which read Apple's native crash reports
  independent of Sentry.

### 8c. Public quiz crash — investigated beyond the completion ad

Reviewed the full question-answering workflow, not just quiz completion: `goNext`/`goBack`/
`selectAnswer` in `src/app/quiz/[quizId].tsx` are plain `setState` calls with no heavy
computation; the background decorations rendered on every frame (`PortalRings`,
`CelestialWash`) are a handful of plain `View`s with no SVG/blur/gradient library, not a
plausible per-render cost; `useEffectivePremium`/`useAdEligibility` read already-resolved
global snapshots (no RevenueCat/network call per render, confirmed via `purchases-service.ts`'s
`configuredOnce` guard); app-startup work in `src/app/_layout.tsx` (Sentry init, notifications,
RevenueCat init, anonymous-session bootstrap) is fully async/fire-and-forget and gated to run
once per onboarding-complete transition, not on quiz navigation; the `AppState` foreground
listener only re-fetches cached RevenueCat customer info, not a blocking call.

**No in-code root cause for slowness specifically during active answering was found.** The
AdMob interstitial at completion (`quiz/[quizId].tsx:252`) remains a real, named candidate for
a crash AT completion, but — as correctly pointed out — cannot explain slowness earlier, while
still selecting answers. Distinguishing an actual termination from a navigation/auth-session
reset, and finding any render-count/memory-growth issue invisible to static review, requires
real device profiling (Xcode Instruments Time Profiler + Allocations) against a physical
build — not available in this environment. Reported as genuinely unverified, not fixed.

### 8d. Creature saving — investigated beyond the asset-size guess

Traced the actual render path: `CreatureAvatar` → `CreatureTestComposer` → `expo-image`
`<Image>` components, each `source` a direct `require()` of a per-variant SVG file under
`assets/creatures/` (confirmed in `src/data/creature-test/creature-test-assets.ts`) — body,
tail, wings, ears/horns, and eyes are five SEPARATE large SVGs rendered simultaneously at a
calibrated 1700×1700 logical-pixel composition (`creature-avatar.tsx`'s own comment); several
sampled files are individually 4-8MB of vector path data (`apparently_you_strong_wings.svg`
7.75MB, `apparently_you_grounded_ears_horns.svg` 5.45MB, etc.) — real, complex artwork, not
icon-sized SVGs. `saveCreatureImageFromRef`/`shareCreatureImageFromRef`
(`src/services/save-creature-image.ts`) both call `captureRef(viewRef, { format: 'png',
quality: 1 })` on a dedicated export card containing this same five-layer composition — meaning
view-shot must rasterize all five large vector layers a SECOND time, at full quality, on
demand, every single Save/Share tap (no caching of a previous capture; `uri` from
`captureRef` is used immediately and not deleted or reused by this code, so three consecutive
exports create three independent temporary rasterizations run back-to-back, not reused).

This is a concrete, well-evidenced candidate for both "peak memory" and "export duration": five
simultaneous large/complex SVG rasterizations for ordinary display, PLUS a second full-quality
rasterization pass specifically at Save/Share time. It is still a candidate, not a proven root
cause — per instruction, no blind fix was made. The specific, measurable verification this
needs: Xcode Instruments' Allocations/Memory Graph while (a) opening the Creature preview, (b)
tapping Save three times consecutively, (c) backgrounding and foregrounding, (d) switching
tabs repeatedly — exactly the physical-device steps in §8f below. If confirmed, the lowest-
risk, fidelity-preserving mitigation is a BUILD-TIME step that pre-rasterizes each approved SVG
variant to a fixed-resolution PNG (visually identical at the composition's own calibrated size,
never a quality reduction) rather than any runtime/approval-affecting change — not implemented
this round, since implementing it without a real measurement to confirm or size the win would
violate the explicit instruction to measure before changing anything.

Note on the QA script's "seven visual parts" (§8f below): the current production recipe is
five slots (body, tail, wings, earsHorns, eyes) per `creature-test-assets.ts` and
`creature-avatar.tsx`'s own "5-slot" comment — stated as found, not reconciled or guessed at,
since resolving which is correct is a real-device/product question, not a code question.

### 8e. Build 22 — actual status

- **Git**: current branch `feature/private-library-implementation`, HEAD `9b46b0b` (unchanged
  this round except for the migration-safety-script commit that follows this report).
  `app.json`: `version 1.0.0`, `ios.buildNumber "22"`.
- **EAS build history** (`eas-cli build:list --platform ios`): the real TestFlight binary
  currently live is build **21** (two builds share that number: `0c4ecf0d…` from commit
  `6bf6346`, and an earlier `74d6c463…` from `8b8fb753`). **Build 22 has never been built** —
  confirmed by listing, not assumed; there is no conflict in reusing it.
  `6bf6346` ("Use official AdMob test IDs for TestFlight EAS profile") IS an ancestor of
  current HEAD — every engineering migration, Daily content fix, and this round's safety-
  script work is NEW relative to what Build 21 shipped with.
- **Sentry**: configured in the real EAS `production` environment (§8b) — not yet
  build-verified.
- **AdMob**: `testflight` profile overrides both ad-unit env vars to Google's own published
  universal TEST ad unit IDs (`ca-app-pub-3940256099942544/…`) — Build 22 QA will exercise the
  real AdMob SDK/interstitial path end-to-end, but never serve a real/billable ad, exactly as
  intended for pre-launch testing.
- **RevenueCat**: `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` present in the production EAS
  environment, correctly the public `appl_…` client key (never a secret `sk_…` key) — no
  change needed.
- **Backend-compatibility finding (the real blocker before any device install):** Build 22's
  own code already assumes the Build 22 schema (the numeric `daily_option_trait_awards`
  scoring path, `submit_quiz_completion`'s current signature, etc.) — none of which exists on
  the live production database yet (confirmed: §8a's dry-run shows all 22 engineering
  migrations still pending there). **Installing Build 22 against the current, unmigrated
  production database would fail in ways that look like application bugs but are actually
  schema-version mismatches** — exactly the trap the instructions warned against.
- **No second, isolated Supabase project exists** (`supabase projects list` returns exactly
  one project, `apparently-you`) — standing one up is a real account/billing-level action, not
  "without significant delay," so it is not recommended as this round's path.
- **Recommended path, pending explicit owner authorization, not executed this round:** apply
  ONLY the 22 engineering migrations (`./scripts/safe-migration-push.sh --apply`) to the
  existing beta-connected project — every one of them is additive/backward-compatible by this
  engagement's own design (confirmed throughout their own headers: new tables, new columns
  with defaults, new functions, no drops), so existing beta users and their history are
  completely unaffected by this step alone. Then, separately authorized, apply the 5 Daily
  content-ops files (`./scripts/safe-migration-push.sh --apply-daily-content`) so Daily content
  is also complete and correct for QA. **Neither step touches a single consumer row** — the
  full wipe and the obsolete-beta-content cleanup (§6 of the original plan, still fully
  separate) are NOT required to make Build 22 backend-compatible, and are NOT proposed here.

### 8f. Physical iPhone QA script

To run once Build 22 is installed on the owner's device, against a backend confirmed to have
at least the 22 engineering migrations applied (§8e):

**Public quiz**
1. Complete three different public quizzes start to finish, timing each question's tap-to-
   next-question latency by feel; note any question where the tap feels delayed before the
   next one appears.
2. Repeat with the device's screen recording running (Settings → Control Center → Screen
   Recording) so a real crash/freeze has a visual timestamp to correlate against Xcode's
   device console log.
3. On a crash or freeze, immediately check Xcode → Window → Devices and Simulators →
   [device] → Open Console, and separately Settings → Privacy & Security → Analytics → Analytics
   Data on the device itself for a matching `apparentlyyou` / `Apparently You` crash report.
4. Deliberately distinguish "the screen went blank/app closed to the home screen" (a real
   crash — capture the report above) from "it jumped back to a login/onboarding screen" (a
   session reset, not a crash — note which screen and what was happening right before).
5. Confirm test ads are active for this build (§8e) and specifically time the interstitial at
   completion separately from in-quiz answering, so the two are never conflated in the report.

**Creature**
1. Open the Creature preview from "You."
2. Tap Save to Photos three times in a row, timing each.
3. Open Photos and verify each save: all five visual parts (body, tail, wings, ears/horns,
   eyes — see §8d's note on "five" vs. the "seven" in the original ask) are present, correctly
   layered, and match what's on screen; image is not cropped, blurry, or corrupted.
4. Reopen the Creature preview, Save once more, then switch Today → Explore → Compare → You →
   Apparently Private → back to Creature, five full laps, watching for increasing lag or a
   crash on any lap (cumulative memory pressure).
5. Background the app (home button/swipe) for 10+ seconds, foreground it, repeat the Creature
   save.
6. On any failure, capture the same Xcode console / Analytics Data crash report as above.

**Whole app**
1. Visit Today, Explore, Compare, You, and Apparently Private in sequence, twice.
2. Submit one Free and one Private Daily; confirm the reveal text and that "You" reflects the
   expected trait movement afterward.
3. Complete one Public quiz and one Private quiz (if entitled); confirm scoring/result text
   matches the choices actually made.
4. Tap Restore Purchases from the paywall (even with no real purchase to restore) and confirm
   it resolves (success or a clear "nothing to restore" message) without hanging or crashing.
5. Background/foreground the app at three different points: mid-quiz, mid-Creature-preview,
   and on Today — confirm state is preserved correctly each time (no lost answers, no
   re-triggered ad, no duplicate Daily submission).

For any failure in any of the above: record exact reproduction steps, device model/iOS
version, Build 22's build number as shown in TestFlight, the captured crash/console evidence,
then bring it back here for a real code-level diagnosis and fix BEFORE re-testing the same
flow — never mark a workflow passed because a different, unrelated workflow passed.

### 8g. Clean launch plan — unchanged, still deferred

Confirmed, not re-executed: the full consumer wipe
(`supabase/manual_operations/20261103020000_clean_v1_full_prelaunch_wipe.sql`) and the
obsolete-beta-content cleanup
(`supabase/manual_operations/20261106010000_clean_v1_obsolete_beta_content_removal.sql`) remain
staged and rehearsed only, per the previous round. Neither was run against the real project
this round. They remain correctly sequenced AFTER the physical QA cycle in §8f, not before —
running them first would make device QA impossible to interpret (no real consumer rows left to
distinguish a backend problem from a true fresh-account bug) and is explicitly not what this
round's instructions asked for.
