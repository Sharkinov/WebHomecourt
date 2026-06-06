import { supabase } from "../lib/supabase";

export async function addCredits(userId: string, credits: number): Promise<void> {
  const { error } = await supabase.rpc("add_user_credits", {
    p_user_id: userId,
    p_credits: credits,
  });

  if (error) throw error;
}
