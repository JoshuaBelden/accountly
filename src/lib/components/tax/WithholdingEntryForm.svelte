<script lang="ts">
  import { createEventDispatcher } from "svelte"
  import { paychecksStore } from "$lib/stores/paychecks.store"
  import type { WithholdingEntry } from "$lib/types/tax"

  export let entry: WithholdingEntry | null = null
  export let defaultTaxYear: number = new Date().getFullYear()
  export let prefillPaycheckId: string | null = null
  export let prefillPayDate: string | null = null

  const dispatch = createEventDispatcher<{ save: WithholdingEntry; cancel: void }>()

  const now = new Date().toISOString()
  const today = now.slice(0, 10)

  let paycheckId = entry?.paycheckId ?? prefillPaycheckId ?? ($paychecksStore[0]?.id ?? "")
  let payDate = entry?.payDate ?? prefillPayDate ?? today
  let taxYear = entry?.taxYear ?? defaultTaxYear
  let federalWithheld = entry?.federalWithheld ?? 0
  let stateWithheld = entry?.stateWithheld ?? 0
  let socialSecurityWithheld = entry?.socialSecurityWithheld ?? 0
  let medicareWithheld = entry?.medicareWithheld ?? 0

  function handleSubmit() {
    const saved: WithholdingEntry = {
      id: entry?.id ?? crypto.randomUUID(),
      paycheckId,
      payDate,
      taxYear,
      federalWithheld,
      stateWithheld,
      socialSecurityWithheld,
      medicareWithheld,
      createdAt: entry?.createdAt ?? now,
      updatedAt: now,
    }
    dispatch("save", saved)
  }
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-4">
  <div class="grid grid-cols-2 gap-4">
    <div>
      <label class="label" for="wh-paycheck">Income Source</label>
      <select id="wh-paycheck" class="input" bind:value={paycheckId}>
        {#each $paychecksStore as paycheck}
          <option value={paycheck.id}>{paycheck.name}</option>
        {/each}
      </select>
    </div>
    <div>
      <label class="label" for="wh-date">Pay Date</label>
      <input id="wh-date" type="date" class="input" bind:value={payDate} />
    </div>
  </div>

  <div class="grid grid-cols-2 gap-4">
    <div>
      <label class="label" for="wh-federal">Federal Withheld</label>
      <div class="relative">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
        <input id="wh-federal" type="number" class="input pl-6" bind:value={federalWithheld} min="0" step="0.01" />
      </div>
    </div>
    <div>
      <label class="label" for="wh-state">State Withheld</label>
      <div class="relative">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
        <input id="wh-state" type="number" class="input pl-6" bind:value={stateWithheld} min="0" step="0.01" />
      </div>
    </div>
    <div>
      <label class="label" for="wh-ss">Social Security Withheld</label>
      <div class="relative">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
        <input id="wh-ss" type="number" class="input pl-6" bind:value={socialSecurityWithheld} min="0" step="0.01" />
      </div>
    </div>
    <div>
      <label class="label" for="wh-medicare">Medicare Withheld</label>
      <div class="relative">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
        <input id="wh-medicare" type="number" class="input pl-6" bind:value={medicareWithheld} min="0" step="0.01" />
      </div>
    </div>
  </div>

  <p class="text-xs text-gray-500">
    Find these amounts on your pay stub. Federal and state withholding are usually labeled "Fed Tax" and "State Tax".
    Social Security is often labeled "OASDI" or "SS Tax" (6.2%). Medicare is typically "Med Tax" (1.45%).
  </p>

  <div class="flex justify-end gap-2 pt-1">
    <button type="button" class="btn-secondary" on:click={() => dispatch("cancel")}>Cancel</button>
    <button type="submit" class="btn-primary">Save Entry</button>
  </div>
</form>
