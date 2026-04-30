import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Nav from '../components/Nav/Nav';
import ProfileButton from '../components/Perfil/ProfileButton';
import { useAuth } from '../context/AuthContext';
import { getFriendsList, sendFriendRequest, getPendingRequests, acceptFriendRequest, denyFriendRequest, removeFriend, type Friend, type FriendRequest } from '../lib/Perfil/friends';
import AddFriendTab from '../components/Perfil/MyFriends/AddFriendTab';
import PendingRequestsTab from '../components/Perfil/MyFriends/PendingRequestsTab';
import FriendsTab from '../components/Perfil/MyFriends/FriendsTab';

export default function MyFriends() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, loading: authLoading } = useAuth();

  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  // flujo add friend
  const pendingRequest = location.state?.pendingRequest as { userId: string; nickname: string } | undefined;
  const initialTab = location.state?.activeTab || (pendingRequest ? 'add-friend' : 'my-friends');
  const [activeTab, setActiveTab] = useState(initialTab);
  const [requestSent, setRequestSent] = useState(false);
  const showConfirmation = !!pendingRequest && !requestSent; // derived state
  const [sendingRequest, setSendingRequest] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // flujo pending requests
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [loadingPending, setLoadingPending] = useState(true);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  // flujo remove friend
  const [friendToRemove, setFriendToRemove] = useState<Friend | null>(null);
  const [removingFriend, setRemovingFriend] = useState(false);

  useEffect(() => {
    async function loadFriends() {
      if (!userId) return;
      setLoading(true);
      const friendsList = await getFriendsList(userId);
      setFriends(friendsList);
      setLoading(false);
    }
    loadFriends();
  }, [userId]);

  useEffect(() => {
    async function loadPendingRequests() {
      if (!userId) return;
      setLoadingPending(true);
      const requests = await getPendingRequests(userId);
      setPendingRequests(requests);
      setLoadingPending(false);
    }
    loadPendingRequests();
  }, [userId]);

  const handleSendRequest = async () => {
    if (!pendingRequest) return;
    setSendingRequest(true);
    setSendError(null);
    try {
      await sendFriendRequest(pendingRequest.userId);
      setRequestSent(true);
    } catch (e) {
      setSendError('algo mal');
      console.error(e);
    }
    setSendingRequest(false);
  };

  const handleAcceptRequest = async (requestId: number) => {
    if (!userId) return;
    try {
      await acceptFriendRequest(requestId);
      setPendingRequests(prev => prev.filter(r => r.friend_request_id !== requestId));
      const updatedFriends = await getFriendsList(userId);
      setFriends(updatedFriends);
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 3000);
    } catch (error) {
      console.error('error aceptando friend:', error);
      throw error;
    }
  };

  const handleDenyRequest = async (requestId: number) => {
    try {
      await denyFriendRequest(requestId);
      setPendingRequests(prev => prev.filter(r => r.friend_request_id !== requestId));
    } catch (error) {
      console.error('error denying friend request:', error);
    }
  };

  const handleRemoveFriend = async () => {
    if (!friendToRemove) return;
    setRemovingFriend(true);
    try {
      await removeFriend(friendToRemove.user_id);
      setFriends(prev => prev.filter(f => f.user_id !== friendToRemove.user_id));
      setFriendToRemove(null);
    } catch (e) {
      console.error('error removiendo amigo:', e);
      alert('Error al remover el amigo.');
    }
    setRemovingFriend(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-Background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-morado-lakers"></div>
      </div>
    );
  }

  if (!userId) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-Background">
      <div>
        <Nav current="Perfil" />
      </div>

      <div className="px-4 sm:px-8 md:px-12 lg:px-[60px] py-4 sm:py-[20px]">
        <div className="bg-morado-oscuro w-full h-[138px] flex flex-col justify-center px-8 rounded-2xl mb-6">
          <h1 className="text-white text-[40px] font-black leading-normal mb-2" style={{ fontFamily: 'Graphik' }}>
            My Friends
          </h1>
          <p className="text-texto-claro text-2xl leading-[1.2]" style={{ fontFamily: 'Graphik' }}>
            Connect, share, and stay in touch with your community
          </p>
        </div>

        {/*TABS!!*/}
        <div className="w-full mb-8">
          <div className="flex gap-4">
            {['my-friends', 'pending', 'add-friend'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-[210px] h-[59px] rounded-[15px] text-[18px] flex items-center justify-center transition-all ${
                  activeTab === tab
                    ? 'bg-morado-oscuro text-white'
                    : 'bg-white border-[3px] border-morado-oscuro text-morado-oscuro hover:bg-morado-hover hover:border-morado-hover hover:text-white'
                }`}
                style={{ fontFamily: 'Graphik' }}
              >
                {tab === 'my-friends' ? 'My Friends' : tab === 'pending' ? 'Pending Requests' : 'Add Friend'}
              </button>
            ))}
          </div>
        </div>
        
        {/*CONTENIDO DE TABSS*/}
        <div className="w-full pb-8">
          {activeTab === 'add-friend' && (
            <AddFriendTab
              pendingRequest={pendingRequest}
              showConfirmation={showConfirmation}
              requestSent={requestSent}
              sendingRequest={sendingRequest}
              sendError={sendError}
              onSendRequest={handleSendRequest}
            />
          )}

          {activeTab === 'pending' && (
            <PendingRequestsTab
              pendingRequests={pendingRequests}
              loading={loadingPending}
              showSuccessAlert={showSuccessAlert}
              onAccept={handleAcceptRequest}
              onDeny={handleDenyRequest}
            />
          )}

          {activeTab === 'my-friends' && (
            <FriendsTab
              friends={friends}
              loading={loading}
              onRemove={setFriendToRemove}
            />
          )}
        </div>
      </div>

      {/*CONFIRMACION REMOVE FRIEND*/}
      {friendToRemove && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[15px] p-10 max-w-md mx-4">
            <h2
              style={{
                fontFamily: 'Graphik',
                fontSize: '20px',
                fontWeight: 500,
                lineHeight: '30px',
              }}
              className="text-texto-oscuro mb-4 pb-4 border-b border-morado-oscuro/20"
            >
              Remove {friendToRemove.nickname} from Friends
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
              Are you sure you want to remove <strong>{friendToRemove.nickname}</strong> from your friends list? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <ProfileButton
                type={removingFriend ? 'primarydisable' : 'secondary'}
                text={removingFriend ? 'Removing...' : 'Yes, remove friend'}
                onClick={removingFriend ? () => {} : handleRemoveFriend}
              />
              <ProfileButton
                type="secondary"
                text="Cancel"
                onClick={() => setFriendToRemove(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
