<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { InvestmentAccount } from '$lib/types';
	import { formatCurrency } from '$lib/utils/currency';
	import Badge from '$lib/components/shared/Badge.svelte';

	export let investment: InvestmentAccount;

	const dispatch = createEventDispatcher();
</script>

<div class="card flex items-center justify-between gap-4">
	<div class="flex items-center gap-3">
		<div class="w-10 h-10 rounded-full bg-purple-900 flex items-center justify-center">
			<svg class="w-5 h-5 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
			</svg>
		</div>
		<div>
			<div class="font-medium text-gray-100">{investment.name}</div>
			<div class="flex items-center gap-2">
				<Badge variant="gray">investment</Badge>
				{#if investment.institution}
					<span class="text-xs text-gray-500">{investment.institution}</span>
				{/if}
			</div>
		</div>
	</div>

	<div class="flex items-center gap-4">
		<div class="text-right">
			<div class="text-lg font-semibold tabular-nums text-gray-100">
				{formatCurrency(investment.currentBalance)}
			</div>
		</div>
		<div class="flex gap-1">
			<button class="btn-ghost p-2" on:click={() => dispatch('edit', investment)} aria-label="Edit">
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
				</svg>
			</button>
			<button class="btn-ghost p-2 hover:text-red-400" on:click={() => dispatch('delete', investment)} aria-label="Delete">
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
				</svg>
			</button>
		</div>
	</div>
</div>
