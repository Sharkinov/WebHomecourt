import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

interface DonutChartProps {
  title: string
  data: { name: string, value: number }[]
  colors: string[]
  centerLabel: string
  total: number
  days?: number
  onDaysChange?: (days: number) => void
  showOptions?: boolean
  options?: { label: string, days: number }[]
}

const defaultOptions = [
  { label: 'This Week', days: 7 },
  { label: 'This Month', days: 30 },
  { label: 'Last 3 Months', days: 90 },
]

const DonutChart = ({ title, data, colors, centerLabel, total, days, onDaysChange, showOptions = true, options = defaultOptions }: DonutChartProps) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 w-full flex-1 h-full">
      <div className="flex justify-between items-start mb-4">
        <h2 className="font-bold text-[20px]!">{title}</h2>
        {showOptions && (
          <select
            value={days}
            onChange={(e) => onDaysChange?.(Number(e.target.value))}
            className="px-2 py-1.5 rounded-lg border border-gray-200 text-sm"
          >
            {options.map((o) => (
              <option key={o.days} value={o.days}>{o.label}</option>
            ))}
          </select>
        )}
      </div>

      <div className="flex items-center gap-6">
        <div className="relative w-48 h-48 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: -20, right: -20, bottom: -20, left: -20 }}>
              <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" strokeWidth={2}>
                {data.map((_, i) => (
                  <Cell key={i} fill={colors[i]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-gray-500 text-sm">Total</p>
            <p className="font-black text-2xl">{total}</p>
            <p className="text-gray-500 text-sm">{centerLabel}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 flex-1 min-w-0 overflow-hidden">
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: colors[i] }} />
                <p className="font-medium text-[16px]! truncate">{d.name}</p>
              </div>
              <p className="font-black text-morado-lakers text-[18px]! flex-shrink-0 ml-2">{d.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DonutChart