<script lang="ts">
  import { createEventDispatcher } from "svelte"
  import { formatCurrency } from "$lib/utils/currency"
  import type { BudgetCategory, Transaction, TransactionSplit } from "$lib/types"

  export let transaction: Transaction
  export let categories: BudgetCategory[]

  const dispatch = createEventDispatcher<{
    save: TransactionSplit[]
    exitSplit: { categoryId: string | undefined; subcategoryId: string | undefined }
  }>()

  /** A working draft row with a stable key for Svelte keyed iteration. */
  interface DraftSplit {
    id: string
    categoryId: string
    subcategoryId: string | undefined
    amount: number
  }

  function newId(): string {
    return Math.random().toString(36).slice(2)
  }

  function initDrafts(): DraftSplit[] {
    if (transaction.splits && transaction.splits.length >= 2) {
      return transaction.splits.map(split => ({
        id: newId(),
        categoryId: split.categoryId,
        subcategoryId: split.subcategoryId,
        amount: split.amount,
      }))
    }
    const half = Math.round((transaction.amount / 2) * 100) / 100
    const other = Math.round((transaction.amount - half) * 100) / 100
    return [
      { id: newId(), categoryId: "", subcategoryId: undefined, amount: half },
      { id: newId(), categoryId: "", subcategoryId: undefined, amount: other },
    ]
  }

  let draftSplits: DraftSplit[] = initDrafts()
  let savedRecently = false

  $: totalAllocated = Math.round(draftSplits.reduce((sum, split) => sum + (split.amount || 0), 0) * 100) / 100
  $: totalExpected = Math.round(transaction.amount * 100) / 100
  $: remaining = Math.round((totalExpected - totalAllocated) * 100) / 100
  $: isValid = remaining === 0

  function getSubcategories(categoryId: string) {
    const cat = categories.find(c => c.id === categoryId)
    return cat?.subcategories ?? []
  }

  function onCategoryChange(index: number, categoryId: string) {
    draftSplits = draftSplits.map((split, i) =>
      i === index ? { ...split, categoryId, subcategoryId: undefined } : split,
    )
  }

  function onSubcategoryChange(index: number, subcategoryId: string) {
    draftSplits = draftSplits.map((split, i) =>
      i === index ? { ...split, subcategoryId: subcategoryId || undefined } : split,
    )
  }

  function onAmountChange(index: number, rawValue: string) {
    const parsed = parseFloat(rawValue)
    const amount = isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100
    draftSplits = draftSplits.map((split, i) => (i === index ? { ...split, amount } : split))
  }

  function addSplit() {
    draftSplits = [...draftSplits, { id: newId(), categoryId: "", subcategoryId: undefined, amount: 0 }]
  }

  function removeSplit(index: number) {
    const next = draftSplits.filter((_, i) => i !== index)
    if (next.length === 1) {
      dispatch("exitSplit", {
        categoryId: next[0].categoryId || undefined,
        subcategoryId: next[0].subcategoryId,
      })
      return
    }
    draftSplits = next
  }

  function saveSplits() {
    if (!isValid) return
    dispatch(
      "save",
      draftSplits.map(split => ({
        categoryId: split.categoryId,
        subcategoryId: split.subcategoryId,
        amount: split.amount,
      })),
    )
    savedRecently = true
    setTimeout(() => (savedRecently = false), 1500)
  }
</script>

<div class="space-y-2">
  <div class="space-y-1.5">
    {#each draftSplits as split, index (split.id)}
      {@const subcategories = getSubcategories(split.categoryId)}
      <div class="flex items-center gap-2">
        <!-- Categories -->
        <div class="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          <select
            value={split.categoryId}
            on:change={e => onCategoryChange(index, e.currentTarget.value)}
            class="text-sm bg-gray-700 border border-gray-600 text-gray-200 rounded px-2 py-1 focus:outline-none focus:border-indigo-500"
          >
            <option value="">— Unassigned —</option>
            {#each categories as cat}
              <option value={cat.id}>{cat.name}</option>
            {/each}
          </select>

          {#if subcategories.length > 0}
            <select
              value={split.subcategoryId ?? ""}
              on:change={e => onSubcategoryChange(index, e.currentTarget.value)}
              class="text-sm bg-gray-700 border border-gray-600 text-gray-200 rounded px-2 py-1 focus:outline-none focus:border-indigo-500"
            >
              <option value="">— No subcategory —</option>
              {#each [...subcategories].sort((a, b) => a.name.localeCompare(b.name)) as sub}
                <option value={sub.id}>{sub.name}</option>
              {/each}
            </select>
          {/if}
        </div>

        <!-- Amount -->
        <div class="flex items-center gap-1 flex-shrink-0">
          <span class="text-gray-400 text-sm">$</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={split.amount}
            on:change={e => onAmountChange(index, e.currentTarget.value)}
            class="text-sm bg-gray-700 border border-gray-600 text-gray-200 rounded px-2 py-1 w-24 text-right focus:outline-none focus:border-indigo-500 tabular-nums"
          />
        </div>

        <!-- Delete -->
        <button
          on:click={() => removeSplit(index)}
          class="p-1 text-gray-500 hover:text-red-400 transition-colors flex-shrink-0"
          aria-label="Remove split"
          title="Remove this split"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    {/each}
  </div>

  <!-- Allocation status: right-aligned under the amount column -->
  <div class="text-xs tabular-nums text-right pr-6 {isValid ? 'text-gray-500' : remaining > 0 ? 'text-amber-400' : 'text-red-400'}">
    {formatCurrency(totalAllocated)} of {formatCurrency(totalExpected)}
    {#if !isValid}
      · {remaining > 0 ? formatCurrency(remaining) + " remaining" : formatCurrency(Math.abs(remaining)) + " over"}
    {/if}
  </div>

  <!-- Footer -->
  <div class="flex items-center justify-end gap-3 pt-0.5">
    <button
      on:click={addSplit}
      class="text-xs text-indigo-400 hover:text-indigo-200 transition-colors flex items-center gap-1"
    >
      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      Add split
    </button>

    <button
      on:click={saveSplits}
      disabled={!isValid}
      class="text-xs px-2.5 py-1 rounded font-medium transition-colors
        {savedRecently
        ? 'bg-emerald-700 text-emerald-100'
        : isValid
        ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
        : 'bg-gray-700 text-gray-500 cursor-not-allowed'}"
    >
      {#if savedRecently}
        <span class="flex items-center gap-1">
          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Saved
        </span>
      {:else}
        Save splits
      {/if}
    </button>
  </div>
</div>
