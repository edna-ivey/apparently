-- V1 release execution (2026-11-06), item 1's required proof, made reusable: run against any
-- real Postgres database with the full schema + content applied (NOT a database abstraction --
-- this needs the real advance_daily_rotation(), daily_questions, daily_rotation_state). Not a
-- migration -- never applied to a live environment, only run against an isolated rehearsal
-- copy. Proves advance_daily_rotation() eventually selects every canonical, non-Rejected
-- source for a room, with zero premature repeats (a source drawn a second time before the
-- full candidate set has been exhausted), tracking the exact draw order for diagnosis if it
-- ever fails. Run with:
--   psql <rehearsal-connection> -v ON_ERROR_STOP=1 -f scripts/rehearsal-sql/daily-rotation-coverage-test.sql

do $$
declare
  v_room public.daily_room;
  v_expected_total int;
  v_draw_order uuid[] := '{}';
  v_seen uuid[] := '{}';
  v_current_source uuid;
  v_iterations int := 0;
  v_max_iterations int := 400;
begin
  foreach v_room in array array['public','private']::public.daily_room[]
  loop
    v_draw_order := '{}';
    v_seen := '{}';
    v_iterations := 0;

    select count(*) into v_expected_total
    from public.daily_questions
    where room = v_room and recurrence_source_id is null and status <> 'Rejected';

    -- Clear any pre-existing Live row + rotation state for a clean run.
    update public.daily_questions set status = 'Archived' where room = v_room and status = 'Live';
    delete from public.daily_rotation_state where room = v_room;

    loop
      v_iterations := v_iterations + 1;
      if v_iterations > v_max_iterations then
        raise exception '[%] exceeded % iterations without covering all % canonical sources -- draw_order so far: %', v_room, v_max_iterations, v_expected_total, v_draw_order;
      end if;

      perform public.advance_daily_rotation(v_room);

      select coalesce(recurrence_source_id, id) into v_current_source
      from public.daily_questions where room = v_room and status = 'Live' limit 1;

      if v_current_source is null then
        raise exception '[%] advance_daily_rotation produced no Live row on iteration %', v_room, v_iterations;
      end if;

      if array_length(v_seen, 1) is null or array_length(v_seen, 1) < v_expected_total then
        if v_current_source = any(v_seen) then
          raise exception '[%] PREMATURE REPEAT: % drawn again on iteration % before all % canonical sources were covered. draw_order: %', v_room, v_current_source, v_iterations, v_expected_total, v_draw_order;
        end if;
        v_seen := array_append(v_seen, v_current_source);
      end if;
      v_draw_order := array_append(v_draw_order, v_current_source);

      if array_length(v_seen, 1) = v_expected_total then
        exit;
      end if;
    end loop;

    raise notice '[%] PASS: covered all % canonical sources with zero premature repeats, in % rotation calls.', v_room, v_expected_total, v_iterations;
  end loop;
end $$;
