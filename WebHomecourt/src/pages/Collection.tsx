import { useEffect, useState } from 'react';
import { supabase } from "../lib/supabase";
import { useNavigate } from 'react-router-dom';
import { useStoreUser } from '../hooks/useStoreUser.ts'; // Hook for store user, just to get sesh info
import Nav from '../components/Nav/Nav.tsx';
import Button from '../components/button.tsx';
// Specific to this screen
import CategorySummary from '../components/Collection/CategorySummary.tsx';
import CollectionCardRender from '../components/Collection/CollectionCardRender.tsx';
import FilterBox from '../components/Collection/FilterBox.tsx';
import type { CardSummary, CollectionCard } from '../hooks/Collection/collectionTypes.tsx';

// Handle API call
async function getCollectionSummary(userId: string | null) {
    const { data, error } = await supabase.rpc("collection_summary", {
        p_user_id: userId,
    });

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
    const summary: CardSummary[] = data.map(row => {
        // Creates the game items 
        return {
            unlocked_common: row.unlocked_common,
            total_common: row.total_common,
            unlocked_rare: row.unlocked_rare,
            total_rare: row.total_rare,
            unlocked_legendary: row.unlocked_legendary,
            total_legendary: row.total_legendary,
            unlocked_limited: row.unlocked_limited,
            total_limited: row.total_limited
        }
    });

    return summary;
}

// Get list of all cards and which ones the user owns 
async function getCollectionCards(userId: string | null) {
    // Call supabase funct
    const { data, error } = await supabase.rpc("card_collection", {
        p_user_id: userId,
    });

    // Smth died
    if (error) {
        console.error("Supabase error:", error.message)
        throw new Error("Failed to get collection cards")
    }

    console.log("raw rpc data:", data);
    console.log("is array?", Array.isArray(data));

    // Data is not formatted as array, entcs hace un array vacío and sends that will show no user colls
    if (!Array.isArray(data)) return []

    console.log("raw data:", JSON.stringify(data, null, 2)) // A ver como se ve lo q fue fetched

    // Takes results del data and turns into the CollectedCard obj
    const cards: CollectionCard[] = data.map(row => {
        // Creates the game items 
        return {
            card_id: row.card_id,
            player_name: row.player_name,
            web_url: row.web_url,
            attack: row.attack,
            defense: row.defense,
            velocity: row.velocity,
            rarity_id: row.rarity_id,
            rarity_label: row.rarity_label,
            // These can all be emtpy or 0 btw
            user_card_id: row.user_card_id,
            times_unlocked: row.times_unlocked,
            first_unlock: row.first_unlock,
            pack_name: row.pack_name,
            user_owned: row.user_owned,
            added_deck: row.added_deck,
            in_deck: row.in_deck
        }
    });

    return cards;
}

