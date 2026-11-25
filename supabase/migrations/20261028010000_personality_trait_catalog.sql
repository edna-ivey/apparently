-- ============================================================================================
-- STAGED, NOT APPLIED. Requires explicit owner authorization before `supabase db push`.
--
-- Numeric personality trait catalog -- Build 22 data-integrity correction. Replaces the never-
-- applied string-keyed design in 20261018010000_personality_scoring_v2_schema.sql (superseded,
-- see that file's own now-added header note) with numeric dimension_id/trait_id, matching the
-- locked architecture decision: no 'forgiving_receipts:positive'-style strings in any scoring
-- or evidence table. dimension_key/trait_key below are retained ONLY as a human-readable,
-- UNIQUE audit/debug column -- never read by any scoring query, which always joins on the
-- numeric id.
--
-- Generated mechanically by scripts/generate-trait-catalog-sql.ts -- do not hand-edit;
-- regenerate if a dimension is ever added. dimension_id is resolved through a PERSISTED
-- LEDGER (scripts/lib/dimension-id-ledger.json), never from src/data/personality.ts's
-- PERSONALITY_DIMENSIONS array position -- an existing dimension keeps its id forever
-- regardless of reordering, insertion, or any other edit to that array; only a genuinely new
-- dimension_key ever receives a new id. trait_id = dimension_id*2-1 (positive pole) /
-- dimension_id*2 (negative pole), frozen for free once dimension_id is.
-- ============================================================================================

create table public.personality_dimensions (
  dimension_id smallint primary key,
  dimension_key text not null unique,
  name text not null,
  type text not null check (type in ('core', 'private'))
);

comment on table public.personality_dimensions is
  'Numeric dimension catalog -- 32 rows, ids 1-32, stable per scripts/generate-trait-catalog-sql.ts. dimension_key is a human-readable audit column only, matching src/data/personality.ts PersonalityDimensionId strings -- scoring/evidence tables join on dimension_id, never dimension_key.';

create table public.personality_traits (
  trait_id smallint primary key,
  dimension_id smallint not null references public.personality_dimensions (dimension_id),
  polarity text not null check (polarity in ('positive', 'negative')),
  trait_key text not null unique,
  label text not null,
  unique (dimension_id, polarity)
);

comment on table public.personality_traits is
  'Numeric trait (= one pole of one dimension) catalog -- 64 rows, ids 1-64. Every persisted scoring/evidence row (quiz_choice_trait_awards, user_trait_evidence, user_trait_totals, creature_published_recipes) references trait_id, never a string. trait_key is a human-readable audit column only (matches the old "dimension:polarity" string format for cross-reference during this migration, e.g. verifying against the pre-numeric data), never joined on by scoring logic.';

insert into public.personality_dimensions (dimension_id, dimension_key, name, type) values
  (1, 'planner_spontaneous', 'Planner ↔ Spontaneous', 'core'),
  (2, 'emotional_intensity', 'Emotional Intensity ↔ Even-Keeled', 'core'),
  (3, 'direct_indirect', 'Direct ↔ Indirect', 'core'),
  (4, 'social_attunement', 'Social Radar ↔ Face Value', 'core'),
  (5, 'protective_hands_off', 'Protective ↔ Hands-Off', 'core'),
  (6, 'adventure_comfort', 'Adventurous ↔ Comfort-Seeking', 'core'),
  (7, 'independent_collaborative', 'Independent ↔ Collaborative', 'core'),
  (8, 'control_allowing', 'Control ↔ Let It Play Out', 'core'),
  (9, 'practical_idealistic', 'Practical ↔ Idealistic', 'core'),
  (10, 'sentimental_thick_skinned', 'Sentimental ↔ Thick-Skinned', 'core'),
  (11, 'rules_bending', 'Rule-Oriented ↔ Rule-Bending', 'core'),
  (12, 'conflict_peacekeeping', 'Conflict-Forward ↔ Peacekeeping', 'core'),
  (13, 'trust_verify', 'Trusting ↔ Skeptical', 'core'),
  (14, 'forgiving_receipts', 'Forgiving ↔ Holds the Receipt', 'core'),
  (15, 'playful_serious', 'Playful ↔ Serious', 'core'),
  (16, 'competitive_cooperative', 'Competitive ↔ Cooperative', 'core'),
  (17, 'curious_decisive', 'Curious ↔ Decisive', 'core'),
  (18, 'private_open', 'Private ↔ Open', 'core'),
  (19, 'patient_urgent', 'Patient ↔ Urgent', 'core'),
  (20, 'ambitious_content', 'Ambitious ↔ Content', 'core'),
  (21, 'accountability_defensiveness', 'Accountability ↔ Defensiveness', 'private'),
  (22, 'reflective_reactive', 'Reflective ↔ Reactive', 'private'),
  (23, 'self_secure_reassurance', 'Self-Secure ↔ Reassurance-Seeking', 'private'),
  (24, 'boundary_holding_approval_seeking', 'Boundary-Holding ↔ Approval-Seeking', 'private'),
  (25, 'vulnerable_armored', 'Vulnerable ↔ Armored', 'private'),
  (26, 'repair_punishing', 'Repair-Oriented ↔ Punishing', 'private'),
  (27, 'tactful_blunt', 'Tactful ↔ Blunt', 'private'),
  (28, 'duty_first_self_preserving', 'Duty-First ↔ Self-Preserving', 'private'),
  (29, 'supportive_challenging', 'Supportive ↔ Challenging', 'private'),
  (30, 'gives_freely_keeps_score', 'Gives Freely ↔ Keeps Score', 'private'),
  (31, 'perspective_taking_self_referencing', 'Perspective-Taking ↔ Self-Referencing', 'private'),
  (32, 'initiating_responsive', 'Initiating ↔ Responsive', 'private');

insert into public.personality_traits (trait_id, dimension_id, polarity, trait_key, label) values
  (1, 1, 'positive', 'planner_spontaneous:positive', 'Planner'),
  (2, 1, 'negative', 'planner_spontaneous:negative', 'Spontaneous'),
  (3, 2, 'positive', 'emotional_intensity:positive', 'Emotionally Intense'),
  (4, 2, 'negative', 'emotional_intensity:negative', 'Even-Keeled'),
  (5, 3, 'positive', 'direct_indirect:positive', 'Direct'),
  (6, 3, 'negative', 'direct_indirect:negative', 'Indirect'),
  (7, 4, 'positive', 'social_attunement:positive', 'Vibe checker'),
  (8, 4, 'negative', 'social_attunement:negative', 'Face value'),
  (9, 5, 'positive', 'protective_hands_off:positive', 'Protective'),
  (10, 5, 'negative', 'protective_hands_off:negative', 'Hands-off'),
  (11, 6, 'positive', 'adventure_comfort:positive', 'Adventurous'),
  (12, 6, 'negative', 'adventure_comfort:negative', 'Comfort-seeking'),
  (13, 7, 'positive', 'independent_collaborative:positive', 'Independent'),
  (14, 7, 'negative', 'independent_collaborative:negative', 'Collaborative'),
  (15, 8, 'positive', 'control_allowing:positive', 'Control'),
  (16, 8, 'negative', 'control_allowing:negative', 'Let it play out'),
  (17, 9, 'positive', 'practical_idealistic:positive', 'Practical'),
  (18, 9, 'negative', 'practical_idealistic:negative', 'Idealistic'),
  (19, 10, 'positive', 'sentimental_thick_skinned:positive', 'Sentimental'),
  (20, 10, 'negative', 'sentimental_thick_skinned:negative', 'Thick-skinned'),
  (21, 11, 'positive', 'rules_bending:positive', 'Rule-oriented'),
  (22, 11, 'negative', 'rules_bending:negative', 'Rule-bending'),
  (23, 12, 'positive', 'conflict_peacekeeping:positive', 'Conflict-forward'),
  (24, 12, 'negative', 'conflict_peacekeeping:negative', 'Peacekeeping'),
  (25, 13, 'positive', 'trust_verify:positive', 'Trust first'),
  (26, 13, 'negative', 'trust_verify:negative', 'Verify first'),
  (27, 14, 'positive', 'forgiving_receipts:positive', 'Forgiving'),
  (28, 14, 'negative', 'forgiving_receipts:negative', 'Holds the Receipt'),
  (29, 15, 'positive', 'playful_serious:positive', 'Playful'),
  (30, 15, 'negative', 'playful_serious:negative', 'Serious'),
  (31, 16, 'positive', 'competitive_cooperative:positive', 'Competitive'),
  (32, 16, 'negative', 'competitive_cooperative:negative', 'Cooperative'),
  (33, 17, 'positive', 'curious_decisive:positive', 'Curious'),
  (34, 17, 'negative', 'curious_decisive:negative', 'Decisive'),
  (35, 18, 'positive', 'private_open:positive', 'Private'),
  (36, 18, 'negative', 'private_open:negative', 'Open'),
  (37, 19, 'positive', 'patient_urgent:positive', 'Patient'),
  (38, 19, 'negative', 'patient_urgent:negative', 'Urgent'),
  (39, 20, 'positive', 'ambitious_content:positive', 'Ambitious'),
  (40, 20, 'negative', 'ambitious_content:negative', 'Content'),
  (41, 21, 'positive', 'accountability_defensiveness:positive', 'Accountability'),
  (42, 21, 'negative', 'accountability_defensiveness:negative', 'Defensiveness'),
  (43, 22, 'positive', 'reflective_reactive:positive', 'Reflective'),
  (44, 22, 'negative', 'reflective_reactive:negative', 'Reactive'),
  (45, 23, 'positive', 'self_secure_reassurance:positive', 'Self-secure'),
  (46, 23, 'negative', 'self_secure_reassurance:negative', 'Reassurance-seeking'),
  (47, 24, 'positive', 'boundary_holding_approval_seeking:positive', 'Boundary-holding'),
  (48, 24, 'negative', 'boundary_holding_approval_seeking:negative', 'Approval-seeking'),
  (49, 25, 'positive', 'vulnerable_armored:positive', 'Vulnerable'),
  (50, 25, 'negative', 'vulnerable_armored:negative', 'Armored'),
  (51, 26, 'positive', 'repair_punishing:positive', 'Repair-oriented'),
  (52, 26, 'negative', 'repair_punishing:negative', 'Punishing'),
  (53, 27, 'positive', 'tactful_blunt:positive', 'Tactful'),
  (54, 27, 'negative', 'tactful_blunt:negative', 'Blunt'),
  (55, 28, 'positive', 'duty_first_self_preserving:positive', 'Duty-first'),
  (56, 28, 'negative', 'duty_first_self_preserving:negative', 'Self-preserving'),
  (57, 29, 'positive', 'supportive_challenging:positive', 'Supportive'),
  (58, 29, 'negative', 'supportive_challenging:negative', 'Challenging'),
  (59, 30, 'positive', 'gives_freely_keeps_score:positive', 'Gives freely'),
  (60, 30, 'negative', 'gives_freely_keeps_score:negative', 'Keeps score'),
  (61, 31, 'positive', 'perspective_taking_self_referencing:positive', 'Perspective-taking'),
  (62, 31, 'negative', 'perspective_taking_self_referencing:negative', 'Self-referencing'),
  (63, 32, 'positive', 'initiating_responsive:positive', 'Initiating'),
  (64, 32, 'negative', 'initiating_responsive:negative', 'Responsive');

-- RLS: content, not user data -- readable by every authenticated client, writable only by a
-- reviewed migration (same trust model as quiz_choice_pole_awards/daily_options content).
alter table public.personality_dimensions enable row level security;
alter table public.personality_traits enable row level security;

create policy "personality_dimensions_select_all" on public.personality_dimensions for select to authenticated using (true);
create policy "personality_traits_select_all" on public.personality_traits for select to authenticated using (true);
