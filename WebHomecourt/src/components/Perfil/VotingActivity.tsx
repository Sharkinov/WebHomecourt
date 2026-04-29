import { useEffect, useState } from 'react'
import { getUserVotingActivity } from '../../lib/Perfil/voting'
import type { VoteActivity } from '../../lib/Perfil/voting'
import VotingActivityItem from './VotingActivityItem'

type VotingActivityProps = {
    userId: string
}

function VotingActivity({ userId }: VotingActivityProps) {
    const [votes, setVotes] = useState<VoteActivity[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadVotes() {
            setLoading(true)
            const votingData = await getUserVotingActivity(userId)
            console.log("VOTING DATA:", votingData)
            setVotes(votingData) 
            setLoading(false)
        }

        if (userId) {
            loadVotes()
        }
    }, [userId])

    if (loading) {
        return (
            <div className="bg-white rounded-[15px] overflow-hidden border border-black/8 shadow-[0_4px_4px_0_rgba(0,0,0,0.08)]">
            
                <div className="h-[59px] bg-morado-oscuro flex items-center px-6">
                    <span className="text-[#F3F2F3] text-[18px]">
                        Voting Activity
                    </span>
                </div>
            
                <div className="p-6 space-y-4">
                    <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-2 bg-gray-200 rounded w-full"></div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-[15px] overflow-hidden border border-black/8 shadow-[0_4px_4px_0_rgba(0,0,0,0.08)]">
       
            <div className="h-[59px] bg-morado-oscuro flex items-center px-6">
                <span className="text-[#F3F2F3] text-[18px] font-normal leading-[27px]">
                    Voting Activity
                </span>
            </div>

  
            {votes.length === 0 ? (
                <div className="p-6 text-center text-Gris-Oscuro">
                    No voting activity yet
                </div>
            ) : (
                <div>
                    {votes.map((vote, index) => (
                        <VotingActivityItem 
                            key={vote.id} 
                            vote={vote} 
                            isLast={index === votes.length - 1}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export default VotingActivity