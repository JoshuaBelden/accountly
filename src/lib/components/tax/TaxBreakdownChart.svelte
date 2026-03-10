<script lang="ts">
  import type { AnnualTaxEstimate } from "$lib/types/tax"
  import { formatCurrency } from "$lib/utils/currency"

  export let estimate: AnnualTaxEstimate

  const width = 300
  const height = 300
  const cx = width / 2
  const cy = height / 2
  const outerRadius = 110
  const innerRadius = 65

  $: netIncome = estimate.grossIncome - estimate.preTaxDeductions - estimate.totalTax

  $: slices = [
    { label: "Federal Tax", amount: estimate.federalTax, color: "#6366f1" },
    { label: "State Tax", amount: estimate.stateTax, color: "#8b5cf6" },
    { label: "Social Security", amount: estimate.socialSecurityTax, color: "#a78bfa" },
    { label: "Medicare", amount: estimate.medicareTax, color: "#c4b5fd" },
    { label: "Net Take-Home", amount: Math.max(0, netIncome), color: "#10b981" },
  ].filter(slice => slice.amount > 0)

  $: total = slices.reduce((sum, slice) => sum + slice.amount, 0)

  function polarToCartesian(angle: number, radius: number) {
    const rad = (angle - 90) * (Math.PI / 180)
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
  }

  function describeArc(startAngle: number, endAngle: number) {
    const start = polarToCartesian(endAngle, outerRadius)
    const end = polarToCartesian(startAngle, outerRadius)
    const startInner = polarToCartesian(endAngle, innerRadius)
    const endInner = polarToCartesian(startAngle, innerRadius)
    const largeArc = endAngle - startAngle > 180 ? 1 : 0
    return [
      "M", start.x, start.y,
      "A", outerRadius, outerRadius, 0, largeArc, 0, end.x, end.y,
      "L", endInner.x, endInner.y,
      "A", innerRadius, innerRadius, 0, largeArc, 1, startInner.x, startInner.y,
      "Z",
    ].join(" ")
  }

  $: segments = (() => {
    let angle = 0
    return slices.map(slice => {
      const sweep = total > 0 ? (slice.amount / total) * 360 : 0
      const segment = { ...slice, startAngle: angle, endAngle: angle + sweep }
      angle += sweep
      return segment
    })
  })()

  let hoveredLabel: string | null = null
</script>

<div class="card space-y-4">
  <h3 class="text-base font-semibold text-gray-100">Income Breakdown</h3>

  {#if total === 0}
    <p class="text-sm text-gray-500 text-center py-4">No data to display</p>
  {:else}
    <div class="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <svg viewBox="0 0 {width} {height}" class="w-44 h-44 flex-shrink-0">
        {#each segments as segment}
          {#if segment.endAngle - segment.startAngle > 0.5}
            <path
              role="presentation"
              d={describeArc(segment.startAngle, segment.endAngle)}
              fill={segment.color}
              opacity={hoveredLabel === null || hoveredLabel === segment.label ? 0.9 : 0.35}
              class="cursor-pointer transition-opacity"
              on:mouseenter={() => (hoveredLabel = segment.label)}
              on:mouseleave={() => (hoveredLabel = null)}
            />
          {/if}
        {/each}
        <text x={cx} y={cy - 8} text-anchor="middle" class="fill-gray-400" font-size="10">Gross</text>
        <text x={cx} y={cy + 10} text-anchor="middle" class="fill-gray-100 font-bold" font-size="14">
          ${(estimate.grossIncome / 1000).toFixed(0)}k
        </text>
      </svg>

      <div class="flex-1 w-full space-y-1.5">
        {#each slices as slice}
          <div
            role="presentation"
            class="flex items-center gap-2 text-xs cursor-default"
            on:mouseenter={() => (hoveredLabel = slice.label)}
            on:mouseleave={() => (hoveredLabel = null)}
          >
            <span
              class="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-opacity"
              style="background: {slice.color}; opacity: {hoveredLabel === null || hoveredLabel === slice.label ? 1 : 0.4}"
            ></span>
            <span class="text-gray-300 truncate">{slice.label}</span>
            <span class="text-gray-500 ml-auto tabular-nums">{formatCurrency(slice.amount)}</span>
            <span class="text-gray-600 tabular-nums w-10 text-right">
              {total > 0 ? ((slice.amount / estimate.grossIncome) * 100).toFixed(1) : "0"}%
            </span>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
