-- Apparently You — Public + Private Daily rooms, and explicit PROFILE / ROOM_ONLY Daily modes.
--
-- Two simultaneous "current questions" now exist: one PUBLIC (the existing beta-week Daily,
-- completely unchanged in spirit), one PRIVATE (a new, more personal room, access-gated).
-- Every existing daily_questions row is backfilled to room='public' — Public behavior is
-- byte-for-byte unaffected by this migration; nothing about the currently Live/Scheduled
-- Public queue changes.
--
-- Also formalizes something that was previously implicit: a Daily's completeness check always
-- required non-empty personality_effects on every option. That is no longer correct — a
-- ROOM_ONLY Daily (funny/preference/Room-only content) must have EMPTY personality_effects and
-- must never create personality_evidence, by construction, not by convention. daily_mode makes
-- that an explicit, validated column rather than "an empty array probably means room-only."

-- =========================================================================================
-- 1. New enums + columns (all existing rows get safe, behavior-preserving defaults)
-- =========================================================================================

create type public.daily_room as enum ('public', 'private');
create type public.daily_mode as enum ('profile', 'room_only');

alter table public.daily_questions
  add column room public.daily_room not null default 'public',
  add column daily_mode public.daily_mode not null default 'profile',
  add column is_free_private_unlock boolean not null default false;

comment on column public.daily_questions.room is
  'public: the existing beta-week Daily room, unchanged. private: Apparently Private''s Daily room — access-gated, see get_private_daily()/submit_private_daily_answer().';
comment on column public.daily_questions.daily_mode is
  'profile: this Daily''s options may carry personality_effects and contribute to the You profile (existing default behavior). room_only: options MUST have empty personality_effects and this Daily never creates personality_evidence or counts toward profileAnswerCount/Your7 — still has a real Room and an Apparently reaction, just never personality-scored.';
comment on column public.daily_questions.is_free_private_unlock is
  'Editorial flag: when true, this Private Daily is answerable by every consumer (not just TestFlight testers), same as a Public Daily. Permanent content, not build/environment behavior — TestFlight tester access is a SEPARATE, client-asserted override handled entirely in get_private_daily()/submit_private_daily_answer(), never stored here.';

-- =========================================================================================
-- 2. Per-room Live constraint (was: one Live question globally)
-- =========================================================================================

drop index public.daily_questions_single_live_idx;

-- Among Live rows, `room` must be unique -- i.e. at most one Live row per room. Permits
-- exactly one Public Live AND one Private Live simultaneously; blocks two Live in either room.
create unique index daily_questions_single_live_idx
  on public.daily_questions (room)
  where (status = 'Live'::daily_status);

-- =========================================================================================
-- 3. Per-(date, room) Scheduled constraint (was: one Scheduled question per date globally)
-- =========================================================================================
--
-- The same calendar date must now be able to hold BOTH a Scheduled Public AND a Scheduled
-- Private Daily simultaneously — only a duplicate within the SAME room on the SAME date is a
-- conflict.

drop index public.daily_questions_scheduled_date_unique_idx;

create unique index daily_questions_scheduled_date_unique_idx
  on public.daily_questions (scheduled_for, room)
  where (status = 'Scheduled'::daily_status);

-- =========================================================================================
-- 4. Fingerprint now covers room / daily_mode / is_free_private_unlock
-- =========================================================================================
--
-- These are editorially material — a Daily silently switching rooms or modes after approval
-- must invalidate that approval exactly like a prompt/label edit already does. New trailing
-- defaulted params keep this the SAME function (same OID, same existing revokes) per Postgres'
-- own CREATE OR REPLACE rules for adding defaulted parameters.

