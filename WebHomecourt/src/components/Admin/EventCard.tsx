import { useNavigate } from 'react-router-dom'

const statusStyles: Record<string, string> = {
  Upcoming: 'bg-[#28924F]/26 text-[#083C1B]',
  Scheduled: 'bg-[#FCB136]/49 text-[#4E3204]',
}

interface EventCardProps {
  id: number
  name: string
  status: string
  pfp: string
  host: string
  location: string
  players: number
}

const EventCard = ({ id, name, status, pfp, host, location, players }: EventCardProps) => {
  const navigate = useNavigate()

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col justify-between h-full">
      
      <div className="flex items-start justify-between gap-2 pb-3">
        <h2 className="font-bold leading-tight break-words min-w-0" style={{ fontSize: '26px' }}>{name}</h2>
        <span className={`shrink-0 px-2 py-1 rounded-full text-sm font-medium ${statusStyles[status]}`} style={{ fontSize: '16px' }}>
          {status}
        </span>
      </div>

      <div className="flex items-center gap-2 pb-2">
        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
            {pfp ? (
              <img src={pfp} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-300" />
            )}
          </div>
        <p className="font-medium">@{host}</p>
      </div>

      <div className="flex justify-between items-center gap-2 pt-2">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-gray-500" style={{ fontSize: '18px' }}>location_on</span>
            <p className="truncate">{location}</p>
          </div>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-gray-500" style={{ fontSize: '18px' }}>groups</span>
            <p>{players}</p>
          </div>
        </div>

        <button 
          onClick={() => navigate(`/admin/monitor/${id}`)}
          className="bg-morado-lakers text-white px-5 py-2 rounded-lg font-medium hover:bg-morado-oscuro transition-colors">
          Monitor
        </button>
      </div>

    </div>
  )
}

export default EventCard