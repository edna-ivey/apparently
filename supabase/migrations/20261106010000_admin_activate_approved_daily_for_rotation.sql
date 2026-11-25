-- V1 release execution (2026-11-06), item 1: a controlled, auditable path for owner-approved
-- canonical Dailies that have NEVER been shown to a real user to become eligible for
-- advance_daily_rotation()'s own candidate pool.
--
-- THE GAP, confirmed by reading advance_daily_rotation's real candidate query (20261028050000):
-- `where room = p_room and recurrence_source_id is null and status in ('Live', 'Archived')`.
-- A canonical question approved via admin_approve_daily sits at status = 'Approved' until it is
-- actually published once (admin_publish_daily: 'Approved'/'Scheduled' -> 'Live'); only once a
-- LATER rotation cycle archives whatever was Live does that canonical row ever reach 'Archived'
-- and become eligible to recycle. A freshly-approved batch of content (here, 37 canonical
-- questions: 34 public + 3 private) that was never individually walked through a real live
-- cycle is therefore invisible to the rotation function forever, with no existing admin_*
-- function to fix that directly -- confirmed: admin_reject_daily only accepts
-- ('Draft','ReadyForReview'); admin_archive_live_daily only accepts a currently-Live row.
--
-- THE FIX is not a blind status flip. This function requires exactly the same two guarantees
-- admin_publish_daily already enforces before it will ever touch a Live row -- approval was
-- actually recorded (approved_content_version is not null) and the content has not silently
-- changed since that approval (a freshly recomputed admin_compute_daily_fingerprint() must
-- still match it) -- so this can never activate content that was edited after approval, or
-- that was never approved at all. It differs from admin_publish_daily in exactly one way,
-- deliberately: it sets status = 'Archived', never 'Live', and never touches published_for
-- (left null -- honest, since the question has genuinely never been shown to a real user).
-- That means it can NEVER violate the one-Live-per-room constraint (it creates or modifies no
-- Live row, so there is nothing to archive-out-from-under another room) and leaves publication
-- history uncorrupted (no fabricated "this was Live on date X" ever gets recorded). The row
-- becomes a legitimate advance_daily_rotation candidate the same way an already-shown,
-- naturally-archived question is -- the FIRST real user to see it still sees genuinely
-- approved, fingerprint-verified content; this function only ever moves the row one step
-- closer to that, never around it.
create or replace function public.admin_activate_approved_daily_for_rotation(p_question_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  target record;
  computed_fingerprint text;
begin
  if not public.is_owner() then
    raise exception 'Not authorized. Activating a Daily for rotation is owner-only.';
  end if;

  select * into target from public.daily_questions where id = p_question_id for update;
  if target is null then
    raise exception 'Daily question not found.';
  end if;
  if target.recurrence_source_id is not null then
    raise exception 'Only a canonical question (recurrence_source_id is null) can be activated -- a recurrence clone is a point-in-time occurrence, not a rotation candidate.';
  end if;
  if target.status <> 'Approved' then
    raise exception 'Only an Approved Daily can be activated for rotation (got status %). A Live/Archived question is already in the pool; anything else has not cleared editorial review.', target.status;
  end if;
  if target.approved_content_version is null then
    raise exception 'This Daily has no recorded approval.';
  end if;

  computed_fingerprint := public.admin_compute_daily_fingerprint(p_question_id);
  if computed_fingerprint <> target.approved_content_version then
    raise exception 'Content has changed since approval. Re-approve before activating for rotation.';
  end if;

  update public.daily_questions
  set status = 'Archived'
  where id = p_question_id;
end;
$function$;

comment on function public.admin_activate_approved_daily_for_rotation(uuid) is
  'One-time bootstrap for owner-approved canonical Dailies that have never been individually published: moves Approved -> Archived (never Live, never touches published_for) after the exact same fingerprint/approval validation admin_publish_daily performs, making the row a legitimate advance_daily_rotation candidate without fabricating any publication history.';

revoke execute on function public.admin_activate_approved_daily_for_rotation(uuid) from public;
revoke execute on function public.admin_activate_approved_daily_for_rotation(uuid) from anon;
grant execute on function public.admin_activate_approved_daily_for_rotation(uuid) to authenticated;
