

## Plan: Hero Revamp, Randomized Shortcuts, Scroll Fix, Centered Images, and Custom Data Support

### 1. Randomize Occasion Shortcuts on Each Refresh

**`src/pages/Index.tsx`**:
- Create a larger pool of ~20 occasion prompts (e.g. "Art gallery opening", "Rooftop cocktails", "Ski trip to Aspen", "Coachella weekend", "Board meeting", "Yacht party", "Graduation ceremony", etc.)
- On component mount, use `useMemo` to randomly pick 5 from the pool each time the page loads
- Replace the static `EXAMPLE_PROMPTS` with the randomized selection

### 2. Scrapbook-Style Hero with Fashion Images

**`src/pages/Index.tsx`**:
- Add a scrapbook-style visual section behind/around the hero text using scattered, rotated fashion images
- Use 4-6 curated fashion image URLs (from Unsplash or similar free sources) positioned absolutely with slight rotations, varied sizes, and overlapping edges -- like a mood board / scrapbook aesthetic
- Images placed in a container behind the title using `z-0` with the text content at `z-10`
- Apply subtle parallax or stagger animations via framer-motion

### 3. Fix Scroll Issue on Filter Page

**`src/pages/Index.tsx`**:
- The hero currently uses `min-h-screen` with `justify-center` which locks it into viewport height. When the filter mode is selected and content grows, it can't scroll past the viewport
- Change the hero wrapper from `flex ... justify-center min-h-screen` to `min-h-screen` with top padding instead of vertical centering, so content flows naturally and the page scrolls
- Alternatively, switch to `min-h-fit` or remove the `min-h-screen` constraint when in filter mode so content can extend below the fold

### 4. Center Images and Remove White Backgrounds in Outfit Cards

**`src/components/OutfitCard.tsx`**:
- **Remove the collage section** (lines 145-150) -- the `bg-white aspect-[3/4]` container and `CollageItemImage` component
- **Remove `CollageItemImage` component and `categoryPositions`** -- no longer needed
- **Enhance item list images**: increase from `w-10 h-10` to `w-16 h-16`, center them with `mx-auto` or use `items-center` in the flex row
- **Remove all white backgrounds** from image containers -- use `bg-transparent` or no background class
- Show all items by default (remove 3-item limit and expand/collapse toggle)

### 5. Support User-Provided Fashion Item Data

**`src/pages/Index.tsx`** and system prompt:
- Yes, the user can feed real fashion item data. To support this:
  - Update the system prompt to instruct the AI: "If the user provides specific item data (brands, prices, URLs), use those exact items in the outfit recommendations instead of generating new ones"
  - This requires no structural code changes -- the AI will respect user-provided data in the chat naturally
- Optionally, add a note in the UI (tooltip or placeholder text) hinting users can paste item details

### Summary of Files Changed
- `src/pages/Index.tsx` -- randomized prompts, scrapbook hero images, scroll fix, system prompt update
- `src/components/OutfitCard.tsx` -- remove collage/white bg, center and enlarge item images, show all items

