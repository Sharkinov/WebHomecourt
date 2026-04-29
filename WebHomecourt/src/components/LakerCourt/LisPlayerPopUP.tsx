import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import StatusAlert from "../Messages/StatusAlert";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface EventPlayer {
  user_id: string;
  username: string | null;
  nickname: string | null;
  photo_url: string | null;
  gender_label: string  | null;
  age: number | null;
  reputation: number | null;
}

interface ListPlayerPopUpProps {
  eventId: number;
  eventName: string;
  eventLocation: string;
  eventDate: string;
  eventTime: string;
  spotsAvailable: string;
  onClose: () => void;
}



// ─── Componente ───────────────────────────────────────────────────────────────

export default function ListPlayerPopUp({
  eventId,
  eventName,
  eventLocation,
  eventDate,
  eventTime,
  spotsAvailable,
  onClose,
}: ListPlayerPopUpProps) {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<EventPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchPlayers = async () => {
        setLoading(true);
        setError(null);
        const { data, error } = await supabase.rpc("get_event_players", { p_event_id: eventId });
        if (error) {
            setError("No se pudieron cargar los jugadores.");
        } else {
            setPlayers((data ?? []) as EventPlayer[]);
        }
        setLoading(false);
    };
    fetchPlayers();
}, [eventId]);

  // Bloquear scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-[20px] bg-white shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-6 py-6 bg-morado-oscuro">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-2xl font-bold text-white">{eventName}</h2>
              <div className="flex items-center gap-3 mt-2 text-sm text-purple-200 flex-wrap">
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{eventLocation}</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{eventDate}</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{eventTime}</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-white/10 p-1.5 text-white hover:bg-white/20 transition-colors shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Registered Players</h3>
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-morado-lakers text-white">
              {spotsAvailable} spots
            </span>
          </div>

          {/* {loading && (
            <div className="flex items-center justify-center py-8">
              <svg className="w-6 h-6 animate-spin text-morado-lakers" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )} */}

          {/* Error */}
          {!loading && error && (
            <StatusAlert tone="error" title={error} />
          )}

          {/* Empty */}
          {!loading && !error && players.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-6">
              No hay jugadores inscritos aún.
            </p>
          )}

          {/* Players list */}
          {!loading && !error && players.length > 0 && (
            <div className="space-y-3">
              {players.map((player) => {
                const displayName = player.username ?? player.nickname ?? "Jugador";
                const reputation = player.reputation ?? 0;
                const fullStars = Math.floor(reputation);

                return (
                  <div
                    key={player.user_id}
                    onClick={() => navigate(`/perfil/${player.user_id}`)}
                    className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    {/* Avatar */}
                    <div className="shrink-0">
                      {player.photo_url ? (
                        <img
                          src={player.photo_url}
                          alt={displayName}
                          className="w-14 h-14 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-morado-lakers/20 flex items-center justify-center text-morado-lakers font-bold text-xl">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">{displayName}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        {player.age && <span>Age: {player.age}</span>}
                        <span>Gender: {player.gender_label ?? "—"}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1.5">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${i < fullStars ? "text-yellow-400 fill-current" : "text-gray-300 fill-current"}`}
                            viewBox="0 0 20 20"
                          >
                            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                          </svg>
                        ))}
                        <span className="ml-1 text-gray-700 font-medium text-sm">
                          {reputation > 0 ? reputation.toFixed(1) : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer — solo Close */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-700 text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}