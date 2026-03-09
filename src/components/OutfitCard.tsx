import { CapsuleOutfit, OutfitItem } from "@/types/outfit";
import { Heart, ExternalLink, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useItemImage } from "@/hooks/useItemImage";
import { ScrapbookOutfitView } from "@/components/ScrapbookOutfitView";
import { OutfitFeedback, OutfitFeedbackData } from "@/components/OutfitFeedback";

interface OutfitCardProps {
  outfit: CapsuleOutfit;
  isSaved: boolean;
  onToggleSave: () => void;
  index: number;
  feedback?: OutfitFeedbackData;
  onFeedback?: (data: OutfitFeedbackData) => void;
}

const categoryBgColors = [
  "bg-secondary/60",
  "bg-muted/60",
  "bg-secondary/40",
  "bg-muted/40",
  "bg-secondary/50",
  "bg-muted/50",
];

function ItemImage({ item, index }: { item: OutfitItem; index: number }) {
  const { imageUrl, isLoading, emoji } = useItemImage(item.name, item.brand, item.category, item.color, item.material);

  return (
    <div className={cn(
      "w-16 h-16 rounded-lg flex items-center justify-center text-xl flex-shrink-0 relative overflow-hidden",
      categoryBgColors[index % categoryBgColors.length]
    )}>
      <span className={cn("transition-opacity duration-300", imageUrl ? "opacity-0" : "opacity-100")}>
        {emoji}
      </span>
      {imageUrl && (
        <motion.img
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          src={imageUrl}
          alt={`${item.brand} ${item.name}`}
          className="absolute inset-0 w-full h-full object-contain"
        />
      )}
    </div>
  );
}

export function OutfitCard({ outfit, isSaved, onToggleSave, index }: OutfitCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.12 }}
      className="border border-border rounded-lg overflow-hidden bg-card flex flex-col"
    >
      <ScrapbookOutfitView items={outfit.items} outfitName={outfit.name} />

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

      {(outfit.explanation || (outfit.stylingTips && outfit.stylingTips.length > 0)) && (
        <div className="px-4 py-3 border-b border-border space-y-2">
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

      <div className="divide-y divide-border">
        {outfit.items.map((item, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
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
    </motion.div>
  );
}
