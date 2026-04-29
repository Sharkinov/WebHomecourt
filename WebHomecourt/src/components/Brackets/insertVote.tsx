// services/vote.ts
import { supabase } from "../../lib/supabase"
export async function submitVote(matchupId: number, selectedId: number) {
  const {
    data: { session }
  } = await supabase.auth.getSession();

  const user = session?.user;

  if (!user) {
    console.warn("User not logged in");
    return [];
  }
  const { error } = await supabase
    .from("user_vote")
    .insert({
      user_id: user.id,
      matchup_id: matchupId,
      selected_id: selectedId
    })
  if (error) throw error
}