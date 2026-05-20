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

// Info about each card
export type CollectionCard = {
    card_id: string;
    player_name: string;
    web_url: string;
    attack: number;
    defense: number;
    velocity: number; 
    rarity_id: number;
    rarity_label: string;
    user_card_id: number; 
    times_unlocked: number;
    first_unlock: string;
    pack_name: string;
    user_owned: boolean;
    added_deck: boolean;
    in_deck: boolean;
}

// For messages 
export type DunkDeckModification = {
    success: boolean,
    message: string,
    added_deck: boolean,
    in_deck: boolean
}