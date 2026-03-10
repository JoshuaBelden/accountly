<script lang="ts">
  import { createEventDispatcher } from "svelte"
  import { paychecksStore } from "$lib/stores/paychecks.store"
  import type { TaxBracket, TaxProfile, PreTaxDeduction, FilingStatus } from "$lib/types/tax"
  import BracketTable from "./BracketTable.svelte"

  export let profile: TaxProfile | null = null

  const dispatch = createEventDispatcher<{ save: TaxProfile }>()

  const now = new Date().toISOString()

  let taxYear = profile?.taxYear ?? new Date().getFullYear()
  let filingStatus: FilingStatus = profile?.filingStatus ?? "single"
  let federalBrackets: TaxBracket[] = profile?.federalBrackets ?? []
  let federalStandardDeduction = profile?.federalStandardDeduction ?? 14600
  let stateName = profile?.stateName ?? ""
  let stateBrackets: TaxBracket[] = profile?.stateBrackets ?? []
  let stateStandardDeduction = profile?.stateStandardDeduction ?? 0
  let preTaxDeductions: PreTaxDeduction[] = profile?.preTaxDeductions ?? []
  let includedPaycheckIds: string[] = profile?.includedPaycheckIds ?? []

  let showFederalHelp = false
  let showStateHelp = false
  let showDeductionHelp = false
  let showPreTaxHelp = false

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

  function togglePaycheck(id: string) {
    if (includedPaycheckIds.includes(id)) {
      includedPaycheckIds = includedPaycheckIds.filter(existingId => existingId !== id)
    } else {
      includedPaycheckIds = [...includedPaycheckIds, id]
    }
  }

  function handleSubmit() {
    const saved: TaxProfile = {
      id: profile?.id ?? crypto.randomUUID(),
      taxYear,
      filingStatus,
      federalBrackets,
      federalStandardDeduction,
      stateName,
      stateBrackets,
      stateStandardDeduction,
      preTaxDeductions,
      includedPaycheckIds,
      createdAt: profile?.createdAt ?? now,
      updatedAt: now,
    }
    dispatch("save", saved)
  }
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-8">
  <!-- General -->
  <section class="space-y-4">
    <h3 class="text-base font-semibold text-gray-100">General</h3>
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="label" for="tax-year">Tax Year</label>
        <input id="tax-year" type="number" class="input" bind:value={taxYear} min="2020" max="2030" />
      </div>
      <div>
        <label class="label" for="filing-status">Filing Status</label>
        <select id="filing-status" class="input" bind:value={filingStatus}>
          <option value="single">Single</option>
          <option value="marriedFilingJointly">Married Filing Jointly</option>
          <option value="marriedFilingSeparately">Married Filing Separately</option>
          <option value="headOfHousehold">Head of Household</option>
        </select>
        <p class="text-xs text-gray-500 mt-1">
          {#if filingStatus === "single"}
            For unmarried filers without qualifying dependents.
          {:else if filingStatus === "marriedFilingJointly"}
            For married couples combining income on one return — usually the most beneficial status.
          {:else if filingStatus === "marriedFilingSeparately"}
            Married couples filing separate returns. Rarely advantageous.
          {:else}
            For unmarried filers who paid more than half the cost of keeping a home for a qualifying person.
          {/if}
        </p>
      </div>
    </div>
  </section>

  <!-- Federal Brackets -->
  <section class="space-y-4">
    <div class="flex items-center gap-2">
      <h3 class="text-base font-semibold text-gray-100">Federal Income Tax</h3>
      <button
        type="button"
        on:click={() => (showFederalHelp = !showFederalHelp)}
        class="w-5 h-5 rounded-full bg-gray-700 text-gray-400 text-xs flex items-center justify-center hover:bg-gray-600"
        aria-label="Toggle help"
      >?</button>
    </div>
    {#if showFederalHelp}
      <div class="bg-indigo-950/50 border border-indigo-800 rounded-lg p-3 text-xs text-indigo-200 space-y-1">
        <p><strong>Marginal tax brackets</strong> mean you pay each rate only on the income within that range — not on your full income.</p>
        <p>For example, if the 22% bracket covers $44,725–$95,375, you only pay 22% on the income that falls <em>within</em> that range.</p>
        <p>Look up the current brackets at <span class="font-medium text-indigo-300">irs.gov</span> and enter them below.</p>
      </div>
    {/if}
    <BracketTable
      label="Federal Brackets"
      brackets={federalBrackets}
      on:change={event => (federalBrackets = event.detail)}
    />
    <div>
      <div class="flex items-center gap-2 mb-1">
        <label class="label mb-0" for="federal-deduction">Standard Deduction</label>
        <button
          type="button"
          on:click={() => (showDeductionHelp = !showDeductionHelp)}
          class="w-5 h-5 rounded-full bg-gray-700 text-gray-400 text-xs flex items-center justify-center hover:bg-gray-600"
          aria-label="Toggle deduction help"
        >?</button>
      </div>
      {#if showDeductionHelp}
        <p class="text-xs text-indigo-200 bg-indigo-950/50 border border-indigo-800 rounded p-2 mb-2">
          The standard deduction is subtracted from your Adjusted Gross Income before applying brackets. For 2024, it's
          $14,600 (single) or $29,200 (married filing jointly). Enter 0 to use itemized deductions instead.
        </p>
      {/if}
      <input
        id="federal-deduction"
        type="number"
        class="input w-40"
        bind:value={federalStandardDeduction}
        min="0"
      />
    </div>
  </section>

  <!-- State Brackets -->
  <section class="space-y-4">
    <div class="flex items-center gap-2">
      <h3 class="text-base font-semibold text-gray-100">State Income Tax</h3>
      <button
        type="button"
        on:click={() => (showStateHelp = !showStateHelp)}
        class="w-5 h-5 rounded-full bg-gray-700 text-gray-400 text-xs flex items-center justify-center hover:bg-gray-600"
        aria-label="Toggle state help"
      >?</button>
    </div>
    {#if showStateHelp}
      <div class="bg-indigo-950/50 border border-indigo-800 rounded-lg p-3 text-xs text-indigo-200 space-y-1">
        <p>Enter your state's tax brackets. If your state has a flat rate, add one bracket from $0 with no max and that rate.</p>
        <p>If your state has no income tax (e.g. Texas, Florida), leave the brackets empty.</p>
      </div>
    {/if}
    <div>
      <label class="label" for="state-name">State</label>
      <input id="state-name" type="text" class="input w-48" placeholder="e.g. California" bind:value={stateName} />
    </div>
    <BracketTable
      label="State Brackets"
      brackets={stateBrackets}
      on:change={event => (stateBrackets = event.detail)}
    />
    <div>
      <label class="label" for="state-deduction">State Standard Deduction</label>
      <input id="state-deduction" type="number" class="input w-40" bind:value={stateStandardDeduction} min="0" />
    </div>
  </section>

  <!-- Pre-Tax Deductions -->
  <section class="space-y-4">
    <div class="flex items-center gap-2">
      <h3 class="text-base font-semibold text-gray-100">Pre-Tax Deductions</h3>
      <button
        type="button"
        on:click={() => (showPreTaxHelp = !showPreTaxHelp)}
        class="w-5 h-5 rounded-full bg-gray-700 text-gray-400 text-xs flex items-center justify-center hover:bg-gray-600"
        aria-label="Toggle pre-tax help"
      >?</button>
    </div>
    {#if showPreTaxHelp}
      <div class="bg-indigo-950/50 border border-indigo-800 rounded-lg p-3 text-xs text-indigo-200 space-y-1">
        <p>Pre-tax deductions (401k, HSA, FSA, health insurance premiums) reduce your taxable income before brackets are applied, lowering your tax bill.</p>
        <p>Enter the amount deducted <strong>per paycheck</strong>. These will be annualized automatically based on your pay frequency.</p>
      </div>
    {/if}
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
  </section>

  <!-- Included Paychecks -->
  <section class="space-y-3">
    <h3 class="text-base font-semibold text-gray-100">Included Income Sources</h3>
    <p class="text-xs text-gray-500">
      Select which paychecks to include in your tax calculation. Leave all unchecked to include all income sources.
    </p>
    <div class="space-y-2">
      {#each $paychecksStore as paycheck}
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            class="w-4 h-4 rounded border-gray-600 bg-gray-700 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
            checked={includedPaycheckIds.length === 0 || includedPaycheckIds.includes(paycheck.id)}
            on:change={() => togglePaycheck(paycheck.id)}
          />
          <span class="text-sm text-gray-300">{paycheck.name}</span>
          <span class="text-xs text-gray-500 ml-auto">${paycheck.expectedAmount.toLocaleString()} / check · {paycheck.frequency}</span>
        </label>
      {/each}
      {#if $paychecksStore.length === 0}
        <p class="text-xs text-gray-500 italic">No paychecks found. Add income sources in the Accounts page first.</p>
      {/if}
    </div>
  </section>

  <div class="flex justify-end pt-2">
    <button type="submit" class="btn-primary">Save Tax Profile</button>
  </div>
</form>
