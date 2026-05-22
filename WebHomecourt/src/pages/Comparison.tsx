import { useEffect, useState } from "react";
import { getLakersPlayers } from "../components/Comparison/getPlayers";
import { getPlayerSeasons } from "../components/Comparison/getPlayers";
import PlayerCard from "../components/Comparison/PlayerCard";
import type { Player } from "../components/Comparison/Player";
import type { PlayerSeasonAverage } from "../components/Comparison/Player";
import CircleStats from "../components/Comparison/CircleStats";
import SkillStar from '../components/Comparison/Radar';
import Timeline from '../components/Comparison/Timeline';
import BannerGeneral from '../components/BannerGeneral';
function useLakersPlayers() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setTimeout(() => { getLakersPlayers().then(setPlayers); setLoading(false); }, 300);
  }, []);
  return { players, loading };
}

function usePlayerSeasons(teamPlayerId: number | null) {
  const [seasons, setSeasons] = useState<PlayerSeasonAverage[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!teamPlayerId) { setSeasons([]); return; }
    setLoading(true);
    getPlayerSeasons(teamPlayerId).then(setSeasons)
  }, [teamPlayerId]);
  return { seasons, loading };
}

function Comparison() {
  const { players} = useLakersPlayers();
  const [p1Id, setP1Id] = useState<number | null>(null); //id player 
  const [p1Season, setP1Season] = useState<number | null>(null); //id season
  const [p2Id, setP2Id] = useState<number | null>(null);
  const [p2Season, setP2Season] = useState<number | null>(null);
  useEffect(() => {
    if (players.length > 0 && p1Id === null) {
      setP1Id(7);
    }
  }, [players]);
  useEffect(() => {
    if (players.length > 0 && p2Id === null) {
      setP2Id(22);
    }
  }, [players]);
  const { seasons: s1} = usePlayerSeasons(p1Id);//lista de seasons 
  const { seasons: s2} = usePlayerSeasons(p2Id);
  const seasons1= s1.map(r => r.season_start); //años de las temporadas
  const seasons2= s2.map(r => r.season_start);
  const p1 = players.find(p => p.team_player_id === p1Id) ?? null; //datos player seleccionado
  const p2 = players.find(p => p.team_player_id === p2Id) ?? null;
  const stats1 = s1.find(r => r.season_start === p1Season) ?? null; //datos temporada seleccionada
  const stats2 = s2.find(r => r.season_start === p2Season) ?? null;

  //mas reciente como default
  useEffect(() => { if (s1.length) setP1Season(s1[s1.length - 1].season_start); }, [s1]);
  useEffect(() => { if (s2.length) setP2Season(s2[s2.length - 1].season_start); }, [s2]);

  return (
    <div >
      <div className='px-4 md:px-14 py-5 bg-zinc-100 w-full min-h-screen flex flex-col gap-6'>
        <BannerGeneral
          title="Player Comparison"
          subtitle="Compare Lakers members and their past season averages"
        />
        <div className="grid grid-cols-2 gap-4">
            <PlayerCard
              player={p1} season={p1Season}
              players={players} seasons={seasons1}
              onPlayerChange={id => { setP1Id(id); setP1Season(null); }}
              onSeasonChange={setP1Season}
              color1={'morado-lakers'}
              color2={'amarillo-lakers'}
            />
            <PlayerCard
              player={p2} season={p2Season}
              players={players} seasons={seasons2}
              onPlayerChange={id => { setP2Id(id); setP2Season(null); }}
              onSeasonChange={setP2Season}
              color1={'amarillo-lakers'}
              color2={'morado-lakers'}
            />
          </div>

          {/* circulos*/}
          <div>
            {(stats1 || stats2) && (
              <div>
                <h1 className="pt-4">Season Averages</h1>
                  <div className="py-2 grid grid-cols-2 md:grid-cols-5 gap-3">
                    <CircleStats label="Points" p1={p1} p2={p2} v1={stats1?.points_per_game ?? null}  v2={stats2?.points_per_game ?? null} max={90} />
                    <CircleStats label="Rebounds" p1={p1} p2={p2} v1={stats1?.rebounds_per_game ?? null} v2={stats2?.rebounds_per_game ?? null} max={35} />
                    <CircleStats label="Assists" p1={p1} p2={p2} v1={stats1?.assists_per_game ?? null} v2={stats2?.assists_per_game ?? null} max={30} />
                    <CircleStats label="Steals" p1={p1} p2={p2} v1={stats1?.steals_per_game ?? null} v2={stats2?.steals_per_game ?? null} max={10} />
                    <CircleStats label="Accuracy %" p1={p1} p2={p2} v1={stats1?.fg_pct ?? null} v2={stats2?.fg_pct ?? null} max={100} />
                </div>
                <h1 className="pt-4">Advanced Stats</h1>
                  <div className='flex flex-col md:flex-row gap-6 pt-6'>
                    {/* estrella de stats*/}
                    <div className ='w-full md:w-1/3'>
                      <SkillStar s1={stats1} s2={stats2}></SkillStar>
                    </div>
                    <div className ='w-full md:w-2/3'>
                      <Timeline p1={p1} p2={p2} s1={s1} s2={s2}></Timeline>
                    </div> 
                </div> 
              </div>
            )}
          </div>
        </div>
    </div>
  )
}
export default Comparison
