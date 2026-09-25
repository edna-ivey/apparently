-- NOT A SCHEMA CHANGE. One-time cleanup of the disposable anonymous identities created during
-- Build 8 Pass 1's live visual QA (qa-build8.mjs), which established real anonymous Supabase
-- sessions against the linked project and submitted synthetic quiz_results via the real
-- submit_quiz_result RPC (quiz ids "qa-b8-*") purely to exercise You's <50/>=50-answer states
-- end to end. Explicit-id-only, safety-guarded exactly like every prior cleanup migration in
-- this project.
--
-- Note: a separate ad hoc wide-viewport screenshot (qa-wide.mjs) and a Private-landing free-
-- tier smoke check (qa-private.mjs) also each established their own anonymous session, but
-- their ids were never logged, so they are not included here -- flagged in the final report
-- rather than guessed at or mass-deleted.

do $$
declare
  v_ids uuid[] := array[
    '1e4ee020-e6d3-4668-b965-e0a8acb351f3'::uuid, -- 375px run, before the profile-seed test fix
    'dd3345d7-2e3a-467f-931c-1e5d8f97a46c'::uuid, -- 390px run, before the profile-seed test fix
    '5bcb40b1-1914-4269-93a3-ae991f4ce559'::uuid, -- 375px run, final passing run
    '03e48783-974d-424d-a441-215d9145bc7c'::uuid  -- 390px run, final passing run
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

  raise notice 'Build 8 Pass 1 QA disposable identity cleanup: % of % listed ids existed and were confirmed anonymous; % deleted (cascades to quiz_results/profile rows).', v_found_count, array_length(v_ids, 1), v_deleted_count;
end $$;
