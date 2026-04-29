
import Nav from '../components/Nav/Nav'

import FullBracketsBox from "../components/Brackets/FullBracketsBox"
import LastQuestion from "../components/Brackets/LastQuestion"

function Brackets() {
  return (
      <div>
        <Nav current="Brackets" />
        <div className='px-4 md:px-14 py-5 bg-zinc-100 w-full min-h-screen flex flex-col gap-6'>
          <div className="w-full p-6 bg-[#3B195C] rounded-2xl shadow outline-black/25 inline-flex flex-col gap-3">
            <h1 className=" text-zinc-100">Fanvote Brackets</h1>
            <h5 className=" text-white">Help your favorites win by voting for them</h5>
          </div>
           <FullBracketsBox/> 
          <LastQuestion/>
        </div>
      </div>
    )
}

export default Brackets
