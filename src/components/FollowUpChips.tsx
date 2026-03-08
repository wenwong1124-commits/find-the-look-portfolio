import { useState } from "react";
import { motion } from "framer-motion";

interface FollowUpChipsProps {
  options: { label: string; category: string; options: string[] }[];
  onSelect: (category: string, value: string) => void;
  selectedValues: Record<string, string>;
  currencySelector?: React.ReactNode;
}

export function FollowUpChips({ options, onSelect, selectedValues }: FollowUpChipsProps) {
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});

  const handleOtherInput = (category: string, value: string) => {
    setCustomInputs((prev) => ({ ...prev, [category]: value }));
    if (value.trim()) {
      onSelect(category, value.trim());
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {options.map((group, gi) => {
        const isOtherSelected = selectedValues[group.category] !== undefined &&
          !group.options.includes(selectedValues[group.category]) &&
          selectedValues[group.category] !== "";

        return (
          <div key={gi}>
            <p className="text-sm font-medium text-foreground mb-2 font-sans">{group.label}</p>
            <div className="flex flex-wrap gap-2 items-center">
              {group.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => onSelect(group.category, opt)}
                  className={`text-sm px-4 py-2 rounded-full border transition-all font-sans ${
                    selectedValues[group.category] === opt
                      ? "bg-foreground text-background border-foreground"
                      : "border-border text-foreground hover:bg-secondary"
                  }`}
                >
                  {opt}
                </button>
              ))}
              {group.category === "style" && (
                <>
                  <button
                    onClick={() => {
                      onSelect(group.category, customInputs[group.category] || "");
                      // Focus input after selecting "Others"
                    }}
                    className={`text-sm px-4 py-2 rounded-full border transition-all font-sans ${
                      isOtherSelected || (selectedValues[group.category] === "" && customInputs[group.category] !== undefined)
                        ? "bg-foreground text-background border-foreground"
                        : "border-border text-foreground hover:bg-secondary"
                    }`}
                  >
                    Others
                  </button>
                  {(isOtherSelected || selectedValues[group.category] === "") && (
                    <input
                      type="text"
                      value={customInputs[group.category] || ""}
                      onChange={(e) => handleOtherInput(group.category, e.target.value)}
                      placeholder="Type your style..."
                      autoFocus
                      className="text-sm px-4 py-2 rounded-full border border-border bg-card text-foreground placeholder:text-muted-foreground font-sans focus:outline-none focus:ring-2 focus:ring-foreground/20 w-40"
                    />
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}
