import Nav from '../components/Nav'
import { getScoreboard, type MarcadorReal } from '../components/Marcador'
import { useEffect, useState } from "react"

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
        <Nav current="Home" userId="ac3a5447-1b6f-4324-8830-5ddc2d7b2c47" />
      </div>
      <div className='px-14 py-5 bg-zinc-100 w-full '>
        <div className="w-full px-5 py-7 bg-purple-900 rounded-2xl shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] outline outline-1 outline-offset-[-1px] outline-black/25 inline-flex flex-col justify-start items-start gap-3.5 overflow-hidden">
            <div className="self-stretch inline-flex justify-between items-center">
                <div className="flex justify-start items-center gap-7">
                    <div className="px-5 py-3 bg-red-500 rounded-2xl flex justify-center items-center gap-2.5">
                        
                    </div>
                    <h1 className="justify-start text-zinc-100 title1">Live game</h1>
                </div>
                <h3 className="justify-start text-white">March 15th, 2026</h3>
            </div>
            <div className="self-stretch px-2.5 py-7 bg-white rounded-2xl flex flex-col justify-center items-center gap-5 overflow-hidden">
                <div className="inline-flex justify-start items-center gap-12">
                    <div className="inline-flex flex-col justify-center items-center gap-[5px]">

                        <h3 className="justify-start">LA</h3>
                        <p className="justify-start text-black text-lg font-normal font-['Graphik']">Local</p>
                    </div>
                    <h1 className="justify-start text-violet-950 marcador">{marcadorcito?.lakers_score} - {marcadorcito?.opposing_score}</h1>
                    <div className="inline-flex flex-col justify-center items-center gap-[5px]">

                        <h3 className="justify-start text-black text-3xl font-normal font-['Graphik']">GSW</h3>
                        <p className="justify-start text-black text-lg font-normal font-['Graphik']">Visitor</p>
                    </div>
                </div>
                <div className="w-[1094px] h-0.5 bg-yellow-700"></div>
                <div className="w-[1084px] h-6 relative">
                    <div className="w-44 h-6 left-0 top-0 absolute">
                        <p className="w-48 h-5 left-[31px] top-[2px] absolute justify-start text-violet-950">1:32:46 elapsed</p>
                        
                    </div>
                    <div className="w-52 h-6 left-[384px] top-0 absolute">
                        <p className="w-48 h-5 left-[31px] top-[2px] absolute justify-start text-violet-950">{marcadorcito?.venue ?? "caca 1"}</p>
                        
                    </div>
                    <div className="w-56 h-6 left-[860px] top-0 absolute">
                        <p className="w-48 h-5 left-[31px] top-[2px] absolute justify-start text-violet-950">17,071 attended</p>
                        
                    </div>
                </div>
            </div>
        </div>
        
      </div>
      
    </div>
  )
}

export default Home
