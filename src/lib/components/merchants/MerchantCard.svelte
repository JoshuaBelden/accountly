<script lang="ts">
  import HoldToDelete from "$lib/components/shared/HoldToDelete.svelte"
  import type { Merchant } from "$lib/types"
  import { createEventDispatcher } from "svelte"

  export let merchant: Merchant
  export let categoryName = ""

  const dispatch = createEventDispatcher()
</script>

<div class="card flex items-center justify-between gap-4">
  <div class="flex items-center gap-3 min-w-0">
    <div class="w-10 h-10 rounded-full bg-indigo-900 flex-shrink-0 flex items-center justify-center">
      <svg class="w-5 h-5 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    </div>
    <div class="min-w-0">
      <div class="font-medium text-gray-100 truncate">{merchant.name}</div>
      <div class="flex items-center gap-2 flex-wrap mt-0.5">
        <span
          class="text-xs font-mono text-indigo-300 bg-indigo-950/40 border border-indigo-800/40 px-1.5 py-0.5 rounded truncate max-w-xs"
        >
          {merchant.hints}
        </span>
        {#if categoryName}
          <span class="text-xs text-gray-500">· {categoryName}</span>
        {/if}
      </div>
    </div>
  </div>

  <div class="flex gap-1 flex-shrink-0">
    <button class="btn-ghost p-2" on:click={() => dispatch("edit", merchant)} aria-label="Edit">
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
        />
      </svg>
    </button>
    <HoldToDelete on:confirm={() => dispatch("delete", merchant)} />
  </div>
</div>
