import { motion } from "framer-motion";

interface FollowUpChipsProps {
  options: { label: string; category: string; options: string[] }[];
  onSelect: (category: string, value: string) => void;
  selectedValues: Record<string, string>;
}

export function FollowUpChips({ options, onSelect, selectedValues }: FollowUpChipsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {options.map((group, gi) => (
        <div key={gi}>
          <p className="text-sm font-medium text-foreground mb-2 font-sans">{group.label}</p>
          <div className="flex flex-wrap gap-2">
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
          </div>
        </div>
      ))}
    </motion.div>
  );
}
