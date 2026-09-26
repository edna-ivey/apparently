-- NOT A SCHEMA CHANGE. One-time cleanup of the two disposable anonymous identities created
-- during Build 8 Pass 3.1: one from the read-only live Daily-content audit
-- (daily-audit.mjs -- a plain SELECT against daily_questions/daily_options via the existing
-- consumer-visible RLS policies, no write of any kind), and one from live visual QA proving
-- the qualified-Private-signal rule end to end (qa-pass3.1.mjs -- real submit_quiz_result
-- completions using the real approved keep-you-around/be-so-serious mappings). Both ids were
-- logged immediately at creation time, per this project's QA-data-hygiene requirement.
-- Explicit-id-only, safety-guarded exactly like every prior cleanup migration in this project.

do $$
declare
  v_ids uuid[] := array[
    'e0366a33-6afe-40f5-9c5d-2783fdced106'::uuid, -- read-only live Daily-content audit session
    '4ed56de2-8d02-4c33-95af-a18fb23b099b'::uuid  -- qualified-Private-signal visual QA session
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

  raise notice 'Build 8 Pass 3.1 QA disposable identity cleanup: % of % listed ids existed and were confirmed anonymous; % deleted (cascades to quiz_results/personality_evidence rows).', v_found_count, array_length(v_ids, 1), v_deleted_count;
end $$;
