<script lang="ts">
  import CategorySpendingRow from "$lib/components/planner/CategorySpendingRow.svelte"
  import PayPeriodSection from "$lib/components/planner/PayPeriodSection.svelte"
  import EmptyState from "$lib/components/shared/EmptyState.svelte"
  import { billsStore } from "$lib/stores/bills.store"
  import { budgetStore } from "$lib/stores/budget.store"
  import { loanAccounts } from "$lib/stores/accounts.store"
  import { paychecksStore } from "$lib/stores/paychecks.store"
  import { plannerStore } from "$lib/stores/planner.store"
  import { transactionsStore } from "$lib/stores/transactions.store"
  import type { BudgetCategory, MonthlyBudgetOverride } from "$lib/types"
  import { formatCurrency } from "$lib/utils/currency"
  import { addMonths, currentMonth, formatMonth, getPayDaysInMonth } from "$lib/utils/date"
  import {
    computeBudgetTotal,
    computeCategorySpendingGroups,
    groupPaymentsByPayPeriod,
    resolvePaymentStatus,
    type PayPeriodPaymentItem,
  } from "$lib/utils/planner"

  let month = currentMonth()

  function prevMonth() {
    month = addMonths(month, -1)
  }
  function nextMonth() {
    month = addMonths(month, 1)
  }

  // All income periods — paycheck-type first, then other income
  $: payPeriods = [
    ...$paychecksStore
      .filter(pc => (pc.incomeType ?? "paycheck") === "paycheck")
      .flatMap(pc => getPayDaysInMonth(pc, month).map(date => ({ paycheck: pc, date })))
      .sort((a, b) => a.date.localeCompare(b.date)),
    ...$paychecksStore
      .filter(pc => pc.incomeType === "other")
      .flatMap(pc => getPayDaysInMonth(pc, month).map(date => ({ paycheck: pc, date })))
      .sort((a, b) => a.date.localeCompare(b.date)),
  ]

  // Monthly bills sorted by due day (bills with no due day sort last)
  $: monthlyBills = $billsStore
    .filter(b => b.frequency === "monthly")
    .slice()
    .sort((a, b) => (a.dueDayOfMonth ?? 99) - (b.dueDayOfMonth ?? 99))

  // Monthly loan payments — same monthly-only cadence the planner already applies to bills
  $: monthlyLoans = $loanAccounts
    .filter(l => l.paymentFrequency === "monthly")
    .slice()
    .sort((a, b) => a.paymentDueDay - b.paymentDueDay)

  $: monthAssignments = $plannerStore.filter(a => a.plannerMonth === month)
  $: monthTransactions = $transactionsStore.filter(t => t.plannerMonth === month || t.date.startsWith(month))

  // Income line items for summary
  $: incomeItems = payPeriods.map(pp => {
    const paycheckTx = monthTransactions.find(
      t =>
        t.paycheckId === pp.paycheck.id &&
        t.plannedPaycheckDate === pp.date &&
        t.type === "income" &&
        t.clearedStatus === "cleared",
    )
    return {
      paycheck: pp.paycheck,
      date: pp.date,
      amount: paycheckTx ? paycheckTx.amount : pp.paycheck.expectedAmount,
      isReceived: !!paycheckTx,
    }
  })
  $: totalIncome = incomeItems.reduce((sum, item) => sum + item.amount, 0)

  // Combined bill + loan payment line items for summary, merged into one list (not a separate section)
  $: paymentItems = [
    ...monthlyBills.map((bill): PayPeriodPaymentItem => {
      const assignment = monthAssignments.find(a => a.billId === bill.id) ?? null
      const status = resolvePaymentStatus(bill.id, "billId", bill.amount, assignment, monthTransactions, month)
      return { id: bill.id, name: bill.name, dueDayOfMonth: bill.dueDayOfMonth, kind: "bill", source: bill, isPaid: status.isPaid, amount: status.amount }
    }),
    ...monthlyLoans.map((loan): PayPeriodPaymentItem => {
      const assignment = monthAssignments.find(a => a.loanAccountId === loan.id) ?? null
      const status = resolvePaymentStatus(loan.id, "loanAccountId", loan.minimumPayment, assignment, monthTransactions, month)
      return { id: loan.id, name: loan.name, dueDayOfMonth: loan.paymentDueDay, kind: "loan", source: loan, isPaid: status.isPaid, amount: status.amount }
    }),
  ]
  $: totalPayments = paymentItems.reduce((sum, item) => sum + item.amount, 0)

  // Bills & loans grouped by which paycheck actually covers them, so shortfalls within the month are visible
  $: payPeriodBuckets = groupPaymentsByPayPeriod($paychecksStore, incomeItems, paymentItems, month)

  // Budget categories, for the discretionary portion of the spending forecast
  let categories: BudgetCategory[] = []
  let overrides: MonthlyBudgetOverride[] = []
  budgetStore.categories.subscribe((c: BudgetCategory[]) => (categories = c))
  budgetStore.overrides.subscribe((o: MonthlyBudgetOverride[]) => (overrides = o))

  // Total budgeted spending across every category, for the month
  $: budgetTotal = computeBudgetTotal(categories, overrides, month)

  $: netCashFlow = totalIncome - totalPayments - budgetTotal

  // Transactions with no category and no splits, not already tracked as a bill/loan payment — the "holes" that weren't planned for at all
  $: uncategorizedTransactions = monthTransactions
    .filter(t => t.type !== "income" && t.type !== "bill_payment" && t.type !== "loan_payment" && !t.categoryId && !t.splits?.length)
    .sort((a, b) => b.date.localeCompare(a.date))
  $: uncategorizedSpend = uncategorizedTransactions.reduce((sum, t) => sum + t.amount, 0)

  $: forecastNet = totalIncome - totalPayments - budgetTotal - uncategorizedSpend

  // Every budget category with its subcategories' cleared spend so far this month, for the watch-list below the header
  $: categorySpendingGroups = computeCategorySpendingGroups(categories, monthTransactions, overrides, month)
