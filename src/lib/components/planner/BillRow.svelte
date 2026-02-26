<script lang="ts">
  import { plannerStore } from "$lib/stores/planner.store"
  import { transactionsStore } from "$lib/stores/transactions.store"
  import type { Bill, PlannedBillAssignment } from "$lib/types"
  import { formatCurrency } from "$lib/utils/currency"
  import { formatDateShort } from "$lib/utils/date"

  export let bill: Bill
  export let assignment: PlannedBillAssignment | null
  export let plannerMonth: string

  $: transaction = assignment?.transactionId ? $transactionsStore.find(t => t.id === assignment.transactionId) : null
  $: clearedByImport = transaction?.clearedStatus === "cleared"
  $: isPaid = clearedByImport || assignment?.manuallyPaid === true
  $: displayAmount = clearedByImport && transaction ? transaction.amount : (assignment?.overrideAmount ?? bill.amount)

  function togglePaid() {
    if (clearedByImport) return
    plannerStore.setManuallyPaid(bill.id, plannerMonth, !assignment?.manuallyPaid)
  }
</script>

<div
  class="flex flex-col gap-1 py-2 px-3 rounded-lg {isPaid
    ? 'bg-emerald-950/30'
    : 'hover:bg-gray-800/50'} transition-colors"
>
  <div class="flex items-center gap-3">
    {#if bill.autoPay}
      <!-- Autopay bills: read-only checked state -->
      <div
        class="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center {isPaid
          ? 'bg-emerald-500 border-emerald-500'
          : 'border-gray-600'}"
        title="Autopay — paid automatically"
      >
        {#if isPaid}
          <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
          </svg>
        {/if}
      </div>
    {:else}
      <!-- Non-autopay: interactive checkbox -->
      <button
        on:click={togglePaid}
        disabled={clearedByImport}
        title={clearedByImport ? "Cleared via imported transaction" : isPaid ? "Mark as unpaid" : "Mark as paid"}
        class="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors {isPaid
          ? 'bg-emerald-500 border-emerald-500'
          : 'border-gray-600 hover:border-emerald-500'} {clearedByImport ? 'cursor-default' : 'cursor-pointer'}"
      >
        {#if isPaid}
          <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
          </svg>
        {/if}
      </button>
    {/if}

    <div class="flex-1 min-w-0">
      <span class="text-sm {isPaid ? 'line-through text-gray-500' : 'text-gray-200'} truncate">
        {bill.name}
      </span>
      {#if bill.dueDayOfMonth}
        <span class="text-xs text-gray-600 ml-1">due {bill.dueDayOfMonth}</span>
      {/if}
    </div>

    {#if bill.autoPay}
      <span class="badge-gray">Autopay</span>
    {/if}

    <span class="text-sm tabular-nums text-right w-24 {isPaid ? 'text-gray-500' : 'text-gray-200'}">
      {formatCurrency(displayAmount)}
    </span>
  </div>

  {#if clearedByImport && transaction}
    <div class="ml-8 text-xs text-emerald-600 truncate">
      {formatDateShort(transaction.date)} · {transaction.description}
    </div>
  {/if}
</div>
