import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Upload, ImagePlus, X } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { OutfitCard } from "@/components/OutfitCard";
import { StyleAdjuster } from "@/components/StyleAdjuster";
import { ThinkingIndicator } from "@/components/ThinkingIndicator";
import { getCurrencySymbol } from "@/components/CurrencySelector";
import { useSavedOutfits } from "@/hooks/useSavedOutfits";
import { streamChat, Msg } from "@/lib/streamChat";
import { parseOutfitsFromText } from "@/lib/parseOutfits";
import { CapsuleOutfit } from "@/types/outfit";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

const SCRAPBOOK_IMAGES = [
  { src: "/images/scrapbook-1.jpg", className: "top-[5%] left-[2%] w-28 sm:w-36 -rotate-6" },
  { src: "/images/scrapbook-2.jpg", className: "top-[8%] right-[3%] w-24 sm:w-32 rotate-3" },
  { src: "/images/scrapbook-3.jpg", className: "top-[35%] left-[5%] w-20 sm:w-28 rotate-[8deg]" },
  { src: "/images/scrapbook-4.jpg", className: "bottom-[20%] right-[4%] w-26 sm:w-34 -rotate-[5deg]" },
  { src: "/images/scrapbook-5.jpg", className: "bottom-[8%] left-[8%] w-22 sm:w-30 rotate-[4deg]" },
  { src: "/images/scrapbook-6.jpg", className: "top-[55%] right-[8%] w-20 sm:w-26 -rotate-[3deg]" },
];

const TONE_LABELS: Record<number, string> = {
  1: "way more casual",
  2: "toned down",
  3: "similar style",
  4: "elevated",
  5: "full glam / luxury",
};

interface ChatEntry {
  id: string;
  role: "user" | "assistant";
  content: string;
  outfits?: CapsuleOutfit[];
  imagePreview?: string;
}

