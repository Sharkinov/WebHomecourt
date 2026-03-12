import Nav from '../components/Nav'
import Map from "../components/Map"
import NewEvent from '../components/NewEvent'
import ShowEvents from '../components/ShowEvents'
function LakersCourt() {
  return (
    <div>
      <div className="flex flex-col items-center justify-center p-10">
        <h1 className="text-5xl font-bold">LakersCourt</h1>
        <Nav current="LakersCourt"  />
      </div>
      
      <div>
        <h1 className="text-2xl font-bold p-5">Eventos</h1>
        <div className="flex items-center justify-center">
        <NewEvent/>
        <ShowEvents/>
        </div>
      </div>
      <div>
        <h1 className="text-2xl font-bold p-5">Mapa de canchas</h1>
        <div className="flex items-center justify-center">
        <Map />
        </div>
      </div>
    </div>
  )
}

export default LakersCourt
