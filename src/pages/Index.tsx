import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Upload, ImagePlus, X } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { OutfitCard } from "@/components/OutfitCard";
import { StyleAdjuster } from "@/components/StyleAdjuster";
import { ThinkingIndicator } from "@/components/ThinkingIndicator";
import { getCurrencySymbol } from "@/components/CurrencySelector";
import { CelebrityPicks } from "@/components/CelebrityPicks";
import { useSavedOutfits } from "@/hooks/useSavedOutfits";
import { streamChat, Msg } from "@/lib/streamChat";
import { parseOutfitsFromText } from "@/lib/parseOutfits";
import { CapsuleOutfit } from "@/types/outfit";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

const SCRAPBOOK_IMAGES = [
  { src: "/images/scrapbook-1.jpg", style: { top: "6%", left: "3%", width: "180px", transform: "rotate(-8deg)" } },
  { src: "/images/scrapbook-2.jpg", style: { top: "4%", right: "5%", width: "160px", transform: "rotate(5deg)" } },
  { src: "/images/scrapbook-3.jpg", style: { top: "38%", left: "2%", width: "150px", transform: "rotate(10deg)" } },
  { src: "/images/scrapbook-4.jpg", style: { bottom: "18%", right: "3%", width: "170px", transform: "rotate(-4deg)" } },
  { src: "/images/scrapbook-5.jpg", style: { bottom: "5%", left: "6%", width: "140px", transform: "rotate(6deg)" } },
  { src: "/images/scrapbook-6.jpg", style: { top: "58%", right: "6%", width: "130px", transform: "rotate(-6deg)" } },
];

const HANDWRITTEN_LABELS = [
  { text: "feel alive ✦", style: { top: "12%", left: "22%", transform: "rotate(-12deg)", fontSize: "1.4rem" } },
  { text: "chic street →", style: { top: "18%", right: "20%", transform: "rotate(6deg)", fontSize: "1.2rem" } },
  { text: "city jam ♡", style: { bottom: "28%", left: "15%", transform: "rotate(-5deg)", fontSize: "1.1rem" } },
  { text: "inspo!", style: { top: "50%", right: "18%", transform: "rotate(8deg)", fontSize: "1.5rem" } },
  { text: "mood board ★", style: { bottom: "12%", right: "22%", transform: "rotate(-3deg)", fontSize: "1rem" } },
];

