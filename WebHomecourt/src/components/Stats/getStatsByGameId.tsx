import { supabase } from "../../lib/supabase"

export type PlayerStat = { 
  team_player_stats_id: number
  game_id: number
  photo_url: string
  team_player_id: number
  full_name: string,
  minutes: string
  points: number
  rebounds: number
  assists: number
  steals: number
  turnovers: number
  field_made: number
  field_attempted: number
};


export async function getStatsByGameId(game_id: number): Promise<PlayerStat[]> {
  if (!game_id) {
    throw new Error("No game selected to display")
  }

  const { data, error } = await supabase
    .schema("simulacion_juego")   
    .from("view_player_stats")
    .select(`
      team_player_stats_id,
      game_id,
      photo_url,
      team_player_id,
      full_name,
      minutes,
      points,
      rebounds,
      assists,
      steals,
      turnovers,
      field_made,
      field_attempted
    `)
    .eq("game_id", game_id)
    .order("team_player_id", { ascending: true })

  if (error) {
    console.error("Supabase error:", error.message)
    throw new Error("Failed to fetch stats")
  }

  return data ?? []
}
