-- NOT A SCHEMA CHANGE. One-time cleanup of the 1 disposable anonymous identity created as the
-- dedicated QA identity for the Build 9 visual-redesign pass (You hero/First Form reveal/Get
-- Your Read screenshots at 390x844, 430x932, 1280x900 -- see the redesign report). Logged
-- immediately at creation, per this project's QA-data-hygiene requirement. Explicit-id-only,
-- safety-guarded exactly like every prior cleanup migration in this project.

do $$
declare
  v_ids uuid[] := array[
    '878cf6c3-a0d8-4127-b8d9-5e5c57602a3e'::uuid
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

  raise notice 'Build 9 visual-redesign-pass QA identity cleanup: % of % listed ids existed and were confirmed anonymous; % deleted (cascades to personality_evidence/daily_answers rows).', v_found_count, array_length(v_ids, 1), v_deleted_count;
end $$;
