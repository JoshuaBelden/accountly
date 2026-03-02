<script lang="ts">
  import Badge from "$lib/components/shared/Badge.svelte"
  import HoldToDelete from "$lib/components/shared/HoldToDelete.svelte"
  import type { CheckingAccount, SavingsAccount } from "$lib/types"
  import { formatCurrency } from "$lib/utils/currency"
  import { createEventDispatcher } from "svelte"

  export let account: CheckingAccount | SavingsAccount
  export let reorderable = false
  export let isFirst = false
  export let isLast = false

  const dispatch = createEventDispatcher()
</script>

<div class="card flex items-center justify-between gap-4">
  <div class="flex items-center gap-3">
    <div
      class="w-10 h-10 rounded-full flex items-center justify-center {account.type === 'checking'
        ? 'bg-blue-900'
        : 'bg-emerald-900'}"
    >
      <svg
        class="w-5 h-5 {account.type === 'checking' ? 'text-blue-300' : 'text-emerald-300'}"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        {#if account.type === "checking"}
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        {:else}
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        {/if}
      </svg>
    </div>
    <div>
      <div class="font-medium text-gray-100">{account.name}</div>
      <Badge variant="blue">{account.type}</Badge>
    </div>
  </div>

  <div class="flex items-center gap-4">
    <div class="text-right">
      <div class="text-lg font-semibold tabular-nums {account.balance >= 0 ? 'text-gray-100' : 'text-red-400'}">
        {formatCurrency(account.balance)}
      </div>
    </div>
    <div class="flex gap-1">
      {#if reorderable}
        <div class="flex flex-col">
          <button
            class="btn-ghost p-1 leading-none disabled:opacity-20 disabled:cursor-default"
            disabled={isFirst}
            aria-label="Move up"
            on:click={() => dispatch("moveup", account)}
          >
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            class="btn-ghost p-1 leading-none disabled:opacity-20 disabled:cursor-default"
            disabled={isLast}
            aria-label="Move down"
            on:click={() => dispatch("movedown", account)}
          >
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      {/if}
      <button class="btn-ghost p-2" on:click={() => dispatch("edit", account)} aria-label="Edit">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
          />
        </svg>
      </button>
      <HoldToDelete on:confirm={() => dispatch("delete", account)} />
    </div>
  </div>
</div>
