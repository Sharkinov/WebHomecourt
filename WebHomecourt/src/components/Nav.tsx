import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from "react"
import { getUserById, type User } from './User'
import { MdPayments } from 'react-icons/md';

const pages = [
  { label: 'Home',          path: '/' },
  { label: 'Agenda',        path: '/agenda' },
  { label: 'Brackets',      path: '/brackets' },
  { label: 'Statistics',  path: '/estadisticas' },
  { label: 'LakersCourt',   path: '/lakerscourt' },
  { label: 'Dunk Royale',         path: '/juego' },
  { label: 'Store',         path: '/store' },
  { label: 'Profile',        path: '/perfil' },
]

interface NavProps {
  current: string
}

function Nav({ current }: NavProps) {
  const userId = "ac3a5447-1b6f-4324-8830-5ddc2d7b2c47"
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const loadUser = async () => {
      const data = await getUserById(userId)
      setUser(data)
    }

    loadUser()
  }, [userId])

  return (
    <div className="w-full">
      <div className="mx-auto w-full ">
        <div className="w-full h-10  bg-gradient-to-r from-purple-900 to-amber-400" />

        <div className="w-full px-2 md:px-15 py-6 md:py-2 inline-flex flex-col xl:flex-row justify-between items-center gap-6 overflow-hidden">
          <img
            className="h-20 w-auto object-contain"
            src="/lakers_homecourt.png"
            alt="Homecourt logo"
          />

          <div className="flex flex-wrap justify-center items-center gap-7">
            {pages.map((p) => {
              const isCurrent = p.label === current

              return (
                <button
                  key={p.path}
                  type="button"
                  onClick={() => navigate(p.path)}
                  disabled={isCurrent}
                  className={[
                    "justify-start text-purple-900 text-2xl font-normal font-['Graphik'] transition-opacity",
                    isCurrent ? 'opacity-100 cursor-default' : 'cursor-pointer hover:opacity-70',
                  ].join(' ')}
                >
                  {p.label}
                </button>
              )
            })}
          </div>

          <div className="flex justify-start items-center gap-7">
            <div className="p-2.5 bg-white rounded-2xl outline outline-1 outline-offset-[-1px] outline-black/25 flex justify-start items-center gap-3.5">
              <MdPayments size={30} className="text-amber-400" />
              <div className="justify-start text-black text-2xl font-normal font-['Graphik']">{user?.credits ?? 0}</div>
            </div>

            <div className="w-15 h-15 relative rounded-full outline outline-2 outline-offset-[-2px] outline-gray-200 overflow-hidden bg-gray-300">
              {user?.photo_url && (
                <img
                  className="w-full h-full object-cover"
                  src={user.photo_url}
                  alt="User avatar"
                />
              )}
            </div>
          </div>
        </div>

        <div className="w-full h-0.5 bg-neutral-400/40" />
      </div>
    </div>
  )
}

export default Nav
