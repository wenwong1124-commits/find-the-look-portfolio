import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { OutfitCard } from "@/components/OutfitCard";
import { FollowUpChips } from "@/components/FollowUpChips";
import { ThinkingIndicator } from "@/components/ThinkingIndicator";
import { useSavedOutfits } from "@/hooks/useSavedOutfits";
import { streamChat, Msg } from "@/lib/streamChat";
import { parseOutfitsFromText, hasOutfitData } from "@/lib/parseOutfits";
import { CapsuleOutfit, FollowUpOption } from "@/types/outfit";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

const EXAMPLE_PROMPTS = [
  "Weekend trip to Japan 🇯🇵",
  "Summer wedding guest 💒",
  "First day at a new job 💼",
  "Casual brunch date ☕",
  "Music festival weekend 🎵",
];

const FOLLOW_UP_OPTIONS: FollowUpOption[] = [
  { label: "What's your budget range?", category: "budget", options: ["Under $100", "$100–$300", "$300–$600", "$600+"] },
  { label: "How many days?", category: "days", options: ["1 day", "2–3 days", "4–5 days", "A week+"] },
  { label: "What season or month?", category: "season", options: ["Spring", "Summer", "Autumn", "Winter"] },
  { label: "What style do you prefer?", category: "style", options: ["Casual", "Smart Casual", "Formal", "Edgy", "Classic", "Streetwear"] },
];

interface ChatEntry {
  id: string;
  role: "user" | "assistant";
  content: string;
  outfits?: CapsuleOutfit[];
  isThinking?: boolean;
  showFollowUp?: boolean;
}

