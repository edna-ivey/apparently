-- Apparently You — Sprint 1C-A: Owner Auth + Real Production Admin Control Room.
--
-- Scope: an admin role system, server-enforced editorial lifecycle, Live/Archived
-- immutability, a one-Live-Daily guarantee, and a transactional publish operation — all
-- driven from privileged SECURITY DEFINER RPCs, never from direct client table access.
-- Does NOT touch consumer-facing tables/policies/RPCs from the initial migration or the
-- hardening migration (both already applied remotely; not edited here). admin_users starts
-- completely empty — no owner row is inserted by this migration. Michelle's permanent owner
-- identity does not exist yet and is bootstrapped separately, by hand, after this migration
-- lands (see docs/backend-setup.md).
--
-- Permanent principle this migration exists to enforce at the DATABASE level, not just in
-- the React UI: nothing goes live without human approval, and AI must never approve,
-- schedule, publish, archive, or grant itself/anyone admin access. Every mutating RPC below
-- checks is_admin()/is_owner() itself — a client that bypasses the UI entirely and calls
-- these RPCs (or the underlying tables) directly gets exactly the same enforcement.

-- =========================================================================================
-- 1. ADMIN_USERS
-- =========================================================================================

create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'editor')),
  created_at timestamptz not null default now()
);

comment on table public.admin_users is
  'Editorial/admin role membership — completely separate from consumer identity. A row here has nothing to do with whether a user has ever cast a consumer Daily vote. Deliberately empty after this migration: no owner row is inserted here. Bootstrapping Michelle''s first owner row happens later, by hand, via controlled database administration (never via client code, never via a client-reachable insert path) once she has a permanent (non-anonymous) auth identity to attach it to.';

alter table public.admin_users enable row level security;

-- An authenticated user may see ONLY their own membership row (or none, if they aren''t
-- admin at all) — enough for the client to determine its own role, never enough to list who
-- else has access. There is deliberately NO insert/update/delete policy of any kind: normal
-- authenticated users (anonymous consumer sessions included) cannot self-promote, change
-- their own role, or remove anyone. The only way a row is ever created is direct, controlled
-- database administration outside RLS entirely (e.g. the Supabase SQL editor/CLI running as
-- the table owner) — never through anything a client can reach.
create policy "admin_users_select_own"
  on public.admin_users
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- =========================================================================================
-- 2. AUTHORIZATION HELPERS
-- =========================================================================================
--
-- Identity comes ONLY from auth.uid() (the caller's own JWT) — neither function accepts a
-- user_id parameter, so there is no way for a client to ask "is THIS OTHER user an admin."
-- SECURITY DEFINER + pinned search_path so these behave identically no matter what context
-- calls them (directly, or nested inside another SECURITY DEFINER admin RPC below) — the
-- self-select RLS policy above would already produce the right answer without this, but
-- pinning it here removes any dependency on that policy never changing.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users au where au.user_id = auth.uid()
  );
$$;

comment on function public.is_admin() is
  'True iff the CALLING user (auth.uid(), never a client-supplied id) has any admin_users row (owner or editor). The final authority every privileged admin_* RPC below checks before doing anything — the React UI hiding a button is not the security boundary, this is.';

revoke execute on function public.is_admin() from public;
revoke execute on function public.is_admin() from anon;
grant execute on function public.is_admin() to authenticated;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users au where au.user_id = auth.uid() and au.role = 'owner'
  );
$$;

comment on function public.is_owner() is
  'True iff the CALLING user (auth.uid()) has an admin_users row with role = ''owner''. Gates the small set of highest-risk actions (Publish Now / replace the Live Daily, archiving the Live Daily) that must never be a casual editor action.';

revoke execute on function public.is_owner() from public;
revoke execute on function public.is_owner() from anon;
grant execute on function public.is_owner() to authenticated;

-- =========================================================================================
-- 3. CONTENT FINGERPRINT — SAME ALGORITHM AS computeContentFingerprint() IN
--    src/data/daily-questions.ts, NOT A SECOND INCOMPATIBLE ONE.
-- =========================================================================================
--
-- The client's fingerprint is: fnv1aHash(stableStringify({prompt, category, options: [...]})),
-- where stableStringify sorts object keys alphabetically (unquoted key names), preserves
-- array order, and renders strings/numbers exactly like JSON.stringify. Reproduced here
-- byte-for-byte in SQL so a server-computed approval fingerprint is guaranteed to match what
-- the client would compute for the same content — see the regression check after this
-- migration applies: admin_compute_daily_fingerprint() against the real Daily #1 row must
-- return exactly '874a49b9', the fingerprint that question was already approved and
-- published under. Internal helpers only — never called directly by any client.

