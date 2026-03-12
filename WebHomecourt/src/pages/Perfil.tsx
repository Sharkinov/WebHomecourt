import Nav from '../components/Nav'
import UserData from "../components/User"
function Perfil() {
  return (
    <div>
      <div className="flex flex-col items-center justify-center">
        <Nav current="Perfi" userId="c1998ce5-a357-4963-bda3-fde103393cdd" />
      </div>
      <div>
        <h1 className="text-5xl font-bold">Perfil</h1>
        <UserData userId="c1998ce5-a357-4963-bda3-fde103393cdd"/>
      </div>
    </div>
  )
}

export default Perfil
