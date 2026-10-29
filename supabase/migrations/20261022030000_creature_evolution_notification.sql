-- STAGED, NOT APPLIED. Creature-evolution notifications.
--
-- CORRECTED (owner security/correctness pass, 2026-10-23) from this file's original draft,
-- which had two real problems caught before anything was ever applied:
--
-- 1. The original enqueue_creature_evolution_notification(trait_name) trusted the CALLER to
--    have already decided "this trait is genuinely new" using local on-device storage (see
--    the original creature-evolution-notification-service.ts). That is not account-scoped or
--    cross-device: a reinstall, a second device on the same account, or switching accounts on
--    the same device could all produce duplicate or missing notifications, because the "have
--    I seen this before" check lived on the DEVICE, not the ACCOUNT. Fixed by moving that
--    check to a real table keyed by auth.uid(), with the account's own history as the single
--    source of truth regardless of which device reports it.
-- 2. The original notification body embedded the real trait display name directly ("A new
--    trait just became part of your Signature: Direct."), which is personality-identity
--    content appearing in a push notification's VISIBLE title/body (shown on a lock screen,
--    in notification history, to anyone who can see the device). Fixed: the body is now
--    generic; the real trait detail is only ever shown after the user opens the app (the
--    notification's data.url deep-links to /you, which already displays it there).
--
-- Rationale for why this detection still happens CLIENT-SIDE (not re-derived in SQL):
-- scorePersonalityProfile/resolveActiveBoardPole (src/data/personality.ts) is the one real,
-- LOCKED, approved implementation of "which traits currently qualify for Your Signature/the
-- Creature" -- re-deriving that same opposite-pole/qualification logic a second time in
-- plpgsql would risk drifting from the real engine over time. The already-authoritative TS
-- engine computes the real answer once (every time You opens and reloads its profile), and
-- this RPC's job is narrower and safer: "given the account's real, currently-qualified trait
-- set, tell me which of these this account has never been credited with before" -- a pure
-- membership/history question the database is the correct, single source of truth for.

create table public.user_known_creature_traits (
  user_id uuid not null references auth.users (id) on delete cascade,
  -- A JSON-encoded [dimensionId, displayName] pair -- e.g. '["direct_indirect","Direct"]' --
  -- produced by src/services/creature-evolution-trait-key.ts's traitKey(). The dimension id
  -- alone is insufficient: a dimension can later qualify its OPPOSITE pole, which is a
  -- genuinely different trait with different Creature behavior and should be able to notify
  -- once on its own. JSON-encoding the pair (rather than a plain "id:name" template) is what
  -- guarantees two different (id, name) pairs can never collide onto the same key -- see that
  -- file's own comment for the exact collision a plain template would allow.
  trait_key text not null,
  first_seen_at timestamptz not null default now(),
  primary key (user_id, trait_key)
);

comment on table public.user_known_creature_traits is
  'One row per (account, trait) the real scoring engine has ever reported as qualified for this account -- the account-scoped, cross-device, reinstall-surviving record sync_creature_traits uses to decide what counts as genuinely new. Never written by anything except that RPC.';

alter table public.user_known_creature_traits enable row level security;

create policy "user_known_creature_traits_select_own"
  on public.user_known_creature_traits
  for select
  to authenticated
  using (user_id = auth.uid());

-- No insert/update/delete policy for authenticated -- sync_creature_traits below is the one
-- write path, same SECURITY DEFINER pattern as every other sensitive table in this schema.

create or replace function public.sync_creature_traits(p_trait_keys text[])
returns table (newly_qualified_trait_keys text[])
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_had_baseline boolean;
  v_newly_inserted text[];
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated.';
  end if;
  if p_trait_keys is null then
    raise exception 'p_trait_keys is required (an empty array is valid -- null is not).';
  end if;
  if array_length(p_trait_keys, 1) > 40 then
    -- Double the real ceiling (Your Signature: at most 7 Core slots; The Undercurrent: at
    -- most 3 Private -- see the Bible) -- a defensive cap, not a limit any genuine call
    -- could ever approach.
    raise exception 'Too many trait keys in one call.';
  end if;

  v_had_baseline := exists (select 1 from public.user_known_creature_traits where user_id = v_user_id);

  -- INSERT ... ON CONFLICT DO NOTHING RETURNING is the exact, atomic way to know which rows
  -- THIS statement actually inserted -- a key already known (by this account, from any
  -- device, including a concurrent call from a second device at the same moment) simply never
  -- appears in the RETURNING set, with no separate re-query or race-prone timestamp
  -- comparison needed. This is also what makes two devices reporting the SAME new trait at the
  -- same moment safe: Postgres's own row-level locking on the unique constraint ensures only
  -- one of the two concurrent inserts "wins" that row; the other sees it as already-conflicting
  -- and correctly produces zero rows for it, so only one notification is ever enqueued below.
  with inserted as (
    insert into public.user_known_creature_traits (user_id, trait_key)
    select v_user_id, key
    from unnest(p_trait_keys) as key
    on conflict (user_id, trait_key) do nothing
    returning trait_key
  )
  select array_agg(trait_key) into v_newly_inserted from inserted;

  -- First-ever sync for this account: seed the baseline silently, never notify -- these are
  -- not "new" evolutions, they are simply the first time this account's existing state was
  -- ever reported (a new signup, or an existing account's first sync after this feature
  -- shipped). Only a SUBSEQUENT call, once a baseline already exists, can produce a real
  -- notification.
  if not v_had_baseline or v_newly_inserted is null or array_length(v_newly_inserted, 1) = 0 then
    return query select null::text[];
    return;
  end if;

  -- Generic copy, deliberately -- no trait name, no dimension, no personality content of any
  -- kind in the VISIBLE title/body (see this file's own header comment, item 2). data.url is
  -- the only way the real detail is reachable, and only once the user has actually opened the
  -- app to /you.
  insert into public.notification_outbox (user_id, category, title, body, data)
  values (
    v_user_id,
    'creature_evolution',
    'Your Creature is changing.',
    'Something new just became part of your Signature. Come see.',
    jsonb_build_object('type', 'creature_evolution', 'url', '/you')
  );

  return query select v_newly_inserted;
end;
$$;

comment on function public.sync_creature_traits(text[]) is
  'Always operates under auth.uid() -- a client can only ever report/query its OWN account''s trait history. Called from you.tsx (via creature-evolution-notification-service.ts) with the real, currently-qualified trait set from scorePersonalityProfile/the V2 merge -- never a fabricated or hypothetical set. First-ever sync for an account seeds its baseline silently; only a genuinely new trait relative to that account''s own prior history enqueues a notification. Idempotent and cross-device-safe by construction: a repeat report of an already-known trait set (from any device) inserts zero rows and enqueues nothing.';

revoke all on function public.sync_creature_traits(text[]) from public;
revoke all on function public.sync_creature_traits(text[]) from anon;
grant execute on function public.sync_creature_traits(text[]) to authenticated;
