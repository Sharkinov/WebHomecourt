import { supabase } from '../supabase'

export type VoteActivity = {
    id: number
    bracketQuestion: string
    votedOption: string
    votePercentage: number
    dateVoted: string
    userNickname?: string
}

export async function getUserVotingActivity(userId: string): Promise<VoteActivity[]> {
    if (!userId) return []

    // Obtener nickname del usuario
    const { data: userData } = await supabase
        .from('user_laker')
        .select('nickname')
        .eq('user_id', userId)
        .single()

    const userNickname = userData?.nickname || 'User'

    const { data: userVotes, error } = await supabase
        .from('user_vote')
        .select('id, matchup_id, selected_id, date_voted')
        .eq('user_id', userId)
        .order('date_voted', { ascending: false })
        .limit(5)

    console.log("1. userVotes:", userVotes)
    console.log("1. error:", error)

    if (error) return []
    if (!userVotes || userVotes.length === 0) return []

    const results: VoteActivity[] = []

    for (const vote of userVotes) {
        console.log("2. procesando vote:", vote)

        const { data: matchup, error: matchupError } = await supabase
            .from('matchup')
            .select('question_id')
            .eq('matchup_id', vote.matchup_id)
            .single()

        console.log("3. matchup:", matchup, "error:", matchupError)
        if (!matchup) continue

        const { data: question, error: questionError } = await supabase
            .from('question')
            .select('question_text')
            .eq('question_id', matchup.question_id)
            .single()

        console.log("4. question:", question, "error:", questionError)

        const { data: answer, error: answerError } = await supabase
            .from('answer')
            .select('answer_text')
            .eq('answer_id', vote.selected_id)
            .single()

        console.log("5. answer:", answer, "error:", answerError)

        if (!question || !answer) continue

        const { count: totalVotes, error: totalError } = await supabase
            .from('user_vote')
            .select('id', { count: 'exact', head: true })
            .eq('matchup_id', vote.matchup_id)

        console.log("6. totalVotes:", totalVotes, "error:", totalError)

        const { count: optionVotes, error: optionError } = await supabase
            .from('user_vote')
            .select('id', { count: 'exact', head: true })
            .eq('matchup_id', vote.matchup_id)
            .eq('selected_id', vote.selected_id)

        console.log("7. optionVotes:", optionVotes, "error:", optionError)

        const percentage = totalVotes && totalVotes > 0
            ? Math.round((optionVotes || 0) / totalVotes * 100)
            : 0

        console.log("8. percentage:", percentage)

        const formattedDate = new Date(vote.date_voted).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short'
        })

        results.push({
            id: vote.id,
            bracketQuestion: question.question_text,
            votedOption: answer.answer_text,
            votePercentage: percentage,
            dateVoted: formattedDate,
            userNickname: userNickname
        })

        console.log("9. results after push:", results)
    }

    return results
}