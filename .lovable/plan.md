

## Plan: Move Title to Top + Side-by-Side Outfit Layout

### Changes

**1. OutfitCard — Move title & occasion to top** (`src/components/OutfitCard.tsx`)
- Move the outfit name, occasion, and save button from the footer to a **header section** above the collage
- Remove the old footer section

**2. Side-by-side grid layout** (`src/pages/Index.tsx`)
- Change the outfits container from `space-y-6` (vertical stack) to a **responsive 3-column grid**: `grid grid-cols-1 md:grid-cols-3 gap-4`
- This lets users compare all 3 outfits at a glance

**3. SavedOutfits page — same grid** (`src/pages/SavedOutfits.tsx`)
- Update from `space-y-6` to matching responsive grid layout

**4. OutfitCard sizing adjustments**
- Reduce collage aspect ratio slightly (e.g. `aspect-[3/4]`) to fit better in a 3-column layout
- Ensure item list text stays readable at narrower widths

