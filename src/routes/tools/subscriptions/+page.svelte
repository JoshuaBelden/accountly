<script lang="ts">
  import EmptyState from "$lib/components/shared/EmptyState.svelte"
  import { billsStore } from "$lib/stores/bills.store"
  import type { Bill, BillFrequency } from "$lib/types"
  import { formatCurrency } from "$lib/utils/currency"

  /** Converts a bill's amount and frequency to an equivalent monthly cost. */
  function toMonthlyAmount(amount: number, frequency: BillFrequency): number {
    switch (frequency) {
      case "monthly":
        return amount
      case "bimonthly":
        return amount / 2
      case "quarterly":
        return amount / 3
      case "annually":
        return amount / 12
      case "weekly":
        return amount * (52 / 12)
      case "biweekly":
        return amount * (26 / 12)
    }
  }

  interface SubscriptionEntry {
    bill: Bill
    monthlyAmount: number
  }

  $: subscriptionBills = $billsStore.filter(bill => bill.isSubscription)

  $: streamingEntries = subscriptionBills
    .filter(bill => bill.isStreamingService)
    .map(bill => ({ bill, monthlyAmount: toMonthlyAmount(bill.amount, bill.frequency) }))
    .sort((a, b) => b.monthlyAmount - a.monthlyAmount)

  $: otherEntries = subscriptionBills
    .filter(bill => !bill.isStreamingService)
    .map(bill => ({ bill, monthlyAmount: toMonthlyAmount(bill.amount, bill.frequency) }))
    .sort((a, b) => b.monthlyAmount - a.monthlyAmount)

  $: streamingMonthly = streamingEntries.reduce((sum, entry) => sum + entry.monthlyAmount, 0)
  $: otherMonthly = otherEntries.reduce((sum, entry) => sum + entry.monthlyAmount, 0)
  $: totalMonthly = streamingMonthly + otherMonthly
  $: annualProjection = totalMonthly * 12

  const freqLabels: Record<BillFrequency, string> = {
    monthly: "monthly",
    bimonthly: "every 2 mo",
    weekly: "weekly",
    biweekly: "biweekly",
    quarterly: "quarterly",
    annually: "annually",
  }
</script>

