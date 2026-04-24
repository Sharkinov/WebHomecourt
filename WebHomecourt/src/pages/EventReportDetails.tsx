import { useNavigate, useParams } from 'react-router-dom'
import Nav from '../components/Nav'
import ActionButtons from '../components/ReportDetails/ActionButtons'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

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
                onDismiss={() => {}}
                onWarning={() => {}}
                onSuspend={() => {}}
                onBan={() => {}}
                suspendText="Suspend Event"
                banText="Ban Event"
                />
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventReportDetails