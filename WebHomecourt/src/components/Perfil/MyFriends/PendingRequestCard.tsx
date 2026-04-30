import { useNavigate } from 'react-router-dom';
import type { FriendRequest } from '../../../lib/Perfil/friends';

const DEFAULT_AVATAR = 'https://ptbcoxaguvbwprxdundz.supabase.co/storage/v1/object/public/user_images/profile_picture_default.png';

type PendingRequestCardProps = {
  request: FriendRequest;
  onAccept: (requestId: number) => Promise<void>;
  onDeny: (requestId: number) => Promise<void>;
};

export default function PendingRequestCard({ request, onAccept, onDeny }: PendingRequestCardProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-[15px] p-6 border border-morado-oscuro/10">
      <h3
        className="mb-4 pb-3 border-b border-morado-oscuro/10"
        style={{ 
          color: '#11061A',
          fontFamily: 'Graphik',
          fontSize: '18px',
          fontWeight: 500,
          lineHeight: '27px'
        }}
      >
        Request from {request.nickname}
      </h3>

      <div className="flex items-center justify-between">
        <div
          className="flex items-center gap-4 cursor-pointer"
          onClick={() => navigate(`/perfil/${request.sender_id}`)}
        >
          <img
            src={request.photo_url || DEFAULT_AVATAR}
            alt="Profile"
            className="w-16 h-16 rounded-full object-cover"
          />
          <div>
            <p className="text-texto-oscuro text-sm font-medium mb-1" style={{ fontFamily: 'Graphik' }}>
              {request.nickname}
            </p>
            <p className="text-Gris-Oscuro text-xs mb-2" style={{ fontFamily: 'Graphik' }}>
              @{request.username}
            </p>
            <p className="text-Gris-Oscuro text-xs" style={{ fontFamily: 'Graphik' }}>
              Request sent {new Date(request.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={async () => {
              try {
                console.log('accepting request:', request.friend_request_id);
                await onAccept(request.friend_request_id);
                console.log('request accepted successfully');
              } catch (error) {
                console.error('error aceptando friend request:', error);
                alert('error al aceptar la solicitud.');
              }
            }}
            className="h-11 px-6 bg-white border-2 border-morado-oscuro text-morado-oscuro hover:bg-morado-hover hover:border-morado-hover hover:text-white rounded-[10px] transition-all text-sm"
            style={{ fontFamily: 'Graphik' }}
          >
            Accept Friend
          </button>
          <button
            onClick={async () => {
              await onDeny(request.friend_request_id);
            }}
            className="h-11 px-6 bg-white border-2 border-morado-oscuro text-morado-oscuro hover:bg-morado-hover hover:border-morado-hover hover:text-white rounded-[10px] transition-all text-sm"
            style={{ fontFamily: 'Graphik' }}
          >
            Deny
          </button>
        </div>
      </div>
    </div>
  );
}
