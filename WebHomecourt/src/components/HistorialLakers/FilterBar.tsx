type FilterStatus = 'all' | 'wins' | 'losses' | 'pending'

interface FilterBarProps {
  filterStatus: FilterStatus
  onFilterChange: (status: FilterStatus) => void
  searchText: string
  onSearchChange: (text: string) => void
  pendingCount: number
}

export default function FilterBar({
  filterStatus,
  onFilterChange,
  searchText,
  onSearchChange,
  pendingCount,
}: FilterBarProps) {
  return (
    <div className="w-full overflow-hidden rounded-[14px] border border-black/10 bg-white shadow-[0_4px_8px_rgba(0,0,0,0.06)]">
      <div className="px-6 py-5 bg-white border-b border-[#E7E6E8] flex items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 bg-[#f3f2f5] rounded-[14px] p-0.75">
          {(['all', 'wins', 'losses', 'pending'] as const).map((tab) => {
            const label = tab === 'all' ? 'All' : tab === 'wins' ? 'Wins' : tab === 'losses' ? 'Losses' : 'Pending'
            const isActive = filterStatus === tab
            const showBadge = tab === 'pending' && pendingCount > 0

            return (
              <button
                key={tab}
                onClick={() => onFilterChange(tab)}
                className={`flex items-center gap-2 px-3 py-1.25 rounded-[14px] text-[14px] font-medium transition-colors ${
                  isActive
                    ? 'bg-white text-texto-oscuro'
                    : 'text-texto-oscuro hover:text-morado-lakers'
                }`}
              >
                {label}
                {showBadge && (
                  <span className="inline-flex items-center justify-center h-3.75 min-w-4.5 px-1.5 rounded-full bg-amarillo-lakers text-[11px] font-medium text-[#3f2700]">
                    {pendingCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-Gris-Oscuro text-[16px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search by event or court"
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-[14px] bg-[#f3f3f5] border border-[#E7E6E8] text-[14px] text-texto-oscuro placeholder-Gris-Oscuro outline-none transition-colors focus:border-morado-lakers focus:bg-white"
          />
        </div>
      </div>
    </div>
  )
}
