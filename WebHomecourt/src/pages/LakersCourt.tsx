import Nav from '../components/Nav'
import Map from "../components/Map"
import NewEvent from '../components/NewEvent'
import ShowEvents from '../components/ShowEvents'
function LakersCourt() {
  return (
    <div>
      <div className="flex flex-col items-center justify-center">
        <Nav current="LakersCourt" />
      </div>
      <div className='px-14 py-5 bg-zinc-100 w-full '>
        <div className="w-full px-5 py-7 bg-violet-950 rounded-2xl shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] outline outline-1 outline-offset-[-1px] outline-black/25 inline-flex flex-col justify-start items-start gap-3.5 overflow-hidden">
          <h1 className="justify-start text-zinc-100">LakersCourt</h1>
        </div>
        
        <div>
          <h1 className="text-2xl font-bold p-5">Events</h1>
          <div className="flex items-center justify-center">
          <NewEvent/>
          <ShowEvents/>
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold p-5">Court Maps</h1>
          <div className="flex items-center justify-center">
          <Map />
          </div>
        </div>
      </div>
    </div>
  )
}

export default LakersCourt
