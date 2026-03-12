
// ac3a5447-1b6f-4324-8830-5ddc2d7b2c47
import 'leaflet/dist/leaflet.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Agenda from './pages/Agenda'
import Brackets from './pages/Brackets'
import Estadisticas from './pages/Estadisticas'
import LakersCourt from './pages/LakersCourt'
import Juego from './pages/Juego'
import Store from './pages/Store'
import Perfil from './pages/Perfil'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/brackets" element={<Brackets />} />
        <Route path="/estadisticas" element={<Estadisticas />} />
        <Route path="/lakerscourt" element={<LakersCourt />} />
        <Route path="/juego" element={<Juego />} />
        <Route path="/store" element={<Store />} />
        <Route path="/perfil" element={<Perfil />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
