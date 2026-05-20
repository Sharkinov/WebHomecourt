import {RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer} from "recharts";
import type { PlayerSeasonAverage } from "./Player";

export default function SkillStar({ s1, s2}: { s1: PlayerSeasonAverage|null, s2: PlayerSeasonAverage|null }) {
    const radarData = [
        //las divisiones son para que eo max de todos sea 20 y se vea un poquito mas parejo los picos del radar
    { stat: "PTS", p1: (s1?.points_per_game ?? 0)/4.5, p2: (s2?.points_per_game ?? 0)/4.5},
    { stat: "REB", p1: (s1?.rebounds_per_game ?? 0)/1.75, p2: (s2?.rebounds_per_game ?? 0)/1.75},
    { stat: "AST", p1: (s1?.assists_per_game ?? 0)/1.5, p2: (s2?.assists_per_game ?? 0)/1.5},
    { stat: "STL", p1: (s1?.steals_per_game ?? 0)*2, p2: (s2?.steals_per_game ?? 0)*2},
    { stat: "FG%", p1: (s1?.fg_pct ?? 0)/5, p2: (s2?.fg_pct ?? 0)/5},
  ];
    return(
        <div >
            {(s1 != null || s2 != null) ? 
                <div className="p-8 w-full h-[350px] flex flex-col justify-center items-center bg-white border border-gray-300 rounded-2xl shadow">
                    <h3>Performance Radar</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                            <PolarGrid/>
                            <PolarAngleAxis dataKey="stat" tick={{ fill: "gris-disabled", fontSize: 11}} />
                            <Radar className="stroke-morado-lakers stroke-2 fill-morado-lakers " name={s1?.full_name} dataKey="p1" fillOpacity={0.25} />
                            <Radar className="stroke-amarillo-lakers stroke-2 fill-amarillo-lakers" name={s2?.full_name} dataKey="p2" fillOpacity={0.25}/>
                        </RadarChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center items-center gap-4">
                        {(s1 != null) ?  
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-morado-lakers"></div>
                                <div className="flex-1 text-xs">{s1 != null ? s1.full_name : ''}</div>
                            </div> 
                        : <div> </div>}
                        {(s2 != null) ?  
                            <div className="flex items-center gap-2">  
                                <div className="w-3 h-3 rounded-full bg-amarillo-lakers"></div>
                                <div className="flex-1 text-xs">{s2 != null ? s2.full_name : ''}</div>
                            </div> 
                        : <div> </div>}
                    </div>
            </div> : <div></div>}
        </div>
    )
}