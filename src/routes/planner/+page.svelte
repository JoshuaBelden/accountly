<script lang="ts">
  import SpendingChart from "$lib/components/budget/SpendingChart.svelte"
  import BillRow from "$lib/components/planner/BillRow.svelte"
  import IncomeRow from "$lib/components/planner/IncomeRow.svelte"
  import EmptyState from "$lib/components/shared/EmptyState.svelte"
  import { billsStore } from "$lib/stores/bills.store"
  import { budgetStore } from "$lib/stores/budget.store"
  import { paychecksStore } from "$lib/stores/paychecks.store"
  import { plannerStore } from "$lib/stores/planner.store"
  import { transactionsStore } from "$lib/stores/transactions.store"
  import type { BudgetCategory, MonthlyBudgetOverride } from "$lib/types"
  import { formatCurrency } from "$lib/utils/currency"
  import { addMonths, currentMonth, formatMonth, getPayDaysInMonth } from "$lib/utils/date"

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

  // Bill line items for summary
  $: billItems = monthlyBills.map(bill => {
    const assignment = monthAssignments.find(a => a.billId === bill.id) ?? null
    const linkedTx = assignment?.transactionId ? monthTransactions.find(t => t.id === assignment.transactionId) : null
    const isPaid = linkedTx?.clearedStatus === "cleared" || assignment?.manuallyPaid === true
    const amount =
      linkedTx?.clearedStatus === "cleared" && linkedTx ? linkedTx.amount : (assignment?.overrideAmount ?? bill.amount)
    return { bill, isPaid, amount }
  })
  $: totalBills = billItems.reduce((sum, item) => sum + item.amount, 0)
  $: netCashFlow = totalIncome - totalBills

  // Budget categories for spending chart
  let categories: BudgetCategory[] = []
  let overrides: MonthlyBudgetOverride[] = []
  budgetStore.categories.subscribe((c: BudgetCategory[]) => (categories = c))
  budgetStore.overrides.subscribe((o: MonthlyBudgetOverride[]) => (overrides = o))

  $: chartTransactions = $transactionsStore.filter(t => t.plannerMonth === month || t.date.startsWith(month))

  $: chartData = categories
    .map((cat, i) => {
      const colors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"]
      const amount = chartTransactions
        .filter(t => {
          if (t.type === "income") return false
          if (t.splits?.length) return t.splits.some(s => s.categoryId === cat.id)
          return t.categoryId === cat.id
        })
        .reduce((sum, t) => {
          if (t.splits?.length) {
            return sum + t.splits.filter(s => s.categoryId === cat.id).reduce((ss, s) => ss + s.amount, 0)
          }
          return sum + t.amount
        }, 0)
      return { label: cat.name, amount, color: colors[i % colors.length] }
    })
    .filter(d => d.amount > 0)
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
          <span class="flex-1 text-gray-400">Total Bills</span>
          <span class="w-32 text-right tabular-nums text-red-400">-{formatCurrency(totalBills)}</span>
        </div>
        <div class="flex items-center text-sm font-semibold border-t border-gray-700 pt-3">
          <span class="flex-1 text-gray-200">Net</span>
          <span class="w-32 text-right tabular-nums {netCashFlow >= 0 ? 'text-emerald-400' : 'text-red-400'}">
            {formatCurrency(netCashFlow)}
          </span>
        </div>
      </div>
    </div>

    <!-- Income section -->
    <div class="card">
      <h2 class="text-sm font-semibold text-gray-300 mb-3">Income</h2>
      {#if payPeriods.length === 0}
        <p class="text-sm text-gray-500">No pay days found in {formatMonth(month)}.</p>
      {:else}
        <div class="divide-y divide-gray-700/50">
          {#each payPeriods as { paycheck, date } (`${paycheck.id}-${date}`)}
            <IncomeRow {paycheck} paycheckDate={date} {monthTransactions} />
          {/each}
        </div>
        <div class="flex items-center text-sm font-medium border-t border-gray-700 pt-3 mt-3">
          <span class="flex-1 text-gray-300">Total Income</span>
          <span class="w-32 text-right tabular-nums text-emerald-400">+{formatCurrency(totalIncome)}</span>
        </div>
      {/if}
    </div>

    <!-- Bills section -->
    <div class="card">
      <h2 class="text-sm font-semibold text-gray-300 mb-3">Bills</h2>
      {#if monthlyBills.length === 0}
        <p class="text-sm text-gray-500">No monthly bills configured.</p>
      {:else}
        <div class="space-y-0.5">
          {#each monthlyBills as bill (bill.id)}
            <BillRow
              {bill}
              assignment={monthAssignments.find(a => a.billId === bill.id) ?? null}
              plannerMonth={month}
            />
          {/each}
        </div>
        <div class="flex items-center text-sm font-medium border-t border-gray-700 pt-3 mt-3">
          <span class="flex-1 text-gray-300">Total Bills</span>
          <span class="w-32 text-right tabular-nums text-red-400">-{formatCurrency(totalBills)}</span>
        </div>
      {/if}
    </div>

    <!-- Spending Breakdown -->
    <div class="card max-w-[50%]">
      <h3 class="text-sm font-semibold text-gray-300 mb-4">Spending Breakdown</h3>
      <SpendingChart data={chartData} horizontal />
    </div>
  {/if}
</div>
