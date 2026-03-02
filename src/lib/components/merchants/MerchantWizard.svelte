<script lang="ts">
  import { budgetStore } from "$lib/stores/budget.store"
  import { merchantsStore } from "$lib/stores/merchants.store"
  import { transactionsStore } from "$lib/stores/transactions.store"
  import type { BudgetCategory } from "$lib/types"
  import { createEventDispatcher } from "svelte"
  import { get } from "svelte/store"

  /** A unique transaction description and how many transactions share it. */
  interface UnmatchedGroup {
    description: string
    count: number
  }

  const dispatch = createEventDispatcher()

  /** Collects all unmatched transaction descriptions grouped and sorted by frequency. */
  function collectUnmatched(): UnmatchedGroup[] {
    const transactions = get(transactionsStore)
    const countMap = new Map<string, number>()
    for (const transaction of transactions) {
      if (!transaction.merchantId && !transaction.billId && !transaction.paycheckId) {
        countMap.set(transaction.description, (countMap.get(transaction.description) ?? 0) + 1)
      }
    }
    return [...countMap.entries()]
      .map(([description, count]) => ({ description, count }))
      .sort((a, b) => b.count - a.count)
  }

  const groups = collectUnmatched()

  let currentIndex = 0
  let name = ""
  let hints = ""
  let categoryId = ""
  let subcategoryId = ""

  let budgetCategories: BudgetCategory[] = []
  budgetStore.categories.subscribe(c => (budgetCategories = c.slice().sort((a, b) => a.name.localeCompare(b.name))))

  $: subcategories = (budgetCategories.find(c => c.id === categoryId)?.subcategories ?? [])
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))

  $: current = groups[currentIndex]

  $: hintsValid = (() => {
    if (!hints) return true
    try {
      new RegExp(hints, "i")
      return true
    } catch {
      return false
    }
  })()

  /** Escapes a raw string for use as a regex literal. */
  function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  }

  function loadGroup(index: number) {
    name = ""
    hints = escapeRegex(groups[index].description)
    categoryId = ""
    subcategoryId = ""
  }

  loadGroup(0)

  function advance() {
    const next = currentIndex + 1
    if (next >= groups.length) {
      dispatch("done")
    } else {
      currentIndex = next
      loadGroup(next)
    }
  }

  function skip() {
    advance()
  }

  function save() {
    merchantsStore.add({
      id: crypto.randomUUID(),
      name,
      hints,
      categoryId: categoryId || undefined,
      subcategoryId: subcategoryId || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    advance()
  }
</script>

{#if groups.length === 0}
  <div class="text-center py-12 text-gray-400">
    <p class="text-lg font-medium text-gray-200 mb-1">All transactions are matched</p>
    <p class="text-sm">No unmatched transactions found.</p>
    <button class="btn-secondary mt-6" on:click={() => dispatch("done")}>Back to Merchants</button>
  </div>
{:else}
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-100">Match Unmatched Transactions</h2>
        <p class="text-sm text-gray-400 mt-0.5">
          {currentIndex + 1} of {groups.length} unique description{groups.length === 1 ? "" : "s"}
        </p>
      </div>
      <button type="button" class="btn-secondary" on:click={() => dispatch("done")}>Finish &amp; Apply</button>
    </div>

    <div class="w-full bg-gray-800 rounded-full h-1.5">
      <div
        class="bg-indigo-500 h-1.5 rounded-full transition-all"
        style="width: {(currentIndex / groups.length) * 100}%"
      ></div>
    </div>

    <div class="bg-gray-800 border border-gray-700 rounded-lg p-4">
      <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">Transaction Description</p>
      <p class="font-mono text-sm text-gray-100 break-all">{current.description}</p>
      <p class="text-xs text-gray-500 mt-2">
        {current.count} transaction{current.count === 1 ? "" : "s"} with this description
      </p>
    </div>

    <form on:submit|preventDefault={save} class="space-y-4">
      <div>
        <label class="label" for="wizard-name">Merchant Name</label>
        <input
          id="wizard-name"
          class="input"
          type="text"
          bind:value={name}
          required
          placeholder="e.g. Fred Meyer"
        />
      </div>

      <div>
        <label class="label" for="wizard-hints">Import Match Pattern</label>
        <input
          id="wizard-hints"
          class="input font-mono text-sm"
          type="text"
          bind:value={hints}
          required
          placeholder="e.g. FREDMEYER|fred\.meyer"
        />
        {#if !hintsValid}
          <p class="mt-1 text-xs text-red-400">Invalid regular expression.</p>
        {:else}
          <p class="mt-1 text-xs text-gray-500">
            Regex matched against imported transaction descriptions (case-insensitive).
          </p>
        {/if}
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="label" for="wizard-category">Budget Category (optional)</label>
          <select
            id="wizard-category"
            class="input"
            bind:value={categoryId}
            on:change={() => (subcategoryId = "")}
          >
            <option value="">None</option>
            {#each budgetCategories as cat}
              <option value={cat.id}>{cat.name}</option>
            {/each}
          </select>
        </div>
        {#if subcategories.length > 0}
          <div>
            <label class="label" for="wizard-subcategory">Subcategory (optional)</label>
            <select id="wizard-subcategory" class="input" bind:value={subcategoryId}>
              <option value="">None</option>
              {#each subcategories as sub}
                <option value={sub.id}>{sub.name}</option>
              {/each}
            </select>
          </div>
        {/if}
      </div>

      <div class="flex justify-end gap-3 pt-2">
        <button type="button" class="btn-secondary" on:click={skip}>Skip</button>
        <button type="submit" class="btn-primary" disabled={!name || !hintsValid}>Create Merchant</button>
      </div>
    </form>
  </div>
{/if}
