import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Upload, ImagePlus, X } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { OutfitCard } from "@/components/OutfitCard";
import { OutfitFeedbackData } from "@/components/OutfitFeedback";
import { StyleAdjuster } from "@/components/StyleAdjuster";
import { ThinkingIndicator } from "@/components/ThinkingIndicator";
import { getCurrencySymbol, CURRENCY_CONFIG } from "@/components/CurrencySelector";
import { CelebrityPicks } from "@/components/CelebrityPicks";
import { useSavedOutfits } from "@/hooks/useSavedOutfits";
import { streamChat, Msg } from "@/lib/streamChat";
import { parseOutfitsFromText } from "@/lib/parseOutfits";
import { CapsuleOutfit } from "@/types/outfit";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

const SCRAPBOOK_IMAGES = [
  { src: "/images/hero-1.jpg", style: { top: "1%", left: "1%", width: "200px", transform: "rotate(-11deg)" }, z: 3 },
  { src: "/images/hero-2.jpg", style: { top: "-2%", right: "8%", width: "185px", transform: "rotate(7deg)" }, z: 2 },
  { src: "/images/hero-3.jpg", style: { top: "28%", left: "-1%", width: "170px", transform: "rotate(13deg)" }, z: 4 },
  { src: "/images/hero-4.jpg", style: { top: "22%", right: "1%", width: "160px", transform: "rotate(-9deg)" }, z: 1 },
  { src: "/images/hero-5.jpg", style: { bottom: "12%", left: "0%", width: "185px", transform: "rotate(-6deg)" }, z: 5 },
  { src: "/images/hero-6.jpg", style: { bottom: "8%", right: "2%", width: "165px", transform: "rotate(10deg)" }, z: 2 },
  { src: "/images/hero-7.jpg", style: { bottom: "-1%", left: "22%", width: "155px", transform: "rotate(4deg)" }, z: 3 },
  { src: "/images/hero-8.jpg", style: { top: "55%", right: "14%", width: "150px", transform: "rotate(-12deg)" }, z: 4 },
];

const HANDWRITTEN_LABELS = [
  { text: "it girl energy ✦", style: { top: "8%", left: "24%", transform: "rotate(-14deg)", fontSize: "1.5rem" } },
  { text: "street style →", style: { top: "15%", right: "22%", transform: "rotate(8deg)", fontSize: "1.3rem" } },
  { text: "obsessed ♡", style: { bottom: "30%", left: "12%", transform: "rotate(-7deg)", fontSize: "1.2rem" } },
  { text: "main character!", style: { top: "48%", right: "16%", transform: "rotate(11deg)", fontSize: "1.6rem" } },
  { text: "slay ★", style: { bottom: "8%", right: "25%", transform: "rotate(-4deg)", fontSize: "1.1rem" } },
  { text: "core memory ~", style: { top: "38%", left: "20%", transform: "rotate(5deg)", fontSize: "1rem" } },
];

