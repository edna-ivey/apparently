-- NOT A SCHEMA CHANGE. One-time cleanup of disposable anonymous test identities created
-- during the Build 6 final QA pass (live Phase 4/5 Share+Compare security and fresh-user
-- You-profile checks against the real linked project) -- never a real user or tester account.
-- Targets an EXPLICIT, individually-known list of auth.users ids (never a date-range or
-- pattern-based mass delete), matching the same safety-guarded approach as the previous
-- cleanup migration (20260922030000). Deleting from auth.users cascades (on delete cascade)
-- to each id's own quiz_results, quiz_shares, and compare_responses rows only.
--
-- Known NOT cleaned by this migration (their exact ids were never captured, so they are left
-- alone rather than guessed at or matched by date/pattern): 1-2 additional disposable
-- anonymous sessions created incidentally by the Build 6 visual-QA Playwright pass completing
-- real quiz runs in a real browser. Harmless test data, not a Build 6 blocker -- see the final
-- report's DATA section.

do $$
declare
  v_ids uuid[] := array[
    -- build6-qa.mjs, first run (failed on one test-authoring assertion mid-script, but the
    -- identities below were already created before that failure)
    'd57b4a25-5f43-41f5-9e47-b1527c7f610a'::uuid, -- kyaUser
    '05e4b640-49e9-4089-b4c7-ebddaa82923f'::uuid, -- bssUser
    '54626818-ee05-4642-824f-b179bd4ab2c9'::uuid, -- friendA
    '7241d469-87d4-44d8-b5aa-4c7abaeaf79b'::uuid, -- friendB
    '16ab0f0f-b29f-4ae4-84be-a36debdcc6af'::uuid, -- friendC
    'dfe33292-0669-4dd5-bfe7-9d6ee5afd5c7'::uuid, -- otherOwner
    -- build6-qa.mjs, second run (passed cleanly)
    'b63722e0-1caf-447e-a5d3-829e8db4ac21'::uuid, -- kyaUser
    '16ec0652-edae-4003-95ad-503b3a9d9a7c'::uuid, -- bssUser
    '338ed586-ecd0-4b8d-a8bd-4135a4dc7516'::uuid, -- friendA
    '03b15f6e-5f76-4a91-b6d4-9383e8809a36'::uuid, -- friendB
    'fe3f6a1f-70e4-464e-8459-939a1b903fef'::uuid, -- friendC
    '0f7cd5f5-5f29-4df3-9a7e-aa3e5fe6594a'::uuid  -- otherOwner
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

  raise notice 'Build 6 QA disposable identity cleanup: % of % listed ids existed and were confirmed anonymous; % deleted.', v_found_count, array_length(v_ids, 1), v_deleted_count;
end $$;
