import { useState, useEffect, useRef } from "react";

const IMAGE_CACHE_KEY = "stylecapsule_image_cache_v2";
const FUNC_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-product-image`;

// In-memory cache
const memoryCache: Record<string, string> = {};

// Sequential queue with moderate delay (Firecrawl has higher rate limits than image gen)
let requestQueue: Array<() => void> = [];
let isProcessing = false;
const DELAY_BETWEEN_REQUESTS = 2000; // 2s — Firecrawl is much faster than AI image gen

// Only search images for core clothing — accessories use emojis
const IMAGE_WORTHY_CATEGORIES = new Set(["top", "bottom", "shoes", "outerwear", "dress"]);

const categoryEmojis: Record<string, string> = {
  top: "👕", bottom: "👖", shoes: "👢", bag: "👜", accessory: "💍",
  outerwear: "🧥", dress: "👗", hat: "🎩", scarf: "🧣", belt: "🪢",
  jewelry: "💎", sunglasses: "🕶️", watch: "⌚",
};

export function getItemEmoji(category: string): string {
  return categoryEmojis[category] || "👔";
}

function enqueueRequest(fn: () => void) {
  requestQueue.push(fn);
  processQueue();
}

function processQueue() {
  if (isProcessing || requestQueue.length === 0) return;
  isProcessing = true;
  const next = requestQueue.shift()!;
  next();
  setTimeout(() => {
    isProcessing = false;
    processQueue();
  }, DELAY_BETWEEN_REQUESTS);
}

function loadDiskCache(): Record<string, string> {
  try {
    const stored = localStorage.getItem(IMAGE_CACHE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {};
}

function saveToDiskCache(key: string, url: string) {
  try {
    const cache = loadDiskCache();
    cache[key] = url;
    const keys = Object.keys(cache);
    if (keys.length > 200) delete cache[keys[0]];
    localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

async function searchImage(query: string): Promise<string | null> {
  try {
    const res = await fetch(FUNC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ query }),
    });
    const data = await res.json();
    return data.imageUrl || null;
  } catch {
    return null;
  }
}

export function useItemImage(itemDescription: string, brand: string, category: string) {
  const cacheKey = `${brand}-${itemDescription}-${category}`.toLowerCase().replace(/\s+/g, "-");
  const shouldSearch = IMAGE_WORTHY_CATEGORIES.has(category);
  const [imageUrl, setImageUrl] = useState<string | null>(memoryCache[cacheKey] || null);
  const [isLoading, setIsLoading] = useState(shouldSearch && !memoryCache[cacheKey]);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!shouldSearch) {
      setIsLoading(false);
      return;
    }

    if (memoryCache[cacheKey]) {
      setImageUrl(memoryCache[cacheKey]);
      setIsLoading(false);
      return;
    }

    const diskCache = loadDiskCache();
    if (diskCache[cacheKey]) {
      memoryCache[cacheKey] = diskCache[cacheKey];
      setImageUrl(diskCache[cacheKey]);
      setIsLoading(false);
      return;
    }

    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const query = `${brand} ${itemDescription}`;

    enqueueRequest(async () => {
      const url = await searchImage(query);
      if (url) {
        memoryCache[cacheKey] = url;
        saveToDiskCache(cacheKey, url);
        setImageUrl(url);
      }
      setIsLoading(false);
    });
  }, [cacheKey, shouldSearch]);

  return { imageUrl, isLoading, emoji: getItemEmoji(category) };
}
