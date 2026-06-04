import 'leaflet/dist/leaflet.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Agenda from './pages/Agenda'
import Brackets from './pages/Brackets'
import Estadisticas from './pages/Estadisticas'
import LakersCourt from './pages/LakersCourt'
import HistorialLakers from './pages/HistorialLakers';
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
import { WrappedPage } from './pages/Wrapped';
import Comparison from './pages/Comparison';
import Collection from './pages/Collection';
import AppLayout from './components/AppLayout';

import { useAuth } from './context/AuthContext'
import { Navigate } from 'react-router-dom'

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { userType, loading, user } = useAuth()
  
  if (loading) return null
  if (!user) return <Navigate to="/" replace />
  if (userType === null) return null //espera a que fetch user termine
  if (userType !== 1) return <Navigate to="/" replace />
  
  return <>{children}</>
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/session" element={<UserSession />} /> 
        <Route path="/complete-register" element={<CompleteRegister />} />
        <Route path='/edit-avatar' element={<EditAvatar/>}></Route>
        <Route element={<AppLayout />}>
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
          <Route path="/admin" element={<AdminRoute><Admin/></AdminRoute>} />
          <Route path="/admin/report" element={<AdminRoute><ReportDetails /></AdminRoute>} />
          <Route path="/admin/event" element={<AdminRoute><EventReportDetails /></AdminRoute>} />
          <Route path="/editar-perfil" element={<EditarPerfil />} />
          <Route path="/admin/monitor" element={<AdminRoute><Monitor /></AdminRoute>} />
          <Route path='/wrapped' element={<WrappedPage />} />
          <Route path='/comparison' element={<Comparison/>}></Route>
          <Route path='/historial-lakers' element={<HistorialLakers/>}></Route>
          <Route path='/collection' element={<Collection/>}></Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
