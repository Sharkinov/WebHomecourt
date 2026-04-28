import { useEffect, useMemo, useState } from "react";
import { LuPlus, LuSearch} from "react-icons/lu";
import { getCourts, type Court } from "../../services/apiMAP";
import {getCourtTournaments,getCurrentUserJoinedEventIds,getSkillLevels,leaveTournament,signUpTournament,type CourtTournament,type SkillLevel,} from "../../services/apiEvents";
import { useCourtTournamentFilters } from "../../hooks/useCourtTournamentFilters";
import { useAuth } from "../../hooks/Perfil/useAuth";
import CrearEvento from "./CreateEvent";
import ReportEventPopUp from "./ReportEvent";
import StatusAlert from "../Messages/StatusAlert";
import TournamentCard from "./TournamentCard";

interface CourtTournamentsProps {
  selectedCourtId: number | null;
}



export default function CourtTournaments({ selectedCourtId }: CourtTournamentsProps) {
  useAuth();
  const [tournaments, setTournaments] = useState<CourtTournament[]>([]);
  const [reportEventTarget, setReportEventTarget] = useState<{ id: number; name: string } | null>(null)
  const [courts, setCourts] = useState<Court[]>([]);
  const [skillLevels, setSkillLevels] = useState<SkillLevel[]>([]);
  const [open, SetOpen] = useState<boolean>(false)
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

  const filters = useCourtTournamentFilters({
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
                    left: `${filters.minThumbPercent}%`,
                    right: `${100 - filters.maxThumbPercent}%`,
                  }}
                />

                <input
                  type="range"
                  min={filters.minAvailableAge}
                  max={filters.maxAvailableAge}
                  value={filters.currentMinAge}
                  disabled={tournaments.length === 0}
                  onChange={(event) => {
                    const nextValue = Number(event.target.value);
                    filters.setSelectedMinAge(Math.min(nextValue, filters.currentMaxAge));
                  }}
                  className="pointer-events-none absolute left-0 top-0 h-6 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[1.6px] [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-morado-lakers [&::-webkit-slider-thumb]:shadow-[0_4px_6px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.1)] [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[1.6px] [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-morado-lakers"
                />

                <input
                  type="range"
                  min={filters.minAvailableAge}
                  max={filters.maxAvailableAge}
                  value={filters.currentMaxAge}
                  disabled={tournaments.length === 0}
                  onChange={(event) => {
                    const nextValue = Number(event.target.value);
                    filters.setSelectedMaxAge(Math.max(nextValue, filters.currentMinAge));
                  }}
                  className="pointer-events-none absolute left-0 top-0 h-6 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[1.6px] [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-morado-lakers [&::-webkit-slider-thumb]:shadow-[0_4px_6px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.1)] [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[1.6px] [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-morado-lakers"
                />
              </div>

              <p className="text-[13px] leading-[19.5px] text-[#11061A] whitespace-nowrap">{`${filters.currentMinAge ?? '0'} - ${filters.currentMaxAge ?? '-'}`}</p>
            </div>
          </div>

          <div className="bg-Background rounded-xl px-4 pt-3 pb-2.5">
            <p className="text-[12px] leading-4.5 font-medium text-Gris-Oscuro">Skill Level</p>
            <div className="mt-1 flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {filters.skillFilterOptions.map((skillOption) => {
                const isActive = filters.skillLevelFilter === skillOption.value;

                return (
                  <button
                    key={skillOption.value}
                    type="button"
                    onClick={() => filters.setSkillLevelFilter(skillOption.value)}
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
          <CrearEvento open={open} onClose={() => SetOpen(false)}></CrearEvento>

          <label className="relative block h-11.25 w-full max-w-md">
            <LuSearch
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(17,6,26,0.5)]"
            />
            <input
              type="text"
              placeholder="Search courts, events..."
              value={filters.searchValue}
              onChange={(event) => filters.setSearchValue(event.target.value)}
              className="h-full w-full rounded-2xl border-[0.8px] border-[#E7E6E8] bg-white pl-10 pr-4 text-[16px] text-[#11061A] outline-none"
            />
          </label>

          {selectedCourtId !== null ? (
            <div className="text-[13px] leading-[19.5px] text-Gris-Oscuro">
              Mostrando torneos de <span className="text-morado-lakers">{selectedCourtName}</span>
            </div>
          ) : null}

          {actionError && <StatusAlert tone="error" title={actionError} />}

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

            {!loading && !loadError && filters.filteredTournaments.length === 0 ? (
              <div className="h-full min-h-62.5 rounded-[14px] border-[0.8px] border-[#E7E6E8] bg-Background flex items-center justify-center">
                <div className="text-Gris-Oscuro text-base font-semibold">
                  {selectedCourtId === null
                    ? "Inicia sesion para ver los torneos"
                    : `No hay torneos para ${selectedCourtName}`}
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-5 gap-y-3.75 pr-1 pb-1">
              {filters.filteredTournaments.map((tournament) => (
                <TournamentCard
                  key={tournament.event_id}
                  tournament={tournament}
                  courtName={courtNamesById.get(tournament.court_id) ?? `Cancha ${tournament.court_id}`}
                  isJoined={joinedEventIds.has(tournament.event_id)}
                  isSubmitting={submittingEventId === tournament.event_id}
                  getSkillLabel={filters.getSkillLabel}
                  onSignUp={handleToggleSignUp}
                  onReport={() => setReportEventTarget({ id: tournament.event_id, name: tournament.event_name })}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
      {reportEventTarget && (
        <ReportEventPopUp
          eventId={reportEventTarget.id}
          eventName={reportEventTarget.name}
          onClose={() => setReportEventTarget(null)}
        />
      )}
    </div>
  );
}
