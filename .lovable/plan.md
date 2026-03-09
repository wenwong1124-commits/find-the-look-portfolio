

## Plan: Speed Up Loading with Parallel Image Search, Batch Edge Function & Model Upgrade

### Problem Analysis

From the network logs:
1. **Image searches are sequential** with 2s delays — 10+ items = 20+ seconds of serial waiting
2. **Some requests fail** ("Failed to fetch") due to edge function cold starts or timeouts
3. **Each item makes a separate edge function call** — 10+ HTTP round trips
4. **Style advisor uses `gemini-3-flash-preview`** — upgrading to `gemini-3.1-pro-preview` for better quality as requested

### Changes

#### 1. Create a batch search edge function (`supabase/functions/search-product-images/index.ts`)

Replace per-item calls with a **single batch call** that accepts an array of queries and searches them all in parallel using `Promise.allSettled`. One HTTP round trip instead of 10+.

```
Client sends: { queries: [{ key: "zara-top", query: "Zara Ruffled Poplin Crop Top" }, ...] }
Server returns: { results: { "zara-top": "https://image-url...", ... } }
```

The edge function will fire all Firecrawl searches concurrently (Firecrawl supports this), then return all results at once.

#### 2. Refactor `useItemImage.ts` → batch client-side (`src/hooks/useItemImage.ts`)

Replace the per-item sequential queue with a **batch collector** pattern:
- Items register their queries into a shared pending set
- After a short debounce (300ms), all pending queries fire in one batch call
- Results are distributed back to each hook instance via a shared event/callback map
- Cache (memory + localStorage) stays the same

This eliminates 2s delays between items entirely.

#### 3. Upgrade model to `gemini-3.1-pro-preview` (`supabase/functions/style-advisor/index.ts`)

Change the model from `google/gemini-3-flash-preview` to `google/gemini-3.1-pro-preview` for stronger reasoning and better outfit quality.

#### 4. Register new edge function (`supabase/config.toml`)

Add `[functions.search-product-images]` with `verify_jwt = false`.

#### 5. Filter bad images (`supabase/functions/search-product-images/index.ts`)

Add validation to reject placeholder/maintenance images (like the H&M `down_for_maintenance.jpeg` seen in logs). Check that returned URLs don't contain patterns like `maintenance`, `placeholder`, `404`, `error`.

### Performance Impact

| Metric | Before | After |
|--------|--------|-------|
| Image search calls | 10+ sequential | 1 batch |
| Image load time | 20-30s | 2-4s |
| AI model | gemini-3-flash-preview | gemini-3.1-pro-preview |
| HTTP round trips | 10+ | 1 |

### Files

| File | Change |
|------|--------|
| `supabase/functions/search-product-images/index.ts` | New batch edge function |
| `src/hooks/useItemImage.ts` | Batch collector pattern, remove sequential queue |
| `supabase/functions/style-advisor/index.ts` | Model → `gemini-3.1-pro-preview` |
| `supabase/config.toml` | Add `search-product-images` function entry |

