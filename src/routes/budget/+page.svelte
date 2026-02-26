<script lang="ts">
  import BudgetForm from "$lib/components/budget/BudgetForm.svelte"
  import CategoryGroup from "$lib/components/budget/CategoryGroup.svelte"
  import SpendingChart from "$lib/components/budget/SpendingChart.svelte"
  import EmptyState from "$lib/components/shared/EmptyState.svelte"
  import Modal from "$lib/components/shared/Modal.svelte"
  import { budgetStore } from "$lib/stores/budget.store"
  import { transactionsStore } from "$lib/stores/transactions.store"
  import type { BudgetCategory } from "$lib/types"
  import { formatCurrency } from "$lib/utils/currency"
  import { addMonths, currentMonth, formatMonth } from "$lib/utils/date"
  import { get } from "svelte/store"
  import { page } from "$app/stores"
  import { onMount } from "svelte"

  let month = currentMonth()
  let filterQuery = ""

  onMount(() => {
    filterQuery = $page.url.searchParams.get("q") ?? ""
  })

  $: visibleCategories = filterQuery
    ? categories
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .filter(cat => {
          const term = filterQuery.toLowerCase()
          return cat.name.toLowerCase().includes(term) || cat.subcategories.some(s => s.name.toLowerCase().includes(term))
        })
    : categories.slice().sort((a, b) => a.name.localeCompare(b.name))
  let modalOpen = false
  let editCategory: BudgetCategory | null = null

  let categories: BudgetCategory[] = []
  budgetStore.categories.subscribe((c: BudgetCategory[]) => (categories = c))

  function prevMonth() {
    month = addMonths(month, -1)
  }
  function nextMonth() {
    month = addMonths(month, 1)
  }

  $: monthTransactions = $transactionsStore.filter(t => t.plannerMonth === month || t.date.startsWith(month))

  function getActualForCategory(cat: BudgetCategory): number {
    return monthTransactions
      .filter(t => {
        if (t.type === "income") return false
        if (t.splits?.length) return t.splits.some(s => s.categoryId === cat.id)
        return t.categoryId === cat.id
      })
      .reduce((sum, t) => {
        if (t.splits?.length) {
          return sum + t.splits.filter(s => s.categoryId === cat.id).reduce((ss, s) => ss + s.amount, 0)
        }
        return sum + t.amount
      }, 0)
  }

  $: totalBudget = categories.reduce((s, c) => s + c.monthlyBudget, 0)
  $: totalActual = categories.reduce((s, c) => s + getActualForCategory(c), 0)

  $: chartData = categories
    .map((cat, i) => {
      const colors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"]
      return {
        label: cat.name,
        amount: getActualForCategory(cat),
        color: colors[i % colors.length],
      }
    })
    .filter(d => d.amount > 0)

  function openAdd() {
    editCategory = null
    modalOpen = true
  }

  function openEdit(e: CustomEvent<BudgetCategory>) {
    editCategory = e.detail
    modalOpen = true
  }

  function closeModal() {
    modalOpen = false
    editCategory = null
  }

  function handleDelete(e: CustomEvent<BudgetCategory>) {
    budgetStore.removeCategory(e.detail.id)
  }

  let reapplyResult: string | null = null

  function matchCategory(description: string): { categoryId: string; subcategoryId?: string } | undefined {
    for (const cat of categories) {
      for (const sub of cat.subcategories) {
        if (!sub.hints) continue
        try {
          if (new RegExp(sub.hints, "i").test(description)) return { categoryId: cat.id, subcategoryId: sub.id }
        } catch {
          /* invalid regex — skip */
        }
      }
      if (!cat.hints) continue
      try {
        if (new RegExp(cat.hints, "i").test(description)) return { categoryId: cat.id }
      } catch {
        /* invalid regex — skip */
      }
    }
    return undefined
  }

  function reapplyHints() {
    const txs = get(transactionsStore)
    let updated = 0
    for (const tx of txs) {
      if (tx.categoryId || !tx.description) continue
      const match = matchCategory(tx.description)
      if (match) {
        transactionsStore.update(tx.id, { categoryId: match.categoryId, subcategoryId: match.subcategoryId })
        updated++
      }
    }
    reapplyResult =
      updated === 0
        ? "No uncategorized transactions matched."
        : `Updated ${updated} transaction${updated === 1 ? "" : "s"}.`
    setTimeout(() => (reapplyResult = null), 4000)
  }
</script>

<div class="max-w-5xl mx-auto space-y-6">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <button class="btn-secondary px-3 py-1.5" on:click={prevMonth} aria-label="Previous month">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 class="text-2xl font-bold text-gray-100">{formatMonth(month)}</h1>
      <button class="btn-secondary px-3 py-1.5" on:click={nextMonth} aria-label="Next month">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
    <div class="flex items-center gap-3">
      {#if reapplyResult}
        <span class="text-sm text-emerald-400">{reapplyResult}</span>
      {/if}
      <a href="/transactions?uncategorized=true&month={month}" class="btn-secondary"> Uncategorized </a>
      <button class="btn-secondary" on:click={reapplyHints} title="Apply hints to all uncategorized transactions">
        Update Transactions
      </button>
      <button class="btn-primary" on:click={openAdd}>
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add Category
      </button>
    </div>
  </div>

  {#if categories.length === 0}
    <EmptyState
      title="No budget categories"
      description="Create categories like Housing, Food, and Transportation to track your spending."
      actionLabel="Add Category"
      on:action={openAdd}
    />
  {:else}
    <!-- Summary -->
    <div class="grid grid-cols-3 gap-4">
      <div class="card text-center">
        <div class="text-xs text-gray-500 uppercase tracking-wide mb-1">Budgeted</div>
        <div class="text-xl font-bold text-gray-100 tabular-nums">{formatCurrency(totalBudget)}</div>
      </div>
      <div class="card text-center">
        <div class="text-xs text-gray-500 uppercase tracking-wide mb-1">Spent</div>
        <div class="text-xl font-bold {totalActual > totalBudget ? 'text-red-400' : 'text-gray-100'} tabular-nums">
          {formatCurrency(totalActual)}
        </div>
      </div>
      <div class="card text-center">
        <div class="text-xs text-gray-500 uppercase tracking-wide mb-1">Remaining</div>
        <div
          class="text-xl font-bold {totalBudget - totalActual < 0 ? 'text-red-400' : 'text-emerald-400'} tabular-nums"
        >
          {formatCurrency(totalBudget - totalActual)}
        </div>
      </div>
    </div>

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
        placeholder="Filter categories…"
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

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Category list -->
      <div class="lg:col-span-2 space-y-3">
        {#if visibleCategories.length === 0}
          <p class="text-sm text-gray-500 text-center py-8">No categories match "{filterQuery}"</p>
        {:else}
          {#each visibleCategories as cat (cat.id)}
            <CategoryGroup category={cat} {monthTransactions} {month} on:edit={openEdit} on:delete={handleDelete} />
          {/each}
        {/if}
      </div>

      <!-- Chart -->
      <div class="card">
        <h3 class="text-sm font-semibold text-gray-300 mb-4">Spending Breakdown</h3>
        <SpendingChart data={chartData} />
      </div>
    </div>
  {/if}
</div>

<Modal open={modalOpen} title={editCategory ? "Edit Category" : "Add Budget Category"} on:close={closeModal}>
  <BudgetForm {editCategory} on:save={closeModal} on:cancel={closeModal} />
</Modal>
