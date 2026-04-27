import Nav from '../components/Nav'
import StatsCards from '../components/Admin/StatsCards'
import UserReports from '../components/Admin/UserReports';
import ActiveEvents from '../components/Admin/ActiveEvents.tsx'
import EventReports from '../components/Admin/EventReports'
import { supabase } from '../lib/supabase'


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
      event:event!event_id(event_name, date, court:court!court_id(name))
    `)
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
      created_user:user_laker!created_user_id(username, photo_url),
      court:court!court_id(name)
    `)
    .eq('allow_event', true)
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
    supabase.from('user_laker').select('user_id', { count: 'exact' }).eq('user_type', 2),
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
  return (
    <div className="flex flex-col items-center justify-center">
      <Nav current="Admin" />
      <div className="px-4 md:px-14 py-5 pb-10 bg-zinc-100 w-full">

        {/* Header */}
        <div className="w-full px-5 py-7 bg-violet-950 rounded-2xl shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] outline outline-1 outline-offset-[-1px] outline-black/25 flex justify-between items-center overflow-hidden">
            <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-white" style={{ fontSize: '48px' }}>admin_panel_settings</span>
                <h1 className="text-white title1">Reports Administration</h1>
            </div>
        </div>

        {/* Stats */}
        <div className="mt-6">
          <StatsCards />
        </div>
        <UserReports/>
        {/* Header 
        <EventsCards />
        */}
        <ActiveEvents/>
        <EventReports />

      </div>
    </div>
  )
}
export default Admin