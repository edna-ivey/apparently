-- NOT A SCHEMA CHANGE. One-time cleanup of the 2 disposable anonymous identities created while
-- empirically verifying the Build 9 correction pass: confirming the isRemoteDailyEnabled fix
-- actually produces a real First Form Creature + GET YOUR READ + Private Daily on first load +
-- a real Commonality section on You + a working Compare, with real seeded daily_answers (see
-- the Build 9 correction report for the full before/after screenshots this produced).
-- Logged immediately at creation, per this project's QA-data-hygiene requirement.
-- Explicit-id-only, safety-guarded exactly like every prior cleanup migration in this project.

do $$
declare
  v_ids uuid[] := array[
    '5a8474fd-5e8c-45cf-8319-6a697bd59692'::uuid,
    '9920ef8f-194e-4468-8972-3a8bffcc0e01'::uuid
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

  delete from public.tester_access_grants where user_id = any(v_ids);
  delete from auth.users where id = any(v_ids) and coalesce(is_anonymous, false) = true;
  get diagnostics v_deleted_count = row_count;

  raise notice 'Build 9 correction-pass QA disposable identity cleanup: % of % listed ids existed and were confirmed anonymous; % deleted (cascades to personality_evidence/daily_answers rows).', v_found_count, array_length(v_ids, 1), v_deleted_count;
end $$;
