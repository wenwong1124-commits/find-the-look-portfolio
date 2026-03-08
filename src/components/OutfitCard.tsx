import { useState } from "react";
import { CapsuleOutfit } from "@/types/outfit";
import { Heart, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface OutfitCardProps {
  outfit: CapsuleOutfit;
  isSaved: boolean;
  onToggleSave: () => void;
  index: number;
}

const categoryPositions: Record<string, string> = {
  top: "top-2 left-4 w-[45%] z-20",
  outerwear: "top-0 right-2 w-[48%] z-10",
  bottom: "top-[35%] right-6 w-[44%] z-15",
  dress: "top-2 left-[15%] w-[50%] z-20",
  shoes: "bottom-4 left-4 w-[28%] z-25",
  bag: "bottom-2 right-8 w-[30%] z-20",
  accessory: "bottom-[30%] left-[10%] w-[18%] z-30",
};

const categoryEmojis: Record<string, string> = {
  top: "👕",
  bottom: "👖",
  shoes: "👢",
  bag: "👜",
  accessory: "💍",
  outerwear: "🧥",
  dress: "👗",
};

const categoryBgColors = [
  "bg-[hsl(240,15%,88%)]",
  "bg-[hsl(0,0%,95%)]",
  "bg-[hsl(220,10%,85%)]",
  "bg-[hsl(30,10%,90%)]",
  "bg-[hsl(200,10%,88%)]",
  "bg-[hsl(270,8%,90%)]",
];

export function OutfitCard({ outfit, isSaved, onToggleSave, index }: OutfitCardProps) {
  const [expanded, setExpanded] = useState(false);
  const visibleItems = expanded ? outfit.items : outfit.items.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
      className="border border-border rounded-lg overflow-hidden bg-card"
    >
      {/* Flat-lay collage area */}
      <div className="relative bg-secondary/50 aspect-[4/3] overflow-hidden">
        {outfit.items.map((item, i) => {
          const pos = categoryPositions[item.category] || `top-[${10 + i * 12}%] left-[${10 + i * 8}%] w-[35%] z-${10 + i}`;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8, rotate: -5 + Math.random() * 10 }}
              animate={{ opacity: 1, scale: 1, rotate: -3 + i * 2 }}
              transition={{ duration: 0.4, delay: index * 0.15 + i * 0.08 }}
              className={cn(
                "absolute rounded-lg shadow-md flex items-center justify-center",
                categoryBgColors[i % categoryBgColors.length],
                pos
              )}
              style={{ aspectRatio: item.category === "accessory" ? "1" : "3/4" }}
            >
              <span className="text-4xl sm:text-5xl drop-shadow-sm">
                {categoryEmojis[item.category] || "👔"}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Compact item list */}
      <div className="divide-y divide-border">
        {visibleItems.map((item, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <div className={cn(
              "w-12 h-12 rounded-md flex items-center justify-center text-xl flex-shrink-0",
              categoryBgColors[i % categoryBgColors.length]
            )}>
              {categoryEmojis[item.category] || "👔"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground font-sans truncate">{item.brand}</p>
              <p className="text-xs text-muted-foreground font-sans truncate">{item.name}</p>
              <p className="text-xs font-semibold text-accent font-sans mt-0.5">
                {item.currency}{item.price}
              </p>
            </div>
            <a
              href={item.shopUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-full hover:bg-secondary transition-colors flex-shrink-0"
              aria-label={`Shop ${item.name}`}
            >
              <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </a>
          </div>
        ))}
      </div>

      {/* More / Less toggle */}
      {outfit.items.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-2.5 text-sm text-muted-foreground hover:text-foreground font-sans flex items-center justify-center gap-1 border-t border-border transition-colors"
        >
          {expanded ? (
            <>less <ChevronUp className="w-3.5 h-3.5" /></>
          ) : (
            <>more <ChevronDown className="w-3.5 h-3.5" /></>
          )}
        </button>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border">
        <span className="text-xs text-muted-foreground font-sans">
          {outfit.name}
        </span>
        <button
          onClick={onToggleSave}
          className="p-1.5 rounded-full hover:bg-secondary transition-colors"
          aria-label={isSaved ? "Remove from saved" : "Save outfit"}
        >
          <Heart
            className={cn("w-5 h-5 transition-colors", isSaved ? "fill-warm text-warm" : "text-muted-foreground")}
          />
        </button>
      </div>
    </motion.div>
  );
}