export default function Index() {
  const [input, setInput] = useState("");
  const [chatEntries, setChatEntries] = useState<ChatEntry[]>([]);
  const [conversationHistory, setConversationHistory] = useState<Msg[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // Upload flow state
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [budget, setBudget] = useState("$200–$500");
  const [tone, setTone] = useState(3);
  const [gender, setGender] = useState<"women" | "men" | "unisex">("women");
  const [currency, setCurrency] = useState("HKD");
  const [outfitsGenerated, setOutfitsGenerated] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const followUpInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { savedOutfits, saveOutfit, removeOutfit, isOutfitSaved } = useSavedOutfits();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatEntries, isLoading]);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image too large. Max 10MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleFindMyLook = async () => {
    if (!uploadedImage) return;

    setHasStarted(true);
    const currencySymbol = getCurrencySymbol(currency);
    const toneDesc = TONE_LABELS[tone];

    // Add user entry with image preview
    setChatEntries([
      {
        id: crypto.randomUUID(),
        role: "user",
        content: `Remake this look — ${toneDesc}, budget ${budget}, ${gender}'s fashion in ${currency}`,
        imagePreview: uploadedImage,
      },
    ]);

    setIsLoading(true);

    const systemPrompt = `You are StyleCapsule, an expert AI fashion stylist specializing in recreating looks.

The user has uploaded a photo of a look they want to recreate. Your job:
1. First, briefly describe what you see in the image — the outfit, style, key pieces, colors, and overall vibe (2-3 sentences).
2. Then generate 3 outfit sets that recreate this look within the user's preferences.

User preferences:
- Gender: ${gender}
- Budget: ${budget} total per outfit
- Style tone: ${toneDesc} (1=very casual, 3=keep it similar, 5=full glam)
- Currency: ${currency} (${currencySymbol})

Tone guidance:
- If tone is 1-2: substitute luxury pieces with affordable casual alternatives, use brands like Zara, H&M, Uniqlo, ASOS
- If tone is 3: recreate the look as closely as possible at the given budget
- If tone is 4-5: elevate the look with premium brands, better fabrics, more polished silhouettes

Return your response in TWO parts:
1. A brief analysis of the look in the image + why your recreations work.
2. A JSON block with outfit data:

\`\`\`json
[
  {
    "id": "unique-id",
    "name": "Outfit Name",
    "explanation": "Why this outfit recreates the look — color harmony, silhouette, vibe match.",
    "stylingTips": ["Tip 1", "Tip 2", "Tip 3"],
    "occasion": "Inspired look",
    "items": [
      {
        "name": "Item Name",
        "brand": "Brand Name",
        "price": 89,
        "currency": "${currencySymbol}",
        "color": "Color",
        "material": "Material",
        "category": "top|bottom|shoes|bag|accessory|outerwear|dress",
        "sizes": ["XS","S","M","L","XL"],
        "shopUrl": "https://brand-website.com/product",
        "imageDescription": "Brief description of the item for image generation"
      }
    ]
  }
]
\`\`\`

Rules:
- Generate exactly 3 outfit sets
- Each outfit: top, bottom, shoes, bag, 1+ accessory (or dress + shoes + bag + accessory)
- Use REAL fashion brands and realistic prices in ${currency}
- shopUrl should link to real brand websites
- Mix brands across outfits for variety
- After showing outfits, ask if they want changes`;

    const userMessage = `Please analyze this look and create 3 outfit recreations. Style tone: ${toneDesc}. Budget: ${budget} per outfit. Gender: ${gender}. Currency: ${currency}.`;

    const messages: Msg[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ];

    setConversationHistory([{ role: "user", content: userMessage }]);

    let assistantText = "";

    try {
      await streamChat({
        messages,
        imageUrl: uploadedImage,
        onDelta: (chunk) => {
          assistantText += chunk;
          const displayText = assistantText
            .replace(/```json[\s\S]*?```/g, "")
            .replace(/```json[\s\S]*$/g, "")
            .trim();
          setChatEntries((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant") {
              return prev.map((e, i) =>
                i === prev.length - 1 ? { ...e, content: displayText } : e
              );
            }
            return [...prev, { id: crypto.randomUUID(), role: "assistant", content: displayText }];
          });
        },
        onDone: () => {
          const outfits = parseOutfitsFromText(assistantText);
          if (outfits.length > 0) {
            setChatEntries((prev) => {
              const newEntries = [...prev];
              let lastAssistant = -1;
              for (let i = newEntries.length - 1; i >= 0; i--) {
                if (newEntries[i].role === "assistant") { lastAssistant = i; break; }
              }
              if (lastAssistant >= 0) {
                const cleanText = assistantText.replace(/```json[\s\S]*?```/, "").trim();
                newEntries[lastAssistant] = { ...newEntries[lastAssistant], content: cleanText, outfits };
              }
              return newEntries;
            });
          }
          setConversationHistory((prev) => [...prev, { role: "assistant", content: assistantText }]);
          setOutfitsGenerated(true);
          setIsLoading(false);
        },
      });
    } catch (e: any) {
      toast.error(e.message || "Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  const handleChatFollowUp = async (text: string) => {
    if (!text.trim() || isLoading) return;
    setInput("");

    setChatEntries((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: text.trim() },
    ]);

    setIsLoading(true);
    const currencySymbol = getCurrencySymbol(currency);

    const systemPrompt = `You are StyleCapsule, an expert AI fashion stylist. The user previously uploaded a look they want to recreate and you suggested outfits. Now they want refinements.

If they ask for different outfits or modifications, generate new outfit JSON blocks in the same format.
If they ask general styling questions, answer conversationally without JSON.
Always end by asking if they'd like to adjust anything.

Rules:
- Gender: ${gender}
- Budget: ${budget}
- Currency: ${currency} (${currencySymbol})
- Use REAL brands and realistic prices
- Format outfits in \`\`\`json blocks with the same schema as before`;

    const messages: Msg[] = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: text.trim() },
    ];

    setConversationHistory((prev) => [...prev, { role: "user", content: text.trim() }]);

    let assistantText = "";

    try {
      await streamChat({
        messages,
        onDelta: (chunk) => {
          assistantText += chunk;
          const displayText = assistantText
            .replace(/```json[\s\S]*?```/g, "")
            .replace(/```json[\s\S]*$/g, "")
            .trim();
          setChatEntries((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant") {
              return prev.map((e, i) =>
                i === prev.length - 1 ? { ...e, content: displayText } : e
              );
            }
            return [...prev, { id: crypto.randomUUID(), role: "assistant", content: displayText }];
          });
        },
        onDone: () => {
          const outfits = parseOutfitsFromText(assistantText);
          if (outfits.length > 0) {
            setChatEntries((prev) => {
              const newEntries = [...prev];
              let lastAssistant = -1;
              for (let i = newEntries.length - 1; i >= 0; i--) {
                if (newEntries[i].role === "assistant") { lastAssistant = i; break; }
              }
              if (lastAssistant >= 0) {
                const cleanText = assistantText.replace(/```json[\s\S]*?```/, "").trim();
                newEntries[lastAssistant] = { ...newEntries[lastAssistant], content: cleanText, outfits };
              }
              return newEntries;
            });
          }
          setConversationHistory((prev) => [...prev, { role: "assistant", content: assistantText }]);
          setIsLoading(false);
        },
      });
    } catch (e: any) {
      toast.error(e.message || "Something went wrong. Please try again.");
      setIsLoading(false);
    }
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
            className="relative min-h-screen overflow-hidden"
          >
            {/* Scrapbook fashion images */}
            <div className="absolute inset-0 pointer-events-none z-0 hidden sm:block">
              {SCRAPBOOK_IMAGES.map((img, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 0.3, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.15 * i }}
                  className={`absolute ${img.className}`}
                >
                  <img
                    src={img.src}
                    alt=""
                    className="rounded-lg shadow-lg object-cover w-full aspect-[3/4]"
                  />
                </motion.div>
              ))}
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center pt-28 sm:pt-32 pb-16 px-6">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center max-w-2xl w-full"
              >
                <h1 className="text-5xl sm:text-7xl font-light tracking-[0.25em] text-foreground mb-4 uppercase" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  REMAKE
                  <span className="block text-accent font-normal">THE LOOK</span>
                </h1>
                <p className="text-muted-foreground text-lg font-sans mb-10 max-w-md mx-auto leading-relaxed">
                  Upload a photo of any outfit you love — from Instagram, Pinterest, or a celebrity look — and we'll help you recreate it within your budget.
                </p>

                {/* Upload zone */}
                <AnimatePresence mode="wait">
                  {!uploadedImage ? (
                    <motion.div
                      key="upload-zone"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="max-w-sm mx-auto mb-8"
                    >
                      <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-lg p-10 cursor-pointer transition-all ${
                          isDragging
                            ? "border-foreground bg-secondary/50"
                            : "border-border hover:border-foreground/50 hover:bg-secondary/30"
                        }`}
                      >
                        <div className="flex flex-col items-center gap-3 text-muted-foreground">
                          <ImagePlus className="w-10 h-10" />
                          <div>
                            <p className="text-sm font-sans font-medium text-foreground">Drop your inspo here</p>
                            <p className="text-xs font-sans mt-1">or click to browse</p>
                          </div>
                        </div>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileSelect(file);
                        }}
                        className="hidden"
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="preview-and-controls"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="max-w-md mx-auto space-y-6 mb-8"
                    >
                      {/* Image preview */}
                      <div className="relative inline-block">
                        <img
                          src={uploadedImage}
                          alt="Uploaded look"
                          className="w-48 h-64 object-cover rounded-lg border border-border mx-auto"
                        />
                        <button
                          onClick={() => setUploadedImage(null)}
                          className="absolute -top-2 -right-2 p-1 rounded-full bg-foreground text-background hover:bg-foreground/80 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Style controls */}
                      <StyleAdjuster
                        budget={budget}
                        onBudgetChange={setBudget}
                        tone={tone}
                        onToneChange={setTone}
                        gender={gender}
                        onGenderChange={setGender}
                        currency={currency}
                        onCurrencyChange={setCurrency}
                        onSubmit={handleFindMyLook}
                        isLoading={isLoading}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pt-20 pb-24 px-4 max-w-6xl mx-auto"
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
                    <div className="flex flex-col items-end gap-2 max-w-md">
                      {entry.imagePreview && (
                        <img
                          src={entry.imagePreview}
                          alt="Your inspo"
                          className="w-32 h-40 object-cover rounded-lg border border-border"
                        />
                      )}
                      <div className="bg-foreground text-background px-5 py-3 rounded-2xl rounded-br-sm font-sans text-sm">
                        {entry.content}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 max-w-full">
                      {entry.content && (
                        <div className="prose prose-sm max-w-none text-foreground font-sans">
                          <ReactMarkdown>{entry.content}</ReactMarkdown>
                        </div>
                      )}
                      {entry.outfits && entry.outfits.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
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

      {/* Persistent chat input bar */}
      {hasStarted && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-md border-t border-border py-3 px-4 z-40"
        >
          <div className="max-w-3xl mx-auto relative">
            <input
              ref={followUpInputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleChatFollowUp(input)}
              placeholder={outfitsGenerated ? "Make it more casual, swap the shoes, try different brands..." : "Type a message..."}
              disabled={isLoading}
              className="w-full px-5 py-3 pr-12 rounded-full border border-border bg-card text-foreground placeholder:text-muted-foreground text-sm font-sans focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all disabled:opacity-50"
            />
            <button
              onClick={() => handleChatFollowUp(input)}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-foreground text-background hover:bg-foreground/80 transition-colors disabled:opacity-30"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
