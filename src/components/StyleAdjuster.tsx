import { Slider } from "@/components/ui/slider";
import { CurrencySelector } from "@/components/CurrencySelector";
import { motion } from "framer-motion";

const BUDGET_OPTIONS = ["Under $200", "$200–$500", "$500–$1,000", "$1,000+"];

const TONE_LABELS: Record<number, string> = {
  1: "Way More Casual",
  2: "Tone Down",
  3: "Keep It Similar",
  4: "Elevate It",
  5: "Full Glam",
};

interface StyleAdjusterProps {
  budget: string;
  onBudgetChange: (v: string) => void;
  tone: number;
  onToneChange: (v: number) => void;
  gender: "women" | "men" | "unisex";
  onGenderChange: (v: "women" | "men" | "unisex") => void;
  currency: string;
  onCurrencyChange: (v: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export function StyleAdjuster({
  budget,
  onBudgetChange,
  tone,
  onToneChange,
  gender,
  onGenderChange,
  currency,
  onCurrencyChange,
  onSubmit,
  isLoading,
}: StyleAdjusterProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-5 w-full max-w-md mx-auto"
    >
      {/* Gender */}
      <div>
        <p className="text-xs font-semibold text-foreground font-sans uppercase tracking-wider mb-2">For</p>
        <div className="inline-flex rounded-full border border-border bg-card p-1">
          {(["women", "men", "unisex"] as const).map((g) => (
            <button
              key={g}
              onClick={() => onGenderChange(g)}
              className={`text-sm px-5 py-2 rounded-full font-sans transition-all capitalize ${
                gender === g
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Tone slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-foreground font-sans uppercase tracking-wider">Style Tone</p>
          <span className="text-xs text-muted-foreground font-sans">{TONE_LABELS[tone]}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-sans whitespace-nowrap">Casual</span>
          <Slider
            value={[tone]}
            onValueChange={([v]) => onToneChange(v)}
            min={1}
            max={5}
            step={1}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground font-sans whitespace-nowrap">Elevated</span>
        </div>
      </div>

      {/* Budget */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <p className="text-xs font-semibold text-foreground font-sans uppercase tracking-wider">Budget</p>
          <CurrencySelector value={currency} onChange={onCurrencyChange} />
        </div>
        <div className="flex flex-wrap gap-2">
          {BUDGET_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => onBudgetChange(opt)}
              className={`text-sm px-4 py-2 rounded-full border transition-all font-sans ${
                budget === opt
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-foreground hover:bg-secondary"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onSubmit}
        disabled={isLoading}
        className="w-full py-3 rounded-full bg-foreground text-background font-sans text-sm font-medium hover:bg-foreground/80 transition-colors disabled:opacity-50"
      >
        {isLoading ? "Finding your look…" : "Find My Look"}
      </motion.button>
    </motion.div>
  );
}
