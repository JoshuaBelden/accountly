# Todo

## Nice to Haves

- Keyboard shortcuts throughout — navigate months, open forms, approve transactions
- Notes on months — a simple text field per month to journal what happened ("started new job", "car repair")
- Print / PDF export of the monthly planner or budget summary
- Recurring transaction detection — scan imported transactions for patterns and suggest converting them to bills
- Planner,Budget: Moving months should be sticky, add Current Month to get back
- Responsive design for phones
- Add tip calculator
- Persist data for multi-device access

## Accountly Cloud Sync — Feature Summary

### Core Behavior

- Offline-first by default — existing localStorage behavior unchanged for all users
  Sync is opt-in — users who never touch it are unaffected
  Shared access — household members share a passphrase to access the same data (e.g. you and your wife)
  Manual push/pull — no background syncing; user explicitly uploads or downloads

### Security

Client-side encryption — data is encrypted in the browser before leaving the device using AES-256-GCM
Passphrase-derived key — PBKDF2 derives the encryption key from the user's passphrase (Web Crypto API, no dependencies)
Server sees nothing — the backend stores an opaque encrypted blob it cannot read
Lookup by hash — the sync ID is a SHA-256 hash of the passphrase, so no usernames or accounts are needed

### Sync UI (Settings Page)

Passphrase input, saved locally so you don't re-enter each session
Upload to Cloud button — encrypts and pushes current localStorage data
Download from Cloud button — fetches and decrypts into localStorage
Last synced timestamp shown
Conflict warning if cloud data is newer than your last upload


### Backend

Two API routes:
POST /sync/:id — upsert encrypted blob
GET /sync/:id — fetch encrypted blob
MongoDB Atlas as the data store
TTL index auto-expires data inactive for 180 days
No user accounts, no sessions, no auth middleware

### What We're Building

Piece Location
Crypto utilities src/lib/utils/crypto.ts
Settings store additions src/lib/stores/settings.ts
Sync UI src/routes/settings/+page.svelte
API server /server subdirectory (Node.js)
MongoDB collection Atlas — accountly.syncs

## Savings Goals

Let users create named goals (emergency fund, vacation, down payment) with a target amount and target date. Pull from account balances and auto-calculate monthly contribution needed. Show progress bars. This turns the asset section into something motivating.

## Cash Flow Forecast

You have bills, paychecks, and spending patterns. Project the next 3–6 months month-by-month: expected income minus recurring bills minus average discretionary spending = projected balance. Show a line graph. This is the natural evolution of the planner.

# Spending Trends

The budget page shows one month at a time. Add a trend view: last 6 months of spending per category as a bar or line chart. Spot seasonal spikes, creeping subscriptions, and progress toward budget discipline. You already have all the transaction data.

## Bill Calendar

A traditional calendar view for the current month with bills plotted on their due dates, paychecks on pay dates, and color-coded urgency. Much more scannable than the list. The planner has the data, just a different rendering.

## Transaction Rules / Auto-Rules

You have merchant matching. Add a broader rules engine: if description contains X and amount is between Y and Z, then assign category, split N%, flag as recurring. Reduces manual work after CSV import dramatically.

## Account Balance History

Right now accounts have a single current balance. Store a snapshot of each account's balance over time (updated on import or manually) and plot it. Real "net worth over time" instead of a projection.

## Financial Health Score

A simple dashboard widget: savings rate %, debt-to-income ratio, emergency fund coverage (months of expenses), budget adherence rate. Give each a green/yellow/red status. Opinionated but useful.