create or replace function public.apparently_content_fingerprint(
  p_prompt text,
  p_category text,
  p_options jsonb,
  p_room text default 'public',
  p_daily_mode text default 'profile',
  p_is_free_private_unlock boolean default false
)
returns text
language plpgsql
immutable
set search_path to 'public'
as $function$
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
    'options', p_options,
    'room', p_room,
    'dailyMode', p_daily_mode,
    'isFreePrivateUnlock', p_is_free_private_unlock
  );
  serialized := public.apparently_stable_stringify_value(material);

  for i in 1..length(serialized) loop
    code := ascii(substr(serialized, i, 1));
    hash := (hash # code) & 4294967295;
    hash := (hash * fnv_prime) & 4294967295;
  end loop;

  return lpad(to_hex(hash), 8, '0');
end;
$function$;

create or replace function public.admin_compute_daily_fingerprint(p_question_id uuid)
returns text
language plpgsql
stable security definer
set search_path to 'public'
as $function$
declare
  q record;
  opts jsonb;
begin
  select prompt, category, room, daily_mode, is_free_private_unlock into q
  from public.daily_questions where id = p_question_id;
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

  return public.apparently_content_fingerprint(q.prompt, q.category, opts, q.room::text, q.daily_mode::text, q.is_free_private_unlock);
end;
$function$;

-- Re-stamp every currently-approved-or-later row under the NEW fingerprint formula. Nothing
-- about their actual content changed (room defaults to 'public', daily_mode to 'profile',
-- is_free_private_unlock to false — exactly what they already were in substance); only the
-- HASH INPUT SHAPE changed by adding these fields. Without this, the existing Scheduled
-- Public queue (Sep 19-22) would incorrectly appear to have "changed since approval" the next
-- time the scheduler or admin_publish_daily re-derives the fingerprint.
update public.daily_questions
set approved_content_version = public.admin_compute_daily_fingerprint(id)
where status in ('Approved', 'Scheduled', 'Live') and approved_content_version is not null;

-- =========================================================================================
-- 5. admin_create_daily / admin_update_daily_content — room + mode aware
-- =========================================================================================

create or replace function public.admin_create_daily(
  p_room public.daily_room default 'public',
  p_daily_mode public.daily_mode default 'profile'
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  new_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Not authorized.';
  end if;

  insert into public.daily_questions (prompt, category, status, sort_order, room, daily_mode)
  values ('Untitled question', 'General', 'Draft', 0, p_room, p_daily_mode)
  returning id into new_id;

  insert into public.daily_options (question_id, "position", label)
  values
    (new_id, 1, 'Option A'),
    (new_id, 2, 'Option B'),
    (new_id, 3, 'Option C'),
    (new_id, 4, 'Option D');

  return new_id;
end;
$function$;

create or replace function public.admin_update_daily_content(
  p_question_id uuid,
  p_prompt text,
  p_category text,
  p_room public.daily_room default null,
  p_daily_mode public.daily_mode default null,
  p_is_free_private_unlock boolean default null
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
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

  update public.daily_questions
  set prompt = p_prompt,
      category = p_category,
      room = coalesce(p_room, room),
      daily_mode = coalesce(p_daily_mode, daily_mode),
      is_free_private_unlock = coalesce(p_is_free_private_unlock, is_free_private_unlock)
  where id = p_question_id;

  -- A material edit (content OR room/mode/free-unlock) to Approved/Scheduled content must
  -- invalidate approval — never silently remain Approved/Scheduled with content nobody
  -- actually approved in its current shape.
  if cur.status in ('Approved', 'Scheduled') then
    update public.daily_questions
    set status = 'NeedsRevision', scheduled_for = null, approved_by = null, approved_at = null, approved_content_version = null
    where id = p_question_id;
  end if;
end;
$function$;

-- =========================================================================================
-- 6. admin_approve_daily — mode-aware completeness (ROOM_ONLY requires EMPTY effects;
--    PROFILE requires 1-3 canonical effects, same as before plus the new max-3/canonical check)
-- =========================================================================================

create or replace function public.admin_approve_daily(p_question_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  q record;
  opt_count int;
  bad_count int;
  bad_profile_count int;
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

  -- Baseline, mode-independent: real wording and a real Apparently reaction are ALWAYS
  -- required, regardless of PROFILE vs ROOM_ONLY.
  select count(*) into bad_count
  from public.daily_options
  where question_id = p_question_id
    and (
      btrim(label) = '' or label ~ '^Option [A-D]$'
      or apparently_feedback is null or btrim(apparently_feedback) = ''
    );
  if bad_count > 0 then
    raise exception 'One or more answers are missing wording or an Apparently response.';
  end if;

  if q.daily_mode = 'room_only' then
    -- ROOM_ONLY: personality_effects MUST be empty -- this is what keeps a Room-only Daily
    -- from ever silently becoming personality evidence.
    select count(*) into bad_count
    from public.daily_options
    where question_id = p_question_id
      and personality_effects is not null
      and jsonb_array_length(personality_effects) > 0;
    if bad_count > 0 then
      raise exception 'Room-only Dailies must have empty personality effects on every option.';
    end if;
  else
    -- PROFILE: at least one effect required (existing rule), max 3, every dimension
    -- canonical, every value in {-2,-1,1,2} -- the same validation submit_quiz_result already
    -- applies to quiz results, now applied here too rather than trusting Admin-entered JSON.
    select count(*) into bad_count
    from public.daily_options
    where question_id = p_question_id
      and (personality_effects is null or jsonb_array_length(personality_effects) = 0);
    if bad_count > 0 then
      raise exception 'One or more answers are missing a personality signal.';
    end if;

    select count(*) into bad_profile_count
    from public.daily_options o
    where o.question_id = p_question_id
      and (
        jsonb_array_length(o.personality_effects) > 3
        or exists (
          select 1 from jsonb_array_elements(o.personality_effects) eff
          where not (eff ->> 'dimension') in (
            'planner_spontaneous', 'emotional_intensity', 'direct_indirect', 'social_attunement',
            'protective_hands_off', 'adventure_comfort', 'independent_collaborative', 'control_allowing',
            'practical_idealistic', 'sentimental_thick_skinned', 'rules_bending', 'conflict_peacekeeping',
            'trust_verify', 'forgiving_receipts', 'playful_serious', 'competitive_cooperative',
            'curious_decisive', 'private_open', 'patient_urgent', 'ambitious_content'
          )
          or not ((eff ->> 'value')::int in (-2, -1, 1, 2))
        )
      );
    if bad_profile_count > 0 then
      raise exception 'One or more answers have an invalid personality signal (max 3, canonical dimension, value in {-2,-1,1,2}).';
    end if;
  end if;

  update public.daily_questions
  set status = 'Approved',
      approved_by = auth.uid(),
      approved_at = now(),
      approved_content_version = public.admin_compute_daily_fingerprint(p_question_id)
  where id = p_question_id;
end;
$function$;

-- =========================================================================================
-- 7. admin_publish_daily / publish_scheduled_daily_for_today — archive only the SAME room
-- =========================================================================================

create or replace function public.admin_publish_daily(p_question_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
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

  computed_fingerprint := public.admin_compute_daily_fingerprint(p_question_id);
  if computed_fingerprint <> target.approved_content_version then
    raise exception 'Content has changed since approval. Re-approve before publishing.';
  end if;

  -- Archive only the previous Live question IN THE SAME ROOM -- publishing Private must
  -- never archive Public, and vice versa.
  update public.daily_questions set status = 'Archived' where status = 'Live' and room = target.room;

  update public.daily_questions
  set status = 'Live', scheduled_for = null, published_for = current_date
  where id = p_question_id;
end;
$function$;

-- Internal, per-room promotion logic shared by the cron entrypoint below. Not a consumer or
-- Admin-facing RPC -- never granted to anon/authenticated, only ever called from within
-- publish_scheduled_daily_for_today()'s own SECURITY DEFINER context.
create or replace function public.publish_scheduled_daily_for_room(p_room public.daily_room, p_local_today date)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  target record;
  computed_fingerprint text;
begin
  select * into target
  from public.daily_questions
  where status = 'Scheduled' and scheduled_for = p_local_today and room = p_room
  for update;

  if target is null then
    return;
  end if;
  if target.status <> 'Scheduled' then
    return;
  end if;
  if target.approved_content_version is null then
    raise exception 'Cannot auto-publish %: no recorded approval.', target.id;
  end if;

  computed_fingerprint := public.admin_compute_daily_fingerprint(target.id);
  if computed_fingerprint <> target.approved_content_version then
    raise exception 'Cannot auto-publish %: content has changed since approval.', target.id;
  end if;

  -- Archive only the previous Live question in THIS room -- the per-room single-Live index
  -- is the database-level backstop even under a race; the other room's Live row is never
  -- touched by this update.
  update public.daily_questions set status = 'Archived' where status = 'Live' and room = p_room;

  update public.daily_questions
  set status = 'Live', scheduled_for = null, published_for = p_local_today
  where id = target.id;
end;
$function$;

revoke all on function public.publish_scheduled_daily_for_room(public.daily_room, date) from public;
revoke all on function public.publish_scheduled_daily_for_room(public.daily_room, date) from anon;
revoke all on function public.publish_scheduled_daily_for_room(public.daily_room, date) from authenticated;

create or replace function public.publish_scheduled_daily_for_today()
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  local_today date;
begin
  -- America/Anchorage remains the ONE place "today" is decided for automatic rollover.
  local_today := (now() at time zone 'America/Anchorage')::date;

  -- Each room is promoted independently -- a Scheduled Public and a Scheduled Private for the
  -- same local_today both get published in this one run, each only archiving its own room's
  -- previous Live row.
  perform public.publish_scheduled_daily_for_room('public'::public.daily_room, local_today);
  perform public.publish_scheduled_daily_for_room('private'::public.daily_room, local_today);
end;
$function$;

comment on function public.publish_scheduled_daily_for_today() is
  'Automatic Daily rollover for both rooms independently (public, private) — see publish_scheduled_daily_for_room(). Permanent no-catch-up rule unchanged: only scheduled_for = today (America/Anchorage) is ever promoted. Invoked by the apparently_daily_rollover pg_cron job, hourly.';

-- =========================================================================================
-- 8. Trigger hardening: personality_evidence ONLY for daily_mode = 'profile'
-- =========================================================================================
--
-- Previously this trigger just iterated whatever was in personality_effects (empty array =
-- naturally zero iterations = zero evidence rows — already correct by accident for an
-- all-empty-effects option). This makes that explicit and server-enforced: even if a future
-- bug ever left a stray effect on a room_only option, this trigger still refuses to create
-- evidence for it, because it checks daily_mode directly rather than trusting the array being
-- empty.

create or replace function public.handle_daily_answer_personality_evidence()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_prompt text;
  v_category text;
  v_daily_mode public.daily_mode;
  v_option_label text;
  v_effects jsonb;
  v_effect jsonb;
begin
  select prompt, category, daily_mode
    into v_prompt, v_category, v_daily_mode
    from public.daily_questions
    where id = new.question_id;

  -- Room-only Dailies never contribute personality evidence, full stop — regardless of what
  -- (if anything, which should be nothing) is stored on the chosen option.
  if v_daily_mode <> 'profile' then
    return new;
  end if;

  select label, personality_effects
    into v_option_label, v_effects
    from public.daily_options
    where id = new.option_id;

  if v_effects is null or jsonb_typeof(v_effects) <> 'array' then
    return new;
  end if;

  for v_effect in select * from jsonb_array_elements(v_effects)
  loop
    insert into public.personality_evidence (
      user_id, source_type, source_id, question_snapshot, answer_snapshot,
      category, dimension, effect
    )
    values (
      new.user_id,
      'daily_answer',
      new.id::text,
      v_prompt,
      v_option_label,
      v_category,
      v_effect ->> 'dimension',
      (v_effect ->> 'value')::smallint
    )
    on conflict (user_id, source_type, source_id, dimension) do nothing;
  end loop;

  return new;
end;
$function$;

-- =========================================================================================
-- 9. RLS: lock direct table access to PUBLIC only -- Private goes through the RPCs below
-- =========================================================================================
--
-- daily_questions itself is untouched: the PROMPT of a Live/Archived Private Daily stays
-- visible to everyone (needed for the always-shown teaser) — nothing sensitive lives on that
-- table. The sensitive surface is daily_options (choice text) and daily_answers (the vote
-- itself); those are what get tightened.

drop policy daily_options_select_for_consumer_visible_questions on public.daily_options;

create policy daily_options_select_for_consumer_visible_questions
  on public.daily_options
  for select
  to authenticated
  using (
    exists (
      select 1 from public.daily_questions q
      where q.id = daily_options.question_id
        and q.status in ('Live', 'Archived')
        and (
          q.room = 'public'
          or q.is_free_private_unlock
          or exists (
            select 1 from public.daily_answers a
            where a.user_id = (select auth.uid()) and a.question_id = q.id
          )
        )
    )
  );

comment on policy daily_options_select_for_consumer_visible_questions on public.daily_options is
  'Public Daily options: visible to everyone (unchanged). Private Daily options: visible only once free-unlock is true OR the caller has already answered — a locked, non-unlocked Private Daily''s choice text is never exposed via a raw table read. TestFlight tester access is NOT expressible in RLS (no server-verifiable signal); testers read Private options exclusively through get_private_daily(p_tester_access), a SECURITY DEFINER RPC that bypasses this policy.';

drop policy daily_answers_insert_own on public.daily_answers;

create policy daily_answers_insert_own
  on public.daily_answers
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.daily_questions q
      where q.id = daily_answers.question_id
        and q.status = 'Live'
        and q.room = 'public'
    )
  );

comment on policy daily_answers_insert_own on public.daily_answers is
  'Direct-table INSERT stays available for PUBLIC Live Dailies only (unchanged behavior). Private Daily answers can ONLY be inserted via submit_private_daily_answer(), a SECURITY DEFINER RPC that enforces free-unlock/tester-access/already-answered gating server-side before writing — never via a raw insert, so a locked Private Daily cannot be voted on by crafting a direct REST request.';

-- =========================================================================================
-- 10. Private Daily access RPCs
-- =========================================================================================
--
-- SECURITY NOTE on p_tester_access: this parameter is CLIENT-ASSERTED, not cryptographically
-- verified — there is no app-attestation infrastructure in this project. It is deliberately
-- narrow in what it can do (only ever widens visibility of ONE already-scoped Private Daily
-- question to a single already-authenticated caller; it can never read another user's data,
-- never touches billing, never grants Admin access). The real access boundary for this
-- TestFlight beta is Apple's own TestFlight distribution (who has the build); the normal
-- production/web build never sets EXPO_PUBLIC_PRIVATE_DAILY_TESTER_ACCESS=true, so no
-- ordinary user's client ever sends p_tester_access=true. A determined technical user COULD
-- call this RPC directly with p_tester_access=true — acceptable for a small trusted beta
-- product-concept test, explicitly NOT acceptable once real paid entitlements exist. Real
-- app-attestation (or a server-verified entitlement) is required before this pattern should
-- gate anything monetized.

create or replace function public.get_private_daily(p_tester_access boolean default false)
returns table (
  question_id uuid,
  prompt text,
  category text,
  daily_mode public.daily_mode,
  is_free_private_unlock boolean,
  published_for date,
  access_level text,
  options jsonb
)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  q record;
  v_user uuid;
  v_has_answered boolean;
  v_unlocked boolean;
begin
  v_user := auth.uid();

  select * into q from public.daily_questions where room = 'private' and status = 'Live' limit 1;
  if q is null then
    return;
  end if;

  v_has_answered := v_user is not null and exists (
    select 1 from public.daily_answers a where a.user_id = v_user and a.question_id = q.id
  );
  v_unlocked := coalesce(p_tester_access, false) or q.is_free_private_unlock or v_has_answered;

  return query
  select
    q.id,
    q.prompt,
    q.category,
    q.daily_mode,
    q.is_free_private_unlock,
    q.published_for,
    case when v_unlocked then 'unlocked' else 'locked' end,
    case when v_unlocked then (
      select jsonb_agg(
        jsonb_build_object(
          'id', o.id,
          'position', o."position",
          'label', o.label,
          'personalityEffects', coalesce(o.personality_effects, '[]'::jsonb),
          'apparentlyFeedback', o.apparently_feedback
        )
        order by o."position"
      )
      from public.daily_options o
      where o.question_id = q.id
    ) else null end;
end;
$function$;

comment on function public.get_private_daily(boolean) is
  'The one read path for the current Live Private Daily. Always returns the prompt (the teaser). Returns full option data (label/effects/reaction) ONLY when unlocked: free-unlock, an already-recorded answer, or p_tester_access=true (TestFlight beta build only — see the security note on this function''s migration). A locked, non-unlocked caller gets access_level=''locked'' and options=null — never partial/usable choice data.';

revoke all on function public.get_private_daily(boolean) from public;
revoke all on function public.get_private_daily(boolean) from anon;
grant execute on function public.get_private_daily(boolean) to authenticated;

create or replace function public.submit_private_daily_answer(
  p_question_id uuid,
  p_option_id uuid,
  p_tester_access boolean default false
)
returns table (answer_id uuid, option_id uuid)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  q record;
  v_user uuid;
  v_unlocked boolean;
  v_new_id uuid;
begin
  v_user := auth.uid();
  if v_user is null then
    raise exception 'Not authenticated.';
  end if;

  select * into q from public.daily_questions where id = p_question_id for update;
  if q is null or q.room <> 'private' or q.status <> 'Live' then
    raise exception 'This Private Daily is not currently answerable.';
  end if;

  v_unlocked := coalesce(p_tester_access, false) or q.is_free_private_unlock;
  if not v_unlocked then
    raise exception 'This Private Daily is locked.';
  end if;

  if not exists (select 1 from public.daily_options o where o.id = p_option_id and o.question_id = p_question_id) then
    raise exception 'Invalid option for this question.';
  end if;

  insert into public.daily_answers (user_id, question_id, option_id)
  values (v_user, p_question_id, p_option_id)
  returning id into v_new_id;

  return query select v_new_id, p_option_id;
end;
$function$;

comment on function public.submit_private_daily_answer(uuid, uuid, boolean) is
  'The one write path for a Private Daily vote. Re-validates server-side (room=private, status=Live, unlocked via free-unlock or p_tester_access) before inserting — never trusts the client''s locked/unlocked UI state. Relies on daily_answers'' existing UNIQUE(user_id, question_id) for one-answer-per-question immutability and idempotent-retry safety, same guarantee Public Dailies already have. Fires the same handle_daily_answer_personality_evidence trigger as any daily_answers insert — daily_mode still governs whether that produces evidence.';

revoke all on function public.submit_private_daily_answer(uuid, uuid, boolean) from public;
revoke all on function public.submit_private_daily_answer(uuid, uuid, boolean) from anon;
grant execute on function public.submit_private_daily_answer(uuid, uuid, boolean) to authenticated;
