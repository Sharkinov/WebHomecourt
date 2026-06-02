


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "public";






CREATE SCHEMA IF NOT EXISTS "simulacion_juego";


ALTER SCHEMA "simulacion_juego" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."activate_round"("p_question_id" integer, "p_round" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Desactiva todo
  UPDATE matchup
  SET active = false
  WHERE question_id = p_question_id;

  -- Activa solo esa ronda
  UPDATE matchup
  SET active = true
  WHERE question_id = p_question_id
    AND round = p_round
    AND answer_a_id IS NOT NULL
    AND answer_b_id IS NOT NULL;
END;
$$;


ALTER FUNCTION "public"."activate_round"("p_question_id" integer, "p_round" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_user_credits"("p_user_id" "uuid", "p_credits" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
    update public.user_laker
    set credits = coalesce(credits, 0) + p_credits
    where user_id = p_user_id;

    if not found then
        raise exception 'User % not found', p_user_id;
    end if;
end;
$$;


ALTER FUNCTION "public"."add_user_credits"("p_user_id" "uuid", "p_credits" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."advance_round"("p_question_id" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  current_round INT;
BEGIN
  -- 1. Obtener ronda activa actual
  SELECT DISTINCT round
  INTO current_round
  FROM matchup
  WHERE question_id = p_question_id
    AND active = true
  LIMIT 1;

  -- Seguridad: si no hay ronda activa, salir
  IF current_round IS NULL THEN
    RAISE NOTICE 'No active round found';
    RETURN;
  END IF;

  -- 2. Calcular winners y cerrar ronda
  PERFORM update_matchups(p_question_id);

  -- 3. Pasar ganadores a la siguiente ronda
  PERFORM advance_winners(p_question_id);

  -- 4. Activar siguiente ronda (si existe)
  IF EXISTS (
    SELECT 1
    FROM matchup
    WHERE question_id = p_question_id
      AND round = current_round + 1
)
THEN
    PERFORM activate_round(p_question_id, current_round + 1);
END IF;

END;
$$;


ALTER FUNCTION "public"."advance_round"("p_question_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."advance_winners"("p_question_id" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  current_round INT;
BEGIN
  -- 1. detectar ronda actual (la que ya tiene winners pero estaba activa)
  SELECT MAX(round)
  INTO current_round
  FROM matchup
  WHERE question_id = p_question_id
    AND winner_id IS NOT NULL;

  -- 2. pasar winners a la siguiente ronda
  UPDATE matchup next
  SET 
    answer_a_id = sub.answer_a_id,
    answer_b_id = sub.answer_b_id
  FROM (
    SELECT
      CEIL(position / 2.0) AS next_position,
      MAX(CASE WHEN position % 2 = 1 THEN winner_id END) AS answer_a_id,
      MAX(CASE WHEN position % 2 = 0 THEN winner_id END) AS answer_b_id
    FROM matchup
    WHERE question_id = p_question_id
      AND round = current_round
    GROUP BY CEIL(position / 2.0)
  ) sub
  WHERE next.question_id = p_question_id
    AND next.round = current_round + 1
    AND next.position = sub.next_position;

END;
$$;


ALTER FUNCTION "public"."advance_winners"("p_question_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_lakers_court_access"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.allow_lakers_court := (
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, NEW.birthdate)) >= 15
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."calculate_lakers_court_access"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."card_collection"("p_user_id" "uuid") RETURNS TABLE("card_id" "text", "player_name" "text", "web_url" "text", "attack" integer, "defense" integer, "velocity" integer, "rarity_id" integer, "rarity_label" "text", "user_card_id" bigint, "times_unlocked" integer, "first_unlock" timestamp with time zone, "pack_name" "text", "user_owned" boolean, "added_deck" boolean, "in_deck" boolean)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT 
    -- Card info 
    c.card_id, 
    c.player_name, 
    c.web_url, 
    c.attack, 
    c.defense, 
    c.velocity,
    c.rarity_id,
    -- Rarity label
    r.name AS rarity_label, 
    -- Unlock info if exists
    uc.user_card_id,
    COALESCE(uc.times_unlocked, 0) AS times_unlocked, 
    uc.first_unlock, 
    p.name AS pack_name,
    -- Flag 1 if user owns card, 0 does not own 
    CASE 
      WHEN uc.card_id IS NOT NULL THEN TRUE
      ELSE FALSE 
    END AS user_owned,
    COALESCE(uc.added_deck, FALSE), -- Card is added to their deck, default not part of the deck
    COALESCE(uc.in_deck, FALSE) -- Card is active in game 
  FROM card c
  JOIN rarity r ON c.rarity_id = r.rarity_id
  -- Link to user
  LEFT JOIN user_card uc ON c.card_id = uc.card_id AND uc.user_id = p_user_id
  -- Get package info 
  LEFT JOIN pack p ON uc.first_pack_id = p.pack_id
  GROUP BY 
    -- Card info 
    c.card_id, 
    c.player_name, 
    c.web_url, c.attack, 
    c.defense, 
    c.velocity,
    c.rarity_id,
    -- Rarity label
    r.name,
    -- Unlock info if exists
    uc.user_card_id,
    uc.times_unlocked, 
    uc.first_unlock,
    p.name,
    -- Checking ownership
    uc.card_id,
    uc.added_deck
  ORDER BY rarity_id ASC, c.player_name ASC;
$$;


ALTER FUNCTION "public"."card_collection"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_deck_limit"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$DECLARE
  deck_count integer;
BEGIN
  -- Solo validar cuando in_deck true
  IF NEW.in_deck = true THEN
    SELECT COUNT(*) INTO deck_count
    FROM user_card
    WHERE user_id = NEW.user_id
      AND in_deck = true
      AND user_card_id != NEW.user_card_id;

    IF deck_count >= 6 THEN
      RAISE EXCEPTION 'El deck ya tiene 6 cartas. Elimina una antes de agregar otra.';
    END IF;
  END IF;

  -- Si se agrega al deck, tambien marcar added_deck = true automatico
  IF NEW.in_deck = true THEN
    NEW.added_deck := true;
  END IF;

  RETURN NEW;
END;$$;


ALTER FUNCTION "public"."check_deck_limit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."collection_summary"("p_user_id" "uuid") RETURNS TABLE("unlocked_common" integer, "total_common" integer, "unlocked_rare" integer, "total_rare" integer, "unlocked_legendary" integer, "total_legendary" integer, "unlocked_limited" integer, "total_limited" integer)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT 
    -- Specific to user, then total 
    COUNT(uc.card_id) FILTER (WHERE c.rarity_id = 1) AS unlocked_common,
    COUNT(*) FILTER (WHERE c.rarity_id = 1) AS total_common,
    
    COUNT(uc.card_id) FILTER (WHERE c.rarity_id = 2) AS unlocked_rare,
    COUNT(*) FILTER (WHERE c.rarity_id = 2) AS total_rare,

    COUNT(uc.card_id) FILTER (WHERE c.rarity_id = 3) AS unlocked_legendary,
    COUNT(*) FILTER (WHERE c.rarity_id = 3) AS total_legendary,

    COUNT(uc.card_id) FILTER (WHERE c.rarity_id = 4) AS unlocked_limited,
    COUNT(*) FILTER (WHERE c.rarity_id = 4) AS total_limited
  FROM card c
  -- Have to use and cause the where just eliminates search in card table
  LEFT JOIN user_card uc ON c.card_id = uc.card_id AND uc.user_id = p_user_id;
$$;


ALTER FUNCTION "public"."collection_summary"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_conversation_for_friendship"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.conversation (friendship_id)
  VALUES (NEW.friendship_id);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_conversation_for_friendship"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_after_event_rating"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.user_laker
  SET reputation = (
    SELECT ROUND(AVG(uer.rating), 2)
    FROM public.user_event_ratings uer
    WHERE uer.rated_user_id = NEW.rated_user_id
  )
  WHERE user_id = NEW.rated_user_id;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."fn_after_event_rating"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_full_bracket"("p_question_id" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    total_answers INT;
    total_rounds INT;
    matches_in_round INT;
    r INT;
BEGIN
    -- Limpiar bracket previo
    DELETE FROM matchup WHERE question_id = p_question_id;

    -- Contar respuestas
    SELECT COUNT(*) INTO total_answers
    FROM answer
    WHERE question_id = p_question_id;

    --calcular rondas
    SELECT FLOOR(LN(total_answers) / LN(2))::INT
    INTO total_rounds;

    -- =========================
    -- ROUND 1 (con answers reales)
    -- =========================
    INSERT INTO matchup (question_id, round, position, answer_a_id, answer_b_id)
    SELECT
        p_question_id,
        1,
        position,
        MAX(answer_a_id),
        MAX(answer_b_id)
    FROM (
        SELECT
            ((ROW_NUMBER() OVER (ORDER BY random()) - 1) / 2 + 1) AS position,
            CASE WHEN ROW_NUMBER() OVER (ORDER BY random()) % 2 = 1 THEN answer_id END AS answer_a_id,
            CASE WHEN ROW_NUMBER() OVER (ORDER BY random()) % 2 = 0 THEN answer_id END AS answer_b_id
        FROM answer
        WHERE question_id = p_question_id
    ) t
    GROUP BY position
    ORDER BY position;

    -- =========================
    -- ROUNDS 2 a 4 (estructura)
    -- =========================
    FOR r IN 2..total_rounds LOOP

        INSERT INTO matchup (question_id, round, position, parent_a_id, parent_b_id)
        SELECT
            p_question_id,
            r,
            position,
            MAX(parent_a_id),
            MAX(parent_b_id)
        FROM (
            SELECT
                ((ROW_NUMBER() OVER (ORDER BY matchup_id) - 1) / 2 + 1) AS position,
                CASE WHEN ROW_NUMBER() OVER (ORDER BY matchup_id) % 2 = 1 THEN matchup_id END AS parent_a_id,
                CASE WHEN ROW_NUMBER() OVER (ORDER BY matchup_id) % 2 = 0 THEN matchup_id END AS parent_b_id
            FROM matchup
            WHERE question_id = p_question_id
              AND round = r - 1
        ) t
        GROUP BY position
        ORDER BY position;

    END LOOP;

END;
$$;


ALTER FUNCTION "public"."generate_full_bracket"("p_question_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_agenda_games"("p_year" integer, "p_month" integer) RETURNS TABLE("game_id" integer, "opposing_team_id" integer, "home" boolean, "start_date" timestamp with time zone, "game_end_time" timestamp with time zone, "team_name" "text", "logo_url" "text", "lakers_score" bigint, "opposite_score" bigint)
    LANGUAGE "sql"
    AS $$
  SELECT 
  -- Basic game details
  g.game_id,
  g.opposing_team_id,
  g.home,
  g.start_date,
  g.game_end_time, -- Game is null aka hasn't eneded yet cast as a 0
  -- Opp team logo, missing to add their name tho
  t.team_name,
  t.logo_url,
  -- Calc scores or sets to 0 if hasn't played yet aka no tps associated
  -- Lakers
  COALESCE(SUM(CASE
    WHEN tp.team_id = 1 THEN tps.points
    ELSE 0
  END), 0) AS lakers_score,

  -- Now calc for opposing team
  COALESCE(SUM(CASE
    WHEN tp.team_id = g.opposing_team_id THEN tps.points
    ELSE 0
  END), 0) AS opposite_score

  FROM simulacion_juego.game g
  -- Now bunch of stuff to link the game to ind players stats per game 
  JOIN simulacion_juego.team t ON t.team_id = g.opposing_team_id
  LEFT JOIN simulacion_juego.team_player_stats tps ON tps.game_id = g.game_id
  LEFT JOIN simulacion_juego.team_player tp ON tp.team_player_id = tps.team_player_id
  -- Date filtering within range 
  WHERE g.start_date >= make_date(p_year, p_month, 1)
    AND g.start_date < (make_date(p_year, p_month, 1) + INTERVAL '1 month') -- Here takes curr dates and adds a month so it'd be 2026-05-01 I think today it's month 04
  -- Must be same as selects cause sql is like that ig
  GROUP BY
    g.game_id,
    g.opposing_team_id,
    g.home,
    g.start_date,
    g.game_end_time,
    t.team_name,
    t.logo_url
  ORDER BY g.start_date; -- Ordering to show older to newer to hopefully make partition easier
$$;


ALTER FUNCTION "public"."get_agenda_games"("p_year" integer, "p_month" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_available_events"("p_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("event_id" bigint, "event_name" character varying, "date" timestamp with time zone, "created_user_id" "uuid", "creator_nickname" character varying, "court_id" bigint, "max_players" smallint, "min_age" smallint, "max_age" smallint, "skill_level_id" bigint, "allow_event" boolean, "female_event" boolean, "current_players" bigint)
    LANGUAGE "sql" STABLE
    AS $$SELECT 
    e.event_id,
    e.event_name,
    e.date,
    e.created_user_id,
    ul.nickname AS creator_nickname,
    e.court_id,
    e.max_players,
    e.min_age,
    e.max_age,
    e.skill_level_id,
    e.allow_event,
    e.female_event,
    COUNT(ue.user_event_id) AS current_players
  FROM event e
  -- Trae info del creador aunque no exista, por eso LEFT JOIN
  LEFT JOIN user_laker ul ON ul.user_id = e.created_user_id

  -- Trae registros de jugadores inscritos pa contar
  LEFT JOIN user_event ue ON ue.event_id = e.event_id
  WHERE e.allow_event = true -- Solo eventos permitidos
    AND e.event_status_id = 1  -- Solo eventos activos
    AND p_user_id IS NOT NULL
    AND (
      e.female_event = false   -- Los eventos que no son solo para mujeres siempre se muestran
      OR EXISTS (
        -- Solo se muestran si el/la usuarie es tilina
          SELECT 1 FROM user_laker u
          WHERE u.user_id = p_user_id AND u.gender = 0  -- 0 = Female
      )
    )
  GROUP BY e.event_id, ul.nickname, ul.username
  ORDER BY e.date ASC NULLS LAST;$$;


ALTER FUNCTION "public"."get_available_events"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_deck_cards"() RETURNS TABLE("user_card_id" integer, "web_url" "text", "added_deck" boolean, "in_deck" boolean, "gatorade_cost" integer)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT
    uc.user_card_id,
    c.web_url,
    uc.added_deck,
    uc.in_deck,
    c.gatorade_cost
  FROM user_card AS uc
  JOIN card AS c ON c.card_id = uc.card_id
  WHERE uc.user_id = auth.uid()
    AND uc.added_deck = true
  ORDER BY uc.in_deck DESC;
$$;


ALTER FUNCTION "public"."get_deck_cards"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_event_players"("p_event_id" bigint) RETURNS TABLE("user_id" "uuid", "username" character varying, "nickname" character varying, "photo_url" character varying, "gender_label" character varying, "age" integer, "reputation" numeric)
    LANGUAGE "sql" STABLE
    AS $$
  SELECT
    ul.user_id,
    ul.username,
    ul.nickname,
    ul.photo_url,
    g.gender AS gender_label,
    DATE_PART('year', AGE(ul.birthdate))::int AS age,
    ul.reputation
  FROM user_event ue
  JOIN user_laker ul ON ul.user_id = ue.user_id
  LEFT JOIN gender g ON g.gender_id = ul.gender
  WHERE ue.event_id = p_event_id
  ORDER BY ul.username ASC;
$$;


ALTER FUNCTION "public"."get_event_players"("p_event_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_friend_chats"("p_user_id" "uuid") RETURNS TABLE("friendship_id" bigint, "conversation_id" bigint, "friend_id" "uuid", "friend_nickname" character varying, "friend_photo" character varying, "friend_online" boolean, "last_message" "text", "last_message_sent" timestamp with time zone, "last_message_sender_id" "uuid")
    LANGUAGE "sql" STABLE
    AS $$
  SELECT
    f.friendship_id,
    c.conversation_id,
    friend.user_id        AS friend_id,
    friend.nickname       AS friend_nickname,
    friend.photo_url      AS friend_photo,
    friend.online         AS friend_online,
    last_msg.message      AS last_message,
    last_msg.sent         AS last_message_sent,
    last_msg.user_id      AS last_message_sender_id
  FROM public.friendship f
  LEFT JOIN public.conversation c ON c.friendship_id = f.friendship_id
  JOIN public.user_laker friend ON friend.user_id = CASE
    WHEN f.user1 = p_user_id THEN f.user2
    ELSE f.user1
  END
  LEFT JOIN LATERAL (
    SELECT m.message, m.sent, m.user_id
    FROM public.message m
    WHERE m.conversation_id = c.conversation_id
    ORDER BY m.sent DESC
    LIMIT 1
  ) last_msg ON true
  WHERE f.user1 = p_user_id OR f.user2 = p_user_id
  ORDER BY last_msg.sent DESC NULLS LAST;
$$;


ALTER FUNCTION "public"."get_friend_chats"("p_user_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "simulacion_juego"."team_player" (
    "team_player_id" integer NOT NULL,
    "first_name" character varying(50) NOT NULL,
    "last_name" character varying(50) NOT NULL,
    "team_id" integer NOT NULL,
    "photo_url" character varying(200)
);


ALTER TABLE "simulacion_juego"."team_player" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_lakers_players"() RETURNS SETOF "simulacion_juego"."team_player"
    LANGUAGE "sql"
    AS $$
    SELECT *
    FROM simulacion_juego.team_player
    WHERE team_id = 1;
$$;


ALTER FUNCTION "public"."get_lakers_players"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_last_game_id"() RETURNS integer
    LANGUAGE "sql"
    AS $$
select * from simulacion_juego.get_last_game_id();
$$;


ALTER FUNCTION "public"."get_last_game_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_matchups_for_user"("p_user_id" "uuid", "p_question_id" integer) RETURNS TABLE("matchup_id" integer, "round" integer, "pos" integer, "winner_id" integer, "answer_a_id" integer, "answer_a_text" "text", "answer_b_id" integer, "answer_b_text" "text", "percent_a" numeric, "percent_b" numeric, "active" boolean, "voted" integer)
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
WITH votes_count AS (
  SELECT
    m.matchup_id,

    COUNT(*) FILTER (
      WHERE uv.selected_id = m.answer_a_id
    ) AS votes_a,

    COUNT(*) FILTER (
      WHERE uv.selected_id = m.answer_b_id
    ) AS votes_b

  FROM matchup m

  LEFT JOIN user_vote uv
    ON uv.matchup_id = m.matchup_id

  GROUP BY m.matchup_id
)

SELECT
  m.matchup_id,
  m.round,
  m.position AS pos,
  m.winner_id,

  m.answer_a_id,
  a.answer_text,

  m.answer_b_id,
  b.answer_text,

  CASE
    WHEN (vc.votes_a + vc.votes_b) > 0
    THEN ROUND(
      (vc.votes_a::numeric / (vc.votes_a + vc.votes_b)) * 100
    )
    ELSE 0
  END AS percent_a,

  CASE
    WHEN (vc.votes_a + vc.votes_b) > 0
    THEN ROUND(
      (vc.votes_b::numeric / (vc.votes_a + vc.votes_b)) * 100
    )
    ELSE 0
  END AS percent_b,

  m.active,

  uv_user.selected_id AS voted

FROM matchup m

LEFT JOIN answer a
  ON a.answer_id = m.answer_a_id

LEFT JOIN answer b
  ON b.answer_id = m.answer_b_id

LEFT JOIN user_vote uv_user
  ON uv_user.matchup_id = m.matchup_id
  AND uv_user.user_id = p_user_id

LEFT JOIN votes_count vc
  ON vc.matchup_id = m.matchup_id

WHERE m.question_id = p_question_id;
$$;


ALTER FUNCTION "public"."get_matchups_for_user"("p_user_id" "uuid", "p_question_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_messages"("p_user_id" "uuid", "p_conversation_id" bigint) RETURNS TABLE("message_id" bigint, "user_id" "uuid", "nickname" character varying, "photo_url" character varying, "message" "text", "sent" timestamp with time zone, "is_mine" boolean)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  -- Verifica que el usuario sea parte de la conversación antes de retornar mensajes
  SELECT
    m.message_id,
    m.user_id,
    ul.nickname,
    ul.photo_url,
    m.message,
    m.sent,
    m.user_id = p_user_id AS is_mine
  FROM public.message m
  JOIN public.user_laker ul ON ul.user_id = m.user_id
  WHERE m.conversation_id = p_conversation_id
    AND EXISTS (
      SELECT 1
      FROM public.conversation c
      JOIN public.friendship f ON f.friendship_id = c.friendship_id
      WHERE c.conversation_id = p_conversation_id
        AND (f.user1 = p_user_id OR f.user2 = p_user_id)
    )
  ORDER BY m.sent ASC;
$$;


ALTER FUNCTION "public"."get_messages"("p_user_id" "uuid", "p_conversation_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_packs_store"() RETURNS TABLE("pack_id" integer, "pack_type_id" integer, "name" "text", "closed_URL" "text", "tear_URL" "text", "opening_URL" "text", "pack_name" "text", "cost" integer, "num_cards" integer, "is_active" boolean)
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
SELECT 
  -- Show pack and type first 
  p.pack_id,
  pt.pack_type_id,
  pt.name,
  pt."closed_URL", -- Quotations pq otherwise se cambia a lowercase
  pt."tear_URL", 
  pt."opening_URL",
  -- Now actual data fpr packs a match was found
  p.name AS pack_name,
  p.cost,
  p.num_cards, -- Including so that desc can be like buy to win up to num_cards!
  p.is_active
FROM pack_type pt
LEFT JOIN pack p ON p.pack_type_id = pt.pack_type_id
  AND p.is_active = TRUE -- Pack must be active to be added to the returned thing
ORDER BY
  pt.pack_type_id, -- Preference to order created and then what sort of supback they belong to 
  p.pack_id;
$$;


ALTER FUNCTION "public"."get_packs_store"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_pending_rating"("p_user_id" "uuid") RETURNS TABLE("user_event_id" bigint, "event_id" bigint, "event_name" character varying, "event_date" timestamp with time zone)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT
    ue.user_event_id,
    e.event_id,
    e.event_name,
    e.date AS event_date
  FROM public.user_event ue
  JOIN public.event e ON e.event_id = ue.event_id
  WHERE ue.user_id = p_user_id
    AND e.date < NOW()
    AND ue.rated_others = FALSE
  ORDER BY e.date DESC
  LIMIT 1;
$$;


ALTER FUNCTION "public"."get_pending_rating"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_pending_rating_full"("p_user_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_pending RECORD;
  v_result  JSON;
BEGIN
  -- 1. Busca el evento pendiente de calificar (usa event_status_id = 2)
  SELECT
    ue.user_event_id,
    e.event_id,
    e.event_name,
    e.date AS event_date,
    c.name AS court_name,
    c.direction AS court_direction
  INTO v_pending
  FROM public.user_event ue
  JOIN public.event e ON e.event_id = ue.event_id
  LEFT JOIN public.court c ON c.court_id = e.court_id
  WHERE ue.user_id = p_user_id
    AND e.event_status_id = 2        -- solo eventos finalizados
    AND ue.rated_others = FALSE
  ORDER BY e.date DESC
  LIMIT 1;

  -- Si no hay nada pendiente, retorna null
  IF v_pending IS NULL THEN
    RETURN NULL;
  END IF;

  -- 2. Construye el resultado con jugadores pendientes de calificar
  SELECT json_build_object(
    'user_event_id',   v_pending.user_event_id,
    'event_id',        v_pending.event_id,
    'event_name',      v_pending.event_name,
    'event_date',      v_pending.event_date,
    'court_name',      v_pending.court_name,
    'court_direction', v_pending.court_direction,
    'players', (
      SELECT json_agg(json_build_object(
        'user_id',    ul.user_id,
        'nickname',   ul.nickname,
        'username',   ul.username,
        'photo_url',  ul.photo_url,
        'reputation', ul.reputation
      ))
      FROM public.user_event ue2
      JOIN public.user_laker ul ON ul.user_id = ue2.user_id
      WHERE ue2.event_id = v_pending.event_id
        AND ue2.user_id <> p_user_id  -- excluye al usuario actual
        -- excluye a quienes ya fueron calificados en este evento
        AND ul.user_id NOT IN (
          SELECT uer.rated_user_id
          FROM public.user_event_ratings uer
          WHERE uer.user_event_id = v_pending.user_event_id
        )
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_pending_rating_full"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_players_played_with"("p_user_id" "uuid") RETURNS TABLE("user_id" "uuid", "nickname" character varying, "username" character varying, "photo_url" character varying, "reputation" numeric, "event_id" bigint, "event_name" character varying, "event_date" timestamp with time zone)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  WITH last_event AS (
    SELECT ep.event_id
    FROM public.event_participant ep
    JOIN public.event e ON e.event_id = ep.event_id
    WHERE ep.user_id = p_user_id
      AND e.date < NOW()
    ORDER BY e.date DESC
    LIMIT 1
  )
  SELECT
    ul.user_id,
    ul.nickname,
    ul.username,
    ul.photo_url,
    ul.reputation,
    e.event_id,
    e.event_name,
    e.date AS event_date
  FROM last_event le
  JOIN public.event_participant ep_other
    ON ep_other.event_id = le.event_id
   AND ep_other.user_id <> p_user_id
  JOIN public.user_laker ul
    ON ul.user_id = ep_other.user_id
  JOIN public.event e
    ON e.event_id = le.event_id
  ORDER BY ul.nickname;
$$;


ALTER FUNCTION "public"."get_players_played_with"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_recent_news"() RETURNS TABLE("news_id" integer, "title" character varying, "news_url" character varying, "photo_url" character varying, "date_posted" timestamp with time zone, "category" "text")
    LANGUAGE "sql" STABLE
    AS $$
  SELECT
    n.news_id,
    n.title,
    n.news_url,
    n.photo_url,
    n.date_posted,
    COALESCE(nc.description, 'General News') AS category
  FROM public.news n
  LEFT JOIN public.news_category nc ON nc.news_category_id = n.news_category
  WHERE n.date_posted >= (NOW() - INTERVAL '2 days')
  ORDER BY n.date_posted DESC;
$$;


ALTER FUNCTION "public"."get_recent_news"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_team_comparison"("p_game_id" integer) RETURNS TABLE("game_id" integer, "start_date" timestamp with time zone, "lakers_rebounds" integer, "opposing_rebounds" integer, "lakers_assists" integer, "opposing_assists" integer, "lakers_steals" integer, "opposing_steals" integer, "lakers_points" integer, "opposing_points" integer, "lakers_abv" "text", "opposing_abv" "text", "opposing_team_name" "text", "opposing_team_logo" "text")
    LANGUAGE "sql"
    AS $$
  select
    g.game_id,
    g.start_date,

    coalesce(sum(tps.rebounds) filter (where tp.team_id = 1), 0),
    coalesce(sum(tps.rebounds) filter (where tp.team_id <> 1), 0),

    coalesce(sum(tps.assists) filter (where tp.team_id = 1), 0),
    coalesce(sum(tps.assists) filter (where tp.team_id <> 1), 0),

    coalesce(sum(tps.steals) filter (where tp.team_id = 1), 0),
    coalesce(sum(tps.steals) filter (where tp.team_id <> 1), 0),

    coalesce(sum(tps.points) filter (where tp.team_id = 1), 0),
    coalesce(sum(tps.points) filter (where tp.team_id <> 1), 0),

    t.abreviatura,
    ot.abreviatura,
    ot.team_name,
    ot.logo_url

  from simulacion_juego.game g
  join simulacion_juego.team_player_stats tps 
    on tps.game_id = g.game_id
  join simulacion_juego.team_player tp 
    on tp.team_player_id = tps.team_player_id
  join simulacion_juego.team ot 
    on ot.team_id = g.opposing_team_id
  join simulacion_juego.team t 
    on t.team_id = 1

  where g.game_id = p_game_id

  group by g.game_id, t.abreviatura, ot.abreviatura, ot.team_name, ot.logo_url;
$$;


ALTER FUNCTION "public"."get_team_comparison"("p_game_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_match_history"("p_user_id" "uuid") RETURNS TABLE("user_event_id" bigint, "event_id" bigint, "event_name" character varying, "event_date" timestamp with time zone, "event_status_id" smallint, "event_status_name" character varying, "court_name" character varying, "court_direction" character varying, "result" boolean, "user_score" smallint, "opponent_score" smallint, "points" smallint, "rebounds" smallint, "assists" smallint, "steals" smallint, "blocks" smallint, "field_goals" double precision, "field_goals_attempts" integer, "fg_pct" numeric, "tre_pointer" real, "tre_pointer_atemp" bigint, "three_pct" numeric, "avg_rating_received" numeric, "rated_others" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    ue.user_event_id,
    ue.event_id,
    e.event_name,
    e.date                                                          AS event_date,
    e.event_status_id,
    es.status_name                                                  AS event_status_name,
    c.name                                                          AS court_name,
    c.direction                                                     AS court_direction,
    ue.result,
    ue.user_score,
    ue.opponent_score,
    ue.points,
    ue.rebounds,
    ue.assists,
    ue.steals,
    ue.blocks,
    ue.field_goals,
    ue.field_goals_attempts,
    CASE
      WHEN ue.field_goals_attempts > 0
      THEN ROUND((ue.field_goals / ue.field_goals_attempts * 100)::NUMERIC, 1)
      ELSE NULL
    END                                                             AS fg_pct,
    ue.tre_pointer,
    ue.tre_pointer_atemp,
    CASE
      WHEN ue.tre_pointer_atemp > 0
      THEN ROUND((ue.tre_pointer / ue.tre_pointer_atemp * 100)::NUMERIC, 1)
      ELSE NULL
    END                                                             AS three_pct,
    (
      SELECT ROUND(AVG(uer.rating), 2)
      FROM user_event_ratings uer
      WHERE uer.rated_user_id = p_user_id
        AND uer.user_event_id IN (
          SELECT ue2.user_event_id
          FROM user_event ue2
          WHERE ue2.event_id = ue.event_id
        )
    )                                                               AS avg_rating_received,
    ue.rated_others

  FROM user_event ue
  JOIN event        e  ON e.event_id         = ue.event_id
  JOIN event_status es ON es.event_status_id = e.event_status_id
  LEFT JOIN court   c  ON c.court_id         = e.court_id

  WHERE ue.user_id = p_user_id

  ORDER BY e.date DESC;
END;
$$;


ALTER FUNCTION "public"."get_user_match_history"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_stats"("p_user_id" "uuid") RETURNS TABLE("events_created" bigint, "events_attended" bigint)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT
    (
      SELECT COUNT(*)
      FROM public.event
      WHERE created_user_id = p_user_id
    ) AS events_created,
    (
      SELECT COUNT(*)
      FROM public.user_event
      WHERE user_id = p_user_id
    ) AS events_attended;
$$;


ALTER FUNCTION "public"."get_user_stats"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_win_streak"("p_user_id" "uuid") RETURNS TABLE("current_streak" integer, "max_streak" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  rec             RECORD;
  cur_streak      INTEGER := 0;
  max_str         INTEGER := 0;
  temp_streak     INTEGER := 0;
BEGIN
  -- Recorre los partidos con resultado definido, del más antiguo al más reciente
  FOR rec IN
    SELECT ue.result
    FROM user_event ue
    JOIN event e ON e.event_id = ue.event_id
    WHERE ue.user_id   = p_user_id
      AND ue.result IS NOT NULL        -- solo partidos con resultado definido
    ORDER BY e.date ASC
  LOOP
    IF rec.result = TRUE THEN
      temp_streak := temp_streak + 1;
      IF temp_streak > max_str THEN
        max_str := temp_streak;
      END IF;
    ELSE
      temp_streak := 0;               -- derrota rompe la racha
    END IF;
  END LOOP;

  -- current_streak: recorre al revés hasta encontrar la primera derrota
  cur_streak := 0;
  FOR rec IN
    SELECT ue.result
    FROM user_event ue
    JOIN event e ON e.event_id = ue.event_id
    WHERE ue.user_id   = p_user_id
      AND ue.result IS NOT NULL
    ORDER BY e.date DESC
  LOOP
    IF rec.result = TRUE THEN
      cur_streak := cur_streak + 1;
    ELSE
      EXIT;                           -- para en la primera derrota
    END IF;
  END LOOP;

  current_streak := cur_streak;
  max_streak     := max_str;

  RETURN NEXT;
END;
$$;


ALTER FUNCTION "public"."get_user_win_streak"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_ai_analyze_event_report"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_url  text  := 'https://ptbcoxaguvbwprxdundz.supabase.co/functions/v1/analyze-event-report';
  v_body jsonb;
BEGIN
  v_body := jsonb_build_object(
    'ereport_id', NEW.ereport_id,
    'comment',    NEW.comment,
    'event_id',   NEW.event_id
  );

  PERFORM net.http_post(
    url     := v_url,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body    := v_body
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_ai_analyze_event_report"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_ai_analyze_report"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_url  text  := 'https://ptbcoxaguvbwprxdundz.supabase.co/functions/v1/analyze-report';
  v_body jsonb;
BEGIN
  v_body := jsonb_build_object(
    'ureport_id', NEW.ureport_id,
    'comment',    NEW.comment,
    'event_id',   NEW.event_id
  );

  PERFORM net.http_post(
    url     := v_url,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body    := v_body
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_ai_analyze_report"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_question"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    q RECORD;
    current_round INT;
BEGIN

    -- obtener pregunta activa por fecha
    SELECT *
    INTO q
    FROM question
    WHERE start_date <= NOW()
      AND end_date > NOW()
    LIMIT 1;

    -- si no hay pregunta activa
    IF q IS NULL THEN
        RETURN;
    END IF;

    -- =========================================
    -- 1. GENERAR BRACKET SI NO EXISTE
    -- =========================================
    IF NOT EXISTS (
        SELECT 1
        FROM matchup
        WHERE question_id = q.question_id
    )
    THEN
        PERFORM generate_full_bracket(q.question_id);

        PERFORM activate_round(q.question_id, 1);

        RETURN;
    END IF;

    -- =========================================
    -- 2. OBTENER RONDA ACTIVA
    -- =========================================
    SELECT round
    INTO current_round
    FROM matchup
    WHERE question_id = q.question_id
      AND active = true
    LIMIT 1;

    IF current_round IS NULL THEN
        RETURN;
    END IF;

    -- =========================================
    -- 3. AVANZAR CADA 2 DIAS
    -- =========================================
    IF NOW() >= q.start_date + (current_round * INTERVAL '2 days')
    THEN
        PERFORM advance_round(q.question_id);
    END IF;

    -- =========================================
    -- 4. DESACTIVAR MATCHUPS AL TERMINAR
    -- =========================================
    IF q.end_date <= NOW()
    THEN
        UPDATE matchup
        SET active = false
        WHERE question_id = q.question_id;
    END IF;

END;
$$;


ALTER FUNCTION "public"."process_question"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."randomize_display_cards"("p_pack" integer, "p_user_id" "uuid") RETURNS TABLE("card_id" "uuid", "player_name" "text", "web_url" "text", "attack" integer, "defense" integer, "velocity" integer, "rarity_id" integer, "rarity_label" "text", "times_unlocked" integer, "first_unlock" timestamp with time zone, "pack_name" "text", "card_slot" integer, "luck" integer, "luck_rarity_id" integer, "updated_credits" integer, "random_case" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  -- Internal logic never seeing the light of dawn
  v_num_cards int; -- How many cards show up in that pack
  v_pack_cost int; -- Stores how much that pack costs to update user credits later on

  -- DisplayCard info coinciding w table definition of card info 
  v_won_card_id uuid; -- Store the temprorary card won
  /*v_player_name varchar; 
  v_web_url varchar; -- new 
  v_attack int; -- new
  v_defense int; -- new
  v_velocity int; -- new
  v_rarity_label varchar; -- new 
  v_times_unlocked int; -- new
  v_first_unlock varchar; -- new 
  v_pack_name varchar; -- new, still show the first unlick if it's repeated or new value*/
  
  -- Full DisplayWonCard info w function values 
  v_i int; -- Index for the card slot
  v_random int; -- Random num for luck
  v_luck_rarity int; -- Card rarity classification that will be selected based on luck
  v_user_credits int; -- Cost of the pack updated credits 
  v_random_case int; -- Case 1 found direct match, case 2 any belonging to that pack, case 3 any card ultimate worst case
BEGIN
  -- Find how many cards this pack has and now also looking for cost
  SELECT 
    p.num_cards,
    p.cost
  INTO 
    v_num_cards, -- Adds to var
    v_pack_cost
  FROM pack p
  WHERE p.pack_id = p_pack;

  -- The pack was not found, then says it dne 
  IF v_num_cards IS NULL OR v_pack_cost IS NULL THEN
    RAISE EXCEPTION 'Pack % not found', p_pack;
  END IF;

  -- Find user credits
  SELECT 
    credits
  INTO 
    v_user_credits
  FROM user_laker
  WHERE user_id = p_user_id; 

  -- Checks that it did find money for that user aka does exist
  IF v_user_credits IS NULL THEN 
    RAISE EXCEPTION 'User was not found'; -- Es pobre! En web tendré q ver q algo null es no les alcanza
  END IF; 

  -- Now check if they can also afford it
  IF v_user_credits < v_pack_cost THEN 
    RAISE EXCEPTION 'User does not have enough money'; -- Es pobre! En web tendré q ver q algo null es no les alcanza
  END IF; 

  -- Can afford it, les cobra
  UPDATE user_laker
  SET credits = credits - v_pack_cost
  WHERE user_id = p_user_id;
  v_user_credits := v_user_credits - v_pack_cost; 

  -- Loop once per card slot
  FOR v_i IN 1..v_num_cards LOOP
    -- Reset vals
    luck := NULL; -- The num that was generated 
    luck_rarity_id := NULL; 
    --won_card_id := NULL;
    player_name := NULL;
    
    -- Generate a random variable 
    v_random := floor(random() * 100 + 1)::int;

    -- Find out which type of card corresponds to luck
    SELECT x.rarity_id -- Card rarity using x
    INTO v_luck_rarity
    -- Subquery to get the weights 
    FROM (
      SELECT 
        pr.rarity_id,
        SUM(pr.weight) OVER (ORDER BY pr.rarity_id) AS cat_total_weight -- Obtains the total weights per rarity id number to find if rand num fits within the range bucket 
      FROM pack_rarity pr
      JOIN pack p ON p.pack_type_id = pr.pack_type_id -- Links pack to its rarity  
      WHERE p.pack_id = p_pack -- And only checks that current being opened pack
    ) x 
    WHERE v_random <= x.cat_total_weight
    ORDER BY x.cat_total_weight
    LIMIT 1;

    -- Case 1: Pick one random card with selected rarity that corresponds to pack being analyzed; fallback any from that pack
    SELECT 
      pc.card_id,
      1 AS "random_case"
    INTO 
      v_won_card_id,
      v_random_case
    FROM pack_card pc
    JOIN card c ON pc.card_id = c.card_id -- Link to specific card
    WHERE pc.pack_id = p_pack
      AND c.rarity_id = v_luck_rarity -- Gets a card that is linked to it first priority
    ORDER BY random() -- Still order random in case multiple cards w same rarity
    LIMIT 1;

    -- Case 2: Bakcup no cards matched, picks any card that is defined as belonging to that pack
    IF v_won_card_id IS NULL THEN
      SELECT 
        pc.card_id,
        2 AS "random_case"
      INTO 
        v_won_card_id,
        v_random_case
      FROM pack_card pc
      JOIN card c ON pc.card_id = c.card_id -- Link to specific card to get the card info
      WHERE pc.pack_id = p_pack -- Links the pack_cards to the pack that is being opened
      ORDER BY random()
      LIMIT 1;
    END IF; 

    -- Case 3: No cards in that pack, picks any w matching rarity 
    IF v_won_card_id IS NULL THEN
      SELECT 
        pc.card_id, 
        3 AS "random_case"
      INTO 
        v_won_card_id, 
        v_random_case
      FROM pack_card pc
      JOIN card c ON pc.card_id = c.card_id -- Link to specific card to get its info
      WHERE c.rarity_id = v_luck_rarity
      ORDER BY random()
      LIMIT 1;
    END IF; 

    -- Case 4: Absolute worst case picks from any but this is like database is designed wrong should never happen
    IF v_won_card_id IS NULL THEN
      SELECT 
        pc.card_id, 
        4 AS "random_case"
      INTO 
        v_won_card_id, 
        v_random_case
      FROM pack_card pc
      JOIN card c ON pc.card_id = c.card_id -- Link to specific card to get its info
      ORDER BY random()
      LIMIT 1;
    END IF; 

    -- Link to update user count 
    IF EXISTS (
      SELECT 1 
      FROM user_card uc
      WHERE uc.user_id = p_user_id -- Checks if user already has a record
        AND uc.card_id = v_won_card_id -- Linked to that card 
      )
    THEN
    -- Updates the counter 
      UPDATE user_card uc
      SET times_unlocked = uc.times_unlocked + 1
      WHERE uc.user_id = p_user_id -- Checks if user already has a record
        AND uc.card_id = v_won_card_id; -- Linked to that card  
    ELSE 
    -- Otherwise inserts new card registration
      INSERT INTO user_card 
        (user_id, card_id, first_pack_id, times_unlocked, first_unlock) 
      VALUES
        (p_user_id, v_won_card_id, p_pack, 1, now()); 
    END IF; 

    -- Now w all the final values, gets the actual card statement
    SELECT
      c.card_id,
      c.player_name,
      c.web_url,
      c.attack,
      c.defense,
      c.velocity,
      c.rarity_id,
      r.name,
      uc.times_unlocked,
      uc.first_unlock,
      p.name
    INTO 
      card_id,
      player_name,
      web_url,
      attack,
      defense,
      velocity,
      rarity_id,
      rarity_label,
      times_unlocked,
      first_unlock,
      pack_name
    FROM card c 
    JOIN rarity r ON c.rarity_id = r.rarity_id 
    -- Check unlock info for card won by the user 
    JOIN user_card uc ON c.card_id = uc.card_id AND uc.user_id = p_user_id 
    JOIN pack p ON uc.first_pack_id = p.pack_id
    WHERE c.card_id = v_won_card_id; 

    card_slot := v_i;
    luck := v_random; -- The num that was generated 
    luck_rarity_id := v_luck_rarity; -- Just to see what supposed to get
    updated_credits := v_user_credits; -- Va a estar feo pero ps nimodo
    random_case := v_random_case;
    RETURN NEXT; -- Re-runs 
  END LOOP;
  RETURN;
END;
$$;


ALTER FUNCTION "public"."randomize_display_cards"("p_pack" integer, "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."swap_deck_card"("p_wishlist_id" integer, "p_deck_id" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$BEGIN
  -- Validar carta wishlist
  IF NOT EXISTS (
    SELECT 1 FROM user_card
    WHERE user_card_id = p_wishlist_id
      AND user_id = auth.uid()
      AND added_deck = true
      AND in_deck = false
  ) THEN
    RAISE EXCEPTION 'La carta wishlist no es válida o no pertenece al usuario.';
  END IF;

  -- Validar carta del deck
  IF NOT EXISTS (
    SELECT 1 FROM user_card
    WHERE user_card_id = p_deck_id
      AND user_id = auth.uid()
      AND added_deck = true
      AND in_deck = true
  ) THEN
    RAISE EXCEPTION 'La carta del deck no es válida o no pertenece al usuario.';
  END IF;

  -- Primero sacar la carta del deck (baja a false) para no chocar con el limite de 6
  UPDATE user_card SET in_deck = false WHERE user_card_id = p_deck_id;

  -- Luego meter la carta del wishlist
  UPDATE user_card SET in_deck = true WHERE user_card_id = p_wishlist_id;
END;$$;


ALTER FUNCTION "public"."swap_deck_card"("p_wishlist_id" integer, "p_deck_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_added_deck"("p_user_card_id" bigint, "p_user_id" "uuid", "p_added" boolean) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE user_card SET added_deck = p_added WHERE user_card_id = p_user_card_id AND user_id = p_user_id; 
END; 
$$;


ALTER FUNCTION "public"."update_added_deck"("p_user_card_id" bigint, "p_user_id" "uuid", "p_added" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_added_deck_checks"("p_user_card_id" bigint, "p_user_id" "uuid", "p_added" boolean) RETURNS TABLE("success" boolean, "message" "text", "added_deck" boolean, "in_deck" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$ 
DECLARE
  v_current_added boolean; 
  v_current_in_deck boolean; 
  v_added_count integer; -- User must have at least six in added_deck 
BEGIN
  -- Get current state of card 
  SELECT 
    uc.added_deck,
    uc.in_deck
  INTO 
    v_current_added, 
    v_current_in_deck
  FROM user_card uc
  WHERE uc.user_card_id = p_user_card_id AND uc.user_id = p_user_id;

  -- Found nothing, returns an error
  IF v_current_added IS NULL AND v_current_in_deck IS NULL THEN
    RETURN QUERY 
    SELECT false, 'Card not found for this user', false, false; -- Should never happen pero por si acaso
    RETURN; 
  END IF; 

  -- Updating from added false -> true, we chilling does without checking extra stuff
  IF p_added = true THEN 
    UPDATE user_card SET added_deck = true 
    WHERE user_card_id = p_user_card_id AND user_id = p_user_id; 

    -- Message for front-end
    RETURN QUERY 
    SELECT true, 'Card added to Dunk Royale bench', true, v_current_in_deck; -- second should be false btw
    RETURN; 
  END IF; 

  -- Now longer check if changing from true -> false
  IF p_added = false THEN 
    -- Card is active in deck, user must remove it first 
    IF v_current_in_deck = true THEN 
      RETURN QUERY
      SELECT false, 'Remove from Dunk Royale deck first', v_current_added, v_current_in_deck; 
      RETURN; 
    END IF; 

    -- Check that user does have six other cards established in their deck
    SELECT 
      COUNT(*) 
    INTO 
      v_added_count
    FROM user_card uc
    WHERE uc.user_id = p_user_id AND uc.added_deck = true; 

    IF v_added_count <= 6 THEN 
      RETURN QUERY
      SELECT false, 'You must have six cards in your Dunk Royale bench, add another one before removing this one', v_current_added, v_current_in_deck; 
      RETURN; 
    END IF; 

    -- Now finally the card can be removed
    UPDATE user_card SET added_deck = false WHERE user_card_id = p_user_card_id AND user_id = p_user_id; 

    RETURN QUERY
    SELECT true, 'Card removed from Dunk Royale bench', false, false; 
    RETURN; 
  END IF; 
END; 
$$;


ALTER FUNCTION "public"."update_added_deck_checks"("p_user_card_id" bigint, "p_user_id" "uuid", "p_added" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_matchups"("p_question_id" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$ BEGIN -- 1. Calcular winners 
UPDATE matchup m SET winner_id = sub.winner_id FROM ( SELECT m.matchup_id, CASE WHEN COUNT(*) FILTER (WHERE uv.selected_id = m.answer_a_id) > COUNT(*) FILTER (WHERE uv.selected_id = m.answer_b_id) THEN m.answer_a_id WHEN COUNT(*) FILTER (WHERE uv.selected_id = m.answer_b_id) > COUNT(*) FILTER (WHERE uv.selected_id = m.answer_a_id) THEN m.answer_b_id ELSE ( CASE --desempate random 
WHEN random() < 0.5 THEN m.answer_a_id ELSE m.answer_b_id END ) END AS winner_id FROM matchup m LEFT JOIN user_vote uv ON uv.matchup_id = m.matchup_id WHERE m.question_id = p_question_id AND m.active = true AND m.answer_a_id IS NOT NULL AND m.answer_b_id IS NOT NULL GROUP BY m.matchup_id, m.answer_a_id, m.answer_b_id ) sub WHERE m.matchup_id = sub.matchup_id; -- 2. Desactivar la ronda activa 
UPDATE matchup SET active = false WHERE question_id = p_question_id AND active = true; END; $$;


ALTER FUNCTION "public"."update_matchups"("p_question_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_rewards"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.user_laker
  SET
    credits = credits + NEW.credits_earned,
    crowns  = crowns  + CASE WHEN NEW.won THEN 1 ELSE 0 END
  WHERE user_id = NEW.player_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_rewards"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "simulacion_juego"."get_agenda_games"("p_year" integer, "p_month" integer) RETURNS TABLE("game_id" integer, "opposing_team_id" integer, "home" boolean, "start_date" timestamp with time zone, "logo_url" "text", "lakers_score" bigint, "opposite_score" bigint)
    LANGUAGE "sql"
    AS $$
  SELECT 
  -- Basic game details
  g.game_id,
  g.opposing_team_id,
  g.home,
  g.start_date,
  -- Opp team logo
  t.logo_url,
  -- Calc scores
  -- Lakers
  SUM(CASE
    WHEN tp.team_id = 1 THEN tps.points -- lakers always team id 1
    ELSE 0 -- Should always be 0 based on table def
  END) AS lakers_score,
  -- Opp team score
  SUM(CASE
    WHEN tp.team_id = g.opposing_team_id THEN tps.points
    ELSE 0
  END) AS opposite_score

  FROM simulacion_juego.game g
  -- Now bunch of stuff to link the game to ind players stats per game 
  JOIN simulacion_juego.team t ON t.team_id = g.opposing_team_id
  JOIN simulacion_juego.team_player_stats tps ON tps.game_id = g.game_id
  JOIN simulacion_juego.team_player tp ON tp.team_player_id = tps.team_player_id
  -- Date filtering within range 
  WHERE g.start_date >= make_date(p_year, p_month, 1)
    AND g.start_date < (make_date(p_year, p_month, 1) + INTERVAL '1 month') -- Here takes curr dates and adds a month so it'd be 2026-05-01 I think today it's month 04
  -- Must be same as selects cause sql is like that ig
  GROUP BY
    g.game_id,
    g.opposing_team_id,
    g.home,
    g.start_date,
    t.logo_url
  ORDER BY g.start_date; -- Ordering to show older to newer to hopefully make partition easier
$$;


ALTER FUNCTION "simulacion_juego"."get_agenda_games"("p_year" integer, "p_month" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "simulacion_juego"."get_last_game_id"() RETURNS integer
    LANGUAGE "sql"
    AS $$
  select coalesce((
    select g.game_id
    from simulacion_juego.game g
    where g.game_end_time < now()
    order by g.game_end_time desc
    limit 1
  ), 0);
$$;


ALTER FUNCTION "simulacion_juego"."get_last_game_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "simulacion_juego"."get_player_seasons"("p_team_player_id" integer) RETURNS TABLE("season_start" integer)
    LANGUAGE "sql"
    AS $$
    SELECT DISTINCT
        v.season_start
    FROM simulacion_juego.view_player_season_average v
    WHERE v.team_player_id = p_team_player_id
    ORDER BY v.season_start DESC;
$$;


ALTER FUNCTION "simulacion_juego"."get_player_seasons"("p_team_player_id" integer) OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."achievement" (
    "achievement_id" bigint NOT NULL,
    "icon" character varying NOT NULL,
    "title" character varying NOT NULL,
    "description" character varying NOT NULL,
    "criteria_type" character varying,
    "criteria_value" integer
);


ALTER TABLE "public"."achievement" OWNER TO "postgres";


ALTER TABLE "public"."achievement" ALTER COLUMN "achievement_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."achievement_achievement_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."answer" (
    "answer_id" integer NOT NULL,
    "question_id" integer NOT NULL,
    "answer_text" "text" NOT NULL
);


ALTER TABLE "public"."answer" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."answer_answer_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."answer_answer_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."answer_answer_id_seq" OWNED BY "public"."answer"."answer_id";



CREATE TABLE IF NOT EXISTS "public"."bad_words" (
    "id" integer NOT NULL,
    "word" "text" NOT NULL,
    "category" "text" DEFAULT 'general'::"text",
    "language" "text" DEFAULT 'es'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."bad_words" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."bad_words_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."bad_words_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."bad_words_id_seq" OWNED BY "public"."bad_words"."id";



CREATE TABLE IF NOT EXISTS "public"."card" (
    "card_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "player_name" character varying NOT NULL,
    "web_url" character varying,
    "pixel_url" character varying,
    "attack" smallint DEFAULT '50'::smallint NOT NULL,
    "defense" smallint DEFAULT '50'::smallint NOT NULL,
    "velocity" smallint DEFAULT '2'::smallint NOT NULL,
    "rarity_id" bigint,
    "sprite_id" bigint DEFAULT '1'::bigint NOT NULL,
    "gatorade_cost" smallint DEFAULT '2'::smallint NOT NULL
);


ALTER TABLE "public"."card" OWNER TO "postgres";


COMMENT ON COLUMN "public"."card"."rarity_id" IS 'Rareness type of this card';



CREATE TABLE IF NOT EXISTS "public"."conversation" (
    "conversation_id" bigint NOT NULL,
    "friendship_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."conversation" OWNER TO "postgres";


ALTER TABLE "public"."conversation" ALTER COLUMN "conversation_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."conversation_conversation_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."court" (
    "court_id" bigint NOT NULL,
    "name" character varying DEFAULT ''::character varying NOT NULL,
    "direction" character varying DEFAULT ''::character varying NOT NULL,
    "longitude" real NOT NULL,
    "latitude" real NOT NULL,
    "allow_court" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."court" OWNER TO "postgres";


ALTER TABLE "public"."court" ALTER COLUMN "court_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."court_court_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."deck" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "card_id" "uuid" NOT NULL
);


ALTER TABLE "public"."deck" OWNER TO "postgres";


ALTER TABLE "public"."deck" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."deck_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."event" (
    "event_id" bigint NOT NULL,
    "event_name" character varying NOT NULL,
    "date" timestamp with time zone NOT NULL,
    "max_players" smallint NOT NULL,
    "min_age" smallint,
    "max_age" smallint,
    "allow_event" boolean DEFAULT true NOT NULL,
    "court_id" bigint,
    "skill_level_id" bigint,
    "created_user_id" "uuid",
    "event_status_id" smallint DEFAULT 1 NOT NULL,
    "female_event" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event" OWNER TO "postgres";


ALTER TABLE "public"."event" ALTER COLUMN "event_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."event_event_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."event_participant" (
    "event_participant_id" bigint NOT NULL,
    "event_id" bigint,
    "user_id" "uuid"
);


ALTER TABLE "public"."event_participant" OWNER TO "postgres";


ALTER TABLE "public"."event_participant" ALTER COLUMN "event_participant_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."event_participant_event_participant_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."event_report" (
    "ereport_id" bigint NOT NULL,
    "event_id" bigint NOT NULL,
    "reporter_user_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "comment" "text" NOT NULL,
    "priority" "text" DEFAULT 'Low'::"text" NOT NULL,
    "status" "text" DEFAULT 'Pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "report_type" bigint NOT NULL,
    "key_words" "text"[]
);


ALTER TABLE "public"."event_report" OWNER TO "postgres";


ALTER TABLE "public"."event_report" ALTER COLUMN "ereport_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."event_report_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."event_report_type" (
    "report_id" bigint NOT NULL,
    "report_type" character varying(100) NOT NULL
);


ALTER TABLE "public"."event_report_type" OWNER TO "postgres";


ALTER TABLE "public"."event_report_type" ALTER COLUMN "report_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."event_report_type_report_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."event_status" (
    "event_status_id" smallint NOT NULL,
    "status_name" character varying NOT NULL
);


ALTER TABLE "public"."event_status" OWNER TO "postgres";


ALTER TABLE "public"."event_status" ALTER COLUMN "event_status_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."event_status_event_status_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."friend_request" (
    "friend_request_id" bigint NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "receiver_id" "uuid" NOT NULL,
    "status" character varying DEFAULT 'pending'::character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."friend_request" OWNER TO "postgres";


ALTER TABLE "public"."friend_request" ALTER COLUMN "friend_request_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."friend_request_friend_request_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."friendship" (
    "friendship_id" bigint NOT NULL,
    "user1" "uuid" NOT NULL,
    "user2" "uuid" DEFAULT "gen_random_uuid"(),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."friendship" OWNER TO "postgres";


ALTER TABLE "public"."friendship" ALTER COLUMN "friendship_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."friendship_friendship_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."game" (
    "game_id" integer NOT NULL,
    "opposing_team_id" integer NOT NULL,
    "home" boolean NOT NULL,
    "attended" integer,
    "venue" character varying(250) NOT NULL,
    "start_date" timestamp with time zone NOT NULL,
    "current_quarter_start" timestamp with time zone,
    "current_quarter" integer DEFAULT 0 NOT NULL,
    "game_end_time" timestamp with time zone,
    "defense" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."game" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."game_game_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."game_game_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."game_game_id_seq" OWNED BY "public"."game"."game_id";



CREATE TABLE IF NOT EXISTS "public"."gender" (
    "gender_id" smallint NOT NULL,
    "gender" character varying NOT NULL
);


ALTER TABLE "public"."gender" OWNER TO "postgres";


ALTER TABLE "public"."gender" ALTER COLUMN "gender_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."gender_gender_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."instructions" (
    "id" bigint NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "image" character varying NOT NULL
);


ALTER TABLE "public"."instructions" OWNER TO "postgres";


ALTER TABLE "public"."instructions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."instructions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."jersey_sprite" (
    "jersey_sprite_id" bigint NOT NULL,
    "name" character varying NOT NULL
);


ALTER TABLE "public"."jersey_sprite" OWNER TO "postgres";


ALTER TABLE "public"."jersey_sprite" ALTER COLUMN "jersey_sprite_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."jersey_sprite_jersey_sprite_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."matchup" (
    "matchup_id" integer NOT NULL,
    "question_id" integer NOT NULL,
    "round" integer NOT NULL,
    "position" integer,
    "answer_a_id" integer,
    "answer_b_id" integer,
    "winner_id" integer,
    "parent_a_id" integer,
    "parent_b_id" integer,
    "active" boolean DEFAULT false
);


ALTER TABLE "public"."matchup" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."matchup_matchup_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."matchup_matchup_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."matchup_matchup_id_seq" OWNED BY "public"."matchup"."matchup_id";



CREATE TABLE IF NOT EXISTS "public"."message" (
    "message_id" bigint NOT NULL,
    "conversation_id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "message" "text" NOT NULL,
    "sent" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."message" OWNER TO "postgres";


ALTER TABLE "public"."message" ALTER COLUMN "message_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."message_message_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."minigame_match" (
    "match_id" bigint NOT NULL,
    "player_id" "uuid" NOT NULL,
    "player_score" smallint DEFAULT 0 NOT NULL,
    "npc_score" smallint DEFAULT 0 NOT NULL,
    "won" boolean DEFAULT false NOT NULL,
    "credits_earned" smallint DEFAULT 0 NOT NULL,
    "played_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "opposing_team_id" integer
);


ALTER TABLE "public"."minigame_match" OWNER TO "postgres";


COMMENT ON COLUMN "public"."minigame_match"."opposing_team_id" IS 'Equipo rival del partido activo cuando se jugó esta partida. FK a simulacion_juego.team.';



ALTER TABLE "public"."minigame_match" ALTER COLUMN "match_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."minigame_match_match_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."news" (
    "news_id" integer NOT NULL,
    "title" character varying(250) NOT NULL,
    "news_url" character varying(200) NOT NULL,
    "news_category" integer NOT NULL,
    "photo_url" character varying(255) NOT NULL,
    "date_posted" timestamp with time zone NOT NULL
);


ALTER TABLE "public"."news" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."news_category" (
    "news_category_id" integer NOT NULL,
    "description" character varying(50)
);


ALTER TABLE "public"."news_category" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."news_news_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."news_news_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."news_news_id_seq" OWNED BY "public"."news"."news_id";



CREATE TABLE IF NOT EXISTS "public"."npc_archetype" (
    "npc_archetype_id" bigint NOT NULL,
    "npc_team_id" bigint NOT NULL,
    "archetype_name" character varying NOT NULL,
    "base_attack" smallint DEFAULT 50 NOT NULL,
    "base_defense" smallint DEFAULT 50 NOT NULL,
    "base_velocity" smallint DEFAULT 2 NOT NULL,
    "gatorade_cost" smallint DEFAULT 3 NOT NULL,
    "weight" smallint DEFAULT 1 NOT NULL
);


ALTER TABLE "public"."npc_archetype" OWNER TO "postgres";


ALTER TABLE "public"."npc_archetype" ALTER COLUMN "npc_archetype_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."npc_archetype_npc_archetype_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."npc_difficulty_config" (
    "config_id" bigint NOT NULL,
    "npc_team_id" bigint NOT NULL,
    "player_power_min" smallint DEFAULT 0 NOT NULL,
    "player_power_max" smallint DEFAULT 100 NOT NULL,
    "attack_mult" numeric(4,2) DEFAULT 1.0 NOT NULL,
    "defense_mult" numeric(4,2) DEFAULT 1.0 NOT NULL,
    "velocity_mult" numeric(4,2) DEFAULT 1.0 NOT NULL,
    "spawn_interval_min" numeric(4,1) DEFAULT 5.0 NOT NULL,
    "spawn_interval_max" numeric(4,1) DEFAULT 10.0 NOT NULL,
    "max_npc_on_court" smallint DEFAULT 3 NOT NULL,
    "label" character varying
);


ALTER TABLE "public"."npc_difficulty_config" OWNER TO "postgres";


ALTER TABLE "public"."npc_difficulty_config" ALTER COLUMN "config_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."npc_difficulty_config_config_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."npc_team" (
    "npc_team_id" bigint NOT NULL,
    "sim_team_id" integer NOT NULL,
    "jersey_sprite_id" bigint NOT NULL
);


ALTER TABLE "public"."npc_team" OWNER TO "postgres";


ALTER TABLE "public"."npc_team" ALTER COLUMN "npc_team_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."npc_team_npc_team_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."pack" (
    "pack_id" bigint NOT NULL,
    "pack_type_id" bigint NOT NULL,
    "name" character varying NOT NULL,
    "cost" smallint DEFAULT '0'::smallint NOT NULL,
    "num_cards" smallint DEFAULT '1'::smallint NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."pack" OWNER TO "postgres";


COMMENT ON TABLE "public"."pack" IS 'Describes the pack itself that is shown in the store';



CREATE TABLE IF NOT EXISTS "public"."pack_card" (
    "pack_card_id" bigint NOT NULL,
    "pack_id" bigint NOT NULL,
    "card_id" "uuid" NOT NULL
);


ALTER TABLE "public"."pack_card" OWNER TO "postgres";


COMMENT ON TABLE "public"."pack_card" IS 'Which pack has which cards';



ALTER TABLE "public"."pack_card" ALTER COLUMN "pack_card_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."pack_card_pack_card_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."pack" ALTER COLUMN "pack_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."pack_pack_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."pack_rarity" (
    "pack_rarity_id" bigint NOT NULL,
    "pack_type_id" bigint NOT NULL,
    "rarity_id" bigint NOT NULL,
    "weight" smallint DEFAULT '0'::smallint NOT NULL
);


ALTER TABLE "public"."pack_rarity" OWNER TO "postgres";


COMMENT ON TABLE "public"."pack_rarity" IS 'Used to determine probability of getting each type of card in a specified pack';



ALTER TABLE "public"."pack_rarity" ALTER COLUMN "pack_rarity_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."pack_rarity_pack_rarity_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."pack_type" (
    "pack_type_id" bigint NOT NULL,
    "name" character varying NOT NULL,
    "closed_URL" character varying,
    "tear_URL" character varying,
    "opening_URL" character varying
);


ALTER TABLE "public"."pack_type" OWNER TO "postgres";


COMMENT ON TABLE "public"."pack_type" IS 'Determines what types of packs are present';



COMMENT ON COLUMN "public"."pack_type"."closed_URL" IS 'Default pack image';



COMMENT ON COLUMN "public"."pack_type"."tear_URL" IS 'Image 2 of pack opening';



COMMENT ON COLUMN "public"."pack_type"."opening_URL" IS 'Pack was opened';



ALTER TABLE "public"."pack_type" ALTER COLUMN "pack_type_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."pack_type_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."question" (
    "question_id" integer NOT NULL,
    "question_text" "text" NOT NULL,
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone NOT NULL,
    "winner" "text"
);


ALTER TABLE "public"."question" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."question_question_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."question_question_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."question_question_id_seq" OWNED BY "public"."question"."question_id";



CREATE TABLE IF NOT EXISTS "public"."rarity" (
    "rarity_id" bigint NOT NULL,
    "name" character varying NOT NULL
);


ALTER TABLE "public"."rarity" OWNER TO "postgres";


COMMENT ON TABLE "public"."rarity" IS 'Card rarity (common, rare, legendary, limited time)';



ALTER TABLE "public"."rarity" ALTER COLUMN "rarity_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."rarity_rarity_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."report_type" (
    "report_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "report_type" "text" NOT NULL
);


ALTER TABLE "public"."report_type" OWNER TO "postgres";


ALTER TABLE "public"."report_type" ALTER COLUMN "report_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."report_type_report_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."scope" (
    "id" bigint NOT NULL,
    "scope" "text" NOT NULL
);


ALTER TABLE "public"."scope" OWNER TO "postgres";


ALTER TABLE "public"."scope" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."scope_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."skill_level" (
    "skill_level_id" bigint NOT NULL,
    "description" character varying NOT NULL
);


ALTER TABLE "public"."skill_level" OWNER TO "postgres";


ALTER TABLE "public"."skill_level" ALTER COLUMN "skill_level_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."skill_level_skill_level_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."sprite" (
    "sprite_id" bigint NOT NULL,
    "name" character varying NOT NULL
);


ALTER TABLE "public"."sprite" OWNER TO "postgres";


COMMENT ON TABLE "public"."sprite" IS 'Store the names of the player sprites to use based on the card';



ALTER TABLE "public"."sprite" ALTER COLUMN "sprite_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."sprite_sprite_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."team" (
    "team_id" integer NOT NULL,
    "team_name" character varying(100) NOT NULL,
    "logo_url" character varying(200) NOT NULL
);


ALTER TABLE "public"."team" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."team_player" (
    "team_player_id" integer NOT NULL,
    "first_name" character varying(50) NOT NULL,
    "last_name" character varying(50) NOT NULL,
    "team_id" integer NOT NULL,
    "photo_url" character varying(200)
);


ALTER TABLE "public"."team_player" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."team_player_stats" (
    "team_player_stats_id" integer NOT NULL,
    "game_id" integer NOT NULL,
    "team_player_id" integer NOT NULL,
    "minutes" interval NOT NULL,
    "points" smallint DEFAULT 0 NOT NULL,
    "rebounds" smallint DEFAULT 0 NOT NULL,
    "assists" smallint,
    "steals" smallint DEFAULT 0 NOT NULL,
    "turnovers" smallint DEFAULT 0 NOT NULL,
    "field_made" smallint,
    "field_attempted" smallint
);


ALTER TABLE "public"."team_player_stats" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."team_player_stats_team_player_stats_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."team_player_stats_team_player_stats_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."team_player_stats_team_player_stats_id_seq" OWNED BY "public"."team_player_stats"."team_player_stats_id";



CREATE SEQUENCE IF NOT EXISTS "public"."team_player_team_player_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."team_player_team_player_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."team_player_team_player_id_seq" OWNED BY "public"."team_player"."team_player_id";



ALTER TABLE "public"."team_player" ALTER COLUMN "team_player_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."team_player_team_player_id_seq1"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE OR REPLACE VIEW "public"."team_stats_comparision" AS
 SELECT "tps"."game_id",
    "tp"."team_id",
    "sum"("tps"."points") AS "total_points",
    "sum"("tps"."rebounds") AS "total_rebounds",
    "sum"("tps"."assists") AS "total_assists",
    "sum"("tps"."steals") AS "total_steals",
    "sum"("tps"."turnovers") AS "total_turnovers",
    "sum"("tps"."field_made") AS "total_field_made",
    "sum"("tps"."field_attempted") AS "total_field_attempted"
   FROM ("public"."team_player_stats" "tps"
     JOIN "public"."team_player" "tp" ON (("tps"."team_player_id" = "tp"."team_player_id")))
  GROUP BY "tps"."game_id", "tp"."team_id";


ALTER VIEW "public"."team_stats_comparision" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."team_team_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."team_team_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."team_team_id_seq" OWNED BY "public"."team"."team_id";



CREATE TABLE IF NOT EXISTS "public"."tips" (
    "id" bigint NOT NULL,
    "description" "text" NOT NULL,
    "image" "text"
);


ALTER TABLE "public"."tips" OWNER TO "postgres";


ALTER TABLE "public"."tips" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."tips_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."user_achievement" (
    "user_id" "uuid" NOT NULL,
    "achievement_id" bigint NOT NULL,
    "date_unlocked" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_achievement" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_card" (
    "user_card_id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "card_id" "uuid" NOT NULL,
    "first_pack_id" bigint NOT NULL,
    "times_unlocked" integer DEFAULT 1 NOT NULL,
    "first_unlock" timestamp with time zone DEFAULT "now"() NOT NULL,
    "added_deck" boolean DEFAULT false NOT NULL,
    "in_deck" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."user_card" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_card" IS 'Collection of user cards and their collection, uses user_id, the card unlocked, which pack  and time first unlock, and times_unlocked to allow "card stacking"';



COMMENT ON COLUMN "public"."user_card"."added_deck" IS 'Whether the user has added that card to their game deck to use in Dunk Royale';



COMMENT ON COLUMN "public"."user_card"."in_deck" IS 'True si la carta está actualmente activa en el deck (máx 6). added_deck=true e in_deck=false significa lista de espera.';



ALTER TABLE "public"."user_card" ALTER COLUMN "user_card_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."user_card_user_card_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."user_event" (
    "user_event_id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "event_id" bigint NOT NULL,
    "result" boolean,
    "user_score" smallint,
    "opponent_score" smallint,
    "points" smallint,
    "rebounds" smallint,
    "assists" smallint,
    "rated_others" boolean DEFAULT false NOT NULL,
    "field_goals" double precision,
    "field_goals_attempts" integer,
    "tre_pointer" real,
    "tre_pointer_atemp" bigint,
    "steals" smallint,
    "blocks" smallint,
    CONSTRAINT "user_event_field_goals_attempts_check" CHECK ((("field_goals_attempts")::double precision >= (0)::double precision)),
    CONSTRAINT "user_event_field_goals_check" CHECK (("field_goals" >= (0)::double precision)),
    CONSTRAINT "user_event_tre_pointer_atemp_check" CHECK (("tre_pointer_atemp" >= 0)),
    CONSTRAINT "user_event_tre_pointer_check" CHECK (("tre_pointer" >= (0.0)::double precision))
);


ALTER TABLE "public"."user_event" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_event_ratings" (
    "user_event_rating_id" bigint NOT NULL,
    "user_event_id" bigint NOT NULL,
    "rated_user_id" "uuid" NOT NULL,
    "rating" numeric(3,2) NOT NULL,
    "date_rated" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_event_ratings_rating_check" CHECK ((("rating" >= 0.00) AND ("rating" <= 5.00)))
);


ALTER TABLE "public"."user_event_ratings" OWNER TO "postgres";


ALTER TABLE "public"."user_event_ratings" ALTER COLUMN "user_event_rating_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."user_event_ratings_user_event_rating_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."user_event" ALTER COLUMN "user_event_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."user_event_user_event_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."user_laker" (
    "user_id" "uuid" NOT NULL,
    "user_type" smallint DEFAULT '0'::smallint NOT NULL,
    "birthdate" "date",
    "nickname" character varying,
    "username" character varying,
    "photo_url" character varying,
    "gender" smallint,
    "credits" bigint DEFAULT '0'::bigint,
    "crowns" bigint DEFAULT '0'::bigint,
    "allow_lakers_court" boolean,
    "notifications" boolean,
    "online" boolean,
    "reputation" numeric DEFAULT 0,
    "banned_until" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "last_seen" timestamp with time zone
);


ALTER TABLE "public"."user_laker" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_report" (
    "ureport_id" bigint NOT NULL,
    "event_id" bigint NOT NULL,
    "reported_user_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "reporter_user_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "comment" "text" NOT NULL,
    "priority" "text" DEFAULT 'Low'::"text" NOT NULL,
    "status" "text" DEFAULT 'Pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "key_words" "text"[],
    "report_type" bigint,
    "sentiment_score" bigint,
    "sentiment_type" "text"
);


ALTER TABLE "public"."user_report" OWNER TO "postgres";


ALTER TABLE "public"."user_report" ALTER COLUMN "ureport_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."user_report_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."user_type" (
    "user_type_id" smallint NOT NULL,
    "user_type_title" character varying NOT NULL
);


ALTER TABLE "public"."user_type" OWNER TO "postgres";


ALTER TABLE "public"."user_type" ALTER COLUMN "user_type_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."user_type_user_type_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."user_vote" (
    "id" integer NOT NULL,
    "matchup_id" integer NOT NULL,
    "selected_id" integer NOT NULL,
    "user_id" "uuid",
    "date_voted" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_vote" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."user_vote_id_seq1"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."user_vote_id_seq1" OWNER TO "postgres";


ALTER SEQUENCE "public"."user_vote_id_seq1" OWNED BY "public"."user_vote"."id";



CREATE OR REPLACE VIEW "public"."v_npc_config" AS
 SELECT "a"."npc_archetype_id",
    "nt"."sim_team_id",
    "js"."name" AS "jersey_sprite_name",
    "a"."archetype_name",
    "a"."weight",
    "a"."gatorade_cost",
    LEAST((("round"((("a"."base_attack")::numeric * "d"."attack_mult")))::smallint)::integer, 100) AS "final_attack",
    LEAST((("round"((("a"."base_defense")::numeric * "d"."defense_mult")))::smallint)::integer, 100) AS "final_defense",
    LEAST((("round"((("a"."base_velocity")::numeric * "d"."velocity_mult")))::smallint)::integer, 5) AS "final_velocity",
    "d"."spawn_interval_min",
    "d"."spawn_interval_max",
    "d"."max_npc_on_court",
    "d"."label" AS "difficulty_label",
    "d"."player_power_min",
    "d"."player_power_max"
   FROM ((("public"."npc_archetype" "a"
     JOIN "public"."npc_team" "nt" ON (("nt"."npc_team_id" = "a"."npc_team_id")))
     JOIN "public"."jersey_sprite" "js" ON (("js"."jersey_sprite_id" = "nt"."jersey_sprite_id")))
     JOIN "public"."npc_difficulty_config" "d" ON (("d"."npc_team_id" = "a"."npc_team_id")));


ALTER VIEW "public"."v_npc_config" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."view_player_stats" AS
 SELECT "tps"."team_player_stats_id",
    "tps"."game_id",
    "tps"."team_player_id",
    "tp"."photo_url",
    "concat"("tp"."first_name", ' ', "tp"."last_name") AS "full_name",
    "to_char"("tps"."minutes", 'MI:SS'::"text") AS "minutes",
    "tps"."points",
    "tps"."rebounds",
    "tps"."assists",
    "tps"."steals",
    "tps"."turnovers",
    "tps"."field_made",
    "tps"."field_attempted"
   FROM ("public"."team_player_stats" "tps"
     JOIN "public"."team_player" "tp" ON (("tps"."team_player_id" = "tp"."team_player_id")))
  WHERE ("tp"."team_id" = 1);


ALTER VIEW "public"."view_player_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."warn_type" (
    "warn_type_id" bigint NOT NULL,
    "message" "text" NOT NULL,
    "warn_type" "text" NOT NULL,
    "scope_id" bigint DEFAULT '1'::bigint NOT NULL
);


ALTER TABLE "public"."warn_type" OWNER TO "postgres";


ALTER TABLE "public"."warn_type" ALTER COLUMN "warn_type_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."warn_type_warn_type_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."warning" (
    "warning_id" bigint NOT NULL,
    "user_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "report_id" bigint,
    "custom_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "warn_type_id" bigint
);


ALTER TABLE "public"."warning" OWNER TO "postgres";


ALTER TABLE "public"."warning" ALTER COLUMN "warning_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."warning_warning_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."wrap_backgrounds" (
    "wrap_backgrounds_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "label" "text" NOT NULL,
    "poster_url" "text" NOT NULL,
    "display_order" integer DEFAULT 0
);


ALTER TABLE "public"."wrap_backgrounds" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "simulacion_juego"."device_tokens_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "simulacion_juego"."device_tokens_id_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "simulacion_juego"."device_tokens_watchos" (
    "device_token_id" integer DEFAULT "nextval"('"simulacion_juego"."device_tokens_id_seq"'::"regclass") NOT NULL,
    "device_token" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "simulacion_juego"."device_tokens_watchos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "simulacion_juego"."game" (
    "game_id" integer NOT NULL,
    "opposing_team_id" integer NOT NULL,
    "home" boolean NOT NULL,
    "attended" integer,
    "venue" character varying(250) NOT NULL,
    "start_date" timestamp with time zone NOT NULL,
    "current_quarter_start" timestamp with time zone,
    "current_quarter" integer DEFAULT 0 NOT NULL,
    "game_end_time" timestamp with time zone,
    "defense" boolean DEFAULT false NOT NULL,
    "won" boolean DEFAULT false NOT NULL
);


ALTER TABLE "simulacion_juego"."game" OWNER TO "postgres";


COMMENT ON COLUMN "simulacion_juego"."game"."won" IS 'Whether lakers won or lost the game';



CREATE SEQUENCE IF NOT EXISTS "simulacion_juego"."game_game_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "simulacion_juego"."game_game_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "simulacion_juego"."game_game_id_seq" OWNED BY "simulacion_juego"."game"."game_id";



CREATE TABLE IF NOT EXISTS "simulacion_juego"."team" (
    "team_id" integer NOT NULL,
    "team_name" character varying(100) NOT NULL,
    "logo_url" character varying(200) NOT NULL,
    "abreviatura" "text"
);


ALTER TABLE "simulacion_juego"."team" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "simulacion_juego"."team_player_stats" (
    "team_player_stats_id" integer NOT NULL,
    "game_id" integer NOT NULL,
    "team_player_id" integer NOT NULL,
    "minutes" interval NOT NULL,
    "points" smallint DEFAULT 0 NOT NULL,
    "rebounds" smallint DEFAULT 0 NOT NULL,
    "assists" smallint,
    "steals" smallint DEFAULT 0 NOT NULL,
    "turnovers" smallint DEFAULT 0 NOT NULL,
    "field_made" smallint,
    "field_attempted" smallint
);


ALTER TABLE "simulacion_juego"."team_player_stats" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "simulacion_juego"."team_player_stats_team_player_stats_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "simulacion_juego"."team_player_stats_team_player_stats_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "simulacion_juego"."team_player_stats_team_player_stats_id_seq" OWNED BY "simulacion_juego"."team_player_stats"."team_player_stats_id";



CREATE SEQUENCE IF NOT EXISTS "simulacion_juego"."team_player_team_player_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "simulacion_juego"."team_player_team_player_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "simulacion_juego"."team_player_team_player_id_seq" OWNED BY "simulacion_juego"."team_player"."team_player_id";



CREATE SEQUENCE IF NOT EXISTS "simulacion_juego"."team_team_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "simulacion_juego"."team_team_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "simulacion_juego"."team_team_id_seq" OWNED BY "simulacion_juego"."team"."team_id";



CREATE OR REPLACE VIEW "simulacion_juego"."v_fieldgoal" WITH ("security_invoker"='on') AS
 SELECT "g"."game_id",
    "round"(((("sum"("tps"."field_made"))::numeric / (NULLIF("sum"("tps"."field_attempted"), 0))::numeric) * (100)::numeric), 1) AS "fg_percentage"
   FROM (("simulacion_juego"."game" "g"
     JOIN "simulacion_juego"."team_player_stats" "tps" ON (("tps"."game_id" = "g"."game_id")))
     JOIN "simulacion_juego"."team_player" "tp" ON (("tp"."team_player_id" = "tps"."team_player_id")))
  WHERE (("g"."game_end_time" IS NULL) AND ("tp"."team_id" = 1))
  GROUP BY "g"."game_id";


ALTER VIEW "simulacion_juego"."v_fieldgoal" OWNER TO "postgres";


CREATE OR REPLACE VIEW "simulacion_juego"."v_marcador_activo" AS
 SELECT "g"."game_id",
    "t"."team_name" AS "lakers_name",
    "t"."logo_url" AS "lakers_logo",
    COALESCE("sum"(("tps"."points")::integer) FILTER (WHERE ("tp"."team_id" = 1)), (0)::bigint) AS "lakers_score",
    "g"."opposing_team_id",
    "ot"."team_name" AS "opposing_team_name",
    "ot"."logo_url" AS "opposing_team_logo",
    COALESCE("sum"(("tps"."points")::integer) FILTER (WHERE ("tp"."team_id" <> 1)), (0)::bigint) AS "opposing_score",
    "g"."home",
    "g"."start_date",
    (EXTRACT(epoch FROM ("now"() - "g"."start_date")))::integer AS "seconds_elapsed",
    "g"."venue",
    "g"."attended"
   FROM (((("simulacion_juego"."game" "g"
     JOIN "simulacion_juego"."team" "t" ON (("t"."team_id" = 1)))
     JOIN "simulacion_juego"."team" "ot" ON (("ot"."team_id" = "g"."opposing_team_id")))
     LEFT JOIN "simulacion_juego"."team_player_stats" "tps" ON (("tps"."game_id" = "g"."game_id")))
     LEFT JOIN "simulacion_juego"."team_player" "tp" ON (("tp"."team_player_id" = "tps"."team_player_id")))
  WHERE (("g"."start_date" <= "now"()) AND ("g"."game_end_time" IS NULL))
  GROUP BY "g"."game_id", "t"."team_name", "t"."logo_url", "ot"."team_name", "ot"."logo_url", "g"."opposing_team_id", "g"."home", "g"."start_date", "g"."venue", "g"."attended";


ALTER VIEW "simulacion_juego"."v_marcador_activo" OWNER TO "postgres";


CREATE OR REPLACE VIEW "simulacion_juego"."v_prox_juego" WITH ("security_invoker"='on') AS
 SELECT "g"."game_id",
    "t"."team_name" AS "opposing_team_name",
    "t"."logo_url" AS "opposing_team_logo",
    "g"."start_date"
   FROM ("simulacion_juego"."game" "g"
     JOIN "simulacion_juego"."team" "t" ON (("t"."team_id" = "g"."opposing_team_id")))
  WHERE (("g"."start_date" > "now"()) AND ("g"."game_end_time" IS NULL))
  ORDER BY "g"."start_date"
 LIMIT 1;


ALTER VIEW "simulacion_juego"."v_prox_juego" OWNER TO "postgres";


CREATE OR REPLACE VIEW "simulacion_juego"."v_scoreboard" AS
SELECT
    NULL::integer AS "game_id",
    NULL::integer AS "current_quarter",
    NULL::timestamp with time zone AS "current_quarter_start",
    NULL::timestamp with time zone AS "game_end_time",
    NULL::boolean AS "defense",
    NULL::character varying(250) AS "venue",
    NULL::integer AS "attended",
    NULL::boolean AS "home",
    NULL::timestamp with time zone AS "start_date",
    NULL::integer AS "elapsed_seconds",
    NULL::character varying(100) AS "lakers_team_name",
    NULL::character varying(200) AS "lakers_logo",
    NULL::character varying(100) AS "opposing_team_name",
    NULL::character varying(200) AS "opposing_team_logo",
    NULL::bigint AS "lakers_score",
    NULL::bigint AS "opposing_score";


ALTER VIEW "simulacion_juego"."v_scoreboard" OWNER TO "postgres";


CREATE OR REPLACE VIEW "simulacion_juego"."v_team_comparison" WITH ("security_invoker"='on') AS
 SELECT "g"."game_id",
    "sum"(
        CASE
            WHEN ("tp"."team_id" = 1) THEN ("tps"."rebounds")::integer
            ELSE 0
        END) AS "lakers_rebounds",
    "sum"(
        CASE
            WHEN ("tp"."team_id" <> 1) THEN ("tps"."rebounds")::integer
            ELSE 0
        END) AS "opposing_rebounds",
    "sum"(
        CASE
            WHEN ("tp"."team_id" = 1) THEN ("tps"."assists")::integer
            ELSE 0
        END) AS "lakers_assists",
    "sum"(
        CASE
            WHEN ("tp"."team_id" <> 1) THEN ("tps"."assists")::integer
            ELSE 0
        END) AS "opposing_assists",
    "sum"(
        CASE
            WHEN ("tp"."team_id" = 1) THEN ("tps"."steals")::integer
            ELSE 0
        END) AS "lakers_steals",
    "sum"(
        CASE
            WHEN ("tp"."team_id" <> 1) THEN ("tps"."steals")::integer
            ELSE 0
        END) AS "opposing_steals"
   FROM (("simulacion_juego"."game" "g"
     JOIN "simulacion_juego"."team_player_stats" "tps" ON (("tps"."game_id" = "g"."game_id")))
     JOIN "simulacion_juego"."team_player" "tp" ON (("tp"."team_player_id" = "tps"."team_player_id")))
  WHERE ("g"."game_end_time" IS NULL)
  GROUP BY "g"."game_id";


ALTER VIEW "simulacion_juego"."v_team_comparison" OWNER TO "postgres";


CREATE OR REPLACE VIEW "simulacion_juego"."view_marcadores" WITH ("security_invoker"='on') AS
 SELECT "g"."game_id",
    "t"."team_name" AS "lakers_name",
    "t"."logo_url" AS "lakers_logo",
    COALESCE("sum"(
        CASE
            WHEN ("tp"."team_id" = 1) THEN "tps"."points"
            ELSE NULL::smallint
        END), (0)::bigint) AS "lakers_score",
    "ot"."team_name" AS "opposing_team_name",
    "ot"."logo_url" AS "opposing_team_logo",
    COALESCE("sum"(
        CASE
            WHEN ("tp"."team_id" <> 1) THEN "tps"."points"
            ELSE NULL::smallint
        END), (0)::bigint) AS "opposing_score",
    "g"."home",
    "g"."start_date",
    "g"."game_end_time",
    (EXTRACT(epoch FROM ("now"() - "g"."start_date")))::integer AS "seconds_elapsed",
    "g"."venue",
    "g"."attended"
   FROM (((("simulacion_juego"."game" "g"
     JOIN "simulacion_juego"."team" "t" ON (("t"."team_id" = 1)))
     JOIN "simulacion_juego"."team" "ot" ON (("ot"."team_id" = "g"."opposing_team_id")))
     LEFT JOIN "simulacion_juego"."team_player_stats" "tps" ON (("tps"."game_id" = "g"."game_id")))
     LEFT JOIN "simulacion_juego"."team_player" "tp" ON (("tp"."team_player_id" = "tps"."team_player_id")))
  GROUP BY "g"."game_id", "t"."team_name", "t"."logo_url", "ot"."team_name", "ot"."logo_url", "g"."home", "g"."start_date", "g"."game_end_time", "g"."venue", "g"."attended";


ALTER VIEW "simulacion_juego"."view_marcadores" OWNER TO "postgres";


CREATE OR REPLACE VIEW "simulacion_juego"."view_player_season_average" WITH ("security_invoker"='on') AS
 SELECT "tps"."team_player_id",
    "concat"("tp"."first_name", ' ', "tp"."last_name") AS "full_name",
        CASE
            WHEN (EXTRACT(month FROM "g"."start_date") >= (10)::numeric) THEN EXTRACT(year FROM "g"."start_date")
            ELSE (EXTRACT(year FROM "g"."start_date") - (1)::numeric)
        END AS "season_start",
    "round"((("sum"("tps"."points"))::numeric / (NULLIF("count"("tps"."game_id"), 0))::numeric), 2) AS "points_per_game",
    "round"("avg"("tps"."rebounds"), 2) AS "rebounds_per_game",
    "round"("avg"("tps"."assists"), 2) AS "assists_per_game",
    "round"("avg"("tps"."steals"), 2) AS "steals_per_game",
    "round"("avg"("tps"."turnovers"), 2) AS "turnovers_per_game",
    "round"(((("sum"("tps"."field_made"))::numeric / (NULLIF("sum"("tps"."field_attempted"), 0))::numeric) * (100)::numeric), 1) AS "fg_pct"
   FROM (("simulacion_juego"."team_player_stats" "tps"
     JOIN "simulacion_juego"."team_player" "tp" ON (("tps"."team_player_id" = "tp"."team_player_id")))
     JOIN "simulacion_juego"."game" "g" ON (("tps"."game_id" = "g"."game_id")))
  GROUP BY "tps"."team_player_id", "tp"."first_name", "tp"."last_name",
        CASE
            WHEN (EXTRACT(month FROM "g"."start_date") >= (10)::numeric) THEN EXTRACT(year FROM "g"."start_date")
            ELSE (EXTRACT(year FROM "g"."start_date") - (1)::numeric)
        END
  ORDER BY
        CASE
            WHEN (EXTRACT(month FROM "g"."start_date") >= (10)::numeric) THEN EXTRACT(year FROM "g"."start_date")
            ELSE (EXTRACT(year FROM "g"."start_date") - (1)::numeric)
        END, ("round"((("sum"("tps"."points"))::numeric / (NULLIF("count"("tps"."game_id"), 0))::numeric), 2)) DESC;


ALTER VIEW "simulacion_juego"."view_player_season_average" OWNER TO "postgres";


CREATE OR REPLACE VIEW "simulacion_juego"."view_player_stats" WITH ("security_invoker"='on') AS
 SELECT "tps"."team_player_stats_id",
    "tps"."game_id",
    "tps"."team_player_id",
    "tp"."photo_url",
    "concat"("tp"."first_name", ' ', "tp"."last_name") AS "full_name",
    "to_char"("tps"."minutes", 'MI:SS'::"text") AS "minutes",
    "tps"."points",
    "tps"."rebounds",
    "tps"."assists",
    "tps"."steals",
    "tps"."turnovers",
    "tps"."field_made",
    "tps"."field_attempted"
   FROM ("simulacion_juego"."team_player_stats" "tps"
     JOIN "simulacion_juego"."team_player" "tp" ON (("tps"."team_player_id" = "tp"."team_player_id")))
  WHERE ("tp"."team_id" = 1);


ALTER VIEW "simulacion_juego"."view_player_stats" OWNER TO "postgres";


CREATE OR REPLACE VIEW "simulacion_juego"."view_team_stats_comparision" WITH ("security_invoker"='on') AS
 SELECT "tps"."game_id",
    "tp"."team_id",
    "sum"("tps"."points") AS "total_points",
    "sum"("tps"."rebounds") AS "total_rebounds",
    "sum"("tps"."assists") AS "total_assists",
    "sum"("tps"."steals") AS "total_steals",
    "sum"("tps"."turnovers") AS "total_turnovers",
    "sum"("tps"."field_made") AS "total_field_made",
    "sum"("tps"."field_attempted") AS "total_field_attempted"
   FROM ("simulacion_juego"."team_player_stats" "tps"
     JOIN "simulacion_juego"."team_player" "tp" ON (("tps"."team_player_id" = "tp"."team_player_id")))
  GROUP BY "tps"."game_id", "tp"."team_id";


ALTER VIEW "simulacion_juego"."view_team_stats_comparision" OWNER TO "postgres";


ALTER TABLE ONLY "public"."answer" ALTER COLUMN "answer_id" SET DEFAULT "nextval"('"public"."answer_answer_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."bad_words" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."bad_words_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."game" ALTER COLUMN "game_id" SET DEFAULT "nextval"('"public"."game_game_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."matchup" ALTER COLUMN "matchup_id" SET DEFAULT "nextval"('"public"."matchup_matchup_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."news" ALTER COLUMN "news_id" SET DEFAULT "nextval"('"public"."news_news_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."question" ALTER COLUMN "question_id" SET DEFAULT "nextval"('"public"."question_question_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."team" ALTER COLUMN "team_id" SET DEFAULT "nextval"('"public"."team_team_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."team_player_stats" ALTER COLUMN "team_player_stats_id" SET DEFAULT "nextval"('"public"."team_player_stats_team_player_stats_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."user_vote" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."user_vote_id_seq1"'::"regclass");



ALTER TABLE ONLY "simulacion_juego"."game" ALTER COLUMN "game_id" SET DEFAULT "nextval"('"simulacion_juego"."game_game_id_seq"'::"regclass");



ALTER TABLE ONLY "simulacion_juego"."team" ALTER COLUMN "team_id" SET DEFAULT "nextval"('"simulacion_juego"."team_team_id_seq"'::"regclass");



ALTER TABLE ONLY "simulacion_juego"."team_player" ALTER COLUMN "team_player_id" SET DEFAULT "nextval"('"simulacion_juego"."team_player_team_player_id_seq"'::"regclass");



ALTER TABLE ONLY "simulacion_juego"."team_player_stats" ALTER COLUMN "team_player_stats_id" SET DEFAULT "nextval"('"simulacion_juego"."team_player_stats_team_player_stats_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."achievement"
    ADD CONSTRAINT "achievement_pkey" PRIMARY KEY ("achievement_id");



ALTER TABLE ONLY "public"."answer"
    ADD CONSTRAINT "answer_pkey" PRIMARY KEY ("answer_id");



ALTER TABLE ONLY "public"."bad_words"
    ADD CONSTRAINT "bad_words_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bad_words"
    ADD CONSTRAINT "bad_words_word_key" UNIQUE ("word");



ALTER TABLE ONLY "public"."card"
    ADD CONSTRAINT "card_pkey" PRIMARY KEY ("card_id");



ALTER TABLE ONLY "public"."conversation"
    ADD CONSTRAINT "conversation_friendship_id_key" UNIQUE ("friendship_id");



ALTER TABLE ONLY "public"."conversation"
    ADD CONSTRAINT "conversation_pkey" PRIMARY KEY ("conversation_id");



ALTER TABLE ONLY "public"."court"
    ADD CONSTRAINT "court_pkey" PRIMARY KEY ("court_id");



ALTER TABLE ONLY "public"."deck"
    ADD CONSTRAINT "deck_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_participant"
    ADD CONSTRAINT "event_participant_pkey" PRIMARY KEY ("event_participant_id");



ALTER TABLE ONLY "public"."event"
    ADD CONSTRAINT "event_pkey" PRIMARY KEY ("event_id");



ALTER TABLE ONLY "public"."event_report"
    ADD CONSTRAINT "event_report_pkey" PRIMARY KEY ("ereport_id");



ALTER TABLE ONLY "public"."event_report_type"
    ADD CONSTRAINT "event_report_type_pkey" PRIMARY KEY ("report_id");



ALTER TABLE ONLY "public"."event_status"
    ADD CONSTRAINT "event_status_pkey" PRIMARY KEY ("event_status_id");



ALTER TABLE ONLY "public"."friend_request"
    ADD CONSTRAINT "friend_request_pkey" PRIMARY KEY ("friend_request_id");



ALTER TABLE ONLY "public"."friendship"
    ADD CONSTRAINT "friendship_pkey" PRIMARY KEY ("friendship_id");



ALTER TABLE ONLY "public"."game"
    ADD CONSTRAINT "game_pkey" PRIMARY KEY ("game_id");



ALTER TABLE ONLY "public"."gender"
    ADD CONSTRAINT "gender_pkey" PRIMARY KEY ("gender_id");



ALTER TABLE ONLY "public"."instructions"
    ADD CONSTRAINT "instructions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."jersey_sprite"
    ADD CONSTRAINT "jersey_sprite_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."jersey_sprite"
    ADD CONSTRAINT "jersey_sprite_pkey" PRIMARY KEY ("jersey_sprite_id");



ALTER TABLE ONLY "public"."matchup"
    ADD CONSTRAINT "matchup_pkey" PRIMARY KEY ("matchup_id");



ALTER TABLE ONLY "public"."message"
    ADD CONSTRAINT "message_pkey" PRIMARY KEY ("message_id");



ALTER TABLE ONLY "public"."minigame_match"
    ADD CONSTRAINT "minigame_match_pkey" PRIMARY KEY ("match_id");



ALTER TABLE ONLY "public"."news_category"
    ADD CONSTRAINT "news_category_pkey" PRIMARY KEY ("news_category_id");



ALTER TABLE ONLY "public"."news"
    ADD CONSTRAINT "news_pkey" PRIMARY KEY ("news_id");



ALTER TABLE ONLY "public"."news"
    ADD CONSTRAINT "news_url_unique" UNIQUE ("news_url");



ALTER TABLE ONLY "public"."npc_archetype"
    ADD CONSTRAINT "npc_archetype_pkey" PRIMARY KEY ("npc_archetype_id");



ALTER TABLE ONLY "public"."npc_difficulty_config"
    ADD CONSTRAINT "npc_difficulty_config_pkey" PRIMARY KEY ("config_id");



ALTER TABLE ONLY "public"."npc_team"
    ADD CONSTRAINT "npc_team_pkey" PRIMARY KEY ("npc_team_id");



ALTER TABLE ONLY "public"."npc_team"
    ADD CONSTRAINT "npc_team_sim_team_id_key" UNIQUE ("sim_team_id");



ALTER TABLE ONLY "public"."pack_card"
    ADD CONSTRAINT "pack_card_pkey" PRIMARY KEY ("pack_card_id");



ALTER TABLE ONLY "public"."pack"
    ADD CONSTRAINT "pack_pkey" PRIMARY KEY ("pack_id");



ALTER TABLE ONLY "public"."pack_rarity"
    ADD CONSTRAINT "pack_rarity_pkey" PRIMARY KEY ("pack_rarity_id");



ALTER TABLE ONLY "public"."pack_type"
    ADD CONSTRAINT "pack_type_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."pack_type"
    ADD CONSTRAINT "pack_type_pkey" PRIMARY KEY ("pack_type_id");



ALTER TABLE ONLY "public"."question"
    ADD CONSTRAINT "question_pkey" PRIMARY KEY ("question_id");



ALTER TABLE ONLY "public"."rarity"
    ADD CONSTRAINT "rarity_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."rarity"
    ADD CONSTRAINT "rarity_pkey" PRIMARY KEY ("rarity_id");



ALTER TABLE ONLY "public"."report_type"
    ADD CONSTRAINT "report_type_pkey" PRIMARY KEY ("report_id");



ALTER TABLE ONLY "public"."scope"
    ADD CONSTRAINT "scope_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."skill_level"
    ADD CONSTRAINT "skill_level_pkey" PRIMARY KEY ("skill_level_id");



ALTER TABLE ONLY "public"."sprite"
    ADD CONSTRAINT "sprite_pkey" PRIMARY KEY ("sprite_id");



ALTER TABLE ONLY "public"."team"
    ADD CONSTRAINT "team_pkey" PRIMARY KEY ("team_id");



ALTER TABLE ONLY "public"."team_player"
    ADD CONSTRAINT "team_player_pkey" PRIMARY KEY ("team_player_id");



ALTER TABLE ONLY "public"."team_player_stats"
    ADD CONSTRAINT "team_player_stats_pkey" PRIMARY KEY ("team_player_stats_id");



ALTER TABLE ONLY "public"."tips"
    ADD CONSTRAINT "tips_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_vote"
    ADD CONSTRAINT "unique_user_matchup" UNIQUE ("user_id", "matchup_id");



ALTER TABLE ONLY "public"."user_achievement"
    ADD CONSTRAINT "user_achievement_pkey" PRIMARY KEY ("user_id", "achievement_id");



ALTER TABLE ONLY "public"."user_card"
    ADD CONSTRAINT "user_card_pkey" PRIMARY KEY ("user_card_id");



ALTER TABLE ONLY "public"."user_event"
    ADD CONSTRAINT "user_event_pkey" PRIMARY KEY ("user_event_id");



ALTER TABLE ONLY "public"."user_event_ratings"
    ADD CONSTRAINT "user_event_ratings_pkey" PRIMARY KEY ("user_event_rating_id");



ALTER TABLE ONLY "public"."user_event_ratings"
    ADD CONSTRAINT "user_event_ratings_user_event_id_rated_user_id_key" UNIQUE ("user_event_id", "rated_user_id");



ALTER TABLE ONLY "public"."user_event"
    ADD CONSTRAINT "user_event_user_id_event_id_key" UNIQUE ("user_id", "event_id");



ALTER TABLE ONLY "public"."user_laker"
    ADD CONSTRAINT "user_laker_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."user_report"
    ADD CONSTRAINT "user_report_pkey" PRIMARY KEY ("ureport_id");



ALTER TABLE ONLY "public"."user_type"
    ADD CONSTRAINT "user_type_pkey" PRIMARY KEY ("user_type_id");



ALTER TABLE ONLY "public"."user_vote"
    ADD CONSTRAINT "user_vote_pkey1" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."warn_type"
    ADD CONSTRAINT "warn_type_pkey" PRIMARY KEY ("warn_type_id");



ALTER TABLE ONLY "public"."warning"
    ADD CONSTRAINT "warning_pkey" PRIMARY KEY ("warning_id");



ALTER TABLE ONLY "public"."wrap_backgrounds"
    ADD CONSTRAINT "wrap_backgrounds_pkey" PRIMARY KEY ("wrap_backgrounds_id");



ALTER TABLE ONLY "public"."wrap_backgrounds"
    ADD CONSTRAINT "wrap_backgrounds_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "simulacion_juego"."device_tokens_watchos"
    ADD CONSTRAINT "device_tokens_device_token_key" UNIQUE ("device_token");



ALTER TABLE ONLY "simulacion_juego"."device_tokens_watchos"
    ADD CONSTRAINT "device_tokens_pkey" PRIMARY KEY ("device_token_id");



ALTER TABLE ONLY "simulacion_juego"."game"
    ADD CONSTRAINT "game_pkey" PRIMARY KEY ("game_id");



ALTER TABLE ONLY "simulacion_juego"."team"
    ADD CONSTRAINT "team_pkey" PRIMARY KEY ("team_id");



ALTER TABLE ONLY "simulacion_juego"."team_player"
    ADD CONSTRAINT "team_player_pkey" PRIMARY KEY ("team_player_id");



ALTER TABLE ONLY "simulacion_juego"."team_player_stats"
    ADD CONSTRAINT "team_player_stats_pkey" PRIMARY KEY ("team_player_stats_id");



CREATE INDEX "idx_message_conversation" ON "public"."message" USING "btree" ("conversation_id", "sent" DESC);



CREATE OR REPLACE VIEW "simulacion_juego"."v_scoreboard" WITH ("security_invoker"='on') AS
 SELECT "g"."game_id",
    "g"."current_quarter",
    "g"."current_quarter_start",
    "g"."game_end_time",
    "g"."defense",
    "g"."venue",
    "g"."attended",
    "g"."home",
    "g"."start_date",
    (EXTRACT(epoch FROM ("now"() - "g"."start_date")))::integer AS "elapsed_seconds",
    "lt"."team_name" AS "lakers_team_name",
    "lt"."logo_url" AS "lakers_logo",
    "t"."team_name" AS "opposing_team_name",
    "t"."logo_url" AS "opposing_team_logo",
    "sum"(
        CASE
            WHEN ("tp"."team_id" = 1) THEN ("tps"."points")::integer
            ELSE 0
        END) AS "lakers_score",
    "sum"(
        CASE
            WHEN ("tp"."team_id" <> 1) THEN ("tps"."points")::integer
            ELSE 0
        END) AS "opposing_score"
   FROM (((("simulacion_juego"."game" "g"
     JOIN "simulacion_juego"."team" "t" ON (("t"."team_id" = "g"."opposing_team_id")))
     JOIN "simulacion_juego"."team" "lt" ON (("lt"."team_id" = 1)))
     JOIN "simulacion_juego"."team_player_stats" "tps" ON (("tps"."game_id" = "g"."game_id")))
     JOIN "simulacion_juego"."team_player" "tp" ON (("tp"."team_player_id" = "tps"."team_player_id")))
  WHERE ("g"."game_end_time" IS NULL)
  GROUP BY "g"."game_id", "t"."team_name", "t"."logo_url", "lt"."team_name", "lt"."logo_url";



CREATE OR REPLACE TRIGGER "trg_after_event_rating" AFTER INSERT ON "public"."user_event_ratings" FOR EACH ROW EXECUTE FUNCTION "public"."fn_after_event_rating"();



CREATE OR REPLACE TRIGGER "trg_ai_analyze_event_report" AFTER INSERT ON "public"."event_report" FOR EACH ROW EXECUTE FUNCTION "public"."notify_ai_analyze_event_report"();



CREATE OR REPLACE TRIGGER "trg_ai_analyze_report" AFTER INSERT ON "public"."user_report" FOR EACH ROW EXECUTE FUNCTION "public"."notify_ai_analyze_report"();



CREATE OR REPLACE TRIGGER "trg_check_deck_limit" BEFORE INSERT OR UPDATE ON "public"."user_card" FOR EACH ROW EXECUTE FUNCTION "public"."check_deck_limit"();



CREATE OR REPLACE TRIGGER "trg_create_conversation_on_friendship" AFTER INSERT ON "public"."friendship" FOR EACH ROW EXECUTE FUNCTION "public"."create_conversation_for_friendship"();



CREATE OR REPLACE TRIGGER "trg_lakers_court_access" BEFORE INSERT OR UPDATE OF "birthdate" ON "public"."user_laker" FOR EACH ROW EXECUTE FUNCTION "public"."calculate_lakers_court_access"();



CREATE OR REPLACE TRIGGER "trg_update_user_rewards" AFTER INSERT ON "public"."minigame_match" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_rewards"();



CREATE OR REPLACE TRIGGER "game_apns_trigger" AFTER UPDATE ON "simulacion_juego"."game" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('https://ptbcoxaguvbwprxdundz.supabase.co/functions/v1/send-apns-notification', 'POST', '{"Content-type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0YmNveGFndXZid3ByeGR1bmR6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM0MzM5NCwiZXhwIjoyMDg4OTE5Mzk0fQ.0hqDm_VSp-X7ST3vf88nSvX02Yulftl7Yh6ZO-s9pTo"}', '{}', '5000');



ALTER TABLE ONLY "public"."card"
    ADD CONSTRAINT "card_rarity_id_fkey" FOREIGN KEY ("rarity_id") REFERENCES "public"."rarity"("rarity_id");



ALTER TABLE ONLY "public"."card"
    ADD CONSTRAINT "card_sprite_id_fkey" FOREIGN KEY ("sprite_id") REFERENCES "public"."sprite"("sprite_id");



ALTER TABLE ONLY "public"."conversation"
    ADD CONSTRAINT "conversation_friendship_id_fkey" FOREIGN KEY ("friendship_id") REFERENCES "public"."friendship"("friendship_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deck"
    ADD CONSTRAINT "deck_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "public"."card"("card_id");



ALTER TABLE ONLY "public"."deck"
    ADD CONSTRAINT "deck_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_laker"("user_id");



ALTER TABLE ONLY "public"."event"
    ADD CONSTRAINT "event_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "public"."court"("court_id");



ALTER TABLE ONLY "public"."event"
    ADD CONSTRAINT "event_created_user_id_fkey" FOREIGN KEY ("created_user_id") REFERENCES "public"."user_laker"("user_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event"
    ADD CONSTRAINT "event_event_status_id_fkey" FOREIGN KEY ("event_status_id") REFERENCES "public"."event_status"("event_status_id");



ALTER TABLE ONLY "public"."event_participant"
    ADD CONSTRAINT "event_participant_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."event"("event_id");



ALTER TABLE ONLY "public"."event_participant"
    ADD CONSTRAINT "event_participant_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_laker"("user_id");



ALTER TABLE ONLY "public"."event_report"
    ADD CONSTRAINT "event_report_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."event"("event_id");



ALTER TABLE ONLY "public"."event_report"
    ADD CONSTRAINT "event_report_report_type_fkey" FOREIGN KEY ("report_type") REFERENCES "public"."event_report_type"("report_id");



ALTER TABLE ONLY "public"."event_report"
    ADD CONSTRAINT "event_report_reporter_user_id_fkey" FOREIGN KEY ("reporter_user_id") REFERENCES "public"."user_laker"("user_id");



ALTER TABLE ONLY "public"."event"
    ADD CONSTRAINT "event_skill_level_id_fkey" FOREIGN KEY ("skill_level_id") REFERENCES "public"."skill_level"("skill_level_id");



ALTER TABLE ONLY "public"."answer"
    ADD CONSTRAINT "fk_answer_question" FOREIGN KEY ("question_id") REFERENCES "public"."question"("question_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."matchup"
    ADD CONSTRAINT "fk_matchup_answer_a" FOREIGN KEY ("answer_a_id") REFERENCES "public"."answer"("answer_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."matchup"
    ADD CONSTRAINT "fk_matchup_answer_b" FOREIGN KEY ("answer_b_id") REFERENCES "public"."answer"("answer_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."matchup"
    ADD CONSTRAINT "fk_matchup_question" FOREIGN KEY ("question_id") REFERENCES "public"."question"("question_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."matchup"
    ADD CONSTRAINT "fk_matchup_winner" FOREIGN KEY ("winner_id") REFERENCES "public"."answer"("answer_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."matchup"
    ADD CONSTRAINT "fk_parent_a" FOREIGN KEY ("parent_a_id") REFERENCES "public"."matchup"("matchup_id");



ALTER TABLE ONLY "public"."matchup"
    ADD CONSTRAINT "fk_parent_b" FOREIGN KEY ("parent_b_id") REFERENCES "public"."matchup"("matchup_id");



ALTER TABLE ONLY "public"."user_vote"
    ADD CONSTRAINT "fk_vote_answer" FOREIGN KEY ("selected_id") REFERENCES "public"."answer"("answer_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_vote"
    ADD CONSTRAINT "fk_vote_matchup" FOREIGN KEY ("matchup_id") REFERENCES "public"."matchup"("matchup_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."friend_request"
    ADD CONSTRAINT "friend_request_receiver_fkey" FOREIGN KEY ("receiver_id") REFERENCES "public"."user_laker"("user_id");



ALTER TABLE ONLY "public"."friend_request"
    ADD CONSTRAINT "friend_request_sender_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."user_laker"("user_id");



ALTER TABLE ONLY "public"."friendship"
    ADD CONSTRAINT "friendship_user1_fkey" FOREIGN KEY ("user1") REFERENCES "public"."user_laker"("user_id");



ALTER TABLE ONLY "public"."friendship"
    ADD CONSTRAINT "friendship_user2_fkey" FOREIGN KEY ("user2") REFERENCES "public"."user_laker"("user_id");



ALTER TABLE ONLY "public"."game"
    ADD CONSTRAINT "game_opposing_team_id_fkey" FOREIGN KEY ("opposing_team_id") REFERENCES "public"."team"("team_id");



ALTER TABLE ONLY "public"."message"
    ADD CONSTRAINT "message_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("conversation_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."message"
    ADD CONSTRAINT "message_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_laker"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."minigame_match"
    ADD CONSTRAINT "minigame_match_opposing_team_id_fkey" FOREIGN KEY ("opposing_team_id") REFERENCES "simulacion_juego"."team"("team_id");



ALTER TABLE ONLY "public"."minigame_match"
    ADD CONSTRAINT "minigame_match_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."user_laker"("user_id");



ALTER TABLE ONLY "public"."news"
    ADD CONSTRAINT "news_category_fk" FOREIGN KEY ("news_category") REFERENCES "public"."news_category"("news_category_id");



ALTER TABLE ONLY "public"."npc_archetype"
    ADD CONSTRAINT "npc_archetype_npc_team_id_fkey" FOREIGN KEY ("npc_team_id") REFERENCES "public"."npc_team"("npc_team_id");



ALTER TABLE ONLY "public"."npc_difficulty_config"
    ADD CONSTRAINT "npc_difficulty_config_npc_team_id_fkey" FOREIGN KEY ("npc_team_id") REFERENCES "public"."npc_team"("npc_team_id");



ALTER TABLE ONLY "public"."npc_team"
    ADD CONSTRAINT "npc_team_jersey_sprite_id_fkey" FOREIGN KEY ("jersey_sprite_id") REFERENCES "public"."jersey_sprite"("jersey_sprite_id");



ALTER TABLE ONLY "public"."pack_card"
    ADD CONSTRAINT "pack_card_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "public"."card"("card_id");



ALTER TABLE ONLY "public"."pack_card"
    ADD CONSTRAINT "pack_card_pack_id_fkey" FOREIGN KEY ("pack_id") REFERENCES "public"."pack"("pack_id");



ALTER TABLE ONLY "public"."pack"
    ADD CONSTRAINT "pack_pack_type_id_fkey" FOREIGN KEY ("pack_type_id") REFERENCES "public"."pack_type"("pack_type_id");



ALTER TABLE ONLY "public"."pack_rarity"
    ADD CONSTRAINT "pack_rarity_pack_type_id_fkey" FOREIGN KEY ("pack_type_id") REFERENCES "public"."pack_type"("pack_type_id");



ALTER TABLE ONLY "public"."pack_rarity"
    ADD CONSTRAINT "pack_rarity_rarity_id_fkey" FOREIGN KEY ("rarity_id") REFERENCES "public"."rarity"("rarity_id");



ALTER TABLE ONLY "public"."team_player_stats"
    ADD CONSTRAINT "team_player_stats_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."game"("game_id");



ALTER TABLE ONLY "public"."team_player_stats"
    ADD CONSTRAINT "team_player_stats_team_player_id_fkey" FOREIGN KEY ("team_player_id") REFERENCES "public"."team_player"("team_player_id");



ALTER TABLE ONLY "public"."team_player"
    ADD CONSTRAINT "team_player_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."team"("team_id");



ALTER TABLE ONLY "public"."user_achievement"
    ADD CONSTRAINT "user_achievement_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievement"("achievement_id");



ALTER TABLE ONLY "public"."user_achievement"
    ADD CONSTRAINT "user_achievement_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_laker"("user_id");



ALTER TABLE ONLY "public"."user_card"
    ADD CONSTRAINT "user_card_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "public"."card"("card_id");



ALTER TABLE ONLY "public"."user_card"
    ADD CONSTRAINT "user_card_first_pack_id_fkey" FOREIGN KEY ("first_pack_id") REFERENCES "public"."pack"("pack_id");



ALTER TABLE ONLY "public"."user_card"
    ADD CONSTRAINT "user_card_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_laker"("user_id");



ALTER TABLE ONLY "public"."user_event"
    ADD CONSTRAINT "user_event_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."event"("event_id");



ALTER TABLE ONLY "public"."user_event_ratings"
    ADD CONSTRAINT "user_event_ratings_rated_user_id_fkey" FOREIGN KEY ("rated_user_id") REFERENCES "public"."user_laker"("user_id");



ALTER TABLE ONLY "public"."user_event_ratings"
    ADD CONSTRAINT "user_event_ratings_user_event_id_fkey" FOREIGN KEY ("user_event_id") REFERENCES "public"."user_event"("user_event_id");



ALTER TABLE ONLY "public"."user_event"
    ADD CONSTRAINT "user_event_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_laker"("user_id");



ALTER TABLE ONLY "public"."user_laker"
    ADD CONSTRAINT "user_laker_gender_fkey" FOREIGN KEY ("gender") REFERENCES "public"."gender"("gender_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_laker"
    ADD CONSTRAINT "user_laker_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_laker"
    ADD CONSTRAINT "user_laker_user_type_fkey" FOREIGN KEY ("user_type") REFERENCES "public"."user_type"("user_type_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_report"
    ADD CONSTRAINT "user_report_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."event"("event_id");



ALTER TABLE ONLY "public"."user_report"
    ADD CONSTRAINT "user_report_report_type_fkey" FOREIGN KEY ("report_type") REFERENCES "public"."report_type"("report_id");



ALTER TABLE ONLY "public"."user_report"
    ADD CONSTRAINT "user_report_reported_user_id_fkey" FOREIGN KEY ("reported_user_id") REFERENCES "public"."user_laker"("user_id");



ALTER TABLE ONLY "public"."user_report"
    ADD CONSTRAINT "user_report_reporter_user_id_fkey" FOREIGN KEY ("reporter_user_id") REFERENCES "public"."user_laker"("user_id");



ALTER TABLE ONLY "public"."user_vote"
    ADD CONSTRAINT "user_vote_user_id_fkey1" FOREIGN KEY ("user_id") REFERENCES "public"."user_laker"("user_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."warn_type"
    ADD CONSTRAINT "warn_type_scope_id_fkey" FOREIGN KEY ("scope_id") REFERENCES "public"."scope"("id");



ALTER TABLE ONLY "public"."warning"
    ADD CONSTRAINT "warning_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "public"."user_report"("ureport_id");



ALTER TABLE ONLY "public"."warning"
    ADD CONSTRAINT "warning_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_laker"("user_id");



ALTER TABLE ONLY "public"."warning"
    ADD CONSTRAINT "warning_warn_type_id_fkey" FOREIGN KEY ("warn_type_id") REFERENCES "public"."warn_type"("warn_type_id");



ALTER TABLE ONLY "simulacion_juego"."game"
    ADD CONSTRAINT "game_opposing_team_id_fkey" FOREIGN KEY ("opposing_team_id") REFERENCES "simulacion_juego"."team"("team_id");



ALTER TABLE ONLY "simulacion_juego"."team_player_stats"
    ADD CONSTRAINT "team_player_stats_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "simulacion_juego"."game"("game_id");



ALTER TABLE ONLY "simulacion_juego"."team_player_stats"
    ADD CONSTRAINT "team_player_stats_team_player_id_fkey" FOREIGN KEY ("team_player_id") REFERENCES "simulacion_juego"."team_player"("team_player_id");



ALTER TABLE ONLY "simulacion_juego"."team_player"
    ADD CONSTRAINT "team_player_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "simulacion_juego"."team"("team_id");



CREATE POLICY "Access pack type" ON "public"."pack_type" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Allow authenticated insert on user_report" ON "public"."user_report" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "reporter_user_id"));



CREATE POLICY "Allow insert user_achievement" ON "public"."user_achievement" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public read on event_status" ON "public"."event_status" FOR SELECT USING (true);



CREATE POLICY "Allow public read on report_type" ON "public"."report_type" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Allow read achievement" ON "public"."achievement" FOR SELECT USING (true);



CREATE POLICY "Allow read event_participant" ON "public"."event_participant" FOR SELECT USING (true);



CREATE POLICY "Allow read friendship" ON "public"."friendship" FOR SELECT USING (true);



CREATE POLICY "Allow read user_achievement" ON "public"."user_achievement" FOR SELECT USING (true);



CREATE POLICY "Authenticated insert event_report" ON "public"."event_report" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "reporter_user_id"));



CREATE POLICY "Authenticated read get_event_players" ON "public"."user_event" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Card rarity categories" ON "public"."rarity" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Enable insert for anon users only" ON "public"."user_vote" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."game" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."user_vote" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable read access for all  auth users" ON "public"."team_player_stats" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."card" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."court" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."game" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."question" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."team" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."team_player_stats" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Insert user cards won uniquely" ON "public"."user_card" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Los wrap backgrounds son públicos" ON "public"."wrap_backgrounds" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Pack rarity probabilities" ON "public"."pack_rarity" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Permitir acceso de lectura a todos los user votes" ON "public"."user_vote" FOR SELECT USING (true);



CREATE POLICY "Permitir leer generos" ON "public"."gender" FOR SELECT USING (true);



CREATE POLICY "Public read event_report_type" ON "public"."event_report_type" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Public read skill_level" ON "public"."skill_level" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Read cards in pack" ON "public"."pack_card" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Read packs" ON "public"."pack" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Read user cards" ON "public"."user_card" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Receiver puede actualizar el status del friend request" ON "public"."friend_request" FOR UPDATE USING (("auth"."uid"() = "receiver_id"));



CREATE POLICY "Todos pueden ver matchups" ON "public"."matchup" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Todos pueden ver preguntas" ON "public"."question" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Todos pueden ver respuestas" ON "public"."answer" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Update number user cards multiple unlocks" ON "public"."user_card" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Users can insert own matches" ON "public"."minigame_match" FOR INSERT WITH CHECK (("auth"."uid"() = "player_id"));



CREATE POLICY "Users can view own matches" ON "public"."minigame_match" FOR SELECT USING (("auth"."uid"() = "player_id"));



CREATE POLICY "Usuarios pueden crear amistades" ON "public"."friendship" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "user1") OR ("auth"."uid"() = "user2")));



CREATE POLICY "Usuarios pueden remover sus amistades" ON "public"."friendship" FOR DELETE TO "authenticated" USING ((("auth"."uid"() = "user1") OR ("auth"."uid"() = "user2")));



CREATE POLICY "Usuarios pueden ver sus amistades" ON "public"."friendship" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "user1") OR ("auth"."uid"() = "user2")));



CREATE POLICY "Usuarios pueden ver sus propios friend requests" ON "public"."friend_request" FOR SELECT USING ((("auth"."uid"() = "sender_id") OR ("auth"."uid"() = "receiver_id")));



CREATE POLICY "Usuarios pueden ver sus propios votos" ON "public"."user_vote" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Ususarios pueden mandar friend requests" ON "public"."friend_request" FOR INSERT WITH CHECK (("auth"."uid"() = "sender_id"));



ALTER TABLE "public"."achievement" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admin_delete_participant" ON "public"."event_participant" FOR DELETE USING ((( SELECT "user_laker"."user_type"
   FROM "public"."user_laker"
  WHERE ("user_laker"."user_id" = "auth"."uid"())) = 1));



CREATE POLICY "admin_insert_warning" ON "public"."warning" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "user_laker"."user_type"
   FROM "public"."user_laker"
  WHERE ("user_laker"."user_id" = "auth"."uid"())) = 1));



CREATE POLICY "admin_read_event_reports" ON "public"."event_report" FOR SELECT TO "authenticated" USING ((( SELECT "user_laker"."user_type"
   FROM "public"."user_laker"
  WHERE ("user_laker"."user_id" = "auth"."uid"())) = 1));



CREATE POLICY "admin_read_scope" ON "public"."scope" FOR SELECT USING ((( SELECT "user_laker"."user_type"
   FROM "public"."user_laker"
  WHERE ("user_laker"."user_id" = "auth"."uid"())) = 1));



CREATE POLICY "admin_read_user_report" ON "public"."user_report" FOR SELECT TO "authenticated" USING ((( SELECT "user_laker"."user_type"
   FROM "public"."user_laker"
  WHERE ("user_laker"."user_id" = "auth"."uid"())) = 1));



CREATE POLICY "admin_read_warn_type" ON "public"."warn_type" FOR SELECT TO "authenticated" USING ((( SELECT "user_laker"."user_type"
   FROM "public"."user_laker"
  WHERE ("user_laker"."user_id" = "auth"."uid"())) = 1));



CREATE POLICY "admin_read_warning" ON "public"."warning" FOR SELECT TO "authenticated" USING ((( SELECT "user_laker"."user_type"
   FROM "public"."user_laker"
  WHERE ("user_laker"."user_id" = "auth"."uid"())) = 1));



CREATE POLICY "admin_update user_laker" ON "public"."user_laker" FOR UPDATE TO "authenticated" USING ((( SELECT "user_laker_1"."user_type"
   FROM "public"."user_laker" "user_laker_1"
  WHERE ("user_laker_1"."user_id" = "auth"."uid"())) = 1));



CREATE POLICY "admin_update_event" ON "public"."event" FOR UPDATE USING ((( SELECT "user_laker"."user_type"
   FROM "public"."user_laker"
  WHERE ("user_laker"."user_id" = "auth"."uid"())) = 1));



CREATE POLICY "admin_update_event_report" ON "public"."event_report" FOR UPDATE TO "authenticated" USING ((( SELECT "user_laker"."user_type"
   FROM "public"."user_laker"
  WHERE ("user_laker"."user_id" = "auth"."uid"())) = 1));



CREATE POLICY "admin_update_user_report" ON "public"."user_report" FOR UPDATE TO "authenticated" USING ((( SELECT "user_laker"."user_type"
   FROM "public"."user_laker"
  WHERE ("user_laker"."user_id" = "auth"."uid"())) = 1));



CREATE POLICY "all_read_card" ON "public"."card" FOR SELECT USING (true);



CREATE POLICY "allow_select_bad_words" ON "public"."bad_words" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."answer" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bad_words" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."card" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversation" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."court" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crear conversacion propia" ON "public"."conversation" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."friendship" "f"
  WHERE (("f"."friendship_id" = "conversation"."friendship_id") AND (("f"."user1" = "auth"."uid"()) OR ("f"."user2" = "auth"."uid"()))))));



ALTER TABLE "public"."deck" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "enviar mensaje propio" ON "public"."message" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM ("public"."conversation" "c"
     JOIN "public"."friendship" "f" ON (("f"."friendship_id" = "c"."friendship_id")))
  WHERE (("c"."conversation_id" = "message"."conversation_id") AND (("f"."user1" = "auth"."uid"()) OR ("f"."user2" = "auth"."uid"())))))));



ALTER TABLE "public"."event" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "event_insert_authenticated" ON "public"."event" FOR INSERT TO "authenticated" WITH CHECK (true);



ALTER TABLE "public"."event_participant" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_report" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_report_type" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "event_select_authenticated" ON "public"."event" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."event_status" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."friend_request" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."friendship" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."game" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gender" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."instructions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."jersey_sprite" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."matchup" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."message" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."minigame_match" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."news" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."news_category" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "news_category_public_read" ON "public"."news_category" FOR SELECT USING (true);



CREATE POLICY "news_public_read" ON "public"."news" FOR SELECT USING (true);



ALTER TABLE "public"."npc_archetype" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."npc_difficulty_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."npc_team" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pack" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pack_card" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pack_rarity" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pack_type" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."question" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rarity" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "read_deck" ON "public"."deck" FOR SELECT USING (true);



CREATE POLICY "read_instructions" ON "public"."instructions" FOR SELECT USING (true);



CREATE POLICY "read_npc_archetype" ON "public"."npc_archetype" FOR SELECT USING (true);



CREATE POLICY "read_npc_difficulty_config" ON "public"."npc_difficulty_config" FOR SELECT USING (true);



CREATE POLICY "read_npc_team" ON "public"."npc_team" FOR SELECT USING (true);



CREATE POLICY "read_sprites" ON "public"."sprite" FOR SELECT USING (true);



CREATE POLICY "read_tips" ON "public"."tips" FOR SELECT USING (true);



ALTER TABLE "public"."report_type" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."scope" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."skill_level" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sprite" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."team" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."team_player" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."team_player_stats" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tips" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_achievement" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_card" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_event" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_event_delete_own" ON "public"."user_event" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "user_event_insert_own" ON "public"."user_event" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."user_event_ratings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_event_ratings_insert_own" ON "public"."user_event_ratings" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_event" "ue"
  WHERE (("ue"."user_event_id" = "user_event_ratings"."user_event_id") AND ("ue"."user_id" = "auth"."uid"())))));



CREATE POLICY "user_event_ratings_select_own" ON "public"."user_event_ratings" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_event" "ue"
  WHERE (("ue"."user_event_id" = "user_event_ratings"."user_event_id") AND ("ue"."user_id" = "auth"."uid"())))));



CREATE POLICY "user_event_ratings_update_own" ON "public"."user_event_ratings" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_event" "ue"
  WHERE (("ue"."user_event_id" = "user_event_ratings"."user_event_id") AND ("ue"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_event" "ue"
  WHERE (("ue"."user_event_id" = "user_event_ratings"."user_event_id") AND ("ue"."user_id" = "auth"."uid"())))));



CREATE POLICY "user_event_select_authenticated" ON "public"."user_event" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "user_event_update_own" ON "public"."user_event" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."user_laker" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_laker_insert_own" ON "public"."user_laker" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "user_laker_select_authenticated" ON "public"."user_laker" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "user_laker_update_own" ON "public"."user_laker" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "user_read_warnings" ON "public"."warning" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."user_report" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_type" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_vote" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ver conversacion propia" ON "public"."conversation" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."friendship" "f"
  WHERE (("f"."friendship_id" = "conversation"."friendship_id") AND (("f"."user1" = "auth"."uid"()) OR ("f"."user2" = "auth"."uid"()))))));



CREATE POLICY "ver friendships propias" ON "public"."friendship" FOR SELECT TO "authenticated" USING ((("user1" = "auth"."uid"()) OR ("user2" = "auth"."uid"())));



CREATE POLICY "ver mensajes propios" ON "public"."message" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."conversation" "c"
     JOIN "public"."friendship" "f" ON (("f"."friendship_id" = "c"."friendship_id")))
  WHERE (("c"."conversation_id" = "message"."conversation_id") AND (("f"."user1" = "auth"."uid"()) OR ("f"."user2" = "auth"."uid"()))))));



ALTER TABLE "public"."warn_type" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."warning" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wrap_backgrounds" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Enable insert for authenticated users only" ON "simulacion_juego"."team_player_stats" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Enable read access for all users" ON "simulacion_juego"."game" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Enable read access for all users" ON "simulacion_juego"."team" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Enable read access for all users" ON "simulacion_juego"."team_player_stats" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Permitir insertar device tokens" ON "simulacion_juego"."device_tokens_watchos" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Permitir leer device tokens" ON "simulacion_juego"."device_tokens_watchos" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Permitir select a autenticados" ON "simulacion_juego"."team_player_stats" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Permitir update a autenticados" ON "simulacion_juego"."team_player_stats" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "allow update stats" ON "simulacion_juego"."team_player_stats" FOR UPDATE TO "authenticated", "anon" USING (true) WITH CHECK (true);



ALTER TABLE "simulacion_juego"."device_tokens_watchos" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."conversation";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."deck";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."event_report";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."message";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."user_laker";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."user_report";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."warn_type";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."warning";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "simulacion_juego"."game";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "simulacion_juego"."team_player_stats";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






GRANT USAGE ON SCHEMA "simulacion_juego" TO "anon";
GRANT USAGE ON SCHEMA "simulacion_juego" TO "authenticated";











































































































































































GRANT ALL ON FUNCTION "public"."activate_round"("p_question_id" integer, "p_round" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."activate_round"("p_question_id" integer, "p_round" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."activate_round"("p_question_id" integer, "p_round" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."add_user_credits"("p_user_id" "uuid", "p_credits" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."add_user_credits"("p_user_id" "uuid", "p_credits" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_user_credits"("p_user_id" "uuid", "p_credits" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."advance_round"("p_question_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."advance_round"("p_question_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."advance_round"("p_question_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."advance_winners"("p_question_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."advance_winners"("p_question_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."advance_winners"("p_question_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_lakers_court_access"() TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_lakers_court_access"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_lakers_court_access"() TO "service_role";



GRANT ALL ON FUNCTION "public"."card_collection"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."card_collection"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."card_collection"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_deck_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_deck_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_deck_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."collection_summary"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."collection_summary"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."collection_summary"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_conversation_for_friendship"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_conversation_for_friendship"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_conversation_for_friendship"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_after_event_rating"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_after_event_rating"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_after_event_rating"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_full_bracket"("p_question_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."generate_full_bracket"("p_question_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_full_bracket"("p_question_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_agenda_games"("p_year" integer, "p_month" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_agenda_games"("p_year" integer, "p_month" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_agenda_games"("p_year" integer, "p_month" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_available_events"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_available_events"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_available_events"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_deck_cards"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_deck_cards"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_deck_cards"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_event_players"("p_event_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_event_players"("p_event_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_event_players"("p_event_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_friend_chats"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_friend_chats"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_friend_chats"("p_user_id" "uuid") TO "service_role";



GRANT SELECT ON TABLE "simulacion_juego"."team_player" TO "anon";
GRANT SELECT ON TABLE "simulacion_juego"."team_player" TO "authenticated";



GRANT ALL ON FUNCTION "public"."get_lakers_players"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_lakers_players"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_lakers_players"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_last_game_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_last_game_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_last_game_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_matchups_for_user"("p_user_id" "uuid", "p_question_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_matchups_for_user"("p_user_id" "uuid", "p_question_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_matchups_for_user"("p_user_id" "uuid", "p_question_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_messages"("p_user_id" "uuid", "p_conversation_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_messages"("p_user_id" "uuid", "p_conversation_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_messages"("p_user_id" "uuid", "p_conversation_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_packs_store"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_packs_store"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_packs_store"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_pending_rating"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_pending_rating"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_pending_rating"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_pending_rating_full"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_pending_rating_full"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_pending_rating_full"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_players_played_with"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_players_played_with"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_players_played_with"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_recent_news"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_recent_news"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_recent_news"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_team_comparison"("p_game_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_team_comparison"("p_game_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_team_comparison"("p_game_id" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_user_match_history"("p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_user_match_history"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_match_history"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_match_history"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_stats"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_stats"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_stats"("p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_user_win_streak"("p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_user_win_streak"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_win_streak"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_win_streak"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_ai_analyze_event_report"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_ai_analyze_event_report"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_ai_analyze_event_report"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_ai_analyze_report"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_ai_analyze_report"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_ai_analyze_report"() TO "service_role";



GRANT ALL ON FUNCTION "public"."process_question"() TO "anon";
GRANT ALL ON FUNCTION "public"."process_question"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_question"() TO "service_role";



GRANT ALL ON FUNCTION "public"."randomize_display_cards"("p_pack" integer, "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."randomize_display_cards"("p_pack" integer, "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."randomize_display_cards"("p_pack" integer, "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."swap_deck_card"("p_wishlist_id" integer, "p_deck_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."swap_deck_card"("p_wishlist_id" integer, "p_deck_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."swap_deck_card"("p_wishlist_id" integer, "p_deck_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_added_deck"("p_user_card_id" bigint, "p_user_id" "uuid", "p_added" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."update_added_deck"("p_user_card_id" bigint, "p_user_id" "uuid", "p_added" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_added_deck"("p_user_card_id" bigint, "p_user_id" "uuid", "p_added" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_added_deck_checks"("p_user_card_id" bigint, "p_user_id" "uuid", "p_added" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."update_added_deck_checks"("p_user_card_id" bigint, "p_user_id" "uuid", "p_added" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_added_deck_checks"("p_user_card_id" bigint, "p_user_id" "uuid", "p_added" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_matchups"("p_question_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."update_matchups"("p_question_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_matchups"("p_question_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_rewards"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_rewards"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_rewards"() TO "service_role";
























GRANT ALL ON TABLE "public"."achievement" TO "anon";
GRANT ALL ON TABLE "public"."achievement" TO "authenticated";
GRANT ALL ON TABLE "public"."achievement" TO "service_role";



GRANT ALL ON SEQUENCE "public"."achievement_achievement_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."achievement_achievement_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."achievement_achievement_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."answer" TO "anon";
GRANT ALL ON TABLE "public"."answer" TO "authenticated";
GRANT ALL ON TABLE "public"."answer" TO "service_role";



GRANT ALL ON SEQUENCE "public"."answer_answer_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."answer_answer_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."answer_answer_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."bad_words" TO "anon";
GRANT ALL ON TABLE "public"."bad_words" TO "authenticated";
GRANT ALL ON TABLE "public"."bad_words" TO "service_role";



GRANT ALL ON SEQUENCE "public"."bad_words_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."bad_words_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."bad_words_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."card" TO "anon";
GRANT ALL ON TABLE "public"."card" TO "authenticated";
GRANT ALL ON TABLE "public"."card" TO "service_role";



GRANT ALL ON TABLE "public"."conversation" TO "anon";
GRANT ALL ON TABLE "public"."conversation" TO "authenticated";
GRANT ALL ON TABLE "public"."conversation" TO "service_role";



GRANT ALL ON SEQUENCE "public"."conversation_conversation_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."conversation_conversation_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."conversation_conversation_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."court" TO "anon";
GRANT ALL ON TABLE "public"."court" TO "authenticated";
GRANT ALL ON TABLE "public"."court" TO "service_role";



GRANT ALL ON SEQUENCE "public"."court_court_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."court_court_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."court_court_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."deck" TO "anon";
GRANT ALL ON TABLE "public"."deck" TO "authenticated";
GRANT ALL ON TABLE "public"."deck" TO "service_role";



GRANT ALL ON SEQUENCE "public"."deck_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."deck_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."deck_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."event" TO "anon";
GRANT ALL ON TABLE "public"."event" TO "authenticated";
GRANT ALL ON TABLE "public"."event" TO "service_role";



GRANT ALL ON SEQUENCE "public"."event_event_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."event_event_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."event_event_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."event_participant" TO "anon";
GRANT ALL ON TABLE "public"."event_participant" TO "authenticated";
GRANT ALL ON TABLE "public"."event_participant" TO "service_role";



GRANT ALL ON SEQUENCE "public"."event_participant_event_participant_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."event_participant_event_participant_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."event_participant_event_participant_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."event_report" TO "anon";
GRANT ALL ON TABLE "public"."event_report" TO "authenticated";
GRANT ALL ON TABLE "public"."event_report" TO "service_role";



GRANT ALL ON SEQUENCE "public"."event_report_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."event_report_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."event_report_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."event_report_type" TO "anon";
GRANT ALL ON TABLE "public"."event_report_type" TO "authenticated";
GRANT ALL ON TABLE "public"."event_report_type" TO "service_role";



GRANT ALL ON SEQUENCE "public"."event_report_type_report_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."event_report_type_report_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."event_report_type_report_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."event_status" TO "anon";
GRANT ALL ON TABLE "public"."event_status" TO "authenticated";
GRANT ALL ON TABLE "public"."event_status" TO "service_role";



GRANT ALL ON SEQUENCE "public"."event_status_event_status_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."event_status_event_status_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."event_status_event_status_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."friend_request" TO "anon";
GRANT ALL ON TABLE "public"."friend_request" TO "authenticated";
GRANT ALL ON TABLE "public"."friend_request" TO "service_role";



GRANT ALL ON SEQUENCE "public"."friend_request_friend_request_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."friend_request_friend_request_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."friend_request_friend_request_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."friendship" TO "anon";
GRANT ALL ON TABLE "public"."friendship" TO "authenticated";
GRANT ALL ON TABLE "public"."friendship" TO "service_role";



GRANT ALL ON SEQUENCE "public"."friendship_friendship_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."friendship_friendship_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."friendship_friendship_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."game" TO "anon";
GRANT ALL ON TABLE "public"."game" TO "authenticated";
GRANT ALL ON TABLE "public"."game" TO "service_role";



GRANT ALL ON SEQUENCE "public"."game_game_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."game_game_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."game_game_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."gender" TO "anon";
GRANT ALL ON TABLE "public"."gender" TO "authenticated";
GRANT ALL ON TABLE "public"."gender" TO "service_role";



GRANT ALL ON SEQUENCE "public"."gender_gender_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."gender_gender_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."gender_gender_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."instructions" TO "anon";
GRANT ALL ON TABLE "public"."instructions" TO "authenticated";
GRANT ALL ON TABLE "public"."instructions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."instructions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."instructions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."instructions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."jersey_sprite" TO "anon";
GRANT ALL ON TABLE "public"."jersey_sprite" TO "authenticated";
GRANT ALL ON TABLE "public"."jersey_sprite" TO "service_role";



GRANT ALL ON SEQUENCE "public"."jersey_sprite_jersey_sprite_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."jersey_sprite_jersey_sprite_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."jersey_sprite_jersey_sprite_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."matchup" TO "anon";
GRANT ALL ON TABLE "public"."matchup" TO "authenticated";
GRANT ALL ON TABLE "public"."matchup" TO "service_role";



GRANT ALL ON SEQUENCE "public"."matchup_matchup_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."matchup_matchup_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."matchup_matchup_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."message" TO "anon";
GRANT ALL ON TABLE "public"."message" TO "authenticated";
GRANT ALL ON TABLE "public"."message" TO "service_role";



GRANT ALL ON SEQUENCE "public"."message_message_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."message_message_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."message_message_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."minigame_match" TO "anon";
GRANT ALL ON TABLE "public"."minigame_match" TO "authenticated";
GRANT ALL ON TABLE "public"."minigame_match" TO "service_role";



GRANT ALL ON SEQUENCE "public"."minigame_match_match_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."minigame_match_match_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."minigame_match_match_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."news" TO "anon";
GRANT ALL ON TABLE "public"."news" TO "authenticated";
GRANT ALL ON TABLE "public"."news" TO "service_role";



GRANT ALL ON TABLE "public"."news_category" TO "anon";
GRANT ALL ON TABLE "public"."news_category" TO "authenticated";
GRANT ALL ON TABLE "public"."news_category" TO "service_role";



GRANT ALL ON SEQUENCE "public"."news_news_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."news_news_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."news_news_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."npc_archetype" TO "anon";
GRANT ALL ON TABLE "public"."npc_archetype" TO "authenticated";
GRANT ALL ON TABLE "public"."npc_archetype" TO "service_role";



GRANT ALL ON SEQUENCE "public"."npc_archetype_npc_archetype_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."npc_archetype_npc_archetype_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."npc_archetype_npc_archetype_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."npc_difficulty_config" TO "anon";
GRANT ALL ON TABLE "public"."npc_difficulty_config" TO "authenticated";
GRANT ALL ON TABLE "public"."npc_difficulty_config" TO "service_role";



GRANT ALL ON SEQUENCE "public"."npc_difficulty_config_config_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."npc_difficulty_config_config_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."npc_difficulty_config_config_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."npc_team" TO "anon";
GRANT ALL ON TABLE "public"."npc_team" TO "authenticated";
GRANT ALL ON TABLE "public"."npc_team" TO "service_role";



GRANT ALL ON SEQUENCE "public"."npc_team_npc_team_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."npc_team_npc_team_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."npc_team_npc_team_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."pack" TO "anon";
GRANT ALL ON TABLE "public"."pack" TO "authenticated";
GRANT ALL ON TABLE "public"."pack" TO "service_role";



GRANT ALL ON TABLE "public"."pack_card" TO "anon";
GRANT ALL ON TABLE "public"."pack_card" TO "authenticated";
GRANT ALL ON TABLE "public"."pack_card" TO "service_role";



GRANT ALL ON SEQUENCE "public"."pack_card_pack_card_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."pack_card_pack_card_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."pack_card_pack_card_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."pack_pack_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."pack_pack_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."pack_pack_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."pack_rarity" TO "anon";
GRANT ALL ON TABLE "public"."pack_rarity" TO "authenticated";
GRANT ALL ON TABLE "public"."pack_rarity" TO "service_role";



GRANT ALL ON SEQUENCE "public"."pack_rarity_pack_rarity_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."pack_rarity_pack_rarity_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."pack_rarity_pack_rarity_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."pack_type" TO "anon";
GRANT ALL ON TABLE "public"."pack_type" TO "authenticated";
GRANT ALL ON TABLE "public"."pack_type" TO "service_role";



GRANT ALL ON SEQUENCE "public"."pack_type_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."pack_type_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."pack_type_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."question" TO "anon";
GRANT ALL ON TABLE "public"."question" TO "authenticated";
GRANT ALL ON TABLE "public"."question" TO "service_role";



GRANT ALL ON SEQUENCE "public"."question_question_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."question_question_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."question_question_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."rarity" TO "anon";
GRANT ALL ON TABLE "public"."rarity" TO "authenticated";
GRANT ALL ON TABLE "public"."rarity" TO "service_role";



GRANT ALL ON SEQUENCE "public"."rarity_rarity_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."rarity_rarity_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."rarity_rarity_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."report_type" TO "anon";
GRANT ALL ON TABLE "public"."report_type" TO "authenticated";
GRANT ALL ON TABLE "public"."report_type" TO "service_role";



GRANT ALL ON SEQUENCE "public"."report_type_report_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."report_type_report_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."report_type_report_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."scope" TO "anon";
GRANT ALL ON TABLE "public"."scope" TO "authenticated";
GRANT ALL ON TABLE "public"."scope" TO "service_role";



GRANT ALL ON SEQUENCE "public"."scope_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."scope_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."scope_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."skill_level" TO "anon";
GRANT ALL ON TABLE "public"."skill_level" TO "authenticated";
GRANT ALL ON TABLE "public"."skill_level" TO "service_role";



GRANT ALL ON SEQUENCE "public"."skill_level_skill_level_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."skill_level_skill_level_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."skill_level_skill_level_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."sprite" TO "anon";
GRANT ALL ON TABLE "public"."sprite" TO "authenticated";
GRANT ALL ON TABLE "public"."sprite" TO "service_role";



GRANT ALL ON SEQUENCE "public"."sprite_sprite_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."sprite_sprite_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."sprite_sprite_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."team" TO "anon";
GRANT ALL ON TABLE "public"."team" TO "authenticated";
GRANT ALL ON TABLE "public"."team" TO "service_role";



GRANT ALL ON TABLE "public"."team_player" TO "anon";
GRANT ALL ON TABLE "public"."team_player" TO "authenticated";
GRANT ALL ON TABLE "public"."team_player" TO "service_role";



GRANT ALL ON TABLE "public"."team_player_stats" TO "anon";
GRANT ALL ON TABLE "public"."team_player_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."team_player_stats" TO "service_role";



GRANT ALL ON SEQUENCE "public"."team_player_stats_team_player_stats_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."team_player_stats_team_player_stats_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."team_player_stats_team_player_stats_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."team_player_team_player_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."team_player_team_player_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."team_player_team_player_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."team_player_team_player_id_seq1" TO "anon";
GRANT ALL ON SEQUENCE "public"."team_player_team_player_id_seq1" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."team_player_team_player_id_seq1" TO "service_role";



GRANT ALL ON TABLE "public"."team_stats_comparision" TO "anon";
GRANT ALL ON TABLE "public"."team_stats_comparision" TO "authenticated";
GRANT ALL ON TABLE "public"."team_stats_comparision" TO "service_role";



GRANT ALL ON SEQUENCE "public"."team_team_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."team_team_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."team_team_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."tips" TO "anon";
GRANT ALL ON TABLE "public"."tips" TO "authenticated";
GRANT ALL ON TABLE "public"."tips" TO "service_role";



GRANT ALL ON SEQUENCE "public"."tips_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."tips_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."tips_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_achievement" TO "anon";
GRANT ALL ON TABLE "public"."user_achievement" TO "authenticated";
GRANT ALL ON TABLE "public"."user_achievement" TO "service_role";



GRANT ALL ON TABLE "public"."user_card" TO "anon";
GRANT ALL ON TABLE "public"."user_card" TO "authenticated";
GRANT ALL ON TABLE "public"."user_card" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_card_user_card_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_card_user_card_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_card_user_card_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_event" TO "anon";
GRANT ALL ON TABLE "public"."user_event" TO "authenticated";
GRANT ALL ON TABLE "public"."user_event" TO "service_role";



GRANT ALL ON TABLE "public"."user_event_ratings" TO "anon";
GRANT ALL ON TABLE "public"."user_event_ratings" TO "authenticated";
GRANT ALL ON TABLE "public"."user_event_ratings" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_event_ratings_user_event_rating_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_event_ratings_user_event_rating_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_event_ratings_user_event_rating_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_event_user_event_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_event_user_event_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_event_user_event_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_laker" TO "anon";
GRANT ALL ON TABLE "public"."user_laker" TO "authenticated";
GRANT ALL ON TABLE "public"."user_laker" TO "service_role";



GRANT ALL ON TABLE "public"."user_report" TO "anon";
GRANT ALL ON TABLE "public"."user_report" TO "authenticated";
GRANT ALL ON TABLE "public"."user_report" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_report_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_report_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_report_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_type" TO "anon";
GRANT ALL ON TABLE "public"."user_type" TO "authenticated";
GRANT ALL ON TABLE "public"."user_type" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_type_user_type_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_type_user_type_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_type_user_type_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_vote" TO "anon";
GRANT ALL ON TABLE "public"."user_vote" TO "authenticated";
GRANT ALL ON TABLE "public"."user_vote" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_vote_id_seq1" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_vote_id_seq1" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_vote_id_seq1" TO "service_role";



GRANT ALL ON TABLE "public"."v_npc_config" TO "anon";
GRANT ALL ON TABLE "public"."v_npc_config" TO "authenticated";
GRANT ALL ON TABLE "public"."v_npc_config" TO "service_role";



GRANT ALL ON TABLE "public"."view_player_stats" TO "anon";
GRANT ALL ON TABLE "public"."view_player_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."view_player_stats" TO "service_role";



GRANT ALL ON TABLE "public"."warn_type" TO "anon";
GRANT ALL ON TABLE "public"."warn_type" TO "authenticated";
GRANT ALL ON TABLE "public"."warn_type" TO "service_role";



GRANT ALL ON SEQUENCE "public"."warn_type_warn_type_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."warn_type_warn_type_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."warn_type_warn_type_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."warning" TO "anon";
GRANT ALL ON TABLE "public"."warning" TO "authenticated";
GRANT ALL ON TABLE "public"."warning" TO "service_role";



GRANT ALL ON SEQUENCE "public"."warning_warning_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."warning_warning_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."warning_warning_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."wrap_backgrounds" TO "anon";
GRANT ALL ON TABLE "public"."wrap_backgrounds" TO "authenticated";
GRANT ALL ON TABLE "public"."wrap_backgrounds" TO "service_role";



GRANT SELECT ON TABLE "simulacion_juego"."game" TO "anon";
GRANT SELECT ON TABLE "simulacion_juego"."game" TO "authenticated";



GRANT SELECT ON SEQUENCE "simulacion_juego"."game_game_id_seq" TO "anon";



GRANT SELECT ON TABLE "simulacion_juego"."team" TO "anon";
GRANT SELECT ON TABLE "simulacion_juego"."team" TO "authenticated";



GRANT SELECT,UPDATE ON TABLE "simulacion_juego"."team_player_stats" TO "anon";
GRANT SELECT,UPDATE ON TABLE "simulacion_juego"."team_player_stats" TO "authenticated";



GRANT SELECT ON SEQUENCE "simulacion_juego"."team_player_stats_team_player_stats_id_seq" TO "anon";



GRANT SELECT ON SEQUENCE "simulacion_juego"."team_player_team_player_id_seq" TO "anon";



GRANT SELECT ON SEQUENCE "simulacion_juego"."team_team_id_seq" TO "anon";



GRANT SELECT ON TABLE "simulacion_juego"."v_fieldgoal" TO "anon";
GRANT SELECT ON TABLE "simulacion_juego"."v_fieldgoal" TO "authenticated";



GRANT SELECT ON TABLE "simulacion_juego"."v_marcador_activo" TO "anon";
GRANT SELECT ON TABLE "simulacion_juego"."v_marcador_activo" TO "authenticated";



GRANT SELECT ON TABLE "simulacion_juego"."v_prox_juego" TO "anon";
GRANT SELECT ON TABLE "simulacion_juego"."v_prox_juego" TO "authenticated";



GRANT SELECT ON TABLE "simulacion_juego"."v_scoreboard" TO "anon";
GRANT SELECT ON TABLE "simulacion_juego"."v_scoreboard" TO "authenticated";



GRANT SELECT ON TABLE "simulacion_juego"."v_team_comparison" TO "anon";
GRANT SELECT ON TABLE "simulacion_juego"."v_team_comparison" TO "authenticated";



GRANT SELECT ON TABLE "simulacion_juego"."view_marcadores" TO "anon";
GRANT SELECT ON TABLE "simulacion_juego"."view_marcadores" TO "authenticated";



GRANT SELECT ON TABLE "simulacion_juego"."view_player_season_average" TO "anon";
GRANT SELECT ON TABLE "simulacion_juego"."view_player_season_average" TO "authenticated";



GRANT SELECT ON TABLE "simulacion_juego"."view_player_stats" TO "anon";
GRANT SELECT ON TABLE "simulacion_juego"."view_player_stats" TO "authenticated";



GRANT SELECT ON TABLE "simulacion_juego"."view_team_stats_comparision" TO "anon";
GRANT SELECT ON TABLE "simulacion_juego"."view_team_stats_comparision" TO "authenticated";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































drop extension if exists "pg_net";

create extension if not exists "pg_net" with schema "public";

drop policy "allow_select_bad_words" on "public"."bad_words";

drop policy "Public read event_report_type" on "public"."event_report_type";

drop policy "Read packs" on "public"."pack";

drop policy "Pack rarity probabilities" on "public"."pack_rarity";

drop policy "Access pack type" on "public"."pack_type";

drop policy "Enable read access for all users" on "public"."question";

drop policy "Card rarity categories" on "public"."rarity";

drop policy "Allow public read on report_type" on "public"."report_type";

drop policy "Public read skill_level" on "public"."skill_level";

drop policy "Los wrap backgrounds son públicos" on "public"."wrap_backgrounds";

drop policy "Enable read access for all users" on "simulacion_juego"."game";

drop policy "Enable read access for all users" on "simulacion_juego"."team";

drop policy "allow update stats" on "simulacion_juego"."team_player_stats";


  create policy "allow_select_bad_words"
  on "public"."bad_words"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "Public read event_report_type"
  on "public"."event_report_type"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "Read packs"
  on "public"."pack"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "Pack rarity probabilities"
  on "public"."pack_rarity"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "Access pack type"
  on "public"."pack_type"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "Enable read access for all users"
  on "public"."question"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "Card rarity categories"
  on "public"."rarity"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "Allow public read on report_type"
  on "public"."report_type"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "Public read skill_level"
  on "public"."skill_level"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "Los wrap backgrounds son públicos"
  on "public"."wrap_backgrounds"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "Enable read access for all users"
  on "simulacion_juego"."game"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "Enable read access for all users"
  on "simulacion_juego"."team"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "allow update stats"
  on "simulacion_juego"."team_player_stats"
  as permissive
  for update
  to anon, authenticated
using (true)
with check (true);



  create policy "Anyone can view avatars"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'user_images'::text));



  create policy "Users can delete their own avatar"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'user_images'::text) AND (storage.filename(name) ~~ ((auth.uid())::text || '-%'::text))));



  create policy "Users can upload their own avatar"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'user_images'::text));



  create policy "Usuarios pueden actualizar su pfp"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using ((bucket_id = 'user_images'::text))
with check ((bucket_id = 'user_images'::text));



