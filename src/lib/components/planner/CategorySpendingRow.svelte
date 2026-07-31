<script lang="ts">
  import BudgetVsActualBar from "$lib/components/budget/BudgetVsActualBar.svelte"
  import { formatCurrency } from "$lib/utils/currency"
  import type { CategorySpendingGroup } from "$lib/utils/planner"

  export let group: CategorySpendingGroup
  export let month: string

  let expanded = false

  function toggle() {
    expanded = !expanded
  }
</script>

<div class="space-y-1">
  <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
  <div class="flex items-center justify-between text-sm cursor-pointer" on:click={toggle}>
    <div class="flex items-center gap-2 min-w-0">
      {#if group.subcategories.length > 0}
        <svg
          class="w-3.5 h-3.5 text-gray-500 transition-transform flex-shrink-0 {expanded ? 'rotate-90' : ''}"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      {:else}
        <span class="w-3.5 flex-shrink-0"></span>
      {/if}
      <a
        href="/transactions?categoryId={group.categoryId}&month={month}"
        on:click|stopPropagation
        class="text-gray-300 hover:text-indigo-300 transition-colors truncate">{group.label}</a
      >
    </div>
    <div class="flex gap-2 tabular-nums flex-shrink-0">
      <span class={group.cleared > group.budgeted ? "text-red-400" : "text-gray-300"}>{formatCurrency(group.cleared)}</span>
      <span class="text-gray-600">/</span>
      <span class="text-gray-500">{formatCurrency(group.budgeted)}</span>
    </div>
  </div>
  <div class="pl-5">
    <BudgetVsActualBar budget={group.budgeted} actual={group.cleared} />
  </div>

  {#if expanded && group.subcategories.length > 0}
    <div class="pl-5 ml-1.5 border-l border-gray-700 space-y-2 pt-1">
      {#each group.subcategories as sub (sub.subcategoryId)}
        <div class="space-y-1">
          <div class="flex items-center justify-between text-sm">
            <a
              href="/transactions?categoryId={sub.categoryId}&subcategoryId={sub.subcategoryId}&month={month}"
              class="text-gray-400 hover:text-indigo-300 transition-colors truncate mr-2">{sub.label}</a
            >
            <div class="flex gap-2 tabular-nums flex-shrink-0">
              <span class={sub.cleared > sub.budgeted ? "text-red-400" : "text-gray-300"}>{formatCurrency(sub.cleared)}</span>
              <span class="text-gray-600">/</span>
              <span class="text-gray-500">{formatCurrency(sub.budgeted)}</span>
            </div>
          </div>
          <BudgetVsActualBar budget={sub.budgeted} actual={sub.cleared} />
        </div>
      {/each}
    </div>
  {/if}
</div>
