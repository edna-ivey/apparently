-- Real RLS policy and RPC, transcribed verbatim from the CURRENTLY APPLIED definition
-- (confirmed 2026-10-30 via a live `pg_get_function_arguments` check against linked
-- Supabase: submit_private_daily_answer(uuid, uuid) -- no boolean parameter). An earlier
-- version of this stub used the 20260918010000 DRAFT signature
-- (uuid, uuid, boolean p_tester_access), which 20260924010000_secure_entitlement_
-- authorization.sql later replaced: authorization now comes ONLY from server-verified
-- has_active_entitlement/has_tester_access, never a client-supplied boolean -- that owner
-- audit finding is fixed here, not just noted.

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

create or replace function public.submit_private_daily_answer(
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

revoke all on function public.submit_private_daily_answer(uuid, uuid) from public;
revoke all on function public.submit_private_daily_answer(uuid, uuid) from anon;
grant execute on function public.submit_private_daily_answer(uuid, uuid) to authenticated;
