import { CapsuleOutfit, OutfitItem } from "@/types/outfit";
import { Heart, Sparkles } from "lucide-react";
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

const CATEGORY_LABELS: Record<string, string> = {
  top: "Top", bottom: "Bottom", shoes: "Shoes", bag: "Bag",
  outerwear: "Outerwear", dress: "Dress", accessory: "Accessory",
  hat: "Hat", scarf: "Scarf", belt: "Belt", jewelry: "Jewelry",
  sunglasses: "Sunglasses", watch: "Watch",
};

const categoryBgColors = [
  "bg-secondary/60", "bg-muted/60", "bg-secondary/40",
  "bg-muted/40", "bg-secondary/50", "bg-muted/50",
];

function ItemImage({ item, index }: { item: OutfitItem; index: number }) {
  const { imageUrl, isLoading, emoji } = useItemImage(item.name, item.brand, item.category, item.color, item.material, item.shopUrl);

  return (
    <div className={cn(
      "w-16 h-16 rounded-lg flex items-center justify-center text-xl flex-shrink-0 relative overflow-hidden",
      categoryBgColors[index % categoryBgColors.length]
    )}>
      {isLoading ? (
        <motion.div
          className="w-5 h-5 rounded-full border-2 border-muted-foreground/20 border-t-foreground/50"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
        />
      ) : (
        <span className={cn("transition-opacity duration-300", imageUrl ? "opacity-0" : "opacity-100")}>
          {emoji}
        </span>
      )}
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

export function OutfitCard({ outfit, isSaved, onToggleSave, index, feedback, onFeedback }: OutfitCardProps) {
  const total = outfit.items.reduce((sum, item) => sum + (item.price || 0), 0);
  const currencySymbol = outfit.items[0]?.currency ?? "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.12 }}
      className="border border-border rounded-lg overflow-hidden bg-card flex flex-col"
    >
      <ScrapbookOutfitView items={outfit.items} outfitName={outfit.name} />

      {/* Header */}
      <div className="flex items-start justify-between px-4 py-3 border-b border-border">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground font-serif leading-snug">
            {outfit.name}
          </h3>
          {outfit.occasion && (
            <span className="text-[11px] text-muted-foreground font-sans block mt-0.5">
              {outfit.occasion}
            </span>
          )}
        </div>
        <button
          onClick={onToggleSave}
          className="p-1.5 rounded-full hover:bg-secondary transition-colors flex-shrink-0 ml-2"
          aria-label={isSaved ? "Remove from saved" : "Save outfit"}
        >
          <Heart className={cn("w-4 h-4 transition-colors", isSaved ? "fill-warm text-warm" : "text-muted-foreground")} />
        </button>
      </div>

      {/* Explanation */}
      {outfit.explanation && (
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm text-foreground/80 font-serif italic leading-relaxed border-l-2 border-accent/50 pl-3">
            {outfit.explanation}
          </p>
        </div>
      )}

      {/* Styling Tips */}
      {outfit.stylingTips && outfit.stylingTips.length > 0 && (
        <div className="px-4 py-3 border-b border-border bg-muted/20">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3 h-3 text-accent" />
            <span className="text-[10px] font-semibold text-foreground font-sans uppercase tracking-wider">Styling Tips</span>
          </div>
          <ul className="space-y-1.5">
            {outfit.stylingTips.map((tip, i) => (
              <li key={i} className="flex gap-2 text-xs text-muted-foreground font-sans leading-snug">
                <span className="text-accent font-semibold flex-shrink-0">{i + 1}.</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Item list */}
      <div className="divide-y divide-border flex-1">
        {outfit.items.map((item, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <ItemImage item={item} index={i} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] font-medium text-muted-foreground font-sans bg-muted px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                  {CATEGORY_LABELS[item.category] ?? item.category}
                </span>
              </div>
              <p className="text-xs font-semibold text-foreground font-sans truncate">{item.brand}</p>
              <p className="text-[11px] text-muted-foreground font-sans truncate">{item.name}</p>
              {item.color && (
                <p className="text-[10px] text-muted-foreground/70 font-sans truncate mt-0.5">{item.color} · {item.material}</p>
              )}
            </div>
            <p className="text-xs font-semibold text-foreground font-sans flex-shrink-0">
              {item.currency}{item.price?.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-muted/20">
        <span className="text-[11px] text-muted-foreground font-sans uppercase tracking-wider">Total</span>
        <span className="text-sm font-semibold text-foreground font-sans">{currencySymbol}{total.toLocaleString()}</span>
      </div>

      {onFeedback && (
        <OutfitFeedback feedback={feedback} onFeedback={onFeedback} />
      )}
    </motion.div>
  );
}
