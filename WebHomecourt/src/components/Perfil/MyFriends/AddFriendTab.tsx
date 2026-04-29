import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../button';

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

  if (requestSent) {
    //EXITO
    return (
      <div className="bg-white rounded-[15px] p-10">
        <div className="py-4 text-center">
          <p className="text-texto-oscuro text-[18px] mb-6" style={{ fontFamily: 'Graphik' }}>
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
          <Button
            type={sendingRequest ? 'primarydisable' : 'secondary'}
            text={sendingRequest ? 'Sending...' : 'Yes, send friend request'}
            onClick={sendingRequest ? () => {} : onSendRequest}
          />
          <Button
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
    <div className="bg-white rounded-[15px] p-10">
      <h2
        className="text-texto-oscuro text-[22px] font-semibold mb-4 pb-4 border-b border-morado-oscuro/20"
        style={{ fontFamily: 'Graphik' }}
      >
        Search for a Friend
      </h2>
      <p className="text-Gris-Oscuro mb-6" style={{ fontFamily: 'Graphik' }}>
        Enter the name of the person you would like to send a friend request to
      </p>
      <div className="flex gap-3 items-center">
        <div className="flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Member Name"
            className="w-full h-[51px] px-5 bg-Background border-[3px] border-morado-bajo rounded-[15px] text-morado-bajo placeholder:text-morado-bajo/60 focus:outline-none focus:border-morado-bajo"
            style={{ fontFamily: 'Graphik' }}
          />
        </div>
        <button
          className="h-[51px] px-10 bg-morado-oscuro hover:bg-morado-hover text-white rounded-[15px] transition-colors"
          style={{ fontFamily: 'Graphik' }}
        >
          Find Friend
        </button>
      </div>
    </div>
  );
}
