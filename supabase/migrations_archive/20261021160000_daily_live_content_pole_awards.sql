-- ============================================================================================
-- SUPERSEDED (Build 22, 2026-10-28). Never applied directly -- the jsonb string-pole
-- pole_personality_effects column this file populates is replaced by the numeric
-- daily_option_trait_awards relational table (20261028050000_daily_trait_identity_and_
-- rotation_fix.sql), which is what handle_daily_answer_trait_evidence actually reads at
-- answer time (confirmed by reading its real body, not assumed). This file is no longer
-- applied as a migration; it exists as the one hand-authored, re-derivable SOURCE
-- scripts/generate-daily-trait-awards-seed-sql.ts reads to produce the real seed migration
-- (20261028060000) -- edit THIS file, then regenerate, never hand-edit the generated migration.
--
-- REBUILT FROM SCRATCH (V1 release execution, 2026-11-05), after an independent code review
-- found the content here had drifted from the owner's own approval ledger in two distinct,
-- separately-introduced ways across earlier correction passes this same release cycle:
--   1. The ORIGINAL authoring (2026-10-21) repolarized whatever was already live in the OLD
--      legacy signed personality_effects column into the new positive-only pole notation --
--      correct as a mechanical conversion, but authored BEFORE the owner's own October 21
--      "Reassessment Round 1-4 of 4" rescoring (docs/DAILY_PRODUCTION_OWNER_APPROVALS.md) and
--      never merged with it.
--   2. Later correction passes this same release cycle, meant to fix exactly that, instead
--      pulled values from docs/DAILY_MASTER_CONSOLIDATED_REVIEW.md -- which is itself, in
--      multiple confirmed places, STALE relative to the Reassessment Rounds (the master
--      document's own "incorporates the latest rescoring" claim does not hold for every
--      question it covers). This reintroduced the same class of error a different way.
--
-- CORRECT PRECEDENCE, applied uniformly below for every one of the live questions, computed
-- programmatically (never hand-typed) by cross-referencing every source document:
--   1. Explicit, LATER, per-answer Audit Round corrections (2026-10-22) -- #3C, #10A, #21D,
--      #23B. The most authoritative layer; supersedes everything else for those 4 answers.
--   2. The owner's October 21 Reassessment Round 1-4 of 4 value, when this question's
--      Source id (e.g. "B2-01") has an entry in docs/DAILY_PRODUCTION_OWNER_APPROVALS.md's
--      reassessment sections -- this covers the original 37 approved-and-reassessed Dailies.
--   3. The master document's own value, only when a question was never part of the
--      reassessment process at all (approved in a later batch, after the reassessment rounds
--      had already closed).
--
-- Re-verifiable any time with: npx tsx scripts/validate-daily-scoring-against-ledger.ts
-- (prints every place the master document itself diverges from the authoritative ledger value
-- -- that divergence is EXPECTED and is exactly why this file does not simply trust the master
-- document wholesale).
--
-- Every id below is a real production daily_options.id. Absence of a line for a given option
-- id means zero award (an owner-approved NONE/entertainment-only answer) -- confirmed
-- convention throughout this file and its generator, not a gap.
-- ============================================================================================

