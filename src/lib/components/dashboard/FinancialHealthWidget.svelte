<script lang="ts">
  import { slide } from "svelte/transition"
  import { onDestroy } from "svelte"
  import { accountsStore } from "$lib/stores/accounts.store"
  import { transactionsStore } from "$lib/stores/transactions.store"
  import { paychecksStore } from "$lib/stores/paychecks.store"
  import { budgetStore } from "$lib/stores/budget.store"
  import {
    computeSavingsRate,
    computeDebtToIncome,
    computeEmergencyFund,
    computeBudgetAdherence,
  } from "$lib/utils/health"
  import type { BudgetCategory } from "$lib/types"
  import type { HealthStatus } from "$lib/utils/health"

  let categories: BudgetCategory[] = []
  const unsubscribeCategories = budgetStore.categories.subscribe(incoming => {
    categories = incoming
  })
  onDestroy(unsubscribeCategories)

  const referenceDate = new Date()

  $: metrics = [
    computeSavingsRate($paychecksStore, $transactionsStore, referenceDate),
    computeDebtToIncome($accountsStore, $paychecksStore),
    computeEmergencyFund($accountsStore, $transactionsStore, referenceDate),
    computeBudgetAdherence($transactionsStore, categories, referenceDate),
  ]

  const statusColors: Record<HealthStatus, { dot: string; text: string; border: string }> = {
    green: { dot: "bg-emerald-400", text: "text-emerald-400", border: "border-emerald-500/30" },
    yellow: { dot: "bg-amber-400", text: "text-amber-400", border: "border-amber-500/30" },
    red: { dot: "bg-rose-400", text: "text-rose-400", border: "border-rose-500/30" },
  }

  let expandedIndex: number | null = null

  function toggleExpand(index: number) {
    expandedIndex = expandedIndex === index ? null : index
  }

  function handleKeydown(event: KeyboardEvent, index: number) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      toggleExpand(index)
    }
  }
</script>

<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
  {#each metrics as metric, i}
    {@const colors = statusColors[metric.status]}
    {@const isExpanded = expandedIndex === i}
    <div
      class="bg-gray-800 border {colors.border} rounded-xl overflow-hidden cursor-pointer select-none
             transition-colors hover:border-gray-600"
      role="button"
      tabindex="0"
      aria-expanded={isExpanded}
      on:click={() => toggleExpand(i)}
      on:keydown={event => handleKeydown(event, i)}
    >
      <!-- Summary -->
      <div class="p-5 flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-gray-400 uppercase tracking-wider">{metric.label}</span>
          <span class="w-2 h-2 rounded-full {colors.dot}"></span>
        </div>
        <span class="text-2xl font-semibold text-gray-100 leading-none">{metric.value}</span>
        <div class="flex items-center justify-between gap-2">
          <span class="text-xs {colors.text}">{metric.detail}</span>
          <!-- Chevron -->
          <svg
            class="w-3.5 h-3.5 shrink-0 text-gray-500 transition-transform duration-200 {isExpanded
              ? 'rotate-180'
              : ''}"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      <!-- Breakdown -->
      {#if isExpanded}
        <div transition:slide={{ duration: 180 }} class="border-t border-gray-700 px-5 pb-5 pt-4 space-y-1.5">
          {#each metric.breakdown as line}
            <div
              class="flex justify-between gap-4 text-xs
                     {line.isResult ? 'mt-2 pt-2 border-t border-gray-700' : ''}"
            >
              <span class="{line.isResult ? 'text-gray-200 font-medium' : 'text-gray-500'} min-w-0 truncate">
                {line.label}
              </span>
              <span
                class="shrink-0 tabular-nums
                       {line.alert ? 'text-rose-400' : line.isResult ? 'text-gray-100 font-semibold' : 'text-gray-300'}"
              >
                {line.value}
              </span>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/each}
</div>
