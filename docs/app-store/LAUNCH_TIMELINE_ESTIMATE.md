# Build 18 to App Store | Critical-path estimate, October 20, 2026
These are **work estimates, not appointments or guarantees**. Parallel work reduces elapsed time; Apple review and financial-account approvals are outside our control.

| Workstream | Active effort | Dependency / owner |
|---|---:|---|
| Claude remove 3-trait cap and tests | 2–4 h | engineering |
| Claude annual/founder StoreKit + RevenueCat + paywall | 4–8 h | product IDs, offer eligibility, ASC setup |
| Claude in-app account deletion and server cascade | 4–8 h | data inventory, backup/retention policy |
| Claude Settings links and review UX | 1–2 h | published URLs |
| Forge legal/privacy/review draft preparation | 2–4 h | business identity, live SDK inventory, owner review |
| Owner configure subscriptions/offer in ASC and RevenueCat | 2–4 h | Apple account access; Apple product processing |
| Owner Daily mapping review | 4–10+ h | editorial approval; can defer new Daily content from first release |
| Build 18 EAS/TestFlight and processing | 1–3 h elapsed | code ready; variable queues |
| Build 18 real-device and sandbox regression | 3–5 h | build available; test accounts |
| Screenshots, metadata, privacy questionnaire, review notes | 3–6 h | final app and verified legal pages |
| Submission final verification and click-through | 0.5–1.5 h | all prerequisites complete |
| Apple review / first-subscription approval | 1–3+ days elapsed, variable | Apple; may take longer or reject |

**Best-case:** 2–3 concentrated workdays to submit, if Apple subscriptions, legal identity, account deletion and testing go smoothly; acceptance/public availability may be later.
**More realistic:** 3–6 days to submit, then 1–3+ days for review; first-app rejection or subscription setup can extend this.
**Do not promise a public App Store release within days** until subscription availability, legal pages, deletion and final build tests are confirmed.


## October 20 post-Claude sprint reconciliation
The four Build 18 engineering work packages reported in the October 20 sprint are implemented and committed (19482f7, 52af00a, ef2183f, dd60177). Thus the earlier engineering effort rows above are historical estimates, NOT remaining work. The following are forward-looking elapsed estimates, not deadlines:

| Next stage | Estimated elapsed time | Lead | Exit condition |
|---|---|---|---|
| Apple agreement and subscription configuration | 0.5–2 days | Owner, Forge guidance | agreement accepted; monthly/annual/intro products and RevenueCat offering configured |
| Deploy migration + account-deletion function and verify | 0.5–1 day | Claude/Forge with owner approval | deployed to intended Supabase project; real integration smoke tests pass |
| Final legal text, published URLs, App Privacy and listing | 1–2 days, parallel | Owner decisions, Forge drafts, Claude website implementation | public URLs and App Store Connect metadata complete |
| Build 18, TestFlight and iPhone/sandbox acceptance | 1–2 days | Claude build, Owner device tests, Forge checklist | purchase, restore, deletion, scoring and age tests pass |
| Submit and await Apple review | 1–3+ days, variable | Owner submits; Apple reviews | approval, then manual/automatic release as chosen |

**Working target:** submission in 3–6 days from configuration start if no new blockers; Apple review 1–3+ additional days. Not a guaranteed release date. Daily editorial workbook approvals may proceed after initial release if unapproved content is excluded.

**Known outstanding blocker:** screenshot audit shows updated Apple Developer Agreement pending acceptance; verify whether already accepted before proceeding. Email aliases and tests owner-confirmed complete, no extra mail subscription required.
