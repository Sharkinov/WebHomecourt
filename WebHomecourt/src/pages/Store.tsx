import { useEffect, useState } from 'react'
import { supabase } from "../lib/supabase"
import { useNavigate } from 'react-router-dom';
import Nav from '../components/Nav/Nav.tsx'
import StoreRow from '../components/LakerStore/StoreRow.tsx'
import Button from '../components/button.tsx';
import { useStoreUser } from '../hooks/useStoreUser.ts'; // Hook for store user
import type { StorePacks } from "../hooks/storeTypes.ts"; // Types

// API calls
// Gets the listing of all packs to display on website
async function getPacksStore() {
  // Call supabase funct
  const { data, error } = await supabase.rpc("get_packs_store");

  // Smth died
  if (error) {
    console.error("Supabase error:", error.message)
    throw new Error("Failed to get packs")
  }

  console.log("raw rpc data:", data);
  console.log("is array?", Array.isArray(data));

  // Data is not formatted as array, entcs hace un array vacío and sends that will show no user colls
  if (!Array.isArray(data)) return []

  console.log("raw data:", JSON.stringify(data, null, 2)) // A ver como se ve lo q fue fetched

  // Takes results del data and turns into the CollectedCard obj
  const packs: StorePacks[] = data.map(row => {
    // Creates the game items 
    return {
      pack_id: row.pack_id, // Pack data empty if no cards are present for that category
      pack_type_id: row.pack_type_id,
      name: row.name,
      closed_URL: row.closed_URL,
      tear_URL: row.tear_URL,
      opening_URL: row.opening_URL,
      pack_name: row.pack_name,
      cost: row.cost, // Pack data empty if no cards are present for that category
      num_cards: row.num_cards, // Pack data empty if no cards are present for that category
      is_active: row.is_active
    }
  });

  return packs;
}

function Store() {
  const navigate = useNavigate(); // Switch to diff screen
  const [packs, setPacks] = useState<StorePacks[]>([]); // Array w packs
  const { storeUser, setStoreUser } = useStoreUser(); // Use hook

  // Initial function to render
  useEffect(() => {
    async function loadPacks() {
      try {
        const result = await getPacksStore();
        setPacks(result);
      } catch (err) {
        console.error(err);
      }
    }

    loadPacks();
  }, []);

  useEffect(() => {
    if (!storeUser.signedIn) {
      console.log("User not signed in");
    } else if (storeUser.credits === 0) {
      console.log("No credits found for user or poor");
    } else {
      console.log(`User ${storeUser.user_id} has ${storeUser.credits} credits`);
    }
  }, [storeUser]);

  // To show new creds once has more money 
  function handleCreditsUpdated(newCredits: number) {
    setStoreUser((prev) => ({
      ...prev,
      credits: newCredits,
    }));
  }

  return (
    <div>
      <Nav current="Store" creditsOverride={storeUser?.credits} />
      <div className="px-4 py-5 md:px-14 md:py-5 bg-Background w-full">
        {/* Title comp */}
        <div className="w-full px-3 py-4 md:px-5 md:py-7 bg-violet-950 rounded-2xl shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] outline outline-1 outline-offset-[-1px] outline-black/25 flex flex-col justify-left items-left overflow-hidden">
          <h1 className="justify-start text-white title1">Laker Card Store</h1>
          <p className="justify-start text-white mt-2 text-xl text-zinc-300">Unlock more cards featuring your favorite players and improve your Dunk Royale game deck</p>
        </div>
        
        {/* View store vs colection */}
        <div className="flex flex-row justify-left mt-10">
          <Button
            text="STORE"
            type="primary"
            onClick={() => {} }
            className="text-2xl font-semibold px-10 mr-8"
          />

          <Button
            text="COLLECTION"
            type="secondary"
            onClick={() => navigate('/collection')}
            className="text-2xl font-semibold px-10"
          />
        </div>

        {/* Load the packs by giving id of each section */}
        {/*<p>{storeUser.credits} and {storeUser.signedIn? "Signed in" : "Not signed in"}</p>*/}
        <StoreRow packTypeId={1} packs={packs} storeUser={storeUser} onCreditsUpdated={handleCreditsUpdated} />
        <StoreRow packTypeId={2} packs={packs} storeUser={storeUser} onCreditsUpdated={handleCreditsUpdated} />
        <StoreRow packTypeId={3} packs={packs} storeUser={storeUser} onCreditsUpdated={handleCreditsUpdated} />
        <StoreRow packTypeId={4} packs={packs} storeUser={storeUser} onCreditsUpdated={handleCreditsUpdated} />
      </div>
    </div>
  )
}

export default Store