const TAPE_DECORATIONS = [
  { style: { top: "5%", left: "10%", transform: "rotate(-22deg)", width: "55px", height: "14px" }, color: "tape-pink" },
  { style: { top: "6%", right: "20%", transform: "rotate(18deg)", width: "48px", height: "13px" }, color: "tape-green" },
  { style: { bottom: "20%", left: "5%", transform: "rotate(-35deg)", width: "52px", height: "14px" }, color: "tape-blue" },
  { style: { top: "40%", right: "3%", transform: "rotate(28deg)", width: "45px", height: "12px" }, color: "" },
  { style: { bottom: "5%", left: "28%", transform: "rotate(-15deg)", width: "50px", height: "13px" }, color: "tape-pink" },
  { style: { top: "62%", right: "20%", transform: "rotate(12deg)", width: "42px", height: "12px" }, color: "tape-green" },
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
  const [budget, setBudget] = useState<[number, number]>(CURRENCY_CONFIG["HKD"].outfitDefaults);
  const [budgetMode, setBudgetMode] = useState<"total" | "per-item">("total");
  const [itemBudgets, setItemBudgets] = useState<Record<string, [number, number]>>(CURRENCY_CONFIG["HKD"].itemDefaults);
  const [tone, setTone] = useState(3);
  const [gender, setGender] = useState<"women" | "men" | "unisex">("women");
  const [currency, setCurrency] = useState("HKD");

  const handleCurrencyChange = useCallback((newCurrency: string) => {
    const config = CURRENCY_CONFIG[newCurrency] ?? CURRENCY_CONFIG["USD"];
    setCurrency(newCurrency);
    setBudget(config.outfitDefaults);
    setItemBudgets(config.itemDefaults);
  }, []);

  const getBudgetText = useCallback(() => {
    const sym = getCurrencySymbol(currency);
    if (budgetMode === "total") {
      return `STRICT BUDGET: Total outfit cost must be between ${sym}${budget[0].toLocaleString()} and ${sym}${budget[1].toLocaleString()} in ${currency}. Price each item so all items together stay within this limit. Choose brands appropriate for this budget.`;
    }
    return `PER-ITEM BUDGET CONSTRAINTS (in ${currency}):
- Top / Dress: ${sym}${itemBudgets.top[0].toLocaleString()}–${sym}${itemBudgets.top[1].toLocaleString()} per piece
- Bottom: ${sym}${itemBudgets.bottom[0].toLocaleString()}–${sym}${itemBudgets.bottom[1].toLocaleString()} per piece
- Shoes: ${sym}${itemBudgets.shoes[0].toLocaleString()}–${sym}${itemBudgets.shoes[1].toLocaleString()} per piece
- Bag: ${sym}${itemBudgets.bag[0].toLocaleString()}–${sym}${itemBudgets.bag[1].toLocaleString()} per piece
- Accessories: ${sym}${itemBudgets.accessories[0].toLocaleString()}–${sym}${itemBudgets.accessories[1].toLocaleString()} per piece
Price each item within its category budget range. Choose brands appropriate for these price points.`;
  }, [budget, budgetMode, itemBudgets, currency]);
  const [outfitsGenerated, setOutfitsGenerated] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, OutfitFeedbackData>>({});

  const getFeedbackSummary = useCallback(() => {
    const entries = Object.entries(feedbackMap);
    if (entries.length === 0) return "";
    const lines = entries.map(([id, fb]) => {
      const vote = fb.vote === "up" ? "👍" : "👎";
      const tags = fb.tags.length > 0 ? ` — tags: ${fb.tags.join(", ")}` : "";
      return `- Outfit "${id}": ${vote}${tags}`;
    });
    return `\nUser feedback on previous suggestions:\n${lines.join("\n")}\nAvoid repeating disliked patterns. Lean into liked patterns.\n`;
  }, [feedbackMap]);

  const handleOutfitFeedback = useCallback((outfitName: string, data: OutfitFeedbackData) => {
    setFeedbackMap((prev) => ({ ...prev, [outfitName]: data }));
  }, []);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const followUpInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { savedOutfits, saveOutfit, removeOutfit, isOutfitSaved } = useSavedOutfits();

  useEffect(() => {
    const isNearBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 300;
    if (isNearBottom) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
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
        content: `Steal ${celebrity}'s ${style.toLowerCase()} look — budget ${getCurrencySymbol(currency)}${budget[0]}–${getCurrencySymbol(currency)}${budget[1]}, ${gender}'s fashion in ${currency}`,
      },
    ]);

    setIsLoading(true);

    const systemPrompt = `You are StyleCapsule, an elite AI fashion stylist (color theory, texture pairing, 2025-2026 trends).

Recreate ${celebrity}'s ${style.toLowerCase()} style. Briefly describe their signature look (2-3 sentences), then generate 3 outfits.

Rules: Use color theory (complementary/analogous/tonal). Explain color choices in "explanation". Pair contrasting textures (matte+shine, structured+flowing). Use specific colors ("Dusty Rose" not "Pink") and materials ("Brushed Cashmere" not "Cashmere"). Gender: ${gender}.

${getBudgetText()}

ITEMS PER OUTFIT: Include exactly 4 core items: 1 top (or dress), 1 bottom (skip if dress), 1 shoes, 1 bag. Only add a jacket/outerwear if it is the signature/accent piece of the look or the occasion is cold weather. Only add accessories (jewelry, hat, belt, sunglasses, etc.) if they are a defining statement piece of the outfit — not as filler. Keep items minimal and intentional. Use categories: top|bottom|shoes|bag|outerwear|dress|accessory|hat|belt|jewelry|sunglasses.

Return: 1) Brief style analysis 2) JSON block:
\`\`\`json
[{"id":"id","name":"Name","explanation":"Why colors/textures work","stylingTips":["tip1","tip2"],"occasion":"${celebrity} inspired — ${style}","items":[{"name":"Item","brand":"Brand","price":89,"currency":"${currencySymbol}","color":"Specific Color","material":"Specific Material","category":"category","shopUrl":"https://..."}]}]
\`\`\`
After showing outfits, ask if they want changes. Do NOT use markdown tables — use plain prose or short bullet points only.`;

    const userMessage = `Recreate ${celebrity}'s latest ${style.toLowerCase()} style. Create 3 outfit options. Gender: ${gender}. Currency: ${currency}.`;

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
        content: `Remake this look — ${toneDesc}, budget ${getCurrencySymbol(currency)}${budget[0]}–${getCurrencySymbol(currency)}${budget[1]}, ${gender}'s fashion in ${currency}`,
        imagePreview: uploadedImage,
      },
    ]);

    setIsLoading(true);

    const systemPrompt = `You are StyleCapsule, an elite AI fashion stylist (color theory, texture pairing, 2025-2026 trends).

Analyze the uploaded photo: describe outfit pieces, color palette (specific names), textures, silhouette, and ALL accessories (count them). Then generate 3 outfit recreations.

Rules: Match the image's color harmony (complementary/analogous/monochromatic). Explain color choices in "explanation". Recreate texture contrasts. Use specific colors ("Dusty Rose" not "Pink") and materials ("Washed Linen" not "Linen"). Reference 2025-2026 trends where fitting.

ITEMS PER OUTFIT: Include exactly 4 core items: 1 top (or dress), 1 bottom (skip if dress), 1 shoes, 1 bag. Only add a jacket/outerwear if it is a key visible layer in the photo or the look is clearly cold-weather. Only add accessories (jewelry, hat, belt, sunglasses, etc.) if they are a statement/defining piece prominent in the photo — not as filler. Keep items minimal and intentional. Use categories: top|bottom|shoes|bag|outerwear|dress|accessory|hat|belt|jewelry|sunglasses.

Gender: ${gender}. Style tone: ${toneDesc} (1=casual, 3=similar, 5=glam). Currency: ${currency} (${currencySymbol}).
Tone 1-2: use Zara/H&M/ASOS. Tone 3: match closely. Tone 4-5: premium brands.

${getBudgetText()}

Return: 1) Brief look analysis 2) JSON:
\`\`\`json
[{"id":"id","name":"Name","explanation":"Color+texture reasoning","stylingTips":["tip1","tip2"],"occasion":"Inspired look","items":[{"name":"Item","brand":"Brand","price":89,"currency":"${currencySymbol}","color":"Specific Color","material":"Specific Material","category":"category","shopUrl":"https://..."}]}]
\`\`\`
Use REAL brands, realistic ${currency} prices. After showing outfits, ask if they want changes. Do NOT use markdown tables — use plain prose or short bullet points only.`;

    const userMessage = `Please analyze this look and create 3 outfit recreations. Style tone: ${toneDesc}. Gender: ${gender}. Currency: ${currency}.`;

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

    const feedbackContext = getFeedbackSummary();
    const systemPrompt = `You are StyleCapsule, an elite AI fashion stylist. The user previously received outfit suggestions and wants refinements.

If they ask for different outfits or modifications, generate new outfit JSON blocks in the same format.
If they ask general styling questions, answer conversationally without JSON.
Always end by asking if they'd like to adjust anything.
Do NOT use markdown tables. Use plain prose or short bullet points only.

IMPORTANT — maintain consistency:
- Keep the same color coordination principles (complementary, analogous, tonal) from the original outfits unless the user asks to change colors.
- Maintain texture contrast and pairing quality.
- Use specific color names and material descriptions.
${feedbackContext}
Rules:
- Gender: ${gender}
${getBudgetText()}
- Currency: ${currency} (${currencySymbol})
- Use REAL brands with prices realistic for this budget
- Format outfits in \`\`\`json blocks
- ITEMS PER OUTFIT: 4 core items only — 1 top (or dress), 1 bottom (skip if dress), 1 shoes, 1 bag. Only add jacket/outerwear if it's a key accent piece or cold-weather look. Only add accessories if they're a statement piece, not filler.
- Valid categories: top, bottom, shoes, bag, outerwear, dress, accessory, hat, belt, jewelry, sunglasses`;

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
      <Navbar savedCount={savedOutfits.length} onLogoClick={() => {
          setHasStarted(false);
          setChatEntries([]);
          setConversationHistory([]);
          setUploadedImage(null);
          setOutfitsGenerated(false);
          setIsLoading(false);
          setInput("");
        }} />

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
                  initial={{ opacity: 0, scale: 0.8, rotate: -5 + i * 3 }}
                  animate={{ 
                    opacity: 0.92, 
                    scale: 1,
                    y: [0, -4 + (i % 3) * 3, 0],
                  }}
                  transition={{ 
                    duration: 0.7, 
                    delay: 0.08 * i,
                    y: { duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 },
                  }}
                  className="absolute"
                  style={{ ...img.style, zIndex: img.z }}
                >
                  {/* Tape on top */}
                  <div
                    className={`tape ${TAPE_DECORATIONS[i % TAPE_DECORATIONS.length]?.color || ""}`}
                    style={{
                      top: "-7px",
                      left: i % 2 === 0 ? "20%" : "45%",
                      transform: `rotate(${-25 + i * 10}deg)`,
                      width: "50px",
                      height: "14px",
                    }}
                  />
                  {/* Second tape on some images */}
                  {i % 3 === 0 && (
                    <div
                      className={`tape ${TAPE_DECORATIONS[(i + 2) % TAPE_DECORATIONS.length]?.color || ""}`}
                      style={{
                        bottom: "-6px",
                        right: "15%",
                        transform: `rotate(${15 - i * 8}deg)`,
                        width: "42px",
                        height: "12px",
                      }}
                    />
                  )}
                  <img
                    src={img.src}
                    alt=""
                    className="w-full aspect-[3/4] object-cover shadow-xl"
                    style={{
                      border: "4px solid rgba(255,255,255,0.85)",
                      boxShadow: `${2 + i}px ${3 + i}px ${8 + i * 2}px rgba(0,0,0,0.35)`,
                    }}
                  />
                  {/* Handwritten item label under some photos */}
                  {i % 2 === 0 && (
                    <span
                      className="block font-handwritten text-card/50 text-xs mt-1 text-center"
                      style={{ transform: `rotate(${-3 + i * 2}deg)` }}
                    >
                      {["✂ cut here", "♡♡♡", "→ love this", "★ fave"][i % 4]}
                    </span>
                  )}
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
                          budgetMode={budgetMode}
                          onBudgetModeChange={setBudgetMode}
                          itemBudgets={itemBudgets}
                          onItemBudgetChange={(cat, v) => setItemBudgets((prev) => ({ ...prev, [cat]: v }))}
                          tone={tone}
                          onToneChange={setTone}
                          gender={gender}
                          onGenderChange={setGender}
                          currency={currency}
                          onCurrencyChange={handleCurrencyChange}
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
                        entry.outfits && entry.outfits.length > 0 ? (
                          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-2">
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                              <div className="w-1.5 h-4 rounded-full bg-accent/70" />
                              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground font-sans">Style Analysis</span>
                            </div>
                            <ReactMarkdown
                              components={{
                                p: ({ children }) => <p className="text-sm text-foreground/85 font-sans leading-relaxed mb-2 last:mb-0">{children}</p>,
                                strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                                em: ({ children }) => <em className="italic text-foreground/70">{children}</em>,
                                h3: ({ children }) => <h3 className="text-xs font-semibold text-foreground font-sans uppercase tracking-wider mt-3 mb-1 text-muted-foreground">{children}</h3>,
                                ul: ({ children }) => <ul className="space-y-1 my-1">{children}</ul>,
                                li: ({ children }) => <li className="text-sm text-foreground/80 font-sans flex gap-2"><span className="text-accent flex-shrink-0">—</span><span>{children}</span></li>,
                                table: ({ children }) => <div className="space-y-1">{children}</div>,
                                thead: () => null,
                                tbody: ({ children }) => <div className="space-y-1">{children}</div>,
                                tr: ({ children }) => <div className="text-sm text-foreground/80 font-sans">{children}</div>,
                                td: ({ children }) => <span className="mr-3">{children}</span>,
                              }}
                            >
                              {entry.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <div className="max-w-none space-y-2">
                            <ReactMarkdown
                              components={{
                                p: ({ children }) => <p className="text-sm text-foreground/85 font-sans leading-relaxed">{children}</p>,
                                strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                                em: ({ children }) => <em className="italic text-foreground/70">{children}</em>,
                                ul: ({ children }) => <ul className="space-y-1 my-1">{children}</ul>,
                                li: ({ children }) => <li className="text-sm text-foreground/80 font-sans flex gap-2"><span className="text-accent flex-shrink-0">—</span><span>{children}</span></li>,
                              }}
                            >
                              {entry.content}
                            </ReactMarkdown>
                          </div>
                        )
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
                              feedback={feedbackMap[outfit.name]}
                              onFeedback={(data) => handleOutfitFeedback(outfit.name, data)}
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
          <div className="max-w-3xl mx-auto space-y-2">
            {outfitsGenerated && !isLoading && (
              <div className="flex gap-2 flex-wrap">
                {[
                  "Make it more casual",
                  "Try a different color palette",
                  "More affordable options",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleChatFollowUp(suggestion)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:border-foreground/40 font-sans transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            <div className="relative">
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
          </div>
        </motion.div>
      )}
    </div>
  );
}
