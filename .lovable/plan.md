

## Plan: Enhance Fashion Logic with Color Coordination, Texture Pairing & Comprehensive Accessories

Based on your answers: **all styles**, **AI knowledge only** for trends, **both uploads & celebrity picks** for accessories, and **match the reference** for accessory count.

### Changes

#### 1. Expand outfit item categories (`src/types/outfit.ts`)
Add subcategories to the `category` union type:
```
"hat" | "scarf" | "belt" | "jewelry" | "sunglasses" | "watch"
```

#### 2. Add emoji mappings (`src/components/OutfitCard.tsx` + `src/components/ScrapbookOutfitView.tsx`)
Add mappings for new categories: hat 🎩, scarf 🧣, belt, jewelry 💎, sunglasses 🕶️, watch ⌚.

#### 3. Rewrite system prompts (`src/pages/Index.tsx`)

**Celebrity prompt** (~line 119): Enhance with:
- **Color coordination rules**: Instruct AI to use color theory (complementary, analogous, tonal) and explain color choices in the explanation field
- **Texture pairing**: Require contrasting textures (matte/shine, structured/flowing, rough/smooth)
- **Accessory matching**: "Identify all accessories the celebrity is known for wearing and include matching categories. Match the number and type of accessories to what the celebrity actually wears."
- **2025-2026 trends**: Inject trend awareness (quiet luxury, butter yellows, burgundy, sheer layers, oversized blazers, ballet flats, chunky gold jewelry, cherry red, boho revival)
- Update category list to include new subcategories

**Image upload prompt** (~line 244): Same enhancements plus:
- "Identify EVERY visible accessory in the image (earrings, necklaces, rings, belts, hats, sunglasses, scarves, watches) and include a matching item for each in your outfit suggestions"
- "Analyze the color palette and explain how you're matching or complementing it"
- "Note the textures visible and pair similar or complementary textures"

**Follow-up prompt** (~line 369): Add:
- "Maintain the same color coordination principles and accessory completeness from the original outfits"
- Include the expanded category list in the JSON schema

#### 4. No new APIs or edge functions needed
All improvements are prompt-level — no additional API calls, no rate limit risk increase.

