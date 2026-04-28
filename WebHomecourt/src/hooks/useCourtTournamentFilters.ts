import { useEffect, useState } from "react";
import type { CourtTournament, SkillLevel } from "../services/apiEvents";

export interface SkillFilterOption {
  value: string;
  label: string;
}

interface UseCourtTournamentFiltersParams {
  tournaments: CourtTournament[];
  selectedCourtId: number | null;
  courtNamesById: Map<number, string>;
  skillLevels: SkillLevel[];
}

function normalizeSkillLevelLabel(value: string): string {
  // Corrige variantes con typo desde BD 
  return value.trim().replace(/begginer/i, "Beginner");
}

function getAvailableAgeRange(tournaments: CourtTournament[]): { min: number; max: number } {
  // Obtiene los limites globales de edad usados por el slider  rango
  if (tournaments.length === 0) {
    return { min: 0, max: 0 };
  }

  let min = tournaments[0].min_age;
  let max = tournaments[0].max_age;

  for (const tournament of tournaments) {
    if (tournament.min_age < min) min = tournament.min_age;
    if (tournament.max_age > max) max = tournament.max_age;
  }

  return { min, max };
}

export function useCourtTournamentFilters({
  tournaments,
  selectedCourtId,
  courtNamesById,
  skillLevels,
}: UseCourtTournamentFiltersParams) {
  const [searchValue, setSearchValue] = useState("");
  const [selectedMinAge, setSelectedMinAge] = useState(0);
  const [selectedMaxAge, setSelectedMaxAge] = useState(0);
  const [skillLevelFilter, setSkillLevelFilter] = useState("all");

  const { min: minAvailableAge, max: maxAvailableAge } = getAvailableAgeRange(tournaments);

  useEffect(() => {
    // Reinicia los valores del slider cuando cambia el rango disponible
    setSelectedMinAge(minAvailableAge);
    setSelectedMaxAge(maxAvailableAge);
  }, [minAvailableAge, maxAvailableAge]);

  const ageSpan = Math.max(1, maxAvailableAge - minAvailableAge);
  const minThumbPercent = ((selectedMinAge - minAvailableAge) / ageSpan) * 100;
  const maxThumbPercent = ((selectedMaxAge - minAvailableAge) / ageSpan) * 100;

  const usedSkillIds = new Set<number>();
  for (const tournament of tournaments) {
    if (tournament.skill_level_id !== null) {
      usedSkillIds.add(tournament.skill_level_id);
    }
  }

  // Construye  solo para niveles de skill presentes en los torneos actuales
  const skillFilterOptions: SkillFilterOption[] = [{ value: "all", label: "All" }];
  for (const skillLevel of skillLevels) {
    if (!usedSkillIds.has(skillLevel.skill_level_id)) continue;

    skillFilterOptions.push({
      value: String(skillLevel.skill_level_id),
      label: normalizeSkillLevelLabel(skillLevel.description),
    });
  }

  // Aplica filtros de cancha, edad, skill y texto 
  const searchTerm = searchValue.trim().toLowerCase();
  const filteredTournaments = tournaments.filter((tournament) => {
    if (selectedCourtId !== null && tournament.court_id !== selectedCourtId) {
      return false;
    }

    if (tournament.min_age < selectedMinAge || tournament.max_age > selectedMaxAge) {
      return false;
    }

    if (skillLevelFilter !== "all" && tournament.skill_level_id !== Number(skillLevelFilter)) {
      return false;
    }

    if (searchTerm.length === 0) {
      return true;
    }

    const tournamentName = tournament.event_name.toLowerCase();
    const courtName = (courtNamesById.get(tournament.court_id) ?? "").toLowerCase();

    return tournamentName.includes(searchTerm) || courtName.includes(searchTerm);
  });

  // Convierte ids de skill a una etiqueta cada card de evento.
  const getSkillLabel = (skillLevelId: number | null): string => {
    if (skillLevelId === null) return "All";

    const skillLevel = skillLevels.find((item) => item.skill_level_id === skillLevelId);
    if (!skillLevel) return `Level ${skillLevelId}`;

    return normalizeSkillLevelLabel(skillLevel.description);
  };

  return {
    searchValue,
    setSearchValue,
    setSelectedMinAge,
    setSelectedMaxAge,
    skillLevelFilter,
    setSkillLevelFilter,
    minAvailableAge,
    maxAvailableAge,
    currentMinAge: selectedMinAge,
    currentMaxAge: selectedMaxAge,
    minThumbPercent,
    maxThumbPercent,
    skillFilterOptions,
    filteredTournaments,
    getSkillLabel,
  };
}
