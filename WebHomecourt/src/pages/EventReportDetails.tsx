import { useNavigate } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import Nav from '../components/Nav/Nav'
import ActionButtons from '../components/ReportDetails/ActionButtons'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import StatusAlert from '../components/Messages/StatusAlert'
import StarRating from '../components/ReportDetails/StarRating'

const formatDate = (dateStr: string) => {
  if (!dateStr) return 'N/A'
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

const calculateAge = (birthdate: string) => {
  if (!birthdate) return 'N/A'
  const today = new Date()
  const birth = new Date(birthdate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

const formatGender = (gender: number) => {
  const map: Record<number, string> = { 0: 'Female', 1: 'Male', 2: 'Other' }
  return map[gender] ?? 'N/A'
}


const EventReportDetails = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const id = location.state?.id

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
          key_words,
          reporter:user_laker!reporter_user_id(username, photo_url),
          event:event!event_id(
            event_name,
            date,
            max_players,
            created_user:user_laker!created_user_id(user_id, username, nickname, photo_url, reputation, birthdate, gender),
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
        user_id: report.event?.created_user?.user_id,
        report_id: report.ereport_id,
        warn_type_id: warnTypeId,
        custom_message: customMessage
      })
      handleAction('warning')
    }

  if (!report) return null

  return (
    <div >
      <Nav current="Admin" />

      <div className="px-4 md:px-14 py-5 mb-10 w-full">
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

          <div className="flex flex-col gap-6 p-6 mx-2">
            <h2>Event: {report.event?.event_name ?? 'N/A'}</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-12 w-fit">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-black text-[18px]">location_on</span>
                <p>Location: {report.event?.court?.name ?? 'N/A'}</p>
              </div>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-black text-[18px]">groups</span>
                <p>Participants: {report.event?.max_players ?? 'N/A'}</p>
              </div>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-black text-[18px]">calendar_today</span>
                <p>{formatDate(report.event?.date)}</p>
              </div>
              <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-black text-[18px]">assignment_ind</span>
                  <p>Reported by: @{report.reporter?.username ?? 'N/A'}</p>
              </div>
            </div>

            <hr className="border-amarillo-lakers border-t-2 my-4 -mx-12" />

            <div className="flex flex-col xl:flex-row gap-10 items-start">
              
              {/* Host card */}
              <div className="flex flex-col items-start gap-4 bg-morado-bajo/30 rounded-xl px-10 py-7">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-morado-lakers" style={{ fontSize: '30px' }}>crown</span>
                  <h4 style={{ fontWeight: '600' }}>Host</h4>
                </div>
                <div className="flex flex-row items-start gap-2">
                  <div className="w-18 h-18 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 -mt-1">
                    {report.event?.created_user?.photo_url && (
                      <img src={report.event.created_user.photo_url} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="font-medium" style={{ fontWeight: '500' }}>{report.event?.created_user?.nickname}</p>
                    <p className="font-medium text-gray-600 mb-3">@{report.event?.created_user?.username ?? 'N/A'}</p>
                    <div className="flex gap-3 text-sm text-gray-600">
                      <p className="text-morado-lakers">Age: <span className="text-black">{calculateAge(report.event?.created_user?.birthdate)}</span></p>
                      <p className="text-morado-lakers">Gender: <span className="text-black">{formatGender(report.event?.created_user?.gender)}</span></p>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <p className="text-morado-lakers">Reputation: <span className="text-black">{report.event?.created_user?.reputation ?? 'N/A'}</span></p>
                      <StarRating rating={report.event?.created_user?.reputation} />
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/perfil/${report.event?.created_user?.user_id}`)}
                  className="mt-3 w-full bg-morado-lakers text-white py-1.5 rounded-lg font-medium hover:bg-morado-oscuro transition-colors"
                  style={{ fontSize: '14px' }}
                >
                  View Profile
                </button>
              </div>

              {/* Report Comment */}
              <div className="flex flex-col gap-3 flex-1">
                <div className="grid gap-10" style={{ gridTemplateColumns: '2fr 1fr' }}>
                  <div className="flex flex-col gap-3">
                    <h2 className="font-medium text-black" style={{ fontSize: '20px' }}>Report Comment</h2>
                    <div className="bg-[#9382A5]/50 border border-gray-200 rounded-xl p-4 min-h-[150px]">
                      <p className="text-black">{report.comment ?? 'No comment'}</p>
                    </div>
                  </div>
                  {/* AI Analysis */}
                  <div className="flex flex-col gap-3">
                    <h2 className="font-medium text-black" style={{ fontSize: '20px' }}>AI Analysis</h2>
                    <div className="flex flex-wrap gap-3">
                      {report.key_words?.map((kw: string) => (
                        <span key={kw} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-base">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

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
              target="Host"
              scope="event"
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