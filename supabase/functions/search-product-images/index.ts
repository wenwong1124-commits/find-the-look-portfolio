import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BAD_IMAGE_PATTERNS = [
  "placeholder", "maintenance", "404", "error", "default", "no-image",
  "coming-soon", "unavailable", "broken",
];

function isValidImageUrl(url: string): boolean {
  if (!url || !url.startsWith("http")) return false;
  const lower = url.toLowerCase();
  return !BAD_IMAGE_PATTERNS.some((p) => lower.includes(p));
}

async function searchSingleQuery(
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
    console.error(`Search error for "${query}":`, e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { queries } = await req.json();
    if (!queries || !Array.isArray(queries) || queries.length === 0) {
      return new Response(
        JSON.stringify({ error: "queries array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Firecrawl not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Batch searching ${queries.length} items...`);

    // Run all searches in parallel
    const results: Record<string, string | null> = {};
    const settled = await Promise.allSettled(
      queries.map(async (q: { key: string; query: string }) => {
        const url = await searchSingleQuery(apiKey, q.query);
        results[q.key] = url;
      })
    );

    // Log any failures
    settled.forEach((s, i) => {
      if (s.status === "rejected")
        console.error(`Query ${i} rejected:`, s.reason);
    });

    console.log(`Batch complete. Found ${Object.values(results).filter(Boolean).length}/${queries.length} images.`);

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
