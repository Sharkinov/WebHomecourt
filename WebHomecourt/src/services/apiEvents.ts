import { supabase } from "../lib/supabase";

export interface CourtTournament {
  event_id: number; // ID unico del evento.
  event_name: string; // Nombre del evento.
  date: string | null; // Fecha/hora del evento (puede venir null).
  women_only: boolean;
  created_user_id: string; // Usuario que creo el evento.
  creator_nickname: string;
  court_id: number; // ID de la cancha.
  max_players: number; // Cupo maximo permitido.
  current_players: number; // Jugadores inscritos actualmente.
  min_age: number; // Edad minima permitida.
  max_age: number; // Edad maxima permitida.
  skill_level_id: number | null; // Nivel de skill requerido (o null).
  allow_event: boolean; // Bandera para mostrar/ocultar evento.
}


export interface SkillLevel {
  skill_level_id: number; // ID del nivel.
  description: string; // Texto del nivel (ej. Beginner, Intermediate).
}


interface UserEventRow {
  event_id: number | string | null;
}

interface UserEventMembershipRow {
  user_event_id: number; // PK de la fila en user_event.
  rated_others: boolean | null; // Estado de si ya califico a otros jugadores.
}

type SkillLevelRow = {
  skill_level_id: number | string; // Puede llegar string desde BD.
  description: string; // Etiqueta del nivel.
};

// Obtiene el user.id autenticado para operaciones de inscripcion/baja.
async function getCurrentUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.id) {
    throw new Error("No se pudo obtener el usuario actual");
  }

  return user.id;
}

//Pase la logica que tenia de que primero llama event y ya con ese envio para ver los jugadores, lo hace en supabase
//Se hace un selesvcet basciamente de todo event y count de user_event_id pa sabaer cuentos usuarios estan inscritos
//COn el left join se traer todo
export async function getCourtTournaments(): Promise<CourtTournament[]> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase.rpc("get_available_events", {
    p_user_id: userId ?? null
  });

  if (error) {
    throw new Error("No se pudieron cargar los torneos");
  }

  return (data ?? []).filter((row: any) => row.court_id != null && !Number.isNaN(row.court_id));
}

export async function getSkillLevels(): Promise<SkillLevel[]> {
  const { data, error } = await supabase
    .from("skill_level")
    .select("skill_level_id, description")
    .order("skill_level_id", { ascending: true });

  if (error) {
    throw new Error("No se pudieron cargar los niveles de habilidad");
  }

  return ((data ?? []) as SkillLevelRow[])
    .map((row) => ({
      skill_level_id: Number(row.skill_level_id),
      description: row.description,
    }))
    .filter((row) => !Number.isNaN(row.skill_level_id));
}

// Obtiene IDs de eventos donde el usuario actual ya esta inscrito.
export async function getCurrentUserJoinedEventIds(eventIds: number[]): Promise<Set<number>> {
  if (eventIds.length === 0) {
    return new Set<number>();
  }

  // Lee usuario autenticado para filtrar solo sus inscripciones.
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.id) {
    return new Set<number>();
  }

  // Busca en user_event solo filas del usuario y de los eventos visibles.
  const { data, error } = await supabase
    .from("user_event")
    .select("event_id")
    .eq("user_id", user.id)
    .in("event_id", eventIds);

  if (error) {
    throw new Error("No se pudo cargar tus inscripciones");
  }

  const joinedEventIds = new Set<number>();
  ((data ?? []) as UserEventRow[]).forEach((row) => {
    const eventId = Number(row.event_id);
    if (!Number.isNaN(eventId)) {
      joinedEventIds.add(eventId);
    }
  });

  // Retorna el conjunto final de eventos inscritos por el usuario.
  return joinedEventIds;
}

// Inscribe al usuario actual en un evento si aun no existe su fila en user_event.
export async function signUpTournament(eventId: number): Promise<void> {
  const userId = await getCurrentUserId();

  // Busca si ya existe una inscripcion previa para evitar duplicados.
  const { data: membershipData, error: membershipError } = await supabase
    .from("user_event")
    .select("user_event_id, rated_others")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    throw new Error(`No se pudo verificar tu inscripcion: ${membershipError.message}`);
  }

  const membership = membershipData as UserEventMembershipRow | null;
  if (membership) {
    // Si venia marcado como true, se reinicia a false para un nuevo flujo de juego/rating.
    if (membership.rated_others) {
      const { error: updateError } = await supabase
        .from("user_event")
        .update({ rated_others: false })
        .eq("user_event_id", membership.user_event_id);

      if (updateError) {
        throw new Error(`No se pudo actualizar tu inscripcion: ${updateError.message}`);
      }
    }

    return;
  }

  // Inserta nueva inscripcion en user_event para este usuario y evento.
  const { error: insertError } = await supabase.from("user_event").insert({
    event_id: eventId,
    user_id: userId,
    rated_others: false,
  });

  if (insertError) {
    throw new Error(`No se pudo inscribir al evento: ${insertError.message}`);
  }
}

// Quita la inscripcion del usuario actual en el evento indicado.
export async function leaveTournament(eventId: number): Promise<void> {
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from("user_event")
    .delete()
    .eq("event_id", eventId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`No se pudo cancelar tu inscripcion: ${error.message}`);
  }
}
