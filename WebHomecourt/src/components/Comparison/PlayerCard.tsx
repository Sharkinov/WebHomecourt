import type { Player } from "./Player";
import SearchDropdown from "./Dropdowns";
import { SeasonDropdown } from "./Dropdowns";

export type PlayerCardProps = {
    player: Player | null;
    season: number | null;
    players: Player[];
    seasons: number[];
    onPlayerChange: (id: number | null) => void;
    onSeasonChange: (s: number | null) => void;
    color1: string;
    color2: string;
};

export default function PlayerCard({
    player,
    season,
    players,
    seasons,
    onPlayerChange,
    onSeasonChange,
    color1,
    color2,
    }: PlayerCardProps){
    //console.log("photo_url:", player?.photo_url ?? "no player selected");
    return (
        <div className= "p-1 rounded-2xl" style={{ background: `linear-gradient(to right, var(--color-${color1}),  var(--color-${color2}))` }}>
            <div className={`relative flex flex-col gap-3 rounded-2xl p-4 bg-white rounded-2xl shadow`}>
                <div className={`w-full h-48 bg-${color1} rounded-xl overflow-hidden flex items-center justify-center`}>
                    {player?.photo_url ? (
                        <img src={player.photo_url} alt={player.last_name} className="h-full object-cover" />
                    ) : (
                    <div className="flex flex-col items-center justify-center p-2">
                        <span className="text-zinc-100">No player selected</span>
                    </div>
                    )}
                </div>

                {/* dropdown jugadores */}
            <SearchDropdown
                players={players}
                player={player}
                color={color1}
                onPlayerChange={onPlayerChange}
            />
        
                {/* dropdown temporadas */}
            <SeasonDropdown
                seasons={seasons}
                season={season}
                color={color1}
                onSeasonChange={onSeasonChange}
            />
            </div>
        </div>
    )
}
