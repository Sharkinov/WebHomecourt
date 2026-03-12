import { supabase } from "../lib/supabase"
import { useEffect, useState } from "react"

type NewEvent = {
  created_user_id: string 
  event_name: string 
  court_id: number
  date: string 
  max_players: number   
  min_age: number 
  max_age: number 
  skill_level_id: number|null
  allow_event: boolean 
}
async function createEvent(event: NewEvent) {
  const { error } = await supabase
    .from("event")
    .insert([event])   
  if (error) {
    console.error("Supabase error:", error.message)
    throw new Error("Failed to create event")
  }
}

export default function CreateEvent() {
  const [form, setForm] = useState<NewEvent>({
    created_user_id: "ac3a5447-1b6f-4324-8830-5ddc2d7b2c47",
    event_name: "",
    date: new Date().toISOString().split("T")[0],
    court_id: 1,
    max_players: 0,
    min_age: 0,
    max_age: 0,
    skill_level_id: null,
    allow_event: true
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createEvent(form)
      alert("Event created!")
      window.location.reload()
    } catch {
      alert("Error creating event")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-10 space-y-4 px-5 py-2 bg-white drop-shadow rounded-lg">
      <p><input name="event_name" placeholder="Event Name" onChange={handleChange} /></p>
      <p><input name="date" type="date" value={form.date} onChange={handleChange}/></p>
      <p><input name="court_id" type="number" placeholder="Court ID" onChange={handleChange} /></p>
      <p><input name="max_players" type="number" placeholder="Max Players" onChange={handleChange} /></p>
      <p><input name="min_age" type="number" placeholder="Min Age" onChange={handleChange} /></p>
      <p><input name="max_age" type="number" placeholder="Max Age" onChange={handleChange} /></p>
      <p><input name="skill_level_id" type="number" placeholder="Skill Level" onChange={handleChange} /></p>
      <button className="drop-shadow text-black rounded-lg" type="submit">
        Create Event
      </button>
    </form>
  )
}