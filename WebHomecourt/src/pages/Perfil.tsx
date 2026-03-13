import Nav from '../components/Nav'
import UserData from "../components/User"
function Perfil() {
  return (
    <div>
      <div className="flex flex-col items-center justify-center">
        <Nav current="Perfi" />
      </div>
      <div>
        <h1 className="text-5xl font-bold">User Profile</h1>
        <UserData userId="ac3a5447-1b6f-4324-8830-5ddc2d7b2c47"/>
      </div>
    </div>
  )
}

export default Perfil
