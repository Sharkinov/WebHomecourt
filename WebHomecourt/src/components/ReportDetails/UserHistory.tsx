import HistoryCard from './HistoryCard'
import StarRating from './StarRating'

interface UserHistoryProps {
  reportedUser: {
    name: string
    photo_url: string
    rating: number
    totalReports: number
  }
  history: {
    event: string
    date: string
    rating: number
    tags: string[]
    report_id: string
  }[]
}

const UserHistory = ({ reportedUser, history }: UserHistoryProps) => {
  return (
    <div className="bg-[#000000]/5 w-full md:w-84 flex flex-col gap-4 self-stretch p-4 -mb-10">

      <div>
        <h1 className="font-medium mb-4 pb-2 pt-1" style={{ fontSize: '20px' }}>Reported User</h1>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
            {reportedUser.photo_url ? (
              <img src={reportedUser.photo_url} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-300" />
            )}
          </div>
          <div>
            <h2 className="font-medium" style={{ fontSize: '18px' }}>@{reportedUser.name}</h2>
            <StarRating rating={reportedUser.rating} />
          </div>
        </div>
        <p className="text-gray-500 font-medium text-sm pb-4" style={{ fontSize: '14px' }}>
          {reportedUser.totalReports} reports | Avg. Rating {reportedUser.rating}
        </p>
        <button className="mt-3 w-full bg-morado-lakers text-white py-1.5 rounded-lg font-medium hover:bg-morado-oscuro transition-colors" style={{ fontSize: '14px' }}>
          View Profile
        </button>
      </div>

      <p className="font-medium pt-6 px-1" style={{ fontSize: '20px' }}>History</p>
      <div className="flex flex-col gap-3">
        {history.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No previous reports</p>
        ) : (
          history.map((h, i) => (
            <HistoryCard
              key={i}
              event={h.event}
              date={h.date}
              rating={h.rating}
              tags={h.tags ?? []}
              reportId={h.report_id}
            />
          ))
        )}
      </div>

    </div>
  )
}

export default UserHistory