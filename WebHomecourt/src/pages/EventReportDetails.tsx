import { useNavigate, useParams } from 'react-router-dom'
import Nav from '../components/Nav'
import ActionButtons from '../components/ReportDetails/ActionButtons'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import StatusAlert from '../components/Messages/StatusAlert'

const formatDate = (dateStr: string) => {
  if (!dateStr) return 'N/A'
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

const EventReportDetails = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [report, setReport] = useState<any>(null)
  const [alert, setAlert] = useState<{ title: string, message?: string, tone: 'success' | 'error' | 'warning' | 'info' } | null>(null)

   const handleAction = async (action: 'dismiss' | 'warning' | 'suspend' | 'ban') => {
    await supabase
      .from('event_report')
      .update({ status: 'Resolved' })
      .eq('ereport_id', report.ereport_id)

    const messages = {
      dismiss: { title: 'Report dismissed', message: 'The report has been dismissed.', tone: 'success' as const },
      warning: { title: 'Warning sent', message: 'The user has been notified.', tone: 'success' as const },
      suspend: { title: 'User suspended', message: 'The user has been suspended for 7 days.', tone: 'success' as const },
      ban: { title: 'User banned', message: 'The user has been permanently banned.', tone: 'success' as const },
    }

    setAlert(messages[action])
    setTimeout(() => { setAlert(null); navigate('/admin') }, 2000)
  }


  useEffect(() => {
    const fetchReport = async () => {
      const { data, error } = await supabase
        .from('event_report')
        .select(`
          ereport_id,
          comment,
          priority,
          status,
          created_at,
          event_id,
          reporter:user_laker!reporter_user_id(username, photo_url),
          event:event!event_id(
            event_name,
            date,
            max_players,
            created_user:user_laker!created_user_id(username, photo_url),
            court:court!court_id(name)
          )
        `)
        .eq('ereport_id', id)
        .single()

      if (error) {
        console.error(error)
        return
      }

      setReport(data)

      //change status to reviewed if the report is opened, params takes in id of report opened
      if (data.status === 'Pending') {
        await supabase
          .from('event_report')
          .update({ status: 'Reviewed' })
          .eq('ereport_id', id)
      }
    }

    fetchReport()
  }, [id])

    const handleWarning = async (warnTypeId: number, customMessage: string | null) => {
      await supabase.from('warning').insert({
        user_id: report.event?.created_user_id,
        report_id: report.ereport_id,
        warn_type_id: warnTypeId,
        custom_message: customMessage
      })
      handleAction('warning')
    }

  if (!report) return <div>Loading...</div>

  return (
    <div className="flex flex-col min-h-screen bg-zinc-100">
      <Nav current="Admin" />

      <div className="px-4 md:px-14 py-5 mb-10">
        <div className="w-full px-5 py-7 bg-violet-950 rounded-2xl flex items-center gap-3 mb-6">
          <span className="material-symbols-outlined text-white" style={{ fontSize: '36px' }}>
            admin_panel_settings
          </span>
          <h1 className="text-white title1">Reports Administration</h1>
        </div>

        <div className="bg-white rounded-xl border border-gray-300 overflow-hidden">
          <div className="bg-violet-950 px-5 py-4 flex justify-between items-center">
            <p className="text-white font-bold" style={{ fontSize: '26px' }}>
              Event Report Details
            </p>
            <button
              onClick={() => navigate('/admin')}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                close
              </span>
            </button>
          </div>

          <div className="flex flex-col gap-6 p-6">
            <h2>Event: {report.event?.event_name ?? 'N/A'}</h2>

            <div className="flex flex-wrap gap-10">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-black text-[18px]">
                  location_on
                </span>
                <p>Location: {report.event?.court?.name ?? 'N/A'}</p>
              </div>

              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-black text-[18px]">
                  groups
                </span>
                <p>Participants: {report.event?.max_players ?? 'N/A'}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-10 items-center">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-black text-[18px]">
                  calendar_today
                </span>
                <p>{formatDate(report.event?.date)}</p>
              </div>

              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-black text-[18px]">
                  person
                </span>
                <p>Host: {report.event?.created_user?.username ?? 'N/A'}</p>
              </div>
            </div>

            <hr className="border-amarillo-lakers border-t-2 my-4 -mx-12" />

            <h2 className="font-medium text-black text-[20px]">
              Report Comment
            </h2>

            <div className="bg-[#9382A5]/50 border border-gray-200 rounded-xl p-4 min-h-[150px]">
              <p className="text-black">{report.comment ?? 'No comment'}</p>
            </div>

            <ActionButtons
              onDismiss={async () => { handleAction('dismiss') }}
              onWarning={handleWarning}
              onSuspend={async () => { handleAction('suspend') }}
              onBan={async () => { handleAction('ban') }}
              user={{
                name: report.event?.created_user?.username ?? 'N/A',
                photo_url: report.event?.created_user?.photo_url ?? ''
              }}
              
              suspendText="Suspend Host"
              banText="Ban Host"
              target="Host"
            />
          </div>
        </div>
      </div>
      {alert && (
        <div className="fixed bottom-6 right-6">
          <StatusAlert tone={alert.tone} title={alert.title} message={alert.message} />
        </div>
      )}
    </div>
  )
}

export default EventReportDetails