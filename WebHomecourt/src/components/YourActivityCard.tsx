import type { UserActivityStats } from '../services/apiUser'

interface YourActivityCardProps {
  stats: UserActivityStats | null
  loading: boolean
  reputation: number | null
  loadingReputation: boolean
  error: string | null
  onViewHistory?: () => void
  viewHistoryLabel?: string
}

function ActivityValue({ value }: { value: string }) {
  return <span className="text-[18px] leading-6.75 text-morado-lakers">{value}</span>
}

export default function YourActivityCard({
  stats,
  loading,
  reputation,
  loadingReputation,
  error,
  onViewHistory,
  viewHistoryLabel = 'View match history',
}: YourActivityCardProps) {
  const eventsCreated = loading ? '...' : stats ? String(stats.eventsCreated) : '--'
  const eventsAttended = loading ? '...' : stats ? String(stats.eventsAttended) : '--'
  const reputationValue =
    loadingReputation ? '...' : reputation !== null ? reputation.toFixed(1) : '--'

  return (
    <section className="w-full min-h-48 rounded-[15px] border-[0.8px] border-black/8 bg-white px-[24.8px] pt-[24.8px] pb-4 shadow-[0_4px_4px_rgba(0,0,0,0.08)]">
      <h3 className="text-[14px] leading-5.25 tracking-[0.35px] text-[#11061A]">YOUR ACTIVITY</h3>

      <div className="mt-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[13px] leading-[19.5px] text-Gris-Oscuro">Events created</span>
          <ActivityValue value={eventsCreated} />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[13px] leading-[19.5px] text-Gris-Oscuro">Events attended</span>
          <ActivityValue value={eventsAttended} />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[13px] leading-[19.5px] text-Gris-Oscuro">Reputation</span>
          <div className="inline-flex items-center gap-1.5 text-amarillo-lakers">
            <span className="text-[18px] leading-6.75">{reputationValue}</span>
            <span className="material-symbols-outlined text-[20px] leading-none">star</span>
          </div>
        </div>
      </div>

      {error ? <p className="mt-3 text-[12px] text-red-600">{error}</p> : null}

      {onViewHistory ? (
        <button
          type="button"
          onClick={onViewHistory}
          className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-morado-lakers transition-opacity hover:opacity-70"
        >
          <span>{viewHistoryLabel}</span>
          <span className="material-symbols-outlined text-[18px] leading-none">arrow_forward</span>
        </button>
      ) : null}
    </section>
  )
}
