import { supabase } from "../../lib/supabase"
import { getFriendshipStatus, removeFriend } from "../../lib/Perfil/friends"
import type { FriendshipStatus } from "../../lib/Perfil/friends"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Button from "../button"
import { format } from "date-fns"

const DEFAULT_AVATAR = "https://ptbcoxaguvbwprxdundz.supabase.co/storage/v1/object/public/user_images/profile_picture_default.png"

export type ProfileData = {
    nickname: string
    username: string
    photo_url: string | null
    credits: number
    reputation: number
    created_at: string
}

export type ProfileStats = {
    friendsCount: number
    eventsCreated: number
    eventsAttended: number
    cardsCollected: number
}

export async function getProfileData(userId: string): Promise<ProfileData | null> {
    if (!userId) throw new Error("Invalid userId")

    const { data, error } = await supabase
        .from("user_laker")
        .select("nickname, username, photo_url, credits, reputation, created_at")
        .eq("user_id", userId)
        .single()

    if (error) {
        console.error("Supabase error:", error.message)
        throw new Error("Failed to get profile data")
    }

    return data
}

export async function getProfileStats(userId: string): Promise<ProfileStats> {
    if (!userId) throw new Error("Invalid userId")

    const { data: friendsData, error: friendsError } = await supabase
        .from("friendship")
        .select("friendship_id")
        .or(`user1.eq.${userId},user2.eq.${userId}`)

    if (friendsError) console.error("Friends error:", friendsError.message)

    const { data: eventsCreatedData, error: eventsCreatedError } = await supabase
        .from("event")
        .select("event_id")
        .eq("created_user_id", userId)

    if (eventsCreatedError) console.error("Events created error:", eventsCreatedError.message)

    const { data: eventsAttendedData, error: eventsAttendedError } = await supabase
        .from("event_participant")
        .select("event_participant_id")
        .eq("user_id", userId)

    if (eventsAttendedError) console.error("Events attended error:", eventsAttendedError.message)

    const { data: cardsData, error: cardsError } = await supabase
        .from("user_card")
        .select("card_id")
        .eq("user_id", userId)

    if (cardsError) console.error("Cards error:", cardsError.message)

    return {
        friendsCount: friendsData?.length || 0,
        eventsCreated: eventsCreatedData?.length || 0,
        eventsAttended: eventsAttendedData?.length || 0,
        cardsCollected: cardsData?.length || 0,
    }
}

function StatDivider() {
    return <div className="w-[1px] h-6 bg-[#9482A5] opacity-30"></div>
}

function FriendButton({ status, onClick, mobile }: { status: FriendshipStatus; onClick: () => void; mobile?: boolean }) {
    const iconSize = mobile ? "text-xl" : "text-2xl"
    const textSize = mobile ? "text-base" : "text-lg"
    const padding = mobile ? "px-4 py-2" : "px-6 py-2"
    const display = mobile ? "ml-auto sm:hidden flex" : "hidden sm:flex"

    return (
        <button
            onClick={onClick}
            className={`${display} items-center justify-center gap-2 bg-morado-lakers hover:bg-morado-lakers/90 ${padding} rounded-xl transition-colors flex-shrink-0`}
        >
            {status === "friend" && (
                <>
                    <span className={`material-symbols-outlined ${iconSize} text-[#F3F2F3] leading-none`}>person_remove</span>
                    <span className={`text-[#F3F2F3] font-['Graphik'] ${textSize} font-medium`}>Remove Friend</span>
                </>
            )}
            {status === "pending" && (
                <>
                    <img src="/Perfil/account-pending.svg" alt="pending" className={`${iconSize === "text-xl" ? "w-5 h-5" : "w-6 h-6"}`} />
                    <span className={`text-[#F3F2F3] font-['Graphik'] ${textSize} font-medium`}>Pending</span>
                </>
            )}
            {status === "no_friend" && (
                <>
                    <span className={`material-symbols-outlined ${iconSize} text-[#F3F2F3] leading-none`}>person_add</span>
                    <span className={`text-[#F3F2F3] font-['Graphik'] ${textSize} font-medium`}>Add Friend</span>
                </>
            )}
        </button>
    )
}

