<script lang="ts">
  import Badge from "$lib/components/shared/Badge.svelte"
  import HoldToDelete from "$lib/components/shared/HoldToDelete.svelte"
  import type { AssetAccount } from "$lib/types"
  import { formatCurrency } from "$lib/utils/currency"
  import { createEventDispatcher } from "svelte"

  export let asset: AssetAccount

  const dispatch = createEventDispatcher()

  $: equity = asset.estimatedValue - (asset.remainingBalance ?? 0)

  const subtypeLabels: Record<string, string> = {
    mortgage: "Mortgage",
    vehicle: "Vehicle",
    other: "Asset",
  }
</script>

<div class="card space-y-3">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-full bg-amber-900 flex items-center justify-center">
        <svg class="w-5 h-5 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      </div>
      <div>
        <div class="font-medium text-gray-100">{asset.name}</div>
        <Badge variant="yellow">{subtypeLabels[asset.assetSubtype]}</Badge>
      </div>
    </div>
    <div class="flex gap-1">
      <button class="btn-ghost p-2" on:click={() => dispatch("edit", asset)} aria-label="Edit">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
          />
        </svg>
      </button>
      <HoldToDelete on:confirm={() => dispatch("delete", asset)} />
    </div>
  </div>

  <div class="grid grid-cols-3 gap-4 text-sm">
    <div>
      <div class="text-gray-500 text-xs">Market Value</div>
      <div class="font-semibold text-gray-100 tabular-nums">{formatCurrency(asset.estimatedValue)}</div>
    </div>
    {#if asset.remainingBalance}
      <div>
        <div class="text-gray-500 text-xs">Owed</div>
        <div class="font-semibold text-red-400 tabular-nums">{formatCurrency(asset.remainingBalance)}</div>
      </div>
      <div>
        <div class="text-gray-500 text-xs">Equity</div>
        <div class="font-semibold {equity >= 0 ? 'text-emerald-400' : 'text-red-400'} tabular-nums">
          {formatCurrency(equity)}
        </div>
      </div>
    {/if}
  </div>
</div>
