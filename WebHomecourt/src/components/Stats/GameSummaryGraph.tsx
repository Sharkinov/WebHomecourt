import type {TeamStat} from "./getTeamStatsByGameId"
import {getTeamStatsByGameId} from "./getTeamStatsByGameId"
import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, LabelList, ResponsiveContainer,
} from "recharts";

export const STATS = [
  { key: "total_points",    label: "Points"    },
  { key: "total_rebounds",  label: "Rebounds"  },
  { key: "total_assists",   label: "Assists"   },
  { key: "total_steals",    label: "Steals"    },
  { key: "total_turnovers", label: "Turnovers" },
] as const;


function GameSummaryGraph({ game_id }: { game_id: number}) {
    const [teamStats, setTeamStats] = useState<TeamStat[]>([])
    useEffect(() => {
        const loadStats = async () => {
            try {
                const data = await getTeamStatsByGameId(game_id)
                setTeamStats(data)
            } catch (err) {
                console.error(err)
            }
        } 
        loadStats()
    }, [game_id])

    const teamA = teamStats.find(t => t.team_id === 1)
    const teamB = teamStats.find(t => t.team_id !== 1)
    if (!teamA || !teamB) return null;

    return (
    <div  className=" gap-8 w-full h-[350px] justify-center items-center bg-white border border-gray-300 rounded-2xl shadow">
        <h2 className="pt-6 pb-2 flex flex-wrap justify-center items-center" > Game summary</h2>
        <div className="px-8 pb-8"> 
        {STATS.map(({ key, label }) => (
        <div key={key}>
          <ResponsiveContainer width="100%" height={30}>
            <BarChart
              layout="vertical"
              data={[{ teamA: teamA[key], teamB: teamB[key] }]}
              stackOffset="expand"
              margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis type="category" hide />

              <Bar dataKey="teamA" stackId="a" fill="#542581" radius={[18, 0, 0, 18]}>
                <LabelList
                  valueAccessor={(_: any) => teamA[key]}
                  position="insideLeft"
                  style={{ fill: "#fff", fontSize: 13, fontWeight: 500 }}
                />
              </Bar>

              <Bar dataKey="teamB" stackId="a" fill="#A09CA4" radius={[0, 18, 18, 0]}>
                <LabelList
                  valueAccessor={(_: any) => teamB[key]}
                  position="insideRight"
                  style={{ fill: "#542581", fontSize: 13, fontWeight: 500 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="pb-1 text-gray-500 text-xs">{label}</p>
        </div>
      ))}
    </div>
    </div>
  )
}
export default GameSummaryGraph;