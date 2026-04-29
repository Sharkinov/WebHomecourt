import { supabase } from "../../lib/supabase"

export async function getMatchups(question_id: number) {
  const {
    data: { session }
  } = await supabase.auth.getSession();

  const user = session?.user;

  if (!user) {
    console.warn("User not logged in");
    return [];
  }
  
  const { data, error } = await supabase.rpc(
    "get_matchups_for_user",
    {
      p_user_id: user.id,
      p_question_id: question_id
    }
  )
  if (error) throw error

  return data
}