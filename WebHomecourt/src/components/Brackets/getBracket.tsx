import { supabase } from "../../lib/supabase";
import type {Question} from "./Brackets"

export async function getBracketActual(): Promise<Question> {
  const { data, error } = await supabase
    .from('question')
    .select('*')
    .is('winner', null)
    .order('start_date', { ascending: true });

  if (error) {
    console.error("Supabase error:", error.message);
    throw new Error("Failed to get minibrackets");
  }

  const now = new Date();

  // Filtra en el cliente para evitar problemas de timezone
  const active = (data as Question[]).find(q =>
    new Date(q.start_date) <= now && new Date(q.end_date) >= now
  );

  if (!active) throw new Error("No active bracket found");

  return active;
}

export async function getLastQuestion(): Promise<Question> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('question')
    .select('*')
    .lt('end_date', now) 
    .order('end_date', { ascending: false })
    .single()
  if (error) {
    console.error("Supabase error:", error.message);
    throw new Error("Failed to get previous bracket");
  }
  return data;
}