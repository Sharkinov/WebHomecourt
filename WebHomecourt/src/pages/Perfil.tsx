import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Nav from '../components/Nav/Nav'
import ProfileHeader from "../components/Perfil/ProfileHeader"
import FriendsList from "../components/Perfil/FriendsList"
import VotingActivity from "../components/Perfil/VotingActivity"
import UpcomingEvents from "../components/Perfil/UpcomingEvents"
import { supabase } from '../lib/supabase'
import { getUpcomingEvents, type EventItem } from '../lib/Perfil/events'
import Achievements from '../components/Perfil/Achievements'
import SettingsSection from '../components/Perfil/SettingsSection'
import { useAuth } from '../hooks/Perfil/useAuth'

type CurrentUser = {
    user_id: string
    nickname: string
    photo_url: string
}

function Perfil() {
    const navigate = useNavigate()
    const { userId: authUserId, loading: authLoading } = useAuth()
    const { userId: urlUserId } = useParams<{ userId: string }>()
    const profileUserId = urlUserId || authUserId

    //determina si esta viendo su propio perfil 
    const isOwnProfile = !urlUserId || urlUserId === authUserId

    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
    const [events, setEvents] = useState<EventItem[]>([])

    useEffect(() => {
        if (!profileUserId) return

        async function loadData() {
            if (!profileUserId) return

            const { data: userData } = await supabase
                .from('user_laker')
                .select('user_id, nickname, photo_url')
                .eq('user_id', profileUserId)
                .single()

            if (userData) {
                setCurrentUser({
                    user_id: userData.user_id,
                    nickname: userData.nickname || 'Usuario',
                    photo_url: userData.photo_url || ''
                })
            }


            const eventsData = await getUpcomingEvents(profileUserId)
            setEvents(eventsData)
        }

        loadData()
    }, [profileUserId])

    if (authLoading) {
        return (
            <div className="min-h-screen bg-[#F3F2F5] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-morado-lakers"></div>
            </div>
        )
    }

    if (!profileUserId && !urlUserId) {
        navigate('/login')
        return null
    }

    return (
        <div className="min-h-screen bg-[#F3F2F5]">
            <div >
                <Nav current="Perfil" />
            </div>

            <div className="px-4 sm:px-8 md:px-12 lg:px-[60px] py-4 sm:py-[20px] flex flex-col gap-4 sm:gap-6 md:gap-[31px]">
                <ProfileHeader userId={profileUserId!} isOwnProfile={isOwnProfile} />
                <FriendsList
                    userId={profileUserId!}
                    currentUser={currentUser}
                    isOwnProfile={isOwnProfile}
                />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-[31px]">
                    <VotingActivity userId={profileUserId!} />
                    <UpcomingEvents events={events} />
                </div>
                <Achievements userId={profileUserId!} />
                {isOwnProfile && <SettingsSection />}
            </div>
        </div>
    )
}

export default Perfil