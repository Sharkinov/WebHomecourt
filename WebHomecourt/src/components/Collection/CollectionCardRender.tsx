import { useEffect, useState } from 'react';
import type { CollectionCard, DunkDeckModification } from '../../hooks/Collection/collectionTypes.tsx';
import { supabase } from "../../lib/supabase"
import LockedCardFront from './LockedCardFront.tsx';
import CardFront from './CardFront.tsx';
import CardBack from './CardBack.tsx';
import IconButton from '../IconButton.tsx';
import StatusAlert from '../Messages/StatusAlert.tsx';

type CardProp = {
    card: CollectionCard;
    userId?: string | null; // To update whether card is added to deck; might be null if is not signed in
}

// API call to update the value of added_deck when the button clicked
async function updateCardWishlist(user_card_id: number, user_id: string, added: boolean) {
    const { data, error } = await supabase.rpc("update_added_deck_checks", {
        p_user_card_id: user_card_id,
        p_user_id: user_id,
        p_added: added
    });

    if (error) throw error;

    console.log("raw rpc data:", data);

    if (!Array.isArray(data) || data.length === 0) {
        throw new Error("No response returned from update_added_deck_checks");
    }

    const row = data[0]; // Extracts obj from array to interpret it

    // Takes results del data and turns into the CollectedCard obj
    const message: DunkDeckModification = {
        success: row.success,
        message: row.message,
        added_deck: row.added_deck,
        in_deck: row.in_deck
    };

    return message;
}

function CollectionCardRender({ card, userId }: CardProp) {
    const [cardFront, setCardFront] = useState(true);
    const [dunkRoyale, setDunkRoyale] = useState(card.added_deck); // Stores default if it's a part of dunk royale to update otherwise from here front end
    const [showMessage, setShowMessage] = useState(false); // To show success or error over card for two seconds
    const [messageType, setMessageType] = useState<"success" | "error" | "info">("info"); // Default for info, can use other ones tho
    const [messageTitle, setMessageTitle] = useState("");
    const [message, setMessage] = useState("");

    // Resets the added deck status
    useEffect(() => {
        setDunkRoyale(card.added_deck);
    }, [card.added_deck]);

    async function handleClick() {
        // Front-end update 
        const newValue = !dunkRoyale; // Temporary antes de hacer los checks
        console.log(`Clicked now ${newValue}`);

        // Backend call
        try {
            console.log("Call API");
            const message = await updateCardWishlist(card.user_card_id, userId ?? 'a', newValue); // The user w id a doesn't exist, button shouldn't even appear to them but just in case

            // Uses query added_deck status to update front-end button
            if (message.success) {
                setDunkRoyale(message.added_deck);
                startShowMessage("success", "", message.message);
            } else {
                // Shows error
                startShowMessage("error", "", message.message);
            }
        } catch (e) {
            console.error(e);
        }
    }

    // Call to trigger the message 
    function startShowMessage(type: "success" | "error" | "info", title: string, message: string) {
        setMessageType(type);
        setMessageTitle(title);
        setMessage(message);
        setShowMessage(true);

        // Waits five seconds, then disappears the alert
        setTimeout(() => {
            setShowMessage(false);
        }, 5000);
    }

    if (card.user_owned) {
        return (
            <div className="flex flex-col mb-4 items-center justify-center relative">
                {/* Card front and back switching  */}
                <div onClick={() => setCardFront((prev) => !prev)}>
                    {cardFront ? (
                        <CardFront card={card} />
                    ) : (
                        <CardBack card={card} />
                    )}
                </div>

                {/* Add to deck button*/}
                <IconButton
                    onClick={() => { handleClick() }}
                    leftMaterial={!dunkRoyale ? "add_circle" : "remove_circle"}
                    text="Dunk Royale wishlist"
                    className="w-90% mt-4"
                />

                {/* Show message overlayed temporairly */}
                {showMessage && (
                    <div className="z-10 absolute justify-center items-center">
                        <StatusAlert tone={messageType} title={messageTitle} message={message} />
                    </div>
                )}

            </div>
        )
    }
    // Doesn't own it, will show the back or also useful if smth were to fail 
    else {
        return (
            <div className="flex flex-col items-center">
                <LockedCardFront card={card} />
            </div>

        )

    }
}

export default CollectionCardRender