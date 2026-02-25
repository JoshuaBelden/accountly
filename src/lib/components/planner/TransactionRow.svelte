<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Transaction } from '$lib/types';
	import { formatCurrency } from '$lib/utils/currency';
	import { transactionsStore } from '$lib/stores/transactions.store';

	export let transaction: Transaction;

	const dispatch = createEventDispatcher();

	$: cleared = transaction.clearedStatus === 'cleared';

	function toggleCleared() {
		transactionsStore.clearStatus(transaction.id, cleared ? 'pending' : 'cleared');
	}

	function remove() {
		transactionsStore.remove(transaction.id);
	}

	const typeColors: Record<string, string> = {
		expense: 'text-red-400',
		income: 'text-emerald-400',
		transfer: 'text-blue-400',
		bill_payment: 'text-orange-400'
	};
</script>

<div class="flex items-center gap-3 py-2 px-3 rounded-lg {cleared ? 'bg-emerald-950/20' : 'hover:bg-gray-800/50'} transition-colors group">
	<button
		on:click={toggleCleared}
		class="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors {cleared ? 'bg-emerald-500 border-emerald-500' : 'border-gray-500 hover:border-emerald-400'}"
		aria-label="Toggle cleared"
	>
		{#if cleared}
			<svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
			</svg>
		{/if}
	</button>

	<div class="flex-1 min-w-0">
		<div class="text-sm {cleared ? 'line-through text-gray-500' : 'text-gray-200'} truncate">
			{transaction.description}
		</div>
	</div>

	<div class="text-sm font-medium tabular-nums {typeColors[transaction.type] ?? 'text-gray-200'}">
		{transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
	</div>

	<button
		on:click={remove}
		class="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-all"
		aria-label="Remove transaction"
	>
		<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
		</svg>
	</button>
</div>
