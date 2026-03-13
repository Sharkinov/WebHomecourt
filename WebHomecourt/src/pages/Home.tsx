import Nav from '../components/Nav'
import { getScoreboard, type MarcadorReal, addPoints } from '../components/Marcador'
import { useEffect, useState } from "react"
import RealtimeChat from '../components/RealtimeChat'

function Home() {

  const [marcadorcito, setMarcador] = useState<MarcadorReal | null>(null)
  
    useEffect(() => {
      const loadUser = async () => {
        const data = await getScoreboard()
        setMarcador(data)
      }
  
      loadUser()
    })

  return (
    <div>
      <div className="flex flex-col items-center justify-center">
        <Nav current="Home" />
      </div>
      <div className='px-14 py-5 bg-zinc-100 w-full '>
        <div className="w-full px-5 py-7 bg-purple-900 rounded-2xl shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] outline outline-1 outline-offset-[-1px] outline-black/25 inline-flex flex-col justify-start items-start gap-3.5 overflow-hidden">
            <div className="self-stretch inline-flex justify-between items-center">
                <div className="flex justify-start items-center gap-7">
                    <div className="px-5 py-3 bg-red-500 rounded-2xl flex justify-center items-center gap-2.5">
                      <span className="material-symbols-outlined text-zinc-100 text-[100px]">motion_photos_on</span>
                    </div>
                    <h1 className="justify-start text-zinc-100 title1">Live game</h1>
                </div>
                <h3 className="justify-start text-white">{}</h3>
            </div>
            <div className="self-stretch px-2.5 py-7 bg-white rounded-2xl flex flex-col justify-center items-center gap-5 overflow-hidden">
                <div className="inline-flex justify-start items-center gap-12">
                    <div className="inline-flex flex-col justify-center items-center gap-[5px]">
                        <img
                          className="h-20 w-auto object-contain"
                          src={marcadorcito?.lakers_logo}
                          alt="Homecourt logo"
                        />   
                        <h3 className="justify-start">{marcadorcito?.lakers_team_name}</h3>
                        <p className="justify-start">{marcadorcito?.home ? "Home" : "Visitor"}</p>
                    </div>
                    <div className="inline-flex flex-col justify-center items-center gap-3">
                      <h1 className="justify-start text-violet-950 marcador">{marcadorcito?.lakers_score} - {marcadorcito?.opposing_score}</h1>
                    </div>
                    <div className="inline-flex flex-col justify-center items-center gap-[5px]">
                        <img
                          className="h-20 w-auto object-contain"
                          src={marcadorcito?.opposing_team_logo}
                          alt="Homecourt logo"
                        /> 
                        <h3 className="justify-start">{marcadorcito?.opposing_team_name}</h3>
                        <p className="justify-start">{marcadorcito?.home ? "Visitor" : "Home"}</p>
                    </div>
                </div>
                <div className="w-[1094px] h-0.5 bg-yellow-700"></div>
                <div className="w-[1084px] h-6 relative">
                    <div className="w-44 h-6 left-0 top-0 absolute">
                        <p className="w-48 h-5 left-[31px] top-[2px] absolute justify-start text-violet-950">{marcadorcito?.elapsed_seconds != null ? Number(marcadorcito.elapsed_seconds).toLocaleString('en-US') : '0'} elapsed</p>
                        <span className="material-symbols-outlined text-violet-950 text-[100px]">History</span>
                    </div>
                    <div className="w-52 h-6 left-[384px] top-0 absolute">
                        <p className="w-48 h-5 left-[31px] top-[2px] absolute justify-start text-violet-950">{marcadorcito?.venue ?? "caca 1"}</p>
                        <span className="material-symbols-outlined text-violet-950 text-[100px]">location_on</span>
                    </div>
                    <div className="w-56 h-6 left-[860px] top-0 absolute">
                        <p className="w-48 h-5 left-[31px] top-[2px] absolute justify-start text-violet-950">{marcadorcito?.attended != null ? Number(marcadorcito?.attended).toLocaleString('en-US') : '0'} attended</p>
                        <span className="material-symbols-outlined text-violet-950 text-[100px]">Group</span>
                    </div>
                </div>
            </div>
        </div>
        <div className="flex justify-center items-center gap-6 mt-6">
        <button
          onClick={() => marcadorcito?.game_id && addPoints(marcadorcito.game_id, 1, 2)}
          disabled={!marcadorcito?.game_id}
          className="px-8 py-4 bg-violet-950 text-white text-lg font-semibold rounded-lg hover:bg-violet-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          +2 Lakers
        </button>
        <button
          onClick={() => marcadorcito?.game_id && addPoints(marcadorcito.game_id, 4, 2)}
          disabled={!marcadorcito?.game_id}
          className="px-8 py-4 bg-violet-950 text-white text-lg font-semibold rounded-lg hover:bg-violet-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          +2 opponent
        </button>
        </div>
        <RealtimeChat gameId={marcadorcito?.game_id ?? null} />
      </div>
      
    </div>
  )
}

export default Home
