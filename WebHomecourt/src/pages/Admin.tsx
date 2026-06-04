import StatsCards from '../components/Admin/StatsCards'
import UserReports from '../components/Admin/UserReports';
import ActiveEvents from '../components/Admin/ActiveEvents.tsx'
import EventReports from '../components/Admin/EventReports'
import ReportsGraph from '../components/Admin/ReportsGraph'
import { supabase } from '../lib/supabase'
import ReportStatus from '../components/Admin/ReportStatus.tsx';
import EventStatus from '../components/Admin/EventStatus.tsx';
import { useEffect, useState } from 'react'


export const getUserReports = async () => {
  const { data, error } = await supabase
    .from('user_report')
    .select(`
      ureport_id,
      priority,
      status,
      comment,
      created_at,
      reported_user:user_laker!reported_user_id(username, photo_url),
      event:event!event_id(event_name)
    `)
    .neq('status', 'Resolved')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getUserReports error:', error)
    return []
  }

  return data
}

export const getEventReports = async () => {
  const { data, error } = await supabase
    .from('event_report')
    .select(`
      ereport_id,
      priority,
      status,
      comment,
      created_at,
      event_id,
      reporter:user_laker!reporter_user_id(username, photo_url),
      event:event!event_id(event_name, date, created_user:user_laker!created_user_id(username, photo_url), court:court!court_id(name))
    `)
    .neq('status', 'Resolved')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getEventReports error:', error)
    return []
  }

  const countMap: Record<number, number> = {}
  data.forEach((r: any) => {
    countMap[r.event_id] = (countMap[r.event_id] || 0) + 1
  })

  return data.map((r: any) => ({ ...r, reportCount: countMap[r.event_id]}))
}

export const getActiveEvents = async () => {
  const { data, error } = await supabase
    .from('event')
    .select(`
      event_id,
      event_name,
      max_players,
      allow_event,
      date,
      event_status_id,
      created_user:user_laker!created_user_id(username, photo_url),
      court:court!court_id(name)
    `)
    .eq('allow_event', true)
    .eq('event_status_id', 1)
    .order('date', { ascending: true })

  if (error) {
    console.error('getActiveEvents error:', error)
    return []
  }

  return data
}

export const getAdminStats = async () => {
  const [pendingUserReports, pendingEventReports,flaggedUsers, flaggedEvents, suspendedUsers] = await Promise.all([
    supabase.from('user_report').select('ureport_id', { count: 'exact' }).eq('status', 'Pending'),
    supabase.from('event_report').select('ereport_id', { count: 'exact' }).eq('status', 'Pending'),
    supabase.from('user_report').select('reported_user_id'),
    supabase.from('event_report').select('event_id'),
    supabase.from('user_laker').select('user_id', { count: 'exact' }).not('banned_until', 'is', null).gt('banned_until', new Date().toISOString()),
  ])

  const uniqueFlaggedUsers = new Set(flaggedUsers.data?.map(r => r.reported_user_id)).size //remove duplicate user
  const uniqueFlaggedEvents = new Set(flaggedEvents.data?.map(r => r.event_id)).size //remove duplicate event

  return {
    reportsPending: (pendingUserReports.count ?? 0) + (pendingEventReports.count ?? 0),
    usersFlagged: uniqueFlaggedUsers,
    eventsFlagged: uniqueFlaggedEvents,
    suspendedUsers: suspendedUsers.count ?? 0,
  }
}

export const getUserHistory = async (userId: string, currentReportId: string) => {
  const { data, error } = await supabase
    .from('user_report')
    .select(`
      ureport_id,
      comment,
      priority,
      status,
      created_at,
      key_words,
      reported_user_id,
      reported_user:user_laker!reported_user_id(username, photo_url, reputation),
      event:event!event_id(event_name, date, max_players, court:court!court_id(name))
    `)
    .eq('reported_user_id', userId)
    .neq('ureport_id', currentReportId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getUserHistory error:', error)
    return []
  }

  return data
}

function Admin() {
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const channel = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event' }, () => {
        setRefreshKey(k => k + 1)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_report' }, () => {
        setRefreshKey(k => k + 1)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_report' }, () => {
        setRefreshKey(k => k + 1)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return (
    <div>
      <div className="px-4 md:px-14 py-5 pb-10 bg-zinc-100 w-full">
        <div className="w-full px-5 py-7 bg-violet-950 rounded-2xl shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] outline outline-1 outline-offset-[-1px] outline-black/25 flex justify-between items-center overflow-hidden">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-white" style={{ fontSize: '48px' }}>admin_panel_settings</span>
            <h1 className="text-white title1">Reports Administration</h1>
          </div>
        </div>
        <div className="mt-6">
          <StatsCards refreshKey={refreshKey} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-6 mt-6 items-stretch">
        <div className="md:col-span-2 lg:col-span-3">
          <ReportsGraph refreshKey={refreshKey} />
        </div>
        <div className="md:col-span-1 lg:col-span-2">
          <ReportStatus refreshKey={refreshKey} />
        </div>
        <div className="md:col-span-1 lg:col-span-2">
          <EventStatus refreshKey={refreshKey} />
        </div>
      </div>
        <UserReports refreshKey={refreshKey} />
        <ActiveEvents refreshKey={refreshKey} />
        <EventReports refreshKey={refreshKey} />
      </div>
    </div>
  )
}
export default Admin
