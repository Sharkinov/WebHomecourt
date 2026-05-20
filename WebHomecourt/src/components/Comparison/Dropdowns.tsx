import { useState, useRef, useEffect } from "react";
import type { Player } from "./Player";

interface SearchableDropdownProps {
  players: Player[];
  player: Player | null;
  color: string;
  onPlayerChange: (id: number | null) => void;
}
 
export default function SearchDropdown({ players, player, color, onPlayerChange }: SearchableDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  
  const filtered = players.filter((p) =>
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase())
  );
 
  const selectedLabel = player
    ? `${player.first_name} ${player.last_name}`
    : "Select player";

  //presiona el boton y ya esta listo para que escribas
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);
 
  function handleSelect(id: number | null) {
    onPlayerChange(id);
    setOpen(false);
    setSearch("");
  }
 
  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full rounded-xl p-2 font-medium shadow border-2 border-${color} bg-white text-left flex items-center justify-between`}
      >
        <span> {selectedLabel} </span>
        <svg
          className="w-4 h-4"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
 
      {/* dropdown abierto */}
      {open && (
        <div className="absolute z-10 w-full rounded-xl border border-gray-300 bg-white shadow-lg">
          {/* barra de busqueda */}
          <div className="p-2 border-gray-100">
            <div className="rounded-lg border border-gray-300 px-3 py-1">
              <input
                ref={inputRef}
                type="text"
                className="w-full text-sm outline-none placeholder-Gris-Oscuro bg-transparent"
                placeholder="Search a player"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button type="button" onClick={() => setSearch("")}></button>
              )}
            </div>
          </div>

          {/* lista de jugadores */}
          <ul className="max-h-50 overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-gray-400 text-center">No players found</li>
            ) : (
              filtered.map((p) => {
                const isSelected = player?.team_player_id === p.team_player_id;
                return (
                  <li key={p.team_player_id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(p.team_player_id)}
                      className={`w-full px-4 py-2 text-left text-sm flex items-center justify-between hover:bg-gray-100 ${
                        isSelected ? `font-medium text-${color} bg-gray-300` : ""
                      }`}
                    >
                      {p.first_name} {p.last_name}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

interface SeasonDropdownProps {
  seasons: number[];
  season: number | null;
  color: string;
  onSeasonChange: (s: number | null) => void;
}
 
export function SeasonDropdown({ seasons, season, color, onSeasonChange }: SeasonDropdownProps) {
  const [open, setOpen] = useState(false);
  const disabled = seasons.length === 0;
  const selectedLabel = disabled ? "No seasons available" : season ? `${season}-${season + 1}` : "Season";
 
  function handleSelect(s: number | null) {
    onSeasonChange(s);
    setOpen(false);
  }
 
  return (
    <div className="relative w-full">
      
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`w-full rounded-xl p-2 text-xs shadow border-2 border-${color} bg-white text-left flex items-center justify-between disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        <span> {selectedLabel} </span>
        <svg
          className="w-4 h-4"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
 
      {/* Panel */}
      {open && !disabled && (
        <div className="absolute z-10 w-full rounded-xl border border-gray-300 bg-white shadow-lg overflow-hidden">
          <ul className="max-h-50 overflow-y-auto">
            {seasons.map((s) => {
              const isSelected = season === s;
              return (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => handleSelect(s)}
                    className={`w-full px-4 py-2 text-left text-sm flex items-center justify-between hover:bg-gray-100 ${
                      isSelected ? `font-medium text-${color} bg-gray-300` : ""
                    }`}
                  >
                    {s}-{s + 1}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}