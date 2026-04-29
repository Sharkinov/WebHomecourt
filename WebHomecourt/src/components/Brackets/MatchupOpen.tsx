// components/MatchupOpen.tsx
import { useState } from "react"
import type { Matchup } from "./Brackets"
import { submitVote } from "./insertVote"

type Props = {
  match: Matchup
  refetch:()=> void
}

export default function MatchupOpen({ match, refetch }: Props) {
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)

  async function handleVote(answerId: number) {
    try {
      setLoading(true)
      setSelected(answerId)
      await submitVote(match.matchup_id, answerId)
      await refetch() 
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="flex flex-col gap-2 p-4 border-morado-fosfo border-3 bg-Background rounded-xl shadow">
      <div className="text-center font-bold text-2xl">Vote here</div>
      <button
        onClick={() => handleVote(match.answer_a_id)}
        disabled={loading}
        className={`p-4 rounded-xl text-left text-xl w-full ${
          selected === match.answer_a_id
            ? "bg-morado-bajo text-white"
            : "bg-morado-fosfo text-white font bold hover:bg-disabled "
        }`}
      >
        <span>{match.answer_a_text}</span>
      </button>

      <button
        onClick={() => handleVote(match.answer_b_id)}
        className={` p-4 rounded-xl text-left text-xl w-full ${
          selected === match.answer_b_id
           ? "bg-morado-bajo text-white"
            : "bg-morado-fosfo  text-white hover:bg-disabled"
        }`}
      >
        {match.answer_b_text}
      </button>
    </div>
  )
}