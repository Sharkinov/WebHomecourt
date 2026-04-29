import { useNavigate } from 'react-router-dom'

type Friend = {
    user_id: string
    nickname: string
    username: string
    photo_url: string | null
}

type FriendCardProps = {
    friend: Friend
    isOnline: boolean
}

function FriendCard({ friend, isOnline }: FriendCardProps) {
    const navigate = useNavigate()

    return (
        <div
            onClick={() => navigate(`/perfil/${friend.user_id}`)}
            className="flex flex-col items-center flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
            style={{ width: '64px', height: '88.5px', gap: '8px' }}
        >
            <div className="relative">
                {friend.photo_url ? (
                    <img
                        src={friend.photo_url}
                        alt={friend.nickname}
                        className="rounded-full object-cover"
                        style={{ width: '60px', height: '60px', border: '2px solid #A09CA4' }}
                    />
                ) : (
                    <div
                        className="rounded-[15px] flex items-center justify-center text-white font-semibold"
                        style={{
                            width: '60px',
                            height: '60px',
                            border: '2px solid #A09CA4',
                            background: 'linear-gradient(135deg, #552583 0%, #FDB927 100%)'
                        }}
                    >
                        {friend.nickname?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                )}

                {isOnline && (
                    <div 
                        className="absolute rounded-full"
                        style={{
                            width: '14px',
                            height: '14px',
                            backgroundColor: '#22C55E',
                            border: '2px solid #FFF',
                            bottom: '0',
                            right: '0'
                        }}
                    />
                )}
            </div>

            <span 
                className="text-center truncate w-full"
                style={{ color: '#6F6975', fontSize: '11px', fontWeight: 400 }}
            >
                {friend.nickname}
            </span>
        </div>
    )
}

export default FriendCard