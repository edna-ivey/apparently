-- NOT A SCHEMA CHANGE. One-time cleanup of the disposable anonymous identities created during
-- Build 7's live "Your 7" QA (seed-and-check.mjs), which established real anonymous Supabase
-- sessions against the linked project and, for the successful runs, submitted synthetic
-- quiz_results via the real submit_quiz_result RPC (quiz ids "qa-your-seven-1".."-5") purely to
-- prove the 50-answer/7-card threshold end to end. Explicit-id-only, safety-guarded exactly
-- like every prior cleanup migration in this project.
--
-- Note: the broader broad-qa.mjs / diagnose*.mjs sweeps (standard quiz result, Private result,
-- Recent Read, Compare, tab-bar overflow diagnosis) also created anonymous sessions on each
-- run, but did not log their user ids, so they are not included here -- flagged in the final
-- report rather than guessed at or mass-deleted.

do $$
declare
  v_ids uuid[] := array[
    '392ce01e-d9af-4e37-946b-2cf62d1e7320'::uuid, -- first successful seed-and-check run
    'f11b2246-b1c1-429c-aeca-5849d0537990'::uuid, -- earlier failed attempt, before onboarding-bypass fix
    '1eb0d5d4-32df-423f-8801-fe1597006ea8'::uuid, -- session-only (env vars unset, failed before any seeding)
    '23f3dc9d-74a0-4c8a-aaa1-957f4383fcb2'::uuid  -- final re-confirmation run after tab-bar overflow fix
  ];
  v_found_count int;
  v_non_anonymous_count int;
  v_deleted_count int;
begin
  select count(*) into v_found_count from auth.users where id = any(v_ids);
  select count(*) into v_non_anonymous_count from auth.users where id = any(v_ids) and coalesce(is_anonymous, false) = false;

  if v_non_anonymous_count > 0 then
    raise exception 'Safety abort: % of the listed ids resolve to a NON-anonymous user -- refusing to delete anything.', v_non_anonymous_count;
  end if;

  delete from auth.users where id = any(v_ids) and coalesce(is_anonymous, false) = true;
  get diagnostics v_deleted_count = row_count;

  raise notice 'Build 7 Your-7 QA disposable identity cleanup: % of % listed ids existed and were confirmed anonymous; % deleted (cascades to quiz_results/profile rows).', v_found_count, array_length(v_ids, 1), v_deleted_count;
end $$;
