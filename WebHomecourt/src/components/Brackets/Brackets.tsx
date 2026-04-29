export interface Question {
  question_id: number
  question_text: string
  start_date: string
  end_date: string
  winner: string
}

export type Matchup = {
  matchup_id: number
  round: number
  position: number
  winner_id: number | null
  answer_a_id: number
  answer_a_text: string | null
  answer_b_id: number
  answer_b_text: string| null
  percent_a: number
  percent_b: number
  active: boolean
  voted: number
}