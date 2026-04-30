import type { Achievement } from '../../lib/Perfil/achievements'

type Props = {
  achievement: Achievement
}

export default function AchievementCard({ achievement }: Props) {
  const { title, description, icon, unlocked } = achievement

  return (
    <div className={`
      rounded-[15px]
      py-5 px-0
      flex flex-col items-center text-center
      shadow-[0_4px_4px_rgba(0,0,0,0.08)]
      ${unlocked ? 'bg-[#E7E6E8]' : 'bg-[#F3F2F5] opacity-50'}
    `}>
      <div className={`
        w-14 h-14 rounded-full flex items-center justify-center mb-2
        ${unlocked ? 'bg-[#542581]' : 'bg-[#DEDAE2]'}
      `}>
        {icon === 'sports_score' ? (
          <img
            src="/Perfil/Medal.svg"
            alt="medal"
            className={`w-6 h-6 ${!unlocked ? 'opacity-50 grayscale' : ''}`}
          />
        ) : (
          <span className={`
            material-symbols-outlined text-2xl
            ${unlocked ? 'text-[#FCB136]' : 'text-[#A09CA4]'}
          `}>
            {icon}
          </span>
        )}
      </div>

      <h3 className={`
        font-normal px-4
        ${unlocked ? 'text-[#11061A]' : 'text-[#A09CA4]'}
      `}
      style={{ fontSize: '13px', lineHeight: '19.5px', fontFamily: 'Graphik' }}>
        {title}
      </h3>

      <p className={`
        font-normal px-4 text-center
        ${unlocked ? 'text-[#6F6975]' : 'text-[#A09CA4]'}
      `}
      style={{ fontSize: '11px', lineHeight: '13.75px', marginTop: '6.5px', fontFamily: 'Graphik' }}>
        {description}
      </p>

      {unlocked && (
        <span className="px-2 py-[2px] text-[11px] rounded-full bg-[#542581]/10 text-[#542581]" style={{ marginTop: '12.5px' }}>
          Unlocked
        </span>
      )}
    </div>
  )
}