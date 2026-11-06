-- Restrict Build 16 quiz submission RPC to authenticated callers.
-- Preserve the legacy 12-argument overload until its usage can be audited.
-- PostgreSQL function grants are per signature; CREATE OR REPLACE of the
-- new 13-argument overload did not inherit the old overload's restrictions.
revoke all on function public.submit_quiz_result(
  text, text, text, timestamptz, smallint, integer, integer,
  text, text, text[], jsonb, jsonb, jsonb
) from public;
revoke all on function public.submit_quiz_result(
  text, text, text, timestamptz, smallint, integer, integer,
  text, text, text[], jsonb, jsonb, jsonb
) from anon;
grant execute on function public.submit_quiz_result(
  text, text, text, timestamptz, smallint, integer, integer,
  text, text, text[], jsonb, jsonb, jsonb
) to authenticated;
grant execute on function public.submit_quiz_result(
  text, text, text, timestamptz, smallint, integer, integer,
  text, text, text[], jsonb, jsonb, jsonb
) to service_role;
