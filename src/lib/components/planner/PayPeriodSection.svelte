<script lang="ts">
  import BillRow from "$lib/components/planner/BillRow.svelte"
  import IncomeRow from "$lib/components/planner/IncomeRow.svelte"
  import type { PlannedBillAssignment, Transaction } from "$lib/types"
  import { formatCurrency } from "$lib/utils/currency"
  import type { PayPeriodBucket } from "$lib/utils/planner"

  export let bucket: PayPeriodBucket
  export let plannerMonth: string
  export let monthAssignments: PlannedBillAssignment[]
  export let monthTransactions: Transaction[]

  $: clearedBillTotal = bucket.bills.filter(item => item.isPaid).reduce((sum, item) => sum + item.amount, 0)
  $: unclearedBillTotal = bucket.bills.filter(item => !item.isPaid).reduce((sum, item) => sum + item.amount, 0)
</script>

<div class="card">
  <h2 class="text-sm font-semibold text-gray-100 mb-3">{bucket.label}</h2>

  <div class="space-y-1.5 mb-4">
    <div class="flex items-center text-sm">
      <span class="flex-1 text-gray-400">Income</span>
      <span class="w-28 text-right tabular-nums text-emerald-400">+{formatCurrency(bucket.income)}</span>
    </div>
    <div class="flex items-center text-sm">
      <span class="flex-1 text-gray-400">Bills cleared</span>
      <span class="w-28 text-right tabular-nums text-red-400">-{formatCurrency(clearedBillTotal)}</span>
    </div>
    <div class="flex items-center text-sm">
      <span class="flex-1 text-gray-400">Bills not cleared</span>
      <span class="w-28 text-right tabular-nums text-red-400">-{formatCurrency(unclearedBillTotal)}</span>
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

  <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Bills</h3>
  {#if bucket.bills.length > 0}
    <div class="space-y-0.5">
      {#each bucket.bills as item (item.bill.id)}
        <BillRow bill={item.bill} assignment={monthAssignments.find(a => a.billId === item.bill.id) ?? null} {plannerMonth} />
      {/each}
    </div>
  {:else}
    <p class="text-xs text-gray-600">No bills due in this window.</p>
  {/if}
</div>
