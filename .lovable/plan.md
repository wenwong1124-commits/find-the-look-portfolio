## Plan: Improve Image Search Quality and Speed

### Problem Analysis

1. **Quality**: The current approach searches for images *after* outfits are generated, using generic web crawling. Firecrawl searches retailer sites for OG images which rarely match the specific color/material described. Gemini fallback asks for URLs but hallucinates them.
2. **Speed**: 24 items × sequential Firecrawl (8s timeout each) + Gemini fallback = 28.7s. Most Firecrawl queries timeout.

### Solution: Generate Images via Gemini Image Model

Instead of crawling the web for product photos (slow, unreliable, poor color/texture matching), use **Gemini 3 Pro Image Preview** (`google/gemini-3-pro-image-preview`) to **generate** product images that exactly match the described item's color, material, and style. This is both faster (parallel generation, no web crawling) and more accurate (the image is created to spec).

### Changes - try this for now, i will compare the results with crawling later, maybe with another API

#### 1. Rewrite `search-product-images` edge function

- Replace Firecrawl + Gemini URL search with **Gemini image generation**
- For each item query, send a prompt like: `"Product photo on white background: [Brand] [Item Name] in [Color] [Material]. Fashion e-commerce style, clean, no model."`
- Use `google/gemini-3-pro-image-preview` which returns generated images
- Increase concurrency to 10 (image gen is faster than web crawling)
- Reduce timeout to 6s per item
- Return base64 data URLs directly (no broken external links)

#### 2. Update `useItemImage.ts`

- Support data URLs (base64) in addition to http URLs in cache
- Reduce batch debounce from 250ms to 150ms for snappier feel

#### 3. Skip Firecrawl entirely for product images

- Firecrawl is timing out on most queries and returning mismatched OG images
- Image generation is deterministic and matches the description perfectly

### Files


| File                                                | Change                                                     |
| --------------------------------------------------- | ---------------------------------------------------------- |
| `supabase/functions/search-product-images/index.ts` | Rewrite to use Gemini image generation instead of crawling |
| `src/hooks/useItemImage.ts`                         | Support base64 data URLs, reduce debounce                  |


### Why This Is Better

- **Accuracy**: Generated images match exact color ("Dusty Rose") and material ("Silk Georgette") because the prompt controls it
- **Speed**: No web crawling, no timeouts, no broken URLs — just parallel API calls (~2-4s total)
- **Reliability**: No dependency on retailer site structure or Firecrawl credits