function Collection() {
    const navigate = useNavigate(); // Switch to diff screen
    const { storeUser } = useStoreUser(); // Use hook to get basic session and login info
    const [summary, setSummary] = useState<CardSummary | null>(null); // Says how many the user has unlocked
    const [cardCollection, setCardCollection] = useState<CollectionCard[]>([]); // List of cards in the collection
    const [page, setPage] = useState(0); // The state for pages
    const [rarityFilter, setRarityFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");

    // Get user session info 
    useEffect(() => {
        if (!storeUser.signedIn) {
            console.log("User not signed in");
        } else {
            console.log(`User ${storeUser.user_id} has ${storeUser.credits} credits`);
        }
    }, [storeUser]);

    // Obtain the collection summary 
    useEffect(() => {
        async function loadSummary() {
            try {
                const result = await getCollectionSummary(storeUser.user_id);
                setSummary(result?.[0] || null);
            } catch (err) {
                console.error(err);
                setSummary(null);
            }
        }

        loadSummary();
    }, [storeUser.user_id]);

    // Obtain card collection itself
    useEffect(() => {
        async function loadCards() {
            try {
                const result = await getCollectionCards(storeUser.user_id);
                setCardCollection(result);
            } catch (err) {
                console.error(err);
            }
        }

        loadCards();
    }, [storeUser.user_id]);

    // Filter logic 
    let displayCards = cardCollection;

    // Rarity categories 
    if (rarityFilter !== "All") {
        displayCards = displayCards.filter((card) => card.rarity_label === rarityFilter);
    }

    // By type unlocked, locked, or which ones are added to the deck 
    if (statusFilter === "Unlocked") {
        displayCards = displayCards.filter((card) => card.user_owned);
    } else if (statusFilter === "Locked") {
        displayCards = displayCards.filter((card) => !card.user_owned);
    } else if (statusFilter === "Bench") {
        displayCards = displayCards.filter((card) => card.added_deck);
    } else if (statusFilter === "Deck") {
        displayCards = displayCards.filter((card) => card.in_deck);
    }

    // Logic to paginate the colllection itself
    const PAGE_SIZE = 8; // Will be using 3x4 grid
    const totalPages = Math.ceil(displayCards.length / PAGE_SIZE); // How many pages will be needed rounded up 
    const paginated = displayCards.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE); // Divide by pages

    return (
        <div>
            <Nav current="Lakers Cards" />
            <div className="px-4 py-5 md:px-14 md:py-5 bg-Background w-full">
                {/* Title comp */}
                <div className="w-full px-3 py-4 md:px-5 md:py-7 bg-violet-950 rounded-2xl shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] outline outline-1 outline-offset-[-1px] outline-black/25 flex flex-col justify-left items-left overflow-hidden">
                    <h1 className="justify-start text-white title1">Laker Card Collection</h1>
                    <p className="justify-start text-white mt-2 text-xl text-zinc-300">Collect virtual cards to show off your favorite team and power up your Dunk Royale gameplay!</p>
                </div>

                {/* View store vs colection */}
                <div className="flex flex-col mx-2 gap-6 md:gap-0 md:mx-0 md:flex-row justify-left mt-10 mb-6">
                    <Button
                        text="STORE"
                        type="secondary"
                        onClick={() => navigate('/store')}
                        className="text-2xl font-semibold px-10 md:mr-8"
                    />

                    <Button
                        text="COLLECTION"
                        type="primary"
                        onClick={() => { }}
                        className="text-2xl font-semibold px-10"
                    />
                </div>

                {/* How many cards the user has unlocked per category*/}
                <div className="grid grid-cols-2 justify-between items-center md:flex md:flex-row gap-4 md:justify-left">
                    <CategorySummary
                        category='Common'
                        unlocked={summary?.unlocked_common ?? 0}
                        total={summary?.total_common ?? 1} outline='outline-4 outline-royal-blue'>
                    </CategorySummary>

                    <CategorySummary
                        category='Rare'
                        unlocked={summary?.unlocked_rare ?? 0}
                        total={summary?.total_rare ?? 1} outline='outline-4 outline-morado-lakers'>
                    </CategorySummary>

                    <CategorySummary
                        category='Legendary'
                        unlocked={summary?.unlocked_legendary ?? 0}
                        total={summary?.total_legendary ?? 1} outline='outline-4 outline-amarillo-lakers'>
                    </CategorySummary>

                    <CategorySummary
                        category='Limited'
                        unlocked={summary?.unlocked_limited ?? 0}
                        total={summary?.total_limited ?? 1} outline='outline-4 outline-light-blue'>
                    </CategorySummary>
                </div>

                {/* Card filters */}
                <div className="w-full px-5 py-2.5 mt-8 bg-white rounded-2xl">
                    <h4 className="mt-1 mb-3 ml-1">Filter Collection</h4>
                    <div className="flex flex-col md:flex-row gap-4 md:gap-2">
                        {/* Custom filter box q toma el nombre del rectangle, las options, pasa currently selected one y cuando se pica otro, se cambia la option */}
                        <FilterBox
                            filterTitle='Card Rarity Category'
                            filterOptions={["All", "Common", "Rare", "Legendary", "Limited"]}
                            selectedOption={rarityFilter}
                            onSelect={setRarityFilter}
                        />

                        <FilterBox
                            filterTitle='Card Status'
                            filterOptions={["All", "Unlocked", "Locked", "Bench", "Deck"]}
                            selectedOption={statusFilter}
                            onSelect={setStatusFilter}
                        />
                    </div>
                </div>

                {/* Card collection */}
                {/* Arrows for different collection pages */}
                <div className="flex flex-row mt-5 w-full justify-end mb-4">
                    {/*
                    <div className="flex flex-col">
                        <h2>Collection</h2>
                        <p>Click on any card to view its stats</p> 
                        <p>Add or remove cards from your Wishlist to build your ideal Dunk Royale game deck</p>
                    </div>
                    */}

                    <div className="mr-10 mb-2">
                        <div className="flex items-center gap-2 shrink-0 ml-4">
                            <button
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="text-black disabled:opacity-30 hover:opacity-75 transition text-6xl px-4"
                            >
                                ‹
                            </button>
                            <span className="text-black text-xl">
                                {page + 1} / {totalPages || 1}
                            </span>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                                className="text-black disabled:opacity-30 hover:opacity-75 transition text-6xl px-4"
                            >
                                ›
                            </button>
                        </div>
                    </div>
                </div>



                {/* Collectioin itself */}
                {cardCollection.length === 0 ? (
                    <p>Loading collection...</p>
                ) : paginated.length === 0 ? (
                    <p className="text-center">No cards matching specified filters.</p>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {paginated.map((card) => (
                            <CollectionCardRender key={card.card_id} card={card} userId={storeUser.user_id} />
                        ))}
                    </div>
                )}

            </div>
        </div>
    )
}

export default Collection

/*
Map de rows para force unlock all cards and check pictures
return {
            card_id: row.card_id,
            player_name: row.player_name,
            web_url: row.web_url,
            attack: row.attack,
            defense: row.defense,
            velocity: row.velocity,
            rarity_id: row.rarity_id,
            rarity_label: row.rarity_label,
            // These can all be emtpy or 0 btw
            user_card_id: row.user_card_id,
            times_unlocked: 2,
            first_unlock: "2026-05-19T22:18:04.286235+00:00",
            pack_name: "tested",
            user_owned: true,
            added_deck: row.added_deck
        }
*/
