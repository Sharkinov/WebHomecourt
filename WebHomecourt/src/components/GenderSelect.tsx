import { useEffect, useRef, useState } from "react"
import type { Gender } from "./Perfil/EditProfile"

type Props = {
  genders: Gender[]
  value: number | null
  onChange: (value: number) => void
}

export default function GenderSelect({ genders, value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const selected = genders.find(g => g.gender_id === value)

  return (
    <div className="flex flex-col gap-2" ref={ref}>
      <label>Gender</label>

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="h-12 w-full px-4 rounded-2xl bg-white text-zinc-700 
                   outline outline-1 outline-black/10 
                   focus:outline-2 focus:outline-morado-lakers
                   flex items-center justify-between"
      >
        <span className={value !== null ? "" : "text-zinc-400"}>
          {selected?.gender || "Select"}
        </span>

        <span
          className={`material-symbols-outlined transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        >
          expand_more
        </span>
      </button>
      {open && (
        <div className="mt-2 w-full bg-white rounded-2xl shadow-lg border border-black/10 overflow-hidden">
          {genders.map((g) => (
            <button
              key={g.gender_id}
              type="button"
              onClick={() => {
                onChange(g.gender_id)
                setOpen(false)
              }}
              className={`w-full text-left px-4 py-3 hover:bg-zinc-100 transition-colors
                ${value === g.gender_id ? "bg-zinc-100 font-medium" : ""}
              `}
            >
              {g.gender}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}