import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from "react"
import { getUserById, type User } from '../User'
import { useAuth } from '../../context/AuthContext'
import Sidebar from './Sidebar.tsx'

const DEFAULT_AVATAR = "https://ptbcoxaguvbwprxdundz.supabase.co/storage/v1/object/public/user_images/profile_picture_default.png"

const pages = [
  { label: 'Home',        path: '/' },
  { label: 'Agenda',      path: '/agenda' },
  { label: 'Statistics',  path: '/estadisticas' },
  { label: 'LakersCourt', path: '/lakerscourt' },
  { label: 'Dunk Royale', path: '/juego' },
  { label: 'Store',       path: '/store' },
]

interface NavProps {
  current: string
  creditsOverride?: number
}
 
function Nav({ current, creditsOverride }: NavProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [navHeight, setNavHeight] = useState(72)
  const navRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { user: authUser, userType } = useAuth()
  const [user, setUser] = useState<User | null>(null)
 
  useEffect(() => {
    const loadUser = async () => {
      if (!authUser?.id) return
      const data = await getUserById(authUser.id)
      setUser(data)
    }
    loadUser()
  }, [authUser?.id])
 
  // Measure the real navbar height so sidebar starts exactly below it
  useEffect(() => {
    const update = () => {
      if (navRef.current) setNavHeight(navRef.current.offsetHeight)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
 
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [sidebarOpen])
 
  const navPages = userType === 1
    ? [...pages, { label: 'Admin', path: '/admin' }]
    : pages
 
  const credits = typeof creditsOverride === 'number' ? creditsOverride : user?.credits ?? 0
 
  return (
    <>
      <div ref={navRef}>
        <div className="w-full h-2 bg-gradient-to-r from-purple-900 to-amber-400" />
        <nav className="w-full px-4 md:px-10 py-3 flex items-center justify-between gap-4 bg-white">
          <button
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-purple-900 hover:bg-purple-50 transition-colors"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
          >
            <span className="material-symbols-outlined text-2xl">
              {sidebarOpen ? 'close' : 'menu'}
            </span>
          </button>
          <img
            className="h-14 md:h-16 w-auto object-contain flex-shrink-0"
            src="/lakers_homecourt.png"
            alt="Homecourt logo"
          />
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {navPages.map((p) => {
              const isCurrent = p.label === current
              return (
                <button
                  key={p.path}
                  type="button"
                  onClick={() => navigate(p.path)}
                  disabled={isCurrent}
                  className={[
                    "text-purple-900 text-lg lg:text-xl font-normal font-['Graphik'] transition-opacity whitespace-nowrap",
                    isCurrent ? 'opacity-100 cursor-default font-semibold' : 'cursor-pointer hover:opacity-60',
                  ].join(' ')}
                >
                  {p.label}
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-2xl shadow-sm outline outline-1 outline-black/20 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-400 text-2xl leading-none">payments</span>
              <span className="text-black text-lg font-normal font-['Graphik']">{credits}</span>
            </div>
 
            <button
              onClick={() => navigate('/perfil')}
              className="w-10 h-10 md:w-12 md:h-12 rounded-full outline outline-2 outline-offset-[-2px] outline-gray-200 overflow-hidden bg-gray-300 cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
            >
              <img
                className="w-full h-full object-cover"
                src={user?.photo_url || DEFAULT_AVATAR}
                alt="User avatar"
              />
            </button>
          </div>
        </nav>
 
        <div className="w-full h-px bg-neutral-400/30" />
      </div>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navPages={navPages}
        current={current}
        navHeight={navHeight}
      />
    </>
  )
}
 
export default Nav