import { useState, useEffect, useRef } from "react";

const IMAGE_CACHE_KEY = "stylecapsule_image_cache_v4";
const BATCH_URL = `${import.meta.env.VITE_CRAWLER_URL}/search-products`;
const BATCH_DEBOUNCE_MS = 150;

// In-memory cache
const memoryCache: Record<string, string> = {};

// Only search images for core clothing — accessories use emojis
const IMAGE_WORTHY_CATEGORIES = new Set(["top", "bottom", "shoes", "bag", "outerwear", "dress", "accessory", "jewelry", "hat", "belt", "sunglasses", "scarf"]);

const categoryEmojis: Record<string, string> = {
  top: "👕", bottom: "👖", shoes: "👢", bag: "👜", accessory: "💍",
  outerwear: "🧥", dress: "👗", hat: "🎩", scarf: "🧣", belt: "🪢",
  jewelry: "💎", sunglasses: "🕶️", watch: "⌚",
};

export function getItemEmoji(category: string): string {
  return categoryEmojis[category] || "👔";
}

// ── Batch collector ──
type PendingItem = { key: string; query: string; shopUrl?: string; resolve: (url: string | null) => void };
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        queries: batch.map((b) => ({ key: b.key, query: b.query, shopUrl: b.shopUrl })),
      }),
    });
    const data = await res.json();
    const results: Record<string, { imageUrl?: string } | string> = data.results || {};

    const toCache: Record<string, string> = {};
    for (const item of batch) {
      const raw = results[item.key];
      const url = (typeof raw === "string" ? raw : raw?.imageUrl) || null;
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

function enqueueBatch(key: string, query: string, shopUrl?: string): Promise<string | null> {
  return new Promise((resolve) => {
    pendingBatch.push({ key, query, shopUrl, resolve });
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
  shopUrl?: string,
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

    if (fetchedKeyRef.current === cacheKey) return;
    fetchedKeyRef.current = cacheKey;

    // Build a rich query with color + material for style-accurate results
    const parts = [brand, itemDescription];
    if (color) parts.push(color);
    if (material) parts.push(material);
    const query = parts.join(" ");

    enqueueBatch(cacheKey, query, shopUrl).then((url) => {
      if (url) setImageUrl(url);
      setIsLoading(false);
    });
  }, [cacheKey, shouldSearch]);

  return { imageUrl, isLoading, emoji: getItemEmoji(category) };
}
