import Nav from '../components/Nav/Nav'
import { Unity, useUnityContext } from "react-unity-webgl";
import { supabase } from "../lib/supabase";
import type { Session } from "@supabase/supabase-js";
import { useAuth } from "../context/AuthContext"
import { useEffect, useState } from 'react';
import Deck from '../components/Juego/Deck';
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
  const [instructions, setInstructions] = useState<{id: number, title: string, description: string, image: string}[]>([])
  const [tips, setTips] = useState<{id: number, description: string, image: string}[]>([])

  const { unityProvider, sendMessage, isLoaded } = useUnityContext({
    loaderUrl: "/Build/DunkDeploy.loader.js",
    dataUrl: "/Build/DunkDeploy.data.br",
    frameworkUrl: "/Build/DunkDeploy.framework.js.br",
    codeUrl: "/Build/DunkDeploy.wasm.br",
  });

  useEffect(() => {
    const fetchHowToPlay = async () => {
      const [{ data: instructionsData }, { data: tipsData }] = await Promise.all([
        supabase.from('instructions').select('*').order('id'),
        supabase.from('tips').select('*').order('id')
      ])
      if (instructionsData) setInstructions(instructionsData)
      if (tipsData) setTips(tipsData)
    }

    void fetchHowToPlay()
  }, []) // nunca cambia

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

  useEffect(() => {
    if (isLoaded && session?.access_token && session?.user?.id) {
      sendMessage(
        "AppManager",
        "ReceiveSessionFromReact",
        JSON.stringify({
          jwt: session.access_token,
          userId: session.user.id
        })
      );
    }
  }, [isLoaded, session]);

return (
  <div>
    <Nav current="Juego" />
    <section className="px-4 md:px-14 py-5 bg-zinc-100 w-full flex flex-col gap-6">
      <div className="w-full px-3 py-4 md:px-5 md:py-7 bg-morado-oscuro rounded-2xl shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] outline outline-1 outline-offset-[-1px] outline-black/25 flex flex-col gap-4 md:flex-row md:justify-between md:items-center overflow-hidden">
        <h1 className="justify-start text-white title1 text-center md:text-left text-3xl sm:text-4xl lg:text-5xl leading-tight">
          Dunk Royale
        </h1>
        <div className="w-full md:w-auto p-3 sm:p-4 bg-morado-lakers rounded-2xl flex justify-center md:justify-start items-center gap-2.5 overflow-hidden self-stretch md:self-auto">
          <span className="material-symbols-outlined text-amber-400 text-4xl sm:!text-5xl">crown</span>
          <h1 className="justify-start text-white text-3xl sm:text-4xl font-black font">{crowns}</h1>
        </div>
      </div>

      <div className="w-full bg-white rounded-2xl p-7 shadow-sm ring-1 ring-gray-200 mb-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="bg-morado-oscuro rounded-full w-10 h-10 flex items-center justify-center">
            <span className="material-symbols-outlined text-amarillo-lakers text-[20px]">
              auto_stories
            </span>
          </div>
          <h2 className="text-morado-oscuro font-semibold!">How To Play</h2>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          {instructions?.map(section => (
            <div key={section.id} className="flex-1 border-b md:border-b-0 md:border-r border-gray-200 last:border-none pb-4 md:pb-0 pr-0 md:pr-4 flex flex-col">
              <h4 className="text-morado-oscuro mb-1">{section.id}. {section.title}</h4>
              <div className="flex items-center gap-2">
                <p className="text-gray-700 mx-2">{section.description}</p>
                {section.image && (
                  <img src={section.image} className="h-32 w-32 object-contain shrink-0" />
                )}
              </div>
            </div>
          ))}
          <div className="flex-1 pl-0 md:pl-4">
            <h4 className="text-morado-oscuro mb-1">4. Tips</h4>
            <div className="flex items-center">
              <div className="flex flex-col gap-3 mt-2">
                {tips?.map((tip, i) => (
                  <div key={tip.id} className="flex items-center gap-2">
                    <span className="bg-morado-oscuro text-white text-xs rounded-full w-6 h-6 flex items-center justify-center shrink-0">{i + 1}</span>
                    <p className="text-gray-700 mx-1">{tip.description}</p>
                  </div>
                ))}
              </div>
              {tips?.find(t => t.image)?.image && (
                <img src={tips.find(t => t.image)!.image} className="h-32 w-32 object-contain shrink-0" />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="flex justify-center">
          <div className="w-full max-w-[420px] aspect-[9/16]">
            <Unity
              unityProvider={unityProvider}
              style={{ width: "100%", height: "100%" }}
            />
          </div>
        </div>
        <div className="flex flex-col gap-6 max-h-[750px]">
          <Deck />
        </div>
      </div>

    </section>
  </div>
);
}

export default Juego;