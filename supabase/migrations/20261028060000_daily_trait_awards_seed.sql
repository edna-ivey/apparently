-- ============================================================================================
-- STAGED, NOT APPLIED. Requires explicit owner authorization before `supabase db push`.
-- PREREQUISITE: 20261028010000 (trait catalog) and 20261028050000 (daily_option_trait_awards
-- table) must both be applied first.
--
-- Numeric Daily trait-award SEED -- 118 rows across 60 real, live
-- daily_options rows. Source: supabase/migrations/20261021160000_daily_live_content_pole_
-- awards.sql's already-reviewed hand-authored mapping (never applied as jsonb; transcribed
-- here numerically). Resolves each string pole key to its numeric trait_id via the same
-- deterministic dimension-order formula every other Build 22 generator uses.
--
-- Generated mechanically by scripts/generate-daily-trait-awards-seed-sql.ts -- do not hand-
-- edit; regenerate if the source mapping changes.
--
-- VERIFICATION GUARD: raises if the actual row count inserted does not match 118 --
-- protects against applying this against a database where any of these specific option ids
-- no longer exist (same guard pattern 20261021160000 itself already used).
-- ============================================================================================

do $$
declare
  v_inserted integer;
begin
  with inserted as (
    insert into public.daily_option_trait_awards (option_id, trait_id, points)
    values
      ('1d3533fa-a3db-4e4f-b24f-22f678d7c763', 2, 2),
  ('1d3533fa-a3db-4e4f-b24f-22f678d7c763', 11, 2),
  ('2f7cf318-6b23-4d88-9c53-04cae817bb0a', 11, 1),
  ('2f7cf318-6b23-4d88-9c53-04cae817bb0a', 33, 1),
  ('4eb27666-828b-4bf2-9436-13429db3cf3c', 1, 2),
  ('4eb27666-828b-4bf2-9436-13429db3cf3c', 15, 2),
  ('13263cbd-fa9e-4943-96f5-63d1b58af65b', 12, 2),
  ('13263cbd-fa9e-4943-96f5-63d1b58af65b', 15, 1),
  ('4eec948e-30ab-44ac-8d14-f15a2112299d', 29, 1),
  ('4eec948e-30ab-44ac-8d14-f15a2112299d', 23, 1),
  ('d771b4ef-247a-4ffb-8ece-9a09ecfb7f6e', 9, 1),
  ('d771b4ef-247a-4ffb-8ece-9a09ecfb7f6e', 5, 1),
  ('7ee6691e-7f63-4b3b-84e3-ff32d08e3ff7', 19, 1),
  ('7ee6691e-7f63-4b3b-84e3-ff32d08e3ff7', 7, 1),
  ('273e9434-8661-43ce-835d-a9dc850d0f4f', 5, 2),
  ('273e9434-8661-43ce-835d-a9dc850d0f4f', 15, 1),
  ('6c805dde-907e-42a7-8f72-9b48f2462d9d', 33, 1),
  ('6c805dde-907e-42a7-8f72-9b48f2462d9d', 29, 1),
  ('e0cd62cc-ba09-4fa7-be85-93e1883aa3a1', 25, 1),
  ('e0cd62cc-ba09-4fa7-be85-93e1883aa3a1', 27, 1),
  ('d661a8bb-2af1-4a7f-a94e-d6581d4183a0', 7, 1),
  ('d661a8bb-2af1-4a7f-a94e-d6581d4183a0', 21, 1),
  ('192a75b4-b2d2-4d74-887b-9eaea49496cf', 27, 1),
  ('192a75b4-b2d2-4d74-887b-9eaea49496cf', 4, 1),
  ('2aa026e5-2778-450a-9a97-56bd483a87b2', 15, 1),
  ('2aa026e5-2778-450a-9a97-56bd483a87b2', 23, 1),
  ('650194db-2247-4a70-bca3-a950bf6e0344', 24, 2),
  ('30ed587d-5253-4303-a638-e87607d91452', 29, 1),
  ('30ed587d-5253-4303-a638-e87607d91452', 28, 1),
  ('762c2efa-cdb9-42f3-a482-1ede40360d73', 4, 2),
  ('762c2efa-cdb9-42f3-a482-1ede40360d73', 16, 1),
  ('2d45834d-3201-48af-9963-5e7599ad9aa8', 24, 1),
  ('2d45834d-3201-48af-9963-5e7599ad9aa8', 37, 1),
  ('780eb488-cf72-44a9-a591-3f4e1c1609fa', 29, 1),
  ('780eb488-cf72-44a9-a591-3f4e1c1609fa', 28, 1),
  ('d1932683-6885-4675-a07b-bb449a9ccc99', 27, 1),
  ('d1932683-6885-4675-a07b-bb449a9ccc99', 10, 1),
  ('51e7a010-0727-4acd-920a-212662a2d40a', 5, 2),
  ('51e7a010-0727-4acd-920a-212662a2d40a', 9, 1),
  ('ddc750d1-9d7a-49b6-a636-f7783d7a3e57', 27, 2),
  ('ddc750d1-9d7a-49b6-a636-f7783d7a3e57', 25, 1),
  ('0422e592-adf6-42d7-9434-76be0a211955', 27, 1),
  ('0422e592-adf6-42d7-9434-76be0a211955', 26, 1),
  ('7b358f4f-b49e-416c-843a-d5820dfdd44e', 26, 2),
  ('7b358f4f-b49e-416c-843a-d5820dfdd44e', 17, 1),
  ('e5e2859c-4642-4913-9b48-5d1a91596ce0', 28, 2),
  ('e5e2859c-4642-4913-9b48-5d1a91596ce0', 34, 1),
  ('fec3e884-03cf-44b1-93f6-44eb2c109665', 36, 2),
  ('fec3e884-03cf-44b1-93f6-44eb2c109665', 5, 1),
  ('5355204a-80a9-4d8b-b658-6ad44c482946', 36, 1),
  ('5355204a-80a9-4d8b-b658-6ad44c482946', 17, 1),
  ('00adaac1-5c70-4def-8f78-476681e71998', 29, 2),
  ('00adaac1-5c70-4def-8f78-476681e71998', 6, 1),
  ('065b694e-4d79-4a9a-a1c4-1bb101ab1232', 35, 2),
  ('065b694e-4d79-4a9a-a1c4-1bb101ab1232', 26, 1),
  ('3fd1f90b-670e-48c3-99a8-c229120f0b93', 33, 1),
  ('3fd1f90b-670e-48c3-99a8-c229120f0b93', 17, 1),
  ('6fe8aa77-687a-4ae4-a7c6-5f65789f71dd', 21, 2),
  ('6fe8aa77-687a-4ae4-a7c6-5f65789f71dd', 5, 1),
  ('8ad5b062-0340-489f-be68-1aea7e5fa064', 9, 1),
  ('8ad5b062-0340-489f-be68-1aea7e5fa064', 22, 1),
  ('5ef6c827-f194-4b92-aac8-94df4de43cb2', 24, 1),
  ('5ef6c827-f194-4b92-aac8-94df4de43cb2', 9, 1),
  ('5ef6c827-f194-4b92-aac8-94df4de43cb2', 17, 1),
  ('510bfd80-17f5-4be1-9507-57ff2970807d', 37, 1),
  ('c1accf2d-3ec0-4a32-889d-209febe05c67', 21, 2),
  ('4b2d5e3c-8a01-4f2a-8f3e-2acbecc282c1', 26, 2),
  ('4b2d5e3c-8a01-4f2a-8f3e-2acbecc282c1', 17, 1),
  ('9f7b1c4d-619b-403e-96b5-96023fa13211', 22, 2),
  ('9f7b1c4d-619b-403e-96b5-96023fa13211', 2, 1),
  ('2624fc7b-f85e-4406-9688-892f2eb72402', 5, 2),
  ('2624fc7b-f85e-4406-9688-892f2eb72402', 23, 2),
  ('ad0c2d5e-7969-4f92-9acd-4e53de6c7230', 35, 2),
  ('ad0c2d5e-7969-4f92-9acd-4e53de6c7230', 24, 1),
  ('e27bcac6-a3ad-4853-8536-44e0273e9b80', 6, 2),
  ('e27bcac6-a3ad-4853-8536-44e0273e9b80', 30, 1),
  ('a48b3d9e-cf16-4e61-bf18-c702a7fcb202', 5, 2),
  ('a48b3d9e-cf16-4e61-bf18-c702a7fcb202', 28, 1),
  ('6dcb7df8-2c02-4564-915a-f3bad573c360', 33, 1),
  ('6dcb7df8-2c02-4564-915a-f3bad573c360', 26, 1),
  ('ba4eba3d-775c-4467-a37c-dfafc2d278a1', 25, 1),
  ('ba4eba3d-775c-4467-a37c-dfafc2d278a1', 13, 1),
  ('61cb483c-3eb9-4b45-8ca1-609aba673051', 26, 2),
  ('61cb483c-3eb9-4b45-8ca1-609aba673051', 7, 1),
  ('22ed955f-1878-4523-ba2e-feebaf3c49b4', 5, 1),
  ('22ed955f-1878-4523-ba2e-feebaf3c49b4', 26, 1),
  ('399c5eae-6d39-449f-b796-fcd9ae3502f0', 26, 2),
  ('399c5eae-6d39-449f-b796-fcd9ae3502f0', 9, 1),
  ('d4083739-7fa3-4ce1-a7e5-22ef03c84e63', 29, 2),
  ('d4083739-7fa3-4ce1-a7e5-22ef03c84e63', 9, 1),
  ('d4083739-7fa3-4ce1-a7e5-22ef03c84e63', 5, 1),
  ('7d0df73e-acd8-4816-8679-072cef46c2c0', 25, 2),
  ('7d0df73e-acd8-4816-8679-072cef46c2c0', 10, 1),
  ('67aaacad-28b7-4bd4-b61a-7a5a4191d2e1', 5, 2),
  ('67aaacad-28b7-4bd4-b61a-7a5a4191d2e1', 9, 1),
  ('3242db06-4178-42f8-9f3b-d8b7d4c32a76', 38, 2),
  ('3242db06-4178-42f8-9f3b-d8b7d4c32a76', 25, 1),
  ('1ac1a42a-3365-4818-9753-fc317905e5bb', 26, 2),
  ('1ac1a42a-3365-4818-9753-fc317905e5bb', 33, 1),
  ('69542272-19b5-46cc-b403-08c8cbadc3ee', 5, 2),
  ('69542272-19b5-46cc-b403-08c8cbadc3ee', 15, 1),
  ('ba72f8ea-980c-4259-b2c8-a7c2476a4de4', 34, 2),
  ('e798c52a-10cb-4aa9-b474-b8b559b9a836', 5, 2),
  ('e798c52a-10cb-4aa9-b474-b8b559b9a836', 23, 2),
  ('8489219e-88b1-4e92-8e46-62e70f184209', 24, 1),
  ('8489219e-88b1-4e92-8e46-62e70f184209', 37, 1),
  ('329940d2-f335-467c-a8c9-aa90a634a618', 7, 2),
  ('329940d2-f335-467c-a8c9-aa90a634a618', 26, 1),
  ('4e9cefff-5ca1-4517-a0f8-a2b5de8ae00d', 28, 2),
  ('4e9cefff-5ca1-4517-a0f8-a2b5de8ae00d', 29, 1),
  ('99ae0194-c7d1-4586-b0e5-4b1b03320726', 15, 2),
  ('99ae0194-c7d1-4586-b0e5-4b1b03320726', 34, 2),
  ('09456186-df6e-4405-be9d-e42484a79908', 14, 2),
  ('09456186-df6e-4405-be9d-e42484a79908', 15, 1),
  ('d7a83d46-19f9-4c9b-96bd-20d234f34baa', 16, 2),
  ('d7a83d46-19f9-4c9b-96bd-20d234f34baa', 37, 1),
  ('740878a1-f297-4f20-8fb5-c3cef5b00938', 13, 2),
  ('740878a1-f297-4f20-8fb5-c3cef5b00938', 5, 1)
    on conflict (option_id, trait_id) do nothing
    returning 1
  )
  select count(*) into v_inserted from inserted;

  if v_inserted <> 118 then
    raise exception 'Expected to insert exactly 118 daily_option_trait_awards rows, inserted %. Aborting -- do not partially apply.', v_inserted;
  end if;
end $$;
