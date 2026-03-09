

## Plan: Minimize Load Time for AI Chat & Image Generation

### Root Cause Analysis

There are two separate bottlenecks:

1. **Image generation (critical)**: Each outfit item triggers a separate edge function call to `generate-item-image`, which calls the Gemini image model. With 3 outfits × ~5 image-worthy items = ~15 sequential requests, each with a 12-second delay between them. That's **3+ minutes** just for images. The edge function also retries up to 4 times with 15-45 second waits on 429s, making it even worse. The logs show constant rate limiting — nearly every request hits 429.

2. **Chat response (moderate)**: The style-advisor uses `gemini-2.5-flash-lite` (fastest model) but the system prompts are very long (~2000 chars). This is acceptable but can be trimmed.

### Proposed Changes

#### 1. Replace per-item AI image generation with a single batch call (`supabase/functions/generate-item-image/index.ts` + `src/hooks/useItemImage.ts`)

Instead of making 15 separate image generation calls, batch all items into a **single edge function call** that generates images for all items at once using one AI request with multiple items described in the prompt.

- New edge function accepts an array of prompts, generates a grid/collage or multiple images in one call
- Client sends all pending items in one request after outfits are parsed
- Falls back to emoji if the batch call fails

**If batching isn't reliable** (Gemini image model may struggle with multi-item requests), the fallback is:

#### 1b. Disable AI image generation entirely — emoji-only mode

- Remove the `generate-item-image` edge function calls completely
- All items display their category emoji (already works perfectly)
- **Zero additional API calls, zero latency, zero rate limit issues**
- The scrapbook view and item list already have full emoji support

This is the highest-impact change — it eliminates 90% of the rate limiting.

#### 2. Upgrade chat model for better speed-quality balance (`supabase/functions/style-advisor/index.ts`)

- Switch from `gemini-2.5-flash-lite` to `gemini-3-flash-preview` (recommended default, better quality, still fast)
- Or keep `flash-lite` if speed is paramount

#### 3. Trim system prompts (`src/pages/Index.tsx`)

- Condense the celebrity/upload system prompts — remove redundant instructions
- Move repeated JSON schema to a shared constant
- Reduce token count by ~40% without losing any instruction quality

#### 4. Add progress feedback to the UI (`src/pages/Index.tsx`)

- Show outfit cards immediately as they stream in (already happening via `parseOutfitsFromText`)
- Remove the image loading spinner/skeleton for items — show emoji instantly, no "loading" state
- Add a toast or subtle indicator if images are loading in background

#### 5. Optimize the request queue (`src/hooks/useItemImage.ts`)

If keeping image gen (not recommended):
- Increase `DELAY_BETWEEN_REQUESTS` to 20s
- Reduce max retries in the edge function from 4 to 1
- Cap total concurrent queued requests to 6 (drop the rest)
- Add a global "cooldown" after any 429 — pause all queued requests for 60s

### Recommendation

**Go with option 1b (emoji-only)** — it's the simplest, most reliable fix. The AI-generated product cutout images are nice-to-have but they cause 3+ minutes of loading and constant 429 errors. The emoji-based display already works well and loads instantly.

### Files to modify

| File | Change |
|------|--------|
| `src/hooks/useItemImage.ts` | Disable all fetch logic, return emoji-only (or remove entirely) |
| `src/components/OutfitCard.tsx` | Remove `ItemImage` component's image loading, show emoji only |
| `src/components/ScrapbookOutfitView.tsx` | Remove image loading, show emoji only |
| `supabase/functions/style-advisor/index.ts` | Optionally upgrade model to `gemini-3-flash-preview` |
| `src/pages/Index.tsx` | Trim system prompts ~40% |

