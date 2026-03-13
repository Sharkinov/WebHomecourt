import { useEffect, useMemo, useRef, useState } from "react"
import type { FormEvent } from "react"
import { supabase } from "../lib/supabase"

type RealtimeChatProps = {
  gameId?: number | null
  schema?: string
  table?: string
}

type ChatMessage = {
  id: number
  username: string
  message: string
  created_at: string
  game_id: number | null
}

const DEFAULT_SCHEMA = "simulacion_juego"
const DEFAULT_TABLE = "chat_messages"

function RealtimeChat({
  gameId = null,
  schema = DEFAULT_SCHEMA,
  table = DEFAULT_TABLE
}: RealtimeChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [username, setUsername] = useState("")
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const filter = useMemo(() => {
    if (gameId == null) return "game_id=is.null"
    return `game_id=eq.${gameId}`
  }, [gameId])

  useEffect(() => {
    const fetchMessages = async () => {
      setIsLoading(true)
      setError(null)

      let query = supabase
        .schema(schema)
        .from(table)
        .select("id, username, message, created_at, game_id")
        .order("created_at", { ascending: true })
        .limit(60)

      if (gameId == null) {
        query = query.is("game_id", null)
      } else {
        query = query.eq("game_id", gameId)
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        setError("No se pudieron cargar los mensajes.")
        setIsLoading(false)
        return
      }

      setMessages((data ?? []) as ChatMessage[])
      setIsLoading(false)
    }

    void fetchMessages()

    const channel = supabase
      .channel(`realtime-chat-${gameId ?? "global"}-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema,
          table,
          filter
        },
        (payload) => {
          setMessages((current) => {
            const incoming = payload.new as ChatMessage
            if (current.some((item) => item.id === incoming.id)) return current
            return [...current, incoming]
          })
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [filter, gameId, schema, table])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const cleanUsername = username.trim()
    const cleanMessage = message.trim()

    if (!cleanUsername || !cleanMessage) {
      setError("Escribe tu nombre y un mensaje.")
      return
    }

    setIsSending(true)
    setError(null)

    const { error: insertError } = await supabase
      .schema(schema)
      .from(table)
      .insert({
        username: cleanUsername,
        message: cleanMessage,
        game_id: gameId
      })

    if (insertError) {
      setError("No se pudo enviar el mensaje.")
      setIsSending(false)
      return
    }

    setMessage("")
    setIsSending(false)
  }

  return (
    <section className="mt-8 rounded-2xl bg-white p-5 shadow-[0px_4px_16px_rgba(0,0,0,0.15)]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-violet-950">Chat en tiempo real</h2>
        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-800">
          {gameId == null ? "Global" : `Juego ${gameId}`}
        </span>
      </div>

      <div className="h-72 overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3">
        {isLoading ? (
          <p className="text-sm text-zinc-500">Cargando mensajes...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-zinc-500">Todavia no hay mensajes.</p>
        ) : (
          messages.map((item) => (
            <article key={item.id} className="mb-3 rounded-lg bg-white p-3 shadow-sm">
              <div className="mb-1 flex items-center justify-between">
                <strong className="text-sm text-violet-900">{item.username}</strong>
                <time className="text-xs text-zinc-500">
                  {new Date(item.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </time>
              </div>
              <p className="text-sm text-zinc-700">{item.message}</p>
            </article>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="mt-4 grid gap-3 md:grid-cols-[220px_1fr_auto]">
        <input
          className="h-11 rounded-lg border border-zinc-300 px-3 text-sm text-zinc-800 outline-none ring-violet-300 focus:ring"
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="Tu nombre"
          maxLength={40}
        />
        <input
          className="h-11 rounded-lg border border-zinc-300 px-3 text-sm text-zinc-800 outline-none ring-violet-300 focus:ring"
          type="text"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Escribe un mensaje"
          maxLength={240}
        />
        <button
          type="submit"
          disabled={isSending}
          className="h-11 rounded-lg bg-violet-950 px-5 text-sm font-semibold text-white transition hover:bg-violet-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSending ? "Enviando..." : "Enviar"}
        </button>
      </form>

      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </section>
  )
}

export default RealtimeChat