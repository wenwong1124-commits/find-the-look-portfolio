import { Navbar } from "@/components/Navbar";
import { OutfitCard } from "@/components/OutfitCard";
import { useSavedOutfits } from "@/hooks/useSavedOutfits";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";

export default function SavedOutfits() {
  const { savedOutfits, removeOutfit, isOutfitSaved } = useSavedOutfits();

  return (
    <div className="min-h-screen bg-background">
      <Navbar savedCount={savedOutfits.length} />

      <div className="pt-20 pb-12 px-4 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-foreground">Saved Outfits</h1>
          <p className="text-muted-foreground font-sans mt-1">
            Your curated collection of capsule outfits
          </p>
        </div>

        {savedOutfits.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Heart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-sans mb-4">No saved outfits yet</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-foreground text-background font-sans text-sm font-medium hover:bg-foreground/80 transition-colors"
            >
              Start Styling
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {savedOutfits.map((saved, i) => (
              <OutfitCard
                key={saved.id}
                outfit={saved.outfit}
                index={i}
                isSaved={true}
                onToggleSave={() => removeOutfit(saved.outfit.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
