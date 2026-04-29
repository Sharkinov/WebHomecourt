import type { Matchup } from "./Brackets"
function MatchupClosed({match}:{match: Matchup}) {
  match.winner_id
  return(
    <div className="flex flex-col gap-2 p-4 border-[#E7E6E8] border-1 bg-[#E7E6E8] rounded-xl shadow">
      <div>
        <div className="space-y-2">
          <div className={`p-4 rounded-xl text-xl ${
            (match.answer_a_id === null) ? "bg-gris-disabled text-white flex justify-center items-center" : 
            (match.answer_a_id === match.winner_id) ? "bg-morado-oscuro text-white" : 
            (match.answer_a_id === match.voted) ? "bg-morado-fosfo text-white" : "bg-gris-disabled text-white "}`}>
            <div>
              {(match.answer_a_id == null) ? (
                <div>TBD</div>
              ):(
                <div className = "flex justify-between">
                <span>{match.answer_a_text}</span>
                <span>{match.percent_a}%</span>
                </div>
              )}
            </div>
          </div>
          <div className={`p-4 rounded-xl text-xl ${
            (match.answer_b_id === null) ? "bg-gris-disabled text-white flex justify-center items-center" : 
            (match.answer_b_id === match.winner_id) ? "bg-morado-oscuro text-white" : 
            (match.answer_b_id === match.voted) ? "bg-morado-fosfo text-white" : "bg-gris-disabled text-white"}`}>
            <div>
              {(match.answer_b_id == null) ? (
                <div>TBD</div>
              ):(
                <div className = "flex justify-between">
                <span>{match.answer_b_text}</span>
                <span>{match.percent_b}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default MatchupClosed