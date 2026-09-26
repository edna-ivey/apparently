// Hand-written application/domain types describing the shape of rows this app's services
// read and write in Supabase (see supabase/migrations/20260913120000_initial_apparently_schema.sql
// for the actual schema these mirror). These are NOT Supabase-generated database types — do
// not treat this file as authoritative over the real schema, and do not rename it to imply
// it was generated.
//
// Once a real Supabase project exists with this migration applied, generate the official,
// exactly-accurate types with the Supabase CLI:
//
//   npx supabase login
//   npx supabase link --project-ref <your-project-ref>
//   npx supabase gen types typescript --project-id <your-project-ref> --schema public \
//     > src/services/database.generated.ts
//
// and prefer importing column-sensitive shapes from that generated file once it exists,
// rather than these hand-written ones.

export type DailyStatusRemote =
  | 'Idea'
  | 'Draft'
  | 'ReadyForReview'
  | 'Approved'
  | 'Scheduled'
  | 'Live'
  | 'Archived'
  | 'NeedsRevision'
  | 'Rejected';

export type PersonalityEffectRemote = {
  dimension: string;
  value: -2 | -1 | 1 | 2;
};

export type ProfileRow = {
  user_id: string;
  preferred_name: string | null;
  age_range: string | null;
  gender: string | null;
  self_perception: Record<string, unknown> | null;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DailyRoom = 'public' | 'private';
export type DailyContentMode = 'profile' | 'room_only';

export type DailyQuestionRow = {
  id: string;
  prompt: string;
  category: string;
  status: DailyStatusRemote;
  sort_order: number;
  scheduled_for: string | null;
  published_for: string | null;
  approved_by: string | null;
  approved_at: string | null;
  approved_content_version: string | null;
  review_note: string | null;
  room: DailyRoom;
  daily_mode: DailyContentMode;
  is_free_private_unlock: boolean;
  created_at: string;
  updated_at: string;
};

export type DailyOptionRow = {
  id: string;
  question_id: string;
  position: number;
  label: string;
  personality_effects: PersonalityEffectRemote[];
  apparently_feedback: string | null;
  created_at: string;
  updated_at: string;
};

export type DailyAnswerRow = {
  id: string;
  user_id: string;
  question_id: string;
  option_id: string;
  created_at: string;
};

export type QuizResultRow = {
  id: string;
  user_id: string;
  quiz_id: string;
  completed_at: string;
  question_count: number | null;
  score: number;
  percent: number;
  result_id: string;
  result_title: string;
  traits: string[];
  mix: Record<string, number> | null;
  created_at: string;
};

// Canonical definition now lives in personality.ts (Build 8 Pass 3.1), alongside
// PersonalityAnswerEvidence/DimensionEvidence, which also carry it -- re-exported here so
// existing importers of this file are unaffected.
export type { PersonalityEvidenceSourceType } from '@/data/personality';
import type { PersonalityEvidenceSourceType } from '@/data/personality';

export type PersonalityEvidenceRow = {
  id: string;
  user_id: string;
  source_type: PersonalityEvidenceSourceType;
  source_id: string;
  question_snapshot: string;
  answer_snapshot: string;
  category: string;
  dimension: string;
  effect: -2 | -1 | 1 | 2;
  created_at: string;
};

// One row per daily_options row for the requested question — always all four, even at
// answer_count 0. Returned by the get_daily_distribution(p_question_id) RPC; never derived
// from raw per-user answer rows on the client.
export type DailyDistributionRow = {
  option_id: string;
  answer_count: number;
  percent: number;
  total_answers: number;
};

// Single-row shape returned by the get_private_daily(p_tester_access) RPC. `options` is null
// whenever access_level='locked' — the server never sends usable choice data for a locked,
// non-unlocked caller, so there is nothing for the client to accidentally leak by rendering
// eagerly.
export type PrivateDailyAccessLevel = 'locked' | 'unlocked';

export type PrivateDailyOption = {
  id: string;
  position: number;
  label: string;
  personalityEffects: PersonalityEffectRemote[];
  apparentlyFeedback: string | null;
};

export type PrivateDailyRow = {
  question_id: string;
  prompt: string;
  category: string;
  daily_mode: DailyContentMode;
  is_free_private_unlock: boolean;
  published_for: string | null;
  access_level: PrivateDailyAccessLevel;
  options: PrivateDailyOption[] | null;
};

// Returned by the create_quiz_share(p_quiz_id, p_sharer_display_name) RPC.
export type CreateQuizShareRow = {
  share_id: string;
};

// Returned by the get_shared_quiz_result(p_share_id) RPC — deliberately never includes the
// sharer's user id or any column beyond what a shared-result landing needs.
export type SharedQuizResultRow = {
  quiz_id: string;
  result_id: string;
  sharer_display_name: string | null;
  created_at: string;
};
