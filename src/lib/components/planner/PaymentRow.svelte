<script lang="ts">
  import { plannerStore } from "$lib/stores/planner.store"
  import { transactionsStore } from "$lib/stores/transactions.store"
  import type { Bill, LoanAccount, PlannedPaymentAssignment } from "$lib/types"
  import { formatCurrency } from "$lib/utils/currency"
  import { formatDateShort } from "$lib/utils/date"
  import { resolvePaymentStatus } from "$lib/utils/planner"

  export let kind: "bill" | "loan"
  export let source: Bill | LoanAccount
  export let assignment: PlannedPaymentAssignment | null
  export let plannerMonth: string

  $: matchField = kind === "bill" ? ("billId" as const) : ("loanAccountId" as const)
  $: name = source.name
  $: dueDayOfMonth = kind === "bill" ? (source as Bill).dueDayOfMonth : (source as LoanAccount).paymentDueDay
  $: defaultAmount = kind === "bill" ? (source as Bill).amount : (source as LoanAccount).minimumPayment
  $: autoPay = kind === "bill" ? (source as Bill).autoPay : false

  $: status = resolvePaymentStatus(source.id, matchField, defaultAmount, assignment, $transactionsStore, plannerMonth)
  $: ({ transaction, clearedByImport, manuallyPaid, isPaid, amount: displayAmount } = status)
  $: isPastDue = !isPaid && !!dueDayOfMonth && isPastDueDate(plannerMonth, dueDayOfMonth)

  function isPastDueDate(month: string, day: number): boolean {
    const [year, monthNum] = month.split("-").map(Number)
    return new Date(year, monthNum - 1, day) < new Date()
  }

  function togglePaid() {
    if (clearedByImport) return
    const sourceRef = kind === "bill" ? { billId: source.id } : { loanAccountId: source.id }
    plannerStore.setManuallyPaid(sourceRef, plannerMonth, !assignment?.manuallyPaid)
  }
</script>

<div
  class="flex flex-col gap-1 py-2 px-3 rounded-lg {clearedByImport
    ? 'bg-emerald-950/30'
    : manuallyPaid
      ? 'bg-blue-950/30'
      : 'hover:bg-gray-800/50'} transition-colors"
>
  <div class="flex items-center gap-3">
    {#if autoPay}
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
        class="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors {clearedByImport
          ? 'bg-emerald-500 border-emerald-500 cursor-default'
          : manuallyPaid
            ? 'bg-blue-500 border-blue-500 cursor-pointer'
            : 'border-blue-500 hover:border-blue-400 cursor-pointer'}"
      >
        {#if isPaid}
          <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
          </svg>
        {/if}
      </button>
    {/if}

    <div class="flex-1 min-w-0">
      <span class="text-sm {isPaid ? 'line-through text-gray-500' : isPastDue ? 'text-red-400' : 'text-gray-200'} truncate">
        {name}
      </span>
      {#if kind === "loan"}
        <span class="text-xs text-violet-400 bg-violet-950/40 border border-violet-700/40 px-1 rounded ml-1">Loan</span>
      {/if}
      {#if dueDayOfMonth}
        <span class="text-xs {isPastDue ? 'text-red-500' : 'text-gray-600'} ml-1">due {dueDayOfMonth}</span>
      {/if}
      {#if autoPay}
        <span class="text-xs text-gray-600 ml-1">autopay</span>
      {/if}
    </div>

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
