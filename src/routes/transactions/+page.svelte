<script lang="ts">
  import { page } from "$app/stores"
  import EmptyState from "$lib/components/shared/EmptyState.svelte"
  import HoldToDelete from "$lib/components/shared/HoldToDelete.svelte"
  import Modal from "$lib/components/shared/Modal.svelte"
  import ImportTransactionsModal from "$lib/components/transactions/ImportTransactionsModal.svelte"
  import TransactionForm from "$lib/components/transactions/TransactionForm.svelte"
  import TransactionSplitEditor from "$lib/components/transactions/TransactionSplitEditor.svelte"
  import { checkingAccounts, savingsAccounts } from "$lib/stores/accounts.store"
  import { billsStore } from "$lib/stores/bills.store"
  import { budgetStore } from "$lib/stores/budget.store"
  import { paychecksStore } from "$lib/stores/paychecks.store"
  import { plannerStore } from "$lib/stores/planner.store"
  import { transactionsStore } from "$lib/stores/transactions.store"
  import type { BudgetCategory, Transaction } from "$lib/types"
  import { formatCurrency } from "$lib/utils/currency"
  import { formatDateShort } from "$lib/utils/date"
  import { onMount } from "svelte"

  let pageSize = 20

  let addTxOpen = false
  let importOpen = false

  // All checking + savings accounts for sub-nav (checking first)
  $: transactionAccounts = [...$checkingAccounts, ...$savingsAccounts]

  // Default to first checking account, then first savings
  let selectedAccountId = ""
  $: if (!selectedAccountId && $checkingAccounts.length > 0) {
    selectedAccountId = $checkingAccounts[0].id
  } else if (!selectedAccountId && $savingsAccounts.length > 0) {
    selectedAccountId = $savingsAccounts[0].id
  }

  $: selectedAccount = transactionAccounts.find(a => a.id === selectedAccountId)

  // Cleared transactions for selected account, newest first by date then createdAt
  $: accountTransactions = $transactionsStore
    .filter(t => t.accountId === selectedAccountId && t.clearedStatus === "cleared")
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))

  // Category / uncategorized filter from URL params
  $: filterCategoryId = $page.url.searchParams.get("categoryId") || null
  $: filterSubcategoryId = $page.url.searchParams.get("subcategoryId") || null
  $: filterMonth = $page.url.searchParams.get("month") || null
  $: filterUncategorized = $page.url.searchParams.get("uncategorized") === "true"
  $: isCategoryFilter = !!filterCategoryId || filterUncategorized

  $: filteredTransactions = (() => {
    let txs = $transactionsStore.filter(t => t.clearedStatus === "cleared")
    if (filterMonth) {
      txs = txs.filter(t => t.plannerMonth === filterMonth || t.date.startsWith(filterMonth))
    }
    if (filterUncategorized) {
      txs = txs.filter(t => t.type !== "income" && !t.categoryId && (!t.splits || t.splits.length === 0))
    } else if (filterCategoryId) {
      txs = txs.filter(t => {
        if (t.splits?.length) {
          return t.splits.some(
            s => s.categoryId === filterCategoryId && (!filterSubcategoryId || s.subcategoryId === filterSubcategoryId),
          )
        }
        return t.categoryId === filterCategoryId && (!filterSubcategoryId || t.subcategoryId === filterSubcategoryId)
      })
    }
    return txs.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
  })()

  $: activeTransactions = isCategoryFilter ? filteredTransactions : accountTransactions

  // Reset page + selection when filter changes
  $: filterKey = `${filterCategoryId}|${filterSubcategoryId}|${filterUncategorized}|${filterMonth}`
  let prevFilterKey = ""
  $: if (filterKey !== prevFilterKey) {
    prevFilterKey = filterKey
    currentPage = 1
    selectedIds = new Set()
  }

  $: filterLabel = (() => {
    if (filterUncategorized) return "Uncategorized transactions"
    if (filterCategoryId) {
      const cat = budgetCategories.find(c => c.id === filterCategoryId)
      if (!cat) return "Category"
      if (filterSubcategoryId) {
        const sub = cat.subcategories.find(s => s.id === filterSubcategoryId)
        return sub ? `${cat.name} › ${sub.name}` : cat.name
      }
      return cat.name
    }
    return ""
  })()

  // Pagination
  let currentPage = 1
  $: totalPages = Math.max(1, Math.ceil(searchFiltered.length / pageSize))
  $: if (currentPage > totalPages) currentPage = 1

  // Reset page + selection when switching accounts
  let prevAccountId = ""
  $: if (selectedAccountId !== prevAccountId) {
    prevAccountId = selectedAccountId
    currentPage = 1
    selectedIds = new Set()
  }

  $: pageStart = (currentPage - 1) * pageSize
  $: pagedTransactions = searchFiltered.slice(pageStart, pageStart + pageSize)

  // Selection
  let selectedIds: Set<string> = new Set()

  $: allOnPageSelected = pagedTransactions.length > 0 && pagedTransactions.every(t => selectedIds.has(t.id))

  function toggleSelectAll() {
    if (allOnPageSelected) {
      const next = new Set(selectedIds)
      pagedTransactions.forEach(t => next.delete(t.id))
      selectedIds = next
    } else {
      const next = new Set(selectedIds)
      pagedTransactions.forEach(t => next.add(t.id))
      selectedIds = next
    }
  }

  function toggleRow(id: string) {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    selectedIds = next
  }

  function deleteSelected() {
    transactionsStore.removeMany([...selectedIds])
    selectedIds = new Set()
  }

  // Budget categories for display
  let budgetCategories: BudgetCategory[] = []
  budgetStore.categories.subscribe(c => (budgetCategories = c))

  $: sortedPaychecks = [...$paychecksStore].sort((a, b) => a.name.localeCompare(b.name))
  $: sortedBills = [...$billsStore].sort((a, b) => a.name.localeCompare(b.name))
  $: sortedBudgetCategories = [...budgetCategories].sort((a, b) => a.name.localeCompare(b.name))

  function getCategoryLabel(categoryId?: string, subcategoryId?: string): string {
    if (!categoryId) return ""
    const cat = budgetCategories.find(c => c.id === categoryId)
    if (!cat) return ""
    if (subcategoryId) {
      const sub = cat.subcategories.find(s => s.id === subcategoryId)
      return sub ? `${cat.name} › ${sub.name}` : cat.name
    }
    return cat.name
  }

  function initSplit(transaction: Transaction) {
    const half = Math.round((transaction.amount / 2) * 100) / 100
    const other = Math.round((transaction.amount - half) * 100) / 100
    transactionsStore.update(transaction.id, {
      splits: [
        { categoryId: transaction.categoryId ?? "", subcategoryId: transaction.subcategoryId, amount: half },
        { categoryId: "", subcategoryId: undefined, amount: other },
      ],
      categoryId: undefined,
      subcategoryId: undefined,
    })
  }

  function linkBill(txId: string, txDate: string, billId: string | undefined) {
    // Remove any existing planner link for this transaction
    plannerStore.clearTransactionLink(txId)

    if (billId) {
      const month = txDate.substring(0, 7)
      const assignments = plannerStore.getForMonth(month)
      const assignment = assignments.find(a => a.billId === billId)
      if (assignment) plannerStore.linkTransaction(assignment.id, txId)
      transactionsStore.update(txId, {
        billId,
        paycheckId: undefined,
        type: "bill_payment",
        plannerMonth: month,
      })
    } else {
      transactionsStore.update(txId, { billId: undefined, type: "expense" })
    }
  }

  function linkPaycheck(txId: string, paycheckId: string | undefined) {
    if (paycheckId) {
      plannerStore.clearTransactionLink(txId)
      transactionsStore.update(txId, { paycheckId, billId: undefined, type: "income" })
    } else {
      transactionsStore.update(txId, { paycheckId: undefined, type: "expense" })
    }
  }

  const typeColors: Record<string, string> = {
    expense: "text-red-400 bg-red-950/30 border-red-800/50",
    income: "text-emerald-400 bg-emerald-950/30 border-emerald-800/50",
    transfer: "text-blue-400 bg-blue-950/30 border-blue-800/50",
    bill_payment: "text-orange-400 bg-orange-950/30 border-orange-800/50",
  }

  const typeLabels: Record<string, string> = {
    expense: "Expense",
    income: "Income",
    transfer: "Transfer",
    bill_payment: "Bill",
  }

  let selectionMode = false
  function toggleSelectionMode() {
    selectionMode = !selectionMode
    if (!selectionMode) selectedIds = new Set()
  }

  let expandedId: string | null = null
  function toggleExpand(id: string) {
    expandedId = expandedId === id ? null : id
  }

  let searchQuery = ""

  onMount(() => {
    searchQuery = $page.url.searchParams.get("q") ?? ""
  })

  $: searchFiltered = (() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return activeTransactions
    return activeTransactions.filter(
      t =>
        t.description.toLowerCase().includes(q) ||
        (t.name && t.name.toLowerCase().includes(q)) ||
        (t.notes && t.notes.toLowerCase().includes(q)),
    )
  })()

  // Reset page when search changes
  $: if (searchQuery !== undefined) currentPage = 1
