import Nav from '../components/Nav'

function Agenda() {
  return (
    <div className="flex flex-col items-center justify-center  ">
      <Nav current="Agenda" />
      <div className='px-14 py-5 bg-zinc-100'>
        <div className="self-stretch px-5 py-7 bg-violet-950 rounded-2xl shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] outline outline-1 outline-offset-[-1px] outline-black/25 inline-flex justify-between items-center overflow-hidden">
            <h1 className="justify-start text-zinc-100 text-4xl font-black font-['Graphik']">Agenda</h1>
            <h3 className="justify-start text-white text-3xl font-normal font-['Graphik']">2025 - 2026 Season</h3>
        </div>
      </div>
    </div>
  )
}

export default Agenda
