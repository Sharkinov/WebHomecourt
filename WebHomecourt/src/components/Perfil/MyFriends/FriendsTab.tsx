import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Friend } from '../../../lib/Perfil/friends';

const DEFAULT_AVATAR = 'https://ptbcoxaguvbwprxdundz.supabase.co/storage/v1/object/public/user_images/profile_picture_default.png';

type FriendsTabProps = {
  friends: Friend[];
  loading: boolean;
  onRemove: (friend: Friend) => void;
};

export default function FriendsTab({ friends, loading, onRemove }: FriendsTabProps) {
  const navigate = useNavigate();
  const [friendsFilter, setFriendsFilter] = useState('all');
  const [friendsSearchQuery, setFriendsSearchQuery] = useState('');

  // funcion para verificar si el usuario estuvo en linea recientemente (ultimas 24 horas)
  const wasOnlineRecently = (lastSeen: string | null | undefined): boolean => {
    if (!lastSeen) return false;
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const hoursDiff = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60 * 60);
    return hoursDiff <= 24; // ultimas 24 horas
  };

  // funcion para formatear "last active"
  const formatLastActive = (lastSeen: string | null | undefined): string => {
    if (!lastSeen) return 'Never';

    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffMs = now.getTime() - lastSeenDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;

    return lastSeenDate.toLocaleDateString();
  };

  // filtrar y ordenar amigos
  let filteredFriends = friends.filter(friend => {
    // aplicar filtro de busqueda
    const searchLower = friendsSearchQuery.toLowerCase().trim();
    if (searchLower) {
      const matchesNickname = friend.nickname.toLowerCase().includes(searchLower);
      const matchesUsername = friend.username.toLowerCase().includes(searchLower);
      if (!matchesNickname && !matchesUsername) return false;
    }

    if (friendsFilter === 'online') {
      return wasOnlineRecently(friend.last_seen);
    }

    return true;
  });

  // ordenar segun el filtro
  if (friendsFilter === 'recent') {
    filteredFriends = [...filteredFriends].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA; // mas reciente primero
    });
  }

  return (
    <div>
      {/*FILTEER*/}
      <div className="bg-white rounded-[15px] p-4 mb-6 flex items-center justify-between shadow-sm">
        <div className="relative">
          <select
            value={friendsFilter}
            onChange={(e) => setFriendsFilter(e.target.value)}
            className="bg-Background text-texto-oscuro px-6 py-2 pr-10 rounded-[10px] appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-morado-oscuro border-[2px] border-morado-bajo"
            style={{ fontFamily: 'Graphik' }}
          >
            <option value="all">All Friends</option>
            <option value="online">Online Recently</option>
            <option value="recent">Recently Added</option>
          </select>
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-texto-oscuro pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search friends"
            value={friendsSearchQuery}
            onChange={(e) => setFriendsSearchQuery(e.target.value)}
            className="bg-Background text-texto-oscuro px-5 py-2 rounded-[10px] placeholder:text-morado-bajo focus:outline-none focus:ring-2 focus:ring-morado-oscuro border-[2px] border-morado-bajo"
            style={{ fontFamily: 'Graphik' }}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-morado-lakers"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFriends.map((friend) => (
            <div
              key={friend.user_id}
              className="bg-white rounded-[15px] p-6 flex items-center justify-between shadow-sm"
            >
              <div
                className="flex items-center gap-4 flex-1 cursor-pointer"
                onClick={() => navigate(`/perfil/${friend.user_id}`)}
              >
                <img
                  src={friend.photo_url || DEFAULT_AVATAR}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover"
                />
                <div>
                  <h4 className="text-texto-oscuro text-sm font-medium mb-1" style={{ fontFamily: 'Graphik' }}>
                    {friend.nickname}
                  </h4>
                  <p className="text-texto-oscuro text-xs mb-2" style={{ fontFamily: 'Graphik' }}>
                    @{friend.username}
                  </p>
                  <p className="text-Gris-Oscuro text-xs" style={{ fontFamily: 'Graphik' }}>
                    Last active: {formatLastActive(friend.last_seen)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onRemove(friend)}
                className="px-8 py-3 bg-rojo-error border-[3px] border-rojo-error text-white hover:bg-rojo-error-hover rounded-[15px] transition-all"
                style={{ fontFamily: 'Graphik' }}
              >
                Remove
              </button>
            </div>
          ))}

          {friends.length === 0 && (
            <div
              className="text-center py-12 text-Gris-Oscuro"
              style={{ fontFamily: 'Graphik' }}
            >
              You don't have any friends yet. Start adding some!
            </div>
          )}

          {friends.length > 0 && filteredFriends.length === 0 && (
            <div
              className="text-center py-12 text-Gris-Oscuro"
              style={{ fontFamily: 'Graphik' }}
            >
              {friendsSearchQuery
                ? `No friends found matching "${friendsSearchQuery}"`
                : friendsFilter === 'online'
                ? "No friends online recently"
                : "No friends found"
              }
            </div>
          )}
        </div>
      )}
    </div>
  );
}
