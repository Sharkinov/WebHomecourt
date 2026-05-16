import { useNavigate } from 'react-router-dom'
import type { UserMatchHistoryRow } from '../../services/apiUser.ts'

interface PastGamesTableProps {
  rows: UserMatchHistoryRow[]
  className?: string
}

const tableColumns = 'grid-cols-[186px_205px_129px_127px_123px_106px_106px_107px_107px]'

const average = (values: Array<number | null | undefined>) => {
  const numericValues = values.filter((value): value is number => Number.isFinite(value))
  if (numericValues.length === 0) return 0
  return numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length
}

const formatDateLabel = (value: string | null) => {
  if (!value) return 'N/A'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'

  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
  })
}

function PastGamesTable({ rows, className }: PastGamesTableProps) {
  const navigate = useNavigate()

  const averagePoints = average(rows.map((row) => row.points))
  const averageRebounds = average(rows.map((row) => row.rebounds))
  const averageAssists = average(rows.map((row) => row.assists))

  return (
    <section
      className={`w-full overflow-hidden rounded-[14px] border border-black/10 bg-white shadow-[0_4px_8px_rgba(0,0,0,0.06)] ${
        className ?? ''
      }`}
    >
      <div className="px-6 pb-4 pt-5">
        <h2 className="text-[30px] font-semibold leading-7.5 text-morado-lakers">Past Games</h2>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-330">
          <div className={`grid h-11.25 ${tableColumns} bg-morado-lakers text-white`}>
            {['Event', 'Location', 'Date', 'Result', 'Score', 'PTS', 'REB', 'AST', 'Actions'].map((label) => (
              <div
                key={label}
                className="flex items-center justify-start px-5 text-[20px] font-medium"
              >
                {label}
              </div>
            ))}
          </div>

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
                      : 'bg-gray-200 text-gray-600'
                const actionLabel = row.rated_others ? 'Edit' : 'Add stats'
                const actionIcon = row.rated_others ? 'edit' : 'add'
                const scoreLabel =
                  row.user_score !== null && row.opponent_score !== null
                    ? `${row.user_score}-${row.opponent_score}`
                    : '--'

                return (
                  <div
                    key={row.user_event_id}
                    className={`grid h-15.25 ${tableColumns} border-t border-[#E7E6E8] transition-colors hover:bg-gray-50`}
                  >
                    <div className="flex items-center gap-3 px-5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-morado-lakers">
                        <span className="material-symbols-outlined text-amarillo-lakers text-[24px] leading-none">
                          emoji_events
                        </span>
                      </div>
                      <span className="truncate text-[14px] leading-5.25 text-texto-oscuro">
                        {row.event_name}
                      </span>
                    </div>

                    <div className="flex items-center px-5 text-[14px] leading-5.25 text-texto-oscuro">
                      <span className="truncate">{row.court_name ?? 'N/A'}</span>
                    </div>

                    <div className="flex items-center px-5 text-[14px] leading-5.25 text-Gris-Oscuro">
                      {formatDateLabel(row.event_date)}
                    </div>

                    <div className="flex items-center justify-center px-5">
                      <span
                        className={`inline-flex h-6.5 min-w-9 items-center justify-center rounded-full px-3 text-[16px] font-medium leading-none ${resultStyles}`}
                      >
                        {resultLabel}
                      </span>
                    </div>

                    <div className="flex items-center px-5 text-[14px] leading-5.25 text-texto-oscuro">
                      {scoreLabel}
                    </div>

                    <div className="flex items-center justify-center px-5 text-[14px] leading-5.25 text-texto-oscuro">
                      {row.points ?? '--'}
                    </div>

                    <div className="flex items-center justify-center px-5 text-[14px] leading-5.25 text-texto-oscuro">
                      {row.rebounds ?? '--'}
                    </div>

                    <div className="flex items-center justify-center px-5 text-[14px] leading-5.25 text-texto-oscuro">
                      {row.assists ?? '--'}
                    </div>

                    <div className="flex items-center justify-center px-4">
                      <button
                        onClick={() => navigate('/estadisticas', { state: { game_id: row.event_id } })}
                        className="inline-flex h-8 items-center gap-2 rounded-[10px] border border-morado-lakers px-3.5 text-[14px] font-medium text-morado-lakers transition-colors hover:bg-morado-lakers hover:text-white"
                      >
                        <span className="material-symbols-outlined text-[16px] leading-none">
                          {actionIcon}
                        </span>
                        <span>{actionLabel}</span>
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className={`grid h-11.5 ${tableColumns} border-t border-[#E7E6E8] bg-white`}>
            <div className="col-span-5 flex items-center px-5 text-[13px] leading-[19.5px] text-Gris-Oscuro">
              Avarage
            </div>
            <div className="flex items-center justify-center px-5 text-[13px] leading-[19.5px] text-Gris-Oscuro">
              {averagePoints.toFixed(1)}
            </div>
            <div className="flex items-center justify-center px-5 text-[13px] leading-[19.5px] text-Gris-Oscuro">
              {averageRebounds.toFixed(1)}
            </div>
            <div className="flex items-center justify-center px-5 text-[13px] leading-[19.5px] text-Gris-Oscuro">
              {averageAssists.toFixed(1)}
            </div>
            <div />
          </div>
        </div>
      </div>
    </section>
  )
}

export default PastGamesTable
