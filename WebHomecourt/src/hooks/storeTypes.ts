export type StoreUser = {
  user_id: string | null;
  credits: number;
  signedIn: boolean;
};

export type StorePacks = {
  pack_id: number | null;
  pack_type_id: number;
  name: string;
  closed_URL: string;
  tear_URL: string;
  opening_URL: string;
  pack_name: string | null;
  cost: number | null;
  num_cards: number | null;
  is_active: boolean | null;
};