import { supabase } from "../lib/supabase"
import { useEffect, useState } from "react"

// Full data 
/*export type CollectedCard = { 
    user_id: string
    card_id: string
    player_name: string
    web_url: string
    unlocked: boolean
    attack: number
    defense: number 
    velocity: number 
    cost: number
    rare: boolean
};*/

// Actually used in query oops
export type CollectedCard = {
    card_id: string
    player_name: string
    web_url: string
    cost: number
    unlocked: boolean
    rare: boolean
};

// Stores the collection of cards
export async function getUserCards(userId: string): Promise<CollectedCard[]> {
    if (!userId) {
        throw new Error("Invalid userId")
    }

    // Connection to supabase, gets the unlocked status from relation table and then cols from card
    const { data, error } = await supabase
        .from("user_card")
        .select(`
            unlocked,
            card (
            card_id,
            player_name,
            web_url,
            cost,
            rare
            )
        `)
        .eq("user_id", userId)
        .eq("unlocked", true)

    // Smth died
    if (error) {
        console.error("Supabase error:", error.message)
        throw new Error("Failed to get user cards")
    }

    // Data is not formatted as array, entcs hace un array vacío and sends that will show no user colls
    if (!Array.isArray(data)) return []

    console.log("raw data:", JSON.stringify(data, null, 2)) // A ver

    // Takes results del data and turns into the CollectedCard obj
    const cards: CollectedCard[] = data.map(row => {
        // Stores the card row
        const card = row.card as any
        return {
            card_id: card.card_id,
            player_name: card.player_name,
            web_url: card.web_url,
            cost: card.cost,
            rare: card.rare,
            unlocked: row.unlocked,
        }
    })

    return cards
}

function DisplayUserCards({ userId }: { userId: string }) {
    const [cards, setCards] = useState<CollectedCard[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)  // ← new error state

    useEffect(() => {
        async function fetchCards() {
            setLoading(true)
            try {
                const unlockedCards = await getUserCards(userId)
                setCards(unlockedCards)
            } catch (e) {
                console.error("Can't load cards:", e)
                setCards([]) // Cards set to empty arr
            }
            setLoading(false) // Done load
        }
        fetchCards()
    }, [userId]) // Passes val of userId to use the funct 

    if (loading) {
        return <p>Loading your collection...</p>
    }
    if (!cards.length) {
        return <p>No cards unlocked yet. Start playing to buy your first player pack!</p>
    }

    // Makes grid of the cards
    return (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-5 font-['Graphik']">
            {cards.map(card => (
                <div
                    key={card.card_id}
                    className="bg-white rounded-md justify-center text-center px-2 py-3 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] w-[14.625rem] h-[20.5rem]">
                    <h3 className="text-lg font-black ">{card.player_name}</h3>
                    <img src={card.web_url} alt={card.player_name} className="w-[10.75rem] h-max-[14.25rem] mx-auto" />
                    <p>Value: ${card.cost}</p>
                    <p>Unlocked: {card.unlocked ? "Yes" : "No"}</p>
                    {/* Display rare status only if true and (then shows the thingy) */}
                    {card.rare && <p className="text-white font-bold bg-indigo-900 rounded-full">Rare</p>}
                </div>
            ))}
        </div>
    )
}

export default DisplayUserCards