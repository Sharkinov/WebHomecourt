import Nav from '../components/Nav'
import Map from "../components/LakerCourt/Map"
import CourtTournaments from '../components/LakerCourt/CourtTournaments'
import RatePlayersPanel from '../components/LakerCourt/RatePlayersPanel'
import YourActivityCard from '../components/YourActivityCard'
import ActiveModerationCard from '../components/LakerCourt/ActiveModerationCard'
import { useEffect, useState } from 'react'
import {
  getPendingRatingPlayers,
  markUserEventAsRated,
  saveUserEventRating,
  type RatePlayer,
} from '../services/apiRate'
import { getCurrentUserActivity, getCurrentUserReputation } from '../services/apiUser'
import type { UserActivityStats } from '../services/apiUser'

function LakersCourt() {
  const [players, setPlayers] = useState<RatePlayer[]>([])
  const [loadingPlayers, setLoadingPlayers] = useState(true)
  const [submittingRatings, setSubmittingRatings] = useState(false)
  const [playersError, setPlayersError] = useState<string | null>(null)
  const [pendingUserEventId, setPendingUserEventId] = useState<number | null>(null)
  const [pendingEventId, setPendingEventId] = useState<number | null>(null)
  const [pendingCourtSubtitle, setPendingCourtSubtitle] = useState('Cancha no disponible')
  const [selectedRatings, setSelectedRatings] = useState<Record<string, number>>({})
  const [selectedCourtId, setSelectedCourtId] = useState<number | null>(null)
  const [userReputation, setUserReputation] = useState<number | null>(null)
  const [loadingReputation, setLoadingReputation] = useState(true)
  const [userActivity, setUserActivity] = useState<UserActivityStats | null>(null)
  const [loadingActivity, setLoadingActivity] = useState(true)
  const [activityError, setActivityError] = useState<string | null>(null)
  const allPlayersRated =
    players.length > 0 && players.every((player) => Boolean(selectedRatings[player.id]))

  const loadUserReputation = async () => {
    setLoadingReputation(true)

    try {
      const reputation = await getCurrentUserReputation()
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
        setPendingCourtSubtitle('Cancha no disponible')
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
        subtitleParts.length > 0 ? subtitleParts.join(', ') : 'Cancha no disponible'
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
      setPendingCourtSubtitle('Cancha no disponible')
      setPlayers([])
      setSelectedRatings({})
      setPlayersError(error instanceof Error ? error.message : 'Error al cargar jugadores')
    } finally {
      setLoadingPlayers(false)
    }
  }

  const loadUserActivity = async () => {
    setLoadingActivity(true)
    setActivityError(null)

    try {
      const activity = await getCurrentUserActivity()
      setUserActivity(activity)
    } catch (error) {
      setUserActivity(null)
      setActivityError(error instanceof Error ? error.message : 'Error al cargar tu actividad')
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
      setPlayersError('Debes calificar a todos los jugadores antes de enviar')
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
      setPlayersError(error instanceof Error ? error.message : 'Error al guardar calificacion')
    } finally {
      setSubmittingRatings(false)
    }
  }

  useEffect(() => {
    loadPendingRatings()
    loadUserReputation()
    loadUserActivity()
  }, [])

  return (
    <div>
      <div className="flex flex-col items-center justify-center">
        <Nav current="LakersCourt" />
      </div>
      <div className='px-14 py-5 bg-zinc-100 w-full '>
        <div className="w-full max-w-315 mx-auto min-h-[169.588px] shrink-0 self-stretch px-5 py-7 bg-morado-oscuro rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.10),0_8px_10px_-6px_rgba(0,0,0,0.10)] flex flex-col gap-6 overflow-hidden md:flex-row md:items-center md:justify-between">
          <div className="inline-flex items-center gap-4">
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1YSBBAgbPAWr0ku6NAqV0yojAo5q9RrpLww&s"
              alt="Lakers logo"
              className="h-20 w-24 rounded-md bg-zinc-100 p-1 object-contain"
            />
            <div className="text-zinc-100">
              <h1 className="justify-start text-zinc-100">LAKERS COURT</h1>
              <p className="mt-2 text-xl text-zinc-300">Find courts and basketball events near you</p>
            </div>
          </div>
          <div className="self-end text-right md:self-auto">
            <p className="uppercase tracking-[0.15em] text-zinc-300 text-sm">YOUR REPUTATION</p>
            <div className="mt-2 inline-flex items-center gap-2 text-amarillo-laker">
              <span className="text-6xl leading-none text-amarillo-lakers">
                {loadingReputation ? '...' : userReputation !== null ? userReputation.toFixed(1) : '--'}
              </span>
              <span className="material-symbols-outlined leading-none text-amarillo-lakers" style={{ fontSize: '100px' }}>
                star
              </span>
            </div>
          </div>
        </div>
        {loadingPlayers && <div className="p-5"><p>Cargando jugadores...</p></div>}
        {!loadingPlayers && playersError && <div className="p-5"><p>{playersError}</p></div>}
        {!loadingPlayers && players.length > 0 && <div className="p-5">
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
          />
        </div>
      </div>
    </div>
  )
}

export default LakersCourt
