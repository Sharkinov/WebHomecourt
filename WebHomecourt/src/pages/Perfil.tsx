import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Nav from '../components/Nav'
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
    const { userId, loading: authLoading } = useAuth()
    
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
    const [events, setEvents] = useState<EventItem[]>([])

    useEffect(() => {
        if (!userId) return

        async function loadData() {
            if (!userId) return

            const { data: userData } = await supabase
                .from('user_laker')
                .select('user_id, nickname, photo_url')
                .eq('user_id', userId)
                .single()

            if (userData) {
                setCurrentUser({
                    user_id: userData.user_id,
                    nickname: userData.nickname || 'Usuario',
                    photo_url: userData.photo_url || ''
                })
            }


            const eventsData = await getUpcomingEvents(userId)
            setEvents(eventsData)
        }

        loadData()
    }, [userId])

    if (authLoading) {
        return (
            <div className="min-h-screen bg-[#F3F2F5] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-morado-lakers"></div>
            </div>
        )
    }

    if (!userId) {
        navigate('/login')
        return null
    }

    return (
        <div className="min-h-screen bg-[#F3F2F5]">
            <div className="flex flex-col items-center justify-center">
                <Nav current="Perfil" />
            </div>

            <div className="px-4 sm:px-8 md:px-12 lg:px-[60px] py-4 sm:py-[20px] flex flex-col gap-4 sm:gap-6 md:gap-[31px]">
                <ProfileHeader userId={userId} />
                <FriendsList
                    userId={userId}
                    currentUser={currentUser}
                />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-[31px]">
                    <VotingActivity userId={userId} />
                    <UpcomingEvents events={events} />
                </div>
                <Achievements userId={userId} />
                <SettingsSection />
            </div>
        </div>
    )
}

export default Perfil