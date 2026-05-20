import { supabase } from "../../lib/supabase";
import type {Player} from "./Player"
import type {PlayerSeasonAverage} from "./Player"

export async function getLakersPlayers(): Promise<Player[]> {
  const { data, error } = await supabase
  .rpc('get_lakers_players')
  if (error) {
    console.error(error);
    throw error;
  }

  return data ?? [];
}

export async function getPlayerSeasons(teamPlayerId: number) {
  const { data, error } = await supabase
    .schema('simulacion_juego')
    .from('view_player_season_average')
    .select('*')
    .eq('team_player_id', teamPlayerId)
    .order('season_start', { ascending: true });

  if (error) throw error;
  return data as PlayerSeasonAverage[];
}