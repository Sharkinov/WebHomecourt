
export type Player = {
  team_player_id: number
  first_name: string
  last_name: string
  photo_url:string
}

export type PlayerSeason = {
  season_start: number;
}

export interface PlayerSeasonAverage {
  team_player_id: number;
  full_name: string;
  season_start: number;
  points_per_game: number;
  rebounds_per_game: number;
  assists_per_game: number;
  steals_per_game: number;
  turnovers_per_game: number;
  fg_pct: number;
}