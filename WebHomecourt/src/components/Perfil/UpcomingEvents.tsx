export type EventItem = {
    id: number
    name: string
    courtName: string
    date: string
    joinedCount: number
    maxPlayers: number
}

type Props = {
    events: EventItem[]
    isOwnProfile?: boolean
}

function UpcomingEvents({ events, isOwnProfile = true }: Props) {
    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString)
        const day = date.getDate()
        const month = date.toLocaleDateString('en-US', { month: 'short' })
        const hours = date.getHours().toString().padStart(2, '0')
        const minutes = date.getMinutes().toString().padStart(2, '0')
        return `${day} ${month}, ${hours}:${minutes}`
    }

    return (
        <div className="bg-white rounded-[15px] overflow-hidden border border-black/8 shadow-[0_4px_4px_0_rgba(0,0,0,0.08)]">

            <div className="h-[59px] bg-morado-oscuro flex items-center justify-between px-6">
                <span className="text-[#F3F2F3] text-[18px]">
                    {isOwnProfile ? 'My Upcoming Events' : 'Recent Activity'}
                </span>
            </div>

   
            {events.length === 0 ? (
                <div className="p-6 text-center text-Gris-Oscuro">
                    {isOwnProfile ? 'No upcoming events' : 'No recent activity'}
                </div>
            ) : (
                <div className="divide-y divide-[#E7E6E8]">
                    {events.slice(0, 3).map((event) => (
                        <div
                            key={event.id}
                            className="px-6 py-6 flex items-center gap-4"
                        >
                     
                            <div className="w-10 h-10 bg-[#542581] rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="material-symbols-outlined text-amarillo-lakers text-xl">
                                    calendar_today
                                </span>
                            </div>

               
                            <div className="flex-1 min-w-0">
                                <div className="text-[#11061A] text-[14px] font-normal leading-[21px] truncate">
                                    {event.name}
                                </div>
                                <div className="text-sm text-[#A09CA4]">
                                    {isOwnProfile ? `${event.courtName} • ${formatDateTime(event.date)}` : event.courtName}
                                </div>
                            </div>


                            <div className="bg-[#E7E6E8] text-sm text-[#6F6975] px-3 py-1 rounded-full flex-shrink-0">
                                {event.joinedCount}/{event.maxPlayers}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default UpcomingEvents