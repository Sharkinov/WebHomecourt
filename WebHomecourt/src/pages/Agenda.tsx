import { useEffect, useState } from 'react';
import { supabase } from "../lib/supabase";
import Nav from '../components/Nav/Nav.tsx';
import Button from '../components/button.tsx';
import GameListItem from '../components/Agenda/GameListItem.tsx';
import GameUpcoming from '../components/Agenda/GameUpcomingItem.tsx';
import Calendar from '../components/Agenda/Calendar.tsx';

// Actually used in query
export type GameItem = {
  game_id: number,
  opposing_team_id: number,
  home: boolean,
  start_date: string,
  game_end_time: string | null, // No val recieved cast as null just in case
  team_name: string,
  logo_url: string, // Opp team pic
  // Calculated by funct 
  lakers_score: number,
  opposite_score: number
};

// API call using current year and month and compares against the user selected date day: number, hour: number, minutes: number, currentDate: Date
async function getGames(year: number, month: number) {
  //let allGames: Array<GameItem>; // For agenda to disp all games 
  // Query using all of the info w parametrized values to obtain all of the games in the current year and month selected 
  // Connection to supabase, calls function in supabase passing param of year and month
  const { data, error } = await supabase.rpc("get_agenda_games", {
    p_year: year,
    p_month: (month + 1), // Must add month cause they're 0 based in typescript
  });

  // Smth died
  if (error) {
    console.error("Supabase error:", error.message)
    throw new Error("Failed to get games in current month and year")
  }

  // Data is not formatted as array, entcs hace un array vacío and sends that will show no user colls
  if (!Array.isArray(data)) return []

  console.log("raw data:", JSON.stringify(data, null, 2)) // A ver como se ve lo q fue fetched

  // Takes results del data and turns into the CollectedCard obj
  const games: GameItem[] = data.map(row => {
    // Creates the game items 
    return {
      game_id: row.game_id,
      opposing_team_id: row.opposing_team_id,
      home: row.home,
      start_date: row.start_date,
      game_end_time: row.game_end_time,
      team_name: row.team_name,
      logo_url: row.logo_url, // Opp team pic
      // Calculated by funct 
      lakers_score: row.lakers_score,
      opposite_score: row.opposite_score
    }
  });

  return games;
}

function Agenda() {
  const [showUpcoming, setShowUpcoming] = useState(true); // Shows upcoming default but can switch to past 

  // Default date set to right now
  const [currentDate] = useState(new Date());
  const [agendaDate, setAgendaDate] = useState(new Date());

  // All fetched games here
  const [allGames, setAllGames] = useState<GameItem[]>([]);

  // Initial function to render
  useEffect(() => {
    // This code runs once after the initial render
    console.log("Agenda accessed");
    console.log(`Current date ${currentDate}`);

    // Handle dates for agenda 
    const year = agendaDate.getFullYear();
    const month = agendaDate.getMonth();
    const day = agendaDate.getDate(); // Changed to first of the month for now can only toggle to view either full past or full upcoming games from other months 
    const hour = agendaDate.getHours(); // See if i can change to 12:01 am to show all
    const minutes = agendaDate.getMinutes(); // Would be a 1 min

    // For me to see info
    console.log(`Selected year: ${year}, month: ${month}, day: ${day}, time: ${hour}:${minutes}`);

    // Calls functs and then sets all the games found to the allGames arr here , day, hour, minutes, currentDate
    getGames(year, month)
      .then(games => setAllGames(games));

    // Auto navigation to show view that best matches navigation altering
    if (agendaDate < currentDate) {
      setShowUpcoming(false);
    } else if (agendaDate > currentDate) {
      setShowUpcoming(true);
    }
  }, [agendaDate, currentDate]);

  // Div into pastgames checking if curr game item is smaller than current date and checks game is marked as done
  const pastGames = allGames.filter(
    (game) => new Date(game.start_date) < currentDate && game.game_end_time !== null
  );

  // Upcoming game in a future date or has null end time aka still in progress porque se rompe sin el &&
  const upcomingGames = allGames.filter(
    (game) => new Date(game.start_date) >= currentDate || game.game_end_time === null
  );
  
  return (
    <div>
      <Nav current="Agenda" />
      <div className="px-4 py-5 md:px-14 md:py-5 bg-zinc-100 w-full">
        {/* Title comp */}
        <div className="w-full px-3 py-4 md:px-5 md:py-7 bg-violet-950 rounded-2xl shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] outline outline-1 outline-offset-[-1px] outline-black/25 flex md:justify-between items-center overflow-hidden">
          <h1 className="justify-start text-white title1">Agenda</h1>
          {/*<h3 className="justify-start text-white">2025 - 2026 Season</h3>*/}
        </div>

        {/* Setup for agenda and matches list using grid */}
        <div className="flex flex-col md:grid md:grid-cols-6 gap-4 mt-4 ">
          {/* Space for agenda */}
          <div className="md:col-span-2 text-center bg-white p-4 rounded-2xl outline outline-2 outline-gray-200">
            <Calendar
              agendaDate={agendaDate}
              games={allGames}
              onChangeMonth={setAgendaDate}
            />
          </div>

          {/* Side list view spanning 4 cols w buttons */}
          <div className="md:col-span-4 bg-transparent p-4">
            {/* Game type toggles*/}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2 md:mb-4">
              <div className="col-span-1 mb-2">
                <Button
                  text="Upcoming Games"
                  type={showUpcoming ? 'primary' : 'secondary'}
                  onClick={() => setShowUpcoming(true)}
                  className="w-full"
                />
              </div>
              <div className="col-span-1 mb-2">
                <Button
                  text="Past Games"
                  type={!showUpcoming ? 'primary' : 'secondary'}
                  onClick={() => setShowUpcoming(false)}
                  className="w-full"
                />
              </div>
            </div>

            {/* Agenda list view, each item spans all 4 cols */}
            <div className="flex flex-col gap-2">
              {/* if showUpcoming == true, shows the UpcomingGameItem w upcomingGames list; else shows PastGameItem w pastGames list reversed to show from closer to curr date backwards*/}
              {showUpcoming ? <GameUpcoming games={upcomingGames} currentDate={currentDate} /> : <GameListItem games={pastGames.reverse()} />}
            </div>

          </div>

        </div>

      </div>
    </div>
  )
}

export default Agenda
