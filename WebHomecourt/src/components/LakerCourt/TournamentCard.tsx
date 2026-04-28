import { LuMapPin, LuTriangle, LuUsers } from "react-icons/lu";
import type { CourtTournament } from "../../services/apiEvents";

interface TournamentCardProps {
    tournament: CourtTournament;
    courtName: string;
    isJoined: boolean;
    isSubmitting: boolean;
    getSkillLabel: (id: number | null) => string;
    onSignUp: (tournament: CourtTournament, currentPlayers: number, safeMaxPlayers: number) => void;
    onReport: () => void;
}

// AGREGAR en TournamentCard.tsx, antes del componente
function formatTournamentDateParts(value: string | null) {
    if (!value) return { dateLabel: "Por definir", timeLabel: "--:--" };
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return { dateLabel: "Por definir", timeLabel: "--:--" };
    const dateLabelRaw = new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short" }).format(parsedDate);
    return {
        dateLabel: dateLabelRaw.replace(".", ""),
        timeLabel: value.includes("T")
            ? new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false }).format(parsedDate)
            : "--:--",
    };
}

export default function TournamentCard({ tournament, courtName, isJoined, isSubmitting, getSkillLabel, onSignUp, onReport }: TournamentCardProps) {
    const { dateLabel, timeLabel } = formatTournamentDateParts(tournament.date);
    const safeMaxPlayers = Math.max(0, tournament.max_players);
    const currentPlayers = Math.min(tournament.current_players, safeMaxPlayers);
    // Calcula el porcentaje de ocupación (0-100%) para la barra de progreso
    const fillPercent = safeMaxPlayers > 0 ? Math.min(100, (currentPlayers / safeMaxPlayers) * 100) : 0;

    const isFull = safeMaxPlayers === 0 || currentPlayers >= safeMaxPlayers;
    // Desactiva el botón si se está procesando o si no está inscrito y está lleno
    const isButtonDisabled = isSubmitting || (!isJoined && isFull);
    const signUpLabel = isSubmitting ? "..." : isJoined ? "UNSUBSCRIBE" : isFull ? "FULL" : "SIGN UP";

    return (
        <article className="min-h-62.5 rounded-[14px] bg-Background border-[0.8px] border-transparent px-5 pt-5 pb-5.25">
            <div className="flex flex-col">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="text-[16px] leading-6 font-normal text-[#11061A] ">
                            {tournament.event_name}
                        </div>
                        <div className="mt-2 flex items-center gap-1.5 text-[12px] leading-4.5 text-Gris-Oscuro">
                            <LuMapPin size={12} />
                            {courtName}
                        </div>
                    </div>
                    <div className="text-right shrink-0">
                        <div className="text-[14px] leading-5.25 text-[#11061A]">{dateLabel}</div>
                        <div className="text-[12px] leading-4.5 text-Gris-Oscuro">{timeLabel}</div>
                    </div>
                </div>

                <div className="mt-4 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[13px] leading-[19.5px]">
                        <span className="text-Gris-Oscuro">Players</span>
                        <span className="text-[#11061A]">
                            {currentPlayers}/{safeMaxPlayers}
                        </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#E7E6E8] overflow-hidden">
                        <div
                            className="h-full rounded-full bg-[linear-gradient(90deg,#542581_0%,#FCB136_100%)]"
                            style={{ width: `${fillPercent}%` }}
                        />
                    </div>
                </div>

                <div className="mt-4 border-b-[0.8px] border-[#E7E6E8] pb-3 text-[12px] leading-4.5 text-Gris-Oscuro">
                    Age: <span className="text-morado-lakers">{`${tournament.min_age ?? 15}-${tournament.max_age ?? "All"}`}</span> | Skill level: <span className="text-morado-lakers">{getSkillLabel(tournament.skill_level_id)}</span>
                </div>

                <div className="mt-3 border-b-[0.8px] border-[#E7E6E8] pb-3 text-[12px] leading-4.5 text-Gris-Oscuro">
                    Created by: <span>{tournament.creator_nickname ?? 'Jugador'}</span>
                </div>

                <div className="mt-3 flex items-center gap-2.5">
                    <button
                        type="button"
                        onClick={() => onSignUp(tournament, currentPlayers, safeMaxPlayers)}
                        disabled={isButtonDisabled}
                        className={[
                            "h-11 flex-1 rounded-xl text-[13px] leading-[19.5px] font-medium shadow-[0_4px_6px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.1)] transition-colors",
                            isJoined
                                ? "bg-[#E7E6E8] text-morado-lakers cursor-pointer"
                                : "bg-morado-lakers text-[#F3F2F3] cursor-pointer",
                            !isJoined && isFull ? "bg-[#D6D4D8] text-[#8A8690] cursor-not-allowed shadow-none" : "",
                        ].join(" ")}
                    >
                        {signUpLabel}
                    </button>
                    <button
                        type="button"
                        className="h-11 w-11 rounded-xl bg-[#E7E6E8] text-morado-lakers flex items-center justify-center cursor-pointer"
                        aria-label="Ver jugadores"
                    >
                        <LuUsers size={16} />
                    </button>
                    <button
                        type="button"
                        onClick={onReport}
                        className="h-11 w-11 rounded-xl border-[0.8px] border-amarillo-lakers/30 bg-amarillo-lakers/15 text-amarillo-lakers flex items-center justify-center cursor-pointer"
                        aria-label="Reportar evento"
                    >
                        <LuTriangle size={16} />
                    </button>
                </div>
            </div>
        </article>
    );
}