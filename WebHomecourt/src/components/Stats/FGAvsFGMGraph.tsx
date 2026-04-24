import {
  BarChart, Bar, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts"
import { useState } from "react"
import type {PlayerStat} from "./getStatsByGameId"
function FGAvsFGMGraph({ stats }: { stats: PlayerStat[]}) {
  const [selectedPlayer, setSelectedPlayer] = useState<number | "all">("all")

  const filteredStats =
    selectedPlayer === "all"
      ? stats
      : stats.filter(p => p.team_player_id === selectedPlayer)

  const Made = filteredStats.reduce(
    (sum, player) => sum + (player.field_made ?? 0),
    0
  )

  const Attempted = filteredStats.reduce(
    (sum, player) => sum + (player.field_attempted ?? 0),
    0
  )

  const chartData = [{ Made, Attempted }]

  return (
    <div className="p-8 gap-2 w-full h-[350px] flex flex-wrap  bg-white border border-gray-300 rounded-2xl shadow">
      <h2>Field Goals Attempted vs. Field Goals Made</h2>
      <select
        value={selectedPlayer}
        onChange={(e) =>
          setSelectedPlayer(
            e.target.value === "All" ? "all" : Number(e.target.value)
          )
        }
        className="px-2 py-2 gap-2 rounded-2xl border border-gray-400" 
      >
        <option value="All">Team Total</option>
        {stats.map((player) => (
          <option key={player.team_player_id} value={player.team_player_id}>
            {player.full_name}
          </option>
        ))}
      </select>

      <ResponsiveContainer width="100%" height="70%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <YAxis />
          <Tooltip labelFormatter={() => ""}/>
          <Legend />
          <Bar dataKey="Attempted" fill="#542581" />
          <Bar dataKey="Made" fill="#FCB136" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
export default FGAvsFGMGraph