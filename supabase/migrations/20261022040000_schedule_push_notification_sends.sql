-- STAGED, NOT APPLIED. Schedules the real send sweep (supabase/functions/send-push-
-- notification) every minute via pg_cron + pg_net, mirroring this project's existing
-- run_daily_rollover cron pattern (20261003103000_fresh_daily_occurrences_both_rooms.sql) --
-- the one difference is THIS job calls a deployed Edge Function over HTTP (net.http_post)
-- rather than a plain SQL function, since the actual send logic needs the service-role key
-- and Deno's fetch to call Expo's push API, neither of which belong inside Postgres itself.
--
-- MANUAL PREREQUISITE (cannot be done from a migration file -- a secret must never be
-- committed to version control): before this migration is applied, the owner must store the
-- project's own service-role key in Supabase Vault, ONCE, via the SQL editor or CLI:
--   select vault.create_secret('<the real service_role key, from Project Settings > API>', 'service_role_key');
-- This migration only references that secret BY NAME (vault.decrypted_secrets where name =
-- 'service_role_key') -- the real key value is never written to any file in this repository.
--
-- Also requires supabase/functions/send-push-notification to have already been deployed
-- (`supabase functions deploy send-push-notification`) -- this job will simply get HTTP 404s
-- harmlessly (pg_net logs the failure to net._http_response; nothing else breaks) until that
-- happens.
--
-- Each invocation of the Edge Function does BOTH the send pass (claim pending rows, call
-- Expo's push API, classify tickets) AND the receipt-check pass (check delivery confirmation
-- for rows already sent, clean up dead tokens) -- see that function's own header comment.
-- Running every minute is safe under the function's own concurrency-safe claiming (FOR UPDATE
-- SKIP LOCKED) even if a slow invocation overlaps with the next tick.
--
-- MONITORING GAP, not resolved here: net.http_post is fire-and-forget from this cron job's own
-- perspective -- a non-2xx response or a network failure is recorded in net._http_response but
-- never surfaces as an alert. If the Edge Function starts failing consistently (e.g. a bad
-- deploy, an expired Vault secret), nothing in this migration notices on its own. Recommend the
-- owner periodically spot-check `select * from net._http_response order by created desc limit
-- 20;` or wire up Supabase's own function-invocation logs/alerts -- out of scope for this
-- migration itself.

create extension if not exists pg_net;

select cron.schedule(
  'apparently_send_push_notifications',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://rjslgjxlpsjljbrlxfet.supabase.co/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

comment on extension pg_net is
  'Enables net.http_post, used ONLY by the apparently_send_push_notifications cron job above to invoke the send-push-notification Edge Function on a schedule. Not used anywhere else in this schema.';
