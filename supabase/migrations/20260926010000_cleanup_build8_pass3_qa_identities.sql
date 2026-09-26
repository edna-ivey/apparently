-- NOT A SCHEMA CHANGE. One-time cleanup of the two disposable anonymous identities created
-- during Build 8 Pass 3's live visual QA (qa-pass3.mjs), which established real anonymous
-- Supabase sessions against the linked project to prove the Core/Private identity
-- architecture (Your Signature, The Undercurrent, Relic slots) end to end against real
-- personality_evidence, including the real approved keep-you-around "emergency-contact"
-- mapping (both Core and Private evidence from one completion). Both ids were logged
-- immediately at creation time this pass, per the explicit QA-data-hygiene requirement.
-- Explicit-id-only, safety-guarded exactly like every prior cleanup migration in this project.

do $$
declare
  v_ids uuid[] := array[
    '33fd6893-e90d-43d1-8fe5-46670e9f2708'::uuid, -- primary progressive-seeding account (states 1/2/4/5/7/8 + 375/1280 layout re-checks)
    'ff4fe080-079a-4b1d-96e3-12c97533886c'::uuid  -- secondary zero-evidence account (375x812 and 1280x900 empty-state checks)
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

  raise notice 'Build 8 Pass 3 QA disposable identity cleanup: % of % listed ids existed and were confirmed anonymous; % deleted (cascades to quiz_results/personality_evidence rows).', v_found_count, array_length(v_ids, 1), v_deleted_count;
end $$;
