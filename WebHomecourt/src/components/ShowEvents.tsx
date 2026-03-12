import { supabase } from "../lib/supabase"
import { useEffect, useState } from "react"

type Event = { 
  event_id: number
  created_user_id: string 
  event_name: string
  court_id: string 
  max_players: number
  min_age: number 
  max_age: number 
  skill_level_id: number
  allow_event: boolean 
}


export async function getEvents(): Promise<Event[] | null> {
  const { data, error } = await supabase
    .from("event")
    .select("*")

  if (error) {
    console.error("Supabase error:", error.message)
    throw new Error("Failed to fetch")
  }

  return data
}

function Events() {
  const [events, setEvents] = useState<Event[]>([])

  useEffect(() => {
    const loadEvents = async () => {
      const data = await getEvents()
      if (data) {
        setEvents(data)
      }
    }

    loadEvents()
  }, [])

  return (
    <div>
    <div className="p-10">
      {events.map((eve) => (
       
        <div className="p-2" key={eve.event_id}>
          <h2>{eve.event_name}</h2>
          <p>ID: {eve.event_id}</p>
          <p>Max players: {eve.max_players}</p>
          <p>minimum age:{eve.min_age} maximum age:{eve.max_age}</p>
        </div>
      ))}
    </div>
    </div>
  )
}

export default Events