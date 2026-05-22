import { useAuth } from "../context/AuthContext";
import type { StoreUser } from "./storeTypes.ts";

// Store screens use the same credits source as the navbar to avoid duplicate fetches.
export function useStoreUser() {
  const { user, credits, setCredits } = useAuth();

  const storeUser: StoreUser = {
    user_id: user?.id ?? null,
    credits,
    signedIn: !!user,
  };

  const setStoreUser = (value: StoreUser | ((prev: StoreUser) => StoreUser)) => {
    setCredits((prevCredits) => {
      const previous: StoreUser = {
        user_id: user?.id ?? null,
        credits: prevCredits,
        signedIn: !!user,
      };
      const next = typeof value === "function" ? value(previous) : value;
      return next.credits;
    });
  };

  return { storeUser, setStoreUser };
}
