<script lang="ts">
  import type { Paycheck, Transaction } from "$lib/types"
  import { formatCurrency } from "$lib/utils/currency"
  import { formatDateShort } from "$lib/utils/date"

  export let paycheck: Paycheck
  export let paycheckDate: string
  export let monthTransactions: Transaction[]

  $: isOtherIncome = paycheck.incomeType === "other"
  $: paycheckTx = monthTransactions.find(
    t =>
      t.paycheckId === paycheck.id &&
      t.plannedPaycheckDate === paycheckDate &&
      t.type === "income" &&
      t.clearedStatus === "cleared",
  )
  $: isReceived = !!paycheckTx
  $: displayAmount = isReceived && paycheckTx ? paycheckTx.amount : paycheck.expectedAmount
</script>

<div class="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-800/50 transition-colors">
  <div class="flex flex-col">
    <div class="text-xs text-gray-500 uppercase tracking-wide">{isOtherIncome ? "Other Income" : "Paycheck"}</div>
    <div class="font-semibold text-gray-100">{paycheck.name}</div>
    <div class="text-sm text-indigo-300">{formatDateShort(paycheckDate)}</div>
  </div>

  <div class="flex flex-col items-end gap-1">
    <div class="text-sm text-emerald-400 font-medium">+{formatCurrency(displayAmount)}</div>
    {#if isReceived}
      <span
        class="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-emerald-900/40 text-emerald-400 border border-emerald-700/50"
      >
        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
        </svg>
        Received
      </span>
    {:else}
      <span class="text-xs text-gray-600">Not received</span>
    {/if}
  </div>
</div>
