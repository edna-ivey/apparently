-- NOT A SCHEMA CHANGE. One-time cleanup of the 5 disposable anonymous identities created while
-- visually QA-ing the Creature v1 reveal/centerpiece polish pass (placeholder state, partial
-- state with <5 qualifying traits, and the full reveal + steady state across 375x812/390x844/
-- desktop viewports) against real personality_evidence. Logged immediately at creation, per
-- this project's QA-data-hygiene requirement. Explicit-id-only, safety-guarded exactly like
-- every prior cleanup migration in this project.

do $$
declare
  v_ids uuid[] := array[
    '9f7ff4c4-d496-44db-991e-cceb1ccc4f6d'::uuid,
    'ae6d8f6f-fe19-4e0e-91b1-923abf418c9e'::uuid,
    '1b073666-ac99-484d-9240-18ac328118ef'::uuid,
    'ec1c87f1-8cc8-4311-84b9-e6ba12d24fe7'::uuid,
    'c7b86408-3d5a-4a53-b9c9-8fb248217ca0'::uuid
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

  raise notice 'Creature v1 QA disposable identity cleanup: % of % listed ids existed and were confirmed anonymous; % deleted (cascades to quiz_results/personality_evidence rows).', v_found_count, array_length(v_ids, 1), v_deleted_count;
end $$;
