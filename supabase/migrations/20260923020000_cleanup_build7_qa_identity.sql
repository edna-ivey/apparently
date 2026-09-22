-- NOT A SCHEMA CHANGE. One-time cleanup of the single disposable anonymous test identity
-- created during Build 7's live Private Daily premium-unlock QA (never a real user/tester
-- account). Same explicit-id-only, safety-guarded approach as the two prior cleanup
-- migrations (20260922030000, 20260922040000).

do $$
declare
  v_ids uuid[] := array[
    'c32ce896-7730-4bf6-b151-1542b85fff75'::uuid -- Build 7 Private Daily live QA user
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

  raise notice 'Build 7 QA disposable identity cleanup: % of % listed ids existed and were confirmed anonymous; % deleted.', v_found_count, array_length(v_ids, 1), v_deleted_count;
end $$;
