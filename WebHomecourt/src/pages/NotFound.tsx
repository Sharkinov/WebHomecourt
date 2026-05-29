import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="text-gray-500">This page doesn't exist</p>
      <button onClick={() => navigate('/')} className="px-4 py-2 rounded-lg bg-morado-lakers text-white">
        Go home
      </button>
    </div>
  )
}