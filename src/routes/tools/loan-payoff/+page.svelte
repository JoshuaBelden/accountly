<script lang="ts">
  import EmptyState from "$lib/components/shared/EmptyState.svelte"
  import { loanAccounts } from "$lib/stores/accounts.store"
  import type { LoanAccount } from "$lib/types"
  import { formatCurrency } from "$lib/utils/currency"
  import { buildYearlySummary, loanPayoffMonths, loanTotalInterest, simulateWaterfallPayoff } from "$lib/utils/finance"

  type Strategy = "avalanche" | "snowball"

  let strategy: Strategy = "avalanche"
  let extraPayment = 0

  $: loans = $loanAccounts.filter(loan => loan.remainingBalance > 0)

  $: baselineData = loans.map(loan => {
    const months = loanPayoffMonths(loan.remainingBalance, loan.interestRate, loan.minimumPayment)
    const interest = loanTotalInterest(loan.remainingBalance, loan.interestRate, loan.minimumPayment)
    return { loanId: loan.id, months, interest }
  })

  $: strategyResults = simulateWaterfallPayoff(loans, extraPayment, strategy)
  $: yearlySummaries = buildYearlySummary(loans, extraPayment, strategy)

  $: totalOwed = loans.reduce((sum, loan) => sum + loan.remainingBalance, 0)
  $: totalMinimums = loans.reduce((sum, loan) => sum + loan.minimumPayment, 0)

  $: baselineMaxMonths =
    baselineData.length > 0 ? Math.max(...baselineData.map(d => (isFinite(d.months) ? d.months : 1200))) : 0
  $: strategyMaxMonths =
    strategyResults.length > 0
      ? Math.max(...strategyResults.map(r => (isFinite(r.strategyMonths) ? r.strategyMonths : 1200)))
      : 0

  $: monthsSaved = Math.max(0, baselineMaxMonths - strategyMaxMonths)
  $: baselineTotalInterest = baselineData.reduce((sum, d) => sum + d.interest, 0)
  $: strategyTotalInterest = strategyResults.reduce((sum, r) => sum + r.strategyInterest, 0)
  $: interestSaved = Math.max(0, baselineTotalInterest - strategyTotalInterest)

  function monthsToDate(months: number): string {
    if (!isFinite(months) || months >= 1200) return "Never"
    const date = new Date()
    date.setMonth(date.getMonth() + months)
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
  }

  function getBaseline(id: string) {
    return baselineData.find(d => d.loanId === id)
  }

  function getLoan(id: string): LoanAccount | undefined {
    return loans.find(loan => loan.id === id)
  }

  function setStrategy(value: Strategy) {
    strategy = value
  }
</script>

