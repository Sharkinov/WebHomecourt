import Nav from '../components/Nav'
import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import MarcadorActivo, {getMarcadorActivo, type MarcadorJuego} from '../components/Home/Marcador'
import NextGame from '../components/Home/NextGame'
import GameSummaryMiniGraph from '../components/Home/MiniStats'
import MiniBrackets from '../components/Home/MiniBrakets'
import RealtimeChat from '../components/RealtimeChat'
import PrivateChat from '../components/Home/PrivateChat'
import ListChats from '../components/Home/ListChats.tsx'
import type { FriendChat } from '../components/Home/ListChats.tsx'

type ChatView = "community" | "private-list" | "private-chat"
//Obtener el id del ultimo partido
export async function getPastGameId(): Promise<number> {
  const { data, error } = await supabase.rpc("get_last_game_id", {}) 
  // Smth died
  if (error) {
    console.error("Supabase error:", error.message)
    throw new Error("Failed to get ministats")
  }

  return data
}

function Home() {
  const [juego, setJuego] = useState<MarcadorJuego | null> (null);
  const [pastgame, setPastGame] = useState<number | null> (null);
  const [miniStatsRefreshKey, setMiniStatsRefreshKey] = useState(0);
  const [isGameLoading, setIsGameLoading] = useState(true);
  const [chatView, setChatView] = useState<ChatView>("community")
  const [selectedChat, setSelectedChat] = useState<FriendChat | null>(null)
  useEffect(() => {
    const fetchJuego = async () =>{
        try {
            const data = await getMarcadorActivo();
            setJuego(data);
        } catch (error) {
            console.error("Error loading marcador:", error)
            setJuego(null)
    } finally {
      setIsGameLoading(false)
        }
    };
    fetchJuego();
    // Obtener el ultimo id
    const fetchLastFameId = async() => {
       try {
            const data = await getPastGameId();
            setPastGame(data);
        } catch (error) {
            console.error("Error loading marcador:", error)
            setPastGame(null)
        }
    };
    fetchLastFameId();
    // para no repetirlo tanto en el codigo
    const handleUpdate = async () => {
      // console.log("Cambioooo!!");
      const data = await getMarcadorActivo();
      setJuego(data);
      setMiniStatsRefreshKey((prev) => prev + 1);
    };
    //Canal para actualizar view cuando se detecte un cambio en update
    const channel = supabase
    .channel("marcador-live")
    .on(
      "postgres_changes",
      {event: "UPDATE", schema: "simulacion_juego", table: "team_player_stats"},
      handleUpdate
    )
    .on(
      "postgres_changes",
      {event: "UPDATE", schema: "simulacion_juego", table: "game"},
      handleUpdate
    )
    .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [])

  const handleOpenCommunity = () => {
    setChatView("community")
    setSelectedChat(null)
  }

  const handleOpenPrivateList = () => {
    setChatView("private-list")
  }
  // Esto ayuda a que no se necesite estar haciendo gets para la url y el nickname
  const handleOpenPrivateChat = (chat: FriendChat) => {
    setSelectedChat(chat)
    setChatView("private-chat")
  }

  const handleBackToPrivateList = () => {
    setChatView("private-list")
  }

  console.log(`past game:${pastgame}`);
  return (
    <div>
    <Nav current="Home" />
    <section className="px-4 md:px-14 py-5 bg-zinc-100 w-full flex flex-col gap-6">
      <div>
        {juego ? (<MarcadorActivo juego={juego} />
        ) : (<NextGame />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className=" flex flex-col gap-6">
          {juego ? (<GameSummaryMiniGraph game_id={juego.game_id} refreshKey={miniStatsRefreshKey} pastGame={false}/>) 
          : (pastgame !== null && (<GameSummaryMiniGraph game_id={pastgame} refreshKey={miniStatsRefreshKey} pastGame={true}/>)
          )}
          {!isGameLoading && <MiniBrackets />}
        </div>
        <div className="flex flex-col gap-6 h-full">
          {chatView === "community" && (
            <RealtimeChat
              gameId={juego?.game_id ?? null}
              isGameLoading={isGameLoading}
              onOpenPrivateList={handleOpenPrivateList}
            />
          )}

          {chatView === "private-list" && (
            <ListChats
              onOpenCommunity={handleOpenCommunity}
              onOpenPrivateChat={handleOpenPrivateChat}
            />
          )}

          {chatView === "private-chat" && selectedChat && (
            <PrivateChat
              selectedChat={selectedChat}
              onBack={handleBackToPrivateList}
              onOpenCommunity={handleOpenCommunity}
            />
          )}
        </div>
      </div>
    </section>
    </div>
  )
}

export default Home