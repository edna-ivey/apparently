-- 00-stub-foundation.sql's public.daily_mode enum only has 'standard' (it predates
-- 20260918010000_public_private_daily_rooms.sql's real profile/room_only split). Rather than
-- touch the shared stub (every other passing harness test depends on its current shape),
-- this ADDs the two real values this test (item 5, owner audit 2026-10-30) actually needs --
-- 'standard' stays defined and unused here, exactly as every other harness already left it.
alter type public.daily_mode add value 'profile';
alter type public.daily_mode add value 'room_only';
