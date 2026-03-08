import { useState, useEffect, useCallback } from "react";
import { SavedOutfitSet, CapsuleOutfit } from "@/types/outfit";

const STORAGE_KEY = "stylecapsule_saved_outfits";

export function useSavedOutfits() {
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfitSet[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setSavedOutfits(JSON.parse(stored));
    } catch {}
  }, []);

  const persist = (outfits: SavedOutfitSet[]) => {
    setSavedOutfits(outfits);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(outfits));
  };

  const saveOutfit = useCallback((outfit: CapsuleOutfit) => {
    setSavedOutfits((prev) => {
      if (prev.some((s) => s.outfit.id === outfit.id)) return prev;
      const next = [...prev, { id: crypto.randomUUID(), outfit, savedAt: new Date().toISOString() }];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeOutfit = useCallback((outfitId: string) => {
    setSavedOutfits((prev) => {
      const next = prev.filter((s) => s.outfit.id !== outfitId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isOutfitSaved = useCallback(
    (outfitId: string) => savedOutfits.some((s) => s.outfit.id === outfitId),
    [savedOutfits]
  );

  return { savedOutfits, saveOutfit, removeOutfit, isOutfitSaved };
}
