import { useEffect, useState } from 'react'
import { supabase } from "../lib/supabase"

function CompleteRegister() {
    const [userId, setUserId] = useState<string | null>(null)
    const [username, setUsername] = useState("")
    const [nickname, setNickname] = useState("")
    const [birthdate, setBirthdate] = useState("")
    const [gender, setGender] = useState("Male")
    // Obtener user id para comprobar la sesion
    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
        setUserId(data.user?.id ?? null)
        })
    }, [])
    const handleContinue = () => {
        // agregar logica despues
        console.log({ userId, username, nickname, birthdate, gender })
    }

    return (
    <div className="min-h-screen bg-zinc-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          <div className="w-full max-w-md">
            <div className="flex flex-col items-start">
              <img
                src="/lakers_homecourt.png"
                alt="Lakers Homecourt"
                className="h-10 object-contain mb-6"
              />

              <h1 className="text-morado-lakers text-4xl md:text-5xl font-black mb-3">
                More about you
              </h1>
              <p className="text-gray-700 text-lg mb-8">How would you be known?</p>

              <div className="flex flex-col gap-5 w-full">
                <div className="flex flex-col gap-2">
                  <label className="text-black text-lg font-medium">Username</label>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="@username"
                    className="h-12 w-full px-4 rounded-2xl bg-white text-zinc-700 placeholder:text-zinc-400 outline outline-1 outline-black/10 focus:outline-2 focus:outline-morado-lakers"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-black text-lg font-medium">Preferred name</label>
                  <input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Preferred name"
                    className="h-12 w-full px-4 rounded-2xl bg-white text-zinc-700 placeholder:text-zinc-400 outline outline-1 outline-black/10 focus:outline-2 focus:outline-morado-lakers"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-black text-lg font-medium">Date of birth</label>

                  <div className="relative">
                    <input
                      type="date"
                      value={birthdate}
                      onChange={(e) => setBirthdate(e.target.value)}
                      className={[
                        "h-12 w-full px-4 pr-12 rounded-2xl bg-white text-zinc-700",
                        "outline outline-1 outline-black/10 focus:outline-2 focus:outline-morado-lakers",
                        // esconde icono default en webkit para que usemos el nuestro
                        "[&::-webkit-calendar-picker-indicator]:opacity-0",
                        "[&::-webkit-calendar-picker-indicator]:absolute",
                        "[&::-webkit-calendar-picker-indicator]:right-0",
                        "[&::-webkit-calendar-picker-indicator]:w-12",
                        "[&::-webkit-calendar-picker-indicator]:h-full",
                        "[&::-webkit-calendar-picker-indicator]:cursor-pointer",
                      ].join(" ")}
                    />
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                      calendar_today
                    </span>
                  </div>

                  {/* Placeholder visual cuando está vacío (opcional) */}
                  {/* {!birthdate && (
                    <p className="text-sm text-zinc-400 -mt-1">mm/dd/yyyy</p>
                  )} */}
                </div>

                {/* Gender */}
                <div className="flex flex-col gap-2">
                  <label className="text-black text-lg font-medium">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="h-12 w-full px-4 rounded-2xl bg-white text-zinc-700 outline outline-1 outline-black/10 focus:outline-2 focus:outline-morado-lakers"
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Non-binary</option>
                    <option>Prefer not to say</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleContinue}
                  className="h-12 w-full rounded-2xl bg-morado-lakers text-white text-xl font-semibold hover:opacity-90 transition-opacity"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: avatar card (como tu imagen) */}
          <div className="w-full flex md:justify-end">
            <div className="relative w-full max-w-sm">
              <div className="w-full aspect-square rounded-3xl bg-morado-lakers flex items-center justify-center overflow-hidden">
                {/* Aquí pon tu imagen real */}
                <div className="w-44 h-44 rounded-full bg-amber-400/90" />
              </div>

              {/* Botón flotante editar */}
              <button
                type="button"
                className="absolute -right-3 -bottom-3 w-20 h-20 rounded-full bg-[#2B0B45] flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
                aria-label="Edit avatar"
              >
                <span className="material-symbols-outlined text-white text-4xl">
                  edit
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* (Opcional) Debug */}
        {/* <pre className="mt-10 text-xs text-zinc-500">{JSON.stringify({ userId }, null, 2)}</pre> */}
      </div>
    </div>
  )
}
export default CompleteRegister