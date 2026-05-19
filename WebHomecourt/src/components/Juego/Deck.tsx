import { supabase } from "../../lib/supabase";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

interface Card {
    user_card_id: string;
    web_url: string;
    added_deck: boolean;
    in_deck: boolean;
}

async function getDeck(userId: string | null): Promise<Card[]> {
  if (!userId) return [];
  const { data, error } = await supabase.rpc('get_deck_cards');
  if (error) throw error;
  // RPC expected to return an array of cards
  return (data ?? []) as Card[];
}

function Deck(){
    const { session } = useAuth();
    const [activeDeck, setActiveDeck] = useState<Card[]>([]);
    const [wishlist, setWishlist] = useState<Card[]>([]);
    useEffect(() => {
        async function loadDeck(){
            try{
                const data = await getDeck(session?.user?.id ?? null);
                setActiveDeck((data || []).filter((card) => card.in_deck));
                setWishlist((data || []).filter((card) => !card.in_deck));
                console.log(data);
            } catch (err) {
                console.error(err);
            }
        }
        loadDeck();
    },[session?.user?.id]);
    return(
        <section className="w-full max-h-[750px] overflow-y-auto p-6 bg-white rounded-2xl border border-black/10 shadow-sm flex flex-col gap-6">
            <h2 className="text-morado-oscuro">My Deck</h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 justify-items-center">
                {activeDeck.length === 0 ? (
                    <p className="col-span-full text-gray-500">No cards in your deck yet.</p>
                ) : (
                    activeDeck.map((card) => (
                        <div key={card.user_card_id} className="w-full max-w-[140px] aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-100 shadow-md hover:scale-[1.02] transition duration-200 cursor-pointer">
                            <img src={card.web_url} alt="card" className="w-full h-full object-cover" />
                        </div>
                    ))
                )}
            </div>
            <h2 className="text-morado-oscuro">My Wishlist</h2>
            <div className="grid grid-cols-3 gap-3 justify-items-center">
                {wishlist.length === 0 ? (
                    <p className="col-span-full text-gray-500">No items in your wishlist.</p>
                ) : (
                    wishlist.map((card) => (
                        <div key={card.user_card_id} className="w-full max-w-[140px] aspect-[3/4] rounded-xl overflow-hidden bg-zinc-100 shadow-sm hover:scale-[1.03] transition duration-200 cursor-pointer">
                            <img src={card.web_url} alt="card" className="w-full h-full object-cover" />
                        </div>
                    ))
                )}
            </div>

        </section>
    )
}

export default Deck;