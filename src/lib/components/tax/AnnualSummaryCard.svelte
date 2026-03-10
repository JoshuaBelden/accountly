<script lang="ts">
  import type { AnnualTaxEstimate, PerPaycheckRecommended } from "$lib/types/tax"
  import { formatCurrency } from "$lib/utils/currency"

  export let estimate: AnnualTaxEstimate
  export let incomeBreakdown: PerPaycheckRecommended[] = []

  $: effectiveRatePct = (estimate.totalEffectiveRate * 100).toFixed(1)
  $: rateColor =
    estimate.totalEffectiveRate < 0.25
      ? "text-emerald-400 bg-emerald-900/40 border-emerald-700"
      : estimate.totalEffectiveRate < 0.35
        ? "text-amber-400 bg-amber-900/40 border-amber-700"
        : "text-red-400 bg-red-900/40 border-red-700"
</script>

<div class="card space-y-4">
  <div class="flex items-start justify-between">
    <h3 class="text-base font-semibold text-gray-100">Annual Tax Estimate</h3>
    <span class="px-2.5 py-1 rounded-full text-xs font-semibold border {rateColor}">
      {effectiveRatePct}% effective rate
    </span>
  </div>

  <div class="space-y-1.5 text-sm">
    <div class="border-b border-gray-800">
      <div class="flex justify-between py-1.5">
        <span class="text-gray-400">Gross Income</span>
        <span class="text-gray-100 tabular-nums">{formatCurrency(estimate.grossIncome)}</span>
      </div>
      {#if incomeBreakdown.length > 0}
        <div class="pb-1.5 space-y-0.5">
          {#each incomeBreakdown as row}
            <div class="flex justify-between pl-4 text-xs">
              <span class="text-gray-600">{row.paycheckName}</span>
              <span class="text-gray-600 tabular-nums">
                {formatCurrency(row.grossPerCheck)} × {row.checksPerYear} = {formatCurrency(row.grossPerCheck * row.checksPerYear)}
              </span>
            </div>
          {/each}
        </div>
      {/if}
    </div>
    {#if estimate.preTaxDeductions > 0}
      <div class="flex justify-between py-1.5 border-b border-gray-800">
        <span class="text-gray-400">Pre-Tax Deductions</span>
        <span class="text-emerald-400 tabular-nums">−{formatCurrency(estimate.preTaxDeductions)}</span>
      </div>
      <div class="flex justify-between py-1.5 border-b border-gray-800">
        <span class="text-gray-400">Adjusted Gross Income</span>
        <span class="text-gray-200 tabular-nums">{formatCurrency(estimate.federalAgi)}</span>
      </div>
    {/if}
    <div class="flex justify-between py-1.5 border-b border-gray-800">
      <span class="text-gray-400">Federal Taxable Income</span>
      <span class="text-gray-200 tabular-nums">{formatCurrency(estimate.federalTaxableIncome)}</span>
    </div>

    <div class="pt-1 space-y-1.5">
      <div class="flex justify-between py-1.5">
        <span class="text-gray-300">Federal Income Tax</span>
        <div class="flex items-baseline gap-2">
          <span class="text-xs text-gray-500">{(estimate.federalEffectiveRate * 100).toFixed(1)}%</span>
          <span class="text-gray-100 tabular-nums font-medium">{formatCurrency(estimate.federalTax)}</span>
        </div>
      </div>
      <div class="flex justify-between py-1.5">
        <span class="text-gray-300">State Income Tax</span>
        <div class="flex items-baseline gap-2">
          <span class="text-xs text-gray-500">{(estimate.stateEffectiveRate * 100).toFixed(1)}%</span>
          <span class="text-gray-100 tabular-nums font-medium">{formatCurrency(estimate.stateTax)}</span>
        </div>
      </div>
      <div class="flex justify-between py-1.5">
        <span class="text-gray-300">Social Security (6.2%)</span>
        <span class="text-gray-100 tabular-nums font-medium">{formatCurrency(estimate.socialSecurityTax)}</span>
      </div>
      <div class="flex justify-between py-1.5">
        <span class="text-gray-300">Medicare (1.45%+)</span>
        <span class="text-gray-100 tabular-nums font-medium">{formatCurrency(estimate.medicareTax)}</span>
      </div>
    </div>

    <div class="flex justify-between py-2 mt-1 border-t-2 border-gray-700">
      <span class="text-gray-100 font-semibold">Total Tax</span>
      <div class="flex items-baseline gap-2">
        <span class="text-xs text-gray-400">{effectiveRatePct}% of gross</span>
        <span class="text-gray-100 tabular-nums font-bold text-base">{formatCurrency(estimate.totalTax)}</span>
      </div>
    </div>

    <div class="flex justify-between py-1.5 pt-0 border-t border-gray-800">
      <span class="text-gray-400">Estimated Net Income</span>
      <span class="text-emerald-400 tabular-nums font-medium">
        {formatCurrency(estimate.grossIncome - estimate.preTaxDeductions - estimate.totalTax)}
      </span>
    </div>
  </div>
</div>
