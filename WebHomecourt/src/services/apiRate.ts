import { supabase } from '../lib/supabase'


//Pa el frnt
export type RatePlayer = {
  id: string
  avatarUrl: string
  playerName: string
  playerTag: string
  initialRating: number
}

// Pa guardar los raitinds en lo que en lo que se envuian
export type PendingRateResponse = {
  userEventId: number
  eventId: number
  eventName: string | null
  eventDate: string | null
  courtName: string | null
  courtDirection: string | null
  players: RatePlayer[]
}

// Llama a getpandiong raiting para ver  si falta uno y ve cuakes faltan por calificar del evento. 
export async function getPendingRatingPlayers(): Promise<PendingRateResponse | null> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user?.id) throw new Error('');

  const { data, error } = await supabase.rpc('get_pending_rating_full', {
    p_user_id: user.id,
  });

  if (error) throw new Error('No se pudo verificar si tienes calificaciones pendientes');
  if (!data) return null;

  return {
    userEventId: data.user_event_id,
    eventId:     data.event_id,
    eventName:   data.event_name,
    eventDate:   data.event_date,
    courtName:   data.court_name,
    courtDirection: data.court_direction,
    players: (data.players ?? []).map((p: any) => ({
      id:            p.user_id,
      avatarUrl:     p.photo_url || null,
      playerName:    p.nickname || p.username || 'Jugador',
      playerTag:     `@${p.username || 'sin_usuario'}`,
      initialRating: 0,
    })),
  };
}

export async function saveUserEventRating(
  userEventId: number,
  ratedUserId: string,
  rating: number
): Promise<void> {
  const { error } = await supabase.from('user_event_ratings').upsert(
    {
      user_event_id: userEventId,
      rated_user_id: ratedUserId,
      rating,
    },
    {
      onConflict: 'user_event_id,rated_user_id',
      ignoreDuplicates: true,
    }
  )

  if (error) {
    throw new Error('No se pudo guardar la calificacion')
  }
}

export async function markUserEventAsRated(userEventId: number): Promise<void> {
  const { error } = await supabase
    .from('user_event')
    .update({ rated_others: true })
    .eq('user_event_id', userEventId)

  if (error) {
    throw new Error(`No se pudo actualizar rated_others: ${error.message}`)
  }
}
