-- ============================================================================================
-- STAGED, NOT APPLIED. Requires explicit owner authorization before `supabase db push`.
--
-- Build 22 owner audit (2026-10-30), item 6: expire_stale_active_evidence() (20261030010000)
-- runs this query against user_trait_evidence once a day, scanning ALL users:
--
--   select distinct user_id from public.user_trait_evidence
--   where created_at >= v_watermark and created_at < v_cutoff
--
-- user_trait_evidence had exactly two indexes before this migration -- (user_id) and
-- (user_id, trait_id) -- both useless for a query whose WHERE clause has no user_id
-- predicate at all. Without a leading created_at index, Postgres has no option but a full
-- sequential scan of the entire table on every daily run, regardless of how few rows actually
-- crossed the boundary since the last watermark.
--
-- (created_at, user_id) rather than created_at alone: this exact query only ever needs
-- created_at (for the range filter) and user_id (for the DISTINCT list) -- a composite index
-- lets Postgres satisfy it as an index-only scan when the visibility map allows, never
-- touching the heap at all, rather than a range scan that still has to fetch every matching
-- row's user_id from the table.
-- ============================================================================================

create index user_trait_evidence_created_at_user_id_idx
  on public.user_trait_evidence (created_at, user_id);

comment on index public.user_trait_evidence_created_at_user_id_idx is
  'Leading created_at index (composite with user_id) for expire_stale_active_evidence()''s watermark range scan -- the one real query against this table with no user_id predicate at all. See this migration''s header for why (created_at, user_id) rather than created_at alone.';
