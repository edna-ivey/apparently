-- NOT A SCHEMA CHANGE. One-time cleanup of the 4 disposable anonymous identities created while
-- investigating/QA-ing Build 9: the Private Daily first-load bug repro (transient-failure
-- simulation), and the You-page premium redesign + Get Your Read screen across
-- 375x812/390x844/430x932/desktop viewports plus a Today/Explore/Private/Compare smoke pass.
-- Logged immediately at creation, per this project's QA-data-hygiene requirement.
-- Explicit-id-only, safety-guarded exactly like every prior cleanup migration in this project.

do $$
declare
  v_ids uuid[] := array[
    '400da6f7-1003-46c1-aa20-34619b420d0b'::uuid,
    'ca44b2b4-7b82-440a-9f07-e9464da67a1d'::uuid,
    '58579ce0-df04-4853-831b-327be326c405'::uuid,
    '5ea2d20b-77e4-475e-8e65-b3cc00b01d11'::uuid
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

  raise notice 'Build 9 QA disposable identity cleanup: % of % listed ids existed and were confirmed anonymous; % deleted (cascades to quiz_results/personality_evidence/daily_answers rows).', v_found_count, array_length(v_ids, 1), v_deleted_count;
end $$;
