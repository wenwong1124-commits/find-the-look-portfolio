import { CapsuleOutfit } from "@/types/outfit";
import { Heart, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface OutfitCardProps {
  outfit: CapsuleOutfit;
  isSaved: boolean;
  onToggleSave: () => void;
  index: number;
}

const categoryIcons: Record<string, string> = {
  top: "👕",
  bottom: "👖",
  shoes: "👟",
  bag: "👜",
  accessory: "💍",
  outerwear: "🧥",
  dress: "👗",
};

export function OutfitCard({ outfit, isSaved, onToggleSave, index }: OutfitCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
      className="border border-border rounded-lg overflow-hidden bg-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-5 pb-3">
        <div>
          <h3 className="font-serif text-xl font-semibold text-foreground">{outfit.name}</h3>
          <p className="text-sm text-muted-foreground mt-1 font-sans">{outfit.occasion}</p>
        </div>
        <button
          onClick={onToggleSave}
          className="p-2 rounded-full hover:bg-secondary transition-colors"
          aria-label={isSaved ? "Remove from saved" : "Save outfit"}
        >
          <Heart
            className={cn("w-5 h-5 transition-colors", isSaved ? "fill-warm text-warm" : "text-muted-foreground")}
          />
        </button>
      </div>

      {/* AI Explanation */}
      <div className="px-5 pb-4">
        <p className="text-sm text-muted-foreground italic font-sans leading-relaxed">"{outfit.explanation}"</p>
      </div>

      {/* Items Grid - flat lay style */}
      <div className="px-5 pb-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {outfit.items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.15 + i * 0.05 }}
              className="group bg-background rounded-md p-3 border border-border hover:border-foreground/20 transition-all"
            >
              {/* Category icon as placeholder */}
              <div className="aspect-square rounded-sm bg-secondary flex items-center justify-center mb-2 text-3xl">
                {categoryIcons[item.category] || "👔"}
              </div>

              <p className="text-xs font-medium text-foreground truncate font-sans">{item.name}</p>
              <p className="text-xs text-muted-foreground font-sans">{item.brand}</p>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs font-semibold text-foreground font-sans">
                  {item.currency}
                  {item.price}
                </span>
                <a
                  href={item.shopUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Shop ${item.name}`}
                >
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                </a>
              </div>
              <div className="flex gap-1 mt-1.5 flex-wrap">
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground font-sans">
                  {item.color}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground font-sans">
                  {item.material}
                </span>
              </div>
              {item.sizes.length > 0 && (
                <p className="text-[10px] text-muted-foreground mt-1 font-sans">
                  Sizes: {item.sizes.join(", ")}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer with all shop links */}
      <div className="border-t border-border px-5 py-3 flex flex-wrap gap-2">
        {outfit.items.map((item, i) => (
          <a
            key={i}
            href={item.shopUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border border-border hover:bg-secondary transition-colors font-sans text-foreground"
          >
            Shop {item.category}
            <ExternalLink className="w-3 h-3" />
          </a>
        ))}
      </div>
    </motion.div>
  );
}
