-- Admin quiz-result analytics — the admin dashboard's new Quiz Analytics section needs a
-- real, per-quiz-id count of completions grouped by result identity, sourced only from real
-- quiz_results rows (no seeded/test data concept exists anywhere in this schema — every
-- quiz_results row already represents a genuine completion). Mirrors the existing
-- admin_get_daily_distribution's own shape/authorization convention exactly.

create or replace function public.admin_get_quiz_result_distribution(p_quiz_id text)
returns table (result_id text, result_title text, completion_count bigint)
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
  select
    qr.result_id,
    -- The stored result_title on the most recent completion — a result's display title is
    -- static content today, but this avoids ever needing to guess if that ever changes.
    (array_agg(qr.result_title order by qr.completed_at desc))[1] as result_title,
    count(*)::bigint as completion_count
  from public.quiz_results qr
  where qr.quiz_id = p_quiz_id
  group by qr.result_id
  order by count(*) desc;
end;
$$;

comment on function public.admin_get_quiz_result_distribution(text) is
  'Admin-only real completion counts for one quiz, grouped by result_id — every row is a genuine quiz_results completion (retakes included, one row each). Total completions for a quiz is the sum of completion_count across all returned rows; an empty result set means zero real completions. Never reads any other quiz_id''s rows.';

revoke all on function public.admin_get_quiz_result_distribution(text) from public;
revoke all on function public.admin_get_quiz_result_distribution(text) from anon;
grant execute on function public.admin_get_quiz_result_distribution(text) to authenticated;
