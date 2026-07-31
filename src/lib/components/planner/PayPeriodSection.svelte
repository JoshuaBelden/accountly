<script lang="ts">
  import IncomeRow from "$lib/components/planner/IncomeRow.svelte"
  import PaymentRow from "$lib/components/planner/PaymentRow.svelte"
  import type { PlannedPaymentAssignment, Transaction } from "$lib/types"
  import { formatCurrency } from "$lib/utils/currency"
  import type { PayPeriodBucket } from "$lib/utils/planner"

  export let bucket: PayPeriodBucket
  export let plannerMonth: string
  export let monthAssignments: PlannedPaymentAssignment[]
  export let monthTransactions: Transaction[]

  $: clearedPaymentTotal = bucket.payments.filter(item => item.isPaid).reduce((sum, item) => sum + item.amount, 0)
  $: unclearedPaymentTotal = bucket.payments.filter(item => !item.isPaid).reduce((sum, item) => sum + item.amount, 0)

  function findAssignment(item: PayPeriodBucket["payments"][number]) {
    return (
      monthAssignments.find(a => (item.kind === "bill" ? a.billId === item.id : a.loanAccountId === item.id)) ?? null
    )
  }
</script>

<div class="card">
  <h2 class="text-sm font-semibold text-gray-100 mb-3">{bucket.label}</h2>

  <div class="space-y-1.5 mb-4">
    <div class="flex items-center text-sm">
      <span class="flex-1 text-gray-400">Income</span>
      <span class="w-28 text-right tabular-nums text-emerald-400">+{formatCurrency(bucket.income)}</span>
    </div>
    <div class="flex items-center text-sm">
      <span class="flex-1 text-gray-400">Bills & loans cleared</span>
      <span class="w-28 text-right tabular-nums text-red-400">-{formatCurrency(clearedPaymentTotal)}</span>
    </div>
    <div class="flex items-center text-sm">
      <span class="flex-1 text-gray-400">Bills & loans not cleared</span>
      <span class="w-28 text-right tabular-nums text-red-400">-{formatCurrency(unclearedPaymentTotal)}</span>
    </div>
    <div class="flex items-center text-sm font-semibold border-t border-gray-700 pt-2">
      <span class="flex-1 text-gray-200">Net</span>
      <span class="w-28 text-right tabular-nums {bucket.net >= 0 ? 'text-emerald-400' : 'text-red-400'}">
        {formatCurrency(bucket.net)}
      </span>
    </div>
  </div>

  {#if bucket.incomeItems.length > 0}
    <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Income</h3>
    <div class="space-y-0.5 mb-4">
      {#each bucket.incomeItems as item (`${item.paycheck.id}-${item.date}`)}
        <IncomeRow paycheck={item.paycheck} paycheckDate={item.date} {monthTransactions} />
      {/each}
    </div>
  {/if}

  <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Bills & Loans</h3>
  {#if bucket.payments.length > 0}
    <div class="space-y-0.5">
      {#each bucket.payments as item (`${item.kind}-${item.id}`)}
        <PaymentRow kind={item.kind} source={item.source} assignment={findAssignment(item)} {plannerMonth} />
      {/each}
    </div>
  {:else}
    <p class="text-xs text-gray-600">No bills or loan payments due in this window.</p>
  {/if}
</div>
