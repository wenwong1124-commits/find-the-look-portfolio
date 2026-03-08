import { CapsuleOutfit } from "@/types/outfit";

/**
 * Parse AI response text to extract outfit JSON blocks.
 * The AI is instructed to return outfits in ```json blocks.
 */
export function parseOutfitsFromText(text: string): CapsuleOutfit[] {
  try {
    // Try to find JSON array in the text
    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1]);
      if (Array.isArray(parsed)) return parsed;
      if (parsed.outfits) return parsed.outfits;
    }

    // Try parsing entire text as JSON
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
    if (parsed.outfits) return parsed.outfits;
  } catch {}

  return [];
}

/**
 * Check if the AI response contains outfit data
 */
export function hasOutfitData(text: string): boolean {
  return text.includes('"items"') && text.includes('"brand"') && text.includes('"shopUrl"');
}
