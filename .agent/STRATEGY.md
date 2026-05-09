# AI Developer Guide & Technical Strategy: Spentrack

**Status:** Living Document / AI Context
**Goal:** A purely client-side, local-first PWA for personal expense tracking with complex recurring logic.

---

## 0. Core Development Principles

1. **Local-First & Private:** All data resides in IndexedDB (via Dexie). No external APIs for data storage.
2. **Deterministic Logic:** Recurring transaction resolution must be deterministic based on `startDate`, `frequency`, and `exceptions`.
3. **Strict Typing:** TypeScript is non-negotiable. Interfaces in `src/db/model.ts` are the source of truth.
4. **Mobile-First UX:** The UI must be optimized for one-handed use (bottom navigation, large touch targets).
5. **Atomic Changes:** When modifying recurring rules, preserve historical integrity using the "Split Pattern" (Section 2).

---

## 1. Architectural Stack & Constraints

*   **Framework:** React 18 (Vite) + `vite-plugin-pwa`.
*   **Database:** **Dexie.js**. 
    *   *Rule:* Use `useLiveQuery` from `dexie-react-hooks` for reactive UI.
    *   *Rule:* All DB writes should happen within hooks in `src/hooks/`.
*   **State:** **Zustand** (Global UI state) + **Dexie** (Persistent data).
    *   *Rule:* Do NOT sync Dexie state into Zustand. Query Dexie directly.
*   **Styling & Design:** **Tailwind CSS** + **iOS 26 Liquid Glass**.
    *   *Rule:* Adhere to the liquid glass aesthetic (`backdrop-blur`, semi-transparent backgrounds over mesh gradients).
    *   *Rule:* Use `dark:` variants for light/dark mode. Follow the design tokens in `index.css`.
*   **Animation:** **Framer Motion**.
    *   *Rule:* Use `framer-motion` for all micro-interactions (`whileTap` spring animations) and page transitions (staggered entries, bottom sheets).
*   **UI Components:** **GlassCard** & **GlassButton**.
    *   *Rule:* Wrap all major UI sections in `GlassCard`. Replace standard buttons with `GlassButton`.
*   **Icons & Typography:** **Lucide React** & **Outfit** font.
*   **Dates:** **date-fns**.
    *   *Rule:* Always store dates as `YYYY-MM-DD` strings in the DB to avoid timezone issues.

---

## 2. Core Data Modeling (IndexedDB)

### Schemas (`src/db/model.ts`)
The "Rule + Exception" pattern is used for recurring events.

*   **RecurringRule:** Defines the "template" (e.g., "Gym membership, $50, Monthly").
*   **RecurringException:** Stores modifications to a specific instance (e.g., "June Gym was $60" or "Skip May Gym").

### The "Split" Pattern (Critical for AI)
When a user updates a recurring rule "from this date forward":
1.  **Modify existing rule:** Set `endDate` to `yesterday`.
2.  **Create new rule:** New ID, new parameters, `startDate` set to `today`.
This preserves past exceptions tied to the old `ruleId`.

---

## 3. Folder Structure & Modules

*   `src/hooks/`: **Logic Layer.** All database interaction and business logic goes here.
    *   `useSpending.ts`: Complex logic for editing/deleting recurring vs. one-time items.
    *   `useTransactions.ts`: Simple CRUD for one-time transactions.
*   `src/utils/`: **Computation Layer.** Pure functions only.
    *   `transaction.utils.ts`: Contains the engine that generates "virtual" transactions from rules.
*   `src/db/`: **Persistence Layer.** Dexie initialization and models.
*   `src/store/`: **UI State Layer.** Zustand stores.
*   `src/components/`: **Presentation Layer.** Atomic components.

---

## 4. Implementation Patterns (How-To)

### Adding a New Data Feature
1.  Update `src/db/model.ts` with the new interface.
2.  Update `src/db/database.ts` schema version and table definitions.
3.  Create a custom hook in `src/hooks/` for CRUD operations.
4.  Use `useLiveQuery` in the component to consume the data.

### Calculating Totals
1.  Get all transactions for the period.
2.  Generate virtual instances using `generateRecurringInstances`.
3.  Filter out `isDeleted` instances.
4.  Convert all amounts to the default currency using exchange rates from `AppSettings`.

---

## 5. Anti-Patterns & Pitfalls to Avoid

*   **❌ LocalStorage:** Do not use for anything except very small, non-critical UI flags. Use Dexie for everything else.
*   **❌ Date Objects in State:** Avoid storing JS `Date` objects. Use `YYYY-MM-DD` strings.
*   **❌ Direct DB Calls in Components:** Components should use hooks. Do not import `db` from `database.ts` directly in UI components.
*   **❌ Heavy Calculations in Render:** Use `useMemo` for transaction filtering and totaling, or move logic to `transaction.utils.ts`.

---

## 6. Functional Requirements (Quick Ref)

*   **Epic 1:** PWA, Offline-first, Dark Mode.
*   **Epic 2:** One-time & Recurring Spendings (Weekly, Semi-Monthly, Monthly, Bi-Monthly, Yearly).
*   **Epic 3:** Multi-Currency with manual exchange rates.
*   **Epic 4:** Dashboard with Donut Chart (Recharts) and navigation.
*   **Epic 5:** CSV Import/Export.

---

## 7. AI Instructions for Future Changes

When asked to implement a feature:
1.  **Check the Schema:** Always look at `src/db/model.ts` first.
2.  **Use Hooks:** If a hook exists (like `useSpending`), extend it instead of creating new ones.
3.  **Respect History:** Never delete a `RecurringRule` if it has past instances unless explicitly asked. Use `endDate`.
4.  **Currency Safety:** Always check `currencyCode`. Never sum different currencies without conversion.