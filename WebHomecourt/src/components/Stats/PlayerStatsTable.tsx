import type {PlayerStat} from "./getStatsByGameId"
import {useState } from "react"

const COLUMNS = [
    { key: "minutes", label: "Minutes (MIN)", abbr: "MIN" },
    { key: "points", label: "Points (PTS)",   abbr: "PTS" },
    { key: "rebounds", label: "Rebounds (REB)", abbr: "REB" },
    { key: "assists", label: "Assists (AST)",  abbr: "AST" },
    { key: "steals", label: "Steals (STL)",abbr: "STL" },
    { key: "turnovers", label: "Turnovers (TO)", abbr: "TO"  },
    { key: "field_made", label: "Field Goals Made (FGM)",abbr: "FGM" },
    { key: "field_attempted",label: "Field Goals Attempted (FGA)",abbr: "FGA" },
] as const;

type ColKey = typeof COLUMNS[number]["key"];

function PlayerStatsTable({ stats }: { stats: PlayerStat[]}) {
    const [visibleCols, setVisibleCols] = useState<Set<ColKey>>(
        new Set(COLUMNS.map((c) => c.key))
    );

    const toggleCol = (key: ColKey) => {
        setVisibleCols((prev) => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };
    const activeCols = COLUMNS.filter((c) => visibleCols.has(c.key));
    const gridCols = `2fr ${activeCols.map(() => "1fr").join(" ")}`;

    return (
    // toggles
    <div className= "flex flex-col md:flex-row gap-6 w-full"> 
        <div >
            <div>
                <div className="bg-[#542581] w-50 text-white rounded-2xl p-4 flex flex-col gap-2">
                
                <h3 className="">Statistics</h3 >
                
                {COLUMNS.map((col) => (
                <label key={col.key} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                        type="checkbox"
                        checked={visibleCols.has(col.key)}
                        onChange={() => toggleCol(col.key)}
                        className="accent-white"
                        />
                    {col.label}
                </label>
                ))}
                </div> 
            </div> 
        </div>
        {/* tabla */}
        <div className="w-full overflow-x-auto">
            <div className="min-w-[500px] bg-white border border-gray-300 rounded-2xl shadow overflow-hidden">
                {/* header */}
                <div className="bg-[#542581] text-white font-semibold px-4 py-3 grid gap-3" 
                style={{ gridTemplateColumns: gridCols }}
                >
                    <span>PLAYER</span>
                    {activeCols.map((col) => (
                        <span key={col.key}>{col.abbr}</span>
                    ))}
                </div>
                {/* contenido */}
                <div className="text-xs md:text-sm w-full w-full overflow-x-auto">
                    {stats.map((player, index) => (
                        <div key={index}
                            className="grid items-center px-4 py-3"
                            style={{ gridTemplateColumns: gridCols }}
                            >
                            <div className=" flex items-center gap-2">
                                <img
                                    src={player.photo_url}
                                    className="w-6 h-6 md:w-12 md:h-12 object-cover rounded-full bg-[#542581]"
                                />
                                <div className="px-2">{player.full_name}</div>
                            </div>
                            {activeCols.map((col) => (
                            <div className="px-2 text-xs md:text-sm" key={col.key}>{player[col.key]}</div>
                            ))}
                        </div>
                    ))}
                </div>
            
                {/* tatal */}
                <div className="bg-[#FCB136] font-semibold px-4 py-3 grid gap-2"
                    style={{ gridTemplateColumns: gridCols }}
                    >
                    <span>Team Total</span>
                    {activeCols.map((col) => (
                        <span key={col.key}>
                        {col.key === "minutes"
                            ? ""
                            : stats.reduce((sum, p) => sum + (p[col.key] as number), 0)}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    </div>
    )
}

export default PlayerStatsTable
