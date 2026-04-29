import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getFriendsList } from '../../lib/Perfil/friends'
import { usePresence } from '../../hooks/Perfil/usePresence'
import FriendCard from './FriendCard'

type Friend = {
    user_id: string
    nickname: string
    username: string
    photo_url: string | null
}

type FriendsListProps = {
    userId: string
    currentUser: {
        user_id: string
        nickname: string
        photo_url: string
    } | null
    isOwnProfile?: boolean
}

function FriendsList({ userId, currentUser, isOwnProfile = true }: FriendsListProps) {
    const navigate = useNavigate()
    const [friends, setFriends] = useState<Friend[]>([])
    const [loading, setLoading] = useState(true)
    const { isUserOnline } = usePresence(currentUser)

    useEffect(() => {
        async function loadFriends() {
            setLoading(true)
            const friendsList = await getFriendsList(userId)
            setFriends(friendsList)
            setLoading(false)
        }

        if (userId) {
            loadFriends()
        }
    }, [userId])

    if (loading) {
        return (
            <div className="w-full bg-white rounded-[15px] border border-black/8 shadow-[0_4px_4px_0_rgba(0,0,0,0.08)] p-[21px_25px]">
                <div className="animate-pulse flex gap-5">
                    <div className="rounded-full bg-gray-200 h-[60px] w-[60px]"></div>
                    <div className="rounded-full bg-gray-200 h-[60px] w-[60px]"></div>
                    <div className="rounded-full bg-gray-200 h-[60px] w-[60px]"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full bg-white rounded-[15px] border border-black/8 shadow-[0_4px_4px_0_rgba(0,0,0,0.08)] py-[21px] px-[25px]">
    
            <div className="flex justify-between items-center mb-4">
                <h2 className="flex items-baseline gap-1">
                    <span className="text-[#11061A] text-[18px] font-normal leading-[27px]">
                        Friends
                    </span>
                    <span className="text-[#6F6975] text-[14px] font-normal leading-[21px]">
                        ({friends.length})
                    </span>
                </h2>

                {isOwnProfile && (
                    <button
                        onClick={() => navigate('/my-friends')}
                        className="flex items-center gap-1 hover:opacity-80"
                    >
                        <span className="text-[#542581] text-center text-[13px] font-medium leading-[19.5px]">
                            Manage Friends
                        </span>
                        <span className="material-symbols-outlined text-[#542581]" style={{ fontSize: '16px' }}>
                            settings
                        </span>
                    </button>
                )}
            </div>


            <div className="flex overflow-x-auto gap-5 scrollbar-hide">

                {isOwnProfile && (
                    <div
                        className="flex flex-col items-center flex-shrink-0 cursor-pointer hover:opacity-80 w-[64px] h-[88.5px] gap-2"
                        onClick={() => navigate('/my-friends', { state: { activeTab: 'add-friend' } })}
                    >
                        <div className="rounded-full flex items-center justify-center w-[60px] h-[60px] border-2 border-[#A09CA4]">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M12 5V19M5 12H19" stroke="#A09CA4" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        </div>
                        <span className="text-Gris-Oscuro text-[11px] font-normal">
                            Add
                        </span>
                    </div>
                )}


                {friends.map(friend => (
                    <FriendCard 
                        key={friend.user_id}
                        friend={friend}
                        isOnline={isUserOnline(friend.user_id)}
                    />
                ))}

                {friends.length === 0 && (
                    <div className="text-Gris-Oscuro text-sm">
                        You don't have friends yet. Add some!
                    </div>
                )}
            </div>
        </div>
    )
}

export default FriendsList