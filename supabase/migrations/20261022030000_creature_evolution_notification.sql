-- STAGED, NOT APPLIED. Creature-evolution notifications -- the one category whose "did this
-- genuinely change" detection happens CLIENT-SIDE (src/services/creature-evolution-notification
-- -service.ts), not in SQL. Rationale: scorePersonalityProfile/resolveActiveBoardPole (src/data/
-- personality.ts) is the one real, LOCKED, approved implementation of "which traits currently
-- qualify for Your Signature/the Creature" -- re-deriving that same opposite-pole/qualification
-- logic a second time in plpgsql would risk drifting from the real engine over time (a future
-- change to personality.ts's rules would silently NOT be reflected here unless someone
-- remembered to update two implementations in two languages). Instead, the already-authoritative
-- TS engine computes the real answer once (every time You opens and reloads its profile, see
-- you.tsx), and this RPC is a narrow, auth.uid()-scoped write: "a trait the real engine just
-- computed as newly qualified." The RPC does not re-verify that claim itself -- there is no
-- sensitive action downstream of a client being wrong here (worst case, a notification fires
-- for a trait that wasn't really new, not a security or data-integrity issue), so the identity
-- boundary (never for anyone but the caller) is what actually matters.

create or replace function public.enqueue_creature_evolution_notification(p_trait_display_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated.';
  end if;
  if p_trait_display_name is null or length(trim(p_trait_display_name)) = 0 then
    raise exception 'p_trait_display_name is required.';
  end if;

  insert into public.notification_outbox (user_id, category, title, body, data)
  values (
    v_user_id,
    'creature_evolution',
    'Your Creature is changing.',
    'A new trait just became part of your Signature: ' || p_trait_display_name || '.',
    jsonb_build_object('type', 'creature_evolution', 'url', '/you')
  );
end;
$$;

comment on function public.enqueue_creature_evolution_notification(text) is
  'Always writes under auth.uid() -- a client can only ever enqueue this notification for itself. Called from you.tsx (via creature-evolution-notification-service.ts) only when the REAL scorePersonalityProfile/V2-merge output (the one approved, LOCKED engine) shows a trait that was not previously in topTraits now is -- never on every recalculation, never fabricated.';

revoke all on function public.enqueue_creature_evolution_notification(text) from public;
revoke all on function public.enqueue_creature_evolution_notification(text) from anon;
grant execute on function public.enqueue_creature_evolution_notification(text) to authenticated;
