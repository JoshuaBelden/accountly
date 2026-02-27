<script lang="ts">
  import ConfirmDialog from "$lib/components/shared/ConfirmDialog.svelte"
  import { clearAllStorage, exportAllData } from "$lib/persistence/localStorage"
  import { accountsStore } from "$lib/stores/accounts.store"
  import { billsStore } from "$lib/stores/bills.store"
  import { budgetStore } from "$lib/stores/budget.store"
  import { paychecksStore } from "$lib/stores/paychecks.store"
  import { plannerStore } from "$lib/stores/planner.store"
  import { settingsStore } from "$lib/stores/settings.store"
  import { merchantsStore } from "$lib/stores/merchants.store"
  import { transactionsStore } from "$lib/stores/transactions.store"
  import type { BudgetCategory, MonthlyBudgetOverride } from "$lib/types"
  import { exportToFile, importFromFile } from "$lib/utils/export"

  let clearConfirmOpen = false
  let importError = ""
  let importSuccess = false
  let fileInput: HTMLInputElement

  let categories: BudgetCategory[] = []
  let overrides: MonthlyBudgetOverride[] = []
  budgetStore.categories.subscribe((c: BudgetCategory[]) => (categories = c))
  budgetStore.overrides.subscribe((o: MonthlyBudgetOverride[]) => (overrides = o))

  async function handleExport() {
    const envelope = exportAllData(
      $accountsStore,
      $billsStore,
      $paychecksStore,
      $transactionsStore,
      categories,
      overrides,
      $plannerStore,
      $merchantsStore,
      $settingsStore,
    )
    settingsStore.update(s => ({ ...s, lastExported: new Date().toISOString() }))
    await exportToFile(envelope)
  }

  async function handleImport(e: Event) {
    importError = ""
    importSuccess = false
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    try {
      const envelope = await importFromFile(file)
      accountsStore.set(envelope.accounts)
      billsStore.set(envelope.bills)
      paychecksStore.set(envelope.paychecks)
      transactionsStore.set(envelope.transactions)
      budgetStore.categories.set(envelope.budgetCategories)
      budgetStore.overrides.set(envelope.budgetOverrides)
      plannerStore.set(envelope.plannerAssignments)
      merchantsStore.set(envelope.merchants ?? [])
      settingsStore.set(envelope.settings)
      importSuccess = true
    } catch (err) {
      importError = err instanceof Error ? err.message : "Import failed"
    }
    input.value = ""
  }

  function confirmClearAll() {
    clearAllStorage()
    accountsStore.set([])
    billsStore.set([])
    paychecksStore.set([])
    transactionsStore.set([])
    budgetStore.categories.set([])
    budgetStore.overrides.set([])
    plannerStore.set([])
    merchantsStore.set([])
    settingsStore.reset()
    clearConfirmOpen = false
  }

  $: plannerStartDay = $settingsStore.planner.startDayOfMonth

  function updatePlannerDay(e: Event) {
    const val = parseInt((e.target as HTMLInputElement).value)
    if (val >= 1 && val <= 28) {
      settingsStore.updatePlannerStartDay(val)
    }
  }
</script>

<div class="max-w-2xl mx-auto space-y-8">
  <h1 class="text-2xl font-bold text-gray-100">Settings</h1>

  <!-- Planner -->
  <section class="card space-y-4">
    <h2 class="text-lg font-semibold text-gray-100">Monthly Planner</h2>
    <div>
      <label class="label" for="planner-start">Planner Start Day</label>
      <p class="text-xs text-gray-500 mb-2">
        The day of the month your planning period begins. Set this to your first pay day if you don't get paid on the
        1st.
      </p>
      <input
        id="planner-start"
        type="number"
        class="input w-24"
        min="1"
        max="28"
        value={plannerStartDay}
        on:change={updatePlannerDay}
      />
    </div>
  </section>

  <!-- Currency -->
  <section class="card space-y-4">
    <h2 class="text-lg font-semibold text-gray-100">Currency & Locale</h2>
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="label" for="currency">Currency</label>
        <select
          id="currency"
          class="input"
          value={$settingsStore.currency}
          on:change={e => settingsStore.update(s => ({ ...s, currency: (e.target as HTMLSelectElement).value }))}
        >
          <option value="USD">USD — US Dollar</option>
          <option value="EUR">EUR — Euro</option>
          <option value="GBP">GBP — British Pound</option>
          <option value="CAD">CAD — Canadian Dollar</option>
          <option value="AUD">AUD — Australian Dollar</option>
        </select>
      </div>
      <div>
        <label class="label" for="locale">Number Format</label>
        <select
          id="locale"
          class="input"
          value={$settingsStore.locale}
          on:change={e => settingsStore.update(s => ({ ...s, locale: (e.target as HTMLSelectElement).value }))}
        >
          <option value="en-US">1,234.56 (US)</option>
          <option value="en-GB">1,234.56 (UK)</option>
          <option value="de-DE">1.234,56 (EU)</option>
        </select>
      </div>
    </div>
  </section>

  <!-- Data Management -->
  <section class="card space-y-4">
    <h2 class="text-lg font-semibold text-gray-100">Data Management</h2>
    <p class="text-sm text-gray-400">
      All your data is stored locally in your browser. Export a backup regularly to avoid data loss.
    </p>

    {#if $settingsStore.lastExported}
      <p class="text-xs text-gray-500">
        Last exported: {new Date($settingsStore.lastExported).toLocaleString()}
      </p>
    {/if}

    {#if importSuccess}
      <div class="bg-emerald-900/30 border border-emerald-700 rounded-lg p-3 text-sm text-emerald-300">
        Data imported successfully!
      </div>
    {/if}

    {#if importError}
      <div class="bg-red-900/30 border border-red-700 rounded-lg p-3 text-sm text-red-300">
        {importError}
      </div>
    {/if}

    <div class="flex flex-wrap gap-3">
      <button class="btn-primary" on:click={handleExport}>
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        Export Data
      </button>

      <input bind:this={fileInput} type="file" accept=".json" class="hidden" on:change={handleImport} />
      <button class="btn-secondary" on:click={() => fileInput.click()}>
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l4-4m0 0l4 4m-4-4v12"
          />
        </svg>
        Import Data
      </button>

      <button class="btn-danger" on:click={() => (clearConfirmOpen = true)}>
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
        Clear All Data
      </button>
    </div>
  </section>

  <!-- About -->
  <section class="card">
    <h2 class="text-lg font-semibold text-gray-100 mb-2">About</h2>
    <p class="text-sm text-gray-400">
      Accountly is a personal finance manager. All data is stored in your browser's local storage — no data is sent
      anywhere.
    </p>
  </section>
</div>

<ConfirmDialog
  open={clearConfirmOpen}
  title="Clear All Data"
  message="This will permanently delete ALL your accounts, bills, transactions, and settings. This cannot be undone. Export your data first if you want a backup."
  confirmLabel="Delete Everything"
  danger
  on:confirm={confirmClearAll}
  on:cancel={() => (clearConfirmOpen = false)}
/>
