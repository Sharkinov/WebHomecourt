import { useEffect, useState } from 'react'
import { getAdminStats } from '../../pages/Admin'

const StatsCards = ({ refreshKey }: { refreshKey: number }) => {
  const [stats, setStats] = useState({
    reportsPending: 0,
    usersFlagged: 0,
    eventsFlagged: 0,
    suspendedUsers: 0,
  })

  useEffect(() => {
    getAdminStats().then(setStats)
  }, [refreshKey])

  const cards = [
    { label: 'Reports Pending', value: stats.reportsPending, icon: 'assignment' },
    { label: 'Users Flagged',   value: stats.usersFlagged,   icon: 'person_alert' },
    { label: 'Events Flagged',  value: stats.eventsFlagged,  icon: 'flag' },
    { label: 'Suspended Users', value: stats.suspendedUsers, icon: 'account_circle_off' },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((s) => (
        <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-200 flex flex-col items-center">
          <h2 className="text-sm font-medium text-black text-center" style={{ fontSize: '20px' }}>{s.label}</h2>
          <div className="flex items-center gap-3 mt-2">
            <span className="material-symbols-outlined text-yellow-500" style={{ fontSize: '48px' }}>{s.icon}</span>
            <p className="title2 text-black" style={{ fontSize: '50px' }}>{s.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default StatsCards