update public.daily_options set pole_personality_effects = '[{"pole":"accountability_defensiveness:positive","points":3},{"pole":"rules_bending:positive","points":2},{"pole":"duty_first_self_preserving:positive","points":1}]'::jsonb where id = '913022ee-7fae-4fc0-b454-c90b53b16365';
update public.daily_options set pole_personality_effects = '[{"pole":"boundary_holding_approval_seeking:positive","points":3},{"pole":"rules_bending:positive","points":2},{"pole":"control_allowing:positive","points":1}]'::jsonb where id = '57585104-9456-4597-9894-3b17ada0f356';
update public.daily_options set pole_personality_effects = '[{"pole":"rules_bending:positive","points":2},{"pole":"planner_spontaneous:positive","points":1},{"pole":"control_allowing:positive","points":1}]'::jsonb where id = 'cfe31e6f-70f0-448b-8a1a-f38758809b7e';
update public.daily_options set pole_personality_effects = '[{"pole":"rules_bending:positive","points":3},{"pole":"control_allowing:positive","points":2},{"pole":"planner_spontaneous:positive","points":1}]'::jsonb where id = '4528aed5-a8ad-404b-9fdc-b6ffcf85e1e5';
update public.daily_options set pole_personality_effects = '[{"pole":"self_secure_reassurance:positive","points":2},{"pole":"independent_collaborative:positive","points":1}]'::jsonb where id = '39f9d84c-571a-421c-8613-7ed51b97641e';
update public.daily_options set pole_personality_effects = '[{"pole":"duty_first_self_preserving:positive","points":1},{"pole":"supportive_challenging:positive","points":1}]'::jsonb where id = '9d96aad1-6a26-436c-bf6b-51265f03f51c';
update public.daily_options set pole_personality_effects = '[{"pole":"protective_hands_off:positive","points":2},{"pole":"supportive_challenging:positive","points":2}]'::jsonb where id = '4195ecbe-236c-46a5-b36d-0c96c4a5b4a4';
update public.daily_options set pole_personality_effects = '[{"pole":"ambitious_content:positive","points":1}]'::jsonb where id = 'd96fc00f-64bf-4523-b177-3cf2277f39a4';
update public.daily_options set pole_personality_effects = '[{"pole":"trust_verify:negative","points":3},{"pole":"boundary_holding_approval_seeking:positive","points":2},{"pole":"social_attunement:positive","points":2},{"pole":"curious_decisive:positive","points":1}]'::jsonb where id = '399c5eae-6d39-449f-b796-fcd9ae3502f0';
update public.daily_options set pole_personality_effects = '[{"pole":"playful_serious:positive","points":3},{"pole":"direct_indirect:positive","points":2},{"pole":"boundary_holding_approval_seeking:positive","points":1}]'::jsonb where id = 'd4083739-7fa3-4ce1-a7e5-22ef03c84e63';
update public.daily_options set pole_personality_effects = '[{"pole":"trust_verify:positive","points":3},{"pole":"control_allowing:negative","points":2},{"pole":"emotional_intensity:negative","points":1},{"pole":"social_attunement:negative","points":2}]'::jsonb where id = '7d0df73e-acd8-4816-8679-072cef46c2c0';
update public.daily_options set pole_personality_effects = '[{"pole":"boundary_holding_approval_seeking:positive","points":3},{"pole":"tactful_blunt:negative","points":2},{"pole":"playful_serious:positive","points":2},{"pole":"independent_collaborative:positive","points":1}]'::jsonb where id = '67aaacad-28b7-4bd4-b61a-7a5a4191d2e1';
update public.daily_options set pole_personality_effects = '[{"pole":"curious_decisive:positive","points":3},{"pole":"trust_verify:negative","points":2},{"pole":"social_attunement:positive","points":2},{"pole":"direct_indirect:positive","points":1}]'::jsonb where id = '6dcb7df8-2c02-4564-915a-f3bad573c360';
update public.daily_options set pole_personality_effects = '[{"pole":"boundary_holding_approval_seeking:positive","points":3},{"pole":"trust_verify:positive","points":2},{"pole":"independent_collaborative:positive","points":1}]'::jsonb where id = 'ba4eba3d-775c-4467-a37c-dfafc2d278a1';
update public.daily_options set pole_personality_effects = '[{"pole":"trust_verify:negative","points":3},{"pole":"social_attunement:positive","points":2},{"pole":"curious_decisive:positive","points":2}]'::jsonb where id = '61cb483c-3eb9-4b45-8ca1-609aba673051';
update public.daily_options set pole_personality_effects = '[{"pole":"trust_verify:negative","points":3},{"pole":"direct_indirect:positive","points":2},{"pole":"boundary_holding_approval_seeking:positive","points":2},{"pole":"reflective_reactive:positive","points":1}]'::jsonb where id = '22ed955f-1878-4523-ba2e-feebaf3c49b4';
update public.daily_options set pole_personality_effects = '[{"pole":"perspective_taking_self_referencing:positive","points":3},{"pole":"practical_idealistic:positive","points":2},{"pole":"reflective_reactive:positive","points":2},{"pole":"protective_hands_off:positive","points":1}]'::jsonb where id = '3fd1f90b-670e-48c3-99a8-c229120f0b93';
update public.daily_options set pole_personality_effects = '[{"pole":"boundary_holding_approval_seeking:positive","points":3},{"pole":"direct_indirect:positive","points":3},{"pole":"independent_collaborative:positive","points":1}]'::jsonb where id = '6fe8aa77-687a-4ae4-a7c6-5f65789f71dd';
update public.daily_options set pole_personality_effects = '[{"pole":"rules_bending:negative","points":3},{"pole":"protective_hands_off:positive","points":2},{"pole":"supportive_challenging:positive","points":1}]'::jsonb where id = '8ad5b062-0340-489f-be68-1aea7e5fa064';
update public.daily_options set pole_personality_effects = '[{"pole":"tactful_blunt:positive","points":3},{"pole":"boundary_holding_approval_seeking:positive","points":2},{"pole":"conflict_peacekeeping:negative","points":2},{"pole":"practical_idealistic:positive","points":1}]'::jsonb where id = '5ef6c827-f194-4b92-aac8-94df4de43cb2';
update public.daily_options set pole_personality_effects = '[{"pole":"patient_urgent:positive","points":2},{"pole":"initiating_responsive:negative","points":1},{"pole":"boundary_holding_approval_seeking:positive","points":1}]'::jsonb where id = '2d45834d-3201-48af-9963-5e7599ad9aa8';
update public.daily_options set pole_personality_effects = '[{"pole":"gives_freely_keeps_score:negative","points":3},{"pole":"playful_serious:positive","points":3},{"pole":"direct_indirect:positive","points":1}]'::jsonb where id = '780eb488-cf72-44a9-a591-3f4e1c1609fa';
update public.daily_options set pole_personality_effects = '[{"pole":"supportive_challenging:positive","points":3},{"pole":"forgiving_receipts:positive","points":2},{"pole":"gives_freely_keeps_score:positive","points":2},{"pole":"perspective_taking_self_referencing:positive","points":1}]'::jsonb where id = 'd1932683-6885-4675-a07b-bb449a9ccc99';
update public.daily_options set pole_personality_effects = '[{"pole":"direct_indirect:positive","points":3},{"pole":"supportive_challenging:positive","points":2},{"pole":"supportive_challenging:negative","points":2},{"pole":"tactful_blunt:negative","points":1}]'::jsonb where id = '51e7a010-0727-4acd-920a-212662a2d40a';
update public.daily_options set pole_personality_effects = '[{"pole":"practical_idealistic:positive","points":1}]'::jsonb where id = '94d77663-a67e-48f1-a744-1e609e9a2798';
update public.daily_options set pole_personality_effects = '[{"pole":"trust_verify:negative","points":1}]'::jsonb where id = '92f42469-c931-46c6-8cce-8279c4c235e7';
update public.daily_options set pole_personality_effects = '[{"pole":"curious_decisive:positive","points":3}]'::jsonb where id = '7b2edd4f-7c4d-4c6a-991f-87cd680b3eb2';
update public.daily_options set pole_personality_effects = '[{"pole":"curious_decisive:positive","points":2}]'::jsonb where id = '9d90c4c7-2b8a-467e-8ad8-1050c9d0e588';
update public.daily_options set pole_personality_effects = '[{"pole":"reflective_reactive:positive","points":2},{"pole":"curious_decisive:positive","points":1}]'::jsonb where id = '7bd747d2-d47b-4950-8880-caa314c22bb7';
update public.daily_options set pole_personality_effects = '[{"pole":"playful_serious:positive","points":1}]'::jsonb where id = 'a98b6f67-cd03-4954-a6fe-38a05027e639';
update public.daily_options set pole_personality_effects = '[{"pole":"supportive_challenging:positive","points":1}]'::jsonb where id = '0deacb4c-7377-4078-8d25-eaefe64f6500';
update public.daily_options set pole_personality_effects = '[{"pole":"ambitious_content:positive","points":1}]'::jsonb where id = '057dac37-31e1-4ac7-beee-5952a5ac0859';
update public.daily_options set pole_personality_effects = '[{"pole":"duty_first_self_preserving:positive","points":1}]'::jsonb where id = '5dfb2cac-202c-4d08-a8ba-7354a63b9ac5';
update public.daily_options set pole_personality_effects = '[{"pole":"playful_serious:positive","points":3},{"pole":"conflict_peacekeeping:positive","points":2},{"pole":"competitive_cooperative:positive","points":2},{"pole":"reflective_reactive:negative","points":1},{"pole":"sentimental_thick_skinned:negative","points":3}]'::jsonb where id = '4eec948e-30ab-44ac-8d14-f15a2112299d';
update public.daily_options set pole_personality_effects = '[{"pole":"boundary_holding_approval_seeking:positive","points":2},{"pole":"protective_hands_off:positive","points":1}]'::jsonb where id = 'd771b4ef-247a-4ffb-8ece-9a09ecfb7f6e';
update public.daily_options set pole_personality_effects = '[{"pole":"boundary_holding_approval_seeking:positive","points":2}]'::jsonb where id = '7ee6691e-7f63-4b3b-84e3-ff32d08e3ff7';
update public.daily_options set pole_personality_effects = '[{"pole":"direct_indirect:positive","points":3},{"pole":"conflict_peacekeeping:positive","points":2},{"pole":"boundary_holding_approval_seeking:positive","points":2},{"pole":"accountability_defensiveness:positive","points":1}]'::jsonb where id = '273e9434-8661-43ce-835d-a9dc850d0f4f';
update public.daily_options set pole_personality_effects = '[{"pole":"initiating_responsive:negative","points":3},{"pole":"protective_hands_off:positive","points":1},{"pole":"patient_urgent:negative","points":1}]'::jsonb where id = '3242db06-4178-42f8-9f3b-d8b7d4c32a76';
update public.daily_options set pole_personality_effects = '[{"pole":"trust_verify:negative","points":3},{"pole":"practical_idealistic:positive","points":2},{"pole":"private_open:positive","points":1}]'::jsonb where id = '1ac1a42a-3365-4818-9753-fc317905e5bb';
update public.daily_options set pole_personality_effects = '[{"pole":"direct_indirect:positive","points":2},{"pole":"trust_verify:negative","points":2},{"pole":"boundary_holding_approval_seeking:positive","points":1}]'::jsonb where id = '69542272-19b5-46cc-b403-08c8cbadc3ee';
update public.daily_options set pole_personality_effects = '[{"pole":"curious_decisive:negative","points":3},{"pole":"boundary_holding_approval_seeking:positive","points":2},{"pole":"duty_first_self_preserving:negative","points":1}]'::jsonb where id = 'ba72f8ea-980c-4259-b2c8-a7c2476a4de4';
update public.daily_options set pole_personality_effects = '[{"pole":"forgiving_receipts:positive","points":3},{"pole":"repair_punishing:positive","points":2},{"pole":"perspective_taking_self_referencing:positive","points":1}]'::jsonb where id = 'ddc750d1-9d7a-49b6-a636-f7783d7a3e57';
update public.daily_options set pole_personality_effects = '[{"pole":"forgiving_receipts:positive","points":2},{"pole":"boundary_holding_approval_seeking:positive","points":3},{"pole":"duty_first_self_preserving:negative","points":2},{"pole":"reflective_reactive:positive","points":1}]'::jsonb where id = '0422e592-adf6-42d7-9434-76be0a211955';
update public.daily_options set pole_personality_effects = '[{"pole":"accountability_defensiveness:positive","points":3},{"pole":"trust_verify:negative","points":2},{"pole":"boundary_holding_approval_seeking:positive","points":2},{"pole":"practical_idealistic:positive","points":1}]'::jsonb where id = '7b358f4f-b49e-416c-843a-d5820dfdd44e';
update public.daily_options set pole_personality_effects = '[{"pole":"curious_decisive:negative","points":3},{"pole":"boundary_holding_approval_seeking:positive","points":3},{"pole":"duty_first_self_preserving:negative","points":2},{"pole":"forgiving_receipts:negative","points":1}]'::jsonb where id = 'e5e2859c-4642-4913-9b48-5d1a91596ce0';
update public.daily_options set pole_personality_effects = '[{"pole":"boundary_holding_approval_seeking:positive","points":2},{"pole":"independent_collaborative:positive","points":2},{"pole":"curious_decisive:negative","points":1}]'::jsonb where id = '2aa026e5-2778-450a-9a97-56bd483a87b2';
update public.daily_options set pole_personality_effects = '[{"pole":"practical_idealistic:positive","points":3},{"pole":"conflict_peacekeeping:negative","points":2},{"pole":"duty_first_self_preserving:negative","points":2},{"pole":"emotional_intensity:negative","points":1}]'::jsonb where id = '650194db-2247-4a70-bca3-a950bf6e0344';
update public.daily_options set pole_personality_effects = '[{"pole":"reflective_reactive:negative","points":3},{"pole":"conflict_peacekeeping:positive","points":2},{"pole":"supportive_challenging:negative","points":1}]'::jsonb where id = '30ed587d-5253-4303-a638-e87607d91452';
update public.daily_options set pole_personality_effects = '[{"pole":"emotional_intensity:negative","points":3},{"pole":"self_secure_reassurance:positive","points":2},{"pole":"independent_collaborative:positive","points":2},{"pole":"boundary_holding_approval_seeking:positive","points":1}]'::jsonb where id = '762c2efa-cdb9-42f3-a482-1ede40360d73';
update public.daily_options set pole_personality_effects = '[{"pole":"curious_decisive:positive","points":2},{"pole":"playful_serious:positive","points":2},{"pole":"social_attunement:positive","points":1}]'::jsonb where id = '6c805dde-907e-42a7-8f72-9b48f2462d9d';
update public.daily_options set pole_personality_effects = '[{"pole":"perspective_taking_self_referencing:positive","points":3},{"pole":"reflective_reactive:positive","points":2},{"pole":"patient_urgent:positive","points":1}]'::jsonb where id = 'e0cd62cc-ba09-4fa7-be85-93e1883aa3a1';
update public.daily_options set pole_personality_effects = '[{"pole":"accountability_defensiveness:positive","points":2},{"pole":"social_attunement:positive","points":1}]'::jsonb where id = 'd661a8bb-2af1-4a7f-a94e-d6581d4183a0';
update public.daily_options set pole_personality_effects = '[{"pole":"control_allowing:negative","points":2},{"pole":"emotional_intensity:negative","points":2},{"pole":"conflict_peacekeeping:negative","points":1}]'::jsonb where id = '192a75b4-b2d2-4d74-887b-9eaea49496cf';
update public.daily_options set pole_personality_effects = '[{"pole":"private_open:negative","points":3},{"pole":"direct_indirect:positive","points":2},{"pole":"self_secure_reassurance:positive","points":1}]'::jsonb where id = 'fec3e884-03cf-44b1-93f6-44eb2c109665';
update public.daily_options set pole_personality_effects = '[{"pole":"tactful_blunt:positive","points":2},{"pole":"boundary_holding_approval_seeking:positive","points":2},{"pole":"private_open:negative","points":1}]'::jsonb where id = '5355204a-80a9-4d8b-b658-6ad44c482946';
update public.daily_options set pole_personality_effects = '[{"pole":"playful_serious:positive","points":3},{"pole":"private_open:positive","points":2},{"pole":"tactful_blunt:positive","points":2},{"pole":"direct_indirect:negative","points":1}]'::jsonb where id = '00adaac1-5c70-4def-8f78-476681e71998';
update public.daily_options set pole_personality_effects = '[{"pole":"boundary_holding_approval_seeking:positive","points":3},{"pole":"private_open:positive","points":3},{"pole":"direct_indirect:positive","points":2},{"pole":"trust_verify:negative","points":1}]'::jsonb where id = '065b694e-4d79-4a9a-a1c4-1bb101ab1232';
update public.daily_options set pole_personality_effects = '[{"pole":"direct_indirect:positive","points":1},{"pole":"accountability_defensiveness:positive","points":1}]'::jsonb where id = '5a8dd80f-e968-4c73-9773-c8c55852008e';
update public.daily_options set pole_personality_effects = '[{"pole":"boundary_holding_approval_seeking:positive","points":1}]'::jsonb where id = '1f2c0a77-a300-44e2-a94e-9d60a685380a';
update public.daily_options set pole_personality_effects = '[{"pole":"accountability_defensiveness:positive","points":1},{"pole":"planner_spontaneous:positive","points":1}]'::jsonb where id = '1232a353-24f2-4fd2-8e1f-dc2927645883';
update public.daily_options set pole_personality_effects = '[{"pole":"social_attunement:positive","points":1}]'::jsonb where id = '39f17b27-f78b-4078-a965-31d594e3ae2f';
update public.daily_options set pole_personality_effects = '[{"pole":"adventure_comfort:positive","points":1},{"pole":"curious_decisive:positive","points":1}]'::jsonb where id = 'fbfe9bfa-5c2a-4bf3-ad67-558193015cc5';
update public.daily_options set pole_personality_effects = '[{"pole":"sentimental_thick_skinned:positive","points":1}]'::jsonb where id = 'e6dfb20b-24a7-4c07-b8a7-7d48b3f544ba';
update public.daily_options set pole_personality_effects = '[{"pole":"independent_collaborative:positive","points":1}]'::jsonb where id = 'acb032e1-179c-408c-ae6f-0b4ed4dfc381';
update public.daily_options set pole_personality_effects = '[{"pole":"adventure_comfort:negative","points":1}]'::jsonb where id = 'fa6602e3-b456-4605-a43b-195f54b81b98';
update public.daily_options set pole_personality_effects = '[{"pole":"independent_collaborative:positive","points":1}]'::jsonb where id = '858ebeb3-2f07-42b0-80d9-a5be4287f863';
update public.daily_options set pole_personality_effects = '[{"pole":"practical_idealistic:positive","points":1}]'::jsonb where id = '7e047303-24fa-4294-b044-b72612209450';
update public.daily_options set pole_personality_effects = '[{"pole":"accountability_defensiveness:positive","points":3},{"pole":"direct_indirect:positive","points":3},{"pole":"conflict_peacekeeping:positive","points":2},{"pole":"self_secure_reassurance:positive","points":1}]'::jsonb where id = '2624fc7b-f85e-4406-9688-892f2eb72402';
update public.daily_options set pole_personality_effects = '[{"pole":"duty_first_self_preserving:negative","points":3},{"pole":"conflict_peacekeeping:negative","points":2},{"pole":"direct_indirect:negative","points":2},{"pole":"reflective_reactive:negative","points":1}]'::jsonb where id = 'ad0c2d5e-7969-4f92-9acd-4e53de6c7230';
update public.daily_options set pole_personality_effects = '[{"pole":"reflective_reactive:negative","points":3},{"pole":"direct_indirect:negative","points":3},{"pole":"duty_first_self_preserving:negative","points":2}]'::jsonb where id = 'e27bcac6-a3ad-4853-8536-44e0273e9b80';
update public.daily_options set pole_personality_effects = '[{"pole":"tactful_blunt:negative","points":2},{"pole":"conflict_peacekeeping:positive","points":2},{"pole":"sentimental_thick_skinned:negative","points":1}]'::jsonb where id = 'a48b3d9e-cf16-4e61-bf18-c702a7fcb202';
update public.daily_options set pole_personality_effects = '[{"pole":"patient_urgent:positive","points":3},{"pole":"perspective_taking_self_referencing:positive","points":2},{"pole":"accountability_defensiveness:positive","points":1}]'::jsonb where id = '510bfd80-17f5-4be1-9507-57ff2970807d';
update public.daily_options set pole_personality_effects = '[{"pole":"accountability_defensiveness:positive","points":2},{"pole":"rules_bending:positive","points":3}]'::jsonb where id = 'c1accf2d-3ec0-4a32-889d-209febe05c67';
update public.daily_options set pole_personality_effects = '[{"pole":"trust_verify:negative","points":3},{"pole":"practical_idealistic:positive","points":3},{"pole":"accountability_defensiveness:positive","points":2},{"pole":"protective_hands_off:positive","points":1}]'::jsonb where id = '4b2d5e3c-8a01-4f2a-8f3e-2acbecc282c1';
update public.daily_options set pole_personality_effects = '[{"pole":"playful_serious:positive","points":2}]'::jsonb where id = '9f7b1c4d-619b-403e-96b5-96023fa13211';
update public.daily_options set pole_personality_effects = '[{"pole":"direct_indirect:positive","points":3},{"pole":"initiating_responsive:positive","points":2},{"pole":"curious_decisive:positive","points":2},{"pole":"repair_punishing:positive","points":1}]'::jsonb where id = 'e798c52a-10cb-4aa9-b474-b8b559b9a836';
update public.daily_options set pole_personality_effects = '[{"pole":"patient_urgent:positive","points":3},{"pole":"perspective_taking_self_referencing:positive","points":2},{"pole":"initiating_responsive:negative","points":2},{"pole":"conflict_peacekeeping:negative","points":1}]'::jsonb where id = '8489219e-88b1-4e92-8e46-62e70f184209';
update public.daily_options set pole_personality_effects = '[{"pole":"social_attunement:positive","points":3},{"pole":"trust_verify:negative","points":2},{"pole":"patient_urgent:positive","points":1}]'::jsonb where id = '329940d2-f335-467c-a8c9-aa90a634a618';
update public.daily_options set pole_personality_effects = '[{"pole":"reflective_reactive:negative","points":3},{"pole":"competitive_cooperative:positive","points":2},{"pole":"direct_indirect:negative","points":2},{"pole":"duty_first_self_preserving:negative","points":1}]'::jsonb where id = '4e9cefff-5ca1-4517-a0f8-a2b5de8ae00d';
update public.daily_options set pole_personality_effects = '[{"pole":"planner_spontaneous:negative","points":3},{"pole":"adventure_comfort:positive","points":3},{"pole":"trust_verify:positive","points":2},{"pole":"initiating_responsive:negative","points":1}]'::jsonb where id = '1d3533fa-a3db-4e4f-b24f-22f678d7c763';
update public.daily_options set pole_personality_effects = '[{"pole":"adventure_comfort:positive","points":3},{"pole":"curious_decisive:positive","points":2},{"pole":"planner_spontaneous:negative","points":2},{"pole":"trust_verify:negative","points":1}]'::jsonb where id = '2f7cf318-6b23-4d88-9c53-04cae817bb0a';
update public.daily_options set pole_personality_effects = '[{"pole":"planner_spontaneous:positive","points":3},{"pole":"trust_verify:negative","points":3},{"pole":"control_allowing:positive","points":2},{"pole":"practical_idealistic:positive","points":2}]'::jsonb where id = '4eb27666-828b-4bf2-9436-13429db3cf3c';
update public.daily_options set pole_personality_effects = '[{"pole":"trust_verify:negative","points":3},{"pole":"boundary_holding_approval_seeking:positive","points":3},{"pole":"practical_idealistic:positive","points":2},{"pole":"direct_indirect:positive","points":1}]'::jsonb where id = '13263cbd-fa9e-4943-96f5-63d1b58af65b';
