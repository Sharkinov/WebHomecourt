import { supabase } from '../lib/supabase'

export interface UserActivityStats {
  eventsCreated: number
  eventsAttended: number
}

export interface UserMatchHistoryRow {
  user_event_id: number
  event_id: number
  event_name: string
  event_date: string | null
  event_status_id: number | null
  event_status_name: string | null
  court_name: string | null
  court_direction: string | null
  result: boolean | null
  user_score: number | null
  opponent_score: number | null
  points: number | null
  rebounds: number | null
  assists: number | null
  steals: number | null
  blocks: number | null

  field_goals: number | null
  field_goals_attempts: number | null
  tre_pointer: number | null
  tre_pointer_atemp: number | null
  // Calculados
  fg_pct: number | null
  three_pct: number | null
  avg_rating_received: number | null
  rated_others: boolean | null
}

export interface SaveUserEventStatsPayload {
  user_event_id: number
  user_score: number
  opponent_score: number
  result: boolean
  points: number
  rebounds: number
  assists: number

  steals?: number | null
  blocks?: number | null

  // Shooting splits opcionales
  field_goals?: number | null        // FG Made
  field_goals_attempts?: number | null
  tre_pointer?: number | null        // 3P Made
  tre_pointer_atemp?: number | null


}

export interface UserMatchHistorySummary {
  totalMatches: number
  wins: number
  losses: number
  pending: number
  ppg: number
  rpg: number
  apg: number
  fgPct: number
  threePct: number
}

export interface UserWinStreakSummary {
  currentStreak: number
  maxStreak: number
}

export interface UserMatchHistoryDashboard {
  rows: UserMatchHistoryRow[]
  summary: UserMatchHistorySummary
  streak: UserWinStreakSummary
}

const buildWinStreakSummary = (rows: UserMatchHistoryRow[]): UserWinStreakSummary => {
  const completedRows = rows.filter((row) => row.result !== null)

  let currentStreak = 0
  for (const row of completedRows) {
    if (row.result === true) {
      currentStreak += 1
    } else {
      break
    }
  }

  let maxStreak = 0
  let tempStreak = 0
  for (const row of completedRows) {
    if (row.result === true) {
      tempStreak += 1
      if (tempStreak > maxStreak) {
        maxStreak = tempStreak
      }
    } else {
      tempStreak = 0
    }
  }

  return {
    currentStreak,
    maxStreak,
  }
}

const averageNumbers = (values: Array<number | null | undefined>) => {
  const numeric = values.filter((value): value is number => Number.isFinite(value))
  if (numeric.length === 0) return 0
  const total = numeric.reduce((sum, value) => sum + value, 0)
  return total / numeric.length
}

const buildMatchHistorySummary = (rows: UserMatchHistoryRow[]): UserMatchHistorySummary => {
  const wins = rows.filter((row) => row.result === true).length
  const losses = rows.filter((row) => row.result === false).length
  const pending = rows.filter((row) => row.result === null).length

  return {
    totalMatches: rows.length,
    wins,
    losses,
    pending,
    ppg: averageNumbers(rows.map((row) => row.points)),
    rpg: averageNumbers(rows.map((row) => row.rebounds)),
    apg: averageNumbers(rows.map((row) => row.assists)),
    fgPct: averageNumbers(rows.map((row) => row.fg_pct)),
    threePct: averageNumbers(rows.map((row) => row.three_pct)),
  }
}

export async function getUserReputation(userId: string | null): Promise<number | null> {

  if (!userId) {
    return null
  }

  const { data, error } = await supabase
    .from('user_laker')
    .select('reputation')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    return null
  }

  return data?.reputation ?? null
}

export async function getCurrentUserActivity(userId: string): Promise<UserActivityStats | null> {

  if (!userId) {
    return null
  }

  const { data, error } = await supabase
    .rpc('get_user_stats', { p_user_id: userId })
    .single()

  if (error || !data) {
    return null
  }

  const row = data as {
    events_created?: number | string | null
    events_attended?: number | string | null
  }

  const parsedEventsCreated = Number(row.events_created ?? 0)
  const parsedEventsAttended = Number(row.events_attended ?? 0)

  return {
    eventsCreated: Number.isFinite(parsedEventsCreated) ? parsedEventsCreated : 0,
    eventsAttended: Number.isFinite(parsedEventsAttended) ? parsedEventsAttended : 0,
  }
}

export async function getCurrentUserMatchHistorySummary(userId: string | null): Promise<UserMatchHistorySummary | null> {
  const dashboard = await getCurrentUserMatchHistoryDashboard(userId)
  return dashboard?.summary ?? null
}

export async function getCurrentUserMatchHistoryRows(userId: string | null): Promise<UserMatchHistoryRow[] | null> {
  if (!userId) return null

  const { data, error } = await supabase
    .rpc('get_user_match_history', { p_user_id: userId })
  if (error || !data) return null
  return data as UserMatchHistoryRow[]
}

export async function getCurrentUserMatchHistoryDashboard(userId: string | null): Promise<UserMatchHistoryDashboard | null> {
  const rows = await getCurrentUserMatchHistoryRows(userId)
  if (!rows) return null
  return {
    rows,
    summary: buildMatchHistorySummary(rows),
    streak: buildWinStreakSummary(rows),
  }
}

export async function getCurrentUserWinStreak(userId: string | null): Promise<UserWinStreakSummary | null> {
  const rows = await getCurrentUserMatchHistoryRows(userId)
  if (!rows) return null
  return buildWinStreakSummary(rows)
}

export async function saveUserEventStats(
  payload: SaveUserEventStatsPayload,
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('user_event')
    .update({
      user_score: payload.user_score,
      opponent_score: payload.opponent_score,
      result: payload.result,
      points: payload.points,
      rebounds: payload.rebounds,
      assists: payload.assists,
      steals: payload.steals ?? null,
      blocks: payload.blocks ?? null,

      field_goals: payload.field_goals ?? null,
      field_goals_attempts: payload.field_goals_attempts ?? null,
      tre_pointer: payload.tre_pointer ?? null,
      tre_pointer_atemp: payload.tre_pointer_atemp ?? null,
      rated_others: true,
    })
    .eq('user_event_id', payload.user_event_id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}