import { useState, useEffect, useRef } from "react";

const IMAGE_CACHE_KEY = "stylecapsule_image_cache";
const FUNC_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-item-image`;

// In-memory cache to avoid re-fetching during session
const memoryCache: Record<string, string> = {};

// Global request queue — strictly sequential to avoid 429s
let requestQueue: Array<() => void> = [];
let isProcessing = false;
const DELAY_BETWEEN_REQUESTS = 4000; // 4s between requests

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
    if (keys.length > 100) {
      delete cache[keys[0]];
    }
    localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

async function fetchWithRetry(prompt: string, retries = 2): Promise<string | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(FUNC_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ prompt }),
      });

      if (res.status === 429) {
        // Rate limited — wait longer then retry
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 12000 * (attempt + 1)));
          continue;
        }
        return null;
      }

      const data = await res.json();
      if (data.imageUrl) return data.imageUrl;
      return null;
    } catch {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 3000));
        continue;
      }
      return null;
    }
  }
  return null;
}

export function useItemImage(itemDescription: string, brand: string, category: string) {
  const cacheKey = `${brand}-${itemDescription}-${category}`.toLowerCase().replace(/\s+/g, "-");
  const [imageUrl, setImageUrl] = useState<string | null>(memoryCache[cacheKey] || null);
  const [isLoading, setIsLoading] = useState(!memoryCache[cacheKey]);
  const fetchedRef = useRef(false);

  useEffect(() => {
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

    const prompt = `${brand} ${itemDescription} (${category})`;

    // Enqueue instead of firing immediately
    enqueueRequest(async () => {
      const url = await fetchWithRetry(prompt);
      if (url) {
        memoryCache[cacheKey] = url;
        saveToDiskCache(cacheKey, url);
        setImageUrl(url);
      }
      setIsLoading(false);
    });
  }, [cacheKey]);

  return { imageUrl, isLoading };
}
