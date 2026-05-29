import { useState, useEffect } from 'react';
import { supabase } from "../../lib/supabase"
import Button from '../button.tsx';
import type { DisplayWonCard } from '../../hooks/Collection/collectionTypes.tsx';
import CardFront from '../Collection/CardFront.tsx';

// Visual pack render
type OpenPackProp = {
    // For pop-up function
    open: boolean;
    onClose: () => void;
    // Related to db
    userId: string, // To see who is buying it
    // Base pack info passed in
    packId: number, // To send in info
    packImg: string, // Sending in pack url
    tearImg: string, // Image w one tear
    openingImg: string, // About to open img
    packName: string, // To display as open it onClick={onClose}
    packCost: number // Show how much package costs to ensure user wants to buy
    onCreditsUpdated: (newCredits: number) => void; // Todo pq react no puede auto refresh no manches
}

// Now the actual API logic based on pack they're buying and their id
async function buyPack(pack_id: number, user_id: string) {
    // Call supabase funct
    const { data, error } = await supabase.rpc("randomize_display_cards", {
        p_pack: Number(pack_id),
        p_user_id: user_id, // Must add month cause they're 0 based in typescript
    });

    // Smth died
    if (error) {
        console.error("Supabase error:", error.message)
        throw new Error("Failed to buy the pack")
    }

    console.log("Raw rpc data:", data);
    console.log("is array?", Array.isArray(data));

    // Data is not formatted as array, entcs hace un array vacío and sends that will show no user colls
    if (!Array.isArray(data)) return []

    console.log("raw data:", JSON.stringify(data, null, 2)) // A ver como se ve lo q fue fetched

    // Takes results del data and turns into the CollectedCard obj
    const cards: DisplayWonCard[] = data.map(row => {
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
            times_unlocked: row.times_unlocked,
            first_unlock: row.first_unlock,
            pack_name: row.pack_name,

            // Extras for display type
            card_slot: row.card_slot, // Pack data empty if no cards are present for that category
            luck: row.luck,
            luck_rarity_id: row.luck_rarity_id,
            updated_credits: row.updated_credits,
            random_case: row.random_case,
        }
    });

    return cards;
}

