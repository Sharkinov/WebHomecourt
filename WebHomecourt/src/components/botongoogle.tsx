import { supabase } from "../lib/supabase";
import { useState } from "react";

const SignInButton = () => {
  const [isLoading, setIsLoading] = useState(false);

  const signIn = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      setIsLoading(false);
      console.error("Google auth error:", error.message);
    }
  };

  return (
    <button
      onClick={signIn}
      disabled={isLoading}
      className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-zinc-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:cursor-not-allowed disabled:opacity-70"
    >
      <span className="text-base" aria-hidden="true">G</span>
      {isLoading ? "Redirecting..." : "Sign in with Google"}
    </button>
  );
};

export default SignInButton;

// Prueba CI