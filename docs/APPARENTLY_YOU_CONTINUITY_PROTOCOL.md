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