const TAPE_DECORATIONS = [
  { style: { top: "8%", left: "12%", transform: "rotate(-20deg)", width: "50px", height: "14px" }, color: "tape-pink" },
  { style: { top: "10%", right: "18%", transform: "rotate(15deg)", width: "45px", height: "12px" }, color: "tape-green" },
  { style: { bottom: "22%", left: "8%", transform: "rotate(-30deg)", width: "55px", height: "14px" }, color: "tape-blue" },
  { style: { top: "45%", right: "4%", transform: "rotate(25deg)", width: "40px", height: "12px" }, color: "" },
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

  const handleCelebrityPick = async (celebrity: string, style: string) => {
    setHasStarted(true);
    const currencySymbol = getCurrencySymbol(currency);
    const toneDesc = TONE_LABELS[tone];

    setChatEntries([
      {
        id: crypto.randomUUID(),
        role: "user",
        content: `Steal ${celebrity}'s ${style.toLowerCase()} look — budget ${budget}, ${gender}'s fashion in ${currency}`,
      },
    ]);

    setIsLoading(true);

    const systemPrompt = `You are StyleCapsule, an elite AI fashion stylist with deep expertise in color theory, texture pairing, and contemporary fashion trends (2025-2026).

The user wants to recreate a celebrity's style. Your job:
1. Briefly describe the celebrity's signature ${style.toLowerCase()} style, their go-to color palettes, texture preferences, and signature accessories (2-3 sentences).
2. Then generate 3 outfit sets that capture their ${style.toLowerCase()} aesthetic within the user's preferences.

COLOR COORDINATION RULES:
- Apply color theory: use complementary pairs (navy+rust, emerald+blush), analogous palettes (sage+olive+cream), tonal/monochromatic dressing, or intentional contrast.
- In the "explanation" field, explicitly explain WHY the colors work together (e.g., "The burgundy and cream create a warm complementary contrast...").
- Consider the celebrity's known color preferences and signature palettes.

TEXTURE PAIRING RULES:
- Always pair contrasting textures for visual interest: matte with shine (cashmere + leather), structured with flowing (tailored blazer + silk cami), rough with smooth (denim + satin).
- Mention textures/materials in the "material" field and reference texture contrast in styling tips.

ACCESSORY RULES:
- Study what accessories the celebrity is known for wearing (specific jewelry styles, sunglasses, hats, belts, scarves, watches).
- Match the number and type of accessories to what the celebrity actually wears. If they're known for layered gold jewelry, include multiple jewelry pieces. If they're minimal, keep it minimal.
- Use specific accessory categories: hat, scarf, belt, jewelry, sunglasses, watch — not just generic "accessory".

2025-2026 TREND AWARENESS:
- Reference current trends where relevant: quiet luxury, butter yellows, cherry/burgundy tones, sheer layers, oversized tailoring, ballet flats revival, chunky gold jewelry, boho revival, dopamine dressing, understated logos, textured knits, wide-leg trousers, statement outerwear.
- Adapt trends to the celebrity's personal style — don't force trends that don't fit.

User preferences:
- Gender: ${gender}
- Budget: ${budget} total per outfit
- Style tone: ${style.toLowerCase()} (Casual = everyday streetwear, Elevated = polished/refined, Bold = statement/daring)
- Currency: ${currency} (${currencySymbol})

Return your response in TWO parts:
1. A brief style analysis covering their color palette, textures, and accessories + why your recreations capture the celebrity's vibe.
2. A JSON block with outfit data:

\`\`\`json
[
  {
    "id": "unique-id",
    "name": "Outfit Name",
    "explanation": "Why this outfit captures the celebrity's style — include color harmony reasoning and texture choices.",
    "stylingTips": ["Color/texture tip", "How to wear it", "Accessory pairing advice"],
    "occasion": "${celebrity} inspired — ${style}",
    "items": [
      {
        "name": "Item Name",
        "brand": "Brand Name",
        "price": 89,
        "currency": "${currencySymbol}",
        "color": "Specific color (e.g. 'Butter Yellow' not just 'Yellow')",
        "material": "Specific material/texture (e.g. 'Brushed Cashmere' not just 'Cashmere')",
        "category": "top|bottom|shoes|bag|accessory|outerwear|dress|hat|scarf|belt|jewelry|sunglasses|watch",
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
- Each outfit MUST include all core pieces (top+bottom or dress) + shoes + accessories that match the celebrity's known style
- Use REAL fashion brands and realistic prices in ${currency}
- shopUrl should link to real brand websites
- Mix brands across outfits for variety
- Colors must be specific (e.g. "Dusty Rose", "Slate Blue", "Cognac Brown")
- After showing outfits, ask if they want changes`;

    const userMessage = `Recreate ${celebrity}'s latest ${style.toLowerCase()} style. Create 3 outfit options. Budget: ${budget} per outfit. Gender: ${gender}. Currency: ${currency}.`;

    const messages: Msg[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ];

    setConversationHistory([{ role: "user", content: userMessage }]);

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
          setOutfitsGenerated(true);
          setIsLoading(false);
        },
      });
    } catch (e: any) {
      toast.error(e.message || "Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  const handleFindMyLook = async () => {
    if (!uploadedImage) return;

    setHasStarted(true);
    const currencySymbol = getCurrencySymbol(currency);
    const toneDesc = TONE_LABELS[tone];

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
            className="relative min-h-screen overflow-hidden scrapbook-bg"
          >
            {/* Scrapbook fashion images with tape */}
            <div className="absolute inset-0 pointer-events-none z-0 hidden sm:block">
              {SCRAPBOOK_IMAGES.map((img, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.85, rotate: 0 }}
                  animate={{ opacity: 0.85, scale: 1 }}
                  transition={{ duration: 0.7, delay: 0.12 * i }}
                  className="absolute"
                  style={img.style}
                >
                  {/* Tape on top */}
                  <div
                    className={`tape ${TAPE_DECORATIONS[i % TAPE_DECORATIONS.length]?.color || ""}`}
                    style={{
                      top: "-6px",
                      left: "30%",
                      transform: `rotate(${-20 + i * 12}deg)`,
                      width: "48px",
                      height: "13px",
                    }}
                  />
                  <img
                    src={img.src}
                    alt=""
                    className="w-full aspect-[3/4] object-cover border-[3px] border-card/80 shadow-lg"
                  />
                </motion.div>
              ))}

              {/* Handwritten labels */}
              {HANDWRITTEN_LABELS.map((label, i) => (
                <motion.span
                  key={`label-${i}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.7 }}
                  transition={{ duration: 0.6, delay: 0.8 + i * 0.15 }}
                  className="absolute font-handwritten text-card/60 pointer-events-none select-none"
                  style={label.style}
                >
                  {label.text}
                </motion.span>
              ))}

              {/* Extra tape decorations */}
              {TAPE_DECORATIONS.map((tape, i) => (
                <div
                  key={`tape-${i}`}
                  className={`tape ${tape.color} absolute`}
                  style={tape.style}
                />
              ))}
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center pt-28 sm:pt-36 pb-16 px-6">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center max-w-2xl w-full"
              >
                <h1 className="text-5xl sm:text-7xl tracking-[0.2em] text-card mb-2 uppercase" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300 }}>
                  REMAKE
                </h1>
                <span className="font-handwritten text-4xl sm:text-6xl text-card/80 block mb-1" style={{ transform: "rotate(-2deg)" }}>
                  the look
                </span>
                <div className="w-24 h-[2px] bg-card/30 mx-auto mb-6" />
                <p className="text-card/60 text-base font-sans mb-10 max-w-sm mx-auto leading-relaxed">
                  Upload a photo of any outfit you love — from Instagram, Pinterest, or a celebrity look — and we'll help you recreate it.
                </p>

                {/* Upload zone — styled as a polaroid */}
                <AnimatePresence mode="wait">
                  {!uploadedImage ? (
                    <motion.div
                      key="upload-zone"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="max-w-xs mx-auto mb-8"
                      style={{ transform: "rotate(1.5deg)" }}
                    >
                      <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative bg-card p-3 pb-10 shadow-xl cursor-pointer transition-all ${
                          isDragging ? "shadow-2xl scale-[1.02]" : "hover:shadow-2xl hover:scale-[1.01]"
                        }`}
                      >
                        {/* Tape on polaroid */}
                        <div className="tape tape-pink absolute -top-2 left-1/2 -translate-x-1/2" style={{ transform: "rotate(-8deg) translateX(-50%)", width: "60px", height: "14px" }} />

                        <div className={`border-2 border-dashed p-10 transition-colors ${
                          isDragging ? "border-foreground/40 bg-secondary/30" : "border-border/60"
                        }`}>
                          <div className="flex flex-col items-center gap-3 text-muted-foreground">
                            <ImagePlus className="w-10 h-10" />
                            <div>
                              <p className="text-sm font-sans font-medium text-foreground">Drop your inspo here</p>
                              <p className="text-xs font-sans mt-1 text-muted-foreground">or click to browse</p>
                            </div>
                          </div>
                        </div>

                        {/* Handwritten note on polaroid */}
                        <p className="font-handwritten text-base text-muted-foreground text-center mt-3" style={{ transform: "rotate(-1deg)" }}>
                          paste your inspo ♡
                        </p>
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
                      {/* Polaroid preview */}
                      <div className="relative inline-block" style={{ transform: "rotate(-2deg)" }}>
                        <div className="bg-card p-2 pb-8 shadow-xl relative">
                          {/* Tape */}
                          <div className="tape tape-green absolute -top-2 left-1/3" style={{ transform: "rotate(12deg)", width: "50px", height: "13px" }} />
                          <img
                            src={uploadedImage}
                            alt="Uploaded look"
                            className="w-48 h-64 object-cover"
                          />
                          <p className="font-handwritten text-sm text-muted-foreground text-center mt-2">your inspo ✦</p>
                        </div>
                        <button
                          onClick={() => setUploadedImage(null)}
                          className="absolute -top-3 -right-3 p-1.5 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80 transition-colors shadow-md"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Style controls — on a "paper" surface */}
                      <div className="bg-card/90 backdrop-blur-sm p-5 torn-edge">
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
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Celebrity picks */}
                {!uploadedImage && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="mt-12"
                  >
                    <CelebrityPicks onSelect={handleCelebrityPick} disabled={isLoading} />
                  </motion.div>
                )}
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
                        <div className="relative" style={{ transform: "rotate(2deg)" }}>
                          <div className="bg-card p-1.5 pb-6 shadow-md">
                            <img
                              src={entry.imagePreview}
                              alt="Your inspo"
                              className="w-32 h-40 object-cover"
                            />
                            <p className="font-handwritten text-xs text-muted-foreground text-center mt-1">my inspo ♡</p>
                          </div>
                        </div>
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
