import { useNavigate, useParams } from 'react-router-dom'
import Nav from '../components/Nav'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import StatusAlert from '../components/Messages/StatusAlert'
import StarRating from '../components/ReportDetails/StarRating'
import WarningPopup from '../components/ReportDetails/WarningPopup'
import EndEventPopup from '../components/ReportDetails/EndEventPopup'


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

const Monitor = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [event, setEvent] = useState<any>(null)
  const [alert, setAlert] = useState<{ title: string, message?: string, tone: 'success' | 'error' | 'warning' | 'info' } | null>(null)

  const handleAction = async (action: 'warning' | 'endEvent') => {
  const messages = {
    warning: { title: 'Warning sent', message: 'The user has been notified.', tone: 'success' as const },
    endEvent: { title: 'Event ended', message: 'The event has been successfully ended.', tone: 'success' as const },
  }
  setAlert(messages[action])
  setTimeout(() => { setAlert(null); navigate('/admin') }, 2000)
}

  useEffect(() => {
    const fetchEvent = async () => {
      const { data, error } = await supabase
        .from('event')
        .select(`
          event_id,
          event_name,
          date,
          max_players,
          created_at,
          created_user:user_laker!created_user_id(user_id, username, nickname, photo_url, birthdate, gender, reputation),
          court:court!court_id(name),
          participants:event_participant(
            user:user_laker!user_id(user_id, username, nickname, photo_url, birthdate, gender, reputation,
            reports:user_report!reported_user_id(ureport_id, status)
            )
          )
        `)
        .eq('event_id', id)
        .single()

      if (error) { console.error(error); return }
      setEvent(data)
    }
    fetchEvent()
  }, [id])

  const [showWarning, setShowWarning] = useState(false)
  const [showEndEvent, setShowEndEvent] = useState(false)

  const handleWarning = async (warnTypeId: number, customMessage: string | null) => {
    await supabase.from('warning').insert({
      user_id: event?.created_user?.user_id,
      warn_type_id: warnTypeId,
      custom_message: customMessage
    })
    handleAction('warning')
  }
  

  if (!event) return <div>Loading...</div>

  return (
    
    <div className="flex flex-col min-h-screen bg-zinc-100">
      {showWarning && (
        <WarningPopup
          user={{ name: event?.created_user?.username ?? 'N/A', photo_url: event?.created_user?.photo_url ?? '' }}
          target="Host"
          onConfirm={(warnTypeId, customMessage) => {
            setShowWarning(false)
            handleWarning(warnTypeId, customMessage)
          }}
          onCancel={() => setShowWarning(false)}
        />
      )}

      {showEndEvent && (
        <EndEventPopup
          event={{
            name: event?.event_name ?? 'N/A',
            location: event?.court?.name ?? 'N/A',
            date: formatDate(event?.date),
            host: event?.created_user?.username ?? 'N/A'
          }}
          onConfirm={async () => {
            setShowEndEvent(false)
            await supabase
              .from('event')
              .update({ allow_event: false })
              .eq('event_id', event?.event_id)
            handleAction('endEvent')
          }}
          onCancel={() => setShowEndEvent(false)}
        />
)}
      <Nav current="Admin" />

        {/* Header */}
      <div className="px-4 md:px-14 py-5 mb-10">
        <div className="w-full px-5 py-7 bg-violet-950 rounded-2xl flex items-center gap-3 mb-6">
          <span className="material-symbols-outlined text-white" style={{ fontSize: '36px' }}>admin_panel_settings</span>
          <h1 className="text-white title1">Reports Administration</h1>
        </div>
        
        {/* Event Details */}
        <div className="bg-white rounded-xl border border-gray-300 overflow-hidden">
          <div className="bg-violet-950 px-5 py-4 flex justify-between items-center">
            <p className="text-white font-bold" style={{ fontSize: '26px' }}>Event Details</p>
            <button onClick={() => navigate('/admin')} className="text-white hover:text-gray-300 transition-colors">
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>close</span>
            </button>
          </div>

          <div className="flex flex-col gap-6 p-6 mx-2">
            <h2>Event: {event?.event_name ?? 'N/A'}</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-3 gap-x-6">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-black text-[18px]">location_on</span>
                <p>Location: {event?.court?.name ?? 'N/A'}</p>
              </div>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-black text-[18px]">groups</span>
                <p>Participants: {event?.max_players ?? 'N/A'}</p>
              </div>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-black text-[18px]">edit_calendar</span>
                <p>Created: {formatDate(event?.created_at)}</p>
              </div>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-black text-[18px]">calendar_today</span>
                <p>Date: {formatDate(event?.date)}</p>
              </div>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-black text-[18px]">person</span>
                <p>Host: @{event?.created_user?.username ?? 'N/A'}</p>
              </div>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-black text-[18px]">group_add</span>
                <p>Joined: {event?.participants?.length ?? 0}/{event?.max_players ?? 'N/A'}</p>
              </div>
            </div>

            {/* Players and Host */}
            <hr className="border-amarillo-lakers border-t-2 my-4 -mx-12" />

            {/* Host */}
            <div className="flex flex-wrap gap-10 items-start">
                <div key={event?.created_user?.user_id} className="flex flex-col items-start gap-4 bg-morado-bajo/30 rounded-xl px-10 py-7">
                
                <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-morado-lakers" style={{ fontSize: '30px' }}>crown</span>
                    <h4 style={{fontWeight: '600'}}>Host</h4>
                  </div>
                  <div className="flex flex-row items-start gap-2">
                  <div className="w-18 h-18 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 -mt-1">
                        {event?.created_user?.photo_url && <img src={event.created_user.photo_url} className="w-full h-full object-cover" />}
                    </div>
                  
                  <div className="flex-1 flex flex-col gap-1">
                    <p className="font-medium" style={{fontWeight: '500'}}>{event?.created_user?.nickname}</p>
                    <p className="font-medium text-gray-600 mb-3">@{event?.created_user?.username}</p>
                    <div className="flex gap-3 text-sm text-gray-600">
                      <p className="text-morado-lakers">Age: <span className="text-black">{calculateAge(event?.created_user?.birthdate)}</span></p>
                      <p className="text-morado-lakers">Gender: <span className="text-black">{formatGender(event?.created_user?.gender)}</span></p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <p className="text-morado-lakers">Reputation: <span className="text-black">{event?.created_user?.reputation}</span></p>
                        <StarRating rating={event?.created_user?.reputation} />
                        
                    </div>
                  </div>
                  
                </div>
                <button className="mt-3 w-full bg-morado-lakers text-white py-1.5 rounded-lg font-medium hover:bg-morado-oscuro transition-colors" style={{ fontSize: '14px' }}>
                  View Profile
                </button>
                </div>

            {/* Registered Players */}
            <div className="flex flex-col gap-3 flex-1 max-h-110 overflow-y-auto pr-1">
              <h5 className="font-medium">Registered Players</h5>
              {event?.participants?.map((p: any) => {
                  const hasActiveReport = p.user.reports?.some(
                    (r: any) => r.status === 'Pending' || r.status === 'Reviewed'
                  )
                  const latestActiveReport = p.user.reports
                    ?.filter((r: any) => r.status === 'Pending' || r.status === 'Reviewed')
                    .sort((a: any, b: any) => b.ureport_id - a.ureport_id)[0]

              return (
                <div key={p.user.user_id} className="flex flex-row items-center gap-3 bg-gray-100 rounded-xl px-5 py-4 w-full justify-between">

                  {/* Avatar */}
                  <div className="w-14 h-14 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                    {p.user.photo_url && <img src={p.user.photo_url} className="w-full h-full object-cover" />}
                  </div>

                  {/* Info */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6 flex-1 min-w-0">
                    <div className="flex flex-col gap-0.5 min-w-0 sm:min-w-[150px]">
                      <p className="font-medium truncate" style={{fontWeight: '500'}}>{p.user.nickname}</p>
                      <small className="text-gray-500 truncate">@{p.user.username}</small>
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex gap-3">
                        <small className="text-morado-lakers">Age: <span className="text-black">{calculateAge(p.user.birthdate)}</span></small>
                        <small className="text-morado-lakers">Gender: <span className="text-black">{formatGender(p.user.gender)}</span></small>
                      </div>
                      <div className="flex items-center gap-2">
                        <small className="text-morado-lakers">Reputation: <span className="text-black">{p.user.reputation}</span></small>
                        <StarRating rating={p.user.reputation} />
                      </div>
                    </div>
                  </div>

                  {/* Flag */}
                  <div className="flex items-center self-center flex-shrink-0">
                    {hasActiveReport && (
                      <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center">
                        <span
                          className="material-symbols-outlined text-amarillo-lakers cursor-pointer hover:opacity-70 transition-opacity"
                          style={{ fontSize: '20px' }}
                          onClick={() => navigate(`/admin/report/${latestActiveReport.ureport_id}`)}
                        >
                          flag
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                  )
                })}
              </div>
            </div>

            <div className="flex justify-center gap-6 mt-5">
            <button onClick={() => setShowWarning(true)} className="w-70 px-5 py-2 rounded-lg bg-[#FFD796] text-black font-medium hover:brightness-90 transition-colors">
              Warn Host
            </button>
            <button onClick={() => setShowEndEvent(true)} className="w-70 px-5 py-2 rounded-lg bg-[#BC3737] text-white font-medium hover:brightness-90 transition-colors">
              End Event
            </button>
          </div>

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

export default Monitor