import Nav from '../components/Nav'
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
  loadStats()}, [game_id])

  const [juego, setJuego] = useState<MarcadorJuego | null> (null);
  useEffect(() => {
    const loadJuego = async () => {
      try {
        const marca = await getMarcadorByGameId(game_id)
        setJuego(marca)
        
      } catch (error) {
        console.error("Error loading marcador:", error)
        setJuego(null)
      }
    }
  loadJuego()}, [game_id])
  

  return (
    <div className="flex flex-col items-center justify-center  ">
      <Nav current="Estadistica" />
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