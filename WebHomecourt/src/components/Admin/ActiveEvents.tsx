import { useEffect, useState } from 'react'
import { getActiveEvents } from '../../pages/Admin'
import EventCard from './EventCard'

const ActiveEvents= () => {
  const [events, setEvents] = useState<any[]>([])
  const [page, setPage] = useState(0)

  const PAGE_SIZE = 3
  const totalPages = Math.ceil(events.length / PAGE_SIZE)
  const paginated = events.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  useEffect(() => {
    const fetchEvents = async () => {
      const data = await getActiveEvents()
      setEvents(data)
    }
    fetchEvents()
  }, [])

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mt-6">
      <div className="bg-violet-950 px-5 py-5 flex items-center justify-between">
        <p className="text-white font-bold leading-tight" style={{ fontSize: '26px' }}>Active Events</p>
        <div className="flex items-center gap-2 shrink-0 ml-4">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="text-white disabled:opacity-30 hover:opacity-75 transition text-4xl px-4"
          >
            ‹
          </button>
          <span className="text-white text-base">
            {page + 1} / {totalPages || 1}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="text-white disabled:opacity-30 hover:opacity-75 transition text-4xl px-4"
          >
            ›
          </button>
        </div>
      
      </div>
      <div className="bg-morado-lakers grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 px-10 pb-7 pt-7">
        {paginated.map((event) => (
          <EventCard
            key={event.event_id}
            id={event.event_id}
            name={event.event_name}
            status={(() => {
              const eventDate = new Date(event.date)
              const sevenDaysFromNow = new Date()
              sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
              return eventDate <= sevenDaysFromNow ? 'Upcoming' : 'Scheduled'
            })()}
            pfp = {event.created_user?.photo_url ?? ''}
            host={event.created_user?.username ?? 'N/A'}
            location={event.court?.name ?? 'N/A'}
            players={event.max_players}
            date={event.date ? new Date(event.date).toLocaleDateString() : 'N/A'}
          />
        ))}
      </div>
    </div>
  )
}

export default ActiveEvents