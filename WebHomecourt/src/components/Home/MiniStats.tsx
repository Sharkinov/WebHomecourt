import { supabase } from "../../lib/supabase";
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, LabelList, ResponsiveContainer,} from "recharts";
import { format } from "date-fns";
import { SummaryScoreCard } from "../Agenda/GameScore";


//Usando lo de amparo pero para no romper su codigo lo modificare aqui!
const MINI_STATS = [
  { key: "total_rebounds",  label: "Rebounds"  },
  { key: "total_assists",   label: "Assists"   },
  { key: "total_steals",    label: "Steals"    },
] as const

export type MiniStats = {
  game_id: number;
  start_date: string;
  lakers_rebounds: number;
  opposing_rebounds: number;
  lakers_assists: number;
  opposing_assists: number;
  lakers_steals: number;
  opposing_steals: number;
  lakers_points: number;
  opposing_points: number;
  lakers_abv: string;
  opposing_abv: string;
  opposing_team_name: string;
  opposing_team_logo: string;
};

//NVM haré lo mio por que esta usando mal las stats LOL
export async function getMiniStatsByGameId(game_id: number): Promise<MiniStats> {
  const { data, error } = await supabase.rpc("get_team_comparison", {p_game_id: game_id,}) 
  // Smth died
  if (error) {
    console.error("Supabase error:", error.message)
    throw new Error("Failed to get ministats")
  }

  const normalizedData = Array.isArray(data) ? data[0] : data;
  if (!normalizedData) {
    throw new Error("No mini stats found")
  }

  return normalizedData as MiniStats
}

type GameSummaryMiniGraphProps = {
  game_id: number;
  refreshKey?: number;
  pastGame: boolean;
}

function GameSummaryMiniGraph({ game_id, refreshKey = 0, pastGame }: GameSummaryMiniGraphProps) {
  const navigate = useNavigate();
    const [teamStats, setTeamStats] = useState<MiniStats | null >(null);
    useEffect(() => {
        const loadStats = async () => {
            try {
                const data = await getMiniStatsByGameId(game_id)
                setTeamStats(data)
            } catch (err) {
                console.error(err)
            }
        }

        loadStats();
    }, [game_id, refreshKey])

    const teamA = {
      total_rebounds: teamStats?.lakers_rebounds ?? 0,
      total_assists: teamStats?.lakers_assists ?? 0,
      total_steals: teamStats?.lakers_steals ?? 0,
    };

    const teamB = {
      total_rebounds: teamStats?.opposing_rebounds ?? 0,
      total_assists: teamStats?.opposing_assists ?? 0,
      total_steals: teamStats?.opposing_steals ?? 0,
    };

    return (
    <div className="w-full px-3 md:px-5 pt-4 pb-5 bg-white rounded-2xl border border-black/25 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-purple-900 text-base md:text-2xl font-medium">
          {pastGame ? "Last Game Summary" : "Live Stats Summary"}
        </h2>
        <button
          type="button"
          onClick={() => navigate('/estadisticas', { state: { game_id } })}
          className="flex items-center gap-1.5 text-zinc-500 text-xs md:text-sm hover:text-zinc-700 transition-colors"
        >
          <span>View more</span>
          <span className="material-symbols-outlined text-xl md:text-2xl">arrow_forward</span>
        </button>
      </div>
      {pastGame ? (
        <div className="w-full px-3 md:px-6 py-2.5 flex flex-col md:flex-row md:justify-between md:items-center gap-3 bg-white rounded-2xl">
          <div className="flex items-center gap-3 md:gap-5">
            <div className="flex flex-col justify-center">
              <div className="text-black text-base md:text-2xl font-normal">vs {teamStats?.opposing_team_name}</div>
              <div className="text-black text-xs md:text-sm font-normal">{teamStats?.start_date ? format(new Date(teamStats.start_date), "MMMM do, yyyy") : "N/A"}</div>
            </div>
            <div className="w-9 h-9 md:w-12 md:h-12">
              <img className="w-full h-full object-contain" src={teamStats?.opposing_team_logo}/>
            </div>
          </div>
          <SummaryScoreCard lakers_score={teamStats?.lakers_points ?? 0} opposite_score={teamStats?.opposing_points ?? 0} />
        </div>
      ) : null}
      <div className="flex flex-col gap-4">
        {MINI_STATS.map(({ key, label }) => (
          <div key={key} className="flex flex-col gap-1.5">
            <div className="w-full h-8 md:h-10 rounded-2xl overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={[{ teamA: teamA[key], teamB: teamB[key] }]}
                  stackOffset="expand"
                  margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis type="category" hide />
                  <Bar
                    dataKey="teamA"
                    stackId="a"
                    className="fill-purple-900"
                    radius={[16, 0, 0, 16]}
                  >
                    <LabelList
                      valueAccessor={() => teamA[key]}
                      position="insideLeft"
                      offset={20}
                      className="fill-white text-[10px] md:text-sm font-medium"
                    />
                  </Bar>
                  <Bar
                    dataKey="teamB"
                    stackId="a"
                    className="fill-neutral-400"
                    radius={[0, 16, 16, 0]}
                  >
                    <LabelList
                      valueAccessor={() => teamB[key]}
                      position="insideRight"
                      offset={20}
                      className="fill-purple-900 text-[10px] md:text-sm font-medium"
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-violet-950 text-sm md:text-base">
              {label}
            </p>
          </div>
        ))}
        <div className="flex justify-between pt-1">
          <span className="text-violet-950 text-sm md:text-lg">{teamStats?.lakers_abv ?? "LA"}</span>
          <span className="text-violet-950 text-sm md:text-lg">{teamStats?.opposing_abv ?? "OPP"}</span>
        </div>
      </div>
    </div>
  )
}
export default GameSummaryMiniGraph;