</script>

<div class="max-w-7xl mx-auto space-y-6">
  <!-- Month navigation -->
  <div class="flex items-center gap-4">
    <button class="btn-secondary px-3 py-1.5" on:click={prevMonth} aria-label="Previous month">
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </button>
    <h1 class="text-2xl font-bold text-gray-100">{formatMonth(month)}</h1>
    <button class="btn-secondary px-3 py-1.5" on:click={nextMonth} aria-label="Next month">
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  </div>

  {#if $paychecksStore.length === 0}
    <EmptyState
      title="No income configured"
      description="Set up your income sources in Accounts to use the Monthly Planner."
    />
  {:else}
    <!-- Monthly Summary -->
    <div class="card">
      <h3 class="text-sm font-semibold text-gray-300 mb-4">Monthly Summary</h3>
      <div class="space-y-2">
        <div class="flex items-center text-sm">
          <span class="flex-1 text-gray-400">Total Income</span>
          <span class="w-32 text-right tabular-nums text-emerald-400">+{formatCurrency(totalIncome)}</span>
        </div>
        <div class="flex items-center text-sm">
          <span class="flex-1 text-gray-400">Bills & Loans</span>
          <span class="w-32 text-right tabular-nums text-red-400">-{formatCurrency(totalPayments)}</span>
        </div>
        <div class="flex items-center text-sm">
          <span class="flex-1 text-gray-400">Total Budgeted</span>
          <span class="w-32 text-right tabular-nums text-amber-400">-{formatCurrency(budgetTotal)}</span>
        </div>
        <div class="flex items-center text-sm font-semibold border-t border-gray-700 pt-3">
          <span class="flex-1 text-gray-200">Net</span>
          <span class="w-32 text-right tabular-nums {netCashFlow >= 0 ? 'text-emerald-400' : 'text-red-400'}">
            {formatCurrency(netCashFlow)}
          </span>
        </div>
      </div>
    </div>

    <!-- Income and Bills & Loans, split by pay period -->
    {#if payPeriodBuckets.length === 0}
      <div class="card">
        <p class="text-sm text-gray-500">No pay days found in {formatMonth(month)}.</p>
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {#each payPeriodBuckets as bucket (bucket.label + (bucket.date ?? ""))}
          <PayPeriodSection {bucket} plannerMonth={month} {monthAssignments} {monthTransactions} />
        {/each}
      </div>
    {/if}

    <!-- Spending Forecast -->
    <div class="card">
      <h3 class="text-sm font-semibold text-gray-300 mb-4">Spending Forecast — {formatMonth(month)}</h3>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div>
          <div class="text-xs text-gray-500 uppercase tracking-wide mb-1">Income</div>
          <div class="text-lg font-bold text-emerald-400 tabular-nums">+{formatCurrency(totalIncome)}</div>
        </div>
        <div>
          <div class="text-xs text-gray-500 uppercase tracking-wide mb-1">Bills & Loans</div>
          <div class="text-lg font-bold text-red-400 tabular-nums">-{formatCurrency(totalPayments)}</div>
        </div>
        <div>
          <div class="text-xs text-gray-500 uppercase tracking-wide mb-1">Budgeted</div>
          <div class="text-lg font-bold text-amber-400 tabular-nums">-{formatCurrency(budgetTotal)}</div>
        </div>
        <div>
          <div class="text-xs text-gray-500 uppercase tracking-wide mb-1">Uncategorized</div>
          <div class="text-lg font-bold text-orange-400 tabular-nums">-{formatCurrency(uncategorizedSpend)}</div>
        </div>
        <div>
          <div class="text-xs text-gray-500 uppercase tracking-wide mb-1">Forecast Net</div>
          <div class="text-lg font-bold tabular-nums {forecastNet >= 0 ? 'text-emerald-400' : 'text-red-400'}">
            {formatCurrency(forecastNet)}
          </div>
        </div>
      </div>

      {#if categorySpendingGroups.length > 0}
        <div class="mt-5 pt-4 border-t border-gray-700 space-y-3">
          {#each categorySpendingGroups as group (group.categoryId)}
            <CategorySpendingRow {group} {month} />
          {/each}
        </div>
      {/if}

      {#if uncategorizedTransactions.length > 0}
        <div class="mt-5 pt-4 border-t border-gray-700">
          <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Uncategorized Transactions</h4>
          <div class="space-y-1.5">
            {#each uncategorizedTransactions as transaction (transaction.id)}
              <div class="flex items-center justify-between text-sm">
                <a
                  href="/transactions?uncategorized=true&month={month}&q={encodeURIComponent(transaction.description)}"
                  class="text-gray-400 hover:text-indigo-300 transition-colors truncate mr-2"
                >
                  {transaction.description}
                </a>
                <span class="text-red-400 tabular-nums flex-shrink-0">{formatCurrency(transaction.amount)}</span>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>
