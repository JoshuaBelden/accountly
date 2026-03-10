<script lang="ts">
  import { paychecksStore } from "$lib/stores/paychecks.store"
  import { withholdingsStore } from "$lib/stores/tax.store"
  import { transactionsStore } from "$lib/stores/transactions.store"
  import type { WithholdingEntry, WithholdingTrackerSummary } from "$lib/types/tax"
  import { formatCurrency } from "$lib/utils/currency"
  import WithholdingEntryForm from "./WithholdingEntryForm.svelte"

  export let trackerSummary: WithholdingTrackerSummary
  export let taxYear: number

  let showAddForm = false
  let editingEntry: WithholdingEntry | null = null
  let prefillPaycheckId: string | null = null
  let prefillPayDate: string | null = null

  $: yearEntries = $withholdingsStore
    .filter(entry => entry.taxYear === taxYear)
    .sort((firstEntry, secondEntry) => secondEntry.payDate.localeCompare(firstEntry.payDate))

  $: paycheckNames = new Map($paychecksStore.map(paycheck => [paycheck.id, paycheck.name]))

  /** Income transactions in the tax year that are linked to a paycheck-type income source. */
  $: receivedPaychecks = $transactionsStore
    .filter(transaction => {
      if (transaction.type !== "income" || !transaction.paycheckId) return false
      const year = parseInt(transaction.date.slice(0, 4))
      if (year !== taxYear) return false
      const paycheck = $paychecksStore.find(p => p.id === transaction.paycheckId)
      return paycheck !== undefined && (!paycheck.incomeType || paycheck.incomeType === "paycheck")
    })
    .sort((firstTransaction, secondTransaction) => secondTransaction.date.localeCompare(firstTransaction.date))

  /** Set of "paycheckId|payDate" keys that already have a withholding entry. */
  $: coveredKeys = new Set(yearEntries.map(entry => `${entry.paycheckId}|${entry.payDate}`))

  $: orphanEntries = yearEntries.filter(entry =>
    !receivedPaychecks.some(transaction => transaction.paycheckId === entry.paycheckId && transaction.date === entry.payDate),
  )

  $: pendingCount = receivedPaychecks.filter(
    transaction => !coveredKeys.has(`${transaction.paycheckId}|${transaction.date}`),
  ).length

  function handleSave(event: CustomEvent<WithholdingEntry>) {
    if (editingEntry) {
      withholdingsStore.update(event.detail.id, event.detail)
    } else {
      withholdingsStore.add(event.detail)
    }
    showAddForm = false
    editingEntry = null
    prefillPaycheckId = null
    prefillPayDate = null
  }

  function handleDelete(id: string) {
    withholdingsStore.remove(id)
  }

  function startEdit(entry: WithholdingEntry) {
    editingEntry = entry
    prefillPaycheckId = null
    prefillPayDate = null
    showAddForm = true
  }

  function startAddForTransaction(paycheckId: string, payDate: string) {
    editingEntry = null
    prefillPaycheckId = paycheckId
    prefillPayDate = payDate
    showAddForm = true
  }

  function startAddBlank() {
    editingEntry = null
    prefillPaycheckId = null
    prefillPayDate = null
    showAddForm = true
  }

  function cancelForm() {
    showAddForm = false
    editingEntry = null
    prefillPaycheckId = null
    prefillPayDate = null
  }

  function progressColor(actual: number, recommended: number): string {
    if (recommended <= 0) return "bg-gray-600"
    const ratio = actual / recommended
    if (ratio >= 0.95) return "bg-emerald-500"
    if (ratio >= 0.85) return "bg-amber-500"
    return "bg-red-500"
  }

  function progressWidth(actual: number, recommended: number): string {
    if (recommended <= 0) return "0%"
    return Math.min(100, (actual / recommended) * 100).toFixed(1) + "%"
  }
</script>

