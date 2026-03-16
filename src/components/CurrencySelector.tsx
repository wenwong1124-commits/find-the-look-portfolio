import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Preset = [number, number];
export interface CurrencyConfigEntry {
  max: number;
  step: number;
  outfitDefaults: Preset;
  presets: { affordable: Preset; midrange: Preset; highend: Preset; luxury: Preset };
  itemDefaults: Record<string, Preset>;
}

export const CURRENCY_CONFIG: Record<string, CurrencyConfigEntry> = {
  HKD: {
    max: 20000, step: 200,
    outfitDefaults: [1000, 6000],
    presets: { affordable: [200, 2000], midrange: [2000, 6000], highend: [6000, 12000], luxury: [12000, 20000] },
    itemDefaults: { top: [200, 2000], bottom: [200, 2000], shoes: [500, 3000], bag: [500, 4000], accessories: [100, 1000] },
  },
  USD: {
    max: 2500, step: 25,
    outfitDefaults: [100, 750],
    presets: { affordable: [25, 250], midrange: [250, 750], highend: [750, 1500], luxury: [1500, 2500] },
    itemDefaults: { top: [25, 250], bottom: [25, 250], shoes: [50, 400], bag: [50, 500], accessories: [15, 150] },
  },
  EUR: {
    max: 2300, step: 25,
    outfitDefaults: [100, 700],
    presets: { affordable: [25, 230], midrange: [230, 700], highend: [700, 1400], luxury: [1400, 2300] },
    itemDefaults: { top: [25, 230], bottom: [25, 230], shoes: [50, 370], bag: [50, 460], accessories: [15, 140] },
  },
  GBP: {
    max: 2000, step: 25,
    outfitDefaults: [80, 600],
    presets: { affordable: [20, 200], midrange: [200, 600], highend: [600, 1200], luxury: [1200, 2000] },
    itemDefaults: { top: [20, 200], bottom: [20, 200], shoes: [40, 320], bag: [40, 400], accessories: [10, 120] },
  },
  JPY: {
    max: 300000, step: 1000,
    outfitDefaults: [10000, 80000],
    presets: { affordable: [3000, 25000], midrange: [25000, 80000], highend: [80000, 160000], luxury: [160000, 300000] },
    itemDefaults: { top: [3000, 25000], bottom: [3000, 25000], shoes: [5000, 40000], bag: [5000, 60000], accessories: [2000, 15000] },
  },
  CNY: {
    max: 18000, step: 100,
    outfitDefaults: [500, 5000],
    presets: { affordable: [200, 1800], midrange: [1800, 5000], highend: [5000, 10000], luxury: [10000, 18000] },
    itemDefaults: { top: [200, 1800], bottom: [200, 1800], shoes: [300, 2500], bag: [300, 3500], accessories: [100, 900] },
  },
};

const CURRENCIES = [
  { code: "HKD", symbol: "HK$", label: "HKD (HK$)" },
  { code: "USD", symbol: "$", label: "USD ($)" },
  { code: "EUR", symbol: "€", label: "EUR (€)" },
  { code: "GBP", symbol: "£", label: "GBP (£)" },
  { code: "JPY", symbol: "¥", label: "JPY (¥)" },
  { code: "CNY", symbol: "¥", label: "CNY (¥)" },
];

interface CurrencySelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function CurrencySelector({ value, onChange }: CurrencySelectorProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[120px] h-9 rounded-full border-border bg-card text-foreground text-sm font-sans">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CURRENCIES.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            {c.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function getCurrencySymbol(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
}
