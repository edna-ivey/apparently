# Apparently You: Continuity, Evidence, and Backup Protocol

Updated: 2026-10-19. Status: active project operating procedure.

## Sources of truth
1. `APPARENTLY_YOU_PRODUCT_CREATIVE_BIBLE.md`: product decisions and governing rules. Later dated owner-approved addenda override conflicting earlier text; reconcile earlier sections in a reviewed cleanup, not by silently deleting history.
2. `docs/approved-content/`: exact approved copy, full answers, mappings, approval date, and version. Drafts belong separately under `docs/editorial-drafts/`; never label them approved.
3. Code and Supabase migration files: implementation source, not evidence that production deployment succeeded.
4. Git commit and remote: durable revision history. Confirm branch, commit, and push results; a local commit is not automatically a GitHub backup.
5. Supabase live inspection and EAS/TestFlight: only sources for deployed/runtime status.

## Mandatory work cycle
- BEFORE: inspect Bible, latest decision addenda, approved content, repository status, and relevant source code. Identify contradictions explicitly.
- DURING: capture user approvals verbatim in a dated, versioned file; preserve entire question, every answer, result, scoring map, and editorial status. Do not reconstruct approvals from memory.
- AFTER: update Bible, approved-content registry or draft files, implementation where authorized, and audit log in the same change set. Run relevant checks, commit documentation/code selectively, push and verify remote when authorized.
- Never silently overwrite a prior approved version. Preserve historical identity and approval records.
- Never change production content or application logic solely to align an unapproved draft.
- Never claim automatic future updates: this protocol runs when the assistant is working on the project with repository access.

## Decision status
LOCKED: owner explicitly fixed the rule. APPROVED: owner accepted exact content. WORKING: draft/proposal. OPEN: undecided. IMPLEMENTED: committed code. DEPLOYED: verified in target environment. These labels describe separate dimensions.

## Daily and Private Daily decisions, 2026-10-19
- LOCKED: One answer can award evidence to any number of genuinely supported traits/poles; no fixed three-trait cap. Each pole earns up to 3 points for that answer; do not conflate per-pole points with count of poles.
- LOCKED: New approved Daily and Private Daily questions take scheduling priority over already scheduled repeats when published. Preserve historical answers, stable identities, and fallback rotation. Exact scheduler implementation pending audit.
- WORKING: Target 90 new Free Daily and 90 new Private Daily questions, reviewed in batches of 15 per room. Audit and retire weak/boring existing content AFTER fun new questions are developed.
- WORKING: Free Daily variety: this-or-that, character/archetype choices, would-you-rather, absurd situations, confessions, fun choices. Mix humor, originality, insight; avoid duplicating quiz scenarios.
- WORKING: Private Daily: substantially more outrageous, bold, shady, surprising, revealing; respect 18+ Private Private gate as distinct from normal Private Daily.
- WORKING: First 15 Free and 15 Private Daily question drafts were shown in chat on 2026-10-19, but NOT yet approved or inserted into the repository. Do not describe them as approved.
- REQUIRED: Audit existing live Daily/Private Daily question pools and scoring mappings before claiming inventory completeness; check against quiz content registry for conceptual repetition.

## Verified code discrepancy, 2026-10-19
- `src/data/daily-questions.ts` has `MAX_PERSONALITY_EFFECTS_PER_OPTION = 3` and truncates effects in normalization and material edits.
- `src/app/admin/(protected)/review/[id].tsx` also limits UI to three effects.
- These constraints conflict with owner's unlimited number-of-traits rule. Not yet modified; fix in a separately authorized code change with tests.
- V2 database evidence caps points per pole at 3; this is NOT a cap on number of poles.
- The Bible's earlier Daily evidence +1/+2 language predates owner's clarified +1..3 rule. See dated addendum.

## Known documentation audit items
- `docs/personality-scoring-v2-design.md` opening status says V2 not connected and migrations not applied. Recheck code and actual Supabase before replacing with a verified status; code integration and production deployment are different.
- `docs/Apparently You Bible UPDATED v1.4.rtf` is an older versioned artifact. Markdown Bible is canonical; update the RTF as a deliberate synced release, never imply it auto-updates.
- Two untracked creature asset folders are present. Preserve without deletion or accidental add.

