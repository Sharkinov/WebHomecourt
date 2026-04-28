import { useNavigate } from 'react-router-dom';
import type { GameItem } from '../../pages/Agenda'; // Has to be a type cosa estupida
import SummaryScoreCard from '../Agenda/GameScore.tsx'; 
import Button from '../button.tsx';
import { format, parseISO } from 'date-fns'; // For date formattings 

// Prop for the game item
type GameProp = {
  games: GameItem[]; 
}

function GameListItem({ games }: GameProp) {
  const navigate = useNavigate(); // Switch to diff screen 
  const homeBaseCSS = "flex flex-col md:flex-row justify-center items-center bg-white rounded-lg outline-2 outline-gray-200 gap-5 mb-7 px-4 py-5 border-l-9";//"flex flex-row justify-left bg-white rounded-lg outline-2 outline-gray-200 gap-5 mb-7 px-4 py-5 border-l-9 justify-center"; // To inject css for home color bar

  if (!games.length) {
    return <p>No games available for this month.</p>
  }

  return (
    <div className="grid">
      <div>
        {games.map(game => (
          <div key={game.game_id} className={`${homeBaseCSS} ${game.home? "border-amarillo-oscuro" : "border-morado-lakers" }`}>
            {/* Left side logo and team name */}
            <div className="flex flex-row flex-1 items-center">
              <img
                src={game.logo_url}
                alt={`Logo ${game.team_name}`}
                className="w-[3rem] max-h[3rem] md:w-[3.75rem] md:max-h-[3.75rem] object-contain flex-shrink-0"
              />
              {/* Name and date */}
              <div className="flex flex-col items-start ml-3">
                <h3 className="font-black">vs {game.team_name} </h3>
                <p>{format(parseISO(game.start_date), "EEE, dd MMM")}</p>
              </div>
            </div>

            {/* Right side */}
            <div className="flex flex-col md:flex-row items-center gap-2 flex-shrink-0 w-full md:w-auto justify-center items-center">
              {/* Show whether won or lost */}
              <SummaryScoreCard lakers_score={game.lakers_score} opposite_score={game.opposite_score}/>

              <Button
                text="Recap"
                type="primary"
                onClick={() => navigate('/estadisticas', { state: { game_id: game.game_id } })} // Redirect by passing game id
                className="w-full md:ml-5 m-2 md:mt-0"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default GameListItem;