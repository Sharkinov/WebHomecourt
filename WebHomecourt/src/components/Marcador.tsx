import { supabase } from "../lib/supabase"

export type MarcadorReal = {
  game_id: number
  current_quarter: number
  elapsed_seconds: number
  lakers_team_name: string
  lakers_logo: string
  opposing_team_name: string
  opposing_team_logo: string
  lakers_score: number
  opposing_score: number
  venue: string
  attended: number
  home: boolean
}

export async function getScoreboard(): Promise<MarcadorReal | null> {
  const { data, error } = await supabase
    .schema("simulacion_juego")
    .from("v_scoreboard")
    .select("*")
    .single()

  if (error) {
    console.error("Supabase error:", error.message)
    return null
  }

  return data
}