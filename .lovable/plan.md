# StyleCapsule — AI Outfit Planner

## Concept

A minimal, fashionable web app where users describe their occasion and get curated capsule outfit sets with shoppable links. The design blends bold editorial typography with a clean, focused layout.

## Design Direction

- **Typography**: Bold serif headings (like Balenciaga reference) mixed with clean sans-serif body text
- **Color palette**: Warm cream/off-white background, black text, olive/golden accent color (inspired by Feel Fits reference)
- **Layout**: Generous whitespace, outfit items arranged together as cohesive looks (not separated grids)
- **Mood**: Minimal, editorial, inspiring — fashion magazine meets AI assistant

## Pages & Flow

### 1. Landing / Home

- Large editorial heading: "STYLECAPSULE" with tagline about effortless outfit planning
- Prominent chat/prompt input in the center: "What's the occasion?"
- Subtle examples below the input (e.g., "Weekend trip to Japan", "Summer wedding guest", "First day at new job")
- Minimal nav: logo, saved outfits (heart icon), optional sign-in

### 2. Smart Prompt Builder

- After initial input, AI responds with friendly follow-up questions as clickable chips/cards:
  - Budget range (slider or presets: $, $$, $$$)
  - Number of days
  - Season/month
  - Style preferences (casual, smart casual, formal, edgy, classic)
  - Any colors/textures to prefer or avoid
- Conversational feel — not a rigid form, more like a styled chat

### 3. AI Thinking State

- Elegant loading animation (e.g., minimal typing indicator or rotating style keywords)
- Brief text like "Curating your capsule wardrobe..."

### 4. Outfit Results

- Each capsule outfit displayed as a styled card with items arranged together (like reference image 3):
  - Hero image area showing items laid out as a flat-lay composition
  - Items listed: top, bottom, shoes, bag, accessories
  - Each item shows: product name, brand, price, color, material
  - "Shop" button linking to brand website
  - Brief AI explanation of why this outfit works for their occasion
- Multiple outfit sets (3+) in a scrollable layout
- Save/heart button on each outfit

### 5. Saved Outfits

- Grid of saved outfit sets
- Ability to remove saved outfits
- Stored in localStorage by default; synced to Supabase if user creates an account

### 6. Optional Auth

- Simple sign-up/login (email-based via Supabase Auth)
- Prompted when user tries to save outfits or wants to sync across devices

## Backend

- **Lovable Cloud** with Supabase for auth and saved outfits storage
- **Lovable AI** (edge function) to generate outfit recommendations — AI returns structured outfit data via tool calling (brand, item name, price, color, material, shopping URL, explanation)
- Product data is AI-generated (real brand names, realistic prices, links to brand websites) — not live-scraped for MVP
- Database tables: `profiles`, `saved_outfits`, `user_roles`

## Key Interactions

1. Type occasion → see smart follow-up prompts → submit
2. See AI thinking → receive 3+ capsule outfits with explanations
3. Browse items, read why they were chosen
4. Save favorites, click through to shop on brand websites
5. Optionally sign up to keep saved outfits