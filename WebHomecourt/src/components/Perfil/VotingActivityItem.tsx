import type { VoteActivity } from '../../lib/Perfil/voting'

type VotingActivityItemProps = {
    vote: VoteActivity
    isLast: boolean
    isOwnProfile?: boolean
}

function VotingActivityItem({ vote, isLast, isOwnProfile = true }: VotingActivityItemProps) {
    return (
        <div
            className={`flex flex-col gap-2 px-6 py-4 ${!isLast ? 'border-b border-[#E7E6E8]' : ''}`}
        >

            <div className="flex justify-between items-center">
                <span className="text-[#11061A] text-[14px] font-normal leading-[21px]">
                    {vote.bracketQuestion}
                </span>
                <span className="text-[#A09CA4] text-[12px] font-normal leading-[18px]">
                    {vote.dateVoted}
                </span>
            </div>


            <div className="flex justify-between items-center">
                <span className="text-[13px] leading-[19.5px]">
                    <span className="text-Gris-Oscuro font-normal">
                        {isOwnProfile ? 'You voted: ' : `${vote.userNickname} voted: `}
                    </span>
                    <span className="text-morado-lakers font-normal">{vote.votedOption}</span>
                </span>
                <span className="text-morado-lakers text-[12px] font-normal leading-[18px]">
                    {vote.votePercentage}%
                </span>
            </div>

  
            <div className="w-full h-2 bg-[#E0E0E0] rounded-full overflow-hidden">
                <div 
                    className="h-full bg-morado-lakers rounded-full transition-all duration-300"
                    style={{ width: `${vote.votePercentage}%` }}
                />
            </div>
        </div>
    )
}

export default VotingActivityItem