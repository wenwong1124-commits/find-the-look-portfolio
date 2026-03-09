import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BAD_IMAGE_PATTERNS = [
  "placeholder", "maintenance", "404", "error", "default", "no-image",
  "coming-soon", "unavailable", "broken", "spacer", "pixel", "tracking",
];

function isValidImageUrl(url: string): boolean {
  if (!url || !url.startsWith("http")) return false;
  const lower = url.toLowerCase();
  return !BAD_IMAGE_PATTERNS.some((p) => lower.includes(p));
}

// ── Strategy 1: Firecrawl ──
async function searchViaFirecrawl(
  apiKey: string,
  query: string
): Promise<string | null> {
  try {
    const searchQuery = `${query} product photo site:zara.com OR site:hm.com OR site:asos.com OR site:nordstrom.com OR site:net-a-porter.com`;

    const response = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: searchQuery,
        limit: 3,
        scrapeOptions: { formats: ["links"] },
      }),
    });

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
        const ogImage =
          result.metadata?.ogImage || result.metadata?.["og:image"];
        if (ogImage && isValidImageUrl(ogImage)) return ogImage;
        if (result.metadata?.image && isValidImageUrl(result.metadata.image))
          return result.metadata.image;
      }
    }
    return null;
  } catch (e) {
    console.error(`Firecrawl error for "${query}":`, e);
    return null;
  }
}

// ── Strategy 2: Gemini native search (grounding) ──
async function searchViaGemini(
  lovableApiKey: string,
  query: string
): Promise<string | null> {
  try {
    const prompt = `Find a product image URL for this fashion item: "${query}". 
Search major fashion retailers (Zara, H&M, ASOS, Nordstrom, Net-a-Porter, Mango, Uniqlo).
Return ONLY a single direct image URL (https://...) pointing to a product photo. 
No explanation, no markdown, just the raw URL. If you cannot find one, reply with exactly "NONE".`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3.1-pro-preview",
          messages: [{ role: "user", content: prompt }],
          stream: false,
        }),
      }
    );

    if (!response.ok) {
      console.error(`Gemini search error for "${query}":`, response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content || content === "NONE" || content.length > 500) return null;

    // Extract URL from response (may contain markdown or extra text)
    const urlMatch = content.match(/https?:\/\/[^\s"'\])<>]+/);
    if (urlMatch && isValidImageUrl(urlMatch[0])) {
      return urlMatch[0];
    }

    return null;
  } catch (e) {
    console.error(`Gemini search error for "${query}":`, e);
    return null;
  }
}

// ── Combined search with fallback ──
let useFirecrawl = true; // flip to false if Firecrawl is unavailable for all queries

async function searchWithFallback(
  firecrawlKey: string | null,
  lovableKey: string,
  query: string
): Promise<string | null> {
  // Try Firecrawl first if available
  if (useFirecrawl && firecrawlKey) {
    const result = await searchViaFirecrawl(firecrawlKey, query);
    if (result) return result;
  }

  // Fallback to Gemini native search
  return searchViaGemini(lovableKey, query);
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  // Reset per-request
  useFirecrawl = true;

  try {
    const { queries } = await req.json();
    if (!queries || !Array.isArray(queries) || queries.length === 0) {
      return new Response(
        JSON.stringify({ error: "queries array is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY") || null;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    if (!firecrawlKey) {
      console.log("Firecrawl not configured, using Gemini fallback for all queries");
      useFirecrawl = false;
    }

    if (!lovableKey && !firecrawlKey) {
      return new Response(
        JSON.stringify({ error: "No search providers configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(
      `Batch searching ${queries.length} items (Firecrawl: ${useFirecrawl ? "yes" : "no"}, Gemini fallback: yes)...`
    );

    // Run all searches in parallel
    const results: Record<string, string | null> = {};
    const settled = await Promise.allSettled(
      queries.map(async (q: { key: string; query: string }) => {
        const url = await searchWithFallback(
          firecrawlKey,
          lovableKey!,
          q.query
        );
        results[q.key] = url;
      })
    );

    settled.forEach((s, i) => {
      if (s.status === "rejected")
        console.error(`Query ${i} rejected:`, s.reason);
    });

    const found = Object.values(results).filter(Boolean).length;
    console.log(`Batch complete. Found ${found}/${queries.length} images.`);

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("search-product-images error:", e);
    return new Response(
      JSON.stringify({
        results: {},
        error: e instanceof Error ? e.message : "Unknown",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
