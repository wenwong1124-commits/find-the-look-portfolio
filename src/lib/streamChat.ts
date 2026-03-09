const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/style-advisor`;

export type Msg = { role: "user" | "assistant" | "system"; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> };

export async function streamChat({
  messages,
  imageUrl,
  onDelta,
  onDone,
}: {
  messages: Msg[];
  imageUrl?: string;
  onDelta: (deltaText: string) => void;
  onDone: () => void;
}) {
  const maxRetries = 3;
  let resp: Response | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages, imageUrl }),
    });

    if (resp.status === 429) {
      if (attempt < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, 6000 * (attempt + 1)));
        continue;
      }
      throw new Error("Rate limited — please try again in a moment.");
    }
    break;
  }

  if (!resp) throw new Error("Failed to connect");
  if (resp.status === 402) {
    throw new Error("Usage limit reached. Please add credits.");
  }
  if (!resp.ok || !resp.body) throw new Error("Failed to start stream");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);

      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") {
        streamDone = true;
        break;
      }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        textBuffer = line + "\n" + textBuffer;
        break;
      }
    }
  }

  if (textBuffer.trim()) {
    for (let raw of textBuffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (raw.startsWith(":") || raw.trim() === "") continue;
      if (!raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {}
    }
  }

  onDone();
}
