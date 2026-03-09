import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

// ── Gemini Image Generation ──
async function generateProductImage(
  lovableApiKey: string,
  query: string
): Promise<string | null> {
  try {
    const prompt = `Product photo on clean white background: ${query}. Fashion e-commerce product photography style. Clean, professional, no model, item centered, soft studio lighting. High quality product shot.`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-pro-image-preview",
          messages: [{ role: "user", content: prompt }],
          modalities: ["image", "text"],
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`Gemini image gen error for "${query}":`, response.status);
      return null;
    }

    const data = await response.json();
    
    // Extract base64 image from response
    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (imageData && imageData.startsWith("data:image")) {
      return imageData;
    }

    console.warn(`No image generated for "${query}"`);
    return null;
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      console.warn(`Gemini image timeout for "${query}"`);
    } else {
      console.error(`Gemini image gen error for "${query}":`, e);
    }
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

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableKey) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const startTime = Date.now();
    console.log(`Generating images for ${queries.length} items via Gemini`);

    // Run with concurrency limit of 10 for parallel image generation
    const results: Record<string, string | null> = {};
    const tasks = queries.map((q: { key: string; query: string }) => async () => {
      const url = await generateProductImage(lovableKey, q.query);
      results[q.key] = url;
      return url;
    });

    await withConcurrencyLimit(tasks, 10);

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
