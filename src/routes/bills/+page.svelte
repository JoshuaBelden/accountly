<script lang="ts">
  import BillCard from "$lib/components/bills/BillCard.svelte"
  import BillForm from "$lib/components/bills/BillForm.svelte"
  import EmptyState from "$lib/components/shared/EmptyState.svelte"
  import Modal from "$lib/components/shared/Modal.svelte"
  import { accountsStore } from "$lib/stores/accounts.store"
  import { billsStore } from "$lib/stores/bills.store"
  import { budgetStore } from "$lib/stores/budget.store"
  import { plannerStore } from "$lib/stores/planner.store"
  import { transactionsStore } from "$lib/stores/transactions.store"
  import type { Bill, BudgetCategory } from "$lib/types"
  import { formatCurrency } from "$lib/utils/currency"
  import { get } from "svelte/store"
  import { page } from "$app/stores"
  import { onMount } from "svelte"

  let filterQuery = ""

  onMount(() => {
    filterQuery = $page.url.searchParams.get("q") ?? ""
  })

  let modalOpen = false
  let editBill: Bill | null = null
  let categories: BudgetCategory[] = []
  budgetStore.categories.subscribe(c => (categories = c))

  function openAdd() {
    editBill = null
    modalOpen = true
  }

  function openEdit(e: CustomEvent<Bill>) {
    editBill = e.detail
    modalOpen = true
  }

  function closeModal() {
    modalOpen = false
    editBill = null
  }

  function handleDelete(e: CustomEvent<Bill>) {
    billsStore.remove(e.detail.id)
  }

  function getAccountName(id?: string) {
    if (!id) return ""
    return $accountsStore.find(a => a.id === id)?.name ?? ""
  }

  function getCategoryName(id?: string) {
    if (!id) return ""
    return categories.find(c => c.id === id)?.name ?? ""
  }

  let reapplyResult: string | null = null

  function reapplyHints() {
    const txs = get(transactionsStore)
    const bills = get(billsStore)
    let updated = 0
    for (const tx of txs) {
      if (tx.billId || !tx.description) continue
      for (const bill of bills) {
        if (!bill.hints) continue
        try {
          if (new RegExp(bill.hints, "i").test(tx.description)) {
            plannerStore.clearTransactionLink(tx.id)
            const month = tx.date.substring(0, 7)
            const assignments = plannerStore.getForMonth(month)
            const assignment = assignments.find(a => a.billId === bill.id)
            if (assignment) plannerStore.linkTransaction(assignment.id, tx.id)
            transactionsStore.update(tx.id, {
              billId: bill.id,
              type: "bill_payment",
              plannerMonth: month,
            })
            updated++
            break
          }
        } catch {
          /* invalid regex — skip */
        }
      }
    }
    reapplyResult =
      updated === 0
        ? "No unassigned transactions matched."
        : `Updated ${updated} transaction${updated === 1 ? "" : "s"}.`
    setTimeout(() => (reapplyResult = null), 4000)
  }

  $: monthlyTotal = $billsStore.filter(b => b.frequency === "monthly").reduce((s, b) => s + b.amount, 0)

  $: sortedBills = [...$billsStore].sort(
    (a, b) =>
      ["monthly", "biweekly", "weekly", "bimonthly", "quarterly", "annually"].indexOf(a.frequency) -
        ["monthly", "biweekly", "weekly", "bimonthly", "quarterly", "annually"].indexOf(b.frequency) ||
      a.name.localeCompare(b.name),
  )

  $: visibleBills = filterQuery
    ? sortedBills.filter(b => b.name.toLowerCase().includes(filterQuery.toLowerCase()))
    : sortedBills
</script>

<div class="max-w-4xl mx-auto space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-100">Bills</h1>
      {#if $billsStore.length > 0}
        <p class="text-sm text-gray-400 mt-0.5">Monthly total: {formatCurrency(monthlyTotal)}</p>
      {/if}
    </div>
    <div class="flex items-center gap-3">
      <a href="/tools/subscriptions" class="btn-secondary text-sm">Subscription Tracker</a>
      {#if reapplyResult}
        <span class="text-sm text-emerald-400">{reapplyResult}</span>
      {/if}
      {#if $billsStore.some(b => b.hints)}
        <button class="btn-secondary" on:click={reapplyHints} title="Apply bill hints to unassigned transactions">
          Update Transactions
        </button>
      {/if}
      <button class="btn-primary" on:click={openAdd}>
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add Bill
      </button>
    </div>
  </div>

  {#if $billsStore.length === 0}
    <EmptyState
      title="No bills yet"
      description="Add your recurring bills — rent, utilities, subscriptions — to track them in the Monthly Planner."
      actionLabel="Add Bill"
      on:action={openAdd}
    />
  {:else}
    <!-- Filter -->
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
        placeholder="Filter bills…"
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

    {#if visibleBills.length === 0}
      <p class="text-sm text-gray-500 text-center py-8">No bills match "{filterQuery}"</p>
    {:else}
      <div class="space-y-3">
        {#each visibleBills as bill (bill.id)}
          <BillCard
            {bill}
            accountName={getAccountName(bill.accountId)}
            categoryName={getCategoryName(bill.categoryId)}
            on:edit={openEdit}
            on:delete={handleDelete}
          />
        {/each}
      </div>
    {/if}
  {/if}
</div>

<Modal open={modalOpen} title={editBill ? "Edit Bill" : "Add Bill"} on:close={closeModal}>
  <BillForm {editBill} on:save={closeModal} on:cancel={closeModal} />
</Modal>
