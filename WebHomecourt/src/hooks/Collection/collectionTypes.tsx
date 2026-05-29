// Total unlocked vs total progress needed
export type CardSummary = {
    unlocked_common: number;
    total_common: number;
    unlocked_rare: number;
    total_rare: number;
    unlocked_legendary: number;
    total_legendary: number;
    unlocked_limited: number;
    total_limited: number;
}

// Base info for everything the card needs 
export type DisplayCard = {
    card_id: string;
    player_name: string;
    web_url: string;
    attack: number;
    defense: number;
    velocity: number;
    rarity_id: number;
    rarity_label: string;
    times_unlocked: number;
    first_unlock: string;
    pack_name: string;
};

// Extended uses fields from Display and adds stuff for the collection itself like owned and whether it's in the deck
export type CollectionCard = DisplayCard & {
    user_card_id: number;
    user_owned: boolean;
    added_deck: boolean;
    in_deck: boolean;
};

// Extension for the cards that got won and to also let it work w the json of the slot, luck, and case 
export type DisplayWonCard = DisplayCard & {
    card_slot: number;
    luck: number;
    luck_rarity_id: number,
    updated_credits: number, // Useful to check if user can try again or whether they are out
    random_case: number, // Just for debugging
};

// For messages 
export type DunkDeckModification = {
    success: boolean,
    message: string,
    added_deck: boolean,
    in_deck: boolean
}