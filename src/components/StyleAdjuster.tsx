import { Slider } from "@/components/ui/slider";
import { CurrencySelector, getCurrencySymbol, CURRENCY_CONFIG } from "@/components/CurrencySelector";

const ITEM_CATEGORIES = [
  { key: "top", label: "Top / Dress" },
  { key: "bottom", label: "Bottom" },
  { key: "shoes", label: "Shoes" },
  { key: "bag", label: "Bag" },
  { key: "accessories", label: "Accessories" },
];
import { motion } from "framer-motion";

const TONE_LABELS: Record<number, string> = {
  1: "Way More Casual",
  2: "Tone Down",
  3: "Keep It Similar",
  4: "Elevate It",
  5: "Full Glam",
};

interface StyleAdjusterProps {
  budget: [number, number];
  onBudgetChange: (v: [number, number]) => void;
  budgetMode: "total" | "per-item";
  onBudgetModeChange: (v: "total" | "per-item") => void;
  itemBudgets: Record<string, [number, number]>;
  onItemBudgetChange: (category: string, v: [number, number]) => void;
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
  budgetMode,
  onBudgetModeChange,
  itemBudgets,
  onItemBudgetChange,
  tone,
  onToneChange,
  gender,
  onGenderChange,
  currency,
  onCurrencyChange,
  onSubmit,
  isLoading,
}: StyleAdjusterProps) {
  const config = CURRENCY_CONFIG[currency] ?? CURRENCY_CONFIG["USD"];
  const sym = getCurrencySymbol(currency);
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
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <p className="text-xs font-semibold text-foreground font-sans uppercase tracking-wider">Budget</p>
          <CurrencySelector value={currency} onChange={onCurrencyChange} />
          <div className="ml-auto inline-flex rounded-full border border-border bg-card p-0.5">
            {(["total", "per-item"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => onBudgetModeChange(mode)}
                className={`text-[10px] px-2.5 py-1 rounded-full font-sans transition-all ${
                  budgetMode === mode
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {mode === "total" ? "Outfit" : "Per Item"}
              </button>
            ))}
          </div>
        </div>
        {budgetMode === "total" ? (
          <>
            <div className="flex gap-1.5 mb-3 flex-wrap">
              {([
                { key: "affordable", label: "Affordable" },
                { key: "midrange",   label: "Mid-range" },
                { key: "highend",    label: "High End" },
                { key: "luxury",     label: "Luxury" },
              ] as const).map(({ key, label }) => {
                const p = config.presets[key];
                const active = budget[0] === p[0] && budget[1] === p[1];
                return (
                  <button
                    key={key}
                    onClick={() => onBudgetChange(p)}
                    className={`text-[10px] px-2.5 py-1 rounded-full border font-sans transition-all ${
                      active
                        ? "bg-foreground text-background border-foreground"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-sans">
                {sym}{budget[0].toLocaleString()} – {sym}{budget[1].toLocaleString()}
              </span>
            </div>
            <Slider
              value={budget}
              onValueChange={(v) => onBudgetChange(v as [number, number])}
              min={0}
              max={config.max}
              step={config.step}
            />
          </>
        ) : (
          <div className="space-y-3">
            {ITEM_CATEGORIES.map(({ key, label }) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium text-foreground font-sans">{label}</span>
                  <span className="text-[11px] text-muted-foreground font-sans">
                    {sym}{itemBudgets[key][0].toLocaleString()} – {sym}{itemBudgets[key][1].toLocaleString()}
                  </span>
                </div>
                <Slider
                  value={itemBudgets[key]}
                  onValueChange={(v) => onItemBudgetChange(key, v as [number, number])}
                  min={0}
                  max={Math.round(config.max / 2)}
                  step={config.step}
                />
              </div>
            ))}
          </div>
        )}
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
