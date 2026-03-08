

## Plan: Expand Companion Options and Add "Others" Free-Text Input

### Changes

**1. `src/pages/Index.tsx`** -- Update the companion options array:
- Add "Colleagues" and "Business Associates" to the existing options
- Final list: `["Solo", "Partner", "Friends", "Family", "Colleagues", "Business Associates"]`

**2. `src/components/FollowUpChips.tsx`** -- Enable "Others" + free-text for the companion category:
- Change the condition on line 52 from `group.category === "style"` to `group.category === "style" || group.category === "companion"`
- Update the placeholder text to be dynamic: `"Type your style..."` for style, `"Type who you're with..."` for companion

This reuses the existing "Others" button + text input pattern already built for the style category.

