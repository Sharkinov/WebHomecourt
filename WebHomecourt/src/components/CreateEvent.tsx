import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { getSkillLevels, type SkillLevel } from "../services/apiEvents";
import { getCourts, type Court } from "../services/apiMAP";

interface propsPopup {
  open: boolean;
  onClose: () => void;
}

interface DatosEvento {
    event_name: string | "";
    court_id : number | "";
    date: string;
    time: string;
    max_players : number | "";
    min_age: number | "";
    max_age: number | "";
    skill_level_id: number | null | "";
}

async function createEvent(event: DatosEvento) {
  const payload = {
    event_name: event.event_name,
    date: event.date && event.time ? `${event.date}T${event.time}:00-06:00` : event.date,
    court_id:       event.court_id      !== "" ? Number(event.court_id)      : null,
    min_age:        event.min_age       !== "" ? Number(event.min_age)        : null,
    max_age:        event.max_age       !== "" ? Number(event.max_age)        : null,
    max_players:    event.max_players   !== "" ? Number(event.max_players)    : null,
    skill_level_id: (event.skill_level_id !== "" && event.skill_level_id !== null) ? Number(event.skill_level_id) : null,
  }

  const { error } = await supabase
    .from("event")
    .insert([payload])

  if (error) {
    console.error("Supabase error:", error.message)
    throw new Error("Failed to create event")
  }
}

export default function CrearEvento ({open, onClose}: propsPopup){
    const [courts, setCourts] = useState<Court[] | null>(null);
    console.log(courts);
    const navigate = useNavigate()
    const [formData, setFormData] = useState<DatosEvento>({
        event_name: "",
        court_id: "",
        date: "",
        time: "",
        max_players: "",
        min_age: "",
        max_age: "",
        skill_level_id: null,
    });
    
    useEffect(()=>{
        const loadCourts = async() => {
            const data = await getCourts();
            setCourts(data);
        };
        loadCourts();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement

    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value
    }))
  }

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
     console.log("FormData:", formData)
    try {
      await createEvent(formData)
      alert("Event created!")
    //   window.location.reload() Es mejor el navigate pq no recarga desde 0 la pagina
      navigate(0)
    // onClose()
    } catch {
      alert("Error creating event")
    }
  }


      if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <div className="relative z-10 w-full max-w-md rounded-lg bg-white shadow-lg overflow-hidden">
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-6 bg-morado-lakers">
              <div className="flex items-start justify-between mb-1">
                <h2 className="text-2xl font-bold text-Background">Create New Event</h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-Background">Choose event details</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
              {/* Event Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="event_name"
                  type="text"
                  value={formData.event_name}
                  onChange={handleChange}
                  placeholder="e.g. Pickup Game, 3v3 Tournament"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder:text-disabled"
                />
              </div>

              {/* Court */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Court <span className="text-red-500">*</span>
                </label>
                <select
                  name="court_id"
                  value={formData.court_id}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="">Select a court</option>
                  {
                    courts?.map((court) => (
                        <option key={court.court_id} value={court.court_id}>
                            {court.name}
                        </option>
                    ))
                  }
                </select>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleChange}
                    placeholder="DD/MM/YY"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder:text-disabled"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="time"
                    type="time"
                    value={formData.time}
                    onChange={handleChange}
                    placeholder="--:-- ----"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder:text-disabled"
                  />
                </div>
              </div>

              {/* Max Players */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Players
                </label>
                <input
                  name="max_players"
                  type="number"
                  value={formData.max_players}
                  onChange={handleChange}
                  placeholder="10"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder:text-disabled"
                />
              </div>

              {/* Age Range and Skill Level */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age Range
                  </label>
                  <select
                    name="min_age"
                    value={formData.min_age}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="">Any</option>
                    <option value="18">18+</option>
                    <option value="21">21+</option>
                    <option value="30">30+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skill Level
                  </label>
                  <select
                    name="skill_level_id"
                    value={formData.skill_level_id ?? ""}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="">Any</option>
                    <option value="1">Beginner</option>
                    <option value="2">Intermediate</option>
                    <option value="3">Advanced</option>
                  </select>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
  )

}

