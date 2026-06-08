import { useLocation } from 'react-router-dom'
import PointsByPlayerGraph from '../components/Stats/PointsByPlayerGraph';
import FGAvsFGMGraph from '../components/Stats/FGAvsFGMGraph';
import RatioGraph from '../components/Stats/RatioGraph';
import { useEffect, useState } from "react"
import { getStatsByGameId} from "../components/Stats/getStatsByGameId" 
import type {PlayerStat} from "../components/Stats/getStatsByGameId"
import GameSummaryGraph from '../components/Stats/GameSummaryGraph';
import PlayerStatsTable from '../components/Stats/PlayerStatsTable';
import {getMarcadorByGameId} from '../components/Stats/getMarcadorByGameId';
import  type {MarcadorJuego} from '../components/Home/Marcador'
import MarcadorActivo from '../components/Home/Marcador'
import { supabase } from "../lib/supabase"

function Estadisticas() {
  const location = useLocation()
  const state = location.state as { game_id?: number } | null
  //Para evitar el broken access control
  const game_id = typeof state?.game_id === 'number' && state.game_id > 0 ? state.game_id : 1

  const [stats, setStats] = useState<PlayerStat[]>([])
  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await getStatsByGameId(game_id)
        setStats(data)
        
      } catch (err) {
        console.error(err)
      }
    }

    loadStats()
    const channel = supabase
      .channel(`player-stats-${game_id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "simulacion_juego",
          table: "team_player_stats",
          filter: `game_id=eq.${game_id}`
        },
        async (payload) => {
          console.log("EVENTO RECIBIDO", payload)
          
          try {
            const data = await getStatsByGameId(game_id)

            console.log("DATOS RECARGADOS", data)

            setStats(data)
          } catch (err) {
            console.error(err)
          }
        }
      )
      .subscribe((status) => {
        console.log("Realtime status:", status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [game_id])


  const [juego, setJuego] = useState<MarcadorJuego | null> (null);
  useEffect(() => {
    const loadJuego = async () => {
      try {
        const marca = await getMarcadorByGameId(game_id)
        setJuego(marca)
      } catch (error) {
        setJuego(null)
        console.error(error)
      }
    }

    loadJuego()
    const channel = supabase
      .channel(`game-stats-${game_id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "simulacion_juego",
          table: "team_player_stats",
          filter: `game_id=eq.${game_id}`
        },
        async (payload) => {
          console.log("EVENTO RECIBIDO", payload)
          
          try {
            const marca = await getMarcadorByGameId(game_id)

            console.log("DATOS RECARGADOS", marca)
            setJuego(marca)

          } catch (err) {
            console.error(err)
            setJuego(null)
          }
        }
      )
      .subscribe((status) => {
        console.log("Realtime status:", status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [game_id])

  return (
    <div >
      <div className='px-4 md:px-14 py-5 bg-zinc-100 w-full'>
        <div>
          {juego !== null && <MarcadorActivo juego={juego} />}
         
        </div>
        <div className='flex flex-col md:flex-row gap-6 pt-6'>
          <div className = 'w-full md:w-1/2'>
            <PointsByPlayerGraph stats={stats} />
          </div>
          <div className = 'w-full md:w-1/2'>
            <GameSummaryGraph game_id={game_id}/>
          </div>
        </div>
        <div className='flex flex-col md:flex-row gap-6 pt-6'>
          <div className = 'w-full md:w-1/3'>
            <FGAvsFGMGraph stats={stats} />
          </div>
          <div className = 'w-full md:w-2/3'>
            <RatioGraph stats={stats} />
          </div>
        </div>
        <div className='flex center gap-6 pt-6 '>
          <PlayerStatsTable stats={stats} />
        </div>
      </div>
    </div>
  )
}
export default Estadisticas
