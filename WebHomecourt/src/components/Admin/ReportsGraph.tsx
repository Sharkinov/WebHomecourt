import { useEffect, useState } from 'react'
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts'
import { supabase } from '../../lib/supabase'

const getReportsOverTime = async (days: number = 7) => {
  const since = new Date()
  since.setDate(since.getDate() - days)

  const [userReports, eventReports] = await Promise.all([
    supabase
      .from('user_report')
      .select('created_at')
      .gte('created_at', since.toISOString()),
    supabase
      .from('event_report')
      .select('created_at')
      .gte('created_at', since.toISOString()),
  ])

  const countMap: Record<string, number> = {}

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    countMap[key] = 0
  }

  userReports.data?.forEach((r) => {
    const key = new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (key in countMap) countMap[key]++
  })

  eventReports.data?.forEach((r) => {
    const key = new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (key in countMap) countMap[key]++
  })

  return Object.entries(countMap).map(([date, count]) => ({ date, count }))
}


const ReportsGraph = ({ refreshKey }: { refreshKey: number }) => {
  const [data, setData] = useState<{ date: string, count: number }[]>([])
  const [days, setDays] = useState(7)

  useEffect(() => {
    getReportsOverTime(days).then(setData)
  }, [days, refreshKey])

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 h-full" style={{ minHeight: '320px' }}>
      <div className="flex justify-between items-center mb-6">
        <h5 className="font-medium!">Reports Over Time</h5>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="px-2 py-1.5 rounded-lg border border-gray-200 text-sm"
        >
          <option value={7}>Last 7 Days</option>
          <option value={14}>Last 14 Days</option>
          <option value={30}>Last 30 Days</option>
        </select>
      </div>

      <div style={{ height: 'calc(100% - 60px)' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#542581" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#542581" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#542581"
              strokeWidth={2}
              fill="url(#colorCount)"
              dot={{ fill: '#542581', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default ReportsGraph