import Nav from '../components/Nav'
import UserData from "../components/User"
function Home() {
  return (
    <div>
      <div className="flex flex-col items-center justify-center">
        <Nav current="Home" userId="c1998ce5-a357-4963-bda3-fde103393cdd" />
      </div>
      <div>
        <h1 className="text-5xl font-bold">Home</h1>
        <UserData userId="c1998ce5-a357-4963-bda3-fde103393cdd"/>
      </div>
    </div>
  )
}

export default Home
