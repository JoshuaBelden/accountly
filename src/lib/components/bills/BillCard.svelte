<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Bill } from '$lib/types';
	import { formatCurrency } from '$lib/utils/currency';
	import Badge from '$lib/components/shared/Badge.svelte';

	export let bill: Bill;
	export let accountName = '';
	export let categoryName = '';

	const dispatch = createEventDispatcher();

	const freqLabels: Record<string, string> = {
		monthly: 'Monthly',
		bimonthly: 'Every 2 mo',
		weekly: 'Weekly',
		biweekly: 'Biweekly',
		quarterly: 'Quarterly',
		annually: 'Annual'
	};
</script>

<div class="card flex items-center justify-between gap-4">
	<div class="flex items-center gap-3 min-w-0">
		<div class="w-10 h-10 rounded-full bg-orange-900 flex-shrink-0 flex items-center justify-center">
			<svg class="w-5 h-5 text-orange-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
			</svg>
		</div>
		<div class="min-w-0">
			<div class="font-medium text-gray-100 truncate">{bill.name}</div>
			<div class="flex items-center gap-2 flex-wrap">
				<Badge variant="gray">{freqLabels[bill.frequency]}</Badge>
				{#if bill.dueDayOfMonth}
					<span class="text-xs text-gray-500">Due: {bill.dueDayOfMonth}{bill.dueDayOfMonth === 1 ? 'st' : bill.dueDayOfMonth === 2 ? 'nd' : bill.dueDayOfMonth === 3 ? 'rd' : 'th'}</span>
				{/if}
				{#if bill.autoPay}
					<Badge variant="blue">AutoPay</Badge>
				{/if}
				{#if accountName}
					<span class="text-xs text-gray-500">· {accountName}</span>
				{/if}
				{#if categoryName}
					<span class="text-xs text-gray-500">· {categoryName}</span>
				{/if}
			</div>
		</div>
	</div>

	<div class="flex items-center gap-3 flex-shrink-0">
		<div class="text-right">
			<div class="font-semibold text-gray-100 tabular-nums">{formatCurrency(bill.amount)}</div>
		</div>
		<div class="flex gap-1">
			<button class="btn-ghost p-2" on:click={() => dispatch('edit', bill)} aria-label="Edit">
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
				</svg>
			</button>
			<button class="btn-ghost p-2 hover:text-red-400" on:click={() => dispatch('delete', bill)} aria-label="Delete">
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
				</svg>
			</button>
		</div>
	</div>
</div>
