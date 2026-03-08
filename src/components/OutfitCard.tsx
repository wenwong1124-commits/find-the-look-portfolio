import { useState } from "react";
import { CapsuleOutfit, OutfitItem } from "@/types/outfit";
import { Heart, ExternalLink, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useItemImage } from "@/hooks/useItemImage";

interface OutfitCardProps {
  outfit: CapsuleOutfit;
  isSaved: boolean;
  onToggleSave: () => void;
  index: number;
}

const categoryPositions: Record<string, string> = {
  top: "top-[5%] left-1/2 -translate-x-1/2 w-[48%] z-30",
  bottom: "top-[42%] left-1/2 -translate-x-1/2 w-[44%] z-25",
  outerwear: "top-[2%] left-[5%] w-[38%] z-10 -rotate-6",
  dress: "top-[5%] left-1/2 -translate-x-1/2 w-[50%] z-30",
  shoes: "bottom-[4%] left-[8%] w-[26%] z-35",
  bag: "bottom-[8%] right-[6%] w-[28%] z-30",
  accessory: "bottom-[35%] right-[5%] w-[18%] z-35",
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
  "bg-secondary/60",
  "bg-muted/60",
  "bg-secondary/40",
  "bg-muted/40",
  "bg-secondary/50",
  "bg-muted/50",
];

function ItemImage({ item, index }: { item: OutfitItem; index: number }) {
  const { imageUrl, isLoading } = useItemImage(item.name, item.brand, item.category);

  if (isLoading) {
    return (
      <div className={cn(
        "w-10 h-10 rounded-md flex items-center justify-center text-lg flex-shrink-0 animate-pulse",
        categoryBgColors[index % categoryBgColors.length]
      )}>
        <span className="text-xs">{categoryEmojis[item.category] || "👔"}</span>
      </div>
    );
  }

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={`${item.brand} ${item.name}`}
        className="w-10 h-10 rounded-md object-cover flex-shrink-0"
      />
    );
  }

  return (
    <div className={cn(
      "w-10 h-10 rounded-md flex items-center justify-center text-lg flex-shrink-0",
      categoryBgColors[index % categoryBgColors.length]
    )}>
      {categoryEmojis[item.category] || "👔"}
    </div>
  );
}

function CollageItemImage({ item, index, outfitIndex }: { item: OutfitItem; index: number; outfitIndex: number }) {
  const { imageUrl, isLoading } = useItemImage(item.name, item.brand, item.category);
  const pos = categoryPositions[item.category] || `top-[${10 + index * 12}%] left-[${10 + index * 8}%] w-[30%] z-${10 + index}`;

  // Hide items without images in the collage (no emoji cards)
  if (!imageUrl && !isLoading) return null;

  return (
    <motion.div
      key={index}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: outfitIndex * 0.1 + index * 0.06 }}
      className={cn("absolute", pos)}
      style={{ aspectRatio: item.category === "accessory" ? "1" : "3/4" }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`${item.brand} ${item.name}`}
          className="w-full h-full object-contain drop-shadow-md"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-2xl animate-pulse drop-shadow-sm">
            {categoryEmojis[item.category] || "👔"}
          </span>
        </div>
      )}
    </motion.div>
  );
}

export function OutfitCard({ outfit, isSaved, onToggleSave, index }: OutfitCardProps) {
  const [expanded, setExpanded] = useState(false);
  const visibleItems = expanded ? outfit.items : outfit.items.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.12 }}
      className="border border-border rounded-lg overflow-hidden bg-card flex flex-col"
    >
      {/* Header: title, occasion, save */}
      <div className="flex items-start justify-between px-4 py-3 border-b border-border">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground font-sans truncate">
            {outfit.name}
          </h3>
          {outfit.occasion && (
            <span className="text-[11px] text-muted-foreground font-sans block truncate">
              {outfit.occasion}
            </span>
          )}
        </div>
        <button
          onClick={onToggleSave}
          className="p-1.5 rounded-full hover:bg-secondary transition-colors flex-shrink-0 ml-2"
          aria-label={isSaved ? "Remove from saved" : "Save outfit"}
        >
          <Heart
            className={cn("w-4 h-4 transition-colors", isSaved ? "fill-warm text-warm" : "text-muted-foreground")}
          />
        </button>
      </div>

      {/* Flat-lay collage area — white background for transparent cutouts */}
      <div className="relative bg-white aspect-[3/4] overflow-hidden">
        {outfit.items.map((item, i) => (
          <CollageItemImage key={i} item={item} index={i} outfitIndex={index} />
        ))}
      </div>

      {/* Explanation & Styling Tips */}
      {(outfit.explanation || (outfit.stylingTips && outfit.stylingTips.length > 0)) && (
        <div className="px-4 py-3 border-t border-border space-y-2">
          {outfit.explanation && (
            <p className="text-xs text-muted-foreground font-sans leading-relaxed">
              {outfit.explanation}
            </p>
          )}
          {outfit.stylingTips && outfit.stylingTips.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-accent" />
                <span className="text-[10px] font-semibold text-foreground font-sans uppercase tracking-wider">Styling Tips</span>
              </div>
              <ul className="space-y-0.5">
                {outfit.stylingTips.map((tip, i) => (
                  <li key={i} className="text-[11px] text-muted-foreground font-sans leading-snug pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-accent">
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Compact item list */}
      <div className="divide-y divide-border">
        {visibleItems.map((item, i) => (
          <div key={i} className="flex items-center gap-2.5 px-4 py-2.5">
            <ItemImage item={item} index={i} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground font-sans truncate">{item.brand}</p>
              <p className="text-[11px] text-muted-foreground font-sans truncate">{item.name}</p>
              <p className="text-[11px] font-semibold text-accent font-sans mt-0.5">
                {item.currency}{item.price}
              </p>
            </div>
            <a
              href={item.shopUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded-full hover:bg-secondary transition-colors flex-shrink-0"
              aria-label={`Shop ${item.name}`}
            >
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
            </a>
          </div>
        ))}
      </div>

      {/* More / Less toggle */}
      {outfit.items.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-2 text-xs text-muted-foreground hover:text-foreground font-sans flex items-center justify-center gap-1 border-t border-border transition-colors"
        >
          {expanded ? (
            <>less <ChevronUp className="w-3 h-3" /></>
          ) : (
            <>+{outfit.items.length - 3} more <ChevronDown className="w-3 h-3" /></>
          )}
        </button>
      )}
    </motion.div>
  );
}
