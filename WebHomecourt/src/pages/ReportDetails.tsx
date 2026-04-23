import { useNavigate } from 'react-router-dom'
import Nav from '../components/Nav'
import UserHistory from '../components/ReportDetails/UserHistory'
import ActionButtons from '../components/ReportDetails/ActionButtons'
import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getUserHistory } from './Admin'

const formatDate = (dateStr: string) => {
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

const ReportDetails = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [report, setReport] = useState<any>(null)
  const [userHistory, setUserHistory] = useState<any[]>([])

   useEffect(() => {
    const fetchReport = async () => {
      const { data, error } = await supabase
        .from('user_report')
        .select(`
          ureport_id,
          comment,
          key_words,
          priority,
          status,
          created_at,
          reported_user_id,
          reported_user:user_laker!reported_user_id(username, photo_url, reputation),
          event:event!event_id(event_name, date, max_players, court:court!court_id(name))
        `)
        .eq('ureport_id', id)
        .single()

      if (error) {
        console.error(error)
        return
      }
      setReport(data)

      //change status to reviewed if the report is opened, params takes in id of report opened
      if (data.status === 'Pending') {
        await supabase
          .from('user_report')
          .update({ status: 'Reviewed' })
          .eq('ureport_id', id)
      }

      const historyData = await getUserHistory(data.reported_user_id, data.ureport_id)
      setUserHistory(historyData)
    }
    fetchReport()
  }, [id])

  if (!report) return <div>Loading...</div>

  return (
    <div className="flex flex-col min-h-screen bg-zinc-100">
      <Nav current="Admin" />

      <div className="px-4 md:px-14 py-5 mb-10">
        {/* Header */}
        <div className="w-full px-5 py-7 bg-violet-950 rounded-2xl flex items-center gap-3 mb-6">
          <span className="material-symbols-outlined text-white" style={{ fontSize: '36px' }}>admin_panel_settings</span>
          <h1 className="text-white title1">Reports Administration</h1>
        </div>

        {/* Report Details Card */}
        <div className="bg-white rounded-xl border border-gray-300 overflow-hidden">
          
          {/* Card Header */}
          <div className="bg-violet-950 px-5 py-4 flex justify-between items-center">
            <p className="text-white font-bold" style={{ fontSize: '26px' }}>Report Details</p>
            <button onClick={() => navigate('/admin')}
              className="text-white hover:text-gray-300 transition-colors">
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>close</span>
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-6 mb-10">
            
            {/* Left side */}
            <div className="flex-1 flex flex-col gap-6 p-6 ">
              
              <h2>Event: {report.event?.event_name}</h2>

              <div className="flex flex-wrap gap-25">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-black" style={{ fontSize: '18px' }}>location_on</span>
                  <p>Location: {report.event.court.name}</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-black" style={{ fontSize: '18px' }}>groups</span>
                  <p>Participants: {report.event.max_players}</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-black" style={{ fontSize: '18px' }}>calendar_today</span>
                <p>{formatDate(report.event?.date)}</p>
              </div>

              <hr className="border-amarillo-lakers border-t-2 my-4  -mx-12" />


              {/* Report Comment */}

              <h2 className="font-medium text-black" style={{ fontSize: '20px' }}>Report Comment</h2>
              <div className="bg-[#9382A5]/50 border border-gray-200 rounded-xl p-4 min-h-[150px]">
                <p className="text-black">{report.comment}</p>
              </div>

              {/* Action Buttons */}
              <ActionButtons
                onDismiss={() => console.log('dismiss')}
                onWarning={() => console.log('warning')}
                onSuspend={() => console.log('suspend')}
                onBan={() => console.log('ban')}
              />
            </div>
            {/* Right side */}
            <div className="w-0.5 bg-black/20 self-stretch -mr-6 -mb-10" />
            <UserHistory
              reportedUser={{
                name: report.reported_user?.username ?? 'N/A',
                photo_url: report.reported_user?.photo_url ?? '',
                rating: report.reported_user?.reputation ?? 0,
                totalReports: userHistory.length,
              }}
              history={userHistory.map((h) => ({
                event: h.event?.event_name ?? 'N/A',
                date: new Date(h.event?.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                rating: h.reported_user?.reputation ?? 0,
                tags: h.key_words ?? [],
                report_id: h.ureport_id,
              }))}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReportDetails