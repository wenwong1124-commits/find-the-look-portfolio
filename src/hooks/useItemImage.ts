// Emoji-only mode — no AI image generation to avoid rate limits and slow loading
// All items display their category emoji instantly

const categoryEmojis: Record<string, string> = {
  top: "👕",
  bottom: "👖",
  shoes: "👢",
  bag: "👜",
  accessory: "💍",
  outerwear: "🧥",
  dress: "👗",
  hat: "🎩",
  scarf: "🧣",
  belt: "🪢",
  jewelry: "💎",
  sunglasses: "🕶️",
  watch: "⌚",
};

export function getItemEmoji(category: string): string {
  return categoryEmojis[category] || "👔";
}

export function useItemImage(_itemDescription: string, _brand: string, category: string) {
  return {
    imageUrl: null as string | null,
    isLoading: false,
    emoji: getItemEmoji(category),
  };
}
