import { useNavigate } from 'react-router-dom'

function Home() {
  const navigate = useNavigate()

  const handleLogout = () => {
    navigate('/')
  }

  return (
    <div style={{ maxWidth: 800, margin: '60px auto', textAlign: 'center' }}>
      <h1>Bienvenido a Home 🏠</h1>
      <p>Iniciaste sesión correctamente.</p>
      <button onClick={handleLogout}>Cerrar sesión</button>
    </div>
  )
}

export default Home