export default function Index() {
  const [input, setInput] = useState("");
  const [chatEntries, setChatEntries] = useState<ChatEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [selectedPrefs, setSelectedPrefs] = useState<Record<string, string>>({});
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [initialOccasion, setInitialOccasion] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { savedOutfits, saveOutfit, removeOutfit, isOutfitSaved } = useSavedOutfits();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatEntries, isLoading]);

  const handleInitialSubmit = (text: string) => {
    if (!text.trim()) return;
    setHasStarted(true);
    setInitialOccasion(text.trim());
    setChatEntries([{ id: crypto.randomUUID(), role: "user", content: text.trim() }]);
    setInput("");
    setShowFollowUp(true);

    // Add assistant follow-up message
    setTimeout(() => {
      setChatEntries((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Great choice! Let me know a bit more so I can curate the perfect capsule wardrobe for you:",
          showFollowUp: true,
        },
      ]);
    }, 500);
  };

  const handlePrefSelect = (category: string, value: string) => {
    setSelectedPrefs((prev) => ({ ...prev, [category]: value }));
  };

  const handleGenerateOutfits = async () => {
    setShowFollowUp(false);

    // Build the full prompt
    const prefsText = Object.entries(selectedPrefs)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
    const fullPrompt = `Occasion: ${initialOccasion}. ${prefsText ? `Preferences: ${prefsText}.` : ""} Please generate 3 capsule outfit sets.`;

    setChatEntries((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: prefsText ? `My preferences: ${prefsText}` : "Generate outfits for me!" },
    ]);

    setIsLoading(true);

    const systemPrompt = `You are StyleCapsule, an expert AI fashion stylist. The user wants outfit recommendations.
    
IMPORTANT: Return your response in TWO parts:
1. A brief, warm introduction (2-3 sentences) about why these outfits work for their occasion.
2. A JSON block with the outfit data in this EXACT format:

\`\`\`json
[
  {
    "id": "unique-id",
    "name": "Outfit Name",
    "explanation": "Why this outfit works for the occasion",
    "occasion": "${initialOccasion}",
    "items": [
      {
        "name": "Item Name",
        "brand": "Brand Name",
        "price": 89,
        "currency": "$",
        "color": "Color",
        "material": "Material",
        "category": "top|bottom|shoes|bag|accessory|outerwear|dress",
        "sizes": ["XS","S","M","L","XL"],
        "shopUrl": "https://brand-website.com/product",
        "imageDescription": "Brief description of the item"
      }
    ]
  }
]
\`\`\`

Rules:
- Generate exactly 3 capsule outfit sets
- Each outfit must have at least: top, bottom, shoes, bag, and 1 accessory
- Use REAL fashion brands and realistic prices matching the user's budget
- shopUrl should link to the actual brand's website (e.g., https://www.zara.com, https://www.cos.com)
- Mix brands across outfits for variety
- Adapt to the season, occasion, and style preferences
- Keep explanations concise and inspiring`;

    const messages: Msg[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: fullPrompt },
    ];

    let assistantText = "";

    try {
      await streamChat({
        messages,
        onDelta: (chunk) => {
          assistantText += chunk;
          setChatEntries((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant" && !last.showFollowUp) {
              return prev.map((e, i) =>
                i === prev.length - 1 ? { ...e, content: assistantText } : e
              );
            }
            return [...prev, { id: crypto.randomUUID(), role: "assistant", content: assistantText }];
          });
        },
        onDone: () => {
          // Parse outfits from the completed text
          const outfits = parseOutfitsFromText(assistantText);
          if (outfits.length > 0) {
            setChatEntries((prev) => {
              const newEntries = [...prev];
              const lastAssistant = newEntries.findLastIndex((e) => e.role === "assistant" && !e.showFollowUp);
              if (lastAssistant >= 0) {
                // Remove the JSON block from displayed text
                const cleanText = assistantText.replace(/```json[\s\S]*?```/, "").trim();
                newEntries[lastAssistant] = { ...newEntries[lastAssistant], content: cleanText, outfits };
              }
              return newEntries;
            });
          }
          setIsLoading(false);
        },
      });
    } catch (e: any) {
      toast.error(e.message || "Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  const handleFollowUpSubmit = () => {
    handleGenerateOutfits();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar savedCount={savedOutfits.length} />

      <AnimatePresence mode="wait">
        {!hasStarted ? (
          <motion.div
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center min-h-screen px-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center max-w-2xl"
            >
              <h1 className="font-serif text-5xl sm:text-7xl font-bold tracking-[0.15em] text-foreground mb-4">
                STYLE
                <span className="block text-accent">CAPSULE</span>
              </h1>
              <p className="text-muted-foreground text-lg font-sans mb-12 max-w-md mx-auto leading-relaxed">
                Your AI-powered personal stylist. Tell us the occasion, and we'll curate the perfect capsule wardrobe for you.
              </p>

              {/* Main Input */}
              <div className="relative max-w-lg mx-auto mb-8">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleInitialSubmit(input)}
                  placeholder="What's the occasion?"
                  className="w-full px-6 py-4 pr-14 rounded-full border border-border bg-card text-foreground placeholder:text-muted-foreground text-base font-sans focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all"
                />
                <button
                  onClick={() => handleInitialSubmit(input)}
                  disabled={!input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-foreground text-background hover:bg-foreground/80 transition-colors disabled:opacity-30"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Example chips */}
              <div className="flex flex-wrap justify-center gap-2">
                {EXAMPLE_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleInitialSubmit(prompt)}
                    className="text-sm px-4 py-2 rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-all font-sans"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pt-20 pb-8 px-4 max-w-3xl mx-auto"
          >
            <div className="space-y-6">
              {chatEntries.map((entry) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`${entry.role === "user" ? "flex justify-end" : ""}`}
                >
                  {entry.role === "user" ? (
                    <div className="bg-foreground text-background px-5 py-3 rounded-2xl rounded-br-sm max-w-md font-sans text-sm">
                      {entry.content}
                    </div>
                  ) : (
                    <div className="space-y-4 max-w-full">
                      {entry.content && (
                        <div className="prose prose-sm max-w-none text-foreground font-sans">
                          <ReactMarkdown>{entry.content}</ReactMarkdown>
                        </div>
                      )}
                      {entry.showFollowUp && showFollowUp && (
                        <div className="space-y-4 mt-4">
                          <FollowUpChips
                            options={FOLLOW_UP_OPTIONS}
                            onSelect={handlePrefSelect}
                            selectedValues={selectedPrefs}
                          />
                          <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            onClick={handleFollowUpSubmit}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-foreground text-background font-sans text-sm font-medium hover:bg-foreground/80 transition-colors"
                          >
                            <span>Generate My Outfits</span>
                            <ArrowRight className="w-4 h-4" />
                          </motion.button>
                        </div>
                      )}
                      {entry.outfits && entry.outfits.length > 0 && (
                        <div className="space-y-6 mt-6">
                          {entry.outfits.map((outfit, i) => (
                            <OutfitCard
                              key={outfit.id}
                              outfit={outfit}
                              index={i}
                              isSaved={isOutfitSaved(outfit.id)}
                              onToggleSave={() =>
                                isOutfitSaved(outfit.id) ? removeOutfit(outfit.id) : saveOutfit(outfit)
                              }
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}

              {isLoading && <ThinkingIndicator />}
              <div ref={chatEndRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
