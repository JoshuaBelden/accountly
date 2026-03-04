# Accountly

A personal finance manager for the average person. Accountly helps you track accounts, bills, paychecks, transactions, and budgets — all stored locally in your browser with no sign-up required.

## Features

- **Dashboard** — Financial health overview with key widgets
- **Accounts** — Track checking, savings, loans, assets, and investments
- **Bills** — Manage recurring bills tied to paycheck cycles
- **Planner** — Monthly view of paychecks and their assigned bills
- **Budget** — Category-based budgeting with actual vs. planned spending
- **Transactions** — Log and categorize transactions with merchant matching
- **Merchants** — Manage merchant profiles and icons
- **Net Worth** — Asset and liability summary with a forecast timeline
- **Tools** — Loan payoff calculator, subscription tracker, tip calculator
- **Settings** — Export/import data, adjust currency and display preferences

## Architecture

Accountly is a SvelteKit SPA deployed to Vercel. All user data lives in browser `localStorage` — there is no traditional database for user data.

| Layer | Technology |
|---|---|
| Framework | [SvelteKit 2](https://kit.svelte.dev) (Vercel adapter) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS 3 (dark mode via class) |
| Build | Vite 6 |
| Primary storage | Browser `localStorage` |
| Cloud sync (optional) | MongoDB Atlas via Vercel serverless functions |

### Source layout

```
src/
  lib/
    types/        TypeScript interfaces for all domain models
    stores/       Svelte stores (accounts, bills, paychecks, transactions, budget, planner, merchants)
    persistence/  localStorage read/write and export/import helpers
    server/       Server-only code (MongoDB client for cloud sync)
    utils/        Currency, date, and finance utilities
    components/   UI components organized by domain
  routes/
    api/
      sync/[id]   Cloud sync endpoints (GET/POST — requires MongoDB)
      health/     Health check endpoint
    dashboard/    Financial health overview
    accounts/     Account management
    bills/        Bill management
    planner/      Monthly planner
    budget/       Budget categories and actuals
    transactions/ Transaction log
    merchants/    Merchant management
    networth/     Net worth and forecast
    tools/        Financial calculators
    settings/     App preferences, export/import, sync
```

## Local Storage

All user data is persisted under the `accountly:` key prefix in `localStorage`:

| Key | Contents |
|---|---|
| `accountly:accounts` | Checking, savings, loans, assets, investments |
| `accountly:bills` | Recurring bills |
| `accountly:paychecks` | Paycheck schedules |
| `accountly:transactions` | Transaction log |
| `accountly:budgetCategories` | Budget category definitions |
| `accountly:budgetOverrides` | Month-specific budget overrides |
| `accountly:plannerAssignments` | Bill-to-paycheck assignments |
| `accountly:merchants` | Merchant profiles |
| `accountly:settings` | App preferences |

A consent key (`accountly_consent`) is stored separately and excluded from exports.

Users can export a full JSON snapshot or import a previous backup from the **Settings** page.

## Cloud Sync (Optional)

The app supports optional cloud sync via MongoDB Atlas. When configured, a user's encrypted data blob is stored in a `syncs` collection keyed by a user-generated ID. This is entirely opt-in — users must enable sync in Settings and acknowledge the data policy.

To enable cloud sync:

1. Create a MongoDB Atlas cluster and database named `accountly` with a collection named `syncs`
2. Set the connection string as an environment variable:

```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/
```

Without `MONGODB_URI`, the app runs fine with local storage only — the sync API endpoints will fail, but no other functionality is affected.

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

# Preview the production build locally
npm run preview
```

### Debugging

- **Svelte stores**: All stores are available in browser devtools via `localStorage` — inspect any `accountly:*` key to see current state.
- **Sync API**: The `/api/health` endpoint returns `{ ok: true }` to verify the server is up. The `/api/sync/[id]` endpoints require `MONGODB_URI` to be set.
- **Type errors**: Run `npm run check` to surface SvelteKit and TypeScript errors. The project uses strict mode — `any` types will surface as warnings.
- **Dark mode**: Toggled via a `dark` class on `<html>`. Inspect the root element if dark mode appears stuck.

The production build outputs to `.vercel/output/` when using the Vercel adapter, or deploy via `vercel deploy`.
