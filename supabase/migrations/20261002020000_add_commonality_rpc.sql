-- Apparently You — real aggregate Commonality for the current user (Build 9 correction pass).
--
-- No real implementation of this existed anywhere in the codebase before this migration (every
-- prior "Commonality" reference in src/ was a comment about future work, or the hardcoded
-- local-prototype demo literals "37%"/"06 rare picks" in Today -- see the Build 9 report). This
-- is the first real, data-driven implementation, following Bible v1.4 §25 exactly:
--
--   - A specific question becomes Commonality-eligible only after >= 10 respondents have
--     answered it.
--   - A user-level aggregate Commonality number is shown only when that user has >= 10
--     answered questions that are THEMSELVES Commonality-eligible.
--   - Otherwise: "STILL LEARNING THE ROOM" (or equivalent), never a fabricated percentage.
--   - No invented population claims -- this compares only against actual Apparently You
--     respondents (real daily_answers rows), never a general-population claim.
--
-- Scope: Public-room Daily answers only (Private Daily/quiz commonality is a separate,
-- unbuilt concern -- not invented here). "Shared by about N% of the room" = for each of the
-- user's own eligible answered questions, what fraction of that question's real respondents
-- chose the SAME option the user chose; the aggregate is the average of that across all
-- eligible questions. "Rare picks" = eligible answers where the user's own chosen option was
-- picked by a minority share (< 20%, the same "one of the rarer picks" cutoff
-- getConsensusLanguage already uses client-side for a single answer's reveal copy -- see
-- src/data/personality.ts).

create or replace function public.get_my_commonality()
returns table (
  eligible_answer_count integer,
  average_percent integer,
  rare_pick_count integer
)
language sql
security definer
set search_path = public
stable
as $$
  with my_eligible_answers as (
    -- Every one of the current user's OWN public-room Daily answers, restricted to questions
    -- that have ever reached the real >= 10-respondent eligibility bar (computed from ALL
    -- respondents to that question, not just this user's own visibility).
    select
      a.id as answer_id,
      a.question_id,
      a.option_id
    from public.daily_answers a
    join public.daily_questions q on q.id = a.question_id and q.room = 'public'
    where a.user_id = auth.uid()
      and (
        select count(*) from public.daily_answers a2 where a2.question_id = a.question_id
      ) >= 10
  ),
  per_question_share as (
    -- For each of those eligible answers, the real percent of that question's respondents who
    -- picked the SAME option this user picked.
    select
      e.question_id,
      round(
        100.0 * (
          select count(*) from public.daily_answers a3
          where a3.question_id = e.question_id and a3.option_id = e.option_id
        ) / (
          select count(*) from public.daily_answers a4 where a4.question_id = e.question_id
        )
      ) as share_percent
    from my_eligible_answers e
  )
  select
    count(*)::integer as eligible_answer_count,
    case when count(*) >= 10 then round(avg(share_percent))::integer else null end as average_percent,
    count(*) filter (where share_percent < 20)::integer as rare_pick_count
  from per_question_share;
$$;

comment on function public.get_my_commonality() is
  'Real aggregate Commonality for the calling user (Bible v1.4 §25) -- Public-room Daily answers only. eligible_answer_count is always real (may be < 10). average_percent is null (never a fabricated number) unless eligible_answer_count >= 10, per the Bible''s user-level aggregate threshold. rare_pick_count counts eligible answers where the user''s own chosen option was picked by < 20% of that question''s real respondents.';

revoke all on function public.get_my_commonality() from public;
revoke all on function public.get_my_commonality() from anon;
grant execute on function public.get_my_commonality() to authenticated;
