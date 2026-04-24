import { useCallback, useEffect, useRef, useState } from "react"
import type { FriendChat } from "./ListChats"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../context/AuthContext"
import useActualizarMessPriv  from "../../hooks/usePrivateMessagesSubscription"
import { format } from "date-fns"

export type Message = {
  message_id: number
  user_id: string
  nickname: string
  photo_url: string | null
  message: string
  sent: string
  is_mine: boolean
}

type PrivateChatProps = {
  selectedChat: FriendChat
  onBack: () => void
  onOpenCommunity?: () => void
}

// Este solamente tiene que ser para cuando se carga por primera ves
async function getMessages(conversationId: number): Promise<Message[]> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error("No session found")

  const { data, error } = await supabase.rpc("get_messages", {
    p_user_id: session.user.id,
    p_conversation_id: conversationId,
  })

  if (error) throw new Error(error.message)

  return (data ?? []) as Message[]
}

function PrivateChat({ selectedChat, onBack }: PrivateChatProps) {
  const { session, nickname, photoUrl } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const loadMessages = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const msgs = await getMessages(selectedChat.conversation_id)
      setMessages(msgs)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error loading messages"
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [selectedChat.conversation_id])

  useEffect(() => {
    void loadMessages()
  }, [loadMessages])
  //Para utilizar realtime
  useActualizarMessPriv({
    conversationId: selectedChat.conversation_id,
    onMessageReceived: (payload) => {
      const raw = payload.new
      if (raw.user_id === session?.user.id) return
      const incoming: Message = {
        message_id: raw.message_id,
        user_id: raw.user_id,
        nickname: selectedChat.friend_nickname,
        photo_url: selectedChat.friend_photo,
        message: raw.message,
        sent: raw.sent,
        is_mine: false,
      }
      setMessages((prev) => [...prev, incoming])
    },
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    const content = newMessage.trim()
    if (!content || !session) return
    // Para mostrar que se envía sin esperar a que haga el post
    const optimisticMsg: Message = {
      message_id: Date.now(),
      user_id: session.user.id,
      nickname: nickname ?? "You",
      photo_url: photoUrl,
      message: content,
      sent: new Date().toISOString(),
      is_mine: true,
    }
    setMessages((prev) => [...prev, optimisticMsg])
    setNewMessage("")
    try {
      setError(null)
      // INSERT EN BASE DE DATOS
      const { error } = await supabase.from("message").insert({
        user_id: session.user.id,
        conversation_id: selectedChat.conversation_id,
        message: content,
        sent: optimisticMsg.sent,
      })

      if (error) {
        setMessages((prev) => prev.filter((m) => m.message_id !== optimisticMsg.message_id))
        throw new Error(error.message)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo enviar el mensaje"
      setError(message)
    }
  }

  return (
    <div className="w-full max-w-[630px] h-full max-h-[700px] mx-auto flex flex-col bg-white rounded-2xl outline outline-1 outline-black/25 overflow-hidden">

      <div className="px-6 pt-6 pb-2 flex flex-col gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-purple-900 text-2xl"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Back
        </button>

        <div className="flex items-center gap-5">
          <div className="w-16 h-16 relative">
            <div className="w-16 h-16 p-0.5 rounded-full outline outline-2 outline-gray-200 overflow-hidden bg-zinc-100">
              <img
                className="w-16 h-16 object-cover"
                src={selectedChat.friend_photo ?? "https://placehold.co/64x64"}
                alt={selectedChat.friend_nickname}
              />
            </div>
          </div>

          <div className="text-purple-900 text-3xl truncate">
            {selectedChat.friend_nickname}
          </div>
        </div>

        <div className="h-0.5 bg-zinc-500"></div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 flex flex-col gap-2 pt-2">
        {isLoading && (
          <div className="text-zinc-500 text-center">Loading messages...</div>
        )}

        {error && (
          <div className="text-red-600 text-center">{error}</div>
        )}

        {!isLoading && !error && messages.length === 0 && (
          <div className="text-zinc-500 text-center">
            No messages yet. Start the conversation!
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.message_id}
            className="flex gap-4 items-start hover:bg-zinc-100 px-2 py-1 rounded-lg transition"
          >
            <div className="w-12 h-12 rounded-full outline outline-2 outline-gray-200 overflow-hidden bg-zinc-100 flex-shrink-0">
              <img
                className="w-12 h-12 object-cover"
                src={msg.photo_url ?? "https://placehold.co/48x48"}
                alt={msg.nickname}
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-purple-900 text-lg">
                  {msg.nickname}
                </span>

                <span className="text-neutral-400 text-xs whitespace-nowrap">
                  {format(new Date(msg.sent), "dd/MM/yyyy, hh:mm a")
                    .replace("AM", "a.m.")
                    .replace("PM", "p.m.")}
                </span>
              </div>

              <p className="text-zinc-700 text-base break-words">
                {msg.message}
              </p>
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      <div className="px-6 py-4 border-t border-zinc-300">
        <form onSubmit={handleSendMessage} className="flex gap-4">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            maxLength={240}
            className="flex-1 h-11 rounded-2xl border border-black/25 px-4 outline-none focus:ring-2 focus:ring-purple-400 transition"
          />

          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-5 py-2 bg-purple-900 text-zinc-100 text-xl rounded-2xl hover:bg-violet-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Send
          </button>
        </form>
      </div>

    </div>
  )
}

export default PrivateChat