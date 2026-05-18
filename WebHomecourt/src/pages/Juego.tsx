import Nav from '../components/Nav/Nav'
import { Unity, useUnityContext } from "react-unity-webgl";
import { supabase } from "../lib/supabase";
import type { Session } from "@supabase/supabase-js";
import { useAuth } from "../context/AuthContext"
import { useEffect, useState } from 'react';

async function getUserCrowns(session: Session | null): Promise<number> {
  if (!session?.user?.id) {
    return 0
  }
  const { data, error } = await supabase
    .from('user_laker')
    .select('crowns')
    .eq('user_id', session.user.id)
    .single()

  if (error) throw error
  return data.crowns
}

function Juego() {
  const { session } = useAuth();
  const [crowns, setCrowns] = useState(0);
  const { unityProvider } = useUnityContext({
    loaderUrl: "/Build/RETO.loader.js",
    dataUrl: "/Build/RETO.data",
    frameworkUrl: "/Build/RETO.framework.js",
    codeUrl: "/Build/RETO.wasm",
  });

  const refreshCrowns = async () => {
    try {
      const userCrowns = await getUserCrowns(session);
      setCrowns(userCrowns);
    } catch (error) {
      console.error('Error loading crowns:', error);
      setCrowns(0);
    }
  };

  useEffect(() => {
    void refreshCrowns();
  }, [session])

  useEffect(() => {
    if (!session?.user?.id) {
      setCrowns(0);
      return;
    }

    const channel = supabase
      .channel('coronas-juego')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'minigame_match' },
        () => {
          void refreshCrowns();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [session]);

  return (
    <div>
      <Nav current="Juego" />
      <section className="px-4 md:px-14 py-5 bg-zinc-100 w-full flex flex-col gap-6">
        <div className="w-full px-3 py-4 md:px-5 md:py-7 bg-morado-oscuro rounded-2xl shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] outline outline-1 outline-offset-[-1px] outline-black/25 flex md:justify-between items-center overflow-hidden">
          <h1 className="justify-start text-white title1">Dunk Royale</h1>
          <div className="p-4 bg-morado-lakers rounded-2xl flex justify-start items-center gap-2.5 overflow-hidden">
            <span className="!text-5xl text-amber-400 material-symbols-outlined">crown</span>
            <h1 className="justify-start text-white text-4xl font-black font">{crowns}</h1>
          </div>
        </div>

        <div className="w-[90vw] max-w-[1600px] aspect-video">
          <Unity
            unityProvider={unityProvider}
            style={{
              width: "100%",
              height: "90%",
            }}
          />
        </div>
      </section>
    </div>
  );
}

export default Juego;