import Nav from '../components/Nav/Nav'
import Map from "../components/LakerCourt/Map"
import CourtTournaments from '../components/LakerCourt/CourtTournaments'
import RatePlayersPanel from '../components/LakerCourt/RatePlayersPanel'
import YourActivityCard from '../components/YourActivityCard'
import ActiveModerationCard from '../components/LakerCourt/ActiveModerationCard'
import BannerReput from '../components/LakerCourt/BannerReput'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import {
  getPendingRatingPlayers,
  markUserEventAsRated,
  saveUserEventRating,
  type RatePlayer,
} from '../services/apiRate'
import { getCurrentUserActivity, getUserReputation } from '../services/apiUser'
import type { UserActivityStats } from '../services/apiUser'

function LakersCourt() {
  const { userId } = useAuth()
  const navigate = useNavigate()
  const [players, setPlayers] = useState<RatePlayer[]>([])
  const [loadingPlayers, setLoadingPlayers] = useState(true)
  const [submittingRatings, setSubmittingRatings] = useState(false) // Para bloquear el boton mientras se envia
  const [playersError, setPlayersError] = useState<string | null>(null)
  const [pendingUserEventId, setPendingUserEventId] = useState<number | null>(null)
  const [pendingEventId, setPendingEventId] = useState<number | null>(null)
  const [pendingCourtSubtitle, setPendingCourtSubtitle] = useState('Court not available')
  const [selectedRatings, setSelectedRatings] = useState<Record<string, number>>({})
  const [selectedCourtId, setSelectedCourtId] = useState<number | null>(null)
  const [userReputation, setUserReputation] = useState<number | null>(null)
  const [loadingReputation, setLoadingReputation] = useState(true)
  const [userActivity, setUserActivity] = useState<UserActivityStats | null>(null)
  const [loadingActivity, setLoadingActivity] = useState(true)
  const [activityError, setActivityError] = useState<string | null>(null)
  const allPlayersRated = players.length > 0 && players.every((player) => Boolean(selectedRatings[player.id])) //Habilita y desahbilkita el boton. Si no hay jugadores, no lo acticva y si faltan por calificar algunos. Tamapoco

  const loadUserReputation = async () => {
    setLoadingReputation(true)

    try {
      const reputation = await getUserReputation(userId)
      setUserReputation(reputation)
    } finally {
      setLoadingReputation(false)
    }
  }

  const loadPendingRatings = async () => {
    setLoadingPlayers(true)
    setPlayersError(null)

    try {
      const pendingRating = await getPendingRatingPlayers()

      if (!pendingRating) {
        setPendingUserEventId(null)
        setPendingEventId(null)
        setPendingCourtSubtitle('Court not available')
        setPlayers([])
        setSelectedRatings({})
        return
      }

      setPendingUserEventId(pendingRating.userEventId)
      setPendingEventId(pendingRating.eventId)
      const subtitleParts = [pendingRating.courtName, pendingRating.courtDirection].filter(
        (value): value is string => Boolean(value && value.trim().length > 0)
      )
      setPendingCourtSubtitle(
        subtitleParts.length > 0 ? subtitleParts.join(', ') : 'Court not available'
      )
      setPlayers(pendingRating.players)
      setSelectedRatings((prevRatings) => {
        const nextRatings: Record<string, number> = {}

        pendingRating.players.forEach((player) => {
          const existingRating = prevRatings[player.id]
          if (existingRating) {
            nextRatings[player.id] = existingRating
          }
        })

        return nextRatings
      })
    } catch (error) {
      setPendingUserEventId(null)
      setPendingEventId(null) 
      setPendingCourtSubtitle('Court not available')
      setPlayers([])
      setSelectedRatings({})
      setPlayersError(error instanceof Error ? error.message : 'Error loading players')
    } finally {
      setLoadingPlayers(false)
    }
  }

  const loadUserActivity = async () => {
    setLoadingActivity(true)
    setActivityError(null)

    try {
      if (!userId) {
        setUserActivity(null)
        return
      }

      const activity = await getCurrentUserActivity(userId)
      setUserActivity(activity)
    } catch (error) {
      setUserActivity(null)
      setActivityError(error instanceof Error ? error.message : 'Error loading your activity')
    } finally {
      setLoadingActivity(false)
    }
  }

  const handlePlayerRating = (playerId: string, rating: number) => {
    setPlayersError(null)
    setSelectedRatings((prev) => ({
      ...prev,
      [playerId]: rating,
    }))
  }

  const handleSubmitRatings = async () => {
    if (!pendingUserEventId) return

    const unratedPlayers = players.filter((player) => !selectedRatings[player.id])
    if (unratedPlayers.length > 0) {
      setPlayersError('You must rate all players before submitting')
      return
    }

    try {
      setSubmittingRatings(true)
      await Promise.all(
        players.map((player) =>
          saveUserEventRating(pendingUserEventId, player.id, selectedRatings[player.id])
        )
      )
      await markUserEventAsRated(pendingUserEventId)
      await loadPendingRatings()
    } catch (error) {
      setPlayersError(error instanceof Error ? error.message : 'Error saving rating')
    } finally {
      setSubmittingRatings(false)
    }
  }

  useEffect(() => {
    loadPendingRatings()
    loadUserReputation()
    loadUserActivity()
  }, [userId])

  const handleViewHistory = () => {
    navigate('/historial-lakers')
  }

  return (
    <div>
      <div >
        <Nav current="LakersCourt" />
      </div>
      <div className='px-4 py-5 bg-zinc-100 w-full sm:px-6 lg:px-14'>
        <BannerReput
          title="LAKERS COURT"
          subtitle="Find courts and basketball events near you"
          logoSrc="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1YSBBAgbPAWr0ku6NAqV0yojAo5q9RrpLww&s"
          logoAlt="Lakers logo"
          reputationValue={userReputation}
          loadingReputation={loadingReputation}
          icon={
            <span
              className="material-symbols-outlined leading-none text-amarillo-lakers"
              style={{ fontSize: '100px' }}
            >
              star
            </span>
          }
        />
        {loadingPlayers && <div className="p-5"><p>Loading players...</p></div>}
        {!loadingPlayers && playersError && <div className="p-5"><p>{playersError}</p></div>}
        {!loadingPlayers && players.length > 0 && <div className="px-0 py-5 sm:p-5">
          <RatePlayersPanel
            players={players}
            subtitle={pendingCourtSubtitle}
            onSubmit={handleSubmitRatings}
            submitDisabled={submittingRatings || !allPlayersRated}
            submittingRatings={submittingRatings}
            onRatingChange={handlePlayerRating}
            eventId={pendingEventId ?? 0
              
            }
          />
        </div>}
        <div className="w-full max-w-315 mx-auto mt-10">
          <h1 className="text-2xl font-bold pb-5">Basketball Fields Map</h1>
          <Map selectedCourtId={selectedCourtId} onCourtSelect={setSelectedCourtId} />
        </div>
        <div className="w-full mt-15">
          <CourtTournaments selectedCourtId={selectedCourtId} />
        </div>
        <div className="w-full max-w-315 mx-auto mt-6 mb-8 grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ActiveModerationCard />
          <YourActivityCard
            stats={userActivity}
            loading={loadingActivity}
            reputation={userReputation}
            loadingReputation={loadingReputation}
            error={activityError}
            onViewHistory={handleViewHistory}
          />
        </div>
      </div>
    </div>
  )
}

export default LakersCourt
