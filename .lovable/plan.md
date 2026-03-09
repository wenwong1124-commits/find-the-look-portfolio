

## Plan: Hero Scrapbook, Random Occasions, Scroll Fix, Center Images, Remove White BGs

### 1. Randomly Shuffle Occasion Shortcuts on Each Refresh

**`src/pages/Index.tsx`**:
- Expand `EXAMPLE_PROMPTS` to a larger pool (~15-20 occasions): add entries like "Art gallery opening", "Rooftop cocktails", "Ski weekend", "Beach holiday", "Graduation ceremony", "Theatre night", "Business lunch", "Vineyard tour", etc.
- Use `useMemo` to pick 5 random prompts from the pool on each mount/refresh.

### 2. Scrapbook-Style Fashion Hero Section

**`src/pages/Index.tsx`**:
- Add a scrapbook collage above the input area using a set of curated fashion image URLs (from Unsplash/Pexels, free to use).
- Layout: scattered, slightly rotated images of various sizes using absolute positioning within a relative container — mimicking a mood board / scrapbook aesthetic.
- Use `framer-motion` for staggered fade-in animations on each image.
- Images will be decorative only (not AI-generated), sourced from free stock photo URLs of fashion/outfit flat-lays.

### 3. Fix Scroll Issue on Filter Page

**`src/pages/Index.tsx`**:
- The hero currently uses `min-h-screen` + `justify-center` which traps content in a fixed viewport. When filters are shown, content overflows but can't scroll.
- Change the hero container from `flex ... justify-center min-h-screen` to `min-h-screen` with top padding instead, allowing natural document scroll.
- Remove `justify-center` so content flows naturally and the page scrolls when filters exceed viewport height.

### 4. Center Outfit Images & Remove White Backgrounds

**`src/components/OutfitCard.tsx`**:
- **Remove the collage section entirely** (the `bg-white aspect-[3/4]` div and `CollageItemImage` component) — this eliminates the white background and the overlapping absolute-positioned images.
- **Remove `categoryPositions` and `CollageItemImage`** — no longer needed.
- **Enhance the item list**: increase thumbnail size from `w-10 h-10` to `w-16 h-16`, center-aligned within each row.
- **Show all items by default** — remove the expand/collapse toggle since the collage is gone.
- Images displayed inline per item row, centered in the card — no white background boxes.

### 5. User-Provided Fashion Item Data

Yes, you can absolutely feed real fashion item data. In implementation, I'll add a note/comment in the system prompt area. For now, the answer to your question: **Yes, if you provide the data (brand, name, price, URL, etc.), I can hardcode it or store it so the AI references real items instead of generating generic ones.** Just share the data in your next message and I'll integrate it.

---

### Files Changed
- `src/pages/Index.tsx` — random prompts, scrapbook hero images, scroll fix
- `src/components/OutfitCard.tsx` — remove collage/white bg, center images, show all items

