import { useEffect, useState } from 'react'
import DonutChart from './DonutChart'
import { supabase } from '../../lib/supabase'

const getReportStatusDistribution = async (days: number = 7) => {
  const since = new Date()
  since.setDate(since.getDate() - days)

  const [userReports, eventReports] = await Promise.all([
    supabase.from('user_report').select('status').gte('created_at', since.toISOString()),
    supabase.from('event_report').select('status').gte('created_at', since.toISOString()),
  ])

  const all = [...(userReports.data ?? []), ...(eventReports.data ?? [])]
  const pending = all.filter(r => r.status === 'Pending').length
  const resolved = all.filter(r => r.status === 'Resolved').length
  const reviewed = all.filter(r => r.status === 'Reviewed').length
  const total = all.length

  return { pending, resolved, reviewed, total }
}

const COLORS = ['#FCB136', '#7E57D7', '#3B195C']

const ReportStatus = ({ refreshKey }: { refreshKey: number }) => {
  const [days, setDays] = useState(7)
  const [stats, setStats] = useState({ pending: 0, resolved: 0, reviewed: 0, total: 0 })

  useEffect(() => {
    getReportStatusDistribution(days).then(setStats)
  }, [days, refreshKey])

  const data = [
    { name: 'Pending', value: stats.pending },
    { name: 'Resolved', value: stats.resolved },
    { name: 'Reviewed', value: stats.reviewed },
  ]

  return (
    <DonutChart
      title="Report Status"
      data={data}
      colors={COLORS}
      centerLabel="Reports"
      total={stats.total}
      days={days}
      onDaysChange={setDays}
    />
  )
}

export default ReportStatus