</script>

<div class="max-w-4xl mx-auto space-y-6">
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-bold text-gray-100">Transactions</h1>
    <div class="flex gap-2">
      {#if selectedAccount && !isCategoryFilter}
        <button class="btn-secondary" on:click={() => (importOpen = true)}>
          <svg
            class="w-4 h-4 inline-block mr-1 -mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
            />
          </svg>
          Import CSV
        </button>
        <button class="btn-primary" on:click={() => (addTxOpen = true)}>+ Add Transaction</button>
      {/if}
    </div>
  </div>

  {#if transactionAccounts.length === 0}
    <EmptyState title="No accounts" description="Add a checking or savings account to track transactions." />
  {:else}
    <!-- Category filter banner -->
    {#if isCategoryFilter}
      <div class="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-indigo-950/40 border border-indigo-800/50 text-sm">
        <svg
          class="w-4 h-4 text-indigo-400 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"
          />
        </svg>
        <span class="text-indigo-200">Filtered by: <strong>{filterLabel}</strong></span>
        {#if filterMonth}
          <span class="text-indigo-400">· {filterMonth}</span>
        {/if}
        <a
          href="/transactions"
          class="ml-auto flex items-center gap-1 text-indigo-400 hover:text-indigo-200 transition-colors"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear filter
        </a>
      </div>
    {/if}

    <!-- Account sub-navigation (hidden when category filter is active) -->
    {#if !isCategoryFilter}
      <div class="flex gap-1 border-b border-gray-700">
        {#each transactionAccounts as account (account.id)}
          <button
            on:click={() => (selectedAccountId = account.id)}
            class="px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 -mb-px transition-colors
							{selectedAccountId === account.id
              ? 'border-indigo-500 text-indigo-300 bg-gray-800/50'
              : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'}"
          >
            {account.name}
            <span class="ml-1.5 text-xs opacity-60 capitalize">({account.type})</span>
          </button>
        {/each}
      </div>
    {/if}

    <!-- Search -->
    <div class="flex items-center gap-2">
      <div class="relative flex-1">
        <svg
          class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
        </svg>
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Search transactions…"
          class="w-full pl-9 pr-9 py-2 text-sm bg-gray-800 border border-gray-700 text-gray-200 rounded-lg placeholder-gray-500 focus:outline-none focus:border-indigo-500"
        />
        {#if searchQuery}
          <button
            on:click={() => (searchQuery = "")}
            class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
            aria-label="Clear search"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        {/if}
      </div>
      <a href="/transactions?uncategorized=true" class="btn-secondary flex-shrink-0">Uncategorized</a>
    </div>

    <!-- Transaction list -->
    {#if searchFiltered.length === 0}
      <div class="text-center py-16 text-gray-500">
        {#if searchQuery.trim()}
          <p>No transactions match "<span class="text-gray-300">{searchQuery.trim()}</span>".</p>
          <button
            on:click={() => (searchQuery = "")}
            class="text-sm mt-2 text-indigo-400 hover:text-indigo-200 transition-colors">Clear search</button
          >
        {:else if isCategoryFilter}
          <p>No transactions found for this filter.</p>
        {:else}
          <p>No cleared transactions for this account.</p>
          <p class="text-sm mt-1">Add a transaction using the button above.</p>
        {/if}
      </div>
    {:else}
      <!-- Controls bar -->
      <div class="flex items-center gap-2 flex-wrap">
        <button
          on:click={toggleSelectionMode}
          class="btn-secondary {selectionMode ? 'border-indigo-500 text-indigo-300' : ''}"
          title="Toggle selection mode"
        >
          <svg
            class="w-4 h-4 inline-block mr-1 -mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Select
        </button>
        <select
          bind:value={pageSize}
          on:change={() => (currentPage = 1)}
          class="text-sm bg-gray-800 border border-gray-700 text-gray-300 rounded px-2 py-1 focus:outline-none focus:border-indigo-500"
        >
          <option value={20}>20 / page</option>
          <option value={100}>100 / page</option>
          <option value={500}>500 / page</option>
        </select>
        <span class="text-sm text-gray-400">
          {searchFiltered.length} transaction{searchFiltered.length === 1 ? "" : "s"}
          {#if searchQuery.trim()}(filtered){/if}
          · Page {currentPage} of {totalPages}
        </span>
        <div class="flex-1"></div>
        {#if selectedIds.size > 0}
          <HoldToDelete
            class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-400 bg-red-950/30 border border-red-800/50 rounded hover:bg-red-900/40 transition-colors"
            label="Delete selected transactions"
            on:confirm={deleteSelected}
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Delete {selectedIds.size} selected
          </HoldToDelete>
        {/if}
        {#if totalPages > 1}
          <div class="flex items-center gap-1">
            <button
              on:click={() => (currentPage = 1)}
              disabled={currentPage === 1}
              class="px-2 py-1 text-sm text-gray-400 hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="First page">«</button
            >
            <button
              on:click={() => (currentPage -= 1)}
              disabled={currentPage === 1}
              class="px-2 py-1 text-sm text-gray-400 hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Previous page">‹</button
            >
            {#each Array.from({ length: totalPages }, (_, i) => i + 1) as page}
              {#if totalPages <= 7 || page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2}
                <button
                  on:click={() => (currentPage = page)}
                  class="w-8 h-8 text-sm rounded transition-colors
                  {currentPage === page
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'}">{page}</button
                >
              {:else if Math.abs(page - currentPage) === 3}
                <span class="text-gray-600 px-1">…</span>
              {/if}
            {/each}
            <button
              on:click={() => (currentPage += 1)}
              disabled={currentPage === totalPages}
              class="px-2 py-1 text-sm text-gray-400 hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Next page">›</button
            >
            <button
              on:click={() => (currentPage = totalPages)}
              disabled={currentPage === totalPages}
              class="px-2 py-1 text-sm text-gray-400 hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Last page">»</button
            >
          </div>
        {/if}
      </div>

      <div class="card overflow-hidden p-0">
        <!-- Header row with select-all -->
        {#if selectionMode}
          <div class="flex items-center gap-4 px-4 py-2 border-b border-gray-700 bg-gray-800/50">
            <input
              type="checkbox"
              checked={allOnPageSelected}
              on:change={toggleSelectAll}
              class="w-4 h-4 rounded border-gray-600 bg-gray-700 text-indigo-500 cursor-pointer flex-shrink-0"
              title="Select all on this page"
            />
            <span class="text-xs text-gray-500 uppercase tracking-wide">Select page</span>
          </div>
        {/if}

        <div class="divide-y divide-gray-700/50">
          {#each pagedTransactions as tx (tx.id)}
            {@const catLabel = tx.splits?.length
              ? `Split (${tx.splits.length})`
              : getCategoryLabel(tx.categoryId, tx.subcategoryId)}
            {@const isSelected = selectedIds.has(tx.id)}
            {@const isExpanded = expandedId === tx.id}
            <div
              class="transition-colors {isSelected ? 'bg-indigo-950/20' : ''} {isExpanded
                ? 'ring-1 ring-inset ring-indigo-500/40'
                : ''}"
            >
              <!-- Summary row -->
              <div
                class="flex items-center gap-4 px-4 py-3 cursor-pointer group
									{isExpanded ? 'bg-gray-800/50' : 'hover:bg-gray-800/30'}"
                on:click={() => toggleExpand(tx.id)}
                role="button"
                tabindex="0"
                on:keydown={e => e.key === "Enter" && toggleExpand(tx.id)}
              >
                <!-- Checkbox -->
                {#if selectionMode}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    on:click|stopPropagation
                    on:change={() => toggleRow(tx.id)}
                    class="w-4 h-4 rounded border-gray-600 bg-gray-700 text-indigo-500 cursor-pointer flex-shrink-0"
                  />
                {/if}

                <!-- Date -->
                <div class="text-sm text-gray-400 tabular-nums w-20 flex-shrink-0">
                  {formatDateShort(tx.date)}
                </div>

                <!-- Description + category + notes -->
                <div class="flex-1 min-w-0">
                  <div class="text-sm text-gray-100 truncate">{tx.name ?? tx.description}</div>
                  {#if catLabel}
                    <div class="text-xs text-gray-500 truncate">{catLabel}</div>
                  {/if}
                  {#if tx.notes && !isExpanded}
                    <div class="text-xs text-gray-600 italic truncate">{tx.notes}</div>
                  {/if}
                </div>

                <!-- Type badge -->
                <span
                  class="text-xs px-2 py-0.5 rounded border flex-shrink-0
										{typeColors[tx.type] ?? 'text-gray-400 bg-gray-800 border-gray-700'}"
                >
                  {typeLabels[tx.type] ?? tx.type}
                </span>

                <!-- Imported badge -->
                {#if tx.imported}
                  <span
                    class="text-xs px-2 py-0.5 rounded border flex-shrink-0 text-violet-400 bg-violet-950/30 border-violet-800/50"
                    title="Imported from CSV"
                  >
                    Imported
                  </span>
                {/if}

                <!-- Amount -->
                <div
                  class="text-sm font-medium tabular-nums flex-shrink-0 w-24 text-right
										{tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'}"
                >
                  {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                </div>

                <!-- Expand indicator -->
                <svg
                  class="w-3.5 h-3.5 flex-shrink-0 text-gray-600 transition-transform {isExpanded ? 'rotate-180' : ''}"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              <!-- Expanded detail panel -->
              {#if isExpanded}
                {@const expandedCat = tx.splits?.length ? null : budgetCategories.find(c => c.id === tx.categoryId)}
                <div class="px-4 pb-4 pt-2 bg-gray-700/25 border-t border-indigo-500/30 space-y-4">
                  <!-- Details grid -->
                  <div class="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-2 text-sm">
                    <div class="flex gap-2">
                      <span class="text-gray-500">Date</span>
                      <span class="text-gray-200">{tx.date}</span>
                    </div>
                    <div class="flex gap-2">
                      <span class="text-gray-500">Type</span>
                      <span class="text-gray-200">{typeLabels[tx.type] ?? tx.type}</span>
                    </div>
                    {#if tx.plannerMonth}
                      <div class="flex gap-2">
                        <span class="text-gray-500">Month</span>
                        <span class="text-gray-200">{tx.plannerMonth}</span>
                      </div>
                    {/if}
                    {#if tx.name}
                      <div class="col-span-2 flex gap-2">
                        <span class="text-gray-500 flex-shrink-0">Merchant</span>
                        <span class="text-violet-300">{tx.name}</span>
                      </div>
                    {/if}
                    <div class="col-span-2 flex gap-2">
                      <span class="text-gray-500 flex-shrink-0">Description</span>
                      <span class="text-gray-200">{tx.description}</span>
                    </div>
                    {#if tx.notes}
                      <div class="col-span-2 flex gap-2">
                        <span class="text-gray-500 flex-shrink-0">Notes</span>
                        <span class="text-gray-300 italic">{tx.notes}</span>
                      </div>
                    {/if}
                  </div>

                  <!-- Category / Income / Bill rows -->
                  <div class="space-y-2 pt-1 border-t border-gray-700/40">
                    <!-- Budget category -->
                    <div class="flex items-start gap-3">
                      <span class="w-28 flex-shrink-0 text-xs text-gray-500 uppercase tracking-wide pt-1.5">Budget</span
                      >
                      {#if tx.splits?.length}
                        <div class="flex-1">
                          <TransactionSplitEditor
                            transaction={tx}
                            categories={sortedBudgetCategories}
                            on:save={e =>
                              transactionsStore.update(tx.id, {
                                splits: e.detail,
                                categoryId: undefined,
                                subcategoryId: undefined,
                              })}
                            on:exitSplit={e =>
                              transactionsStore.update(tx.id, {
                                splits: [],
                                categoryId: e.detail.categoryId,
                                subcategoryId: e.detail.subcategoryId,
                              })}
                          />
                        </div>
                      {:else}
                        <div class="flex flex-wrap items-center gap-2">
                          <select
                            value={tx.categoryId ?? ""}
                            on:change={e => {
                              const catId = e.currentTarget.value || undefined
                              transactionsStore.update(tx.id, { categoryId: catId, subcategoryId: undefined })
                            }}
                            class="text-sm bg-gray-700 border border-gray-600 text-gray-200 rounded px-2 py-1 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="">— Unassigned —</option>
                            {#each sortedBudgetCategories as cat}
                              <option value={cat.id}>{cat.name}</option>
                            {/each}
                          </select>

                          {#if expandedCat && expandedCat.subcategories.length > 0}
                            <select
                              value={tx.subcategoryId ?? ""}
                              on:change={e => {
                                const subId = e.currentTarget.value || undefined
                                transactionsStore.update(tx.id, { subcategoryId: subId })
                              }}
                              class="text-sm bg-gray-700 border border-gray-600 text-gray-200 rounded px-2 py-1 focus:outline-none focus:border-indigo-500"
                            >
                              <option value="">— No subcategory —</option>
                              {#each [...expandedCat.subcategories].sort((a, b) => a.name.localeCompare(b.name)) as sub}
                                <option value={sub.id}>{sub.name}</option>
                              {/each}
                            </select>
                          {/if}

                          {#if tx.type !== "income"}
                            <button
                              on:click={() => initSplit(tx)}
                              class="text-xs px-2 py-1 rounded border border-gray-600 text-gray-400 hover:text-indigo-300 hover:border-indigo-600 transition-colors"
                              title="Split this transaction across multiple budget categories"
                            >
                              Split
                            </button>
                          {/if}
                        </div>
                      {/if}
                    </div>

                    <!-- Income source -->
                    <div class="flex items-center gap-3">
                      <span class="w-28 flex-shrink-0 text-xs text-gray-500 uppercase tracking-wide">Income</span>
                      <select
                        value={tx.paycheckId ?? ""}
                        on:change={e => linkPaycheck(tx.id, e.currentTarget.value || undefined)}
                        class="text-sm bg-gray-700 border border-gray-600 text-gray-200 rounded px-2 py-1 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">— None —</option>
                        {#each sortedPaychecks as paycheck}
                          <option value={paycheck.id}>{paycheck.name}</option>
                        {/each}
                      </select>
                    </div>

                    <!-- Bill -->
                    <div class="flex items-center gap-3">
                      <span class="w-28 flex-shrink-0 text-xs text-gray-500 uppercase tracking-wide">Bill</span>
                      <select
                        value={tx.billId ?? ""}
                        on:change={e => linkBill(tx.id, tx.date, e.currentTarget.value || undefined)}
                        class="text-sm bg-gray-700 border border-gray-600 text-gray-200 rounded px-2 py-1 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">— None —</option>
                        {#each sortedBills as bill}
                          <option value={bill.id}>{bill.name}</option>
                        {/each}
                      </select>
                    </div>
                  </div>

                  <!-- Delete -->
                  <div class="flex justify-end pt-1 border-t border-gray-700/40">
                    <HoldToDelete
                      class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-400 bg-red-950/30 border border-red-800/50 rounded hover:bg-red-900/40 transition-colors"
                      label="Hold to delete transaction"
                      on:confirm={() => transactionsStore.remove(tx.id)}
                    >
                      Delete Transaction
                    </HoldToDelete>
                  </div>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>

      <!-- Pagination controls -->
      {#if totalPages > 1}
        <div class="flex justify-end">
          <div class="flex items-center gap-2">
            <button
              on:click={() => (currentPage = 1)}
              disabled={currentPage === 1}
              class="px-2 py-1 text-sm text-gray-400 hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="First page"
            >
              «
            </button>
            <button
              on:click={() => (currentPage -= 1)}
              disabled={currentPage === 1}
              class="px-2 py-1 text-sm text-gray-400 hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              ‹
            </button>

            {#each Array.from({ length: totalPages }, (_, i) => i + 1) as page}
              {#if totalPages <= 7 || page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2}
                <button
                  on:click={() => (currentPage = page)}
                  class="w-8 h-8 text-sm rounded transition-colors
									{currentPage === page ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'}"
                >
                  {page}
                </button>
              {:else if Math.abs(page - currentPage) === 3}
                <span class="text-gray-600 px-1">…</span>
              {/if}
            {/each}

            <button
              on:click={() => (currentPage += 1)}
              disabled={currentPage === totalPages}
              class="px-2 py-1 text-sm text-gray-400 hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              ›
            </button>
            <button
              on:click={() => (currentPage = totalPages)}
              disabled={currentPage === totalPages}
              class="px-2 py-1 text-sm text-gray-400 hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Last page"
            >
              »
            </button>
          </div>
        </div>
      {/if}
    {/if}
  {/if}
</div>

<!-- Add Transaction Modal -->
<Modal open={addTxOpen} title="Add Transaction" on:close={() => (addTxOpen = false)}>
  <TransactionForm
    defaultAccountId={selectedAccountId}
    on:save={() => (addTxOpen = false)}
    on:cancel={() => (addTxOpen = false)}
  />
</Modal>

<!-- Import Transactions Modal -->
<ImportTransactionsModal open={importOpen} on:close={() => (importOpen = false)} />
