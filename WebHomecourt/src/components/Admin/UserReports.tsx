import UserReportRow from './UserReportRow'
import { getUserReports } from '../../pages/Admin'
import { useEffect, useState } from 'react'

const priorityOrder: Record<string, number> = { High: 1, Medium: 2, Low: 3 }

const UserReportsTable = () => {
  const [reports, setReports] = useState<any[]>([])

  useEffect(() => {
    const fetchReports = async () => {
      const data = await getUserReports()
      const normalize = (p: string) => p?.charAt(0).toUpperCase() + p?.slice(1).toLowerCase()
      const sorted = [...data].sort((a, b) =>
        (priorityOrder[normalize(a.priority)] ?? 99) - (priorityOrder[normalize(b.priority)] ?? 99)
      )
      setReports(sorted)
    }
    fetchReports()
  }, [])

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mt-6">
      <div className="bg-violet-950 px-5 py-5">
        <p className="text-white font-bold" style={{ fontSize: '26px' }}>User Reports</p>
      </div>
      <div className="overflow-x-auto">
        <div className="max-h-[500px] overflow-y-auto">
        <table className="w-full min-w-[640px]">
          <thead className="bg-morado-lakers text-white sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-center font-medium" style={{ fontSize: '20px' }}>Report ID</th>
              <th className="px-4 py-3 text-center font-medium" style={{ fontSize: '20px' }}>Event</th>
              <th className="px-4 py-3 text-center font-medium" style={{ fontSize: '20px' }}>Reported User</th>
              <th className="px-4 py-3 text-center font-medium" style={{ fontSize: '20px' }}>Priority</th>
              <th className="px-4 py-3 text-center font-medium" style={{ fontSize: '20px' }}>Status</th>
              <th className="px-4 py-3 text-center font-medium" style={{ fontSize: '20px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <UserReportRow
                key={report.ureport_id}
                id={report.ureport_id}
                event={report.event?.event_name ?? 'N/A'}
                reportedUser={report.reported_user?.username ?? 'N/A'}
                pfp={report.reported_user?.photo_url ?? ''}
                priority={report.priority}
                status={report.status}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  )
}

export default UserReportsTable