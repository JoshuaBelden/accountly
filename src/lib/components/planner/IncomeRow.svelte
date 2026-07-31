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

<div
  class="flex items-center gap-3 py-2 px-3 rounded-lg {isReceived ? 'bg-emerald-950/30' : 'hover:bg-gray-800/50'} transition-colors"
>
  <div
    class="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center {isReceived
      ? 'bg-emerald-500 border-emerald-500'
      : 'border-gray-600'}"
    title={isReceived ? "Received" : "Not received"}
  >
    {#if isReceived}
      <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
      </svg>
    {/if}
  </div>

  <div class="flex-1 min-w-0">
    <span class="text-sm {isReceived ? 'text-gray-200' : 'text-gray-300'} truncate">{paycheck.name}</span>
    <span class="text-xs text-gray-600 ml-1">{formatDateShort(paycheckDate)}</span>
    {#if isOtherIncome}
      <span class="text-xs text-gray-600 ml-1">other income</span>
    {/if}
  </div>

  <span class="text-sm tabular-nums text-right w-24 text-emerald-400">+{formatCurrency(displayAmount)}</span>
</div>
