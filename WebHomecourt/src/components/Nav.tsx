import { useNavigate } from 'react-router-dom'

const pages = [
  { label: 'Home',          path: '/' },
  { label: 'Agenda',        path: '/agenda' },
  { label: 'Brackets',      path: '/brackets' },
  { label: 'Estadisticas',  path: '/estadisticas' },
  { label: 'LakersCourt',   path: '/lakerscourt' },
  { label: 'Juego',         path: '/juego' },
  { label: 'Store',         path: '/store' },
  { label: 'Perfil',        path: '/perfil' },
]

interface NavProps {
  current: string
}

function Nav({ current }: NavProps) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-wrap gap-3 mt-6">
      {pages
        .filter((p) => p.label !== current)
        .map((p) => (
          <button
            key={p.path}
            onClick={() => navigate(p.path)}
            className="px-5 py-2 bg-white drop-shadow text-black rounded-lg text-base cursor-pointer hover:bg-gray-200 transition-colors"
          >
            {p.label}
          </button>
        ))}
    </div>
  )
}

export default Nav
