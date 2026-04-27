import { useEffect, useState } from 'react'
import { supabase } from "../lib/supabase"
import { getGenders } from '../components/Perfil/EditProfile'
import type { Gender } from '../components/Perfil/EditProfile'
import GenderSelect from '../components/GenderSelect'

function CompleteRegister() {
  const [userId, setUserId] = useState<string | null>(null)
  const [username, setUsername] = useState("")
  const [nickname, setNickname] = useState("")
  const [birthdate, setBirthdate] = useState("")
  const [gender, setGender] = useState<number | null>(null)
  const [genders, setGenders] = useState<Gender[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.auth.getUser()
      setUserId(data.user?.id ?? null)

      const genderData = await getGenders()
      setGenders(genderData)
    }

    fetchData()
  }, [])

  const handleContinue = () => {
    console.log({ userId, username, nickname, birthdate, gender })
  }

  const placeholderImg = "https://placehold.co/400x400/E5E7EB/9CA3AF?text=Avatar"

  return (
    <div className="min-h-screen bg-zinc-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          <div className="w-full max-w-md mx-auto md:mx-0">
            <div className="flex flex-col items-center md:items-start">
              <img
                src="/lakers_homecourt.png"
                className="h-10 object-contain mb-6"
              />
              <h1 className="text-morado-lakers mb-1 text-center md:text-left">More about you</h1>
              <p className="text-gray-600 mb-6 text-center md:text-left">How would you be known?</p>
              <div className="md:hidden w-full flex justify-center mb-6">
                <div className="relative w-60 h-60">
                  <img
                    src={placeholderImg}
                    className="w-full h-full object-cover rounded-3xl"
                  />
                  <button className="absolute -right-3 -bottom-3 w-16 h-16 rounded-full bg-[#2B0B45] flex items-center justify-center shadow-lg">
                    <span className="material-symbols-outlined text-white text-2xl">
                      edit
                    </span>
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-5 w-full">
                <div className="flex flex-col gap-2">
                  <label>Username</label>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="@username"
                    className="h-12 w-full px-4 rounded-2xl bg-white text-zinc-700 outline outline-1 outline-black/10 focus:outline-2 focus:outline-morado-lakers"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label>Preferred name</label>
                  <input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Preferred name"
                    className="h-12 w-full px-4 rounded-2xl bg-white text-zinc-700 outline outline-1 outline-black/10 focus:outline-2 focus:outline-morado-lakers"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label>Date of birth</label>
                  <input
                    type="date"
                    value={birthdate}
                    onChange={(e) => setBirthdate(e.target.value)}
                    className="h-12 w-full px-4 rounded-2xl bg-white text-zinc-700 outline outline-1 outline-black/10 focus:outline-2 focus:outline-morado-lakers"
                  />
                </div>
                <GenderSelect
                  genders={genders}
                  value={gender}
                  onChange={setGender}
                />
                <button
                  onClick={handleContinue}
                  className="h-12 w-full rounded-2xl bg-morado-lakers text-white text-xl font-semibold"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
          <div className="w-full hidden md:flex justify-end">
            <div className="relative w-full max-w-sm">
              <img
                src={placeholderImg}
                className="w-full aspect-square rounded-3xl object-cover"
              />

              <button className="absolute -right-3 -bottom-3 w-20 h-20 rounded-full bg-[#2B0B45] flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-white text-4xl">
                  edit
                </span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default CompleteRegister