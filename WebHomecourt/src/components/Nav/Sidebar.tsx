import { useNavigate } from 'react-router-dom'

// const DEFAULT_AVATAR = "https://ptbcoxaguvbwprxdundz.supabase.co/storage/v1/object/public/user_images/profile_picture_default.png"
 
interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  navPages: { label: string; path: string }[]
  current: string
  navHeight?: number
}
 
function Sidebar({ isOpen, onClose, navPages, current, navHeight = 72 }: SidebarProps) {
  const navigate = useNavigate()
 
  const handleNavigate = (path: string) => {
    navigate(path)
    onClose()
  }
 
  return (
    <>
      <div
        className={[
          'fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 md:hidden',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        style={{ top: navHeight }}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={[
          'fixed left-0 z-50 w-72 bg-[#f0f2f5] flex flex-col transition-transform duration-300 ease-in-out md:hidden shadow-xl',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        style={{ top: navHeight, height: `calc(100dvh - ${navHeight}px)` }}
      >
        
        <nav className="flex-1 overflow-y-auto px-2 py-3 flex flex-col">
          {navPages.map((p) => {
            const isCurrent = p.label === current
            return (
              <button
                key={p.path}
                type="button"
                onClick={() => handleNavigate(p.path)}
                disabled={isCurrent}
                className={[
                  "w-full text-left px-5 py-4 text-lg font-['Graphik'] transition-colors border-b border-neutral-200/70",
                  isCurrent
                    ? 'text-purple-900 font-bold cursor-default'
                    : 'text-[#1a1a2e] hover:bg-white cursor-pointer',
                ].join(' ')}
              >
                {p.label}
              </button>
            )
          })}
        </nav>
        <div className="border-t border-neutral-200 p-4 bg-white">
          <button
            onClick={() => handleNavigate('/perfil')}
            className="w-full px-4 py-3 rounded-xl bg-purple-900 text-white text-base font-['Graphik'] font-medium hover:opacity-90 transition-opacity"
          >
            My Profile
          </button>
        </div>
      </aside>
    </>
  )
}
 
export default Sidebar