import Anthropic from "@anthropic-ai/sdk";
import express from "express";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

config(); // load .env

const app = express();
app.use(express.json({ limit: "50mb" })); // large limit for base64 images

// CORS — allow browser requests from the Vite dev server
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseBase64Image(dataUrl) {
  const match = dataUrl?.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!match) return null;
  return { mediaType: match[1], data: match[2] };
}

function buildClaudeMessages(messages, imageUrl) {
  const claudeMessages = [];
  const nonSystem = messages.filter((m) => m.role !== "system");

  for (let i = 0; i < nonSystem.length; i++) {
    const msg = nonSystem[i];
    const role = msg.role === "assistant" ? "assistant" : "user";
    const isLastUser = role === "user" && i === nonSystem.length - 1;

    if (isLastUser && imageUrl) {
      const img = parseBase64Image(imageUrl);
      const content = [];
      if (img) {
        content.push({
          type: "image",
          source: { type: "base64", media_type: img.mediaType, data: img.data },
        });
      }
      const text =
        typeof msg.content === "string"
          ? msg.content
          : (msg.content ?? [])
              .filter((p) => p.type === "text")
              .map((p) => p.text)
              .join("");
      if (text) content.push({ type: "text", text });
      claudeMessages.push({ role, content });
    } else {
      const text =
        typeof msg.content === "string"
          ? msg.content
          : (msg.content ?? [])
              .filter((p) => p.type === "text")
              .map((p) => p.text)
              .join("");
      if (text) claudeMessages.push({ role, content: text });
    }
  }

  return claudeMessages;
}

// ── Product image search ───────────────────────────────────────────────────────

const GEMINI_IMAGE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent";

async function generateProductImage(query) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const payload = {
    contents: [
      {
        parts: [
          {
            text: `Simple product photo, white background: ${query}. Clean e-commerce style, centered item, no person or mannequin.`,
          },
        ],
      },
    ],
    generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
  };

  try {
    const res = await fetch(`${GEMINI_IMAGE_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`[gemini-img] ${res.status}: ${text.slice(0, 200)}`);
      return null;
    }
    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((p) => p.inlineData);
    if (!imagePart?.inlineData?.data) return null;
    return `data:${imagePart.inlineData.mimeType || "image/png"};base64,${imagePart.inlineData.data}`;
  } catch (err) {
    console.error("[gemini-img] Exception:", err.message);
    return null;
  }
}

app.post("/api/search-products", async (req, res) => {
  const { queries } = req.body;
  if (!Array.isArray(queries) || queries.length === 0) {
    return res.json({ results: {} });
  }

  const results = {};
  await Promise.all(
    queries.map(async ({ key, query }) => {
      console.log(`[image] Generating: ${query}`);
      const imageUrl = await generateProductImage(query);
      if (!imageUrl) console.warn(`[image] No image for: ${query}`);
      results[key] = { imageUrl: imageUrl || null };
    })
  );

  res.json({ results });
});

// ── Health check ──────────────────────────────────────────────────────────────

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    gemini: !!process.env.GEMINI_API_KEY,
    node: process.version,
  });
});

app.get("/api/test-claude", async (req, res) => {
  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 16,
      messages: [{ role: "user", content: "Say hi" }],
    });
    res.json({ ok: true, reply: msg.content[0]?.text });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Route ─────────────────────────────────────────────────────────────────────

app.post("/api/style-advisor", async (req, res) => {
  const { messages, imageUrl } = req.body;

  const systemMsg = messages?.find((m) => m.role === "system");
  const system =
    systemMsg && typeof systemMsg.content === "string"
      ? systemMsg.content
      : undefined;

  const claudeMessages = buildClaudeMessages(messages ?? [], imageUrl);

  if (claudeMessages.length === 0) {
    return res.status(400).json({ error: "No valid messages" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // disable Nginx buffering for SSE
  res.flushHeaders();

  try {
    const stream = client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      ...(system ? { system } : {}),
      messages: claudeMessages,
    });

    let fullText = "";
    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        fullText += event.delta.text;
        const chunk = JSON.stringify({
          choices: [{ delta: { content: event.delta.text } }],
        });
        res.write(`data: ${chunk}\n\n`);
      }
    }

    // Log whether a json block was present
    const hasJson = fullText.includes("```json");
    console.log(`[api-server] Response complete. Has json block: ${hasJson}. Length: ${fullText.length}`);
    if (!hasJson) console.log("[api-server] Full response:\n", fullText.slice(0, 500));

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error("[api-server] Error:", err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    } else {
      res.end();
    }
  }
});

// Serve Vite build in production
const distPath = join(__dirname, "dist");
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (req, res) => res.sendFile(join(distPath, "index.html")));
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () =>
  console.log(`[api-server] Running on http://localhost:${PORT}`)
);
