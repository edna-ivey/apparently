# Backend setup — Sprint 1: Production Data Foundation

This document is for Michelle (or whoever sets up the real Supabase project). It covers only
what Sprint 1 built: schema + client + service scaffolding. **Nothing in the app is wired to
this yet** — Today, Explore, and You all continue running on local/prototype data exactly as
before. This is additive infrastructure sitting alongside the existing app, not a replacement.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project (or use an existing
   one dedicated to Apparently You).
2. Pick a strong database password and store it somewhere safe (a password manager, not
   Slack). You won't need it for this app — it's for direct Postgres access if you ever need
   it.

## 2. Enable Anonymous Sign-Ins

Apparently You's V1 auth strategy is **anonymous-first**: a user gets a real Supabase
identity the instant the app can reach Supabase, with no email/password/login screen.

In the Supabase Dashboard: **Authentication → Providers → Anonymous Sign-Ins → Enable.**

Without this enabled, `ensureAnonymousSession()` (see `src/services/auth-service.ts`) will
fail quietly (a warning in the dev console, no crash) — the app keeps working on local data
either way, but nothing will ever reach the database.

## 3. Find your Project URL and Publishable (anon) key

In the Dashboard: **Project Settings → API.**

- **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
- **Publishable key** (sometimes labeled "anon" / "public" key, depending on dashboard
  version) → `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

**Never copy the `service_role` / secret key anywhere in this repo, in any `EXPO_PUBLIC_*`
variable, into `app.json`, or into any committed file.** The service-role key bypasses every
RLS policy in the migration below — it belongs only in a trusted server environment (a future
admin backend, or your own terminal talking to the Supabase CLI/API directly), never in an
Expo client bundle of any kind.

## 4. Configure your local `.env`

Copy the template and fill in the two values from step 3:

```
cp .env.example .env.local
```

Then edit `.env.local`:

```
EXPO_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-publishable-key>
```

`.env.local` (and `.env`, and any `.env.*.local`) are already git-ignored — see `.gitignore`.
Until this file has real values, `src/lib/supabase.ts`'s `isSupabaseConfigured` stays `false`
and every Supabase-backed feature is a safe no-op; the app is unaffected.

## 5. Apply the migration

The schema lives at:

```
supabase/migrations/20260913120000_initial_apparently_schema.sql
```

If you have the Supabase CLI set up and linked to your project:

```
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

Or paste the file's contents into the Dashboard's **SQL Editor** and run it once, if you'd
rather not set up the CLI yet.

This migration creates schema only — **no prototype content is seeded.** The current local
prototype Daily questions/percentages contain fake data, stale scheduled dates, and
incomplete editorial packages that must never reach production. Approved real content will
be migrated/seeded deliberately in a later step, not as part of this migration.

## 6. Verify RLS is enabled

In the Dashboard: **Table Editor** → each of `profiles`, `daily_questions`, `daily_options`,
`daily_answers`, `quiz_results`, `personality_evidence` should show a "RLS enabled" badge. If
any table shows RLS as disabled, something went wrong applying the migration — re-run it
(every `alter table ... enable row level security` statement is idempotent to re-apply).

You can also confirm from SQL Editor:

```sql
select relname, relrowsecurity
from pg_class
where relnamespace = 'public'::regnamespace
  and relkind = 'r';
```

Every row should show `relrowsecurity = true`.

## 7. Verify anonymous auth end-to-end

With `.env.local` filled in, run the app (`npx expo start`) and open it. Nothing visible
happens — there's no login screen and no loading spinner for this — but in the Dashboard
under **Authentication → Users**, you should see a new user appear shortly after the app
launches, with no email and `is_anonymous = true`. That's `ensureAnonymousSession()`
(triggered once from `src/app/_layout.tsx`) doing its job.

If no user appears: check that Anonymous Sign-Ins are enabled (step 2), and check the Metro
dev console for a `[auth-service]` warning.

## 8. Verify the distribution RPC

**The distribution RPC is gated, not open to every authenticated caller.** `get_daily_distribution`
returns zero rows unless ALL of the following are true for the calling user: they are
authenticated, the question is consumer-visible (`Live` or `Archived`), and they themselves
already have a `daily_answers` row for that question. This is the schema-level enforcement of
"Answer first. Then unlock the world." — see §"Product rules enforced by this schema" below
for the full behavior table.

