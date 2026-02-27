# Accountly

A personal finance manager for the average person. Accountly helps you track accounts, bills, paychecks, transactions, and budgets — all stored locally in your browser with no backend or sign-up required.

## Features

- **Accounts** — Track checking, savings, loans, assets, and investments
- **Bills** — Manage recurring bills tied to paycheck cycles
- **Planner** — Monthly view of paychecks and their assigned bills
- **Budget** — Category-based budgeting with actual vs. planned spending
- **Transactions** — Log and categorize transactions with merchant matching
- **Net Worth** — Asset and liability summary with a forecast timeline
- **Settings** — Export/import data, adjust currency and display preferences

## Architecture

Accountly is a fully client-side SPA with no server, database, or authentication.

| Layer | Technology |
|---|---|
| Framework | [SvelteKit 2](https://kit.svelte.dev) (static adapter) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS 3 (dark mode via class) |
| Build | Vite 6 |
| Storage | Browser `localStorage` |

All state lives in Svelte writable stores under `src/lib/stores/`, each of which auto-persists to `localStorage` under the `accountly:` key prefix. There is no backend — the app is built to a static `build/` directory and can be served from any static host.

### Source layout

```
src/
  lib/
    types/        TypeScript interfaces for all domain models
    stores/       Svelte stores (accounts, bills, paychecks, transactions, budget, planner)
    persistence/  localStorage read/write and export/import helpers
    utils/        Currency, date, and finance utilities
    components/   UI components organized by domain
  routes/         SvelteKit file-based routes (accounts, bills, planner, budget, networth, settings)
```

## Getting Started

**Prerequisites:** Node.js 18+

```bash
# Install dependencies
npm install

# Start the dev server (http://localhost:5173)
npm run dev

# Type-check
npm run check

# Build for production
npm run build

# Preview the production build
npm run preview
```

The production build outputs to `build/` and can be deployed to any static host (Netlify, Vercel, GitHub Pages, etc.).

## Data

All data is stored in your browser's `localStorage`. Nothing is sent to any server. You can export a full JSON backup or import a previous backup from the **Settings** page.