<div class="max-w-4xl mx-auto space-y-8">
  <!-- Header -->
  <div class="flex items-start gap-4">
    <a
      href="/tools"
      class="mt-1 p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
      aria-label="Back to Tools"
    >
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </a>
    <div>
      <h1 class="text-2xl font-bold text-gray-100">Subscription Tracker</h1>
      <p class="text-sm text-gray-400 mt-0.5">
        Monthly burn from recurring subscriptions based on billing amounts.
      </p>
    </div>
  </div>

  {#if subscriptionBills.length === 0}
    <EmptyState
      title="No subscriptions tracked"
      description="Mark bills as subscriptions on the Bills page to start tracking your monthly spend."
      actionLabel="Go to Bills"
      on:action={() => (window.location.href = "/bills")}
    />
  {:else}
    <!-- Summary stats -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div class="card text-center">
        <div class="text-xs text-gray-500 mb-1">Total Monthly</div>
        <div class="text-lg font-bold text-gray-100 tabular-nums">{formatCurrency(totalMonthly)}</div>
        <div class="text-xs text-gray-500">{subscriptionBills.length} subscription{subscriptionBills.length === 1 ? "" : "s"}</div>
      </div>
      <div class="card text-center">
        <div class="text-xs text-gray-500 mb-1">Streaming Monthly</div>
        <div class="text-lg font-bold text-violet-400 tabular-nums">{formatCurrency(streamingMonthly)}</div>
        <div class="text-xs text-gray-500">{streamingEntries.length} service{streamingEntries.length === 1 ? "" : "s"}</div>
      </div>
      <div class="card text-center">
        <div class="text-xs text-gray-500 mb-1">Other Subscriptions</div>
        <div class="text-lg font-bold text-sky-400 tabular-nums">{formatCurrency(otherMonthly)}</div>
        <div class="text-xs text-gray-500">{otherEntries.length} service{otherEntries.length === 1 ? "" : "s"}</div>
      </div>
      <div class="card text-center">
        <div class="text-xs text-gray-500 mb-1">12-Month Projection</div>
        <div class="text-lg font-bold text-amber-400 tabular-nums">{formatCurrency(annualProjection)}</div>
        <div class="text-xs text-gray-500">at current rate</div>
      </div>
    </div>

    <!-- Streaming Services -->
    {#if streamingEntries.length > 0}
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="section-title">
            <span class="inline-flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-violet-400"></span>
              Streaming Services
            </span>
          </h2>
          <span class="text-sm text-gray-400 tabular-nums">{formatCurrency(streamingMonthly)}/mo</span>
        </div>

        <div class="space-y-2">
          {#each streamingEntries as entry (entry.bill.id)}
            <div class="card flex items-center justify-between gap-4">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-8 h-8 rounded-full bg-violet-900/60 flex items-center justify-center shrink-0">
                  <svg class="w-4 h-4 text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div class="min-w-0">
                  <div class="font-medium text-gray-100 truncate">{entry.bill.name}</div>
                  <div class="text-xs text-gray-500">
                    {formatCurrency(entry.bill.amount)} {freqLabels[entry.bill.frequency]}
                  </div>
                </div>
              </div>
              <div class="text-right shrink-0">
                <div class="font-medium text-gray-100 tabular-nums">{formatCurrency(entry.monthlyAmount)}</div>
                <div class="text-xs text-gray-500">per month</div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Other Subscriptions -->
    {#if otherEntries.length > 0}
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="section-title">
            <span class="inline-flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-sky-400"></span>
              Other Subscriptions
            </span>
          </h2>
          <span class="text-sm text-gray-400 tabular-nums">{formatCurrency(otherMonthly)}/mo</span>
        </div>

        <div class="space-y-2">
          {#each otherEntries as entry (entry.bill.id)}
            <div class="card flex items-center justify-between gap-4">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-8 h-8 rounded-full bg-sky-900/60 flex items-center justify-center shrink-0">
                  <svg class="w-4 h-4 text-sky-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div class="min-w-0">
                  <div class="font-medium text-gray-100 truncate">{entry.bill.name}</div>
                  <div class="text-xs text-gray-500">
                    {formatCurrency(entry.bill.amount)} {freqLabels[entry.bill.frequency]}
                  </div>
                </div>
              </div>
              <div class="text-right shrink-0">
                <div class="font-medium text-gray-100 tabular-nums">{formatCurrency(entry.monthlyAmount)}</div>
                <div class="text-xs text-gray-500">per month</div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Annual breakdown -->
    <div class="card space-y-3">
      <h2 class="section-title">Annual Projection</h2>
      <div class="space-y-2">
        {#if streamingEntries.length > 0}
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-400">Streaming ({streamingEntries.length} service{streamingEntries.length === 1 ? "" : "s"})</span>
            <span class="tabular-nums text-violet-400">{formatCurrency(streamingMonthly * 12)}</span>
          </div>
        {/if}
        {#if otherEntries.length > 0}
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-400">Other subscriptions ({otherEntries.length})</span>
            <span class="tabular-nums text-sky-400">{formatCurrency(otherMonthly * 12)}</span>
          </div>
        {/if}
        <div class="border-t border-gray-700 pt-2 flex items-center justify-between text-sm font-medium">
          <span class="text-gray-200">Total annual spend</span>
          <span class="tabular-nums text-amber-400">{formatCurrency(annualProjection)}</span>
        </div>
      </div>
      <p class="text-xs text-gray-600 leading-relaxed">
        Non-monthly bills are normalized: annual ÷ 12, quarterly ÷ 3, biweekly × 26/12, weekly × 52/12.
      </p>
    </div>

    <div class="flex justify-end">
      <a href="/bills" class="btn-secondary text-sm">Manage Bills</a>
    </div>
  {/if}
</div>
