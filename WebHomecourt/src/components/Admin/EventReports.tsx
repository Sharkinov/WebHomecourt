import { useEffect, useState } from 'react'
import { getEventReports } from '../../pages/Admin'
import EventReportRow from './EventReportRow'

const priorityOrder: Record<string, number> = { High: 1, Medium: 2, Low: 3 }

const EventReports = () => {
  const [reports, setReports] = useState<any[]>([])

  useEffect(() => {
    const fetchReports = async () => {
      const data = await getEventReports()
      const sorted = [...data].sort((a, b) =>
        (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99)
      )
      setReports(sorted)
    }
    fetchReports()
  }, [])

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mt-6">
      <div className="bg-violet-950 px-5 py-5">
        <p className="text-white font-bold" style={{ fontSize: '26px' }}>Event Reports</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="bg-morado-lakers text-white">
            <tr>
              <th className="px-4 py-3 text-center font-medium" style={{ fontSize: '20px' }}>Event ID</th>
              <th className="px-4 py-3 text-center font-medium" style={{ fontSize: '20px' }}>Date</th>
              <th className="px-4 py-3 text-center font-medium" style={{ fontSize: '20px' }}>Event</th>
              <th className="px-4 py-3 text-center font-medium" style={{ fontSize: '20px' }}>Location</th>
              <th className="px-4 py-3 text-center font-medium" style={{ fontSize: '20px' }}>Host</th>
              <th className="px-4 py-3 text-center font-medium" style={{ fontSize: '20px' }}>Priority</th>
              <th className="px-4 py-3 text-center font-medium" style={{ fontSize: '20px' }}>Status</th>
              <th className="px-4 py-3 text-center font-medium" style={{ fontSize: '20px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <EventReportRow
                key={report.ereport_id}
                id={report.ereport_id}
                event={report.event?.event_name ?? 'N/A'}
                location={report.event?.court?.name ?? 'N/A'}
                date={report.event?.date ? new Date(report.event.date).toLocaleDateString() : 'N/A'}
                host={report.reporter?.username ?? 'N/A'}
                pfp={report.reporter?.photo_url ?? ''}
                priority={report.priority}
                status={report.status}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default EventReports