<div class="space-y-6">
  <!-- YTD Summary bars -->
  <div class="card space-y-4">
    <div class="flex items-start justify-between">
      <div>
        <h3 class="text-base font-semibold text-gray-100">YTD Withholding Status</h3>
        <p class="text-xs text-gray-500 mt-0.5">
          {yearEntries.length} of {receivedPaychecks.length} received paycheck{receivedPaychecks.length !== 1 ? "s" : ""} have withholding entered for {taxYear}
        </p>
      </div>
      <div class="text-right">
        <div class="text-xs text-gray-500">Year-End Projection</div>
        <div class="text-sm font-semibold {trackerSummary.projectedOverUnder >= 0 ? 'text-emerald-400' : 'text-red-400'}">
          {trackerSummary.projectedOverUnder >= 0 ? '+' : ''}{formatCurrency(trackerSummary.projectedOverUnder)}
          <span class="text-xs font-normal text-gray-500 ml-1">
            {trackerSummary.projectedOverUnder >= 0 ? 'refund est.' : 'owed est.'}
          </span>
        </div>
      </div>
    </div>

    {#if yearEntries.length === 0}
      <p class="text-sm text-gray-500 italic">
        No withholding entered yet. Use the received paychecks list below to add withholding from each pay stub.
      </p>
    {:else}
      <div class="space-y-3">
        {#each [
          { label: "Federal", actual: trackerSummary.ytdFederalActual, recommended: trackerSummary.ytdFederalRecommended },
          { label: "State", actual: trackerSummary.ytdStateActual, recommended: trackerSummary.ytdStateRecommended },
          { label: "FICA (SS + Medicare)", actual: trackerSummary.ytdFicaActual, recommended: trackerSummary.ytdFicaRecommended },
        ] as bar}
          <div class="space-y-1">
            <div class="flex items-center justify-between text-xs">
              <span class="text-gray-400">{bar.label}</span>
              <span class="text-gray-300 tabular-nums">
                {formatCurrency(bar.actual)} of {formatCurrency(bar.recommended)} recommended
              </span>
            </div>
            <div class="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all {progressColor(bar.actual, bar.recommended)}"
                style="width: {progressWidth(bar.actual, bar.recommended)}"
              ></div>
            </div>
            {#if bar.recommended > 0}
              {@const diff = bar.actual - bar.recommended}
              <p class="text-xs {diff >= 0 ? 'text-emerald-500' : 'text-red-400'}">
                {#if Math.abs(diff) < 0.01}
                  On track
                {:else if diff > 0}
                  +{formatCurrency(diff)} over-withheld so far (tracking toward refund)
                {:else}
                  {formatCurrency(Math.abs(diff))} under-withheld so far — may owe at filing
                {/if}
              </p>
            {/if}
          </div>
        {/each}
      </div>

      <div class="flex justify-between pt-2 border-t border-gray-800 text-sm">
        <span class="text-gray-400">Total YTD</span>
        <div class="flex items-baseline gap-3">
          <span class="text-gray-500 tabular-nums">{formatCurrency(trackerSummary.ytdTotalRecommended)} recommended</span>
          <span class="text-gray-100 font-semibold tabular-nums">{formatCurrency(trackerSummary.ytdTotalActual)} actual</span>
        </div>
      </div>
    {/if}
  </div>

  <!-- Add / Edit form -->
  {#if showAddForm}
    <div class="card space-y-4">
      <h3 class="text-base font-semibold text-gray-100">{editingEntry ? "Edit Entry" : "Add Withholding Entry"}</h3>
      <WithholdingEntryForm
        entry={editingEntry}
        defaultTaxYear={taxYear}
        {prefillPaycheckId}
        {prefillPayDate}
        on:save={handleSave}
        on:cancel={cancelForm}
      />
    </div>
  {/if}

  <!-- Received paychecks checklist -->
  <div class="card space-y-3">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-base font-semibold text-gray-100">Received Paychecks — {taxYear}</h3>
        <p class="text-xs text-gray-500 mt-0.5">
          Income transactions from your paychecks this year. Add withholding from your pay stub for each one.
        </p>
      </div>
      <button class="btn-secondary text-xs py-1.5 px-3" on:click={startAddBlank}>
        + Manual Entry
      </button>
    </div>

    {#if receivedPaychecks.length === 0}
      <div class="text-sm text-gray-500 italic py-2">
        No income transactions found for {taxYear}. Once you record paycheck deposits in the Planner or Transactions page, they'll appear here.
      </div>
    {:else}
      {#if pendingCount > 0}
        <div class="bg-amber-900/30 border border-amber-700 rounded-lg px-3 py-2 text-xs text-amber-300">
          {pendingCount} paycheck{pendingCount !== 1 ? "s" : ""} still need{pendingCount === 1 ? "s" : ""} withholding entered.
        </div>
      {:else}
        <div class="bg-emerald-900/30 border border-emerald-700 rounded-lg px-3 py-2 text-xs text-emerald-300">
          All received paychecks have withholding entered.
        </div>
      {/if}

      <div class="divide-y divide-gray-800">
        {#each receivedPaychecks as transaction}
          {@const key = `${transaction.paycheckId}|${transaction.date}`}
          {@const covered = coveredKeys.has(key)}
          {@const matchedEntry = yearEntries.find(entry => entry.paycheckId === transaction.paycheckId && entry.payDate === transaction.date)}
          <div class="flex items-center gap-3 py-2.5">
            <!-- Status indicator -->
            <div class="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center
              {covered ? 'bg-emerald-900/60 text-emerald-400' : 'bg-gray-800 text-gray-600'}">
              {#if covered}
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              {:else}
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
              {/if}
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-baseline gap-2">
                <span class="text-sm text-gray-200">{paycheckNames.get(transaction.paycheckId ?? "") ?? transaction.description}</span>
                <span class="text-xs text-gray-500 tabular-nums">{transaction.date}</span>
              </div>
              {#if covered && matchedEntry}
                {@const entryTotal = matchedEntry.federalWithheld + matchedEntry.stateWithheld + matchedEntry.socialSecurityWithheld + matchedEntry.medicareWithheld}
                <div class="text-xs text-gray-600 mt-0.5">
                  {formatCurrency(matchedEntry.federalWithheld)} federal · {formatCurrency(matchedEntry.stateWithheld)} state · {formatCurrency(matchedEntry.socialSecurityWithheld + matchedEntry.medicareWithheld)} FICA · {formatCurrency(entryTotal)} total
                </div>
              {/if}
            </div>

            <div class="flex items-center gap-1 flex-shrink-0">
              {#if covered && matchedEntry}
                <button
                  on:click={() => startEdit(matchedEntry)}
                  class="text-gray-600 hover:text-gray-300 transition-colors p-1"
                  aria-label="Edit withholding"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  on:click={() => handleDelete(matchedEntry.id)}
                  class="text-gray-600 hover:text-red-400 transition-colors p-1"
                  aria-label="Delete withholding"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              {:else}
                <button
                  on:click={() => startAddForTransaction(transaction.paycheckId ?? "", transaction.date)}
                  class="btn-secondary text-xs py-1 px-2"
                >
                  Add withholding
                </button>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Manual entries that don't match a transaction (edge case) -->
  {#if orphanEntries.length > 0}
    <div class="card space-y-3">
      <h3 class="text-sm font-semibold text-gray-400">Other Entries</h3>
      <div class="divide-y divide-gray-800">
        {#each orphanEntries as entry}
          {@const entryTotal = entry.federalWithheld + entry.stateWithheld + entry.socialSecurityWithheld + entry.medicareWithheld}
          <div class="flex items-center gap-3 py-2.5">
            <div class="flex-1 min-w-0">
              <div class="flex items-baseline gap-2">
                <span class="text-sm text-gray-300">{paycheckNames.get(entry.paycheckId) ?? "Unknown"}</span>
                <span class="text-xs text-gray-500 tabular-nums">{entry.payDate}</span>
              </div>
              <div class="text-xs text-gray-600 mt-0.5">
                {formatCurrency(entry.federalWithheld)} federal · {formatCurrency(entry.stateWithheld)} state · {formatCurrency(entry.socialSecurityWithheld + entry.medicareWithheld)} FICA · {formatCurrency(entryTotal)} total
              </div>
            </div>
            <div class="flex items-center gap-1">
              <button on:click={() => startEdit(entry)} class="text-gray-600 hover:text-gray-300 transition-colors p-1" aria-label="Edit">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button on:click={() => handleDelete(entry.id)} class="text-gray-600 hover:text-red-400 transition-colors p-1" aria-label="Delete">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
