<script lang="ts">
  import { budgetStore } from "$lib/stores/budget.store"
  import { merchantsStore } from "$lib/stores/merchants.store"
  import type { BudgetCategory, Merchant } from "$lib/types"
  import { createEventDispatcher } from "svelte"

  export let editMerchant: Merchant | null = null

  const dispatch = createEventDispatcher()

  let name = editMerchant?.name ?? ""
  let hints = editMerchant?.hints ?? ""
  let categoryId = editMerchant?.categoryId ?? ""
  let subcategoryId = editMerchant?.subcategoryId ?? ""
  let notes = editMerchant?.notes ?? ""

  function now() {
    return new Date().toISOString()
  }

  let budgetCategories: BudgetCategory[] = []
  budgetStore.categories.subscribe(
    (c: BudgetCategory[]) => (budgetCategories = c.slice().sort((a, b) => a.name.localeCompare(b.name))),
  )

  $: subcategories = (budgetCategories.find(c => c.id === categoryId)?.subcategories ?? [])
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))

  $: hintsValid = (() => {
    if (!hints) return true
    try {
      new RegExp(hints, "i")
      return true
    } catch {
      return false
    }
  })()

  function submit() {
    const merchant: Merchant = {
      id: editMerchant?.id ?? crypto.randomUUID(),
      name,
      hints,
      categoryId: categoryId || undefined,
      subcategoryId: subcategoryId || undefined,
      notes: notes || undefined,
      createdAt: editMerchant?.createdAt ?? now(),
      updatedAt: now(),
    }
    if (editMerchant) {
      merchantsStore.update(editMerchant.id, merchant)
    } else {
      merchantsStore.add(merchant)
    }
    dispatch("save", merchant)
  }
</script>

<form on:submit|preventDefault={submit} class="space-y-4">
  <div>
    <label class="label" for="merchant-name">Merchant Name</label>
    <input id="merchant-name" class="input" type="text" bind:value={name} required placeholder="e.g. Fred Meyer" />
  </div>

  <div>
    <label class="label" for="merchant-hints">Import Match Pattern</label>
    <input
      id="merchant-hints"
      class="input font-mono text-sm"
      type="text"
      bind:value={hints}
      required
      placeholder="e.g. FREDMEYER|fred.meyer"
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
      <label class="label" for="merchant-category">Budget Category (optional)</label>
      <select id="merchant-category" class="input" bind:value={categoryId} on:change={() => (subcategoryId = "")}>
        <option value="">None</option>
        {#each budgetCategories as cat}
          <option value={cat.id}>{cat.name}</option>
        {/each}
      </select>
    </div>
    {#if subcategories.length > 0}
      <div>
        <label class="label" for="merchant-subcategory">Subcategory (optional)</label>
        <select id="merchant-subcategory" class="input" bind:value={subcategoryId}>
          <option value="">None</option>
          {#each subcategories as sub}
            <option value={sub.id}>{sub.name}</option>
          {/each}
        </select>
      </div>
    {/if}
  </div>

  <div>
    <label class="label" for="merchant-notes">Notes (optional)</label>
    <textarea id="merchant-notes" class="input" rows="2" bind:value={notes}></textarea>
  </div>

  <div class="flex justify-end gap-3 pt-2">
    <button type="button" class="btn-secondary" on:click={() => dispatch("cancel")}>Cancel</button>
    <button type="submit" class="btn-primary" disabled={!hintsValid}>
      {editMerchant ? "Update" : "Add"} Merchant
    </button>
  </div>
</form>
