<script lang="ts">
  import { loanAccounts } from "$lib/stores/accounts.store"
  import { formatCurrency } from "$lib/utils/currency"
  import { loanPayoffDate, loanProgress } from "$lib/utils/finance"
</script>

<div class="card space-y-4">
  <h3 class="section-title">Financial Forecast</h3>

  {#if $loanAccounts.length === 0}
    <p class="text-gray-500 text-sm">Add loans in Accounts to see your payoff forecast.</p>
  {:else}
    <div class="space-y-5">
      {#each $loanAccounts as loan}
        {@const payoff = loanPayoffDate(loan)}
        {@const progress = loanProgress(loan)}
        <div class="space-y-2">
          <div class="flex justify-between items-start text-sm">
            <div>
              <div class="font-medium text-gray-100">{loan.name}</div>
              <div class="text-xs text-gray-500">
                {formatCurrency(loan.remainingBalance)} remaining · {formatCurrency(loan.minimumPayment)}/mo
              </div>
            </div>
            <div class="text-right">
              {#if payoff}
                <div class="text-sm font-medium text-indigo-300">
                  {payoff.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </div>
                <div class="text-xs text-gray-500">
                  {Math.max(0, Math.round((payoff.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)))} months
                </div>
              {:else}
                <div class="text-xs text-red-400">Payment too low</div>
              {/if}
            </div>
          </div>

          <div class="relative w-full bg-gray-700 rounded-full h-3">
            <div class="bg-indigo-500 h-3 rounded-full transition-all" style="width: {progress * 100}%"></div>
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="text-xs font-medium text-white drop-shadow">
                {(progress * 100).toFixed(0)}% paid
              </span>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
