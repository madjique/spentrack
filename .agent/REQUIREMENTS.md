# Technical Strategy & Requirements: Personal Expense Tracker PWA

**Target Audience:** Product / Engineering
**Goal:** Build a purely client-side, local-first Progressive Web App (PWA) to track, visualize, and manage personal recurrent and one-time spendings. 

---

## 1. Architectural Overview & Tech Stack Choices

* **Framework:** **React 18+ with Vite**. Vite provides an excellent developer experience and seamless PWA plugin integration (`vite-plugin-pwa`).
* **Language:** **TypeScript**. Strict typing is mandatory for handling complex financial data, recurring rule logic, and storage schemas.
* **Local Storage & Database:** **Dexie.js (IndexedDB wrapper)**. 
    * *Justification:* Standard `window.localStorage` has a strict ~5MB limit and only stores strings. Since we will import CSVs and dynamically generate recurring instances over years, **IndexedDB** is mandatory. Dexie provides a reactive, robust, offline-first NoSQL database right in the browser, perfectly matching the local-only requirement.
* **State Management:** **Zustand**. Lightweight state management for UI state (e.g., dark mode, active currency, current selected period). Database state should be queried directly via Dexie live queries (`dexie-react-hooks`).
* **Styling:** **Tailwind CSS**. Highly modular, makes implementing the light/dark mode requirement trivial using the `dark:` variant and CSS variables.
* **Visualizations:** **Recharts** or **Chart.js**. Recharts is highly composable for React and handles pie/donut (wheel) charts effortlessly.
* **Date Manipulation:** **date-fns** or **Day.js**. Crucial for calculating recurring instances safely across leap years, different month lengths, etc.
* **CSV Processing:** **PapaParse** (for reading/importing) and standard JS blobs for exporting.

---

## 2. Core Data Modeling & Schemas (Dexie/IndexedDB)

Handling recurring events with single-instance overrides is the core architectural challenge. We will use a **Rule + Exception pattern** (standard in iCal implementations).

**1. Settings & Currencies**
```typescript
interface Currency {
  code: string; // e.g., 'EUR', 'USD'
  symbol: string; // e.g., '€', '$'
  exchangeRateToUSD: number; // Manual conversion rate relative to USD (or base)
  isDefault: boolean;
}

interface AppSettings {
  id: 'global'; // Singleton record
  theme: 'light' | 'dark' | 'system';
  defaultView: 'week' | 'month' | 'year';
  currencies: Currency[];
}
```

**2. Categories**
```typescript
interface Category {
  id: string;
  name: string;
  color: string;
  isDefault: boolean;
}
```

**3. Transactions (One-timers)**
```typescript
interface Transaction {
  id: string;
  amount: number;
  currencyCode: string; // e.g., 'EUR'
  date: string; // ISO 8601
  categoryId: string;
  note?: string;
  type: 'EXPENSE' | 'INCOME';
}
```

**4. Recurring Rules**
```typescript
interface RecurringRule {
  id: string;
  baseAmount: number;
  currencyCode: string;
  categoryId: string;
  // Note: SEMI_MONTHLY = 2x a month. BIMONTHLY = 1x every 2 months.
  frequency: 'WEEKLY' | 'SEMI_MONTHLY' | 'MONTHLY' | 'BIMONTHLY' | 'YEARLY';
  startDate: string;
  endDate?: string; // null means infinite. Crucial for "update from this date forward" logic.
  note?: string;
  type: 'EXPENSE' | 'INCOME';
}
```

**5. Recurring Exceptions (Overrides)**
This table stores modifications to specific instances of a recurring rule. **Overrides are immutable unless explicitly deleted by the user.**
```typescript
interface RecurringException {
  id: string;
  ruleId: string;
  originalDate: string; // The date the instance was SUPPOSED to happen
  isDeleted: boolean;   // If true, the instance was skipped/deleted
  newAmount?: number;   // If present, overrides the baseAmount
  newDate?: string;     // If present, overrides the original date
}
```

**6. CSV Import Mapping (Architectural Prep)**
To future-proof for dynamic CSV column mapping without fully implementing it yet.
```typescript
interface CsvImportTemplate {
  id: string;
  name: string; // e.g., "My Bank Export"
  columnMap: Record<string, string>; // e.g., { "Date": "Transaction Date", "Amount": "Debit" }
}
```

### Business Logic for Data Retrieval & Rule Modification

