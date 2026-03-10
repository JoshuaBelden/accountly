<script lang="ts">
  import { createEventDispatcher } from "svelte"
  import { paychecksStore } from "$lib/stores/paychecks.store"
  import type { TaxBracket, TaxProfile, PreTaxDeduction, FilingStatus } from "$lib/types/tax"
  import BracketTable from "./BracketTable.svelte"

  const dispatch = createEventDispatcher<{ save: TaxProfile }>()

  let step = 1
  const totalSteps = 4

  let taxYear = new Date().getFullYear()
  let filingStatus: FilingStatus = "single"
  let federalBrackets: TaxBracket[] = []
  let federalStandardDeduction = 14600
  let stateName = ""
  let stateBrackets: TaxBracket[] = []
  let stateStandardDeduction = 0
  let preTaxDeductions: PreTaxDeduction[] = []

  const filingStatusDescriptions: Record<FilingStatus, string> = {
    single: "You are unmarried or legally separated.",
    marriedFilingJointly: "You are married and combining income with your spouse on one return.",
    marriedFilingSeparately: "You are married but filing a separate return from your spouse.",
    headOfHousehold: "You are unmarried and paid more than half the cost of a home for a qualifying person.",
  }

  function addPreTaxDeduction() {
    preTaxDeductions = [...preTaxDeductions, { id: crypto.randomUUID(), name: "", amountPerPaycheck: 0 }]
  }

  function removePreTaxDeduction(id: string) {
    preTaxDeductions = preTaxDeductions.filter(deduction => deduction.id !== id)
  }

  function updatePreTaxDeduction(id: string, field: keyof PreTaxDeduction, value: string) {
    preTaxDeductions = preTaxDeductions.map(deduction => {
      if (deduction.id !== id) return deduction
      if (field === "amountPerPaycheck") return { ...deduction, amountPerPaycheck: parseFloat(value) || 0 }
      return { ...deduction, [field]: value }
    })
  }

  function finish() {
    const now = new Date().toISOString()
    const profile: TaxProfile = {
      id: crypto.randomUUID(),
      taxYear,
      filingStatus,
      federalBrackets,
      federalStandardDeduction,
      stateName,
      stateBrackets,
      stateStandardDeduction,
      preTaxDeductions,
      includedPaycheckIds: [],
      createdAt: now,
      updatedAt: now,
    }
    dispatch("save", profile)
  }
</script>

