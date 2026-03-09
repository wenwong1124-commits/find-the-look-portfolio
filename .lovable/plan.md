

## Plan: Outfit Feedback System (Thumbs + Tags, Session-Aware AI Learning)

### Overview

Add per-outfit feedback (thumbs up/down + quick tags) that both immediately injects preferences into the AI conversation context and accumulates in-session to improve subsequent suggestions.

### Components

#### 1. New `OutfitFeedback` component (`src/components/OutfitFeedback.tsx`)

Renders below each outfit card's items list:
- **Thumbs up / down** buttons (toggle, only one active at a time)
- **Tag chips** that appear after thumbs selection: `too expensive`, `wrong color`, `not my vibe`, `love the style`, `great fit`, `wrong occasion`
- Multiple tags selectable per outfit
- Compact, fits the existing card aesthetic (small icons, muted colors)

#### 2. Session feedback state (`src/pages/Index.tsx`)

- Add `feedbackMap` state: `Record<outfitId, { vote: 'up'|'down', tags: string[] }>`
- Pass `onFeedback` callback to `OutfitCard` → `OutfitFeedback`
- Build a `feedbackSummary()` helper that converts all accumulated feedback into a text block like:
  ```
  User feedback so far:
  - "Coastal Breeze" outfit: 👎 — tags: too expensive, wrong color
  - "Urban Edge" outfit: 👍 — tags: love the style
  ```

#### 3. Inject feedback into AI conversation context

- In `handleChatFollowUp`, prepend the feedback summary into the system prompt so Gemini 3.1 Pro sees what the user liked/disliked
- The system prompt addition:
  ```
  The user has given feedback on previous suggestions. Use this to improve:
  {feedbackSummary}
  Avoid repeating disliked patterns. Lean into liked patterns.
  ```

#### 4. Wire into `OutfitCard` (`src/components/OutfitCard.tsx`)

- Accept `feedback` and `onFeedback` props
- Render `<OutfitFeedback>` at the bottom of the card

### Files

| File | Change |
|------|--------|
| `src/components/OutfitFeedback.tsx` | New — thumbs + tag UI |
| `src/components/OutfitCard.tsx` | Add feedback props, render OutfitFeedback |
| `src/pages/Index.tsx` | feedbackMap state, feedbackSummary helper, inject into system prompts, pass props |

### No database needed — session-only as selected.