**Retrieval (e.g., March 2026):**
1. Query `Transactions` between Mar 1 and Mar 31.
2. Query `RecurringRules` active during March (`startDate` <= Mar 31 AND (`endDate` >= Mar 1 OR `endDate` is null)).
3. Dynamically generate "virtual" transactions for each rule inside March.
4. Query `RecurringExceptions` for the generated instances.
5. Merge: Apply exceptions to virtual transactions.
6. Currency Normalization: If displaying a global total, use the `Settings.currencies` exchange rates to convert all transaction amounts to the user's active UI currency.

**Rule Modification Logic (The "Split" Pattern):**
If a user modifies the `baseAmount` of a `RecurringRule` and selects *"Apply from this month forward"*:
1. Set the `endDate` of the *existing* `RecurringRule` to yesterday.
2. Create a *new* `RecurringRule` starting today with the new `baseAmount`.
3. *Why?* This inherently preserves all past `RecurringExceptions` tied to the old rule ID, preventing historical data corruption.
If they select *"Apply to all past and future"*: simply update the `baseAmount` of the existing rule. Existing `RecurringExceptions` will still override this new base amount for their specific dates.

---

## 3. Functional Requirements (User Stories)

### Epic 1: PWA & Core System
* **Story 1.1:** As a user, I want to install the app on my home screen for a native feel.
* **Story 1.2:** As a user, I want the app to work 100% offline using my device's IndexedDB.
* **Story 1.3:** As a user, I want to toggle between Light and Dark mode.

### Epic 2: Spendings Management
* **Story 2.1:** As a user, I want to add a one-time spending with an amount, currency, date, category, and note.
* **Story 2.2:** As a user, I want to add a recurring spending, defining its frequency (weekly, semi-monthly, monthly, bi-monthly, yearly) and start date.
* **Story 2.3:** As a user, I want to modify a single instance of a recurring spending (creating an exception) without affecting the base rule.
* **Story 2.4:** As a user, I want to modify a recurring rule and choose whether the change applies to "All past and future instances" or "Only instances from this date forward" (triggering a rule split).

### Epic 3: Multi-Currency Support
* **Story 3.1:** As a user, I want Euro (€) as my default currency and Dollar ($) available out-of-the-box.
* **Story 3.2:** As a user, I want to manually add new currencies and define their manual conversion rate to my base currency so my charts can show an accurate unified total.

### Epic 4: Dashboard & Visualization
* **Story 4.1:** As a user, I want a Home Page showing my current week/month (based on settings).
* **Story 4.2:** As a user, I want to see a donut chart showing spendings broken down by category, with all foreign currencies converted to my main display currency.
* **Story 4.3:** As a user, I want arrows to navigate backwards and forwards in time.

### Epic 5: Data Portability (CSV)
* **Story 5.1:** As a user, I want to export all my data (resolved to actual historical instances) to a CSV.
* **Story 5.2:** As a user, I want to import a CSV of past expenses. (Code architecture should prepare for dynamic column mapping, even if the initial UI assumes a strict format).

---

## 4. UI/UX Architecture Breakdown
* **Layout:** Bottom tab navigation (Mobile) or Sidebar (Desktop) containing: Dashboard, List View, Add(+), Settings.
* **Dashboard View:** Period selector -> Total Spent (in Default Currency) -> Recharts Donut Chart -> Top Categories.
* **Add View:** Toggle switch `[ One-Time | Recurring ]`. Currency selector next to Amount input.
* **Settings View:** Theme toggle, Default Period Select, Currency Manager (Add/Edit exchange rates), Import/Export, Category Manager.

---

## 5. Folder Structure & Implementation Modules

The codebase is organized into modular directories to separate concerns and ensure scalability:

### `src/hooks/`
Encapsulates business logic and reactive state for different domains:
* `useTransactions.ts`: CRUD operations for one-time transactions and income.
* `useSpending.ts`: Core logic for resolving recurring rules and exceptions into "virtual" transactions.
* `useCurrency.ts`: Handles exchange rate logic and multi-currency conversions.
* `useSettings.ts`: Manages global application settings (theme, default view).
* `useTheme.ts`: Utility for toggling light/dark modes.

### `src/utils/`
Pure utility functions with no side effects:
* `transaction.utils.ts`: Calculations for totals, category breakdowns, and virtual transaction generation.
* `date.utils.ts`: Period-based date manipulation (start of week, end of month, navigation).
* `currency.utils.ts`: Formatting and conversion helpers.
* `csv.utils.ts`: Logic for exporting data and parsing imported CSV files.

### `src/db/`
IndexedDB configuration using Dexie.js:
* `database.ts`: Table definitions and database initialization.
* `model.ts`: TypeScript interfaces for all persistent entities.

### `src/store/`
Global UI state management using Zustand:
* `useAppStore.ts`: Tracks current period, active currency, and UI-specific states.