<div class="max-w-2xl mx-auto space-y-8">
  <!-- Step indicator -->
  <div class="flex items-center gap-2">
    {#each Array(totalSteps) as _, index}
      <div class="flex items-center gap-2">
        <div
          class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors
            {step > index + 1
            ? 'bg-emerald-600 text-white'
            : step === index + 1
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-700 text-gray-500'}"
        >
          {#if step > index + 1}
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
            </svg>
          {:else}
            {index + 1}
          {/if}
        </div>
        <span class="text-xs {step === index + 1 ? 'text-gray-200' : 'text-gray-500'}">
          {["General", "Federal Tax", "State Tax", "Deductions"][index]}
        </span>
        {#if index < totalSteps - 1}
          <div class="h-px w-6 bg-gray-700 mx-1"></div>
        {/if}
      </div>
    {/each}
  </div>

  <!-- Step content -->
  {#if step === 1}
    <div class="card space-y-5">
      <div>
        <h2 class="text-lg font-semibold text-gray-100 mb-1">Let's set up your tax profile</h2>
        <p class="text-sm text-gray-400">
          We'll walk you through entering your tax information so we can calculate your estimated liability and how much
          should be withheld from each paycheck.
        </p>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="label" for="wizard-year">Tax Year</label>
          <input id="wizard-year" type="number" class="input" bind:value={taxYear} min="2020" max="2030" />
        </div>
        <div>
          <label class="label" for="wizard-status">Filing Status</label>
          <select id="wizard-status" class="input" bind:value={filingStatus}>
            <option value="single">Single</option>
            <option value="marriedFilingJointly">Married Filing Jointly</option>
            <option value="marriedFilingSeparately">Married Filing Separately</option>
            <option value="headOfHousehold">Head of Household</option>
          </select>
        </div>
      </div>
      <p class="text-xs text-gray-400 bg-gray-800 rounded p-2">{filingStatusDescriptions[filingStatus]}</p>
    </div>

  {:else if step === 2}
    <div class="card space-y-5">
      <div>
        <h2 class="text-lg font-semibold text-gray-100 mb-1">Federal Income Tax Brackets</h2>
        <p class="text-sm text-gray-400">
          Enter the IRS federal tax brackets for your filing status and tax year. You can find the current brackets at
          <span class="text-indigo-400 font-medium">irs.gov</span>.
        </p>
      </div>
      <div class="bg-indigo-950/40 border border-indigo-800 rounded-lg p-3 text-xs text-indigo-200 space-y-1.5">
        <p class="font-medium">How brackets work:</p>
        <p>
          Tax brackets are <strong>marginal</strong> — you only pay each rate on the income <em>within that range</em>,
          not on your total income. For example, if your income is $60,000 and the 22% bracket covers $44,725–$95,375,
          you pay 22% only on the $15,275 that falls within that range.
        </p>
        <p class="font-medium mt-1">Example 2024 Single filer brackets:</p>
        <ul class="list-disc list-inside space-y-0.5 text-indigo-300">
          <li>$0 – $11,600 → 10%</li>
          <li>$11,600 – $47,150 → 12%</li>
          <li>$47,150 – $100,525 → 22%</li>
          <li>$100,525 – $191,950 → 24%</li>
          <li>$191,950 – $243,725 → 32%</li>
          <li>$243,725 – $609,350 → 35%</li>
          <li>$609,350+ → 37%</li>
        </ul>
      </div>
      <BracketTable
        label="Federal Brackets"
        brackets={federalBrackets}
        on:change={event => (federalBrackets = event.detail)}
      />
      <div>
        <label class="label" for="wizard-fed-deduction">Standard Deduction</label>
        <p class="text-xs text-gray-500 mb-1.5">
          This is subtracted from your income before applying brackets. For 2024: $14,600 (single), $29,200 (married
          jointly).
        </p>
        <input id="wizard-fed-deduction" type="number" class="input w-40" bind:value={federalStandardDeduction} min="0" />
      </div>
    </div>

  {:else if step === 3}
    <div class="card space-y-5">
      <div>
        <h2 class="text-lg font-semibold text-gray-100 mb-1">State Income Tax</h2>
        <p class="text-sm text-gray-400">
          Enter your state's tax brackets. If your state has no income tax, leave the brackets empty and click Next.
        </p>
      </div>
      <div class="bg-gray-800 rounded-lg p-3 text-xs text-gray-400 space-y-1">
        <p><strong class="text-gray-300">Flat rate state?</strong> Add one bracket from $0 with no max and your state's rate.</p>
        <p><strong class="text-gray-300">No state tax?</strong> Leave brackets empty — state tax will be $0.</p>
      </div>
      <div>
        <label class="label" for="wizard-state">State</label>
        <input id="wizard-state" type="text" class="input w-48" placeholder="e.g. California" bind:value={stateName} />
      </div>
      <BracketTable
        label="State Brackets"
        brackets={stateBrackets}
        on:change={event => (stateBrackets = event.detail)}
      />
      <div>
        <label class="label" for="wizard-state-deduction">State Standard Deduction</label>
        <input id="wizard-state-deduction" type="number" class="input w-40" bind:value={stateStandardDeduction} min="0" />
      </div>
    </div>

  {:else if step === 4}
    <div class="card space-y-5">
      <div>
        <h2 class="text-lg font-semibold text-gray-100 mb-1">Pre-Tax Deductions</h2>
        <p class="text-sm text-gray-400">
          Add any deductions taken from your paycheck before taxes, such as 401k, HSA, FSA, or health insurance
          premiums. These reduce your taxable income.
        </p>
      </div>
      <div class="bg-indigo-950/40 border border-indigo-800 rounded-lg p-3 text-xs text-indigo-200 space-y-1">
        <p>
          Enter the amount deducted <strong>per paycheck</strong>. The calculator will annualize these amounts based on
          your pay frequency to give you an accurate tax picture.
        </p>
      </div>
      <div class="space-y-2">
        {#each preTaxDeductions as deduction}
          <div class="flex items-center gap-2">
            <input
              type="text"
              class="input flex-1"
              placeholder="e.g. 401k, HSA"
              value={deduction.name}
              on:input={event => updatePreTaxDeduction(deduction.id, "name", (event.target as HTMLInputElement).value)}
            />
            <span class="text-gray-500 text-sm flex-shrink-0">$/check</span>
            <input
              type="number"
              class="input w-28"
              value={deduction.amountPerPaycheck}
              min="0"
              step="0.01"
              on:change={event =>
                updatePreTaxDeduction(deduction.id, "amountPerPaycheck", (event.target as HTMLInputElement).value)}
            />
            <button
              type="button"
              on:click={() => removePreTaxDeduction(deduction.id)}
              class="text-gray-600 hover:text-red-400 transition-colors"
              aria-label="Remove deduction"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        {/each}
        <button type="button" class="btn-secondary text-xs py-1 px-2" on:click={addPreTaxDeduction}>
          + Add Deduction
        </button>
      </div>

      {#if $paychecksStore.length === 0}
        <div class="bg-amber-900/30 border border-amber-700 rounded-lg p-3 text-xs text-amber-300">
          No paychecks found. For the most accurate results, add your income sources in the Accounts page first.
        </div>
      {:else}
        <div class="bg-gray-800 rounded-lg p-3 text-xs text-gray-400">
          <span class="text-gray-300 font-medium">{$paychecksStore.length} income source{$paychecksStore.length !== 1 ? "s" : ""} found</span> —
          all will be included in the calculation. You can adjust this later in the Tax Profile tab.
        </div>
      {/if}
    </div>
  {/if}

  <!-- Navigation -->
  <div class="flex items-center justify-between">
    <button
      type="button"
      class="btn-secondary"
      disabled={step === 1}
      on:click={() => (step -= 1)}
    >
      Back
    </button>
    {#if step < totalSteps}
      <button type="button" class="btn-primary" on:click={() => (step += 1)}>
        Next
      </button>
    {:else}
      <button type="button" class="btn-primary" on:click={finish}>
        Finish Setup
      </button>
    {/if}
  </div>
</div>
