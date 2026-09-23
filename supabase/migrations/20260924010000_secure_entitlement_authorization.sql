-- CRITICAL SECURITY CORRECTION: replaces the client-asserted p_premium/p_tester_access
-- parameters on get_private_daily/submit_private_daily_answer (added in
-- 20260923010000_private_daily_premium_unlock.sql, and originally p_tester_access in
-- 20260918010000_public_private_daily_rooms.sql) with server-authoritative state. A caller
-- could previously invoke either RPC directly with p_premium=true or p_tester_access=true and
-- receive real paid/tester-gated content with no verified purchase or grant behind it. This
-- migration removes that entirely -- neither RPC accepts any such parameter anymore; both
-- derive authorization exclusively from server-side tables that only a service-role Edge
-- Function (user_entitlements) or an authenticated admin (tester_access_grants, via
-- is_admin()) can write.
--
-- =========================================================================================
-- 1. user_entitlements -- the server-side mirror of RevenueCat entitlement state. Populated
--    ONLY by the sync-revenuecat-entitlement and revenuecat-webhook Edge Functions, both of
--    which write using the service_role key (bypasses RLS by design -- there are deliberately
--    NO insert/update/delete policies for any client role). Authenticated users may read only
--    their own row, matching personality_evidence's existing select-own-only RLS pattern.
-- =========================================================================================

create table public.user_entitlements (
  user_id uuid not null references auth.users (id) on delete cascade,
  entitlement_id text not null,
  is_active boolean not null default false,
  expires_at timestamptz,
  product_id text,
  environment text,
  last_verified_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, entitlement_id)
);

comment on table public.user_entitlements is
  'Server-side mirror of RevenueCat entitlement state, one row per (user, entitlement). The ONLY writers are the sync-revenuecat-entitlement and revenuecat-webhook Edge Functions (service_role, bypasses RLS) -- no client, including the owning user, can insert/update/delete their own row. is_active + expires_at together are the real authorization signal (see has_active_entitlement) -- a row can exist with is_active=false (a lapsed/cancelled/refunded subscription) rather than being deleted, preserving history of last_verified_at.';

alter table public.user_entitlements enable row level security;

create policy user_entitlements_select_own on public.user_entitlements
  for select to authenticated
  using (auth.uid() = user_id);

-- Deliberately NO insert/update/delete policy for any client role (authenticated or anon) --
-- writes happen exclusively via the service_role key inside the two Edge Functions, which
-- bypasses RLS entirely and needs no policy to do so.

