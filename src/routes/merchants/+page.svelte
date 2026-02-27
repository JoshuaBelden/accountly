<script lang="ts">
  import MerchantCard from "$lib/components/merchants/MerchantCard.svelte"
  import MerchantForm from "$lib/components/merchants/MerchantForm.svelte"
  import EmptyState from "$lib/components/shared/EmptyState.svelte"
  import Modal from "$lib/components/shared/Modal.svelte"
  import { budgetStore } from "$lib/stores/budget.store"
  import { merchantsStore } from "$lib/stores/merchants.store"
  import { transactionsStore } from "$lib/stores/transactions.store"
  import type { BudgetCategory, Merchant } from "$lib/types"
  import { get } from "svelte/store"

  let filterQuery = ""
  let modalOpen = false
  let editMerchant: Merchant | null = null
  let reapplyResult: string | null = null

  let categories: BudgetCategory[] = []
  budgetStore.categories.subscribe(c => (categories = c))

  function openAdd() {
    editMerchant = null
    modalOpen = true
  }

  function openEdit(event: CustomEvent<Merchant>) {
    editMerchant = event.detail
    modalOpen = true
  }

  function closeModal() {
    modalOpen = false
    editMerchant = null
  }

  function handleDelete(event: CustomEvent<Merchant>) {
    merchantsStore.remove(event.detail.id)
  }

  function getCategoryName(categoryId?: string, subcategoryId?: string): string {
    if (!categoryId) return ""
    const cat = categories.find(c => c.id === categoryId)
    if (!cat) return ""
    if (subcategoryId) {
      const sub = cat.subcategories.find(s => s.id === subcategoryId)
      return sub ? `${cat.name} › ${sub.name}` : cat.name
    }
    return cat.name
  }

  /** Re-applies all merchant regex patterns to existing transactions that lack a bill or paycheck link. */
  function updateTransactions() {
    const transactions = get(transactionsStore)
    const merchants = get(merchantsStore)
    let updated = 0
    for (const transaction of transactions) {
      for (const merchant of merchants) {
        try {
          if (new RegExp(merchant.hints, "i").test(transaction.description)) {
            transactionsStore.update(transaction.id, {
              name: merchant.name,
              merchantId: merchant.id,
              categoryId: merchant.categoryId,
              subcategoryId: merchant.subcategoryId,
            })
            updated++
            break
          }
        } catch {
          // invalid regex — skip
        }
      }
    }
    reapplyResult =
      updated === 0
        ? "No transactions matched."
        : `Updated ${updated} transaction${updated === 1 ? "" : "s"}.`
    setTimeout(() => (reapplyResult = null), 4000)
  }

  $: sortedMerchants = [...$merchantsStore].sort((a, b) => a.name.localeCompare(b.name))

  $: visibleMerchants = filterQuery
    ? sortedMerchants.filter(m => m.name.toLowerCase().includes(filterQuery.toLowerCase()))
    : sortedMerchants
</script>

<div class="max-w-4xl mx-auto space-y-6">
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-bold text-gray-100">Merchants</h1>
    <div class="flex items-center gap-3">
      {#if reapplyResult}
        <span class="text-sm text-emerald-400">{reapplyResult}</span>
      {/if}
      {#if $merchantsStore.length > 0}
        <button class="btn-secondary" on:click={updateTransactions}>Update Transactions</button>
      {/if}
      <button class="btn-primary" on:click={openAdd}>
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add Merchant
      </button>
    </div>
  </div>

  {#if $merchantsStore.length === 0}
    <EmptyState
      title="No merchants yet"
      description="Add merchants to auto-name and categorize imported transactions by their description pattern."
      actionLabel="Add Merchant"
      on:action={openAdd}
    />
  {:else}
    <div class="relative">
      <svg
        class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
        />
      </svg>
      <input
        bind:value={filterQuery}
        type="text"
        placeholder="Filter merchants…"
        class="w-full pl-9 pr-9 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      {#if filterQuery}
        <button
          on:click={() => (filterQuery = "")}
          class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
          aria-label="Clear filter"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      {/if}
    </div>

    {#if visibleMerchants.length === 0}
      <p class="text-sm text-gray-500 text-center py-8">No merchants match "{filterQuery}"</p>
    {:else}
      <div class="space-y-3">
        {#each visibleMerchants as merchant (merchant.id)}
          <MerchantCard
            {merchant}
            categoryName={getCategoryName(merchant.categoryId, merchant.subcategoryId)}
            on:edit={openEdit}
            on:delete={handleDelete}
          />
        {/each}
      </div>
    {/if}
  {/if}
</div>

<Modal open={modalOpen} title={editMerchant ? "Edit Merchant" : "Add Merchant"} on:close={closeModal}>
  <MerchantForm {editMerchant} on:save={closeModal} on:cancel={closeModal} />
</Modal>
