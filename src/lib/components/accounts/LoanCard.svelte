<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { LoanAccount } from '$lib/types';
	import { formatCurrency } from '$lib/utils/currency';
	import { loanProgress, loanPayoffDate } from '$lib/utils/finance';
	import Badge from '$lib/components/shared/Badge.svelte';
	import HoldToDelete from '$lib/components/shared/HoldToDelete.svelte';

	export let loan: LoanAccount;

	const dispatch = createEventDispatcher();

	$: progress = loanProgress(loan) * 100;
	$: payoffDate = loanPayoffDate(loan);
	$: payoffStr = payoffDate
		? payoffDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
		: 'N/A';
</script>

<div class="card space-y-3">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<div class="w-10 h-10 rounded-full bg-red-900 flex items-center justify-center">
				<svg class="w-5 h-5 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
			</div>
			<div>
				<div class="font-medium text-gray-100">{loan.name}</div>
				<Badge variant="red">loan</Badge>
			</div>
		</div>
		<div class="flex gap-1">
			<button class="btn-ghost p-2" on:click={() => dispatch('edit', loan)} aria-label="Edit">
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
				</svg>
			</button>
			<HoldToDelete on:confirm={() => dispatch('delete', loan)} />
		</div>
	</div>

	<div class="grid grid-cols-3 gap-4 text-sm">
		<div>
			<div class="text-gray-500 text-xs">Remaining</div>
			<div class="font-semibold text-red-400 tabular-nums">{formatCurrency(loan.remainingBalance)}</div>
		</div>
		<div>
			<div class="text-gray-500 text-xs">Payment</div>
			<div class="font-semibold text-gray-200 tabular-nums">{formatCurrency(loan.minimumPayment)}/mo</div>
		</div>
		<div>
			<div class="text-gray-500 text-xs">Payoff Est.</div>
			<div class="font-semibold text-gray-200">{payoffStr}</div>
		</div>
	</div>

	<!-- Progress bar -->
	<div>
		<div class="flex justify-between text-xs text-gray-500 mb-1">
			<span>Paid off</span>
			<span>{progress.toFixed(0)}%</span>
		</div>
		<div class="w-full bg-gray-700 rounded-full h-2">
			<div
				class="bg-emerald-500 h-2 rounded-full transition-all"
				style="width: {progress}%"
			></div>
		</div>
	</div>

	<div class="text-xs text-gray-500">
		Due day: {loan.paymentDueDay} · {(loan.interestRate * 100).toFixed(2)}% APR · {loan.paymentFrequency}
	</div>
</div>
