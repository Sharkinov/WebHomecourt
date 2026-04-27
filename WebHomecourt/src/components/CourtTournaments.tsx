import { useEffect, useMemo, useState } from "react";
import { LuMapPin, LuPlus, LuSearch, LuTriangle, LuUsers } from "react-icons/lu";
import { getCourts, type Court } from "../services/apiMAP";
import {
  getCourtTournaments,
  getCurrentUserJoinedEventIds,
  getSkillLevels,
  leaveTournament,
  signUpTournament,
  type CourtTournament,
  type SkillLevel,
} from "../services/apiEvents";
import { useCourtTournamentFilters } from "../hooks/useCourtTournamentFilters";
import { useAuth } from "../context/AuthContext";
import CrearEvento from "./CreateEvent";


interface CourtTournamentsProps {
  selectedCourtId: number | null;
}

interface TournamentDateParts {
  dateLabel: string;
  timeLabel: string;
}

function formatTournamentDateParts(value: string | null): TournamentDateParts {
  if (!value) {
    return {
      dateLabel: "Por definir",
      timeLabel: "--:--",
    };
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return {
      dateLabel: "Por definir",
      timeLabel: "--:--",
    };
  }

  const dateLabelRaw = new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
  }).format(parsedDate);

  return {
    dateLabel: dateLabelRaw.replace(".", ""),
    timeLabel: value.includes("T")
      ? new Intl.DateTimeFormat("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(parsedDate)
      : "--:--",
  };
}

function formatCreatorLabel(userId: string): string {
  if (!userId) return "Usuario";
  return `Usuario${userId.slice(0, 5)}`;
}

