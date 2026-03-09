import { OutfitItem } from "@/types/outfit";
import { getItemEmoji } from "@/hooks/useItemImage";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const ROTATIONS = [-6, 4, -3, 7, -5, 3, -8, 5];
const TAPE_COLORS = ["tape-pink", "tape-green", "tape-blue", ""];
const ANNOTATIONS = ["♡", "✦", "★", "→", "◯", "✿"];

function ScrapbookItem({ item, index }: { item: OutfitItem; index: number }) {
  const emoji = getItemEmoji(item.category);
  const rotation = ROTATIONS[index % ROTATIONS.length];
  const tapeColor = TAPE_COLORS[index % TAPE_COLORS.length];
  const showTape = index % 3 !== 1;
  const showAnnotation = index % 2 === 0;

  const positions = [
    "col-start-1 row-start-1",
    "col-start-2 row-start-1",
    "col-start-1 row-start-2",
    "col-start-2 row-start-2",
    "col-start-1 row-start-3",
    "col-start-2 row-start-3",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, rotate: 0 }}
      animate={{ opacity: 1, rotate: rotation }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={cn("relative p-1", positions[index % positions.length])}
    >
      {showTape && (
        <div
          className={cn("tape", tapeColor)}
          style={{
            top: "-6px",
            left: index % 2 === 0 ? "10%" : "50%",
            transform: `rotate(${-15 + index * 8}deg)`,
            width: "40px",
            height: "12px",
          }}
        />
      )}

      <div className="bg-card border border-border/30 p-1.5 shadow-sm relative" style={{ transform: `rotate(${rotation * 0.3}deg)` }}>
        <div className="w-full aspect-square bg-muted flex items-center justify-center text-2xl">
          {emoji}
        </div>
      </div>

      <p
        className="font-handwritten text-sm text-foreground/80 mt-1 text-center leading-tight"
        style={{ transform: `rotate(${-rotation * 0.5}deg)` }}
      >
        {item.brand}
      </p>

      {showAnnotation && (
        <span
          className="absolute font-handwritten text-lg text-accent-foreground/40"
          style={{
            top: index % 2 === 0 ? "-8px" : "auto",
            bottom: index % 2 !== 0 ? "-4px" : "auto",
            right: "-4px",
            transform: `rotate(${rotation * 2}deg)`,
          }}
        >
          {ANNOTATIONS[index % ANNOTATIONS.length]}
        </span>
      )}
    </motion.div>
  );
}

interface ScrapbookOutfitViewProps {
  items: OutfitItem[];
  outfitName: string;
}

export function ScrapbookOutfitView({ items, outfitName }: ScrapbookOutfitViewProps) {
  return (
    <div className="relative notebook-lines bg-card/50 p-4 overflow-hidden">
      <div className="absolute left-2 top-0 bottom-0 flex flex-col justify-evenly">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="w-2 h-2 rounded-full border-2 border-border/30" />
        ))}
      </div>

      <h4
        className="font-handwritten text-2xl text-foreground text-center mb-3 relative"
        style={{ transform: "rotate(-1.5deg)" }}
      >
        {outfitName}
        <span className="block h-[2px] bg-foreground/20 mt-0.5 mx-auto" style={{ width: "60%" }} />
      </h4>

      <div className="grid grid-cols-2 gap-2 pl-4">
        {items.slice(0, 6).map((item, i) => (
          <ScrapbookItem key={i} item={item} index={i} />
        ))}
      </div>

      <span
        className="absolute bottom-2 right-3 font-handwritten text-xs text-muted-foreground/50"
        style={{ transform: "rotate(3deg)" }}
      >
        styled with love ♡
      </span>
    </div>
  );
}