create or replace function public.apparently_stable_stringify_value(v jsonb)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  keys text[];
  k text;
  parts text[] := '{}';
  elem jsonb;
  arr_parts text[] := '{}';
begin
  if v is null or jsonb_typeof(v) = 'null' then
    return 'null';
  end if;

  if jsonb_typeof(v) = 'array' then
    for elem in select * from jsonb_array_elements(v) loop
      arr_parts := array_append(arr_parts, public.apparently_stable_stringify_value(elem));
    end loop;
    return '[' || array_to_string(arr_parts, ',') || ']';
  end if;

  if jsonb_typeof(v) = 'object' then
    select array_agg(key order by key) into keys from jsonb_object_keys(v) as key;
    foreach k in array coalesce(keys, '{}') loop
      parts := array_append(parts, k || ':' || public.apparently_stable_stringify_value(v -> k));
    end loop;
    return '{' || array_to_string(parts, ',') || '}';
  end if;

  if jsonb_typeof(v) = 'string' then
    -- Re-quote/escape exactly like JSON.stringify(string): to_json() on already-unquoted
    -- text produces the same quoting/escaping rules (and, importantly, leaves non-ASCII
    -- printable characters — e.g. the curly quotes/apostrophes in Daily #1's real copy —
    -- literal rather than \u-escaping them, matching JS behavior).
    return to_json(v #>> '{}')::text;
  end if;

  -- number / boolean: jsonb's own text form already matches JSON.stringify for these.
  return v::text;
end;
$$;

revoke execute on function public.apparently_stable_stringify_value(jsonb) from public;
revoke execute on function public.apparently_stable_stringify_value(jsonb) from anon;
revoke execute on function public.apparently_stable_stringify_value(jsonb) from authenticated;

create or replace function public.apparently_content_fingerprint(p_prompt text, p_category text, p_options jsonb)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  material jsonb;
  serialized text;
  hash bigint := 2166136261; -- FNV-1a 32-bit offset basis (0x811c9dc5)
  fnv_prime bigint := 16777619; -- FNV-1a 32-bit prime (0x01000193)
  i int;
  code int;
begin
  material := jsonb_build_object(
    'prompt', btrim(p_prompt),
    'category', btrim(p_category),
    'options', p_options
  );
  serialized := public.apparently_stable_stringify_value(material);

  for i in 1..length(serialized) loop
    code := ascii(substr(serialized, i, 1));
    hash := (hash # code) & 4294967295; -- XOR, masked to 32 bits
    hash := (hash * fnv_prime) & 4294967295; -- Math.imul-equivalent 32-bit truncation
  end loop;

  return lpad(to_hex(hash), 8, '0');
end;
$$;

comment on function public.apparently_content_fingerprint(text, text, jsonb) is
  'Byte-for-byte port of fnv1aHash(stableStringify(...)) from src/data/daily-questions.ts. ascii(substr(text,i,1)) returns the Unicode code point (this database is UTF8) for each character, matching JS charCodeAt() for every character actually used in this app''s content (no astral-plane/surrogate-pair characters). Do not modify without also updating the client — the two must always agree.';

revoke execute on function public.apparently_content_fingerprint(text, text, jsonb) from public;
revoke execute on function public.apparently_content_fingerprint(text, text, jsonb) from anon;
revoke execute on function public.apparently_content_fingerprint(text, text, jsonb) from authenticated;

-- Builds the {id (=position), label, personalityEffects, apparentlyFeedback} package for
-- every option of a question, in position order, and hashes it — the "normalize remote UUID
-- options into A/B/C/D position order, using positions 1-4 as the id" rule from the sprint
-- spec, matching exactly how Daily #1 was fingerprinted by hand before this migration existed.
create or replace function public.admin_compute_daily_fingerprint(p_question_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  q record;
  opts jsonb;
begin
  select prompt, category into q from public.daily_questions where id = p_question_id;
  if q is null then
    raise exception 'Daily question not found.';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', o."position",
        'label', btrim(o.label),
        'personalityEffects', coalesce(o.personality_effects, '[]'::jsonb),
        'apparentlyFeedback', coalesce(o.apparently_feedback, '')
      )
      order by o."position"
    ),
    '[]'::jsonb
  )
  into opts
  from public.daily_options o
  where o.question_id = p_question_id;

  return public.apparently_content_fingerprint(q.prompt, q.category, opts);
