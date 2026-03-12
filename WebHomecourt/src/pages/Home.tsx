import Nav from '../components/Nav'
import UserData from "../components/User"
function Home() {
  return (
    <div>
      <div className="flex flex-col items-center justify-center">
        <Nav current="Home" userId="ac3a5447-1b6f-4324-8830-5ddc2d7b2c47" />
      </div>
      <div>
        <h1 className="text-5xl font-bold">Home</h1>
        <UserData userId="ac3a5447-1b6f-4324-8830-5ddc2d7b2c47"/>
      </div>
    </div>
  )
}

export default Home
