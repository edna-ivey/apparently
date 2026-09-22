-- Adds a real subscription entitlement as a third unlock reason for Private Daily, alongside
-- the existing free-unlock/tester-access/already-answered reasons (supabase/migrations/
-- 20260918010000_public_private_daily_rooms.sql) -- "Premium Private Daily content" from the
-- Build 7 monetization pass. Additive on top of the already-applied migration; does not
-- change Daily creative, does not touch the free-unlock schedule, does not touch tester
-- access. p_premium is a CLIENT-ASSERTED signal (this app has no server-side knowledge of
-- RevenueCat entitlement state -- see src/services/purchases-service.ts, which derives it
-- from Apple's own StoreKit receipt via the RevenueCat SDK) -- same trust model
-- p_tester_access already uses; a false assertion here can only ever reveal this ONE user's
-- own already-published Daily prompt/options to themselves, never another user's data, and
-- writes are still gated by the same real ownership checks (auth.uid()) as before.
--
-- Uses DROP + CREATE (not a bare CREATE OR REPLACE) because adding a new parameter changes
-- the function's argument-type signature -- CREATE OR REPLACE alone would create a second,
-- separately-overloaded function rather than truly replacing the old one. Dropping first
-- guarantees exactly one live version of each function after this migration.

drop function if exists public.get_private_daily(boolean);

create function public.get_private_daily(p_tester_access boolean default false, p_premium boolean default false)
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
  v_unlocked := coalesce(p_tester_access, false) or coalesce(p_premium, false) or q.is_free_private_unlock or v_has_answered;

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

comment on function public.get_private_daily(boolean, boolean) is
  'The one read path for the current Live Private Daily. Always returns the prompt (the teaser). Returns full option data (label/effects/reaction) ONLY when unlocked: free-unlock, an already-recorded answer, p_tester_access=true (TestFlight beta build only), or p_premium=true (a real apparently_private RevenueCat entitlement, asserted client-side from the actual StoreKit receipt -- see purchases-service.ts). A locked, non-unlocked caller gets access_level=''locked'' and options=null -- never partial/usable choice data.';

drop function if exists public.submit_private_daily_answer(uuid, uuid, boolean);

create function public.submit_private_daily_answer(
  p_question_id uuid,
  p_option_id uuid,
  p_tester_access boolean default false,
  p_premium boolean default false
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

  v_unlocked := coalesce(p_tester_access, false) or coalesce(p_premium, false) or q.is_free_private_unlock;
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

comment on function public.submit_private_daily_answer(uuid, uuid, boolean, boolean) is
  'The one write path for a Private Daily vote. Re-validates server-side (room=private, status=Live, unlocked via free-unlock, p_tester_access, or p_premium) before inserting -- never trusts the client''s locked/unlocked UI state. Relies on daily_answers'' existing UNIQUE(user_id, question_id) for one-answer-per-question immutability and idempotent-retry safety, same guarantee Public Dailies already have. Fires the same handle_daily_answer_personality_evidence trigger as any daily_answers insert -- daily_mode still governs whether that produces evidence.';

revoke all on function public.get_private_daily(boolean, boolean) from public;
revoke all on function public.get_private_daily(boolean, boolean) from anon;
grant execute on function public.get_private_daily(boolean, boolean) to authenticated;

revoke all on function public.submit_private_daily_answer(uuid, uuid, boolean, boolean) from public;
revoke all on function public.submit_private_daily_answer(uuid, uuid, boolean, boolean) from anon;
grant execute on function public.submit_private_daily_answer(uuid, uuid, boolean, boolean) to authenticated;
