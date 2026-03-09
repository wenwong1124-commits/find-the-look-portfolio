

## Plan: Scrapbook / Magazine Style Redesign

### Overview
Transform the visual identity to match the reference images: handwritten annotations, scattered collage layouts, torn-paper textures, and magazine flat-lay outfit presentations with creative decorative elements.

---

### 1. Add Handwritten Font

**`index.html`** or **`src/index.css`**:
- Import a handwritten Google Font (e.g., `Caveat` or `Kalam`) for decorative labels, annotations, and scrapbook text
- Add to tailwind config as `font-handwritten`

**`tailwind.config.ts`**:
- Add `handwritten: ['Caveat', 'cursive']` to `fontFamily`

---

### 2. Scrapbook Hero Background (Reference: Image 2)

**`src/pages/Index.tsx`**:
- Replace the current faded scattered images with a proper scrapbook collage:
  - Dark/textured background (using CSS gradient to simulate dark paper)
  - Fashion images positioned with varied rotations, some overlapping, with "tape" and "torn paper" CSS decorations
  - Handwritten-style labels floating around images (e.g., "Feel alive", "Chic street", "City Jam") using the handwritten font
  - Washi tape strips (colored rectangles rotated at angles) on image corners
- The title "REMAKE THE LOOK" uses the handwritten font for "the" or subtitle elements to create contrast
- Upload zone styled like a pinned polaroid or notebook page

---

### 3. Outfit Card Scrapbook Overview (Reference: Images 3 & 4)

**`src/components/OutfitCard.tsx`**:
- Add a new **scrapbook overview section** at the top of each card, above the item list:
  - A container styled like an open notebook/journal page (subtle lined-paper background, ring-binder dots on the left edge)
  - All outfit items' images scattered inside with slight rotations (like a flat-lay magazine spread)
  - Each item image has a handwritten-style label (brand name or item name) positioned near it, rotated slightly
  - Small decorative elements: drawn circles, arrows, stars using CSS/SVG
  - The outfit name rendered in handwritten font as a title inside this scrapbook area
- Below the scrapbook overview, keep the existing clean item list for shopping details

**`src/components/ScrapbookOutfitView.tsx`** (new component):
- Takes the outfit items array
- Renders each item image in a scattered layout with:
  - Random slight rotations (-8deg to 8deg)
  - Handwritten labels (item name + brand)
  - Decorative tape/pin elements on some items
  - A large handwritten outfit name

---

### 4. Decorative CSS Utilities

**`src/index.css`**:
- Add utility classes for scrapbook effects:
  - `.tape` — small colored rectangle rotated, positioned on image corners
  - `.torn-edge` — CSS clip-path for torn paper effect
  - `.notebook-lines` — repeating linear gradient for ruled paper
  - `.pin` — small circular dot with shadow to simulate a pushpin

---

### 5. Navbar & Global Style Updates

**`src/components/Navbar.tsx`**:
- Keep clean but add the handwritten font for the brand name or a decorative subtitle

---

### Files Changed
- `src/index.css` — handwritten font import, scrapbook CSS utilities
- `tailwind.config.ts` — handwritten font family
- `src/pages/Index.tsx` — scrapbook hero collage with decorative labels, dark background, tape elements
- `src/components/OutfitCard.tsx` — add scrapbook overview section at the top of each card
- `src/components/ScrapbookOutfitView.tsx` — new component for the magazine-style flat-lay item arrangement

