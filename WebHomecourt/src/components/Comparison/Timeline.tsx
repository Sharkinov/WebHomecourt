import { ResponsiveContainer, LineChart, CartesianGrid, Line, XAxis, YAxis, Tooltip} from "recharts";
import type { PlayerSeasonAverage } from "./Player";
import type { Player } from "./Player";

export default function Timeline({p1, p2, s1, s2}: {p1: Player|null, p2: Player|null, s1: PlayerSeasonAverage[] |null, s2: PlayerSeasonAverage[] |null }) {
    const ss1 = s1 ?? [];
    const ss2 = s2 ?? [];
    const allSeasons = [...new Set([...ss1.map(r => r.season_start), ...ss2.map(r => r.season_start)])].sort();
    const timelineData = allSeasons.map(s => ({
    season: `${s}-${s + 1}`,
    [p1? `${p1.first_name} ${p1.last_name}`: ""]: ss1.find(r => r.season_start === s)?.points_per_game ?? null,
    [p2? `${p2.first_name} ${p2.last_name}`: ""]: ss2.find(r => r.season_start === s)?.points_per_game ?? null,
  }));

    return(
        <div>
            <div className="p-4 w-full h-[350px] flex flex-col justify-center items-center bg-white border border-gray-300 rounded-2xl shadow">
                    <h3>Points Per Game Average by Season</h3>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData} margin={{ top: 20, right: 20, bottom: -10, left: -30 }}>
                <CartesianGrid stroke="var(--color-gris-disabled)" />
                <XAxis dataKey="season" tick={{ fill: "var(--color-Gris-Oscuro)", fontSize: 10}} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--color-Gris-Oscuro)", fontSize: 10}} axisLine={false} tickLine={false} />
                <Tooltip/>
                {p1 && <Line  type="monotone" dataKey={`${p1.first_name} ${p1.last_name}`} stroke="var(--color-morado-lakers)" strokeWidth={2} dot={{ fill: "var(--color-morado-lakers)", r: 3 }} connectNulls />}
                {p2 && <Line type="monotone" dataKey={`${p2.first_name} ${p2.last_name}`} stroke="var(--color-amarillo-lakers)" strokeWidth={2} dot={{ fill: "var(--color-amarillo-lakers)", r: 3 }} connectNulls />}
                </LineChart>
            </ResponsiveContainer>
            </div>
        </div>
    )
}