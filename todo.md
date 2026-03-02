# Todo

## Nice to Haves

- Notes on months — a simple text field per month to journal what happened ("started new job", "car repair")
- Print / PDF export of the monthly planner or budget summary
- Recurring transaction detection — scan imported transactions for patterns and suggest converting them to bills
- Keyboard shortcuts throughout — navigate months, open forms, approve transactions

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
