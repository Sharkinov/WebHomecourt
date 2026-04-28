import { supabase } from "../lib/supabase";
import { useState } from "react";

type GoogleButtonProps = {
  variant?: "login" | "register";
};

const GoogleButton =  ({ variant = "login" }: GoogleButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const signIn = async () => {
    setIsLoading(true);
    const redirectPath = variant === "register" ? "/complete-register" : "/";
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}${redirectPath}`, // TEMPORARY REDIRECT
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
        className="inline-flex justify-center gap-2 rounded-2xl outline-2 outline-morado-lakers bg-white px-3 py-2.5 font-semibold text-morado-lakers hover:text-morado-bajo hover:outline-morado-bajo selected:text-morado-oscuro selected:outline-morado-oscuro"
      >
        <img src="/GoogleLogo.png" alt="G" className="w-6 h-6 mr-2"></img>
        {isLoading ? "Redirecting..." : "Continue with Google"}
      </button>
  );
};

export default GoogleButton;