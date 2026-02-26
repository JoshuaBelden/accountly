<script lang="ts">
  export let data: { label: string; amount: number; color: string }[]

  $: total = data.reduce((s, d) => s + d.amount, 0)

  const width = 300
  const height = 300
  const cx = width / 2
  const cy = height / 2
  const r = 110
  const innerR = 65

  function polarToCartesian(angle: number, radius: number) {
    const rad = (angle - 90) * (Math.PI / 180)
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
  }

  function describeArc(startAngle: number, endAngle: number) {
    const start = polarToCartesian(endAngle, r)
    const end = polarToCartesian(startAngle, r)
    const startInner = polarToCartesian(endAngle, innerR)
    const endInner = polarToCartesian(startAngle, innerR)
    const largeArc = endAngle - startAngle > 180 ? 1 : 0
    return [
      "M",
      start.x,
      start.y,
      "A",
      r,
      r,
      0,
      largeArc,
      0,
      end.x,
      end.y,
      "L",
      endInner.x,
      endInner.y,
      "A",
      innerR,
      innerR,
      0,
      largeArc,
      1,
      startInner.x,
      startInner.y,
      "Z",
    ].join(" ")
  }

  $: segments = (() => {
    let angle = 0
    return data.map(d => {
      const sweep = total > 0 ? (d.amount / total) * 360 : 0
      const seg = { ...d, startAngle: angle, endAngle: angle + sweep }
      angle += sweep
      return seg
    })
  })()
</script>

{#if total === 0}
  <div class="flex items-center justify-center h-40 text-gray-500 text-sm">No spending data</div>
{:else}
  <div class="flex flex-col items-center gap-4">
    <svg viewBox="0 0 {width} {height}" class="w-40 h-40 flex-shrink-0">
      {#each segments as seg}
        {#if seg.endAngle - seg.startAngle > 0.5}
          <path d={describeArc(seg.startAngle, seg.endAngle)} fill={seg.color} opacity="0.85" />
        {/if}
      {/each}
      <text x={cx} y={cy - 8} text-anchor="middle" class="fill-gray-300 text-xs font-medium" font-size="11">Total</text>
      <text x={cx} y={cy + 10} text-anchor="middle" class="fill-gray-100 font-bold" font-size="14"
        >${(total / 1000).toFixed(1)}k</text
      >
    </svg>

    <div class="w-full flex flex-col gap-1.5">
      {#each data as d}
        <div class="flex items-center gap-2 text-xs">
          <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background: {d.color}"></span>
          <span class="text-gray-300 truncate">{d.label}</span>
          <span class="text-gray-500 ml-auto tabular-nums">${d.amount.toFixed(0)}</span>
        </div>
      {/each}
    </div>
  </div>
{/if}
