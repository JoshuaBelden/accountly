<script lang="ts">
  import ConfirmDialog from "$lib/components/shared/ConfirmDialog.svelte"
  import HoldButton from "$lib/components/shared/HoldButton.svelte"
  import { clearAllStorage, exportAllData } from "$lib/persistence/localStorage"
  import { accountsStore } from "$lib/stores/accounts.store"
  import { billsStore } from "$lib/stores/bills.store"
  import { budgetStore } from "$lib/stores/budget.store"
  import { consentStore } from "$lib/stores/consent.store"
  import { paychecksStore } from "$lib/stores/paychecks.store"
  import { plannerStore } from "$lib/stores/planner.store"
  import { settingsStore } from "$lib/stores/settings.store"
  import { merchantsStore } from "$lib/stores/merchants.store"
  import { transactionsStore } from "$lib/stores/transactions.store"
  import type { BudgetCategory, MonthlyBudgetOverride } from "$lib/types"
  import { exportToFile, importFromFile } from "$lib/utils/export"
  import { importDefaultData } from "$lib/utils/defaultData"

  let clearConfirmOpen = false
  let importError = ""
  let importSuccess = false
  let defaultDataSuccess = false
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

  function handleImportDefaultData() {
    importDefaultData()
    defaultDataSuccess = true
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

  <!-- About -->
  <section class="card space-y-4">
    <h2 class="text-lg font-semibold text-gray-100">About Accountly</h2>
    <p class="text-sm text-gray-300">
      Accountly is a personal finance manager that runs entirely in your browser — no server, no cloud sync, and no
      account required.
    </p>

    <div class="space-y-3">
      <h3 class="text-sm font-semibold text-gray-200">How your data is stored</h3>
      <p class="text-sm text-gray-400">
        All your data — accounts, transactions, bills, budget categories, and settings — is saved in your browser's
        <span class="text-gray-200 font-medium">localStorage</span>. This is private, device-local storage built into
        your browser.
      </p>
      <ul class="space-y-2 text-sm text-gray-400">
        <li class="flex gap-2">
          <span class="text-amber-400 flex-shrink-0 mt-0.5">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
          </span>
          <span
            >Your data exists <span class="text-gray-200">only in this browser on this device</span>. It is not synced
            to other browsers, devices, or accounts.</span
          >
        </li>
        <li class="flex gap-2">
          <span class="text-amber-400 flex-shrink-0 mt-0.5">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
          </span>
          <span
            >Clearing browser site data, using <span class="text-gray-200">private/incognito mode</span>, or
            uninstalling the browser will <span class="text-gray-200">permanently erase</span> your data.</span
          >
        </li>
        <li class="flex gap-2">
          <span class="text-amber-400 flex-shrink-0 mt-0.5">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
          </span>
          <span
            >There is <span class="text-gray-200">no recovery option</span>. If your data is lost, there is no server
            to restore it from. Export your data regularly using the Export Data button below.</span
          >
        </li>
      </ul>
    </div>

    {#if $consentStore}
      <div class="flex items-center gap-2 pt-1">
        <svg class="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
        </svg>
        <span class="text-sm text-emerald-400">Acknowledged</span>
      </div>
    {:else}
      <label class="flex items-start gap-3 cursor-pointer group pt-1">
        <input
          type="checkbox"
          class="mt-0.5 w-4 h-4 rounded border-gray-600 bg-gray-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-gray-900 cursor-pointer"
          checked={false}
          on:change={e => {
            if ((e.target as HTMLInputElement).checked) consentStore.accept()
          }}
        />
        <span class="text-sm text-gray-300 group-hover:text-gray-100 transition-colors">
          I understand that my data is stored locally in this browser only, and I am responsible for backing it up
          regularly.
        </span>
      </label>
    {/if}
  </section>

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

    {#if defaultDataSuccess}
      <div class="bg-emerald-900/30 border border-emerald-700 rounded-lg p-3 text-sm text-emerald-300">
        Default data loaded! Explore the app to see your accounts, bills, budget, and transactions.
      </div>
    {/if}

    {#if importError}
      <div class="bg-red-900/30 border border-red-700 rounded-lg p-3 text-sm text-red-300">
        {importError}
      </div>
    {/if}

    <div class="flex flex-wrap gap-3">
      <button class="btn-secondary" on:click={handleImportDefaultData}>
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        Import Default Data
      </button>

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

      <HoldButton danger on:confirm={() => (clearConfirmOpen = true)}>
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
        Clear All Data
      </HoldButton>
    </div>
  </section>
</div>

<ConfirmDialog
  open={clearConfirmOpen}
  title="Clear All Data"
  message="This will permanently delete ALL your accounts, bills, transactions, and settings. This cannot be undone. Export your data first if you want a backup."
  confirmLabel="Delete Everything"
  danger
  showExport
  on:export={handleExport}
  on:confirm={confirmClearAll}
  on:cancel={() => (clearConfirmOpen = false)}
/>
