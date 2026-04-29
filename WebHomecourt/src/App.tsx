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
import Admin from './pages/Admin';
import ReportDetails from './pages/ReportDetails';
import Login from './pages/Login'
import Register from './pages/Register'
// import { AuthContextProvider } from "../context/AuthContext.jsx"
import UserSession from './pages/UserSession' // Ejemplo usando sesión de usuairo
import EventReportDetails from './pages/EventReportDetails'
import EditarPerfil from './pages/EditarPerfil';
import CompleteRegister from './pages/CompleteRegister';
import Monitor from './pages/Monitor';
import EditAvatar from './pages/EditAvatar';
import MyFriends from './pages/MyFriends';

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
        <Route path="/perfil/:userId" element={<Perfil />} />
        <Route path="/my-friends" element={<MyFriends />} />
        <Route path="/admin" element={<Admin/>} />
        <Route path="/admin/report/:id" element={<ReportDetails />} />
        <Route path="/admin/event/:id" element={<EventReportDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/session" element={<UserSession />} /> 
        <Route path="/editar-perfil" element={<EditarPerfil />} />
        <Route path="/complete-register" element={<CompleteRegister />} />
        <Route path="/admin/monitor/:id" element={<Monitor />} />

        <Route path='/edit-avatar' element={<EditAvatar/>}></Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
