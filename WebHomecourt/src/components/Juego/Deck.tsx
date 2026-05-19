import { supabase } from "../../lib/supabase";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

interface Card {
    user_card_id: string;
    web_url: string;
    added_deck: boolean;
    in_deck: boolean;
    gatorade_cost: number;
}

async function getDeck(userId: string | null): Promise<Card[]> {
  if (!userId) return [];
  const { data, error } = await supabase.rpc('get_deck_cards');
  if (error) throw error;
  // todas las cartas que estan en add_deck
  return (data ?? []) as Card[];
}

async function swapDeckCard(wishlistId: string, deckId:string){
  const { error } = await supabase.rpc('swap_deck_card', {
    p_wishlist_id: wishlistId,
    p_deck_id: deckId,
  });
  if (error) throw error;
}


function Deck(){
    const { session } = useAuth();
    const [activeDeck, setActiveDeck] = useState<Card[]>([]);
    const [wishlist, setWishlist] = useState<Card[]>([]);
    // Para cambiar las cartas
    const [selectedWishCard, setSelectedWishCard] = useState<Card | null>(null);
    const [isChoosing, setIsChoosing] = useState(false);
    const [loading, setLoading] = useState(false);
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
    useEffect(() => {
        loadDeck();
    },[session?.user?.id]);

    function handleUse(card: Card) {
        setSelectedWishCard(card);
        setIsChoosing(true);
    }
    function handleSelectWishCard(card: Card){
        if (selectedWishCard?.user_card_id === card.user_card_id){
            setSelectedWishCard(null);
            setIsChoosing(false);
            return;
        }
        setSelectedWishCard(card);
    }
    async function handleReplace(deckCard: Card){
        if(!selectedWishCard) return;
        try {
            setLoading(true);
            await swapDeckCard(selectedWishCard.user_card_id, deckCard.user_card_id);
            await loadDeck();
            setSelectedWishCard(null);
            setIsChoosing(false);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }
    return(
        <section className="w-full max-h-[750px] overflow-y-auto p-6 bg-white rounded-2xl border border-black/10 shadow-sm flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h2 className="text-morado-oscuro">My Deck</h2>
                {isChoosing && (
                    <h5 className="text-gray-500">Choose a card to replace</h5>
                )}
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 justify-items-center">
                {activeDeck.length === 0 ? (
                    <p className="col-span-full text-gray-500">No cards in your deck yet.</p>
                ) : (
                    activeDeck.map((card) => (
                        <div key={card.user_card_id} onClick={() => {if (isChoosing && !loading){handleReplace(card);}}} className={`relative w-full max-w-[140px] aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-100 shadow-md transition duration-200
                        ${isChoosing ? "cursor-pointer hover:scale-[1.05] ring-4 ring-amarillo-lakers" : ""}
                        ${loading ? "opacity-60 pointer-events-none" : ""}`}>
                            <div className="absolute top-1 right-1 z-10 w-9 h-9 rounded-full bg-morado-oscuro ring-2 ring-white border-[3px] border-morado-oscuro flex items-center justify-center shadow-lg">
                                <span className="text-white font-black text-lg leading-none">{card.gatorade_cost}</span>
                            </div>
                            <img src={card.web_url} alt="card" className="w-full h-full object-cover" />
                        </div>
                    ))
                )}
            </div>
            <div className="flex items-center justify-between">
                <h2 className="text-morado-oscuro">My Wishlist</h2>
                
            </div>
            <div className="grid grid-cols-3 gap-3 justify-items-center">
                {wishlist.length === 0 ? (
                    <p className="col-span-full text-gray-500">No items in your wishlist.</p>
                ) : (
                    wishlist.map((card) => (
                        <div key={card.user_card_id} className="flex flex-col items-center gap-2">
                            <div onClick={() => handleSelectWishCard(card)} className={`relative w-full max-w-[110px] aspect-[3/4] rounded-xl overflow-hidden bg-zinc-100 shadow-sm transition duration-200 cursor-pointer
                                ${selectedWishCard?.user_card_id == card.user_card_id ? "ring-4 ring-morado-lakers scale-[1.03]" : "hover:scale-[1.03]"}`}>
                                <div className="absolute top-1 right-1 z-10 w-7 h-7 rounded-full bg-morado-oscuro ring-2 ring-white border-[3px] border-morado-oscuro flex items-center justify-center shadow-lg">
                                    <span className="text-white font-black text-sm leading-none">{card.gatorade_cost}</span>
                                </div>
                                <img src={card.web_url} alt="card" className="w-full h-full object-cover" />
                            </div>
                            {selectedWishCard?.user_card_id === card.user_card_id && (
                                isChoosing ? (
                                <button onClick={(e) => {
                                        e.stopPropagation();
                                        setIsChoosing(false);
                                        setSelectedWishCard(null);
                                    }}
                                    className=" w-full py-2 rounded-xl bg-gray-700 text-white hover:scale-105 transition">
                                    Cancel
                                </button>
                                ) : (
                                    <button onClick={
                                        (e) => {
                                            e.stopPropagation();
                                            handleUse(card);
                                        }} 
                                        className="w-full py-2 rounded-xl bg-morado-oscuro text-white font-bold text-sm hover:scale-105 transition">
                                            <h5>Use</h5>
                                        </button>
                                )
                            )
                        }
                        </div>
                    ))
                )}
            </div>

        </section>
    )
}

export default Deck;