function ProfileHeader({ userId, isOwnProfile = true }: { userId: string; isOwnProfile?: boolean }) {
    const navigate = useNavigate()
    const [profile, setProfile] = useState<ProfileData | null>(null)
    const [stats, setStats] = useState<ProfileStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus>("no_friend")
    const [showRemoveModal, setShowRemoveModal] = useState(false)
    const [removingFriend, setRemovingFriend] = useState(false)

    useEffect(() => {
        async function fetchData() {
            setLoading(true)
            try {
                const [profileData, statsData] = await Promise.all([
                    getProfileData(userId),
                    getProfileStats(userId)
                ])
                setProfile(profileData)
                setStats(statsData)

                if (!isOwnProfile) {
                    const status = await getFriendshipStatus(userId)
                    setFriendshipStatus(status)
                }
            } catch (e) {
                console.error("Can't load profile:", e)
            }
            setLoading(false)
        }

        fetchData()
    }, [userId, isOwnProfile])

    const handleFriendAction = () => {
        if (friendshipStatus === "no_friend" && profile) {
            navigate("/my-friends", {
                state: {
                    pendingRequest: {
                        userId: userId,
                        nickname: profile.nickname
                    }
                }
            })
        } else if (friendshipStatus === "friend") {
            setShowRemoveModal(true)
        }
        // si es pending no hace nada por ahorita
    }

    const confirmRemoveFriend = async () => {
        setRemovingFriend(true)
        try {
            await removeFriend(userId)
            setFriendshipStatus("no_friend")
            setShowRemoveModal(false)
        } catch (e) {
            console.error('Error removing friend:', e)
            alert('Error al remover el amigo. Por favor intenta de nuevo.')
        }
        setRemovingFriend(false)
    }

    if (loading) {
        return (
            <div className="bg-gradient-to-r from-morado-oscuro to-morado-lakers rounded-2xl p-6 animate-pulse">
                <div className="h-24 w-24 bg-morado-bajo rounded-[15px]"></div>
            </div>
        )
    }

    if (!profile || !stats) {
        return <p>Error loading profile</p>
    }

    return (
        <div className="bg-morado-oscuro rounded-2xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4">
                <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    <img
                        src={profile.photo_url || DEFAULT_AVATAR}
                        alt={profile.nickname}
                        className="w-[80px] h-[80px] sm:w-[110px] sm:h-[112px] rounded-[15px] object-cover flex-shrink-0"
                    />
                    <div className="flex-1">
                        <h1 className="text-white text-2xl sm:text-4xl font-bold">
                            {profile.nickname}
                        </h1>
                        <p className="text-[#9482A5] text-sm sm:text-base leading-relaxed mt-1">
                            @{profile.username}
                        </p>
                        <div className="flex items-center gap-1 mt-3">
                            <span className="material-symbols-outlined text-[#E7E6E8]" style={{ fontSize: '16px' }}>calendar_today</span>
                            <span className="text-[#E7E6E8] text-sm" style={{ fontFamily: 'Graphik' }}>Member since {format(new Date(profile.created_at), 'MMMM yyyy')}</span>
                        </div>
                    </div>
                </div>

                {isOwnProfile ? (
                    <button
                        onClick={() => navigate("/editar-perfil")}
                        className="ml-auto sm:hidden flex items-center justify-center gap-2 bg-morado-lakers hover:bg-morado-lakers/90 px-4 py-2 rounded-xl transition-colors"
                    >
                        <span className="material-symbols-outlined text-xl text-[#F3F2F3] leading-none">edit</span>
                        <span className="text-[#F3F2F3] font-['Graphik'] text-base font-medium leading-normal">Edit Profile</span>
                    </button>
                ) : (
                    <FriendButton status={friendshipStatus} onClick={handleFriendAction} mobile />
                )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mt-4">
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-amarillo-lakers text-xl" style={{ fontVariationSettings: '"FILL" 1, "wght" 400, "GRAD" 0, "opsz" 24' }}>
                            star
                        </span>
                        <span className="text-amarillo-lakers text-lg sm:text-[22px]">{(profile.reputation ?? 0).toFixed(1)}</span>
                        <span className="text-[#9482A5] text-xs sm:text-sm ml-1">Reputation</span>
                    </div>

                    <StatDivider />
                    <div className="flex items-center gap-1">
                        <span className="text-[#F3F2F3] text-lg sm:text-[22px]">{profile.credits}</span>
                        <span className="text-[#9482A5] text-xs sm:text-sm">Credits</span>
                    </div>

                    <StatDivider />
                    <div className="flex items-center gap-1">
                        <span className="text-[#F3F2F3] text-lg sm:text-[22px]">{stats.eventsCreated}</span>
                        <span className="text-[#9482A5] text-xs sm:text-sm whitespace-nowrap">Events Created</span>
                    </div>

                    <StatDivider />
                    <div className="flex items-center gap-1">
                        <span className="text-[#F3F2F3] text-lg sm:text-[22px]">{stats.eventsAttended}</span>
                        <span className="text-[#9482A5] text-xs sm:text-sm whitespace-nowrap">Events Attended</span>
                    </div>

                    <StatDivider />
                    <div className="flex items-center gap-1">
                        <span className="text-[#F3F2F3] text-lg sm:text-[22px]">{stats.cardsCollected}</span>
                        <span className="text-[#9482A5] text-xs sm:text-sm whitespace-nowrap">Cards collected</span>
                    </div>
                </div>

                {isOwnProfile ? (
                    <button
                        onClick={() => navigate("/editar-perfil")}
                        className="hidden sm:flex items-center justify-center gap-2 bg-morado-lakers hover:bg-morado-lakers/90 px-6 py-2 rounded-xl transition-colors flex-shrink-0"
                    >
                        <span className="material-symbols-outlined text-2xl text-[#F3F2F3] leading-none">edit</span>
                        <span className="text-[#F3F2F3] font-['Graphik'] text-lg font-medium leading-normal">Edit Profile</span>
                    </button>
                ) : (
                    <FriendButton status={friendshipStatus} onClick={handleFriendAction} />
                )}
            </div>

            {/*confirmacion para remove friend*/}
            {showRemoveModal && profile && (
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
                            Remove {profile.nickname} from Friends
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
                            Are you sure you want to remove <strong>{profile.nickname}</strong> from your friends list? This action cannot be undone.
                        </p>
                        <div className="flex gap-4">
                            <Button
                                type={removingFriend ? 'primarydisable' : 'secondary'}
                                text={removingFriend ? 'Removing...' : 'Yes, remove friend'}
                                onClick={removingFriend ? () => {} : confirmRemoveFriend}
                            />
                            <Button
                                type="secondary"
                                text="Cancel"
                                onClick={() => setShowRemoveModal(false)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ProfileHeader