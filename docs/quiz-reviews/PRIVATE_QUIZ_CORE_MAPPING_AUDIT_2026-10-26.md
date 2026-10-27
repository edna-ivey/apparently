# Apparently Private Quiz Core-Mapping Audit | 2026-10-26

**Status: AUDIT ONLY. No code was changed by this audit.** Unlike the 12 free quizzes, none of
the 10 Apparently Private quizzes' answer-level Core/Private pole mappings have ever been
through a formal owner review/lock process. This document is that review's starting point —
findings for the owner to weigh in on, not pre-approved content. Per explicit instruction, no
Private mapping or reveal rewrite has been implemented; that remains blocked pending approval.

## Scope
The 10 quizzes: be-so-serious (`private-preview`, live), career-how-bad (`private`, unshipped),
career-proving (`private`, unshipped), hidden-you-wrong (`private`, unshipped), keep-you-around
(`private-preview`, live), life-match-dream-life (`private`, unshipped), love-ready (`private`,
unshipped), private-private-trouble (`private`, unshipped), style-vibe-intimidating (`private`,
unshipped), secretly-love (`private-preview`, **historicalOnly: true** — see note below).

**secretly-love has no V2 calibration file at all** (`src/data/quiz-pole-awards/secretly-love.ts`
does not exist) — it is currently marked `historicalOnly` in code (superseded by
keep-you-around, kept registered only so old completions/shared links still resolve, not shown
on the current Private catalog). Your instruction said "we are keeping all 10 Apparently Private
quizzes for launch," which doesn't match this quiz's current `historicalOnly`/superseded status
in code — **flagging this discrepancy for your decision**: either secretly-love should be
un-retired (and then needs its own V2 calibration authored from scratch, a real effort, not a
quick fix) or the "10 quizzes" count refers to the other 9 plus one you consider secretly-love
separately. Not resolved here.

## Combined eligibility: does Private content close the Free-quiz gap?
Computed via `scripts/audit-max-achievable-pole-points-combined.ts`, same one-answer-per-question
methodology as the free-quiz audit, using current (unapproved) Private code:

- **Competitive: free max 5 → combined max 15.** Fully resolved once Private content is
  approved/live — be-so-serious (+2, already live) plus career-how-bad/career-proving (+13
  combined, not yet shipped) more than clear the 9-point bar.
- **Face Value: free max 2 → combined max 2 (unchanged).** No Private quiz — reviewed or not —
  currently awards Face Value (`social_attunement:negative`) anywhere. This pole has no path to
  9 points anywhere in the app's current content, free or Private. This is the one genuine,
  unresolved gap; see the open item at the end of this document.
- All other 38 Core poles were already free-quiz-eligible and remain so.

## Per-quiz findings (from independent review against the same rubric used to lock the free
quizzes: polarity correctness, no opposing-pole-on-one-answer, +1/+2/+3 calibration discipline,
wording-drift check against the quiz's own labels, and dimension-concentration check)

| Quiz | Verdict | Hard errors found | Notable items for your review |
|---|---|---|---|
| be-so-serious | Solid | 0 | q1c boundary-vs-punishment read worth confirming; q10's uniform +2 across a weaker-signal question tier; accountability_defensiveness ~25% concentration (thematically justified) |
| career-how-bad | Solid | 0 | q1b and q8a rationale self-flags genuine ambiguity (author already noted, not newly found); adventure_comfort+ambitious_content ~44% concentration (thematically justified) |
| career-proving | Solid | 0 | q7b possible under-calibration (no secondary award where q7c/d get one for similar behavior); q4a vs q4c fine-grained dimension split worth double-checking; top-3 dimensions ~71% of all awards — closest to the "extreme concentration" line of any quiz audited |
| hidden-you-wrong | Solid | 0 | 12 of 20 Core dimensions get zero use (thematically defensible — quiz is about concealment — but a real coverage narrowing) |
| keep-you-around | Solid | 0 | q6a contestable polarity (protective vs hands-off read); q1d is author-self-flagged as ambiguous; best Core/Private spread of any Private quiz audited |
| life-match-dream-life | Solid | 0 | q10c contestable polarity; **most concentrated of all 10 quizzes — 14 of 20 Core dimensions get zero award**, with 2 dimensions covering ~58% of all Core awards |
| love-ready | Solid | 0 | q1b evidentiary stretch (low point weight limits impact); q4a recalibration bumped from the original authored signal, worth confirming |
| private-private-trouble | Solid | 0 | q6a/q9a polarity debatable; q2b dimension repurposing (adventure_comfort for relational risk-taking) is a stretch but not wrong; **best-distributed quiz audited** (12/32 dimensions, no dimension over 14%) |
| style-vibe-intimidating | **Has a real issue** | **1** | **q7: the file's own stated principle ("don't award a pole for how OTHERS react to the chooser") is applied to q7a/q7c but violated by q7b/q7d, which are structurally identical cases that DO get awards — an internal contradiction, not a judgment call.** Also: q9a dimension mismatch (scores the chooser's own expressiveness as if it were the chooser reading others' signals — backwards for what `social_attunement` measures). Also: no answer anywhere in this quiz uses the +3 "strong signal" tier used by its siblings, suggesting its calibration runs systematically cooler — a cross-quiz consistency question worth a look. |

**Zero wording-drift and zero same-answer-opposing-pole-of-one-dimension errors were found in
any of the 10 quizzes** — the award files' recorded `wording` fields all still match their
quiz's actual current answer labels, and no answer anywhere awards both the positive and
negative pole of the same dimension.

## What needs your decision
1. **style-vibe-intimidating's q7 inconsistency** — recommend either stripping the q7b/q7d
   awards to match the quiz's own stated principle, or restoring some award to q7a/q7c. Your
   call, not mine to silently resolve.
2. **The concentration flags** (career-proving ~71%, life-match-dream-life 14/20 Core dims
   unused) — each has a plausible thematic justification, but "plausible" isn't the same as
   "you've seen and accepted it." Worth an explicit yes/no per quiz rather than a blanket pass.
3. **The dozen or so "contestable polarity" / "evidentiary stretch" items** listed per quiz
   above — none are clear bugs, all are genuine judgment calls a human should make, not an
   automated check.
4. **secretly-love's historicalOnly status** vs. your "keeping all 10 for launch" instruction —
   see the Scope note above.
5. **Face Value's structural gap** — unresolved by Private content either; see the eligibility
   proposal options already on the table from the free-quiz audit (pole-relative threshold /
   new content / leave as documented), now confirmed to apply regardless of Private content.

## What this document does NOT do
Change any mapping, rewrite any reveal, or approve anything. Reveal-content rewrites for these
10 quizzes (title/hero/body/kicker/tags) were explicitly out of scope for this pass per your
instruction and have not been touched or reviewed here at all.
