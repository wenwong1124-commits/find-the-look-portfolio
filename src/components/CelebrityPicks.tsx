import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const CELEBRITIES = [
  {
    name: "Jennie",
    subtitle: "BLACKPINK",
    image: "/images/celeb-jennie.jpg",
    rotation: -3,
    tapeColor: "tape-pink",
  },
  {
    name: "Zara Larsson",
    subtitle: "Pop Icon",
    image: "/images/celeb-zara.jpg",
    rotation: 4,
    tapeColor: "tape-green",
  },
  {
    name: "Olivia Dean",
    subtitle: "Soul Star",
    image: "/images/celeb-olivia.jpg",
    rotation: -2,
    tapeColor: "tape-blue",
  },
];

const STYLE_CHIPS = ["Casual", "Elevated", "Bold"] as const;

interface CelebrityPicksProps {
  onSelect: (celebrity: string, style: string) => void;
  disabled?: boolean;
}

export function CelebrityPicks({ onSelect, disabled }: CelebrityPicksProps) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <p
        className="font-handwritten text-2xl text-card/70 text-center mb-5"
        style={{ transform: "rotate(-1deg)" }}
      >
        or steal their look ✦
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {CELEBRITIES.map((celeb, i) => (
          <motion.div
            key={celeb.name}
            initial={{ opacity: 0, y: 20, rotate: 0 }}
            animate={{ opacity: 1, y: 0, rotate: celeb.rotation }}
            transition={{ duration: 0.5, delay: 0.15 * i }}
            className="relative"
          >
            {/* Tape */}
            <div
              className={cn("tape", celeb.tapeColor)}
              style={{
                top: "-7px",
                left: i % 2 === 0 ? "20%" : "45%",
                transform: `rotate(${-12 + i * 10}deg)`,
                width: "44px",
                height: "12px",
              }}
            />

            <div className="bg-card p-3 pb-4 shadow-lg">
              {/* Avatar placeholder */}
              <div className="w-full aspect-[3/4] bg-muted flex items-center justify-center mb-3 relative overflow-hidden">
                <span className="font-handwritten text-5xl text-muted-foreground/30">
                  {celeb.initials}
                </span>
                <span className="absolute bottom-2 right-2 font-handwritten text-xs text-muted-foreground/50 rotate-3">
                  ♡
                </span>
              </div>

              {/* Name */}
              <p
                className="font-handwritten text-xl text-foreground text-center leading-tight"
                style={{ transform: `rotate(${-celeb.rotation * 0.4}deg)` }}
              >
                {celeb.name}
              </p>
              <p className="text-[10px] text-muted-foreground text-center font-sans uppercase tracking-widest mt-0.5">
                {celeb.subtitle}
              </p>

              {/* Style chips */}
              <div className="flex gap-1.5 mt-3 justify-center flex-wrap">
                {STYLE_CHIPS.map((style) => (
                  <button
                    key={style}
                    disabled={disabled}
                    onClick={() => onSelect(celeb.name + (celeb.subtitle !== celeb.name ? ` from ${celeb.subtitle}` : ""), style)}
                    className="text-[11px] px-3 py-1.5 rounded-full border border-border text-foreground font-sans hover:bg-foreground hover:text-background transition-all disabled:opacity-40 disabled:pointer-events-none"
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
