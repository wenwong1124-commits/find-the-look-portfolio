import { useState, useEffect, useRef } from "react";

const IMAGE_CACHE_KEY = "stylecapsule_image_cache";
const FUNC_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-item-image`;

// In-memory cache to avoid re-fetching during session
const memoryCache: Record<string, string> = {};

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
    // Limit cache size to prevent localStorage overflow
    const keys = Object.keys(cache);
    if (keys.length > 100) {
      delete cache[keys[0]];
    }
    localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cache));
  } catch {}
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

    fetch(FUNC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ prompt }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.imageUrl) {
          memoryCache[cacheKey] = data.imageUrl;
          saveToDiskCache(cacheKey, data.imageUrl);
          setImageUrl(data.imageUrl);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [cacheKey]);

  return { imageUrl, isLoading };
}
