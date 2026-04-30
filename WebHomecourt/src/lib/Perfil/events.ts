import { supabase } from '../supabase'

export type EventItem = {
    id: number
    name: string
    courtName: string
    date: string
    joinedCount: number
    maxPlayers: number
}

export async function getUpcomingEvents(userId: string): Promise<EventItem[]> {
    if (!userId) return []

    const { data: userEvents, error: participantError } = await supabase
        .from('event_participant')
        .select('event_id')
        .eq('user_id', userId)

    if (participantError || !userEvents || userEvents.length === 0) {
        console.error("Error fetching user events:", participantError)
        return []
    }

    const eventIds = userEvents.map((e: { event_id: number }) => e.event_id)

    const now = new Date().toISOString()

    const { data: eventsData, error: eventsError } = await supabase
        .from('event')
        .select('event_id, event_name, date, max_players, court_id')
        .in('event_id', eventIds)
        .gte('date', now) // Solo eventos futuros

    if (eventsError || !eventsData) {
        console.error("Error fetching events:", eventsError)
        return []
    }

    const results: EventItem[] = []

    for (const event of eventsData) {
        let courtName = 'TBD'
        if (event.court_id) {
            const { data: court } = await supabase
                .from('court')
                .select('name')
                .eq('court_id', event.court_id)
                .maybeSingle()

            if (court) {
                courtName = court.name
            }
        }

        const { count } = await supabase
            .from('event_participant')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.event_id)

        results.push({
            id: event.event_id,
            name: event.event_name || 'Unnamed Event',
            courtName: courtName,
            date: event.date,
            joinedCount: count || 0,
            maxPlayers: event.max_players || 10
        })
    }

    results.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return results
}