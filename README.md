# SpenTrack — Personal Expense Tracker PWA

A fully offline-capable Personal Expense Tracker built with React 19, Vite, TypeScript, and Tailwind CSS.

## Features

- 📊 **Dashboard** — period summary (week/month/year) with donut chart breakdown by category
- 💸 **Transactions** — one-time and recurring (weekly, semi-monthly, monthly, bi-monthly, yearly)
- 🔄 **Recurring exceptions** — edit/delete a single instance, this-and-future, or all instances
- 🌙 **Dark mode** — light / dark / system preference
- 💱 **Multi-currency** — store in any currency, display in your active currency with exchange rates
- 🏷️ **Categories** — built-in defaults, fully editable and extendable
- 📥 **CSV import/export** — bulk import transactions or export all data
- 📱 **PWA** — installable, works offline via Workbox service worker

## Tech Stack

| Layer | Library |
|-------|---------|
| UI | React 19 + TypeScript |
| Build | Vite + `@tailwindcss/vite` |
| Styling | Tailwind CSS v4 (dark mode via `class`) |
| PWA | `vite-plugin-pwa` + Workbox |
| Database | Dexie.js (IndexedDB) + `dexie-react-hooks` |
| State | Zustand (persisted) |
| Charts | Recharts |
| Dates | date-fns |
| CSV | PapaParse |
| Routing | react-router-dom v7 |

## Getting Started

```bash
npm install
npm run dev       # start dev server
npm run build     # production build
npm run preview   # preview production build
```

## Project Structure

```
src/
  db/           # Dexie database schema & seed data
  lib/          # Recurring engine, period utils, CSV helpers
  store/        # Zustand UI store
  components/   # Shared UI components
  pages/        # Route-level page components
```
