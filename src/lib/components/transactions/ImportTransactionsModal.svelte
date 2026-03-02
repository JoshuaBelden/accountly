<script lang="ts">
  import Modal from "$lib/components/shared/Modal.svelte"
  import { accountsStore, checkingAccounts, savingsAccounts } from "$lib/stores/accounts.store"
  import { billsStore } from "$lib/stores/bills.store"
  import { budgetStore } from "$lib/stores/budget.store"
  import { merchantsStore } from "$lib/stores/merchants.store"
  import { paychecksStore } from "$lib/stores/paychecks.store"
  import { plannerStore } from "$lib/stores/planner.store"
  import { transactionsStore } from "$lib/stores/transactions.store"
  import type { Bill, CheckingAccount, CsvFormat, Merchant, Paycheck, PlannedBillAssignment, SavingsAccount, Transaction } from "$lib/types"
  import {
    autoDetectFormat,
    detectDateFormat,
    detectHeaders,
    parseCsvWithFormat,
    type ParsedCsvRow,
  } from "$lib/utils/csvImport"
  import { formatCurrency } from "$lib/utils/currency"
  import { findMatchingPayDate, formatDateShort, todayISO } from "$lib/utils/date"
  import { createEventDispatcher } from "svelte"
  import { get } from "svelte/store"

  export let open = false
  export let defaultAccountId = ""

  const dispatch = createEventDispatcher()

  type RowWithMeta = ParsedCsvRow & {
    isDuplicate: boolean
    matchedBill?: Bill
    matchedPaycheck?: Paycheck
    matchedMerchant?: Merchant
    matchedCategoryLabel?: string
  }

  type Step = "upload" | "mapping" | "preview"

  let step: Step = "upload"
  let selectedAccountId = ""

  $: if (open) selectedAccountId = defaultAccountId
  let parsedRows: RowWithMeta[] = []
  let selected: boolean[] = []
  let dragover = false
  let error = ""
  let fileInput: HTMLInputElement

  // Raw CSV text held during mapping step
  let rawCsvText = ""
  let csvHeaders: string[] = []

  // Mapping step state
  let mappingDateField = ""
  let mappingDescField = ""
  let mappingUseDebitCredit = false
  let mappingAmountField = ""
  let mappingTypeField = ""
  let mappingDebitField = ""
  let mappingCreditField = ""
  let mappingBalanceField = ""
  let mappingDateFormat: CsvFormat["dateFormat"] = "MM/DD/YY"
  let mappingSaveToAccount = false

  $: accounts = [...$checkingAccounts, ...$savingsAccounts]
  $: selectedAccount = accounts.find(acct => acct.id === selectedAccountId) as
    | CheckingAccount
    | SavingsAccount
    | undefined
  $: selectedCount = selected.filter(Boolean).length
  $: duplicateCount = parsedRows.filter(r => r.isDuplicate).length
  $: allSelected = selected.length > 0 && selected.every(Boolean)
  $: balanceUpdate =
    parsedRows.length > 0 && parsedRows[0].date === todayISO() && parsedRows[0].balance > 0
      ? parsedRows[0].balance
      : null

  function reset() {
    step = "upload"
    parsedRows = []
    selected = []
    selectedAccountId = defaultAccountId
    error = ""
    dragover = false
    rawCsvText = ""
    csvHeaders = []
    resetMappingFields()
  }

  function resetMappingFields() {
    mappingDateField = ""
    mappingDescField = ""
    mappingUseDebitCredit = false
    mappingAmountField = ""
    mappingTypeField = ""
    mappingDebitField = ""
    mappingCreditField = ""
    mappingBalanceField = ""
    mappingDateFormat = "MM/DD/YY"
    mappingSaveToAccount = false
  }

  function handleClose() {
    reset()
    dispatch("close")
  }

  /** Applies a saved CsvFormat to the mapping step fields. */
  function applyFormatToMapping(format: CsvFormat) {
    mappingDateField = format.dateField
    mappingDescField = format.descriptionField
    mappingUseDebitCredit = !format.amountField && (!!format.debitField || !!format.creditField)
    mappingAmountField = format.amountField ?? ""
    mappingTypeField = format.typeField ?? ""
    mappingDebitField = format.debitField ?? ""
    mappingCreditField = format.creditField ?? ""
    mappingBalanceField = format.balanceField ?? ""
    mappingDateFormat = format.dateFormat
  }

  /** Builds a CsvFormat from the current mapping step fields. */
  function buildFormatFromMapping(): CsvFormat {
    return {
      dateField: mappingDateField,
      descriptionField: mappingDescField,
      amountField: mappingUseDebitCredit ? undefined : mappingAmountField || undefined,
      typeField: mappingUseDebitCredit ? undefined : mappingTypeField || undefined,
      debitField: mappingUseDebitCredit ? mappingDebitField || undefined : undefined,
      creditField: mappingUseDebitCredit ? mappingCreditField || undefined : undefined,
      balanceField: mappingBalanceField || undefined,
      dateFormat: mappingDateFormat,
    }
  }

  function processFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      error = "Please select a CSV file."
      return
    }
    error = ""
    const reader = new FileReader()
    reader.onload = evt => {
      try {
        const text = evt.target?.result as string
        rawCsvText = text
        csvHeaders = detectHeaders(text)

        if (csvHeaders.length === 0 || csvHeaders.every(h => !h)) {
          error = "Could not read column headers from the file. The file may be empty or use an unsupported format."
          return
        }

        // If account is already selected and has a saved format, try to use it directly
        const account = accounts.find(acct => acct.id === selectedAccountId) as
          | CheckingAccount
          | SavingsAccount
          | undefined
        if (account?.csvFormat) {
          const rows = tryParseWithFormat(text, account.csvFormat)
          if (rows !== null) {
            applyFormatToMapping(account.csvFormat)
            finalizeRows(rows)
            step = "preview"
            return
          }
        }

        // Otherwise populate mapping fields from auto-detection and go to mapping step
        const { format: detected, useDebitCredit } = autoDetectFormat(csvHeaders)
        applyFormatToMapping({
          dateField: detected.dateField ?? "",
          descriptionField: detected.descriptionField ?? "",
          amountField: detected.amountField,
          typeField: detected.typeField,
          debitField: detected.debitField,
          creditField: detected.creditField,
          balanceField: detected.balanceField,
          dateFormat: "MM/DD/YY",
        })
        mappingUseDebitCredit = useDebitCredit

        // Sniff date format from first data row
        const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim().split("\n")
        if (lines.length >= 2 && mappingDateField) {
          const firstDataCols = parseCsvLine(lines[1])
          const dateColIndex = csvHeaders.findIndex(h => h === mappingDateField)
          if (dateColIndex >= 0 && firstDataCols[dateColIndex]) {
            mappingDateFormat = detectDateFormat(firstDataCols[dateColIndex])
          }
        }

        step = "mapping"
      } catch {
        error = "Failed to parse the CSV file. Please check the format."
      }
    }
    reader.onerror = () => {
      error = "Failed to read the file."
    }
    reader.readAsText(file)
  }

  /** Simple CSV line parser for sniffing date values — not the full parser. */
  function parseCsvLine(line: string): string[] {
    const cols: string[] = []
    let current = ""
    let inQuotes = false
    for (const ch of line) {
      if (ch === '"') {
        inQuotes = !inQuotes
      } else if (ch === "," && !inQuotes) {
        cols.push(current.trim())
        current = ""
      } else {
        current += ch
      }
    }
    cols.push(current.trim())
    return cols
  }

  function tryParseWithFormat(text: string, format: CsvFormat): RowWithMeta[] | null {
    try {
      const rows = parseCsvWithFormat(text, format)
      if (rows.length === 0) return null
      return enrichRows(rows)
    } catch {
      return null
    }
  }

  function confirmMapping() {
    error = ""
    if (!mappingDateField || !mappingDescField) {
      error = "Date and Description columns are required."
      return
    }
    if (!mappingUseDebitCredit && !mappingAmountField) {
      error = "Please select an Amount column."
      return
    }
    if (mappingUseDebitCredit && !mappingDebitField && !mappingCreditField) {
      error = "Please select at least one of Debit or Credit columns."
      return
    }
    if (!selectedAccountId) {
      error = "Please select an account."
      return
    }

    const format = buildFormatFromMapping()
    const rows = tryParseWithFormat(rawCsvText, format)
    if (rows === null || rows.length === 0) {
      error = "No transactions could be parsed with the selected mapping. Please check your column selections."
      return
    }

    if (mappingSaveToAccount) {
      accountsStore.update(selectedAccountId, { csvFormat: format } as Partial<CheckingAccount>)
    }

    finalizeRows(rows)
    step = "preview"
  }

  function enrichRows(rows: ParsedCsvRow[]): RowWithMeta[] {
    const existing = get(transactionsStore).filter(transaction => transaction.accountId === selectedAccountId)
    const existingKeys = new Set(existing.map(transaction => `${transaction.date}|${transaction.description}|${transaction.amount}`))
    return rows.map(row => {
      const matchedBill = matchBill(row.description)
      const matchedPaycheck = !matchedBill && row.rawType === "Credit" ? matchPaycheck(row.description) : undefined
      const matchedMerchant = matchMerchant(row.description)
      let matchedCategoryLabel: string | undefined
      if (matchedBill?.categoryId) {
        matchedCategoryLabel = getCategoryLabel(matchedBill.categoryId, matchedBill.subcategoryId)
      } else if (matchedMerchant?.categoryId) {
        matchedCategoryLabel = getCategoryLabel(matchedMerchant.categoryId, matchedMerchant.subcategoryId)
      } else if (!matchedPaycheck) {
        const catMatch = matchCategory(row.description)
        if (catMatch) matchedCategoryLabel = getCategoryLabel(catMatch.categoryId, catMatch.subcategoryId)
      }
      return {
        ...row,
        isDuplicate: existingKeys.has(`${row.date}|${row.description}|${row.amount}`),
        matchedBill,
        matchedPaycheck,
        matchedMerchant,
        matchedCategoryLabel,
      }
    })
  }

  function finalizeRows(rows: RowWithMeta[]) {
    parsedRows = rows
    selected = rows.map(row => !row.isDuplicate)
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    dragover = false
    const file = e.dataTransfer?.files[0]
    if (file) processFile(file)
  }

  function handleDragover(e: DragEvent) {
    e.preventDefault()
    dragover = true
  }

  function handleFileInput(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) processFile(file)
  }

  function toggleAll() {
    const newVal = !allSelected
    selected = selected.map(() => newVal)
  }

  function skipDuplicates() {
    selected = parsedRows.map(row => !row.isDuplicate)
  }

  function matchBill(description: string): Bill | undefined {
    const bills = get(billsStore)
    for (const bill of bills) {
      if (!bill.hints) continue
      try {
        if (new RegExp(bill.hints, "i").test(description)) return bill
      } catch {
        /* invalid regex — skip */
      }
    }
    return undefined
  }

  function matchPaycheck(description: string): Paycheck | undefined {
    const paychecks = get(paychecksStore)
    for (const paycheck of paychecks) {
      if (!paycheck.hints) continue
      try {
        if (new RegExp(paycheck.hints, "i").test(description)) return paycheck
      } catch {
        /* invalid regex — skip */
      }
    }
    return undefined
  }

  function matchMerchant(description: string): Merchant | undefined {
    const merchants = get(merchantsStore)
    for (const merchant of merchants) {
      try {
        if (new RegExp(merchant.hints, "i").test(description)) return merchant
      } catch {
        /* invalid regex — skip */
      }
    }
    return undefined
  }

  function matchCategory(description: string): { categoryId: string; subcategoryId?: string } | undefined {
    const categories = get(budgetStore.categories)
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

  function getCategoryLabel(categoryId: string, subcategoryId?: string): string {
    const categories = get(budgetStore.categories)
    const cat = categories.find(c => c.id === categoryId)
    if (!cat) return ""
    if (subcategoryId) {
      const sub = cat.subcategories.find(s => s.id === subcategoryId)
      if (sub) return `${cat.name} › ${sub.name}`
    }
    return cat.name
  }

  function importSelected() {
    if (!selectedAccountId) {
      error = "Please select an account."
      return
    }
    const now = new Date().toISOString()
    parsedRows.forEach((row, i) => {
      if (!selected[i]) return

      const bill = row.matchedBill
      const paycheck = row.matchedPaycheck
      const merchant = row.matchedMerchant
      const categoryMatch = !bill && !paycheck && !merchant?.categoryId ? matchCategory(row.description) : undefined
      const paycheckPayDate = paycheck ? findMatchingPayDate(paycheck, row.date) : undefined

      const transaction: Transaction = {
        id: crypto.randomUUID(),
        date: row.date,
        description: row.description,
        name: merchant?.name,
        merchantId: merchant?.id,
        amount: row.amount,
        type: bill ? "bill_payment" : paycheck || row.rawType === "Credit" ? "income" : "expense",
        accountId: bill?.accountId ?? selectedAccountId,
        clearedStatus: "cleared",
        imported: true,
        billId: bill?.id,
        paycheckId: paycheck?.id,
        plannedPaycheckDate: paycheckPayDate,
        categoryId: bill?.categoryId ?? merchant?.categoryId ?? categoryMatch?.categoryId,
        subcategoryId: bill?.subcategoryId ?? merchant?.subcategoryId ?? categoryMatch?.subcategoryId,
        plannerMonth: paycheckPayDate ? paycheckPayDate.substring(0, 7) : row.date.substring(0, 7),
        createdAt: now,
        updatedAt: now,
      }
      transactionsStore.add(transaction)

      // Link to planner assignment, creating one if needed
      if (bill) {
        const month = row.date.substring(0, 7)
        const assignments = plannerStore.getForMonth(month)
        let assignment = assignments.find(a => a.billId === bill.id)
        if (!assignment) {
          const newAssignment: PlannedBillAssignment = {
            id: crypto.randomUUID(),
            plannerMonth: month,
            billId: bill.id,
          }
          plannerStore.assign(newAssignment)
          assignment = newAssignment
        }
        plannerStore.linkTransaction(assignment.id, transaction.id)
      }
    })
    if (balanceUpdate !== null) {
      accountsStore.update(selectedAccountId, { balance: balanceUpdate })
    }
    reset()
    dispatch("close")
  }
</script>

<Modal {open} title="Import Transactions" width="max-w-3xl" on:close={handleClose}>
  {#if step === "upload"}
    <!-- Drop zone -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed px-8 py-14 text-center transition-colors
			{dragover ? 'border-indigo-400 bg-indigo-950/20' : 'border-gray-600 hover:border-gray-500'}"
      on:drop={handleDrop}
      on:dragover={handleDragover}
      on:dragleave={() => (dragover = false)}
    >
      <svg class="w-12 h-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
        />
      </svg>
      <div>
        <p class="text-gray-200 font-medium">Drop your CSV file here</p>
        <p class="text-sm text-gray-500 mt-1">or</p>
      </div>
      <button type="button" class="btn-secondary text-sm" on:click={() => fileInput.click()}> Browse files </button>
      <p class="text-xs text-gray-600">Supports bank export CSV files</p>
    </div>

    <input bind:this={fileInput} type="file" accept=".csv" class="hidden" on:change={handleFileInput} />

    {#if error}
      <p class="mt-3 text-sm text-red-400">{error}</p>
    {/if}
  {:else if step === "mapping"}
    <!-- Column mapping step -->
    <div class="space-y-5">
      <p class="text-sm text-gray-400">
        Map the columns from your CSV to the fields Accountly needs. Your selection will be remembered for this account.
      </p>

      <!-- Account selector -->
      <div class="flex items-center gap-3">
        <label class="label mb-0 whitespace-nowrap" for="mapping-account">Import to account</label>
        <select id="mapping-account" class="input flex-1" bind:value={selectedAccountId}>
          <option value="">Select account…</option>
          {#each accounts as acct}
            <option value={acct.id}>{acct.name}</option>
          {/each}
        </select>
      </div>

      <!-- Detected headers preview -->
      <div class="rounded-lg border border-gray-700 bg-gray-800/40 px-3 py-2">
        <p class="text-xs text-gray-500 mb-1">Detected columns</p>
        <p class="text-xs text-gray-300 font-mono">{csvHeaders.join(", ")}</p>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <!-- Date column -->
        <div>
          <label class="label" for="map-date">Date column <span class="text-red-400">*</span></label>
          <select id="map-date" class="input" bind:value={mappingDateField}>
            <option value="">Select column…</option>
            {#each csvHeaders as header}
              <option value={header}>{header}</option>
            {/each}
          </select>
        </div>

        <!-- Date format -->
        <div>
          <label class="label" for="map-date-fmt">Date format <span class="text-red-400">*</span></label>
          <select id="map-date-fmt" class="input" bind:value={mappingDateFormat}>
            <option value="MM/DD/YY">MM/DD/YY — e.g. 03/02/26</option>
            <option value="M/D/YYYY">M/D/YYYY — e.g. 3/2/2026</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY — e.g. 03/02/2026</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD — e.g. 2026-03-02</option>
          </select>
        </div>

        <!-- Description column -->
        <div class="col-span-2">
          <label class="label" for="map-desc">Description column <span class="text-red-400">*</span></label>
          <select id="map-desc" class="input" bind:value={mappingDescField}>
            <option value="">Select column…</option>
            {#each csvHeaders as header}
              <option value={header}>{header}</option>
            {/each}
          </select>
        </div>
      </div>

      <!-- Amount approach toggle -->
      <div>
        <p class="label mb-2">Amount columns <span class="text-red-400">*</span></p>
        <div class="flex gap-4">
          <label class="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="radio"
              name="amount-mode"
              bind:group={mappingUseDebitCredit}
              value={false}
              class="text-indigo-500"
            />
            <span class="text-gray-200">Single amount + type column</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="radio"
              name="amount-mode"
              bind:group={mappingUseDebitCredit}
              value={true}
              class="text-indigo-500"
            />
            <span class="text-gray-200">Separate debit and credit columns</span>
          </label>
        </div>
      </div>

      {#if !mappingUseDebitCredit}
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label" for="map-amount">Amount column <span class="text-red-400">*</span></label>
            <select id="map-amount" class="input" bind:value={mappingAmountField}>
              <option value="">Select column…</option>
              {#each csvHeaders as header}
                <option value={header}>{header}</option>
              {/each}
            </select>
          </div>
          <div>
            <label class="label" for="map-type">
              Type column
              <span class="text-gray-500 font-normal">(optional)</span>
            </label>
            <select id="map-type" class="input" bind:value={mappingTypeField}>
              <option value="">None — use sign of amount</option>
              {#each csvHeaders as header}
                <option value={header}>{header}</option>
              {/each}
            </select>
          </div>
        </div>
      {:else}
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label" for="map-debit">Debit column (withdrawals)</label>
            <select id="map-debit" class="input" bind:value={mappingDebitField}>
              <option value="">None</option>
              {#each csvHeaders as header}
                <option value={header}>{header}</option>
              {/each}
            </select>
          </div>
          <div>
            <label class="label" for="map-credit">Credit column (deposits)</label>
            <select id="map-credit" class="input" bind:value={mappingCreditField}>
              <option value="">None</option>
              {#each csvHeaders as header}
                <option value={header}>{header}</option>
              {/each}
            </select>
          </div>
        </div>
      {/if}

      <!-- Balance column (optional) -->
      <div>
        <label class="label" for="map-balance">
          Balance column
          <span class="text-gray-500 font-normal">(optional)</span>
        </label>
        <select id="map-balance" class="input" bind:value={mappingBalanceField}>
          <option value="">None</option>
          {#each csvHeaders as header}
            <option value={header}>{header}</option>
          {/each}
        </select>
      </div>

      <!-- Save format -->
      {#if selectedAccountId}
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            bind:checked={mappingSaveToAccount}
            class="rounded border-gray-600 bg-gray-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-gray-900"
          />
          <span class="text-sm text-gray-300">
            Save this format for <span class="text-gray-100 font-medium">{selectedAccount?.name}</span>
          </span>
        </label>
      {/if}

      {#if error}
        <p class="text-sm text-red-400">{error}</p>
      {/if}
    </div>
  {:else}
    <!-- Preview step -->
    <div class="space-y-4">
      <!-- Account selector -->
      <div class="flex items-center gap-3">
        <label class="label mb-0 whitespace-nowrap" for="import-account">Import to account</label>
        <select id="import-account" class="input flex-1" bind:value={selectedAccountId}>
          <option value="">Select account…</option>
          {#each accounts as acct}
            <option value={acct.id}>{acct.name}</option>
          {/each}
        </select>
      </div>

      <!-- Balance update notice -->
      {#if balanceUpdate !== null}
        <div
          class="flex items-center gap-2 rounded-lg border border-indigo-800/50 bg-indigo-950/30 px-3 py-2 text-sm text-indigo-300"
        >
          <svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
              clip-rule="evenodd"
            />
          </svg>
          Most recent transaction is from today — account balance will be updated to
          <span class="font-medium text-indigo-200">{formatCurrency(balanceUpdate)}</span>.
        </div>
      {/if}

      <!-- Stats + bulk actions -->
      <div class="flex items-center justify-between">
        <p class="text-sm text-gray-400">
          <span class="text-gray-200 font-medium">{parsedRows.length}</span> transactions parsed
          {#if duplicateCount > 0}
            · <span class="text-yellow-400 font-medium">{duplicateCount}</span> possible duplicates
          {/if}
        </p>
        <div class="flex gap-2">
          <button type="button" class="btn-secondary text-xs py-1 px-2" on:click={toggleAll}>
            {allSelected ? "Deselect All" : "Select All"}
          </button>
          {#if duplicateCount > 0}
            <button type="button" class="btn-secondary text-xs py-1 px-2" on:click={skipDuplicates}>
              Skip Duplicates
            </button>
          {/if}
        </div>
      </div>

      <!-- Transaction table -->
      <div class="rounded-lg border border-gray-700 overflow-hidden">
        <div class="overflow-y-auto max-h-80">
          <table class="w-full text-sm">
            <thead class="bg-gray-800/60 sticky top-0">
              <tr class="text-left text-xs text-gray-400">
                <th class="px-3 py-2 w-8"></th>
                <th class="px-3 py-2 whitespace-nowrap">Date</th>
                <th class="px-3 py-2">Description</th>
                <th class="px-3 py-2 whitespace-nowrap">Type</th>
                <th class="px-3 py-2 text-right whitespace-nowrap">Amount</th>
                <th class="px-3 py-2 w-6"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-700/50">
              {#each parsedRows as row, i}
                <tr
                  class="transition-colors
									{selected[i] ? 'bg-gray-800/20' : 'opacity-40'}
									{row.isDuplicate ? 'bg-yellow-950/10' : ''}"
                >
                  <td class="px-3 py-2">
                    <input
                      type="checkbox"
                      bind:checked={selected[i]}
                      class="rounded border-gray-600 bg-gray-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-gray-900"
                    />
                  </td>
                  <td class="px-3 py-2 text-gray-400 tabular-nums whitespace-nowrap">
                    {formatDateShort(row.date)}
                  </td>
                  <td class="px-3 py-2 text-gray-200 max-w-xs">
                    <span class="block truncate" title={row.description}>{row.description}</span>
                    {#if row.matchedBill}
                      <span class="text-xs text-indigo-400">Bill: {row.matchedBill.name}</span>
                    {/if}
                    {#if row.matchedPaycheck}
                      <span class="text-xs text-emerald-400">Income: {row.matchedPaycheck.name}</span>
                    {/if}
                    {#if row.matchedMerchant}
                      <span class="text-xs text-violet-400">Merchant: {row.matchedMerchant.name}</span>
                    {/if}
                    {#if row.matchedCategoryLabel}
                      <span class="text-xs text-gray-400">Category: {row.matchedCategoryLabel}</span>
                    {/if}
                  </td>
                  <td class="px-3 py-2">
                    {#if row.rawType === "Credit"}
                      <span
                        class="text-xs px-1.5 py-0.5 rounded border text-emerald-400 bg-emerald-950/30 border-emerald-800/50"
                      >
                        Income
                      </span>
                    {:else}
                      <span class="text-xs px-1.5 py-0.5 rounded border text-red-400 bg-red-950/30 border-red-800/50">
                        Expense
                      </span>
                    {/if}
                  </td>
                  <td
                    class="px-3 py-2 text-right tabular-nums font-medium
										{row.rawType === 'Credit' ? 'text-emerald-400' : 'text-red-400'}"
                  >
                    {row.rawType === "Credit" ? "+" : "-"}{formatCurrency(row.amount)}
                  </td>
                  <td class="px-3 py-2">
                    {#if row.isDuplicate}
                      <span title="Possible duplicate" class="text-yellow-500">
                        <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fill-rule="evenodd"
                            d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                            clip-rule="evenodd"
                          />
                        </svg>
                      </span>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>

      {#if error}
        <p class="text-sm text-red-400">{error}</p>
      {/if}
    </div>
  {/if}

  <svelte:fragment slot="footer">
    {#if step === "mapping"}
      <button type="button" class="btn-secondary mr-auto" on:click={() => (step = "upload")}>Back</button>
      <button type="button" class="btn-primary" on:click={confirmMapping}>Continue</button>
    {:else if step === "preview"}
      <span class="text-sm text-gray-400 mr-auto">
        {selectedCount} of {parsedRows.length} selected
      </span>
      <button type="button" class="btn-secondary" on:click={() => (step = "mapping")}>Change format</button>
      <button
        type="button"
        class="btn-primary"
        disabled={selectedCount === 0 || !selectedAccountId}
        on:click={importSelected}
      >
        Import {selectedCount}
        {selectedCount === 1 ? "transaction" : "transactions"}
      </button>
    {/if}
  </svelte:fragment>
</Modal>