To verify it in the SQL Editor, note that `auth.uid()` reflects whichever role/session you're
querying as — running as the Postgres superuser bypasses this check differently than the app
does, so the most faithful test is via `supabase.rpc(...)` from the app itself (or `psql`
connected with a real user's JWT set via `set request.jwt.claims`). As a quick sanity check
from the SQL Editor:

```sql
-- Before that user has answered: expect ZERO rows.
select * from public.get_daily_distribution('<that question''s id>');

-- After inserting a daily_answers row for that same user + question, the same call should
-- return one row per option (four, even if some have zero answers), with real
-- answer_count/percent/total_answers — never fabricated, never a raw per-user row.
```

## 9. Understand the immutability/locking rules end-to-end

Before treating this schema as ready for real votes, confirm you understand (and, ideally,
manually test) these two enforced rules — see §"Product rules enforced by this schema" below
for the exact test cases:

1. A `daily_answers` row can only ever be inserted while its question's status is `Live`.
   The moment a question becomes `Archived` (or anything else), new votes for it are rejected
   by RLS — its world percentages are frozen forever at that point.
2. `get_daily_distribution` will not return anything for a question until the calling user has
   answered it themselves. There is no way to "peek" at the world before committing.

## 10. Generating official Supabase types (future step)

`src/services/types.ts` is currently **hand-written**, not Supabase-generated — it's named
and commented to make that explicit. Once this migration is applied to a real project, the
official types can be generated with:

```
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase gen types typescript --project-id <your-project-ref> --schema public \
  > src/services/database.generated.ts
```

Prefer importing from that generated file over the hand-written one wherever exact
column-level fidelity matters, once it exists. Do not delete `src/services/types.ts` until
every consumer of it has migrated.

## 11. Production note

**Never expose the `service_role` key in Expo, in this repo, or in any client bundle.** It
must live only in environments that are never shipped to a user's device: a future
server-side admin tool, a Supabase Edge Function, or your own machine talking to the
Supabase CLI. Everything in this Sprint 1 client (`src/lib/supabase.ts` and everything under
`src/services/`) uses only the public/publishable key, by design — that key is safe to ship
because every table it can touch is protected by the RLS policies in the migration.

---

## Product rules enforced by this schema

Two rules are enforced by the database itself, not left to client discipline:

- **Votes are only accepted while a question is Live.** The `daily_answers_insert_own` RLS
  policy requires `auth.uid() = user_id` AND `exists (select 1 from daily_questions where
  id = question_id and status = 'Live')`. The instant a question leaves `Live` (→ `Archived`,
  or any other status), no further row can ever be inserted for it — its world percentages
  are frozen at exactly whatever they were when it stopped being Live. There is no late
  voting into an Archived (or Draft/Scheduled/etc.) Daily.
- **World distribution is unlocked only after the current user has answered.**
  `get_daily_distribution(p_question_id)` returns real rows ONLY when the caller is
  authenticated, the question is consumer-visible (`Live` or `Archived`), AND the caller
  already has a `daily_answers` row for that exact question. Otherwise it returns zero rows —
  never a fabricated 0%-everywhere distribution, and never any signal about whether other
  users have answered. Archived results remain available, but only to users who actually
  participated while it was Live; someone who never answered a since-Archived Daily can never
  see its numbers after the fact either.

### Expected test cases

| Case | Scenario | Expected result |
|---|---|---|
| A | User has not answered a Live Daily | `insert into daily_answers` succeeds exactly once. `get_daily_distribution` called *before* that insert returns **zero rows** (not answered yet). |
| B | User answers a Live Daily | The insert succeeds. The `daily_answers_after_insert_personality_evidence` trigger fires and writes one `personality_evidence` row per effect on the chosen option. `get_daily_distribution` called *after* the insert now returns **all four options**, real counts/percentages. |
| C | User tries a second answer to the same Live Daily | Rejected — `UNIQUE(user_id, question_id)` raises a unique-violation on the second insert attempt. |
| D | The Daily becomes Archived | The user's own existing `daily_answers` row is still readable by them (`daily_answers_select_own`). `get_daily_distribution` is still readable, but **only** by users who answered while it was Live/Archived-and-already-answered — never by someone who skipped it. A **new** answer insert against this now-Archived question is rejected by `daily_answers_insert_own` (status is no longer `Live`). |
| E | User tries to answer a Draft / Scheduled / Approved / ReadyForReview / NeedsRevision / Rejected / Idea question | Rejected by RLS — `daily_answers_insert_own`'s `EXISTS (... status = 'Live')` check fails for every status except `Live`. |
| F | User passes an `option_id` that belongs to a *different* question than the `question_id` given | Rejected — the composite foreign key `daily_answers_option_belongs_to_question (option_id, question_id) references daily_options (id, question_id)` has no matching row for that combination, so the insert fails a foreign-key constraint. |

None of these were exercised against a real database in this pass (no live Supabase project,
no local Postgres/Docker available) — they describe the schema's designed behavior, verified
by careful reading of the migration and by parsing its SQL bodies against the real Postgres
grammar. Manually running cases A–F against a real project once one exists is worth doing
before the first genuine Daily goes Live.

---

## Daily lifecycle: no catch-up (permanent product rule)

This is a permanent product decision, not a temporary V1 limitation: **a Daily may only ever
be answered while it is the current Live Daily.** There is no catch-up voting, ever.

**Live**
- Answerable — exactly one immutable answer per user (`UNIQUE(user_id, question_id)`, no
  update/delete policy for consumers).
- The Room (world distribution) unlocks for a user only after that same user has answered.

**Archived**
- Never accepts new answers, from anyone, for any reason — including a user who simply never
  got to it while it was Live. There is no late/catch-up vote.
- A user who DID participate while it was Live may still retrieve their own answer and the
  frozen final Room distribution.
- A user who did NOT participate may eventually be shown that they missed it, but may not
  answer it and may not unlock its distribution after the fact. (That "you missed this one"
  history UI is not built in this sprint.)
- Once Archived, a row is never reactivated back to Live.

**Reusing a great old Daily ("Encore" / "From the Vault")**
- Never reopen an Archived row. Create a brand-new `daily_questions` row with a new UUID and
  its own fresh voting window/population.
- The original Archived row's percentages stay exactly as they were — permanently frozen —
  regardless of how many times its content is reused later.

**Closing a Drop (V1)**
- For V1, a Drop closes only when the next Daily is explicitly published and the previously
  Live Daily is moved to Archived, as one controlled operation. There is no timezone-aware
  scheduler or cron job — publishing is a deliberate editorial action.
- There must never intentionally be more than one Live Daily at a time.

This rule is already enforced end-to-end by existing schema, not by client discipline:

- `daily_answers_insert_own` only allows an insert while the referenced question's
  `status = 'Live'` — an Archived question rejects every new insert unconditionally, including
  from a user who never voted.
- `UNIQUE(user_id, question_id)` blocks a second vote from a participant, on either a Live or
  since-Archived question.
- Consumers have no `UPDATE`/`DELETE` policy on `daily_answers` — an existing answer can never
  be changed or removed by its owner.
- `get_daily_distribution` requires the caller to already have a `daily_answers` row for that
  exact question — this gate applies identically whether the question is Live or Archived, so
  a non-participant can never unlock a since-Archived Daily's numbers either.

None of these rules change for this sprint or are expected to change for the "Encore" concept
described above — a reused Daily is always a new row with its own new UUID, never a reopened
old one.

## NEXT SPRINT (Sprint 1B)

This sprint built the foundation only. Sprint 1B is expected to:

- Connect Today (`src/app/(tabs)/index.tsx`) to the remote Live Daily question via
  `getLiveDailyQuestion()` (`src/services/daily-service.ts`).
- Commit real Daily answers to Supabase via `commitDailyAnswerRemote()`, alongside (not yet
  replacing) the existing local `commitDailyAnswer()`.
- Replace the prototype per-option percentages with real ones from
  `getDailyDistribution()` / `get_daily_distribution()`.
- Preserve a local fallback throughout the transition — if Supabase is unreachable or not
  configured, Today must keep working exactly as it does today.
- Carefully migrate/sync existing local Daily-answer and quiz-result history into Supabase
  (this needs its own design pass — it is NOT part of Sprint 1's schema work) rather than
  silently discarding a device's prototype history.
- Begin replacing demo personality evidence (`getDemoPersonalityAnswers` in
  `src/data/personality.ts`) with real evidence read from `personality_evidence`, as real
  Daily answers accumulate server-side.

None of the above is implemented yet. Sprint 1 is schema, client, and service-interface
scaffolding only — no screen has been switched over.
