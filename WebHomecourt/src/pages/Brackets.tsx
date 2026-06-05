import FullBracketsBox from "../components/Brackets/FullBracketsBox"
import LastQuestion from "../components/Brackets/LastQuestion"
import BannerGeneral from '../components/BannerGeneral'
function Brackets() {
  return (
      <div>
        <div className='px-4 md:px-14 py-5 bg-zinc-100 w-full min-h-screen flex flex-col gap-6'>
          <BannerGeneral
            title="Fanvote Brackets"
            subtitle="Help your favorites win by voting for them"
          />
           <FullBracketsBox/> 
          <LastQuestion/>
        </div>
      </div>
    )
}

export default Brackets
