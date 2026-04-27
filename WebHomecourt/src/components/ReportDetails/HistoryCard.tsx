import StarRating from './StarRating'
import { useNavigate } from 'react-router-dom'


interface HistoryCardProps {
  event: string
  date: string
  rating: number
  tags: string[]
  reportId: string
}

const HistoryCard = ({ event, date, rating, tags, reportId }: HistoryCardProps) => {
  const navigate = useNavigate();

  return (
    <div 
      className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={() => navigate(`/admin/report/${reportId}`)}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-full bg-morado-lakers flex items-center justify-center">
          <span className="material-symbols-outlined text-amarillo-lakers" style={{ fontSize: '16px' }}>emoji_events</span>
        </div>
        <p className="font-medium">{event}</p>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <p className="text-gray-500 text-sm" style={{ fontSize: '14px' }}>{date}</p>
        <StarRating rating={rating} />
        <p className="text-gray-500 text-sm" style={{ fontSize: '14px' }}>{rating}</p>
      </div>
      <div className="flex flex-wrap gap-1">
        {tags.map((tag) => (
          <span key={tag} className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}

export default HistoryCard