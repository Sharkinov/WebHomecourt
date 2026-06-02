import { supabase } from "../../lib/supabase";

export async function submitVote(
  matchupId: number,
  selectedId: number
) {
  const {
    data: { session }
  } = await supabase.auth.getSession();

  const user = session?.user;

  if (!user) {
    throw new Error("User not logged in");
  }
  const { error } = await supabase
    .from("user_vote")
    .insert({
      user_id: user.id,
      matchup_id: matchupId,
      selected_id: selectedId
    });

  if (error) throw error;
  const { error: creditError } = await supabase.rpc(
    "add_user_credits",
    {
      p_user_id: user.id,
      p_credits: 5
    }
  );

  if (creditError) throw creditError;
}