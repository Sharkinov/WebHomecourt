import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts"
import type {PlayerStat} from "./getStatsByGameId"

function RatioGraph({ stats }: { stats: PlayerStat[] }) {

  const playersMap: Record<number, PlayerStat[]> = {}

  stats.forEach(stat => {
    if (!playersMap[stat.team_player_id]) {
      playersMap[stat.team_player_id] = []
    }
    playersMap[stat.team_player_id].push(stat)
  })

  const COLORS = ["#3B195C", "#542581", "#9482A5",
    "#3F2700","#8C5A08", "#FCB136", "#E7C081"] 

  return (
    <div className="p-8 gap-2 w-full h-[350px] flex flex-wrap  bg-white border border-gray-300 rounded-2xl shadow">
      <h2 className="text-xl font-bold mb-4">
        Assist to Turnover Ratio
      </h2>

      <ResponsiveContainer width="100%" height="90%">
        <ScatterChart>
            <CartesianGrid />
            <XAxis
                type="number"
                dataKey="assists"
                name="Assists"
            />
            <YAxis
                type="number"
                dataKey="turnovers"
                name="Turnovers"
            />
            <Tooltip content={({ active, payload }) => {
                if (active && payload && payload.length){ 
                    const data = payload[0].payload
                    return (
                    <div className="bg-white p-3 border rounded shadow">
                        <p className="font-bold">{data.full_name}</p>
                        <p>Assists: {data.assists}</p>
                        <p>Turnovers: {data.turnovers}</p>
                    </div>
                )}
                return null
            }}/>
            {Object.entries(playersMap).map(([full_name, playerStats], index) => (
                <Scatter
                    key={full_name}
                    name={playerStats[0].full_name}
                    data={playerStats}
                    fill={COLORS[index % COLORS.length]}
                />))}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}

export default RatioGraph