## Audit trail
2026-10-19: Continuity protocol established; Bible addendum written; no app code, live questions, migrations, or production data changed.


## Repository and Bible reconciliation, 2026-10-20
- Verified `feature/private-library-implementation` at `41afb2c` matches origin, working tree clean before documentation changes. `master` is older and not the authoritative latest branch for Build 17 follow-up work.
- Build 17 artifact came from `8a42ace`; later branch commits are not necessarily included in the installed TestFlight binary.
- Canonical Markdown Bible header updated to the October 20 governing edition, with dated §75 reconciliation. Historical v1.4 remains preserved.
- 90-slot one-pass Daily workbook is a working review compilation, NOT approved release content. Preserve 428 proposed mappings and their review labels; do not publish without approval.
- Two approved character collisions (Shuri, Cleo) remain unresolved. Daily multi-trait cap discrepancy remains open pending verified code correction.
- No production app, database, content, or native build change was made in this documentation reconciliation.


## Build 17 repository audit, 2026-10-20
- Product-to-code audit saved as `docs/BUILD17_PRODUCT_CODE_AUDIT_2026-10-20.md` and linked from Bible §76.
- Confirmed three-effect Daily cap and monthly-only purchase UI; annual/founder offer requires implementation and external store configuration review.
- Targeted Settings check did not find account deletion. Physical-device and live-system checks remain open.
- TypeScript and lint passed. No app code or production data changed in this audit.


## Owner approval and Build 18 scope, 2026-10-20
- Owner reports Build 17 device tests completed and Build 17 fully approved. Preserve screenshot evidence when received; distinguish owner attestation from assistant-run device tests.
- Build 18 removes three-trait/effect-count cap, retains 3 points per pole; includes approved Oct 20 editorial content only after owner review.
- Claude handles implementation; owner handles mapping review; App Store prepublication documentation lives under `docs/app-store/`.
- Policy/terms drafts are NOT live or final; external accounts and Apple submission remain separate verification steps.

