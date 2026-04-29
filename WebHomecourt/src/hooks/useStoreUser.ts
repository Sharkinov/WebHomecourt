import { useState, useEffect } from 'react';
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import type { StoreUser } from "./storeTypes.ts";

// Data that is needed to set which user it is and whether they are signed in, fetched from db
export function useStoreUser() {
  const { user } = useAuth();
  const [storeUser, setStoreUser] = useState<StoreUser>({
    user_id: null,
    credits: 0,
    signedIn: false
  });

  useEffect(() => {
    if (!user) {
      setStoreUser({ user_id: null, credits: 0, signedIn: false });
      return;
    }
    supabase
      .from("user_laker")
      .select("credits")
      .eq("user_id", user.id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
            // Didn't fidn a match, means not logged in
          setStoreUser({ user_id: user.id, credits: 0, signedIn: true }); 
        } else {
            // Establishes the info from db
          setStoreUser({ user_id: user.id, credits: data.credits, signedIn: true });
        }
      });
  }, [user]);

  return { storeUser, setStoreUser };
}