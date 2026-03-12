import Nav from '../components/Nav'

function Estadisticas() {
  return (
    <div className="flex flex-col items-center justify-center  ">
      <Nav current="Estadistica" />
      <div className='px-14 py-5 bg-zinc-100 w-full '>
        <div className="w-full px-5 py-7 bg-violet-950 rounded-2xl shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] outline outline-1 outline-offset-[-1px] outline-black/25 inline-flex flex-col justify-start items-start gap-3.5 overflow-hidden">
          <div className="justify-start text-zinc-100 text-4xl font-black font-['Graphik']">Statistics</div>
        </div>
      </div>
    </div>
  )
}

export default Estadisticas