function OpenPack(prop: OpenPackProp) {
    if (!prop.open) return null

    // Vars that will be updated as it opens
    const [openText, setOpenText] = useState(''); // Starting text used when the pop-up opens
    const [openClickCount, setOpenClickCount] = useState(0); // User hasn't clicked the button
    const [openEnabled, setOpenEnabled] = useState(true); // Determines button enabled or not
    const [openTextButton, setOpenTextButton] = useState("OPEN"); // To let user complete multiple buys
    const [imageURL, setImageURL] = useState('');
    const [isOpening, setIsOpening] = useState(false);
    const [viewPrice, setViewPrice] = useState(true); // To show and hide the pack cost once bought

    // Temporary variable to get the info from the table
    const [wonCards, setWonCards] = useState<DisplayWonCard[]>([]);
    const [uniqueWonCards, setUniqueWonCards] = useState<DisplayWonCard[]>([]);
    const [page, setPage] = useState(0);

    // Initial function to render the base components
    useEffect(() => {
        setOpenClickCount(0);
        setImageURL(prop.packImg);
        setOpenText('Press the pack or the open button to see what you get!');
        setOpenTextButton("OPEN");
    }, [prop.open, prop.packId]);

    // Function to set unique cards once cards have been won
    useEffect(() => {
        const uniqueMap = new Map();
        for (const item of wonCards) {
            uniqueMap.set(item.card_id, item);
        }
        setUniqueWonCards(Array.from(uniqueMap.values()));
    }, [wonCards]);

    // Function to handle inner clicking and switching images
    async function opening() {
        if (isOpening || !openEnabled) return; // Blocks if currently opening or if they are poor and can't open more

        setIsOpening(true); // Blocking double calls

        let newCount = openClickCount + 1;
        console.log(newCount);
        console.log(openTextButton);

        if (newCount === 1) {
            setImageURL(prop.tearImg);
            setOpenText("First tear! Click again to keep opening it...");
            setOpenTextButton("OPEN");
        } else if (newCount === 2) {
            setImageURL(prop.openingImg);
            setOpenText("You can almost see the cards now...");
        }
        else if (newCount === 3) {
            setOpenText(""); // Just eliminates to then render the counter of cards
            setImageURL(""); // Hides image, here will later display the cards won as a sort of board
            setViewPrice(false); // Hides price 

            try {
                const cards = await buyPack(prop.packId, prop.userId);
                setWonCards(cards);

                if (!cards || cards.length === 0) {
                    setOpenText("Sorry, you cannot afford this pack at the moment. Keep playing to win more credits!");
                    setOpenEnabled(false);
                    setIsOpening(false);
                    setOpenTextButton("NOT ENOUGH CREDITS");
                    return;
                }

                // Logic to count new cards 
                const uniqueMap = new Map();
                for (const item of cards) {
                    uniqueMap.set(item.card_id, item);
                }
                const uniqueCount = uniqueMap.size;

                setImageURL("");
                setOpenText(`Congratulations, you won ${uniqueCount} new card${uniqueCount !== 1 ? 's' : ''}!`);
                setOpenTextButton("OPEN AGAIN!");

                const updatedCredits = cards[0]?.updated_credits ?? 0; // Checks first item if they have updated_credits field or otherwise set as 0
                console.log(`New credits: ${updatedCredits}`);
                prop.onCreditsUpdated(updatedCredits); // Pass to general store


                if (updatedCredits < prop.packCost) {
                    setOpenTextButton(`Not enough credits, you have ${updatedCredits} remaining`);
                    setOpenEnabled(false);
                } else {
                    setOpenEnabled(true);
                    setOpenTextButton(`OPEN AGAIN! You have ${updatedCredits} credits remaining`);
                }
            } catch (e) {
                console.error(e);
                setOpenText("Something went wrong while opening the pack, please contact an administrator.");
                setOpenEnabled(false);
            }

            setIsOpening(false);
        } else if (newCount > 3) {
            if (!openEnabled) return; // Must have permission to oepn again

            // Reset everything for a new opening
            newCount = 0;
            //setWonCards([]); // Reset cards
            setOpenText('Press the pack or the open button to see what you get!');
            setOpenTextButton("OPEN");
            setImageURL(prop.packImg);
            setViewPrice(true);
        }
        else {
            // Idk fallback smth is wrong
            setOpenText("Press the pack or the open button to see what you get!");
            setImageURL(prop.packImg);
        }

        setOpenClickCount(newCount); // New val set to use in next load
        setIsOpening(false); // Turns off opening state
    }

    // Logic to paginate the cards won that were recieved itself
    const PAGE_SIZE = 1; // Only one card at a time 
    const totalPages = Math.ceil(uniqueWonCards.length / PAGE_SIZE); // How many pages will be needed rounded up 
    const paginated = uniqueWonCards.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE); // Divide by pages

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative z-10 w-[40rem] h-[48rem] rounded-lg bg-white shadow-lg overflow-hidden">
                {/* Header */}
                <div className="border-b border-gray-200 px-6 py-6 bg-morado-lakers">
                    <div className="flex items-start justify-between">
                        <div className="flex-row">
                            <h2 className="text-white">Open the pack!</h2>
                            <p className="justify-start text-white mt-2 text-xl text-zinc-300">{prop.packName}</p>
                        </div>

                        {/* Close button */}
                        <button
                            type="button"
                            onClick={prop.onClose}
                            className="text-white hover:text-gray-400 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                    </div>
                </div>

                {/* Opening pack content */}
                <div className="flex flex-col text-center items-center mt-3">
                    <h5 className="mb-2">{openText}</h5>

                    {/* Renters price only if hasn't bought a pack yet */}
                    {viewPrice &&
                        <div className="flex flex-row w-fit justify-center items-center p-2.5 gap-3.5 mb-3 rounded-2xl outline -outline-offset-1 outline-black/25">
                            <span className="text-xl">Pack cost: </span>
                            <span className="material-symbols-outlined text-amarillo-lakers text-2xl pl-3">payments</span>
                            <span className="pl-3 text-xl">{prop.packCost}</span>
                        </div>
                    }

                    {/* Opening board space */}
                    <div className="w-150 h-auto px-6">
                        {/* Actual view area, check if there's a way to expand the thing once opened */}
                        <div className="flex flex-col w-full rounded-lg bg-zinc-100 items-center justify-center mb-4">
                            {imageURL ? (
                                <img src={imageURL} className="h-96 w-auto animate-[pulse_0.75s_ease-in-out_2]" onClick={openEnabled ? () => opening() : () => { }} />
                            ) : (
                                // Shows the open cards and arrows to navigate along the cards 
                                <div className="flex flex-row w-full text-center items-center justify-between py-4 px-2 gap-y-4">
                                    {/* No left arrow for now so empty div */}
                                    <div className="flex flex-row justify-right pl-8">
                                        <div className="flex flex-col justify-center items-center">
                                            <button
                                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                                disabled={page === 0}
                                                className="text-black disabled:opacity-30 hover:opacity-75 transition text-8xl px-4"
                                            >
                                                ‹
                                            </button>
                                            <h5 className="text-lg">Previuos</h5>
                                        </div>
                                    </div>

                                    {/* Shows the cards */}
                                    {paginated.map((card) => (
                                        <CardFront card={card} />
                                    ))}

                                    {/* Button to view next card */}
                                    <div className="flex flex-row justify-right pr-8">
                                        <div className="flex flex-col justify-center items-center">
                                            <button
                                                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                                                disabled={page >= totalPages - 1}
                                                className="text-black disabled:opacity-30 hover:opacity-75 transition text-8xl px-4"
                                            >
                                                ›
                                            </button>
                                            <h5 className="text-lg">Next</h5>
                                        </div>
                                    </div>

                                </div>
                            )
                            }

                            {/* Open pack manually via button */}
                            <div className="w-full px-4 md:px-4 pb-4 z-10">
                                <Button
                                    text={openTextButton}
                                    type={openEnabled ? 'primary' : 'primarydisable'}
                                    //onClick={() => opening()} // Logic to open package
                                    onClick={openEnabled ? () => opening() : () => { }} // Only let open if they can actually afford to do so
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cancel button */}
                <div className="w-full px-10 pb-4">
                    <Button
                        text="Close"
                        type="secondary"
                        onClick={prop.onClose}
                        className="w-full"
                    />
                </div>
            </div>
        </div>
    )
}

export default OpenPack