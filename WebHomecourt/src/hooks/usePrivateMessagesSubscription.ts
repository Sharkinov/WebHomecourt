import { useEffect, useRef } from "react"
import { supabase } from "../lib/supabase"

type UseActualizarPrivateParam = {
  conversationId?: number
  listenToAll?: boolean
  onMessageReceived?: (payload: any) => void
}

//Hook para escuchar cambios en mensajes privados en tiempo real
//Solo re-renderiza el componente que lo usa, no toda la página
function useActualizarMessPriv({conversationId, listenToAll = false, onMessageReceived,}: UseActualizarPrivateParam) {
  // Guardando el callback para no estarlo creando y destruyendo en los renders
  const callbackRef = useRef(onMessageReceived)
  useEffect(() => {
    callbackRef.current = onMessageReceived
  })
  useEffect(() => {
    // No hacer nada si no hay nada que escuchar
    if (!conversationId && !listenToAll) return
    const channel = supabase.channel(
      listenToAll ? "private-messages:all" : `private-messages:${conversationId}`
    )
    const config = {
      // lo acabo de cambiar para solo escuchar insert y usar websockets durante la conversacion
      event: "INSERT" as const,
      schema: "public" as const,
      table: "message" as const,
    }
    if (listenToAll) {
      // Escuchar TODOS los cambios en la tabla de mensajes
      // AQUI ESTOY USANDO WEBSOCKETSSS por medio de WAL
      channel.on("postgres_changes", config, (payload) => {
        onMessageReceived?.(payload)
      })
    } else if (conversationId) {
      // Escuchar solo cambios de una conv
      channel.on(
        "postgres_changes",
        { ...config, filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          onMessageReceived?.(payload)
        }
      )
    }

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, listenToAll])
}

export default useActualizarMessPriv;
