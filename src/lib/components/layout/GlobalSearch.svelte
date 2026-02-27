<script lang="ts">
  import { fade, fly } from "svelte/transition"
  import { afterNavigate, goto } from "$app/navigation"
  import { onMount, tick } from "svelte"
  import { searchOpen } from "$lib/stores/search.store"
  import { accountsStore } from "$lib/stores/accounts.store"
  import { billsStore } from "$lib/stores/bills.store"
  import { merchantsStore } from "$lib/stores/merchants.store"
  import { transactionsStore } from "$lib/stores/transactions.store"
  import { budgetStore } from "$lib/stores/budget.store"
  import type { Account } from "$lib/types/account"
  import type { Bill } from "$lib/types/bill"
  import type { Merchant } from "$lib/types/merchant"
  import type { Transaction } from "$lib/types/transaction"
  import type { BudgetCategory } from "$lib/types/budget"

  /** A single flattened search result shown in the panel. */
  interface SearchResult {
    type: "Account" | "Bill" | "Merchant" | "Transaction" | "Category" | "Subcategory"
    label: string
    sublabel: string
    href: string
  }

  let query = ""
  let inputEl: HTMLInputElement
  let accounts: Account[] = []
  let bills: Bill[] = []
  let merchants: Merchant[] = []
  let transactions: Transaction[] = []
  let categories: BudgetCategory[] = []

  accountsStore.subscribe(value => (accounts = value))
  billsStore.subscribe(value => (bills = value))
  merchantsStore.subscribe(value => (merchants = value))
  transactionsStore.subscribe(value => (transactions = value))
  budgetStore.categories.subscribe(value => (categories = value))

  afterNavigate(() => {
    $searchOpen = false
    query = ""
  })

  $: if ($searchOpen) {
    tick().then(() => inputEl?.focus())
  }

  /** Searches all data sources for the given query string. */
  function computeResults(
    searchQuery: string,
    accs: Account[],
    bils: Bill[],
    mrchts: Merchant[],
    txns: Transaction[],
    cats: BudgetCategory[],
  ): SearchResult[] {
    if (!searchQuery.trim()) return []
    const term = searchQuery.toLowerCase()
    const results: SearchResult[] = []

    for (const account of accs) {
      if (account.name.toLowerCase().includes(term)) {
        results.push({
          type: "Account",
          label: account.name,
          sublabel: account.type,
          href: "/accounts?q=" + encodeURIComponent(account.name),
        })
      }
    }

    for (const bill of bils) {
      if (bill.name.toLowerCase().includes(term)) {
        results.push({
          type: "Bill",
          label: bill.name,
          sublabel: `$${bill.amount.toFixed(2)} · ${bill.frequency}`,
          href: "/bills?q=" + encodeURIComponent(bill.name),
        })
      }
    }

    for (const merchant of mrchts) {
      if (merchant.name.toLowerCase().includes(term)) {
        results.push({
          type: "Merchant",
          label: merchant.name,
          sublabel: merchant.hints,
          href: "/merchants?q=" + encodeURIComponent(merchant.name),
        })
      }
    }

    let transactionCount = 0
    for (const transaction of txns) {
      if (transactionCount >= 5) break
      if (transaction.description.toLowerCase().includes(term)) {
        results.push({
          type: "Transaction",
          label: transaction.description,
          sublabel: `${transaction.date} · $${Math.abs(transaction.amount).toFixed(2)}`,
          href: "/transactions?q=" + encodeURIComponent(transaction.description),
        })
        transactionCount++
      }
    }

    for (const category of cats) {
      if (category.name.toLowerCase().includes(term)) {
        results.push({
          type: "Category",
          label: category.name,
          sublabel: "Budget category",
          href: "/budget?q=" + encodeURIComponent(category.name),
        })
      }
      for (const sub of category.subcategories) {
        if (sub.name.toLowerCase().includes(term)) {
          results.push({
            type: "Subcategory",
            label: sub.name,
            sublabel: `Under ${category.name}`,
            href: "/budget?q=" + encodeURIComponent(sub.name),
          })
        }
      }
    }

    return results
  }

  $: results = computeResults(query, accounts, bills, merchants, transactions, categories)

  onMount(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.metaKey && event.key === "k") {
        event.preventDefault()
        $searchOpen = true
      }
      if (event.key === "Escape" && $searchOpen) {
        $searchOpen = false
      }
    }
    window.addEventListener("keydown", handleKeydown)
    return () => window.removeEventListener("keydown", handleKeydown)
  })

  function handleInputKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" && results.length > 0) {
      goto(results[0].href)
    }
    if (event.key === "Escape") {
      $searchOpen = false
    }
  }

  function close() {
    $searchOpen = false
  }

  const typeBadgeClass: Record<string, string> = {
    Account: "bg-blue-900/60 text-blue-300",
    Bill: "bg-purple-900/60 text-purple-300",
    Merchant: "bg-indigo-900/60 text-indigo-300",
    Transaction: "bg-green-900/60 text-green-300",
    Category: "bg-orange-900/60 text-orange-300",
    Subcategory: "bg-amber-900/60 text-amber-300",
  }
</script>

{#if $searchOpen}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 z-50 bg-black/40"
    role="presentation"
    on:click={close}
    transition:fade={{ duration: 150 }}
  ></div>

  <!-- Panel -->
  <div
    class="fixed top-0 right-0 z-50 h-full w-[300px] bg-gray-900 border-l border-gray-800 flex flex-col shadow-2xl"
    transition:fly={{ x: 300, duration: 200 }}
  >
    <div class="p-4 border-b border-gray-800">
      <input
        bind:this={inputEl}
        bind:value={query}
        on:keydown={handleInputKeydown}
        type="text"
        placeholder="Search…"
        class="w-full px-3 py-2 bg-gray-800 text-gray-100 placeholder-gray-500 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <p class="mt-2 text-xs text-gray-600">Enter → first result &nbsp;·&nbsp; Esc → close &nbsp;·&nbsp; ⌘K → open</p>
    </div>

    <div class="flex-1 overflow-y-auto py-2">
      {#if !query.trim()}
        <p class="text-xs text-gray-600 text-center py-8">Start typing to search</p>
      {:else if results.length === 0}
        <p class="text-sm text-gray-500 text-center py-8">No results found</p>
      {:else}
        {#each results as result}
          <a
            href={result.href}
            class="flex flex-col gap-0.5 px-3 py-2.5 hover:bg-gray-800 transition-colors"
            on:click={close}
          >
            <div class="flex items-center gap-2 min-w-0">
              <span class="shrink-0 text-xs px-1.5 py-0.5 rounded font-medium {typeBadgeClass[result.type]}">
                {result.type}
              </span>
              <span class="text-sm text-gray-100 truncate">{result.label}</span>
            </div>
            <span class="text-xs text-gray-500 pl-1 truncate">{result.sublabel}</span>
          </a>
        {/each}
      {/if}
    </div>
  </div>
{/if}
