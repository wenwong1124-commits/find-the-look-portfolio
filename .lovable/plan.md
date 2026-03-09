

## Plan: Celebrity Look Shortcuts + Image Loading Performance

### 1. Celebrity Look Shortcuts on Hero Page

**`src/pages/Index.tsx`**:
- Add a "Get Inspired" section below the upload zone showing 3-4 celebrity cards (e.g., Jennie from BLACKPINK, Zara Larsson, Olivia Dean, Hailey Bieber)
- Each card is a clickable polaroid-style element with the celebrity's name in handwritten font and 3 style chips: "Casual", "Elevated", "Bold"
- Clicking a celebrity+style combo skips the upload step and sends a text-only prompt to the AI like: "Recreate Jennie from BLACKPINK's latest casual street style look" with the user's budget/tone/currency settings
- Before sending, show the StyleAdjuster controls so the user can set budget/gender/currency
- Use static placeholder silhouette images or styled text cards (no need to fetch real celebrity photos to avoid copyright issues)

**`src/components/CelebrityPicks.tsx`** (new):
- Renders a row of celebrity cards with scrapbook styling (tape, rotations, handwritten names)
- Each card has 3 clickable style tags: Casual / Elevated / Bold
- On click, calls a callback with the celebrity name + style type

### 2. Image Loading Performance Fix

The current `useItemImage` hook queues image generation requests with a 5-second delay between each, meaning 15 items across 3 outfits take over a minute to load. Fix this:

**`src/hooks/useItemImage.ts`**:
- Reduce `DELAY_BETWEEN_REQUESTS` from 5000ms to 1500ms — the rate limiter already handles 429s with retry
- Allow 2-3 concurrent requests instead of strictly sequential processing
- Show the emoji fallback immediately instead of a loading shimmer, so the card looks complete right away — then swap in the image when ready (no blocking feel)

**`src/components/OutfitCard.tsx`** and **`src/components/ScrapbookOutfitView.tsx`**:
- Show the emoji placeholder immediately as default, with a subtle fade-in when the real image loads
- This makes cards feel instantly loaded even while images trickle in

### Files Changed
- `src/pages/Index.tsx` — add celebrity picks section, wire up click-to-prompt flow
- `src/components/CelebrityPicks.tsx` — new component for celebrity shortcut cards
- `src/hooks/useItemImage.ts` — faster queue, concurrent requests
- `src/components/OutfitCard.tsx` — emoji-first display with image fade-in
- `src/components/ScrapbookOutfitView.tsx` — same emoji-first treatment

