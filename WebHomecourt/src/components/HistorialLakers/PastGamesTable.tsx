import type { UserMatchHistoryRow, UserMatchHistorySummary } from '../../services/apiUser.ts'
import AddStats from './AddStats.tsx'
import { useState } from 'react'

interface PastGamesTableProps {
  rows: UserMatchHistoryRow[]
  summary: UserMatchHistorySummary | null
  onStatsAdded?: () => void
}

const tableColumns = 'grid-cols-[186px_205px_129px_127px_123px_106px_106px_107px_107px]'

const formatDateLabel = (value: string | null) => {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
}


function PastGamesTable({ rows, summary, onStatsAdded }: PastGamesTableProps) {
  const [popoRow, setPopoRow] = useState<UserMatchHistoryRow | null>(null)

  return (
    <>
      {popoRow && (
        <AddStats
          row={popoRow}
          onClose={() => setPopoRow(null)}
          onSaved={() => {
            setPopoRow(null)
            onStatsAdded?.()
          }}
        />
      )}
      <section className="w-full overflow-hidden rounded-[14px] border border-black/10 bg-white">
        {/* Title */}
        <div className="px-6 pb-4 pt-5 bg-morado-oscuro">
          <h2 className="text-[30px] font-semibold leading-7.5 text-texto-claro">Past Games</h2>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-330">

            {/* Header */}
            <div className={`grid h-11.25 ${tableColumns} bg-morado-lakers text-white`}>
              {['Event', 'Location', 'Date', 'Result', 'Score', 'PTS', 'REB', 'AST', 'Actions'].map((label) => (
                <div
                  key={label}
                  className="flex items-center justify-start px-5 text-[14px] font-bold uppercase tracking-wide"
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Rows */}
            <div className="max-h-76 overflow-y-auto">
              {rows.length === 0 ? (
                <div className={`grid h-15.25 ${tableColumns} border-t border-[#E7E6E8]`}>
                  <div className="col-span-9 flex items-center px-5 text-Gris-Oscuro">
                    No past games yet
                  </div>
                </div>
              ) : (
                rows.map((row) => {
                  const resultLabel = row.result === true ? 'W' : row.result === false ? 'L' : 'P'

                  const resultStyles =
                    row.result === true
                      ? 'bg-morado-lakers text-white'
                      : row.result === false
                        ? 'bg-[#E7E6E8] text-Gris-Oscuro'
                        : 'bg-[#E7E6E8] text-Gris-Oscuro'

                  const scoreLabel =
                    row.user_score !== null && row.opponent_score !== null
                      ? `${row.user_score}-${row.opponent_score}`
                      : '--'

                  const hasStats = row.rated_others === true && row.points !== null

                  return (
                    <div
                      key={row.user_event_id}
                      className={`grid h-15.25 ${tableColumns} border-t border-[#E7E6E8] transition-colors hover:bg-gray-50`}
                    >
                      {/* Event name */}
                      <div className="flex items-center gap-3 px-5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-morado-lakers">
                          <span className="material-symbols-outlined text-amarillo-lakers text-[20px] leading-none">
                            emoji_events
                          </span>
                        </div>
                        <span className="truncate text-[14px] leading-5.25 text-texto-oscuro">
                          {row.event_name}
                        </span>
                      </div>

                      {/* Location */}
                      <div className="flex items-center px-5 text-[14px] leading-5.25 text-Gris-Oscuro">
                        <span className="truncate">{row.court_name ?? 'N/A'}</span>
                      </div>

                      {/* Date */}
                      <div className="flex items-center px-5 text-[14px] leading-5.25 text-Gris-Oscuro">
                        {formatDateLabel(row.event_date)}
                      </div>

                      {/* Result badge */}
                      <div className="flex items-center justify-center px-5">
                        <span
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-bold leading-none ${resultStyles}`}
                        >
                          {resultLabel}
                        </span>
                      </div>

                      {/* Score */}
                      <div className="flex items-center px-5 text-[14px] leading-5.25 text-texto-oscuro">
                        {scoreLabel}
                      </div>

                      {/* PTS */}
                      <div className="flex items-center justify-center px-5 text-[14px] leading-5.25 text-texto-oscuro">
                        {row.points ?? '--'}
                      </div>

                      {/* REB */}
                      <div className="flex items-center justify-center px-5 text-[14px] leading-5.25 text-texto-oscuro">
                        {row.rebounds ?? '--'}
                      </div>

                      {/* AST */}
                      <div className="flex items-center justify-center px-5 text-[14px] leading-5.25 text-texto-oscuro">
                        {row.assists ?? '--'}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-center px-4">
                        {hasStats ? (
                          // Edit — texto con ícono, sin fondo
                          <button
                            onClick={() => setPopoRow(row)}   // ← mismo modal, misma row
                            className="inline-flex h-8 items-center gap-1.5 rounded-[10px] px-3 text-[14px] font-medium text-morado-lakers transition-colors hover:bg-morado-lakers/10"
                          >
                            <span className="material-symbols-outlined text-[16px] leading-none">
                              check_circle
                            </span>
                            <span>Edit</span>
                          </button>
                        ) : (
                          // Add stats — botón sólido morado
                          <button
                            onClick={() => setPopoRow(row)}
                            className="inline-flex h-8 min-w-28 items-center justify-center gap-1.5 whitespace-nowrap rounded-[10px] bg-morado-lakers px-4 text-[14px] font-medium text-white transition-colors hover:bg-morado-lakers/90"
                          >
                            <span className="material-symbols-outlined text-[16px] leading-none">
                              add
                            </span>
                            <span>Add stats</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer Average — mismo fondo que el header */}
            <div className={`grid h-11.5 ${tableColumns} bg-morado-lakers`}>
              <div className="col-span-5 flex items-center px-5 text-[13px] leading-[19.5px] text-white/80">
                Average
              </div>
              <div className="flex items-center justify-center px-5 text-[13px] font-medium leading-[19.5px] text-white">
                {(summary?.ppg ?? 0).toFixed(1)}
              </div>
              <div className="flex items-center justify-center px-5 text-[13px] font-medium leading-[19.5px] text-white">
                {(summary?.rpg ?? 0).toFixed(1)}
              </div>
              <div className="flex items-center justify-center px-5 text-[13px] font-medium leading-[19.5px] text-white">
                {(summary?.apg ?? 0).toFixed(1)}
              </div>
              <div />
            </div>

          </div>
        </div>
      </section>
    </>
  )
}

export default PastGamesTable