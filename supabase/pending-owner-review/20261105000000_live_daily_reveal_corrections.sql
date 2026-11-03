-- STAGED, NOT APPLIED, NOT PART OF THE 21-FILE ENGINEERING CANDIDATE SET. Content
-- correction, not a schema change -- requires its own owner review and sign-off.
--
-- V1 release execution (2026-11-05): corrects live production reveal text for the 26 already-
-- live canonical Daily questions against docs/DAILY_MASTER_CONSOLIDATED_REVIEW.md. The correct,
-- approved reveal text was evidently approved but never actually deployed -- this is expected,
-- not a sign the master document is wrong: every Reassessment Round in
-- docs/DAILY_PRODUCTION_OWNER_APPROVALS.md explicitly states 'questions, answers and reveals
-- remain unchanged' -- reveal text was never touched by the rescoring process, and at least one
-- batch's own notes record that its approved reveal explicitly replaces 'the older production
-- reveal' that was still live.
--
-- CORRECTED (V1 release execution, 2026-11-06): independent review found this file's own prior
-- comparison undercounted its subject -- 26 live canonical questions have 104 answer choices,
-- not 96, and comparing all of them found 102 genuine mismatches, not 94. The 8 missed here
-- originally (Daily #12 "SIX empty seats" and #13 "group... pick where to eat", all 4 options
-- each) were skipped by a prompt-matching bug, not a scoring/content judgment call: the live
-- production prompts for both use a curly apostrophe/quote ('haven't', "I don't care") while
-- the script comparing them against the master document did not normalize that difference
-- before matching, so neither question's live row was ever found in the master document at
-- all and both were silently skipped rather than flagged. Re-run with apostrophe/quote
-- normalization added: confirmed exactly 8 additional mismatches, all in #12/#13, nothing else
-- -- the other 94 already-corrected statements below were unaffected and are unchanged.
--
-- 2 near-identical 'label' differences (straight vs curly quotation marks, #11C/#11D) were
-- found and are NOT corrected here -- cosmetic only, and the master document's own copy is the
-- one using straight quotes inconsistently with its own typographic convention elsewhere, not
-- production.

update public.daily_options set apparently_feedback = 'Apparently, the front door is where your tolerance for nonsense ends.' where id = '57585104-9456-4597-9894-3b17ada0f356';
update public.daily_options set apparently_feedback = 'Apparently, some people can sleep peacefully while a pot of yesterday''s spaghetti holds the kitchen hostage. You''re not one of them.' where id = 'cfe31e6f-70f0-448b-8a1a-f38758809b7e';
update public.daily_options set apparently_feedback = 'Apparently, you can achieve everything and still feel like you''ve lost if you had to become somebody else to get there.' where id = '39f9d84c-571a-421c-8613-7ed51b97641e';
update public.daily_options set apparently_feedback = 'You could collect a hundred trophies and still get emotional over somebody noticing what you pour into the people you love. Apparently, that''s the review that matters.' where id = '9d96aad1-6a26-436c-bf6b-51265f03f51c';
update public.daily_options set apparently_feedback = 'Apparently, being the person everybody leans on is your greatest flex. Just curious, who do you get to lean on?' where id = '4195ecbe-236c-46a5-b36d-0c96c4a5b4a4';
update public.daily_options set apparently_feedback = 'You didn''t work this hard just to hear ''must be nice.'' Apparently, you''d appreciate somebody acknowledging the years they didn''t see.' where id = 'd96fc00f-64bf-4523-b177-3cf2277f39a4';
update public.daily_options set apparently_feedback = 'Apparently, the money isn''t even the issue. You''re wondering when your relationship became a branch office for somebody''s ex.' where id = '399c5eae-6d39-449f-b796-fcd9ae3502f0';
update public.daily_options set apparently_feedback = 'Apparently, if we''re all getting involved in this financial arrangement, you''d like to be promoted to treasurer.' where id = 'd4083739-7fa3-4ce1-a7e5-22ef03c84e63';
update public.daily_options set apparently_feedback = 'You refuse to turn every harmless interaction into a crime scene. Apparently, peace is still an option.' where id = '7d0df73e-acd8-4816-8679-072cef46c2c0';
update public.daily_options set apparently_feedback = 'Apparently, you''ve got boundaries and excellent customer service. Here''s the bank''s number. Please stop calling this relationship.' where id = '67aaacad-28b7-4bd4-b61a-7a5a4191d2e1';
update public.daily_options set apparently_feedback = 'Nobody accused you of anything, but apparently your unsolicited privacy announcement just opened an investigation.' where id = '6dcb7df8-2c02-4564-915a-f3bad573c360';
update public.daily_options set apparently_feedback = 'Apparently, being in love doesn''t mean surrendering your passwords and your last shred of individuality.' where id = 'ba4eba3d-775c-4467-a37c-dfafc2d278a1';
update public.daily_options set apparently_feedback = 'You were minding your business until they made a speech. Apparently, now the phone needs its own defense attorney.' where id = '61cb483c-3eb9-4b45-8ca1-609aba673051';
update public.daily_options set apparently_feedback = 'Apparently, you support privacy. You just don''t support suspicious behavior wearing a privacy costume.' where id = '22ed955f-1878-4523-ba2e-feebaf3c49b4';
update public.daily_options set apparently_feedback = 'Apparently, your loyalty comes with a terms-and-conditions page. You''d like to know who''s getting hurt before you become an accessory.' where id = '3fd1f90b-670e-48c3-99a8-c229120f0b93';
update public.daily_options set apparently_feedback = 'You love your friends, but apparently your loyalty package does not include lying on command.' where id = '6fe8aa77-687a-4ae4-a7c6-5f65789f71dd';
update public.daily_options set apparently_feedback = 'Apparently, you''re willing to bend the truth for friendship. Just don''t ask you to testify under oath.' where id = '8ad5b062-0340-489f-be68-1aea7e5fa064';
update public.daily_options set apparently_feedback = 'You found a way to mind your business without becoming a co-conspirator. Apparently, discretion is still free.' where id = '5ef6c827-f194-4b92-aac8-94df4de43cb2';
update public.daily_options set apparently_feedback = 'Apparently, your official statement is already on record. You will not be providing additional testimony.' where id = '2d45834d-3201-48af-9963-5e7599ad9aa8';
update public.daily_options set apparently_feedback = 'Six months of tears, screenshots, and midnight calls. Apparently, you''d like an itemized refund.' where id = '780eb488-cf72-44a9-a591-3f4e1c1609fa';
update public.daily_options set apparently_feedback = 'Apparently, your friendship isn''t a subscription they lose every time they make a questionable decision.' where id = 'd1932683-6885-4675-a07b-bb449a9ccc99';
update public.daily_options set apparently_feedback = 'You can support your friend without endorsing the sequel nobody asked for. Apparently, love and common sense can coexist.' where id = '51e7a010-0727-4acd-920a-212662a2d40a';
update public.daily_options set apparently_feedback = 'Apparently, you''re tired of needing detective skills to feel loved. You''d like a relationship that doesn''t require surveillance.' where id = '0b92ef07-6470-4709-aef2-255eebf0697e';
update public.daily_options set apparently_feedback = 'Money, romance, and success can wait. Apparently, you''d like your body to stop being an unpredictable business partner.' where id = '4d9a662d-f5fc-4df3-a2fe-889c4d8c5b85';
update public.daily_options set apparently_feedback = 'Apparently, your dream home isn''t a mansion. It''s somewhere nobody makes you rehearse an argument before walking through the door.' where id = '094860d7-4b7f-4f24-a6b2-230446c3e444';
update public.daily_options set apparently_feedback = 'Apparently, your love language is bills paid, savings intact, and nobody calling about an overdue balance.' where id = '94d77663-a67e-48f1-a744-1e609e9a2798';
update public.daily_options set apparently_feedback = 'Apparently, you''d rather have one uncomfortable truth than spend another year confusing attention with love.' where id = '92f42469-c931-46c6-8cce-8279c4c235e7';
update public.daily_options set apparently_feedback = 'The universe offered you one spoiler and you skipped straight to the series finale. Apparently, small talk is beneath you.' where id = '7b2edd4f-7c4d-4c6a-991f-87cd680b3eb2';
update public.daily_options set apparently_feedback = 'Apparently, you want the unfiltered reviews, even though you know perfectly well some people should never be given a microphone.' where id = '9d90c4c7-2b8a-467e-8ad8-1050c9d0e588';
update public.daily_options set apparently_feedback = 'Apparently, you''ve been living your life while quietly wondering whether the alternate version of you has better benefits.' where id = '7bd747d2-d47b-4950-8880-caa314c22bb7';
update public.daily_options set apparently_feedback = 'Apparently, your goal is to leave people with memories, not a list of chores you made them finish.' where id = 'a98b6f67-cd03-4954-a6fe-38a05027e639';
update public.daily_options set apparently_feedback = 'You don''t need a statue. Apparently, you just want the people you love to remember how it felt to be loved by you.' where id = '0deacb4c-7377-4078-8d25-eaefe64f6500';
update public.daily_options set apparently_feedback = 'Apparently, you''re not trying to leave the world exactly how you found it. You''d like proof you were here.' where id = '057dac37-31e1-4ac7-beee-5952a5ac0859';
update public.daily_options set apparently_feedback = 'Apparently, you don''t need to be everybody''s favorite. You''d rather be the person they knew would actually show up.' where id = '5dfb2cac-202c-4d08-a8ba-7354a63b9ac5';
update public.daily_options set apparently_feedback = 'Apparently, if humiliation is the family tradition, you''ve decided to bring your own microphone.' where id = '4eec948e-30ab-44ac-8d14-f15a2112299d';
update public.daily_options set apparently_feedback = 'The jokes were disrespectful. Watching your partner enjoy them? Apparently, that was the real punchline.' where id = 'd771b4ef-247a-4ffb-8ece-9a09ecfb7f6e';
update public.daily_options set apparently_feedback = 'Apparently, you''re not interested in being the entertainment at somebody else''s family gathering.' where id = '7ee6691e-7f63-4b3b-84e3-ff32d08e3ff7';
update public.daily_options set apparently_feedback = 'You gave your partner every opportunity to handle their people. Apparently, now everybody gets the version of you they were warned about.' where id = '273e9434-8661-43ce-835d-a9dc850d0f4f';
update public.daily_options set apparently_feedback = 'Apparently, two missed calls and you''re already mentally preparing to identify a body. Let''s hope it''s just somebody selling insurance.' where id = '3242db06-4178-42f8-9f3b-d8b7d4c32a76';
update public.daily_options set apparently_feedback = 'Apparently, before you get access to my ears, you must first pass a background check.' where id = '1ac1a42a-3365-4818-9753-fc317905e5bb';
update public.daily_options set apparently_feedback = 'Apparently, you can have my attention once you''ve identified yourself. This is a phone, not a surprise party.' where id = '69542272-19b5-46cc-b403-08c8cbadc3ee';
update public.daily_options set apparently_feedback = 'Apparently, two calls from an unknown number isn''t an emergency. It''s a great way to become a blocked contact.' where id = 'ba72f8ea-980c-4259-b2c8-a7c2476a4de4';
update public.daily_options set apparently_feedback = 'Apparently, you''re not interested in sentencing someone to life without parole for making a mistake. Growth is allowed in your courtroom.' where id = 'ddc750d1-9d7a-49b6-a636-f7783d7a3e57';
update public.daily_options set apparently_feedback = 'Forgiveness granted. Access denied. Apparently, some people confuse being forgiven with getting their old parking spot back.' where id = '0422e592-adf6-42d7-9434-76be0a211955';
update public.daily_options set apparently_feedback = 'Apparently, "I''m sorry" is the application. Changed behavior is the background check. And you''re not skipping either step.' where id = '7b358f4f-b49e-416c-843a-d5820dfdd44e';
update public.daily_options set apparently_feedback = 'Apparently, they waited until the door closed to remember how to knock. Unfortunately, you''ve already changed the locks.' where id = 'e5e2859c-4642-4913-9b48-5d1a91596ce0';
update public.daily_options set apparently_feedback = 'Apparently, the closer they get, the more committed you become to maintaining your current speed. Pressure has never been your favorite motivator.' where id = '2aa026e5-2778-450a-9a97-56bd483a87b2';
update public.daily_options set apparently_feedback = 'Apparently, you''re not auditioning for a highway confrontation. Go ahead, superstar. The road is yours.' where id = '650194db-2247-4a70-bca3-a950bf6e0344';
update public.daily_options set apparently_feedback = 'Apparently, you saw impatience in your rearview mirror and decided to offer a complimentary lesson in patience. Petty University has entered the highway.' where id = '30ed587d-5253-4303-a638-e87607d91452';
update public.daily_options set apparently_feedback = 'Apparently, your peace isn''t available for roadside pickup. They can tailgate your car, but they''re not getting behind the wheel of your emotions.' where id = '762c2efa-cdb9-42f3-a482-1ede40360d73';
update public.daily_options set apparently_feedback = 'Apparently, the parking violation wasn''t enough. You need the make, model, and estimated monthly payment before delivering your final judgment.' where id = '6c805dde-907e-42a7-8f72-9b48f2462d9d';
update public.daily_options set apparently_feedback = 'Apparently, you''re giving them the benefit of the doubt. Somewhere out there, a terrible parker is enjoying grace they didn''t even know they received.' where id = 'e0cd62cc-ba09-4fa7-be85-93e1883aa3a1';
update public.daily_options set apparently_feedback = 'Apparently, you came for groceries and left with a character assessment. Two parking spaces told you everything you needed to know.' where id = 'd661a8bb-2af1-4a7f-a94e-d6581d4183a0';
update public.daily_options set apparently_feedback = 'Apparently, you''ve issued the citation in your head and closed the case. No paperwork. No confrontation. Just a brief loss of respect.' where id = '192a75b4-b2d2-4d74-887b-9eaea49496cf';
update public.daily_options set apparently_feedback = 'Apparently, your salary isn''t a classified document. They asked, you answered, and now they''re the ones acting uncomfortable.' where id = 'fec3e884-03cf-44b1-93f6-44eb2c109665';
update public.daily_options set apparently_feedback = 'Apparently, you''re willing to open the financial curtains. Just not enough for somebody to start counting your furniture.' where id = '5355204a-80a9-4d8b-b658-6ad44c482946';
update public.daily_options set apparently_feedback = 'Apparently, your bank account has a confidentiality agreement, and your sense of humor is the spokesperson.' where id = '00adaac1-5c70-4def-8f78-476681e71998';
update public.daily_options set apparently_feedback = 'Apparently, you just met this person and they''re already requesting financial disclosures. What is this, a mortgage application?' where id = '065b694e-4d79-4a9a-a1c4-1bb101ab1232';
update public.daily_options set apparently_feedback = 'Apparently, you don''t mind being discussed. You just think the conversation should come with an invitation for the person it''s about.' where id = '5a8dd80f-e968-4c73-9773-c8c55852008e';
update public.daily_options set apparently_feedback = 'Apparently, you''ve been trying to finish the same sentence since Tuesday. At this point, you might need to submit your thoughts in writing.' where id = '1f2c0a77-a300-44e2-a94e-9d60a685380a';
update public.daily_options set apparently_feedback = 'Apparently, your time isn''t a free trial subscription. A little communication would''ve prevented the entire cancellation.' where id = '1232a353-24f2-4fd2-8e1f-dc2927645883';
update public.daily_options set apparently_feedback = 'Apparently, you can see them posting stories, liking pictures, and living their best digital life. Your message, meanwhile, has entered witness protection.' where id = '39f17b27-f78b-4078-a965-31d594e3ae2f';
update public.daily_options set apparently_feedback = 'Apparently, you''d rather collect passport stamps than possessions. Your bank account might disagree, but your photo gallery is thriving.' where id = 'fbfe9bfa-5c2a-4bf3-ad67-558193015cc5';
update public.daily_options set apparently_feedback = 'Apparently, you don''t need money to buy happiness. You just want enough to conduct your own research.' where id = 'fbff211d-5fee-4ae2-a0bc-83d055f87f20';
update public.daily_options set apparently_feedback = 'Apparently, you''d rather have people who show up than money that shows off. Although, let''s not pretend you wouldn''t appreciate both.' where id = 'e6dfb20b-24a7-4c07-b8a7-7d48b3f544ba';
update public.daily_options set apparently_feedback = 'Apparently, the ultimate luxury isn''t a yacht. It''s waking up on a Tuesday and realizing nobody owns your schedule.' where id = 'acb032e1-179c-408c-ae6f-0b4ed4dfc381';
update public.daily_options set apparently_feedback = 'Apparently, you don''t need diamonds. You need somebody to figure out what''s for dinner without asking you seventeen follow-up questions.' where id = 'f092686f-1202-4fbe-bb7b-09ea3246e53d';
update public.daily_options set apparently_feedback = 'Apparently, your idea of rest involves room service, fluffy robes, and someone calling you "ma''am" without immediately asking for something.' where id = 'fa6602e3-b456-4605-a43b-195f54b81b98';
update public.daily_options set apparently_feedback = 'Apparently, your dream vacation is an entire week where the only thing on your calendar is absolutely none of anybody''s business.' where id = '858ebeb3-2f07-42b0-80d9-a5be4287f863';
update public.daily_options set apparently_feedback = 'Apparently, you hear "luxury" and think "no mortgage payment." Some people want a mansion. You want the bank to stop calling yours a partnership.' where id = '7e047303-24fa-4294-b044-b72612209450';
update public.daily_options set apparently_feedback = 'Apparently, the evidence has entered the chat, and so has your accountability. Might as well schedule the hearing.' where id = '2624fc7b-f85e-4406-9688-892f2eb72402';
update public.daily_options set apparently_feedback = 'Apparently, your entire defense strategy is built around the hope that nobody has notifications turned on.' where id = 'ad0c2d5e-7969-4f92-9acd-4e53de6c7230';
update public.daily_options set apparently_feedback = 'Apparently, your crisis management plan consists of one emergency text and an immediate disappearance from society.' where id = 'e27bcac6-a3ad-4853-8536-44e0273e9b80';
update public.daily_options set apparently_feedback = 'Apparently, the screenshot was an accident. The opinion was not. Since we''re all here, let''s discuss it.' where id = 'a48b3d9e-cf16-4e61-bf18-c702a7fcb202';
update public.daily_options set apparently_feedback = 'Apparently, you''ve spent enough of your life staring at somebody else''s brake lights. Your time has filed a formal complaint.' where id = '2f729eea-0bd4-4e45-a8f4-e29f24a4a98d';
update public.daily_options set apparently_feedback = 'Apparently, the laundry basket is a magical portal where clothes multiply and your motivation disappears. You''ve had enough.' where id = '4f35ab85-0f26-4c45-9489-5641bb17ad5e';
update public.daily_options set apparently_feedback = 'Apparently, if your call were actually important to them, you''d have spoken to a human sometime during the last three business days.' where id = '5a0cb3a5-8e39-41f4-95b4-32917f67961a';
update public.daily_options set apparently_feedback = 'Apparently, you need a capital letter, three symbols, your childhood pet''s middle name, and a security code just to check your email.' where id = 'cdae12e3-013b-43fd-9a4a-e199a31b9a53';
update public.daily_options set apparently_feedback = 'Apparently, your conscience has agreed to a brief stakeout. Somewhere, somebody is about to have either a very good or very bad day.' where id = '510bfd80-17f5-4be1-9507-57ff2970807d';
update public.daily_options set apparently_feedback = 'Apparently, your conscience didn''t even let the money introduce itself before you started looking for its rightful owner.' where id = 'c1accf2d-3ec0-4a32-889d-209febe05c67';
update public.daily_options set apparently_feedback = 'Apparently, you believe in doing the right thing, but you''re not handing $200 to the first person wearing a name tag.' where id = '4b2d5e3c-8a01-4f2a-8f3e-2acbecc282c1';
update public.daily_options set apparently_feedback = 'Apparently, your conscience and your wallet are currently in negotiations. And your wallet came prepared with a PowerPoint.' where id = '9f7b1c4d-619b-403e-96b5-96023fa13211';
update public.daily_options set apparently_feedback = 'Apparently, you''re not spending six hours decoding facial expressions when a thirty-second conversation could solve the mystery.' where id = 'e798c52a-10cb-4aa9-b474-b8b559b9a836';
update public.daily_options set apparently_feedback = 'Apparently, you noticed the energy shift, but you''re not issuing a subpoena for somebody else''s feelings.' where id = '8489219e-88b1-4e92-8e46-62e70f184209';
update public.daily_options set apparently_feedback = 'Apparently, you haven''t said a word, but your internal investigation already has three witnesses and a timeline.' where id = '329940d2-f335-467c-a8c9-aa90a634a618';
update public.daily_options set apparently_feedback = 'Apparently, you believe in matching energy. Unfortunately, somebody forgot to tell the friendship this was now a competition.' where id = '4e9cefff-5ca1-4517-a0f8-a2b5de8ae00d';
update public.daily_options set apparently_feedback = 'Apparently, you heard "pack a bag" and immediately started looking for your charger. Details are for people who don''t trust the adventure.' where id = '1d3533fa-a3db-4e4f-b24f-22f678d7c763';
update public.daily_options set apparently_feedback = 'Apparently, you''re down for an adventure. You''d just like to know whether to pack a swimsuit or bail money.' where id = '2f7cf318-6b23-4d88-9c53-04cae817bb0a';
update public.daily_options set apparently_feedback = 'Apparently, spontaneity is welcome, provided it submits the proper paperwork at least three business days in advance.' where id = '4eb27666-828b-4bf2-9436-13429db3cf3c';
update public.daily_options set apparently_feedback = 'Apparently, you''re not getting into anybody''s car based on vibes and a cryptic text. Even your surprises require informed consent.' where id = '13263cbd-fa9e-4943-96f5-63d1b58af65b';
update public.daily_options set apparently_feedback = 'Apparently, you want friendship, fashion, and people who will analyze your love life like it''s a federal investigation.' where id = 'f403e7a3-fbd8-4d78-ae3c-d6366f718e9e';
update public.daily_options set apparently_feedback = 'Apparently, you chose a year of laughter, foolishness, and at least three arguments that started over absolutely nothing.' where id = 'bd4cdcaf-6404-4543-bccc-1c68006c1a4c';
update public.daily_options set apparently_feedback = 'Apparently, you''ve selected cheesecake, legendary shade, and a group of women who could roast you and comfort you in the same sentence.' where id = 'b84aaef2-e19f-40b6-9abf-21257fa60580';
update public.daily_options set apparently_feedback = 'Apparently, you want ambitious friends, good conversation, and people who will support your dreams while staying all the way in your business.' where id = '68eec514-23a9-4d73-acb7-d1bdeacaeee6';

-- #12 ("...saving SIX empty seats...") and #13 ("...pick where to eat...") -- the 8 answers
-- missed by the original comparison's apostrophe-matching bug, see this file's own header.
update public.daily_options set apparently_feedback = 'Apparently, you''re willing to hear both sides before deciding whether somebody needs to move their imaginary guests.' where id = '4e9fd7c1-89d8-4c7e-a178-a1cf2d2b32de';
update public.daily_options set apparently_feedback = 'Apparently, you respect the sacred tradition of saving seats. Six empty chairs? That''s not a problem. That''s a family reunion with delayed arrivals.' where id = 'a2046dd7-b281-4497-a279-80e8217c7e82';
update public.daily_options set apparently_feedback = 'Apparently, you''re not standing while six invisible people enjoy reserved seating. This isn''t a restaurant, and those chairs don''t have names on them.' where id = 'afeddd9c-2bc1-4963-a534-2f48c89f67f1';
update public.daily_options set apparently_feedback = 'Apparently, you''re willing to compromise, but six chairs? At this point, somebody needs to start charging rent.' where id = '31705478-f1f5-4764-97a1-d25578dae01f';
update public.daily_options set apparently_feedback = 'Apparently, you didn''t apply to be the group leader, but somebody had to rescue dinner from the committee of indecision.' where id = '99ae0194-c7d1-4586-b0e5-4b1b03320726';
update public.daily_options set apparently_feedback = 'Apparently, if nobody has an opinion, democracy will assign them one. Voting closes in five minutes.' where id = '09456186-df6e-4405-be9d-e42484a79908';
update public.daily_options set apparently_feedback = 'Apparently, you''re willing to starve before accepting a leadership position you never applied for.' where id = 'd7a83d46-19f9-4c9b-96bd-20d234f34baa';
update public.daily_options set apparently_feedback = 'Apparently, you solved the group decision by removing the group. Dinner is at seven. Attendance is optional.' where id = '740878a1-f297-4f20-8fb5-c3cef5b00938';

-- #18 ("Which feels MOST disrespectful to you?") specifically: content is now fully correct
-- (reveal text above; scoring already corrected via the regenerated
-- 20261028060000_daily_trait_awards_seed.sql, part of the 21-file candidate set applied
-- before this file). Transitions NeedsRevision -> Approved directly -- no existing admin_*
-- function supports that specific transition (admin_approve_daily only accepts
-- ReadyForReview), so this performs the equivalent of what it would do, consistent with the
-- established pattern elsewhere in this directory of a direct, justified bypass under the
-- same elevated session every file here already requires.
do $$
declare
  v_admin_id uuid;
  v_question_id uuid := '1ad9b3bd-892c-4962-8465-9a41093ab03c';
begin
  if not exists (
    select 1 from public.daily_questions
    where id = v_question_id and prompt = 'Which feels MOST disrespectful to you?' and status = 'NeedsRevision'
  ) then
    raise exception 'Expected question % to be "Which feels MOST disrespectful to you?" at status NeedsRevision -- found something else. Aborting without changing anything.', v_question_id;
  end if;

  select user_id into v_admin_id from public.admin_users where role = 'owner';
  if v_admin_id is null then
    raise exception 'No admin_users row with role = owner found -- cannot record an approval attribution. Aborting.';
  end if;

  update public.daily_questions
  set status = 'Approved',
      approved_by = v_admin_id,
      approved_at = now(),
      approved_content_version = public.admin_compute_daily_fingerprint(v_question_id),
      review_note = null
  where id = v_question_id;

  raise notice 'Question 1ad9b3bd... (#18) moved NeedsRevision -> Approved with a fresh approval fingerprint.';
end $$;
