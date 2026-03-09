import { useState, useEffect, useRef } from "react";

const IMAGE_CACHE_KEY = "stylecapsule_image_cache_v3";
const BATCH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-product-images`;
const BATCH_DEBOUNCE_MS = 150;

// In-memory cache
const memoryCache: Record<string, string> = {};

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

// ── Batch collector ──
type PendingItem = { key: string; query: string; resolve: (url: string | null) => void };
let pendingBatch: PendingItem[] = [];
let batchTimer: ReturnType<typeof setTimeout> | null = null;

function loadDiskCache(): Record<string, string> {
  try {
    const stored = localStorage.getItem(IMAGE_CACHE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {};
}

function saveToDiskCache(entries: Record<string, string>) {
  try {
    const cache = loadDiskCache();
    Object.assign(cache, entries);
    const keys = Object.keys(cache);
    if (keys.length > 300) {
      const toDelete = keys.slice(0, keys.length - 300);
      toDelete.forEach((k) => delete cache[k]);
    }
    localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

async function flushBatch() {
  const batch = pendingBatch;
  pendingBatch = [];
  batchTimer = null;

  if (batch.length === 0) return;

  try {
    const res = await fetch(BATCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        queries: batch.map((b) => ({ key: b.key, query: b.query })),
      }),
    });
    const data = await res.json();
    const results: Record<string, string> = data.results || {};

    const toCache: Record<string, string> = {};
    for (const item of batch) {
      const url = results[item.key] || null;
      if (url) {
        memoryCache[item.key] = url;
        toCache[item.key] = url;
      }
      item.resolve(url);
    }
    if (Object.keys(toCache).length > 0) saveToDiskCache(toCache);
  } catch {
    batch.forEach((b) => b.resolve(null));
  }
}

function enqueueBatch(key: string, query: string): Promise<string | null> {
  return new Promise((resolve) => {
    pendingBatch.push({ key, query, resolve });
    if (batchTimer) clearTimeout(batchTimer);
    batchTimer = setTimeout(flushBatch, BATCH_DEBOUNCE_MS);
  });
}

export function useItemImage(
  itemDescription: string,
  brand: string,
  category: string,
  color?: string,
  material?: string,
) {
  const cacheKey = `${brand}-${itemDescription}-${category}-${color || ""}-${material || ""}`
    .toLowerCase()
    .replace(/\s+/g, "-");
  const shouldSearch = IMAGE_WORTHY_CATEGORIES.has(category);
  const [imageUrl, setImageUrl] = useState<string | null>(memoryCache[cacheKey] || null);
  const [isLoading, setIsLoading] = useState(shouldSearch && !memoryCache[cacheKey]);
  const fetchedKeyRef = useRef<string | null>(null);

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

    // Build a rich query with color + material for style-accurate results
    const parts = [brand, itemDescription];
    if (color) parts.push(color);
    if (material) parts.push(material);
    const query = parts.join(" ");

    enqueueBatch(cacheKey, query).then((url) => {
      if (url) setImageUrl(url);
      setIsLoading(false);
    });
  }, [cacheKey, shouldSearch]);

  return { imageUrl, isLoading, emoji: getItemEmoji(category) };
}
