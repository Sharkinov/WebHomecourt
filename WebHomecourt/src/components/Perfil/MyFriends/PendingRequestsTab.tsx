import StatusAlert from '../../Messages/StatusAlert';
import PendingRequestCard from './PendingRequestCard';
import type { FriendRequest } from '../../../lib/Perfil/friends';

type PendingRequestsTabProps = {
  pendingRequests: FriendRequest[];
  loading: boolean;
  showSuccessAlert: boolean;
  onAccept: (requestId: number) => Promise<void>;
  onDeny: (requestId: number) => Promise<void>;
};

export default function PendingRequestsTab({
  pendingRequests,
  loading,
  showSuccessAlert,
  onAccept,
  onDeny
}: PendingRequestsTabProps) {
  return (
    <div className="bg-white rounded-[15px] p-8">
      {showSuccessAlert && (
        <div className="mb-6 flex justify-center">
          <StatusAlert
            tone="success"
            title="Friend successfully added"
          />
        </div>
      )}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-morado-lakers"></div>
        </div>
      ) : pendingRequests.length === 0 ? (
        <>
          <h3
            className="text-texto-oscuro text-[22px] font-semibold mb-6 pb-4 border-b border-morado-oscuro/20"
            style={{ fontFamily: 'Graphik' }}
          >
            Pending Requests
          </h3>
          <div className="text-center py-8 text-Gris-Oscuro" style={{ fontFamily: 'Graphik' }}>
            No pending friend requests
          </div>
        </>
      ) : (
        <div className="space-y-8">
          {pendingRequests.map((request) => (
            <PendingRequestCard
              key={request.friend_request_id}
              request={request}
              onAccept={onAccept}
              onDeny={onDeny}
            />
          ))}
        </div>
      )}
    </div>
  );
}
