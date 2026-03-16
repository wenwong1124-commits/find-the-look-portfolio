import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const FASHION_TIPS = [
  "Mixing textures adds depth — try pairing matte with shine.",
  "A monochromatic palette instantly looks more polished.",
  "Balance proportions: oversized top with fitted bottom, or vice versa.",
  "Color theory: analogous tones create harmony; complementary ones, drama.",
  "The best accessory is confidence — but a great bag helps too.",
  "Layer different fabric weights and lengths for visual interest.",
  "Invest in fit — a well-tailored outfit always wins.",
  "Tonal dressing: one color worn head-to-toe is effortlessly chic.",
  "A statement belt can transform a silhouette in seconds.",
  "Shoes set the tone — they speak before you do.",
  "Texture contrast — like silk with denim — elevates any look.",
  "One statement piece + clean basics = a foolproof formula.",
  "Cool tones recede; warm tones pop — use this to direct the eye.",
  "The hem length you choose changes the energy of the whole look.",
  "Great outfits are built on great basics underneath.",
];

export function ThinkingIndicator() {
  const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * FASHION_TIPS.length));

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((i) => (i + 1) % FASHION_TIPS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-start gap-3 py-4"
    >
      <div className="flex gap-1 mt-1.5 flex-shrink-0">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-foreground"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground font-sans mb-1">Curating your outfit…</p>
        <AnimatePresence mode="wait">
          <motion.p
            key={tipIndex}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.35 }}
            className="text-sm text-foreground italic font-serif leading-snug"
          >
            {FASHION_TIPS[tipIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
