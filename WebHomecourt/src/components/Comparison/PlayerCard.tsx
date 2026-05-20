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
    color: string;
};

export default function PlayerCard({
    player,
    season,
    players,
    seasons,
    onPlayerChange,
    onSeasonChange,
    color,
    }: PlayerCardProps){
    //console.log("photo_url:", player?.photo_url ?? "no player selected");
    return (
        
        //bg-white border border-gray-300 rounded-2xl shadow
        <div className={`relative flex flex-col gap-3 rounded-2xl p-4 bg-white rounded-2xl shadow border-3 border-${color}`}>
            <div className="w-full h-48 bg-gris-disabled rounded-xl overflow-hidden flex items-center justify-center ">
                {player?.photo_url ? (
                    <img src={player.photo_url} alt={player.last_name} className="h-full object-cover" />
                ) : (
                <div className="flex flex-col items-center justify-center p-2">
                    <span className="text-Gris-Oscuro">No player selected</span>
                </div>
                )}
            </div>

            {/* dropdown jugadores */}
        <SearchDropdown
            players={players}
            player={player}
            color={color}
            onPlayerChange={onPlayerChange}
        />
    
            {/* dropdown temporadas */}
        <SeasonDropdown
            seasons={seasons}
            season={season}
            color={color}
            onSeasonChange={onSeasonChange}
        />
        </div>
    )
}
