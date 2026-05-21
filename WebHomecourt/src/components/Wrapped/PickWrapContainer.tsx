const WRAP_OPTIONS = [
  {
    id: 'last-game',
    label: 'Last Game',
    description: 'Most recent match recap',
    icon: (active: boolean) => (
      <span className="material-symbols-outlined" style={{
        fontSize: '20px',
        color: active ? 'white' : 'var(--color-morado-lakers)'
      }}>
        schedule
      </span>
    ),
  },
  {
    id: 'mvp-moment',
    label: 'MVP Moment',
    description: 'Star performance from last game',
    icon: (active: boolean) => (
      <span className="material-symbols-outlined" style={{
        fontSize: '20px',
        color: active ? 'white' : 'var(--color-morado-lakers)'
      }}>
        star
      </span>
    ),
  },
  {
    id: 'top-stats',
    label: 'Top Stats',
    description: 'Best numbers from last game',
    icon: (active: boolean) => (
      <span className="material-symbols-outlined" style={{
        fontSize: '20px',
        color: active ? 'white' : 'var(--color-morado-lakers)'
      }}>
        leaderboard
      </span>
    ),
  },
]

interface PickWrapContainerProps {
  selectedWrap: string
  setSelectedWrap: (id: string) => void
}

export function PickWrapContainer({ selectedWrap, setSelectedWrap }: PickWrapContainerProps) {
  return (
    <div className="bg-white rounded-[15px] p-4 md:p-5 lg:p-6 shadow-[0_2px_12px_rgba(59,25,92,0.08)]">
      {/* HEADER */}
      <div className="mb-4 pb-3 border-b border-morado-oscuro/10">
        <h3 style={{ fontFamily: 'Graphik, sans-serif', color: 'var(--color-texto-oscuro)', fontSize: '18px', fontWeight: 600, margin: 0 }}>
          Pick a Wrap
        </h3>
      </div>

      {/* OPCIONES */}
      <div className="flex flex-col gap-2.5">
        {WRAP_OPTIONS.map((option) => {
          const active = selectedWrap === option.id
          return (
            <button
              key={option.id}
              onClick={() => setSelectedWrap(option.id)}
              className={`w-full rounded-[14px] p-3.5 flex items-center gap-3.5 text-left border-[1.5px] transition-all ${
                active
                  ? 'border-transparent shadow-[0_4px_14px_rgba(59,25,92,0.3)]'
                  : 'border-transparent bg-[#F7F5FA] hover:bg-[#EDE8F7] hover:border-morado-lakers/20'
              }`}
              style={active ? { background: 'linear-gradient(135deg, var(--color-morado-oscuro), var(--color-morado-lakers))' } : {}}
            >
              {/* ICON */}
              <div
                className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
                style={{ background: active ? 'rgba(255,255,255,0.15)' : 'rgba(85,37,131,0.1)' }}
              >
                {option.icon(active)}
              </div>

              {/* TEXTOO */}
              <div className="flex-1">
                <div style={{ fontFamily: 'Graphik, sans-serif', fontSize: '15px', fontWeight: 600,
                  color: active ? 'white' : 'var(--color-morado-oscuro)' }}>
                  {option.label}
                </div>
                <div style={{ fontFamily: 'Graphik, sans-serif', fontSize: '12px',
                  color: active ? 'rgba(255,255,255,0.7)' : 'var(--color-Gris-Oscuro)', marginTop: '1px' }}>
                  {option.description}
                </div>
              </div>

              {/* LA CHECKMARK */}
              {active && (
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(253,185,39,0.9)' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                    stroke="var(--color-morado-oscuro)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}