## Build 18 implementation sprint, repository-verified, 2026-10-20
- Daily trait-count cap: VERIFIED REMOVED client-side (`daily-questions.ts`, admin review editor); confirmed the server (trigger, `admin_update_daily_option`) never had a count cap at all. Duplicate-dimension prevention and the real -3..3 per-pole limit preserved. Additive server-side validation (dimension allow-list, range, duplicate rejection, NO count limit) is STAGED in `20261020010000_daily_option_effects_validation.sql`, NOT applied (no migration was run this session, per explicit instruction).
- Subscriptions: monthly + annual + Founding Member selection IMPLEMENTED in `purchases-service.ts`/`paywall.tsx`, using a verified-real Apple mechanism (StoreKit Introductory Offer on the annual product, real eligibility check, fails closed). Zero product ids asserted to exist in App Store Connect/RevenueCat -- exact owner steps are in `docs/app-store/OWNER_APP_STORE_ACTIONS.md` items 2-3, UNEXECUTED pending the owner's App Store Connect/RevenueCat access.
- Account deletion: IMPLEMENTED (`supabase/functions/delete-account`, `account-deletion-service.ts`, Settings UI, real in-app Privacy Policy/Terms of Use pages). Edge Function is NOT deployed this session (deployment is a separate `supabase functions deploy` step, not run). Full cascade chain verified against the actual migration SQL, not assumed.
- Content boundary: VERIFIED HELD -- diffed `daily-questions.ts` and confirmed zero content/mapping lines changed, only normalization mechanism. Shuri/Cleo collisions and the Oct 20 workbook remain untouched and unresolved.
- Validation executed this session: `npx tsc --noEmit` (clean), `npm run lint` (clean), all 39 `scripts/validate-*.ts` (green, including 3 new ones for this sprint's work and one pre-existing validator corrected for the newly-approved Privacy/Terms feature). No EAS build, no TestFlight submission, no migration apply, no Edge Function deploy, no physical-device test performed this session -- see the Build 18 completion report for the full remaining-work list.

2026-10-20 email milestone: owner confirmed Zoho send-as aliases/display names and incoming/outgoing tests complete for Apparently You and Super Great Ventures. Updated owner App Store actions and governing Bible §79; remaining launch gates unchanged.

2026-10-20 post-Claude handoff: verified local Git at 01903f9 clean/synced, reconciled uploaded sprint report with Build 18 un-deployed status; updated owner action checklist, critical-path timeline and Bible §80. Apple updated developer agreement may still need acceptance.

2026-10-20: Owner confirms updated Apple developer agreement accepted. Updated action checklist and timeline; created three-way Build 18 handoff doc; Bible §81 records status.

## Build 18 deployment-readiness re-verification, 2026-10-20 (not assumed from the sprint report)
- Fresh re-check, not reused from memory: repo at `03e1aa6`, clean, matches origin; all four sprint commits' real files confirmed on disk; tsc/lint/39 validators re-run, all clean. Linked project confirmed `apparently-you` (`rjslgjxlpsjljbrlxfet`, ACTIVE_HEALTHY) via `supabase projects list`. `supabase migration list` confirms `20261020010000` still unapplied; `supabase functions list` confirms `delete-account` still undeployed -- nothing changed outside this session either.
- NEW finding from fresh re-inspection: `daily_questions.approved_by`/`tester_access_grants.granted_by` had no `ON DELETE` clause on their `auth.users` reference (confirmed live via `pg_get_constraintdef`), which would block an admin's OWN self-deletion if they'd approved content/granted tester access. STAGED, NOT APPLIED fix: `20261021010000_admin_attribution_fk_set_null_on_delete.sql` (`ON DELETE SET NULL`, never cascade).
- Prepared a real end-to-end integration test (`scripts/test-delete-account-integration.ts`) against the live project using a disposable account it creates itself -- not run yet, requires delete-account to be deployed first.
- Addressed the Review Notes `[NEEDS CLAUDE]` item with the real `tester_access_grants` mechanism (additive to real entitlement, never a bypass). Verified Sentry config actually matches the privacy draft's diagnostic-data claim -- no mismatch found. Updated Settings' temporary support email to the real, owner-confirmed `support@apparentlyyou.com`. Added a real `/support` page and prepared (NOT deployed -- no `vercel` command run) `vercel.json` rewrites for public `/privacy` and `/terms`.
- Still open, unchanged: annual/Founding Member live configuration, both staged migrations applied, delete-account deployed+tested, Build 18 EAS/TestFlight, legal/metadata finalization. No migration applied, no function deployed, no EAS build, no TestFlight submission, no real-money purchase, no live site deploy performed this session.

## Subscription implementation completion, 2026-10-20
- Owner states RevenueCat is now configured: entitlement `apparently_private`, offering `default`, packages `$rc_monthly`/`$rc_annual`, products `apparently_private_monthly`/`apparently_private_annual`. Not independently re-verified against the RevenueCat dashboard (same credential gap as the prior pass) -- owner attestation, not Claude verification. Confirmed by code re-read that `getApparentlyPrivateOfferings()` already reads this exact convention; no mapping code change needed.
- Real gap found and fixed: the paywall gave an existing subscriber no way to see plan options (only "You're already in"), which also blocked capturing App Store review screenshots without cancelling. Added a real "View plans" toggle (`src/app/paywall.tsx`) -- same real PlanCards, a CURRENT PLAN badge read from CustomerInfo (never UI-inferred), Subscribe/Switch button disabled when the selection already matches the real active plan (no duplicate-purchase path), Restore Purchases now reachable from this state too.
- `scripts/validate-subscription-plans.ts` extended (11 new checks); `docs/app-store/SUBSCRIPTION_TESTING_2026-10-20.md` created recording the full scenario matrix and which items are code-complete-but-blocked on a real sandbox/device. tsc/lint/39 validators all green.
- EAS build/TestFlight status for this pass recorded separately once attempted -- see the Build 18 subscription completion report for exact build ID/commit.

## Build 18 EAS/TestFlight deployment, freshly verified, 2026-10-20/21
- A prior report described Build 18 as queuing; owner relayed that Forge independently checked EAS and still saw Build 17 as latest. Resolved by direct re-verification, not by re-asserting the earlier report: EAS build `ff9c78bb-3066-426d-9c70-551120e8ca7d` (profile `testflight`, buildNumber 18) was genuinely `IN_PROGRESS` at the time of Forge's check (archive upload done, native compile still running) and reached `FINISHED` shortly after -- never lost, failed, or abandoned. No restart performed; `app.json` buildNumber stayed `"18"`.
- `gitCommitHash` on the finished build (`e9a688e804f3bcfd4562a17093c29cbbba656044`) confirmed identical to local `HEAD` and `origin/feature/private-library-implementation` at verification time.
- Submitted to TestFlight with explicit build id (not `--latest`): EAS submission `d3e30415-9a08-4828-a3d6-82136e7db9bc`, status FINISHED, no error.
- Apple-side TestFlight processing CONFIRMED on a follow-up independent check ~3 minutes later: `eas-cli submit:status` now lists `1.0.0 (18) -- internal: in beta testing, external: ready for beta submission`. Internal testers can install Build 18 now; external-group distribution still needs a separate manual App Store Connect step (normal Apple workflow, not a failure). See Bible §84.

## Build 19: Settings "View Plans" + Creature Read editorial polish, 2026-10-21
- Diagnosed the reported Settings bug as pure app-code navigation, not RevenueCat/App Store Connect/StoreKit: Settings' Apparently Private card had no path to the in-app paywall for an active subscriber, only Manage Subscription (Apple's external page). Fixed with a "View Plans →" action for both free and active subscribers (`settings.tsx`), landing an active subscriber directly on the real plan cards via `/paywall?view=plans` (paywall.tsx reads the param to pre-expand the existing "View plans" toggle from §83). Purchasing/eligibility logic itself untouched.
- Creature Read: implemented the owner-approved Zorafox grammar rule (join via "and" when the first sentence is a complete clause; work "Apparently," into the closing thought when the shade doesn't already carry it) as general assembly logic in `creature-combined-read-copy.ts`, not a Zorafox special case. Verified exact match against the approved example. No authored content strings changed, only the formula joining them. See Bible §85 for the full writeup, the exact approved text, and four single-trait cases (Rule-bending, Private, Open, Patient as the FIRST trait) flagged for owner review as longer-but-valid 3-"and" sentences -- data left unchanged pending that review.
- Age range (Settings demographic field) verified structurally independent of the 18+ content gate and of subscription entitlement, by code read -- no defect found, no change made.
- tsc/lint/39 validators (two extended: validate-subscription-plans.ts §9, validate-combined-creature-read.ts) all green. Small-iPhone visual layout and on-device purchase/restore flows remain unverified -- no physical device/simulator available in this environment.

## Build 19 cleanup pass, 2026-10-21: re-verification + Creature Read proposals (nothing applied)
- Re-verified Task 1 fresh (not reused from the §85 report): entitlement/offering/package-mapping code in `purchases-service.ts` unchanged and correct, no hardcoded pricing anywhere, Founding Member gating still requires both real eligibility and a real introPrice, Settings "View Plans" path still intact. Confirmed this environment still has no RevenueCat dashboard/admin credential -- whether the LIVE `default` offering actually has `$rc_monthly`/`$rc_annual` attached to the right products remains unverifiable from here, same gap as every prior pass.
- Reviewed the four flagged Creature Read first-trait passages (Rule-bending, Private, Open, Patient) in depth. Found no general code-level fix that would correct exactly these four without also changing ~25 other unflagged combinations sharing the same shape (a pre-existing "and" on one side of the join) -- concluded this is genuine per-passage editorial judgment, not a code defect. Presented original/proposed wording pairs as PROPOSALS in the session report; applied NONE of them -- `creature-combined-read-copy.ts` is unchanged this pass, pending explicit owner approval.
- tsc/lint/39 validators re-run fresh, all clean, zero regressions. No code changed this pass (Task 1 verification-only, Task 2 proposals unapplied) -- only documentation updated and committed. Bible §86 has the full writeup.
- Build 19 is still NOT created/submitted, per explicit instruction this pass.
