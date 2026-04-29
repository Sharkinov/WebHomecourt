import { useEffect, useState, useCallback } from "react"
import { getMatchups } from "./getMatchups"
import type { Matchup } from "./Brackets"
import MatchContainer from "./MatchContainer"
import type { Question } from "./Brackets"
import { getBracketActual } from './getBracket'

function FullBracketsBox() {
    const [question, setQuestion] = useState<Question | null> (null);
    useEffect(() => {
        const loadQuestion = async () => {
            try {
                const q = await getBracketActual()
                setQuestion(q)
            } catch (error) {
                console.error("Error loading question:", error)
                setQuestion(null)
            }
        }
    loadQuestion();},[]);

    const [matchups, setMatchups] = useState<Matchup[]>([])
    const [refreshing, setRefreshing] = useState(false)
    const sortedMatchups = [...matchups].sort(
        (a, b) => a.round - b.round || a.position - b.position
    )
    const fetchMatchups = useCallback(async () => {
        if (!question) return;
        setRefreshing(true)
        const data = await getMatchups(question.question_id)
        setMatchups(data)// actualiza datos
        setRefreshing(false)
    }, [question])

    useEffect(() => {
        fetchMatchups();
    }, [fetchMatchups]);
    {/* Agrupa por ronda y renderiza en columnas */}
    const rounds = sortedMatchups.reduce<Record<number, Matchup[]>>((acc, m) => {
    acc[m.round] = [...(acc[m.round] ?? []), m]
    return acc
    }, {})
    const roundLabels: Record<number, string> = {
    1: 'Round of 16',
    2: 'Quarter finals',
    3: 'Semifinals',
    4: 'Final',
    }

    return(
        <div className="bg-white p-6 rounded-2xl shadow">
            {question && ( 
            <h1 className="self-stretch text-center justify-start text-morado-oscuro text-2xl p-2 md:text-3xl "> {question.question_text}</h1>)}
            {(question && matchups.length === 0) ? (<h3 className="self-stretch text-center justify-start text-morado-oscuro p-2  ">Log in to participate </h3>):(
            <div className={`flex flex-row gap-6 p-6 w-full overflow-x-auto transition-opacity ${refreshing ? 'opacity-60' : 'opacity-100'}`}>
                
                {Object.entries(rounds)
                .sort(([a], [b]) => +a - +b)
                .map(([roundNum, roundMatchups], ri) => (
                    <div key={roundNum} className="flex flex-col gap-2 min-w-[200px] w-full">

                    {/* nombre de ronda */}
                    <span className="text-xl font-semibold text-Gris-Oscuro tracking-widest mb-1 text-center">
                        {roundLabels[+roundNum] ?? `Ronda ${roundNum}`}
                    </span>
                    {/* matchups */}
                    <div className="flex flex-col justify-around flex-1" style={{
                        gap: `${Math.pow(2, ri) * 1}rem`
                        }}>
                        {roundMatchups.map((m) => (
                        <MatchContainer key={m.matchup_id} {...m} refetch={fetchMatchups} />
                        ))}
                    </div>
                </div>
                ))}
            </div>
            )}
        </div>
    )
}

export default FullBracketsBox