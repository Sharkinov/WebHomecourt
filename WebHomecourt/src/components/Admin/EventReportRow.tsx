import { useNavigate } from 'react-router-dom'

const priorityStyles: Record<string, string> = {
  High:   'bg-[#FF6060]/56 text-[#4C0808]',
  Medium: 'bg-[#FFCF81]/70 text-[#543401]',
  Low:    'bg-[#28924F]/26 text-[#083C1B]',
}

const statusStyles: Record<string, string> = {
  Pending:  'bg-gray-200 text-gray-600',
  Reviewed: 'bg-morado-disabled text-white',
}

interface EventReportRowProps {
  id: string
  event: string
  location: string
  date: string
  host: string
  pfp: string
  priority: string
  status: string
}

const EventReportRow = ({ id, event, location, date, host, pfp, priority, status }: EventReportRowProps) => {
  const navigate = useNavigate()

  return (
    <tr className="border-t border-gray-100 hover:bg-gray-50">
      <td className="px-4 py-3 text-center">
        <h2 style={{ fontSize: '18px' }}>#{id}</h2>
      </td>
      <td className="px-4 py-3 text-center">
        <p>{date}</p>
      </td>
      <td className="px-4 py-3 text-center">
        <p>{event}</p>
      </td>
      <td className="px-4 py-3 text-center">
        <p>{location}</p>
      </td>
      
      <td className="px-4 py-3 text-center">
        <div className="flex items-center gap-2 w-[140px] mx-auto">
          <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
            {pfp ? (
              <img src={pfp} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-300" />
            )}
          </div>
          <p>{host}</p>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <span className={`inline-block w-24 py-1 rounded-full text-sm font-medium text-center ${priorityStyles[priority]}`}>
          {priority}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className={`inline-flex items-center gap-1 w-24 py-1 rounded-full text-sm font-medium justify-center ${statusStyles[status]}`}>
          {status === 'Pending' && (
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>timer</span>
          )}
          {status}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <button
          onClick={() => navigate(`/admin/event/${id}`)}
          className="w-28 border border-morado-lakers text-morado-lakers px-4 py-1 rounded-lg text-sm font-medium hover:bg-morado-lakers hover:text-white transition-colors"
        >
          {status === 'Pending' ? 'Review' : 'View'}
        </button>
      </td>
    </tr>
  )
}

export default EventReportRow