export default function CourtTournaments({ selectedCourtId }: CourtTournamentsProps) {
  useAuth();
  const [tournaments, setTournaments] = useState<CourtTournament[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [skillLevels, setSkillLevels] = useState<SkillLevel[]>([]);
  const [open,SetOpen] = useState<boolean>(false)
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [joinedEventIds, setJoinedEventIds] = useState<Set<number>>(new Set());
  const [submittingEventId, setSubmittingEventId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTournamentData() {
      setLoading(true);
      setLoadError(null);
      setActionError(null);

      try {
        const [eventsData, courtsData, skillLevelsData] = await Promise.all([
          getCourtTournaments(),
          getCourts(),
          getSkillLevels(),
        ]);

        if (cancelled) return;

        setTournaments(eventsData);
        setCourts(courtsData ?? []);
        setSkillLevels(skillLevelsData);

        try {
          const joinedIds = await getCurrentUserJoinedEventIds(
            eventsData.map((event) => event.event_id)
          );

          if (!cancelled) {
            setJoinedEventIds(joinedIds);
          }
        } catch {
          if (!cancelled) {
            setJoinedEventIds(new Set());
          }
        }
      } catch (loadError) {
        if (!cancelled) {
          setTournaments([]);
          setCourts([]);
          setSkillLevels([]);
          setJoinedEventIds(new Set());
          setLoadError(loadError instanceof Error ? loadError.message : "No se pudieron cargar los torneos");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTournamentData();

    return () => {
      cancelled = true;
    };
  }, []);

  const courtNamesById = useMemo(
    () =>
      new Map<number, string>(
        courts.map((court) => [court.court_id, court.name])
      ),
    [courts]
  );

  const {
    searchValue,
    setSearchValue,
    setSelectedMinAge,
    setSelectedMaxAge,
    skillLevelFilter,
    setSkillLevelFilter,
    minAvailableAge,
    maxAvailableAge,
    currentMinAge,
    currentMaxAge,
    minThumbPercent,
    maxThumbPercent,
    skillFilterOptions,
    filteredTournaments,
    getSkillLabel,
  } = useCourtTournamentFilters({
    tournaments,
    selectedCourtId,
    courtNamesById,
    skillLevels,
  });

  const selectedCourtName =
    selectedCourtId === null
      ? "Todas las canchas"
      : courtNamesById.get(selectedCourtId) ?? `Cancha ${selectedCourtId}`;

  const handleToggleSignUp = async (
    tournament: CourtTournament,
    currentPlayers: number,
    safeMaxPlayers: number
  ) => {
    const eventId = tournament.event_id;
    const isJoined = joinedEventIds.has(eventId);
    const isFull = safeMaxPlayers === 0 || currentPlayers >= safeMaxPlayers;

    if (!isJoined && isFull) {
      setActionError("Este evento ya esta lleno");
      return;
    }

    setSubmittingEventId(eventId);
    setActionError(null);

    try {
      if (isJoined) {
        await leaveTournament(eventId);
        setJoinedEventIds((prev) => {
          const next = new Set(prev);
          next.delete(eventId);
          return next;
        });

        setTournaments((prev) =>
          prev.map((item) =>
            item.event_id === eventId
              ? { ...item, current_players: Math.max(0, item.current_players - 1) }
              : item
          )
        );

        return;
      }

      await signUpTournament(eventId);
      setJoinedEventIds((prev) => {
        const next = new Set(prev);
        next.add(eventId);
        return next;
      });

      setTournaments((prev) =>
        prev.map((item) =>
          item.event_id === eventId
            ? {
                ...item,
                current_players:
                  item.max_players > 0
                    ? Math.min(item.max_players, item.current_players + 1)
                    : item.current_players + 1,
              }
            : item
        )
      );
    } catch (toggleError) {
      setActionError(
        toggleError instanceof Error
          ? toggleError.message
          : "No se pudo actualizar la inscripcion en el evento"
      );
    } finally {
      setSubmittingEventId(null);
    }
  };

  return (
    <div className="w-full max-w-313.75 mx-auto flex flex-col gap-3.75">
      <div className="w-full rounded-[15px] border-[0.8px] border-black/8 bg-white px-[24.8px] pt-[16.8px] pb-5 shadow-[0_4px_4px_rgba(0,0,0,0.08)]">
        <p className="text-[14px] leading-5.25 text-[#11061A]">Filters</p>

        <div className="mt-3 grid grid-cols-1 xl:grid-cols-2 gap-3">
          <div className="bg-Background rounded-xl px-4 pt-3 pb-2.5">
            <p className="text-[12px] leading-4.5 font-medium text-Gris-Oscuro">Age Range</p>

            <div className="mt-1 flex items-center gap-3">
              <div className="relative h-6 flex-1">
                <div className="absolute left-0 right-0 top-2.25 h-1.5 rounded-full bg-[#E7E6E8]" />
                <div
                  className="absolute top-2.25 h-1.5 rounded-full bg-morado-lakers"
                  style={{
                    left: `${minThumbPercent}%`,
                    right: `${100 - maxThumbPercent}%`,
                  }}
                />

                <input
                  type="range"
                  min={minAvailableAge}
                  max={maxAvailableAge}
                  value={currentMinAge}
                  disabled={tournaments.length === 0}
                  onChange={(event) => {
                    const nextValue = Number(event.target.value);
                    setSelectedMinAge(Math.min(nextValue, currentMaxAge));
                  }}
                  className="pointer-events-none absolute left-0 top-0 h-6 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[1.6px] [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-morado-lakers [&::-webkit-slider-thumb]:shadow-[0_4px_6px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.1)] [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[1.6px] [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-morado-lakers"
                />

                <input
                  type="range"
                  min={minAvailableAge}
                  max={maxAvailableAge}
                  value={currentMaxAge}
                  disabled={tournaments.length === 0}
                  onChange={(event) => {
                    const nextValue = Number(event.target.value);
                    setSelectedMaxAge(Math.max(nextValue, currentMinAge));
                  }}
                  className="pointer-events-none absolute left-0 top-0 h-6 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[1.6px] [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-morado-lakers [&::-webkit-slider-thumb]:shadow-[0_4px_6px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.1)] [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[1.6px] [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-morado-lakers"
                />
              </div>

              <p className="text-[13px] leading-[19.5px] text-[#11061A] whitespace-nowrap">{`${currentMinAge ?? '0'} - ${currentMaxAge ?? '-'}`}</p>
            </div>
          </div>

          <div className="bg-Background rounded-xl px-4 pt-3 pb-2.5">
            <p className="text-[12px] leading-4.5 font-medium text-Gris-Oscuro">Skill Level</p>
            <div className="mt-1 flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {skillFilterOptions.map((skillOption) => {
                const isActive = skillLevelFilter === skillOption.value;

                return (
                  <button
                    key={skillOption.value}
                    type="button"
                    onClick={() => setSkillLevelFilter(skillOption.value)}
                    className={[
                      "h-6.5 rounded-lg px-3 text-[12px] leading-4.5 font-medium whitespace-nowrap",
                      isActive
                        ? "bg-morado-lakers text-[#F3F2F3]"
                        : "bg-[#E7E6E8] text-Gris-Oscuro",
                    ].join(" ")}
                  >
                    {skillOption.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <section className="w-full h-166.75 flex flex-col">
        <header className="bg-morado-oscuro rounded-t-[15px] h-20 px-6 py-0 flex items-center">
          <div className="w-full flex items-center justify-between gap-4">
            <div className="text-[#F3F2F3] text-[20px] leading-7.5 font-normal text-left">
              Available Events
            </div>
            <button
              type="button"
              onClick={() => SetOpen(true)}
              className="h-10.25 w-49.25 rounded-xl bg-amarillo-lakers text-[#11061A] text-[14px] font-medium flex items-center justify-center gap-2.5 shadow-[0_4px_6px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.1)] cursor-pointer"
            >
              <LuPlus size={16} />
              CREATE NEW EVENT
            </button>
          </div>
        </header>

        <div className="bg-white border-[0.8px] border-black/8 rounded-b-[15px] px-6 py-3.75 flex-1 min-h-0 flex flex-col gap-3.75">
        <CrearEvento open={open} onClose={()=> SetOpen(false)}></CrearEvento>

        <label className="relative block h-11.25 w-full max-w-md">
          <LuSearch
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(17,6,26,0.5)]"
          />
          <input
            type="text"
            placeholder="Search courts, events..."
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            className="h-full w-full rounded-2xl border-[0.8px] border-[#E7E6E8] bg-white pl-10 pr-4 text-[16px] text-[#11061A] outline-none"
          />
        </label>

      {selectedCourtId !== null ? (
        <div className="text-[13px] leading-[19.5px] text-Gris-Oscuro">
          Mostrando torneos de <span className="text-morado-lakers">{selectedCourtName}</span>
        </div>
      ) : null}

      {actionError ? (
        <div className="text-[13px] leading-[19.5px] text-red-600">{actionError}</div>
      ) : null}

      <div className="flex-1 min-h-0 overflow-y-auto">
        {loading ? (
          <div className="h-full min-h-62.5 rounded-[14px] border-[0.8px] border-[#E7E6E8] bg-Background flex items-center justify-center">
            <div className="text-morado-lakers text-base font-semibold">Cargando torneos...</div>
          </div>
        ) : null}

        {!loading && loadError ? (
          <div className="h-full min-h-62.5 rounded-[14px] border-[0.8px] border-[#E7E6E8] bg-Background flex items-center justify-center">
            <div className="text-red-600 text-base font-semibold">{loadError}</div>
          </div>
        ) : null}

        {!loading && !loadError && filteredTournaments.length === 0 ? (
          <div className="h-full min-h-62.5 rounded-[14px] border-[0.8px] border-[#E7E6E8] bg-Background flex items-center justify-center">
            <div className="text-Gris-Oscuro text-base font-semibold">
              {selectedCourtId === null
                ? "Inicia sesion pra ver los torneos"
                : `No hay torneos para ${selectedCourtName}`}
            </div>
          </div>
        ) : null}

        {!loading && !loadError && filteredTournaments.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-5 gap-y-3.75 pr-1 pb-1">
            {filteredTournaments.map((tournament) => {
              const courtName = courtNamesById.get(tournament.court_id) ?? `Cancha ${tournament.court_id}`;
              const { dateLabel, timeLabel } = formatTournamentDateParts(tournament.date);
              const safeMaxPlayers = Math.max(0, tournament.max_players);
              const currentPlayers = Math.min(tournament.current_players, safeMaxPlayers);
              const fillPercent =
                safeMaxPlayers > 0 ? Math.min(100, (currentPlayers / safeMaxPlayers) * 100) : 0;
              const isJoined = joinedEventIds.has(tournament.event_id);
              const isSubmitting = submittingEventId === tournament.event_id;
              const isFull = safeMaxPlayers === 0 || currentPlayers >= safeMaxPlayers;
              const isButtonDisabled = isSubmitting || (!isJoined && isFull);
              const signUpLabel = isSubmitting
                ? "..."
                : isJoined
                ? "UNSUBSCRIBE"
                : isFull
                ? "FULL"
                : "SIGN UP";

              return (
                <article
                  key={tournament.event_id}
                  className="min-h-62.5 rounded-[14px] bg-Background border-[0.8px] border-transparent px-5 pt-5 pb-5.25"
                >
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
                      Age: <span className="text-morado-lakers">{`${tournament.min_age}-${tournament.max_age}`}</span> | Skill level: <span className="text-morado-lakers">{getSkillLabel(tournament.skill_level_id)}</span>
                    </div>

                    <div className="mt-3 border-b-[0.8px] border-[#E7E6E8] pb-3 text-[12px] leading-4.5 text-Gris-Oscuro">
                      Created by: <span className="text-morado-lakers">{formatCreatorLabel(tournament.created_user_id)}</span>
                    </div>

                    <div className="mt-3 flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleToggleSignUp(tournament, currentPlayers, safeMaxPlayers)}
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
                        className="h-11 w-11 rounded-xl border-[0.8px] border-amarillo-lakers/30 bg-amarillo-lakers/15 text-amarillo-lakers flex items-center justify-center cursor-pointer"
                        aria-label="Reportar evento"
                      >
                        <LuTriangle size={16} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
        </div>
      </div>
      </section>
    </div>
  );
}
