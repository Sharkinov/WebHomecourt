import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { getUserById, type User } from '../User'
import { useAuth } from '../../context/AuthContext'
import Sidebar from './Sidebar.tsx'
import { getPendingRequests, type FriendRequest } from '../../lib/Perfil/friends'

const DEFAULT_AVATAR =
  'https://ptbcoxaguvbwprxdundz.supabase.co/storage/v1/object/public/user_images/profile_picture_default.png'

const pages = [
  { label: 'Home', path: '/' },
  { label: 'Agenda', path: '/agenda' },
  { label: 'Statistics', path: '/estadisticas' },
  { label: 'LakersCourt', path: '/lakerscourt' },
  { label: 'Dunk Royale', path: '/juego' },
  { label: 'Store', path: '/store' },
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

  // Notifications state
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [lastSeenCount, setLastSeenCount] = useState(0)
  const notificationRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadUser = async () => {
      if (!authUser?.id) return
      const data = await getUserById(authUser.id)
      setUser(data)
    }
    loadUser()
  }, [authUser?.id])

  useEffect(() => {
    const loadNotifications = async () => {
      if (!authUser?.id) return
      const requests = await getPendingRequests(authUser.id)
      setPendingRequests(requests)
    }

    loadNotifications()
    const interval = setInterval(loadNotifications, 900000) // 15 min
    return () => clearInterval(interval)
  }, [authUser?.id])

  // Cerrar modal al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }

    if (showNotifications) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showNotifications])

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
    return () => {
      document.body.style.overflow = ''
    }
  }, [sidebarOpen])

  useEffect(() => {
    if (sidebarOpen) setShowNotifications(false)
  }, [sidebarOpen])

  const navPages = userType === 1 ? [...pages, { label: 'Admin', path: '/admin' }] : pages

  const credits = typeof creditsOverride === 'number' ? creditsOverride : user?.credits ?? 0

  const hasNewNotifications = pendingRequests.length > lastSeenCount

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
                    isCurrent
                      ? 'opacity-100 cursor-default font-semibold'
                      : 'cursor-pointer hover:opacity-60',
                  ].join(' ')}
                >
                  {p.label}
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <div ref={notificationRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowNotifications((v) => !v)
                  // Cerrar modal al hacer click fuera
                  if (!showNotifications) setLastSeenCount(pendingRequests.length)
                }}
                className="relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full text-purple-900 hover:bg-purple-50 transition-colors"
                aria-label="Notifications"
              >
                <span className="material-symbols-outlined text-2xl md:text-3xl">
                  notifications
                </span>

                {hasNewNotifications && (
                  <span className="absolute top-1 right-1 min-w-5 h-5 px-1 bg-red-600 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                    {pendingRequests.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div
                  className="absolute right-0 mt-2 w-80 bg-white rounded-[15px] shadow-xl border border-gray-200 overflow-hidden"
                  style={{ zIndex: 9999 }}
                >
                  <div className="p-4 border-b border-gray-200">
                    <h3
                      className="text-texto-oscuro text-sm"
                      style={{ fontFamily: 'Graphik', fontWeight: 500 }}
                    >
                      Notifications
                    </h3>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {pendingRequests.length === 0 ? (
                      <div
                        className="p-6 text-center text-Gris-Oscuro"
                        style={{ fontFamily: 'Graphik' }}
                      >
                        No new notifications
                      </div>
                    ) : (
                      pendingRequests.map((request) => (
                        <div
                          key={request.friend_request_id}
                          className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={request.photo_url || DEFAULT_AVATAR}
                              alt={request.nickname}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div className="flex-1">
                              <p
                                className="text-texto-oscuro text-sm font-medium"
                                style={{ fontFamily: 'Graphik' }}
                              >
                                {request.nickname} sent you a friend request
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {pendingRequests.length > 0 && (
                    <div className="p-3 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => {
                          setShowNotifications(false)
                          navigate('/my-friends', { state: { activeTab: 'pending' } })
                        }}
                        className="w-full bg-morado-oscuro hover:bg-morado-hover text-white py-2 rounded-[10px] transition-colors text-sm font-medium"
                        style={{ fontFamily: 'Graphik' }}
                      >
                        View All Requests
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-2 bg-white rounded-2xl shadow-sm outline outline-1 outline-black/20 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-400 text-2xl leading-none">
                payments
              </span>
              <span className="text-black text-lg font-normal font-['Graphik']">{credits}</span>
            </div>

            <button
              type="button"
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
