import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileButton from '../ProfileButton';
import { searchUsers, type UserSearchResult } from '../../../lib/Perfil/friends';

const DEFAULT_AVATAR = 'https://ptbcoxaguvbwprxdundz.supabase.co/storage/v1/object/public/user_images/profile_picture_default.png';

type AddFriendTabProps = {
  pendingRequest?: { userId: string; nickname: string };
  showConfirmation: boolean;
  requestSent: boolean;
  sendingRequest: boolean;
  sendError: string | null;
  onSendRequest: () => Promise<void>;
};

export default function AddFriendTab({
  pendingRequest,
  showConfirmation,
  requestSent,
  sendingRequest,
  sendError,
  onSendRequest
}: AddFriendTabProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    setHasSearched(true);
    const results = await searchUsers(searchQuery);
    setSearchResults(results);
    setSearching(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (requestSent) {
    //EXITO
    return (
      <div className="bg-white rounded-[15px] p-10">
        <div className="py-4 text-center">
          <p className="text-texto-oscuro text-[18px] mb-3" style={{ fontFamily: 'Graphik' }}>
            You have successfully sent <strong>{pendingRequest?.nickname}</strong> a friend request.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate(`/perfil/${pendingRequest?.userId}`)}
              className="text-morado-oscuro hover:text-morado-hover underline text-[16px]"
              style={{ fontFamily: 'Graphik' }}
            >
              View {pendingRequest?.nickname}'s Profile
            </button>
            <span className="text-Gris-Oscuro">-</span>
            <button
              onClick={() => navigate('/')}
              className="text-morado-oscuro hover:text-morado-hover underline text-[16px]"
              style={{ fontFamily: 'Graphik' }}
            >
              Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showConfirmation && pendingRequest) {
    //CONFIRMACION
    return (
      <div className="bg-white rounded-[15px] p-10">
        <h2
          style={{
            fontFamily: 'Graphik',
            fontSize: '20px',
            fontWeight: 500,
            lineHeight: '30px',
          }}
          className="text-texto-oscuro mb-4 pb-4 border-b border-morado-oscuro/20"
        >
          Send Friend Request to {pendingRequest.nickname}
        </h2>
        <p
          style={{
            fontFamily: 'Graphik',
            fontSize: '16px',
            fontWeight: 400,
            lineHeight: '24px',
          }}
          className="text-Gris-Oscuro mb-8"
        >
          Are you sure you want to request a friendship with <strong>{pendingRequest.nickname}</strong>?
        </p>
        {sendError && (
          <p className="text-rojo-error mb-4 text-sm" style={{ fontFamily: 'Graphik' }}>{sendError}</p>
        )}
        <div className="flex gap-4">
          <ProfileButton
            type={sendingRequest ? 'primarydisable' : 'secondary'}
            text={sendingRequest ? 'Sending...' : 'Yes, send friend request'}
            onClick={sendingRequest ? () => {} : onSendRequest}
          />
          <ProfileButton
            type="secondary"
            text="Cancel request"
            onClick={() => navigate(`/perfil/${pendingRequest.userId}`)}
          />
        </div>
      </div>
    );
  }

  //BUSQUEDA
  return (
    <div className="bg-white rounded-[15px]" style={{ padding: '40px' }}>
      <h2
        className="text-texto-oscuro mb-4 pb-4 border-b border-morado-oscuro/20"
        style={{
          color: '#11061A',
          fontFamily: 'Graphik',
          fontSize: '20px',
          fontWeight: 500,
          lineHeight: '30px'
        }}
      >
        Search for a Friend
      </h2>
      <p 
        className="mb-6"
        style={{
          color: '#6F6975',
          fontFamily: 'Graphik',
          fontSize: '16px',
          fontWeight: 400,
          lineHeight: '24px'
        }}
      >
        Enter the username or nickname of the person you would like to send a friend request to
      </p>
      <div className="flex gap-3 items-center mb-6">
        <div className="flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Username or nickname"
            className="w-full h-[51px] px-5 bg-Background border-[3px] border-morado-bajo rounded-[15px] text-texto-oscuro placeholder:text-morado-bajo/60 focus:outline-none focus:border-morado-oscuro"
            style={{ fontFamily: 'Graphik' }}
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={searching || !searchQuery.trim()}
          className="h-[51px] px-10 bg-morado-oscuro hover:bg-morado-hover text-white rounded-[15px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ fontFamily: 'Graphik' }}
        >
          {searching ? 'Searching...' : 'Find Friend'}
        </button>
      </div>

      {/*RESULTADO DE BUSQUEDA*/}
      {searching && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-morado-lakers"></div>
        </div>
      )}

      {!searching && hasSearched && searchResults.length === 0 && (
        <div className="text-center py-8 text-Gris-Oscuro" style={{ fontFamily: 'Graphik' }}>
          No users found matching "{searchQuery}"
        </div>
      )}

      {!searching && searchResults.length > 0 && (
        <div className="space-y-3">
          {searchResults.map((user) => (
            <div
              key={user.user_id}
              className="bg-Background rounded-[15px] p-4 flex items-center justify-between hover:bg-morado-bajo/10 transition-colors"
            >
              <div
                className="flex items-center gap-4 flex-1 cursor-pointer"
                onClick={() => navigate(`/perfil/${user.user_id}`)}
              >
                <img
                  src={user.photo_url || DEFAULT_AVATAR}
                  alt={user.nickname}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h4 className="text-texto-oscuro font-medium" style={{ fontFamily: 'Graphik' }}>
                    {user.nickname}
                  </h4>
                  <p className="text-Gris-Oscuro text-sm" style={{ fontFamily: 'Graphik' }}>
                    @{user.username}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate(`/perfil/${user.user_id}`)}
                className="px-6 py-2 bg-morado-oscuro hover:bg-morado-hover text-white rounded-[10px] transition-colors"
                style={{ fontFamily: 'Graphik' }}
              >
                View Profile
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
