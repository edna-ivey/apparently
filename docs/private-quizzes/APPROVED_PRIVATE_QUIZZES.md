# Apparently Private | Current Approved Quiz Library

**Owner-approved canonical registry | November 2, 2026**

This index contains only the **current approved** playable quiz definitions. It does not list obsolete draft quiz versions as alternative active content.

**Launch target: 17 quizzes.** Three free previews and fourteen premium quizzes. Editorial approval is complete; local implementation and QA are authorized. Live production deployment, migrations, pushes and store submissions remain separately gated.

## Governing scoring rule

Every selected Daily or quiz answer awards only its approved numeric trait evidence (+1, +2 or +3 for each genuinely supported pole). Unlimited distinct poles are allowed when individually justified; unsupported mappings are not added. Quiz result/verdict weights select the reveal and NEVER grant additional Core or Private points. There is NO quiz-completion award, ranked top-three award, flattening or result-derived trait score. First-completion-only, retake protection, semantic version identity and the 12-month active window remain required.

## Current approved free previews (3)

- `keep-you-around` | So Why Do People Keep You Around?
- `be-so-serious` | Be So Serious Right Now.
- `secretly-love` | What Do People Secretly Love About You?

**Exact approved source for all three:** [APPROVED_11_QUIZ_SOURCE_PACK_2026-11-02.md](APPROVED_11_QUIZ_SOURCE_PACK_2026-11-02.md), source file 01. Restore `secretly-love` to the free-preview surface without duplicating historical answer evidence.

## Current approved premium quizzes (14)

| Quiz ID | Category | Exact current approved source |
|---|---|---|
| `love-soulmates-ready` | Love & Soulmates | [LOVE_READY_APPROVED_LOCKED_2026-10-31.md](LOVE_READY_APPROVED_LOCKED_2026-10-31.md) |
| `love-soulmates-become` | Love & Soulmates | 11-quiz source pack, source file 03 |
| `career-ambition-how-bad` | Career & Ambition | [CAREER_HOW_BAD_APPROVED_LOCKED_2026-10-31.md](CAREER_HOW_BAD_APPROVED_LOCKED_2026-10-31.md) |
| `career-ambition-proving` | Career & Ambition | [CAREER_PROVING_APPROVED_LOCKED_2026-10-31.md](CAREER_PROVING_APPROVED_LOCKED_2026-10-31.md) |
| `hidden-you-wrong` | Hidden You | [HIDDEN_YOU_WRONG_APPROVED_LOCKED_2026-10-31.md](HIDDEN_YOU_WRONG_APPROVED_LOCKED_2026-10-31.md) |
| `hidden-you-hide` | Hidden You | 11-quiz source pack, source file 04 |
| `shadow-side-hypocrisy` | Shadow Side | 11-quiz source pack, source file 03 |
| `good-stuff-trust` | The Good Stuff | 11-quiz source pack, source file 04 |
| `life-match-dream-life` | Life Match | [LIFE_MATCH_APPROVED_LOCKED_2026-11-01.md](LIFE_MATCH_APPROVED_LOCKED_2026-11-01.md) |
| `life-match-freedom` | Life Match | 11-quiz source pack, source file 04 |
| `style-vibe-intimidating` | Style & Vibe | [STYLE_VIBE_APPROVED_LOCKED_2026-11-01.md](STYLE_VIBE_APPROVED_LOCKED_2026-11-01.md) |
| `style-vibe-attention` | Style & Vibe | 11-quiz source pack, source file 04 |
| `private-private-trouble` | Private Private. 😈 | 11-quiz source pack, source file 02 (final approved After Dark) |
| `private-private-proof` | Private Private. 😈 | 11-quiz source pack, source file 03 |

The free previews cover the remaining Shadow Side and The Good Stuff slots without duplicate premium entries. Premium total is 14.

## Implementation contract

- Implement the exact approved question wording, answer order, result weights, full reveals, gates, ties and answer-level numeric trait mappings. Do not rewrite any approved content.
- The existing logical quiz ID identifies ONE current playable definition. Replace obsolete active definitions; do not seed retired alternatives as extra database quiz/question/result rows.
- Do not delete real user submissions, historical awarded points, content identity or completion records. Old completion identities must remain interpretable without keeping obsolete definitions as active/playable content.
- Both 18+ quizzes require server-side age and entitlement checks and mature-result sharing restrictions.
- All quiz results must be reachable; harsh results require their exact multi-answer gates. Client and SQL scorers must agree.
- Preserve existing uncommitted repository work, and report actual test results and anything not verified. No live database operations until separately authorized.

**Governing Bible:** [../APPARENTLY_YOU_PRODUCT_CREATIVE_BIBLE.md](../APPARENTLY_YOU_PRODUCT_CREATIVE_BIBLE.md). It contains current rules only; no older top-three completion-award model is operative.