<div class="max-w-4xl mx-auto space-y-8">
  <!-- Header -->
  <div class="flex items-start gap-4">
    <a
      href="/accounts"
      class="mt-1 p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
      aria-label="Back to Accounts"
    >
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </a>
    <div>
      <h1 class="text-2xl font-bold text-gray-100">Loan Payoff Planner</h1>
      <p class="text-sm text-gray-400 mt-0.5">Compare payoff strategies and see how extra payments accelerate your debt-free date.</p>
    </div>
  </div>

  {#if loans.length === 0}
    <EmptyState
      title="No active loans"
      description="Add loans on the Accounts page to start planning your payoff strategy."
      actionLabel="Go to Accounts"
      on:action={() => (window.location.href = "/accounts")}
    />
  {:else}
    <!-- Controls -->
    <div class="card flex flex-wrap gap-8 items-start">
      <!-- Strategy selector -->
      <div class="flex-1 min-w-52">
        <div class="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Strategy</div>
        <div class="flex rounded-lg overflow-hidden border border-gray-700">
          <button
            on:click={() => setStrategy("avalanche")}
            class="flex-1 px-4 py-2 text-sm font-medium transition-colors
              {strategy === 'avalanche' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}"
          >
            Avalanche
          </button>
          <button
            on:click={() => setStrategy("snowball")}
            class="flex-1 px-4 py-2 text-sm font-medium transition-colors border-l border-gray-700
              {strategy === 'snowball' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}"
          >
            Snowball
          </button>
        </div>
        <p class="text-xs text-gray-500 mt-2 leading-relaxed">
          {#if strategy === "avalanche"}
            Target the highest interest rate first — minimizes total interest paid over time.
          {:else}
            Target the smallest balance first — quick wins build momentum and motivation.
          {/if}
        </p>
      </div>

      <!-- Extra payment input -->
      <div class="w-52">
        <label for="extra-payment" class="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2 block">
          Extra Monthly Payment
        </label>
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
          <input
            id="extra-payment"
            type="number"
            bind:value={extraPayment}
            min="0"
            step="50"
            class="w-full pl-7 pr-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-100
              focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <p class="text-xs text-gray-500 mt-2">Applied to priority loan each month.</p>
      </div>
    </div>

    <!-- Summary stats -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div class="card text-center">
        <div class="text-xs text-gray-500 mb-1">Total Owed</div>
        <div class="text-lg font-bold text-red-400 tabular-nums">{formatCurrency(totalOwed)}</div>
      </div>
      <div class="card text-center">
        <div class="text-xs text-gray-500 mb-1">Monthly Minimums</div>
        <div class="text-lg font-bold text-gray-200 tabular-nums">{formatCurrency(totalMinimums)}</div>
        {#if extraPayment > 0}
          <div class="text-xs text-indigo-400 tabular-nums">+{formatCurrency(extraPayment)} extra</div>
        {/if}
      </div>
      <div class="card text-center">
        <div class="text-xs text-gray-500 mb-1">Debt-Free (minimums only)</div>
        <div class="text-lg font-bold text-gray-200">{monthsToDate(baselineMaxMonths)}</div>
        <div class="text-xs text-gray-500">{formatCurrency(baselineTotalInterest)} total interest</div>
      </div>
      <div class="card text-center">
        <div class="text-xs text-gray-500 mb-1">Debt-Free (with strategy)</div>
        <div class="text-lg font-bold {monthsSaved > 0 ? 'text-emerald-400' : 'text-gray-200'}">
          {monthsToDate(strategyMaxMonths)}
        </div>
        {#if monthsSaved > 0}
          <div class="text-xs text-emerald-400">{monthsSaved} month{monthsSaved === 1 ? "" : "s"} sooner</div>
        {:else}
          <div class="text-xs text-gray-500">{formatCurrency(strategyTotalInterest)} total interest</div>
        {/if}
      </div>
    </div>

    <!-- Savings banner -->
    {#if interestSaved > 1}
      <div class="bg-emerald-900/30 border border-emerald-700/50 rounded-xl px-5 py-3 flex items-center gap-3">
        <svg class="w-5 h-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-sm text-emerald-300">
          {#if extraPayment > 0}
            With the <strong class="text-emerald-200">{strategy}</strong> strategy and
            <strong class="text-emerald-200">{formatCurrency(extraPayment)}/mo extra</strong>, you'll save
            <strong class="text-emerald-200">{formatCurrency(interestSaved)}</strong> in interest
            {#if monthsSaved > 0}and pay off debt {monthsSaved} month{monthsSaved === 1 ? "" : "s"} sooner{/if}.
          {:else}
            The <strong class="text-emerald-200">{strategy}</strong> strategy saves
            <strong class="text-emerald-200">{formatCurrency(interestSaved)}</strong> in interest compared to paying each loan independently.
          {/if}
        </p>
      </div>
    {/if}

    <!-- Loan priority list -->
    <div class="space-y-3">
      <h2 class="section-title">
        Payoff Order
        <span class="text-sm font-normal text-gray-400 capitalize">({strategy})</span>
      </h2>

      {#each strategyResults as result (result.loanId)}
        {@const loan = getLoan(result.loanId)}
        {@const baseline = getBaseline(result.loanId)}
        {#if loan && baseline}
          {@const loanInterestSaved = Math.max(0, baseline.interest - result.strategyInterest)}
          {@const loanMonthsSaved = Math.max(0, (isFinite(baseline.months) ? baseline.months : 1200) - (isFinite(result.strategyMonths) ? result.strategyMonths : 1200))}
          <div class="card space-y-4">
            <!-- Loan header -->
            <div class="flex items-start gap-3">
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0
                  {result.priority === 1
                  ? 'bg-indigo-700 text-indigo-200'
                  : result.priority === 2
                    ? 'bg-violet-800 text-violet-200'
                    : 'bg-gray-700 text-gray-300'}"
              >
                {result.priority}
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-medium text-gray-100">{loan.name}</div>
                <div class="text-xs text-gray-500 mt-0.5">
                  {formatCurrency(loan.remainingBalance)} remaining · {(loan.interestRate * 100).toFixed(2)}% APR · {formatCurrency(loan.minimumPayment)}/mo minimum
                </div>
              </div>
              {#if result.priority === 1}
                <span class="text-xs bg-indigo-900 text-indigo-300 px-2 py-1 rounded-full font-medium shrink-0">
                  Priority target
                </span>
              {/if}
            </div>

            <!-- Payoff comparison -->
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 text-sm">
              <div>
                <div class="text-xs text-gray-500 mb-0.5">Baseline payoff</div>
                <div class="font-medium text-gray-300">{monthsToDate(baseline.months)}</div>
              </div>
              <div>
                <div class="text-xs text-gray-500 mb-0.5">Baseline interest</div>
                <div class="font-medium text-gray-300 tabular-nums">{formatCurrency(baseline.interest)}</div>
              </div>
              <div>
                <div class="text-xs text-gray-500 mb-0.5">Strategy payoff</div>
                <div class="font-medium {loanMonthsSaved > 0 ? 'text-emerald-400' : 'text-gray-300'}">
                  {monthsToDate(result.strategyMonths)}
                </div>
                {#if loanMonthsSaved > 0}
                  <div class="text-xs text-emerald-500">{loanMonthsSaved} mo sooner</div>
                {/if}
              </div>
              <div>
                <div class="text-xs text-gray-500 mb-0.5">Strategy interest</div>
                <div class="font-medium {loanInterestSaved > 1 ? 'text-emerald-400' : 'text-gray-300'} tabular-nums">
                  {formatCurrency(result.strategyInterest)}
                </div>
                {#if loanInterestSaved > 1}
                  <div class="text-xs text-emerald-500 tabular-nums">saves {formatCurrency(loanInterestSaved)}</div>
                {/if}
              </div>
            </div>
          </div>
        {/if}
      {/each}
    </div>

    <!-- Yearly Summary -->
    {#if yearlySummaries.length > 0}
      <div class="space-y-3">
        <h2 class="section-title">Yearly Summary</h2>
        <div class="card overflow-hidden p-0">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-700 bg-gray-800/50">
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Year</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Remaining Balance
                </th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Interest Paid
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Paid Off</th>
              </tr>
            </thead>
            <tbody>
              {#each yearlySummaries as summary (summary.yearIndex)}
                {@const isDebtFree = summary.totalBalance === 0}
                <tr class="border-b border-gray-800 last:border-0 {isDebtFree ? 'bg-emerald-900/10' : ''}">
                  <td class="px-4 py-3 font-medium {isDebtFree ? 'text-emerald-300' : 'text-gray-200'}">
                    {summary.calendarYear}
                  </td>
                  <td
                    class="px-4 py-3 text-right tabular-nums {isDebtFree
                      ? 'text-emerald-400 font-semibold'
                      : 'text-gray-300'}"
                  >
                    {formatCurrency(summary.totalBalance)}
                  </td>
                  <td class="px-4 py-3 text-right tabular-nums text-gray-400">
                    {formatCurrency(summary.cumulativeInterest)}
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex flex-wrap items-center gap-1.5">
                      {#each summary.loansCompletedThisYear as completed (completed.loanId)}
                        <span class="badge-green">{completed.name}</span>
                      {/each}
                      {#if isDebtFree}
                        <span class="text-xs font-medium text-emerald-400">Debt Free!</span>
                      {/if}
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}

    <!-- Legend -->
    <div class="text-xs text-gray-500 leading-relaxed">
      <strong class="text-gray-400">Baseline</strong> = each loan paid with its minimum payment independently, with no rollover.
      <strong class="text-gray-400">Strategy</strong> = minimums on all loans, extra funds directed to the priority loan each month;
      freed minimums roll to the next target when a loan is paid off.
    </div>
  {/if}
</div>
