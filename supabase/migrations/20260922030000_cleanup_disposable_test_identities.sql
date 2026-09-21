-- NOT A SCHEMA CHANGE. One-time cleanup of disposable anonymous test identities created
-- during this engagement's live smoke-testing (Compare RPC/security testing across the
-- previous "THEY HAVE NOTES." sprint and this personality-expansion/respondent-identity
-- sprint) -- never a real user or tester account. Targets an EXPLICIT, individually-known list
-- of auth.users ids (never a date-range or pattern-based mass delete). Deleting from
-- auth.users cascades (on delete cascade) to each id's own quiz_results, quiz_shares, and
-- compare_responses rows only -- nothing belonging to any other identity is touched.
--
-- A safety guard runs first: every id must resolve to is_anonymous = true, or the whole
-- statement aborts and deletes nothing. If any id in this list is not found (already cleaned
-- up, or never existed in this environment), it is silently skipped -- not an error.

do $$
declare
  v_ids uuid[] := array[
    -- THEY HAVE NOTES. sprint (previous session's live RPC/security smoke test)
    '47b61093-815f-4b29-8e9a-3911ba7c5268'::uuid, -- owner
    '0241c714-e5f4-4c48-aba0-26c423c998c7'::uuid, -- friendA
    'a8f659e3-df6b-402f-85c0-ff0a25ce55c6'::uuid, -- friendB
    '3521a869-de60-439c-9b35-c76ab3750680'::uuid, -- friendC
    '2c08bb22-d4c7-48b5-a20b-13d605620835'::uuid, -- unrelatedOwner
    'b3ee71d7-7712-408a-a316-eb03f8f133ec'::uuid, -- owner (first, pre-fix run)
    '995004ae-2eb6-4365-a618-e7d2446d5e0e'::uuid, -- friendA (first run)
    'fe1e3ba6-7573-4a47-817f-43fec2bc1e4b'::uuid, -- friendB (first run)
    '73cd31e1-865c-440a-8bc6-e7d7bf29396f'::uuid, -- friendC (first run)
    'a2d0232e-33ed-43ef-9190-45e3a55be282'::uuid, -- unrelatedOwner (first run)
    -- Personality-expansion / respondent-identity sprint (this session's live smoke test)
    '512d8b8c-9989-4212-8cd8-e6b0fea39ae6'::uuid, -- owner
    '05b9223d-0e1e-4496-b878-f2dd7715e98f'::uuid, -- owner2
    'c47bb5bd-d32f-4831-8f95-c109193b0021'::uuid, -- friendA
    '6a5d1906-72ef-420c-81b2-1c05f9d11de7'::uuid, -- friendB
    'e3e1e4f2-08ab-44f5-87c4-ed5d7c0c6506'::uuid  -- friendC
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

  raise notice 'Disposable test identity cleanup: % of % listed ids existed and were confirmed anonymous; % deleted.', v_found_count, array_length(v_ids, 1), v_deleted_count;
end $$;
