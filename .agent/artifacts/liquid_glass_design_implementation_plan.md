# App Redesign Implementation Plan

This plan details the steps to refactor the entire Spentrack app to follow the newly established "iOS 26 / Liquid Glass" design system outlined in `DESIGN.md`.

## User Review Required

> [!IMPORTANT]
> This is a complete UI overhaul. Please review the proposed libraries, font choices, and layout changes.
> *   **Font Choice:** We will use **Outfit** via Google Fonts for a soft, geometric, modern look. Is this acceptable, or do you prefer standard Inter?
> *   **Icons:** We will replace inline SVGs with **Lucide React** icons to match the modern iOS aesthetic. Are you okay with adding this dependency?

## Proposed Changes

### 1. Dependencies & Configuration

We need to install libraries for fluid animations, class merging, and crisp icons.

#### [NEW] Dependencies (via command line)
- Install `framer-motion` for spring-based liquid animations and gestures.
- Install `lucide-react` for premium, consistent icons.
- Install `clsx` and `tailwind-merge` for robust utility class merging.

#### [MODIFY] `index.html` (file:///Users/madjidboudis/dev/spentrack/index.html)
- Inject Google Fonts (`Outfit`) for typography.

#### [MODIFY] `src/index.css` (file:///Users/madjidboudis/dev/spentrack/src/index.css)
- Define the global dark/light mesh gradient backgrounds on the `body`.
- Apply the base font family `font-sans: 'Outfit', sans-serif`.

---

### 2. Core UI Components

We will create reusable glassmorphic components to ensure consistency across the app and avoid repeating complex tailwind classes.

#### [NEW] `src/components/ui/GlassCard.tsx` (file:///Users/madjidboudis/dev/spentrack/src/components/ui/GlassCard.tsx)
- A reusable `motion.div` component that implements the `backdrop-blur-xl`, semi-transparent background, and soft borders. It will handle hover/tap animations automatically.

#### [NEW] `src/components/ui/GlassButton.tsx` (file:///Users/madjidboudis/dev/spentrack/src/components/ui/GlassButton.tsx)
- A reusable button with glass/neon styling based on primary/secondary variants.

#### [MODIFY] `src/components/Layout.tsx` (file:///Users/madjidboudis/dev/spentrack/src/components/Layout.tsx)
- **Mobile:** Replace the solid white/black bottom nav with a floating, pill-shaped glass bar (`bottom-6`).
- **Desktop:** Replace the solid sidebar with a translucent glass sidebar.
- **Background:** Remove the solid `bg-gray-50` and let the underlying mesh gradient from `index.css` show through.

---

### 3. Page Redesign

All pages will be refactored to use the new `GlassCard` components instead of solid `bg-white/bg-gray-900` wrappers.

#### [MODIFY] `src/pages/Dashboard.tsx` (file:///Users/madjidboudis/dev/spentrack/src/pages/Dashboard.tsx)
- Wrap the summary cards (Expenses, Income, Balance) in `GlassCard`.
- Update the donut chart container to use glassmorphism.
- Apply fluid enter animations using `framer-motion` (`initial`, `animate`).

#### [MODIFY] `src/pages/ListView.tsx` (file:///Users/madjidboudis/dev/spentrack/src/pages/ListView.tsx) & `src/components/TransactionItem.tsx` (file:///Users/madjidboudis/dev/spentrack/src/components/TransactionItem.tsx)
- Replace solid list items with softly rounded glass rows.
- Add tap effects (`whileTap`) to the rows.

#### [MODIFY] `src/pages/SettingsPage.tsx` (file:///Users/madjidboudis/dev/spentrack/src/pages/SettingsPage.tsx)
- Organize settings into glass panels.
- Restyle the theme toggles and currency managers to look like iOS preference menus.

#### [MODIFY] `src/components/AddEditModal.tsx` (file:///Users/madjidboudis/dev/spentrack/src/components/AddEditModal.tsx) & `src/pages/AddPage.tsx` (file:///Users/madjidboudis/dev/spentrack/src/pages/AddPage.tsx)
- Convert modals to Framer Motion bottom sheets (`drag="y"`) for mobile, and center glass modals for desktop.
- Upgrade form inputs to use translucent backgrounds (`bg-white/5` or `bg-black/5`) with focus rings.

## Verification Plan

### Automated Tests
- Build verification: Run `pnpm build` to ensure no TypeScript or build errors are introduced.

### Manual Verification
- Test responsive layout on Desktop and Mobile viewport sizes in the browser.
- Verify the PWA floating bottom navigation does not overlap with content by scrolling to the bottom of the list view.
- Ensure light and dark mode toggles correctly switch the background mesh gradients and glass opacities.
- Confirm animations feel fluid and not sluggish.
