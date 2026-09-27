-- NOT A SCHEMA CHANGE. One-time cleanup of the single disposable anonymous identity created
-- while proving the You-page Apparently Private identity states (locked/free, revealed
-- <3 traits, revealed 3+ traits with a fully resolved Relic) end to end against real
-- personality_evidence, using the real approved keep-you-around/be-so-serious mappings.
-- Logged immediately at creation, per this project's QA-data-hygiene requirement.
-- Explicit-id-only, safety-guarded exactly like every prior cleanup migration in this project.

do $$
declare
  v_ids uuid[] := array[
    'b8d17ed7-b848-4d80-a1e3-b5212dcfd317'::uuid
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

  raise notice 'You-page identity-states QA disposable identity cleanup: % of % listed ids existed and were confirmed anonymous; % deleted (cascades to quiz_results/personality_evidence rows).', v_found_count, array_length(v_ids, 1), v_deleted_count;
end $$;
