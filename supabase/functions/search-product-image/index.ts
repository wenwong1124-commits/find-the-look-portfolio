import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query } = await req.json();
    if (!query) {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Firecrawl not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Search for product images using Firecrawl search
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
        scrapeOptions: {
          formats: ["links"],
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Firecrawl search error:", data);
      return new Response(JSON.stringify({ error: "Search failed", imageUrl: null }), {
        status: 200, // Return 200 with null so client degrades gracefully
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try to extract an image URL from the search results metadata
    let imageUrl: string | null = null;

    if (data.data && Array.isArray(data.data)) {
      for (const result of data.data) {
        // Check metadata for og:image or similar
        const ogImage = result.metadata?.ogImage || result.metadata?.["og:image"];
        if (ogImage && typeof ogImage === "string" && ogImage.startsWith("http")) {
          imageUrl = ogImage;
          break;
        }
        // Check for any image in the result
        if (result.metadata?.image && typeof result.metadata.image === "string") {
          imageUrl = result.metadata.image;
          break;
        }
      }
    }

    return new Response(JSON.stringify({ imageUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("search-product-image error:", e);
    return new Response(JSON.stringify({ imageUrl: null, error: e instanceof Error ? e.message : "Unknown" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