-- =========================================================================================
-- 2. tester_access_grants -- explicit, admin-granted TestFlight tester access. Zero direct
--    client policies (matching quiz_shares/compare_responses' own "RLS enabled, zero
--    policies, SECURITY DEFINER functions only" convention) -- not even the granted user can
--    read their own row directly; has_tester_access() (below) is the only sanctioned read
--    path, itself only ever called from within another SECURITY DEFINER function.
-- =========================================================================================

create table public.tester_access_grants (
  user_id uuid primary key references auth.users (id) on delete cascade,
  granted_by uuid references auth.users (id),
  note text,
  created_at timestamptz not null default now()
);

comment on table public.tester_access_grants is
  'Explicit, admin-granted TestFlight tester access -- replaces the old client-asserted p_tester_access boolean. A row here means this specific consumer user_id gets real premium content without a purchase. Written ONLY via admin_grant_tester_access/admin_revoke_tester_access (is_admin()-gated, same authorization boundary every other admin_* RPC in this project already uses). Zero direct RLS policies -- not even readable by the granted user themselves; only has_tester_access() (SECURITY DEFINER, itself never directly callable by a client) reads this table.';

alter table public.tester_access_grants enable row level security;

-- =========================================================================================
-- 3. Helper functions -- internal only (revoked from public/anon/authenticated entirely).
--    Callable from other SECURITY DEFINER functions this same role owns (Postgres grants the
--    owning role implicit EXECUTE regardless of REVOKE), never directly via RPC. This is what
--    keeps "does user X have tester access / an active entitlement" from being a callable,
--    arbitrary-user-enumerable RPC in its own right.
-- =========================================================================================

create or replace function public.has_tester_access(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.tester_access_grants g where g.user_id = p_user_id);
$$;

revoke all on function public.has_tester_access(uuid) from public;
revoke all on function public.has_tester_access(uuid) from anon;
revoke all on function public.has_tester_access(uuid) from authenticated;

comment on function public.has_tester_access(uuid) is
  'Internal only -- never granted to any client role. True iff p_user_id has an explicit admin-granted tester_access_grants row. Called only from within other SECURITY DEFINER functions (e.g. get_private_daily), which inherit the owning role''s implicit EXECUTE privilege regardless of the revokes above.';

create or replace function public.has_active_entitlement(p_user_id uuid, p_entitlement_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_entitlements e
    where e.user_id = p_user_id
      and e.entitlement_id = p_entitlement_id
      and e.is_active = true
      and (e.expires_at is null or e.expires_at > now())
  );
$$;

revoke all on function public.has_active_entitlement(uuid, text) from public;
revoke all on function public.has_active_entitlement(uuid, text) from anon;
revoke all on function public.has_active_entitlement(uuid, text) from authenticated;

comment on function public.has_active_entitlement(uuid, text) is
  'Internal only -- never granted to any client role. True iff p_user_id has a user_entitlements row for p_entitlement_id with is_active=true AND (expires_at is null or still in the future) -- a lapsed/expired/refunded entitlement (is_active=false, or expires_at in the past) returns false even though a row still exists. Called only from within other SECURITY DEFINER functions.';

-- =========================================================================================
-- 4. Admin tester-grant management -- reuses the EXISTING is_admin() authorization boundary
--    (the same one every admin_* Daily-editing RPC already relies on) rather than inventing a
--    second admin concept. No UI is built for this in this pass -- see the engineering sprint
--    report for the exact manual grant step this requires until a future admin UI adds one.
-- =========================================================================================

create or replace function public.admin_grant_tester_access(p_user_id uuid, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized.';
  end if;
  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'No such user.';
  end if;

  insert into public.tester_access_grants (user_id, granted_by, note)
  values (p_user_id, auth.uid(), nullif(btrim(coalesce(p_note, '')), ''))
  on conflict (user_id) do update set note = excluded.note, granted_by = excluded.granted_by;
end;
$$;

revoke all on function public.admin_grant_tester_access(uuid, text) from public;
revoke all on function public.admin_grant_tester_access(uuid, text) from anon;
grant execute on function public.admin_grant_tester_access(uuid, text) to authenticated;

comment on function public.admin_grant_tester_access(uuid, text) is
  'Admin-only (is_admin()). Grants p_user_id real tester access to premium-gated content without a purchase. Idempotent (upserts on user_id). The consumer user_id must already exist in auth.users -- this never creates or invents an identity.';

create or replace function public.admin_revoke_tester_access(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized.';
  end if;
  delete from public.tester_access_grants where user_id = p_user_id;
end;
$$;

revoke all on function public.admin_revoke_tester_access(uuid) from public;
revoke all on function public.admin_revoke_tester_access(uuid) from anon;
grant execute on function public.admin_revoke_tester_access(uuid) to authenticated;

comment on function public.admin_revoke_tester_access(uuid) is
  'Admin-only (is_admin()). Removes p_user_id''s tester_access_grants row, if any. No-op if none exists.';

-- =========================================================================================
-- 5. get_private_daily / submit_private_daily_answer -- authorization now comes ONLY from
--    server state (has_active_entitlement/has_tester_access), never a client-supplied
--    boolean. Both RPCs' signatures are narrower than before this migration -- neither
--    p_premium nor p_tester_access exists as a parameter anymore, so a client attempting to
--    send either is simply calling a function that does not exist (PostgREST resolves RPCs by
--    exact parameter-name set) and gets a clean "function not found" error, never silent
--    acceptance/ignoring.
-- =========================================================================================

drop function if exists public.get_private_daily(boolean, boolean);

create function public.get_private_daily()
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

  v_unlocked :=
    q.is_free_private_unlock
    or v_has_answered
    or (v_user is not null and (
      public.has_active_entitlement(v_user, 'apparently_private') or public.has_tester_access(v_user)
    ));

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

comment on function public.get_private_daily() is
  'The one read path for the current Live Private Daily. Always returns the prompt (the teaser). Returns full option data ONLY when unlocked: free-unlock, an already-recorded answer, a server-verified active apparently_private entitlement (user_entitlements, kept current by sync-revenuecat-entitlement/revenuecat-webhook), or a server-side tester_access_grants row. Takes NO client-supplied authorization parameter -- a locked, non-unlocked caller gets access_level=''locked'' and options=null, and there is no boolean a client can send to change that.';

revoke all on function public.get_private_daily() from public;
revoke all on function public.get_private_daily() from anon;
grant execute on function public.get_private_daily() to authenticated;

drop function if exists public.submit_private_daily_answer(uuid, uuid, boolean, boolean);

create function public.submit_private_daily_answer(
  p_question_id uuid,
  p_option_id uuid
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

  v_unlocked :=
    q.is_free_private_unlock
    or public.has_active_entitlement(v_user, 'apparently_private')
    or public.has_tester_access(v_user);
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

comment on function public.submit_private_daily_answer(uuid, uuid) is
  'The one write path for a Private Daily vote. Re-validates server-side (room=private, status=Live, unlocked via free-unlock, a server-verified active apparently_private entitlement, or a server-side tester grant) before inserting -- takes NO client-supplied authorization parameter. Relies on daily_answers'' existing UNIQUE(user_id, question_id) for one-answer-per-question immutability and idempotent-retry safety.';

revoke all on function public.submit_private_daily_answer(uuid, uuid) from public;
revoke all on function public.submit_private_daily_answer(uuid, uuid) from anon;
grant execute on function public.submit_private_daily_answer(uuid, uuid) to authenticated;
