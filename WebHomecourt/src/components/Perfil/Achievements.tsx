import { useState, useEffect } from 'react'
import { getUserAchievements } from '../../lib/Perfil/achievements'
import type { Achievement } from '../../lib/Perfil/achievements'
import AchievementCard from './AchievementCard'

type Props = {
  userId: string
}

export default function Achievements({ userId }: Props) {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAchievements() {
      setLoading(true)
      const data = await getUserAchievements(userId)
      setAchievements(data)
      setLoading(false)
    }

    if (userId) {
      loadAchievements()
    }
  }, [userId])

  return (
    <div className="bg-white rounded-[15px] overflow-hidden border border-black/8 shadow-[0_4px_4px_rgba(0,0,0,0.08)]">
      <div className="h-[63px] bg-morado-oscuro flex items-center px-6">
        <span className="text-[#F3F2F3] text-[18px]">
          Achievements
        </span>
      </div>

      <div className="p-6 grid grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-[178px] rounded-[15px] bg-gray-200 animate-pulse" />
          ))
        ) : (
          achievements.map((achievement) => (
            <AchievementCard 
              key={achievement.id}
              achievement={achievement}
            />
          ))
        )}
      </div>
    </div>
  )
}