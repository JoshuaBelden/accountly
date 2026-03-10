<script lang="ts">
  import type { TaxBracket } from "$lib/types/tax"
  import { formatCurrency } from "$lib/utils/currency"

  export let brackets: TaxBracket[]
  export let taxableIncome: number
  export let label = "Tax Bracket Breakdown"

  const chartWidth = 560
  const chartHeight = 220
  const barHeight = 40
  const paddingLeft = 110
  const paddingRight = 16
  const paddingTop = 20
  const innerWidth = chartWidth - paddingLeft - paddingRight

  // Colors from light to dark as rate increases
  const bracketColors = ["#a5b4fc", "#818cf8", "#6366f1", "#4f46e5", "#4338ca", "#3730a3", "#312e81"]

  $: sorted = [...brackets].sort((firstBracket, secondBracket) => firstBracket.min - secondBracket.min)

  interface BracketSegment {
    bracket: TaxBracket
    incomeInBracket: number
    taxInBracket: number
    color: string
    xStart: number
    width: number
    rateIndex: number
  }

  $: segments = (() => {
    if (taxableIncome <= 0 || sorted.length === 0) return [] as BracketSegment[]
    let remaining = taxableIncome
    const results: BracketSegment[] = []
    for (let index = 0; index < sorted.length; index++) {
      const bracket = sorted[index]
      const bracketTop = bracket.max ?? Infinity
      const bracketWidth = bracketTop - bracket.min
      const incomeInBracket = Math.min(remaining, bracketWidth)
      if (incomeInBracket <= 0) break
      results.push({ bracket, incomeInBracket, taxInBracket: incomeInBracket * bracket.rate, color: "", rateIndex: index, xStart: 0, width: 0 })
      remaining -= incomeInBracket
      if (remaining <= 0) break
    }
    // Compute x positions and widths proportional to income
    let xCursor = 0
    return results.map(segment => {
      const proportionalWidth = taxableIncome > 0 ? (segment.incomeInBracket / taxableIncome) * innerWidth : 0
      const updated = { ...segment, color: bracketColors[Math.min(segment.rateIndex, bracketColors.length - 1)], xStart: xCursor, width: proportionalWidth }
      xCursor += proportionalWidth
      return updated
    })
  })()

  let hoveredIndex: number | null = null
</script>

{#if brackets.length === 0 || taxableIncome <= 0}
  <div class="card">
    <p class="text-sm text-gray-500 text-center py-4">
      {brackets.length === 0 ? "Add tax brackets to see the breakdown." : "No taxable income to visualize."}
    </p>
  </div>
{:else}
  <div class="card space-y-3">
    <h3 class="text-base font-semibold text-gray-100">{label}</h3>
    <p class="text-xs text-gray-500">
      Each bar segment shows the portion of your taxable income ({formatCurrency(taxableIncome)}) that falls within each
      bracket, and how much tax is owed on that portion.
    </p>

    <div class="overflow-x-auto">
      <svg viewBox="0 0 {chartWidth} {chartHeight}" class="w-full" style="min-width: 320px">
        <!-- Y-axis label -->
        <text x={paddingLeft - 8} y={paddingTop + barHeight / 2 + 4} text-anchor="end" class="fill-gray-400" font-size="11">Income</text>

        <!-- Bar segments -->
        {#each segments as segment, index}
          <g
            role="presentation"
            on:mouseenter={() => (hoveredIndex = index)}
            on:mouseleave={() => (hoveredIndex = null)}
            class="cursor-pointer"
          >
            <rect
              x={paddingLeft + segment.xStart}
              y={paddingTop}
              width={Math.max(0, segment.width - 1)}
              height={barHeight}
              fill={segment.color}
              opacity={hoveredIndex === null || hoveredIndex === index ? 0.9 : 0.4}
              rx="2"
            />
            {#if segment.width > 40}
              <text
                x={paddingLeft + segment.xStart + segment.width / 2}
                y={paddingTop + barHeight / 2 - 3}
                text-anchor="middle"
                class="fill-white font-semibold pointer-events-none"
                font-size="10"
              >
                {(segment.bracket.rate * 100).toFixed(0)}%
              </text>
              <text
                x={paddingLeft + segment.xStart + segment.width / 2}
                y={paddingTop + barHeight / 2 + 10}
                text-anchor="middle"
                class="fill-white/70 pointer-events-none"
                font-size="9"
              >
                ${(segment.incomeInBracket / 1000).toFixed(0)}k
              </text>
            {/if}
          </g>
        {/each}

        <!-- Hover tooltip -->
        {#if hoveredIndex !== null && segments[hoveredIndex]}
          {@const seg = segments[hoveredIndex]}
          {@const tooltipX = Math.min(paddingLeft + seg.xStart + seg.width / 2, chartWidth - 130)}
          <g>
            <rect x={tooltipX} y={paddingTop + barHeight + 8} width="126" height="58" rx="4" fill="#1f2937" stroke="#374151" stroke-width="1" />
            <text x={tooltipX + 8} y={paddingTop + barHeight + 24} class="fill-gray-300 font-medium" font-size="10">
              {(seg.bracket.rate * 100).toFixed(1)}% bracket
            </text>
            <text x={tooltipX + 8} y={paddingTop + barHeight + 38} class="fill-gray-400" font-size="9">
              Income in bracket: {formatCurrency(seg.incomeInBracket)}
            </text>
            <text x={tooltipX + 8} y={paddingTop + barHeight + 52} class="fill-indigo-300" font-size="9">
              Tax owed: {formatCurrency(seg.taxInBracket)}
            </text>
          </g>
        {/if}

        <!-- Legend below -->
        {#each segments as segment, index}
          {@const legendX = paddingLeft + segment.xStart + segment.width / 2}
          {#if segment.width > 30}
            <line
              x1={legendX}
              y1={paddingTop + barHeight}
              x2={legendX}
              y2={paddingTop + barHeight + (hoveredIndex !== null ? 80 : 14)}
              stroke={segment.color}
              stroke-width="1"
              opacity="0.4"
            />
          {/if}
        {/each}
      </svg>
    </div>

    <!-- Summary row -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
      {#each segments as segment}
        <div class="text-xs space-y-0.5">
          <div class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full flex-shrink-0" style="background: {segment.color}"></span>
            <span class="text-gray-400">{(segment.bracket.rate * 100).toFixed(0)}% bracket</span>
          </div>
          <div class="text-gray-200 font-medium pl-3.5">{formatCurrency(segment.taxInBracket)}</div>
          <div class="text-gray-600 pl-3.5">on {formatCurrency(segment.incomeInBracket)}</div>
        </div>
      {/each}
    </div>
  </div>
{/if}
