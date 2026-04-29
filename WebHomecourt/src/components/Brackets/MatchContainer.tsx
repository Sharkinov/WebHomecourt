import type { Matchup } from "./Brackets"
import MatchupClosed from "./MatchupClosed";
import MatchupOpen from "./MatchupOpen";
type MatchContainerProps = Matchup & { refetch: () => void }
function MatchContainer( {refetch, ...match }: MatchContainerProps) {
  const active = match.active == true;
  const voted = match.voted !== null;
  return(
    <div>
    {(!voted && active) ? (
      <MatchupOpen match =  {match} refetch={refetch} />
    ):(
      <MatchupClosed match =  {match}/>
    )}
    </div>
  )
}
export default MatchContainer