end;
$$;

revoke execute on function public.admin_compute_daily_fingerprint(uuid) from public;
revoke execute on function public.admin_compute_daily_fingerprint(uuid) from anon;
revoke execute on function public.admin_compute_daily_fingerprint(uuid) from authenticated;

-- =========================================================================================
-- 4. ONE-LIVE-DAILY DATABASE GUARANTEE
-- =========================================================================================
--
-- A real database constraint, not just careful RPC code: at most one row may ever have
-- status = 'Live', enforced by Postgres itself for every writer, including any future code
-- path that isn't one of the RPCs below. Safe to add now — Daily #1 is the only Live row
-- that exists, so this creates cleanly with zero data changes.

create unique index daily_questions_single_live_idx
  on public.daily_questions (status)
  where status = 'Live';

comment on index public.daily_questions_single_live_idx is
  'Enforces "there must never intentionally be more than one Live Daily" at the database level. Every indexed row has status = ''Live'' by the partial predicate, so a second one collides on the (identical) indexed value.';

-- Real transactional safety for scheduling collisions (see admin_schedule_daily below):
-- at most one Scheduled row may ever claim a given release date. This is what actually
-- prevents a double-booked date under concurrent admin use — the RPC below just translates
-- the resulting unique-violation into a friendly message.
create unique index daily_questions_scheduled_date_unique_idx
  on public.daily_questions (scheduled_for)
  where status = 'Scheduled';

-- =========================================================================================
-- 5. READ-ONLY ADMIN RPCs
-- =========================================================================================
--
-- Every admin_* RPC in this migration follows the same shape: check is_admin()/is_owner()
-- FIRST, raise a plain 'Not authorized.' exception if that fails, and otherwise proceed as
-- SECURITY DEFINER (so it can read/write rows a consumer session's own RLS would never let
-- it touch). No admin RPC ever exposes a raw daily_answers row or voter identity.

create or replace function public.admin_list_daily_questions()
returns setof public.daily_questions
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized.';
  end if;
  return query select * from public.daily_questions order by created_at desc;
end;
$$;

revoke execute on function public.admin_list_daily_questions() from public;
revoke execute on function public.admin_list_daily_questions() from anon;
grant execute on function public.admin_list_daily_questions() to authenticated;

create or replace function public.admin_get_daily_question(p_question_id uuid)
returns public.daily_questions
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result public.daily_questions;
begin
  if not public.is_admin() then
    raise exception 'Not authorized.';
  end if;
  select * into result from public.daily_questions where id = p_question_id;
  return result;
end;
$$;

revoke execute on function public.admin_get_daily_question(uuid) from public;
revoke execute on function public.admin_get_daily_question(uuid) from anon;
grant execute on function public.admin_get_daily_question(uuid) to authenticated;

create or replace function public.admin_list_daily_options(p_question_id uuid)
returns setof public.daily_options
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized.';
  end if;
  return query select * from public.daily_options where question_id = p_question_id order by "position" asc;
end;
$$;

revoke execute on function public.admin_list_daily_options(uuid) from public;
revoke execute on function public.admin_list_daily_options(uuid) from anon;
grant execute on function public.admin_list_daily_options(uuid) to authenticated;

