import { useEffect, useState } from 'react'
import DonutChart from './DonutChart'
import { supabase } from '../../lib/supabase'

const getEventStatusDistribution = async (days: number = 7) => {
  const { data, error } = await supabase
    .from('event')
    .select('event_id, date, event_status_id, allow_event')

  if (error || !data) return { active: 0, scheduled: 0, finished: 0, total: 0 }

  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)

  const rangeEnd = new Date(now)
  rangeEnd.setDate(rangeEnd.getDate() + days)

  const since = new Date(now)
  since.setDate(since.getDate() - days)

  const active = data.filter(e => {
  const d = new Date(e.date)
  return e.event_status_id === 1 &&
    e.allow_event === true &&
    d <= now
}).length

  const scheduled = data.filter(e =>
    e.event_status_id === 1 &&
    e.allow_event === true &&
    new Date(e.date) > now &&
    new Date(e.date) <= rangeEnd
  ).length

  const finished = data.filter(e =>
    (e.event_status_id === 2 || e.allow_event === false) &&
    new Date(e.date) >= since &&
    new Date(e.date) <= now
  ).length

  return { active, scheduled, finished, total: active + scheduled + finished }
}

const COLORS = ['#FCB136', '#7E57D7', '#3B195C']

const EventStatus = ({ refreshKey }: { refreshKey: number }) => {
  const [days, setDays] = useState(7)
  const [stats, setStats] = useState({ active: 0, scheduled: 0, finished: 0, total: 0 })

  useEffect(() => {
    getEventStatusDistribution(days).then(setStats)
  }, [days, refreshKey])

  const data = [
    { name: 'Active', value: stats.active },
    { name: 'Scheduled', value: stats.scheduled },
    { name: 'Finished', value: stats.finished },
  ]

  return (
    <DonutChart
      title="Event Status"
      data={data}
      colors={COLORS}
      centerLabel="Events"
      total={stats.total}
      days={days}
      onDaysChange={setDays}
      options={[
      { label: 'This Week', days: 7 },
      { label: 'This Month', days: 30 },
    ]}
    />
  )
}

export default EventStatus