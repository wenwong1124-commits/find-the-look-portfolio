export interface OutfitItem {
  name: string;
  brand: string;
  price: number;
  currency: string;
  color: string;
  material: string;
  category: "top" | "bottom" | "shoes" | "bag" | "accessory" | "outerwear" | "dress";
  sizes: string[];
  shopUrl: string;
  imageDescription: string;
}

export interface CapsuleOutfit {
  id: string;
  name: string;
  explanation: string;
  items: OutfitItem[];
  occasion: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  type?: "text" | "follow-up" | "outfits" | "thinking";
  outfits?: CapsuleOutfit[];
  followUpOptions?: FollowUpOption[];
}

export interface FollowUpOption {
  label: string;
  category: string;
  options: string[];
}

export interface UserPreferences {
  occasion: string;
  budget?: string;
  days?: number;
  season?: string;
  style?: string[];
  colorPreferences?: string;
  avoidColors?: string;
}

export interface SavedOutfitSet {
  id: string;
  outfit: CapsuleOutfit;
  savedAt: string;
}