-- Aggregate-only Room results for Admin — deliberately separate from the consumer
-- get_daily_distribution() RPC (untouched by this migration) so Michelle can inspect real
-- results without ever needing to cast a consumer vote herself, and so the consumer
-- participation gate is never weakened to accommodate this. No voter identity is returned.
create or replace function public.admin_get_daily_distribution(p_question_id uuid)
returns table (option_id uuid, "position" smallint, label text, answer_count bigint, percent numeric, total_answers bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized.';
  end if;

  return query
  with totals as (
    select count(*)::bigint as total
    from public.daily_answers
    where question_id = p_question_id
  ),
  counts as (
    select o.id as option_id, o."position", o.label, count(a.id)::bigint as answer_count
    from public.daily_options o
    left join public.daily_answers a on a.option_id = o.id and a.question_id = p_question_id
    where o.question_id = p_question_id
    group by o.id, o."position", o.label
  )
  select
    counts.option_id,
    counts."position",
    counts.label,
    counts.answer_count,
    case when totals.total > 0 then round((counts.answer_count::numeric / totals.total) * 100, 1) else 0 end as percent,
    totals.total as total_answers
  from counts, totals
  order by counts."position";
end;
$$;

revoke execute on function public.admin_get_daily_distribution(uuid) from public;
revoke execute on function public.admin_get_daily_distribution(uuid) from anon;
grant execute on function public.admin_get_daily_distribution(uuid) to authenticated;

-- =========================================================================================
-- 6. CONTENT MUTATION — SERVER-ENFORCED LIVE/ARCHIVED IMMUTABILITY +
--    APPROVAL INVALIDATION ON MATERIAL EDIT
-- =========================================================================================

create or replace function public.admin_update_daily_content(p_question_id uuid, p_prompt text, p_category text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cur record;
begin
  if not public.is_admin() then
    raise exception 'Not authorized.';
  end if;

  select status into cur from public.daily_questions where id = p_question_id for update;
  if cur is null then
    raise exception 'Daily question not found.';
  end if;
  if cur.status in ('Live', 'Archived') then
    raise exception 'Live and Archived Daily content is immutable.';
  end if;

  update public.daily_questions set prompt = p_prompt, category = p_category where id = p_question_id;

  -- A material edit to Approved/Scheduled content must invalidate approval — it must never
  -- silently remain Approved/Scheduled with content nobody actually approved.
  if cur.status in ('Approved', 'Scheduled') then
    update public.daily_questions
    set status = 'NeedsRevision', scheduled_for = null, approved_by = null, approved_at = null, approved_content_version = null
    where id = p_question_id;
  end if;
end;
$$;

revoke execute on function public.admin_update_daily_content(uuid, text, text) from public;
revoke execute on function public.admin_update_daily_content(uuid, text, text) from anon;
grant execute on function public.admin_update_daily_content(uuid, text, text) to authenticated;

create or replace function public.admin_update_daily_option(
  p_option_id uuid,
  p_label text,
  p_personality_effects jsonb,
  p_apparently_feedback text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  opt record;
begin
  if not public.is_admin() then
    raise exception 'Not authorized.';
  end if;

  select o.question_id as question_id, q.status as parent_status
  into opt
  from public.daily_options o
  join public.daily_questions q on q.id = o.question_id
  where o.id = p_option_id
  for update of o;

  if opt is null then
    raise exception 'Daily option not found.';
  end if;
  if opt.parent_status in ('Live', 'Archived') then
    raise exception 'Live and Archived Daily content is immutable.';
  end if;

  update public.daily_options
  set label = p_label,
      personality_effects = coalesce(p_personality_effects, '[]'::jsonb),
      apparently_feedback = p_apparently_feedback
  where id = p_option_id;

  if opt.parent_status in ('Approved', 'Scheduled') then
    update public.daily_questions
    set status = 'NeedsRevision', scheduled_for = null, approved_by = null, approved_at = null, approved_content_version = null
    where id = opt.question_id;
  end if;
end;
$$;

revoke execute on function public.admin_update_daily_option(uuid, text, jsonb, text) from public;
revoke execute on function public.admin_update_daily_option(uuid, text, jsonb, text) from anon;
grant execute on function public.admin_update_daily_option(uuid, text, jsonb, text) to authenticated;

-- =========================================================================================
-- 7. LIFECYCLE RPCs — REPRODUCES THE EXACT TRANSITION GRAPH FROM
--    STATUS_TRANSITIONS IN src/data/daily-questions.ts
-- =========================================================================================
--
-- Idea->Draft; Draft->{ReadyForReview,Rejected}; ReadyForReview->{Approved,NeedsRevision,
-- Rejected}; NeedsRevision->{Draft,ReadyForReview}; Approved->{Scheduled,NeedsRevision};
-- Scheduled->{Live,NeedsRevision,Approved}; Live->{Archived}; Rejected->{Draft};
-- Archived->{}. Every function below checks the FROM status explicitly rather than trusting
-- the client to only ever call the "right" one — an arbitrary/out-of-order call just raises.

create or replace function public.admin_create_daily()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Not authorized.';
  end if;

  -- Draft, with placeholder content — allowed ONLY because Draft can never be approved
  -- while it still looks like this (see admin_approve_daily''s completeness checks below).
  -- Creating a Draft never publishes anything: sort_order 0 keeps it out of any Live/
  -- Scheduled ordering concern.
  insert into public.daily_questions (prompt, category, status, sort_order)
  values ('Untitled question', 'General', 'Draft', 0)
  returning id into new_id;

  insert into public.daily_options (question_id, "position", label)
  values
    (new_id, 1, 'Option A'),
    (new_id, 2, 'Option B'),
    (new_id, 3, 'Option C'),
    (new_id, 4, 'Option D');

  return new_id;
end;
$$;

revoke execute on function public.admin_create_daily() from public;
revoke execute on function public.admin_create_daily() from anon;
grant execute on function public.admin_create_daily() to authenticated;

create or replace function public.admin_move_to_draft(p_question_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cur record;
begin
  if not public.is_admin() then
    raise exception 'Not authorized.';
  end if;

  select status into cur from public.daily_questions where id = p_question_id for update;
  if cur is null then
    raise exception 'Daily question not found.';
  end if;
  if cur.status not in ('Idea', 'NeedsRevision', 'Rejected') then
    raise exception 'This Daily cannot move to Draft from its current status.';
  end if;

  update public.daily_questions set status = 'Draft' where id = p_question_id;
end;
$$;

revoke execute on function public.admin_move_to_draft(uuid) from public;
revoke execute on function public.admin_move_to_draft(uuid) from anon;
grant execute on function public.admin_move_to_draft(uuid) to authenticated;

create or replace function public.admin_submit_for_review(p_question_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cur record;
begin
  if not public.is_admin() then
    raise exception 'Not authorized.';
  end if;

  select status into cur from public.daily_questions where id = p_question_id for update;
  if cur is null then
    raise exception 'Daily question not found.';
  end if;
  if cur.status not in ('Draft', 'NeedsRevision') then
    raise exception 'This Daily cannot be submitted for review from its current status.';
  end if;

  update public.daily_questions set status = 'ReadyForReview' where id = p_question_id;
end;
$$;

revoke execute on function public.admin_submit_for_review(uuid) from public;
revoke execute on function public.admin_submit_for_review(uuid) from anon;
grant execute on function public.admin_submit_for_review(uuid) to authenticated;

-- Mirrors getCompletenessIssues() in src/data/daily-questions.ts exactly: non-placeholder
-- prompt, non-empty category, exactly 4 options, each with non-placeholder wording, at
-- least one personality effect, and an Apparently response. Stamps real approval metadata —
-- approved_by = auth.uid() (never a client-supplied value), approved_at = now(),
-- approved_content_version = the real fingerprint (see section 3).
create or replace function public.admin_approve_daily(p_question_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  q record;
  opt_count int;
  bad_count int;
begin
  if not public.is_admin() then
    raise exception 'Not authorized.';
  end if;

  select * into q from public.daily_questions where id = p_question_id for update;
  if q is null then
    raise exception 'Daily question not found.';
  end if;
  if q.status <> 'ReadyForReview' then
    raise exception 'Only a Daily that is Ready for Review can be approved.';
  end if;

  if btrim(q.prompt) = '' or btrim(q.prompt) = 'Untitled question' then
    raise exception 'Question wording is missing.';
  end if;
  if btrim(q.category) = '' then
    raise exception 'Category is missing.';
  end if;

  select count(*) into opt_count from public.daily_options where question_id = p_question_id;
  if opt_count <> 4 then
    raise exception 'Expected exactly 4 answer choices, found %.', opt_count;
  end if;

  select count(*) into bad_count
  from public.daily_options
  where question_id = p_question_id
    and (
      btrim(label) = '' or label ~ '^Option [A-D]$'
      or personality_effects is null or jsonb_array_length(personality_effects) = 0
      or apparently_feedback is null or btrim(apparently_feedback) = ''
    );
  if bad_count > 0 then
    raise exception 'One or more answers are missing wording, a personality signal, or an Apparently response.';
  end if;

  update public.daily_questions
  set status = 'Approved',
      approved_by = auth.uid(),
      approved_at = now(),
      approved_content_version = public.admin_compute_daily_fingerprint(p_question_id)
  where id = p_question_id;
end;
$$;

revoke execute on function public.admin_approve_daily(uuid) from public;
revoke execute on function public.admin_approve_daily(uuid) from anon;
grant execute on function public.admin_approve_daily(uuid) to authenticated;

create or replace function public.admin_send_to_revision(p_question_id uuid, p_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cur record;
begin
  if not public.is_admin() then
    raise exception 'Not authorized.';
  end if;

  select status into cur from public.daily_questions where id = p_question_id for update;
  if cur is null then
    raise exception 'Daily question not found.';
  end if;
  if cur.status not in ('ReadyForReview', 'Approved', 'Scheduled') then
    raise exception 'This Daily cannot be sent to revision from its current status.';
  end if;

  update public.daily_questions
  set status = 'NeedsRevision', review_note = p_note, scheduled_for = null, approved_by = null, approved_at = null, approved_content_version = null
  where id = p_question_id;
end;
$$;

revoke execute on function public.admin_send_to_revision(uuid, text) from public;
revoke execute on function public.admin_send_to_revision(uuid, text) from anon;
grant execute on function public.admin_send_to_revision(uuid, text) to authenticated;

create or replace function public.admin_reject_daily(p_question_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cur record;
begin
  if not public.is_admin() then
    raise exception 'Not authorized.';
  end if;

  select status into cur from public.daily_questions where id = p_question_id for update;
  if cur is null then
    raise exception 'Daily question not found.';
  end if;
  if cur.status not in ('Draft', 'ReadyForReview') then
    raise exception 'This Daily cannot be rejected from its current status.';
  end if;

  update public.daily_questions set status = 'Rejected' where id = p_question_id;
end;
$$;

revoke execute on function public.admin_reject_daily(uuid) from public;
revoke execute on function public.admin_reject_daily(uuid) from anon;
grant execute on function public.admin_reject_daily(uuid) to authenticated;

-- Collision handling: real transactional safety comes from
-- daily_questions_scheduled_date_unique_idx (section 4) — this function attempts the update
-- and translates the resulting unique-violation into a clear message. Deliberately does NOT
-- implement "insert and shift every later Scheduled Daily back a day" — doing that safely
-- against a real concurrent database is its own transactional-queue-reordering design that
-- did not fit safely into this sprint. See the final report: that specific convenience
-- behavior is explicitly deferred to a follow-up sprint, not silently dropped.
create or replace function public.admin_schedule_daily(p_question_id uuid, p_date date)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cur record;
begin
  if not public.is_admin() then
    raise exception 'Not authorized.';
  end if;

  select status into cur from public.daily_questions where id = p_question_id for update;
  if cur is null then
    raise exception 'Daily question not found.';
  end if;
  if cur.status <> 'Approved' then
    raise exception 'Only an Approved Daily can be scheduled.';
  end if;

  begin
    update public.daily_questions set status = 'Scheduled', scheduled_for = p_date where id = p_question_id;
  exception when unique_violation then
    raise exception 'That date already belongs to another Scheduled Daily.';
  end;
end;
$$;

revoke execute on function public.admin_schedule_daily(uuid, date) from public;
revoke execute on function public.admin_schedule_daily(uuid, date) from anon;
grant execute on function public.admin_schedule_daily(uuid, date) to authenticated;

create or replace function public.admin_unschedule_daily(p_question_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cur record;
begin
  if not public.is_admin() then
    raise exception 'Not authorized.';
  end if;

  select status into cur from public.daily_questions where id = p_question_id for update;
  if cur is null then
    raise exception 'Daily question not found.';
  end if;
  if cur.status <> 'Scheduled' then
    raise exception 'Only a Scheduled Daily can be unscheduled.';
  end if;

  update public.daily_questions set status = 'Approved', scheduled_for = null where id = p_question_id;
end;
$$;

revoke execute on function public.admin_unschedule_daily(uuid) from public;
revoke execute on function public.admin_unschedule_daily(uuid) from anon;
grant execute on function public.admin_unschedule_daily(uuid) to authenticated;

create or replace function public.admin_delete_daily(p_question_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cur record;
begin
  if not public.is_admin() then
    raise exception 'Not authorized.';
  end if;

  select status into cur from public.daily_questions where id = p_question_id for update;
  if cur is null then
    raise exception 'Daily question not found.';
  end if;
  if cur.status not in ('Idea', 'Draft', 'ReadyForReview', 'NeedsRevision', 'Rejected') then
    raise exception 'This Daily cannot be deleted from its current status.';
  end if;

  delete from public.daily_questions where id = p_question_id;
end;
$$;

revoke execute on function public.admin_delete_daily(uuid) from public;
revoke execute on function public.admin_delete_daily(uuid) from anon;
grant execute on function public.admin_delete_daily(uuid) to authenticated;

-- =========================================================================================
-- 8. OWNER-ONLY: PUBLISH + ARCHIVE THE LIVE DAILY
-- =========================================================================================
--
-- The only two actions in this migration gated on is_owner() rather than is_admin() — both
-- directly change what real consumers see as the Live Daily in production, which is exactly
-- the "emergency: PUBLISH NOW / REPLACE CURRENT LIVE DAILY must be OWNER-only" boundary from
-- the sprint spec. Everything upstream of this (draft, review, approve, schedule) may be
-- owner OR editor.

-- Transactional by construction: both UPDATE statements run inside this one function
-- invocation's single implicit transaction — there is no way for a caller to observe an
-- intermediate state with two Live rows, and no way for the old Live row to end up Archived
-- while the new one fails to publish (a raised exception anywhere above rolls the whole
-- function back, including the archive step).
create or replace function public.admin_publish_daily(p_question_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target record;
  computed_fingerprint text;
begin
  if not public.is_owner() then
    raise exception 'Not authorized. Publishing is owner-only.';
  end if;

  select * into target from public.daily_questions where id = p_question_id for update;
  if target is null then
    raise exception 'Daily question not found.';
  end if;
  if target.status not in ('Approved', 'Scheduled') then
    raise exception 'Only an Approved or Scheduled Daily can be published.';
  end if;
  if target.approved_content_version is null then
    raise exception 'This Daily has no recorded approval.';
  end if;

  -- Defense-in-depth re-check: content edits are supposed to invalidate approval
  -- automatically (section 6 above), so this should never actually fire in normal use —
  -- but publish is the single highest-stakes action in this whole system, so it re-derives
  -- the real fingerprint and refuses rather than trusting stored state alone.
  computed_fingerprint := public.admin_compute_daily_fingerprint(p_question_id);
  if computed_fingerprint <> target.approved_content_version then
    raise exception 'Content has changed since approval. Re-approve before publishing.';
  end if;

  update public.daily_questions set status = 'Archived' where status = 'Live';

  update public.daily_questions
  set status = 'Live', scheduled_for = null, published_for = current_date
  where id = p_question_id;
end;
$$;

comment on function public.admin_publish_daily(uuid) is
  'The only path in this system to Live. Owner-only. Archives whatever is currently Live (if anything) and sets the target Live in one transaction — see daily_questions_single_live_idx for the database-level backstop. Re-verifies the approval fingerprint before doing anything, refusing if content drifted since approval.';

revoke execute on function public.admin_publish_daily(uuid) from public;
revoke execute on function public.admin_publish_daily(uuid) from anon;
grant execute on function public.admin_publish_daily(uuid) to authenticated;

create or replace function public.admin_archive_live_daily(p_question_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target record;
begin
  if not public.is_owner() then
    raise exception 'Not authorized. Archiving the Live Daily is owner-only.';
  end if;

  select * into target from public.daily_questions where id = p_question_id for update;
  if target is null then
    raise exception 'Daily question not found.';
  end if;
  if target.status <> 'Live' then
    raise exception 'Only the current Live Daily can be archived with this action.';
  end if;

  update public.daily_questions set status = 'Archived' where id = p_question_id;
end;
$$;

revoke execute on function public.admin_archive_live_daily(uuid) from public;
revoke execute on function public.admin_archive_live_daily(uuid) from anon;
grant execute on function public.admin_archive_live_daily(uuid) to authenticated;
