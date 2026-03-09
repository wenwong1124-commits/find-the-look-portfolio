import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BAD_IMAGE_PATTERNS = [
  "placeholder", "maintenance", "404", "error", "default", "no-image",
  "coming-soon", "unavailable", "broken", "spacer", "pixel", "tracking",
  "logo", "icon", "banner", "sprite",
];

function isValidImageUrl(url: string): boolean {
  if (!url || !url.startsWith("http")) return false;
  const lower = url.toLowerCase();
  if (BAD_IMAGE_PATTERNS.some((p) => lower.includes(p))) return false;
  // Must look like an image URL or an OG image
  const hasImageExt = /\.(jpg|jpeg|png|webp|avif)/i.test(lower);
  const isOgOrCdn = lower.includes("og") || lower.includes("cdn") || lower.includes("image") || lower.includes("photo") || lower.includes("media");
  return hasImageExt || isOgOrCdn;
}

// ── Concurrency limiter ──
async function withConcurrencyLimit<T>(
  tasks: (() => Promise<T>)[],
  limit: number
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let idx = 0;

  async function worker() {
    while (idx < tasks.length) {
      const i = idx++;
      results[i] = await tasks[i]();
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

// ── Strategy 1: Firecrawl (fast, targeted) ──
async function searchViaFirecrawl(
  apiKey: string,
  query: string
): Promise<string | null> {
  try {
    // More targeted search — include color/material from query
    const searchQuery = `${query} product site:zara.com OR site:hm.com OR site:asos.com OR site:nordstrom.com OR site:net-a-porter.com OR site:mango.com OR site:uniqlo.com`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const response = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: searchQuery,
        limit: 5, // more results = better chance of matching style
        scrapeOptions: { formats: ["links"] },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.status === 402) {
      console.warn("Firecrawl out of credits (402)");
      return null;
    }

    if (!response.ok) {
      console.error(`Firecrawl error for "${query}":`, response.status);
      return null;
    }

    const data = await response.json();

    if (data.data && Array.isArray(data.data)) {
      for (const result of data.data) {
        const ogImage = result.metadata?.ogImage || result.metadata?.["og:image"];
        if (ogImage && isValidImageUrl(ogImage)) return ogImage;
        if (result.metadata?.image && isValidImageUrl(result.metadata.image))
          return result.metadata.image;
      }
    }
    return null;
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      console.warn(`Firecrawl timeout for "${query}"`);
    } else {
      console.error(`Firecrawl error for "${query}":`, e);
    }
    return null;
  }
}

// ── Strategy 2: Gemini native search (fallback, style-aware) ──
async function searchViaGemini(
  lovableApiKey: string,
  query: string
): Promise<string | null> {
  try {
    const prompt = `Find a product image URL for this fashion item: "${query}".

IMPORTANT: The image must visually match the described COLOR and MATERIAL/TEXTURE.
- If the query says "Dusty Rose Silk", find a dusty rose silk item, NOT a white or black one.
- If the query says "Washed Denim", find actual denim, not polyester.

Search retailers: Zara, H&M, ASOS, Nordstrom, Net-a-Porter, Mango, Uniqlo, COS, & Other Stories.
Return ONLY a single direct image URL (https://...) of a product photo showing the item.
No explanation, no markdown, just the raw URL. If you cannot find a good match, reply "NONE".`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
          stream: false,
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`Gemini search error for "${query}":`, response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content || content === "NONE" || content.length > 500) return null;

    const urlMatch = content.match(/https?:\/\/[^\s"'\])<>]+/);
    if (urlMatch && isValidImageUrl(urlMatch[0])) {
      return urlMatch[0];
    }

    return null;
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      console.warn(`Gemini timeout for "${query}"`);
    } else {
      console.error(`Gemini search error for "${query}":`, e);
    }
    return null;
  }
}

// ── Combined: Firecrawl first, Gemini fallback ──
let firecrawlAvailable = true;

async function searchWithFallback(
  firecrawlKey: string | null,
  lovableKey: string,
  query: string
): Promise<string | null> {
  if (firecrawlAvailable && firecrawlKey) {
    const result = await searchViaFirecrawl(firecrawlKey, query);
    if (result) return result;
  }

  return searchViaGemini(lovableKey, query);
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  firecrawlAvailable = true;

  try {
    const { queries } = await req.json();
    if (!queries || !Array.isArray(queries) || queries.length === 0) {
      return new Response(
        JSON.stringify({ error: "queries array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY") || null;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    if (!firecrawlKey) {
      console.log("Firecrawl not configured, using Gemini for all queries");
      firecrawlAvailable = false;
    }

    if (!lovableKey && !firecrawlKey) {
      return new Response(
        JSON.stringify({ error: "No search providers configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const startTime = Date.now();
    console.log(`Batch: ${queries.length} items (Firecrawl: ${firecrawlAvailable}, Gemini: yes)`);

    // Run with concurrency limit of 6 to avoid overwhelming APIs
    const results: Record<string, string | null> = {};
    const tasks = queries.map((q: { key: string; query: string }) => async () => {
      const url = await searchWithFallback(firecrawlKey, lovableKey!, q.query);
      results[q.key] = url;
      return url;
    });

    await withConcurrencyLimit(tasks, 6);

    const found = Object.values(results).filter(Boolean).length;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`Done: ${found}/${queries.length} images in ${elapsed}s`);

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("search-product-images error:", e);
    return new Response(
      JSON.stringify({ results: {}, error: e instanceof Error ? e.message : "Unknown" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
