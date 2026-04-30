import { useEffect, useState } from 'react'
import { getUserMatches, type MatchItem } from '../../lib/Perfil/matches'

type Props = {
    userId: string
}

function LakerscourtMatches({ userId }: Props) {
    const [matches, setMatches] = useState<MatchItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadMatches() {
            setLoading(true)
            const matchesData = await getUserMatches(userId)
            setMatches(matchesData)
            setLoading(false)
        }

        if (userId) {
            loadMatches()
        }
    }, [userId])

    if (loading) {
        return (
            <div className="bg-white rounded-[15px] overflow-hidden border border-black/8 shadow-[0_4px_4px_0_rgba(0,0,0,0.08)]">
                <div className="h-[59px] bg-morado-oscuro flex items-center justify-between px-6">
                    <span className="text-[#F3F2F3] text-[18px]">
                        LakersCourt Matches
                    </span>
                </div>
                <div className="p-6 space-y-4">
                    <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-[15px] overflow-hidden border border-black/8 shadow-[0_4px_4px_0_rgba(0,0,0,0.08)]">
            <div className="h-[59px] bg-morado-oscuro flex items-center justify-between px-6">
                <span className="text-[#F3F2F3] text-[18px]">
                    LakersCourt Matches
                </span>
            </div>

            {matches.length === 0 ? (
                <div className="p-6 text-center text-Gris-Oscuro">
                    No matches yet
                </div>
            ) : (
                <div className="divide-y divide-[#E7E6E8]">
                    {matches.map((match) => (
                        <div
                            key={match.id}
                            className="px-6 py-6 flex items-center gap-4"
                        >
                            <div className="w-10 h-10 bg-[#542581] rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="material-symbols-outlined text-amarillo-lakers text-xl">
                                    sports_basketball
                                </span>
                            </div>

                            {/* INFO DEL MATCH */}
                            <div className="flex-1 min-w-0">
                                <div className="text-[#11061A] text-[14px] font-normal leading-[21px] truncate">
                                    {match.eventName}
                                </div>
                                <div className="text-sm text-[#A09CA4]">
                                    {match.result} {match.userScore}-{match.opponentScore}
                                </div>
                            </div>

                            {/* Fecha */}
                            <div className="text-sm text-[#A09CA4] flex-shrink-0">
                                {match.date}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default LakerscourtMatches
