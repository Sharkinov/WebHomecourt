import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import ChatPanelFrame from "./ChatPanelFrame.tsx"
import useActualizarMessPriv  from "../../hooks/usePrivateMessagesSubscription"

export type FriendChat = {
  friendship_id: number
  conversation_id: number
  friend_id: string
  friend_nickname: string
  friend_photo: string | null
  friend_online: boolean | null
  last_message: string | null
  last_message_sent: string | null
  last_message_sender_id: string | null
}

// Para saber cual esta abierto
type ListChatsProps = {
  onOpenCommunity?: () => void
  onOpenPrivateChat?: (chat: FriendChat) => void
}

// Lista de chats privados
export async function getFriendsConvBySession(): Promise<FriendChat[]> {
  const {data: { session },} = await supabase.auth.getSession()
  if (!session) {
    throw new Error("No session found")
  }
  const { data, error } = await supabase.rpc("get_friend_chats", {p_user_id: session.user.id,})
  if (error) {
    console.error("Supabase error:", error.message)
    throw new Error("Failed to get friend chats")
  }
  return (data ?? []) as FriendChat[]
}

function ListChats({ onOpenCommunity, onOpenPrivateChat }: ListChatsProps) {
  const [data, setData] = useState<FriendChat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchChats = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const chats = await getFriendsConvBySession()
      setData(chats)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error loading chats"
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar chats inicialmente
  useEffect(() => {
    fetchChats()
  }, [])

  // Escuchar cambios en mensajes privados y refrescar la lista
  useActualizarMessPriv({
    listenToAll: true,
    onMessageReceived: (payload) => {
      const raw = payload.new
      setData((prev) => {
        const idx = prev.findIndex((c) => c.conversation_id == raw.conversation_id)
        if (idx === -1) return prev
        const updated: FriendChat = {
          ...prev[idx],
          last_message: raw.message,
          last_message_sent: raw.sent,
          last_message_sender_id: raw.user_id,
        }
        // mueve el chat actualizado al tope de la lista
        const rest = prev.filter((_, i) => i !== idx)
        return [updated, ...rest]
      })
    },
  })

  const renderFriendRow = (chat: FriendChat) => (
    <button
      type="button"
      onClick={() => onOpenPrivateChat?.(chat)}
      key={chat.friendship_id}
      className="self-stretch p-2.5 rounded-2xl inline-flex justify-start items-center gap-5 overflow-hidden text-left hover:bg-zinc-100 transition">
      <div className="w-16 h-16 relative shrink-0">
        <div className="w-16 h-16 p-0.5 left-0 top-0 absolute rounded-full outline outline-2 outline-offset-[-2px] outline-gray-200 inline-flex flex-col justify-start items-start overflow-hidden bg-zinc-100">
          <img className="w-16 h-16 object-cover" src={chat.friend_photo ?? "https://placehold.co/64x64"}/>
        </div>
      </div>
      <div className="min-w-0 inline-flex flex-col justify-start items-start gap-1.5">
        <h4 className="self-stretch text-purple-900 text-2xl font-normal font-['Graphik'] truncate">{chat.friend_nickname}</h4>
        <p className="self-stretch text-zinc-700 text-base font-normal font-['Graphik'] truncate">{chat.last_message ?? "No messages yet"}</p>
      </div>
    </button>
  )

  return (
    <ChatPanelFrame title="Real-Time Chat" activeTab="private" onOpenCommunity={onOpenCommunity}>
      {isLoading && (
        <div className="self-stretch text-zinc-500 text-lg font-normal font-['Graphik']">Loading chats...</div>
      )}
      {error && (
        <div className="self-stretch text-red-600 text-base font-normal font-['Graphik']">
          Could not load chats, try to refresh the page.
        </div>
      )}
      {!isLoading && !error && (
        <div className="flex flex-col gap-7">
          <div className="self-stretch flex flex-col justify-start items-start gap-3.5">
            {data.length > 0 ? (
              data.map((chat) => renderFriendRow(chat))
            ) : (
              <div className="self-stretch text-zinc-500 text-base font-normal font-['Graphik']">
                Add new friends to start a new conversation.
              </div>
            )}
          </div>
          <div className="self-stretch h-0.5 bg-zinc-500"></div>
          <div className="self-stretch text-center text-zinc-500 text-xl font-normal font-['Graphik']">
            Select a friend to start chatting
          </div>
        </div>
      )}
    </ChatPanelFrame>
  )
}

export default ListChats
