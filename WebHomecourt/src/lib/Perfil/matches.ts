import { supabase } from '../supabase'

export type MatchItem = {
    id: number
    eventName: string
    result: 'Win' | 'Loss'
    userScore: number
    opponentScore: number
    date: string
}

export async function getUserMatches(userId: string): Promise<MatchItem[]> {
    if (!userId) return []

    // Obtener los user_events con resultado (solo partidos completados)
    const { data: userEvents, error } = await supabase
        .from('user_event')
        .select('user_event_id, event_id, result, user_score, opponent_score')
        .eq('user_id', userId)
        .not('result', 'is', null)
        .order('user_event_id', { ascending: false })
        .limit(3)

    if (error || !userEvents || userEvents.length === 0) return []

    const results: MatchItem[] = []

    for (const match of userEvents) {
        const { data: event } = await supabase
            .from('event')
            .select('event_name, date')
            .eq('event_id', match.event_id)
            .single()

        if (!event) continue

        // Formatear fecha como "25 Feb"
        const date = new Date(event.date)
        const formattedDate = date.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short'
        })

        results.push({
            id: match.user_event_id,
            eventName: event.event_name,
            result: match.result ? 'Win' : 'Loss',
            userScore: match.user_score || 0,
            opponentScore: match.opponent_score || 0,
            date: formattedDate
        })
    }

    return results
}
