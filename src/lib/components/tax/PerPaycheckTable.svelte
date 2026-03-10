<script lang="ts">
  import type { PerPaycheckRecommended } from "$lib/types/tax"
  import { formatCurrency } from "$lib/utils/currency"

  export let rows: PerPaycheckRecommended[]
</script>

<div class="card space-y-4">
  <div>
    <h3 class="text-base font-semibold text-gray-100">Recommended Per-Paycheck Withholding</h3>
    <p class="text-xs text-gray-500 mt-1">
      These are the amounts that should be withheld from each paycheck to cover your annual tax liability.
      Compare these to what your employer is actually withholding.
    </p>
  </div>

  {#if rows.length === 0}
    <p class="text-sm text-gray-500 italic">No income sources included in your tax profile.</p>
  {:else}
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-xs text-gray-500 border-b border-gray-700">
            <th class="pb-2 pr-4 font-medium">Income Source</th>
            <th class="pb-2 pr-4 font-medium text-right">Gross/Check</th>
            <th class="pb-2 pr-4 font-medium text-right">Pre-Tax</th>
            <th class="pb-2 pr-4 font-medium text-right">Federal</th>
            <th class="pb-2 pr-4 font-medium text-right">State</th>
            <th class="pb-2 pr-4 font-medium text-right">FICA</th>
            <th class="pb-2 pr-4 font-medium text-right">Total W/H</th>
            <th class="pb-2 font-medium text-right">Est. Net</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-800">
          {#each rows as row}
            <tr class="hover:bg-gray-800/50 transition-colors">
              <td class="py-3 pr-4">
                <div class="text-gray-200 font-medium">{row.paycheckName}</div>
                <div class="text-xs text-gray-500">{row.checksPerYear}x / year</div>
              </td>
              <td class="py-3 pr-4 text-right text-gray-300 tabular-nums">{formatCurrency(row.grossPerCheck)}</td>
              <td class="py-3 pr-4 text-right text-emerald-400 tabular-nums">
                {row.preTaxDeductionsPerCheck > 0 ? `−${formatCurrency(row.preTaxDeductionsPerCheck)}` : "—"}
              </td>
              <td class="py-3 pr-4 text-right text-indigo-300 tabular-nums">{formatCurrency(row.federalRecommended)}</td>
              <td class="py-3 pr-4 text-right text-purple-300 tabular-nums">{formatCurrency(row.stateRecommended)}</td>
              <td class="py-3 pr-4 text-right text-violet-300 tabular-nums">
                {formatCurrency(row.socialSecurityRecommended + row.medicareRecommended)}
              </td>
              <td class="py-3 pr-4 text-right text-gray-100 font-semibold tabular-nums">
                {formatCurrency(row.totalRecommended)}
              </td>
              <td class="py-3 text-right tabular-nums {row.netPerCheck >= 0 ? 'text-emerald-400' : 'text-red-400'}">
                {formatCurrency(row.netPerCheck)}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <div class="text-xs text-gray-600 pt-1">
      FICA = Social Security + Medicare. "Est. Net" = Gross minus pre-tax deductions and all withholding.
    </div>
  {/if}
</div>
