

## Plan: Pivot to "Remake the Look" Flow

Replace the current occasion-based flow with a simpler image-upload-first experience where users upload a photo of a look they like (from social media, celebrity, influencer) and get outfit suggestions to recreate it within their budget and style preferences.

### New User Flow

```text
1. User lands on hero → sees "Remake Any Look" messaging
2. User uploads an image (drag-drop or click)
3. App sends image to AI to analyze the look
4. AI returns a description of the style/outfit in the image
5. User sees the analysis + adjustment controls:
   - Budget slider (or chips): Under $200, $200-500, $500-1000, $1000+
   - Style dial: "Tone Down" ←→ "Tone Up" (slider)
   - Gender toggle (keep existing)
   - Currency selector (keep existing)
6. User hits "Find My Look" → AI generates 3 outfit sets that recreate the vibe
7. Chat continues for refinements ("make it more casual", "swap the shoes")
```

### Files to Change

**1. `src/pages/Index.tsx`** — Major rewrite of the hero and flow:
- Remove the occasion/filter mode toggle, `ALL_PROMPTS`, `FOLLOW_UP_OPTIONS`, and filter-mode UI
- Add an image upload zone (drag-drop area + click-to-upload) as the primary CTA
- Store uploaded image as a data URL in state
- After upload, show the image preview + adjustment controls (budget chips, tone slider, gender, currency)
- On "Find My Look", send the image to the AI with a new system prompt that says: "Analyze this outfit/look and suggest 3 affordable recreations matching the user's budget and tone preference"
- Keep the chat follow-up flow for refinements
- Keep scrapbook hero images as ambient decoration

**2. `src/components/StyleAdjuster.tsx`** — New component:
- A "Tone" slider from 1-5 (1 = "Tone Down / More Casual", 5 = "Tone Up / More Elevated")
- Budget chips (reuse chip pattern)
- Currency selector integration
- Gender toggle
- Compact layout that appears after image upload

**3. `supabase/functions/style-advisor/index.ts`** — Update to handle image input:
- Accept an optional `imageUrl` (base64 data URL) in the request body alongside `messages`
- When an image is provided, include it as a multimodal content block in the messages sent to the AI gateway (Gemini supports image+text)
- The system prompt changes to focus on analyzing the uploaded look and recreating it

**4. `src/lib/streamChat.ts`** — Minor update:
- Accept optional `imageUrl` parameter to pass to the edge function

**5. `src/components/FollowUpChips.tsx`** — Simplify:
- Remove companion/days/season options, keep only as a generic chip selector for budget

### System Prompt Strategy

The new system prompt will instruct the AI to:
1. First analyze the uploaded image and describe what the person is wearing
2. Then generate 3 outfit sets that recreate the look at the user's budget level
3. Respect the "tone" setting: tone-down = more casual/accessible versions, tone-up = more premium/elevated versions
4. Use real brands and realistic prices in the selected currency

### Image Handling

- User uploads via file input or drag-drop
- Convert to base64 data URL on the client
- Send as part of the multimodal message to Gemini (which supports image understanding)
- Display the uploaded image as a preview in the chat

