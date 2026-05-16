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
  fg_pct: number | null
  three_pct: number | null
  rated_others: boolean | null
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

export async function getCurrentUserReputation(): Promise<number | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user?.id) {
    return null
  }

  const { data, error } = await supabase
    .from('user_laker')
    .select('reputation')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    return null
  }

  return data?.reputation ?? null
}

export async function getCurrentUserActivity(): Promise<UserActivityStats | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user?.id) {
    return null
  }

  const { data, error } = await supabase
    .rpc('get_user_stats', { p_user_id: user.id })
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

export async function getCurrentUserMatchHistorySummary(): Promise<UserMatchHistorySummary | null> {
  const rows = await getCurrentUserMatchHistoryRows()

  if (!rows) {
    return null
  }

  return buildMatchHistorySummary(rows)
}

export async function getCurrentUserMatchHistoryRows(): Promise<UserMatchHistoryRow[] | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user?.id) {
    return null
  }

  const { data, error } = await supabase
    .rpc('get_user_match_history', { p_user_id: user.id })

  if (error || !data) {
    return null
  }

  return data as UserMatchHistoryRow[]
}

export async function getCurrentUserMatchHistoryDashboard(): Promise<UserMatchHistoryDashboard | null> {
  const rows = await getCurrentUserMatchHistoryRows()

  if (!rows) {
    return null
  }

  return {
    rows,
    summary: buildMatchHistorySummary(rows),
  }
}

export async function getCurrentUserWinStreak(): Promise<UserWinStreakSummary | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user?.id) {
    return null
  }

  const { data, error } = await supabase
    .rpc('get_user_win_streak', { p_user_id: user.id })
    .single()

  if (error || !data) {
    return null
  }

  const row = data as {
    current_streak?: number | string | null
    max_streak?: number | string | null
  }

  const parsedCurrentStreak = Number(row.current_streak ?? 0)
  const parsedMaxStreak = Number(row.max_streak ?? 0)

  return {
    currentStreak: Number.isFinite(parsedCurrentStreak) ? parsedCurrentStreak : 0,
    maxStreak: Number.isFinite(parsedMaxStreak) ? parsedMaxStreak : 0,
  }
}
