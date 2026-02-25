<script lang="ts">
	import { paychecksStore } from '$lib/stores/paychecks.store';
	import { billsStore } from '$lib/stores/bills.store';
	import { plannerStore } from '$lib/stores/planner.store';
	import { transactionsStore } from '$lib/stores/transactions.store';
	import { settingsStore } from '$lib/stores/settings.store';
	import PaycheckColumn from '$lib/components/planner/PaycheckColumn.svelte';
	import EmptyState from '$lib/components/shared/EmptyState.svelte';
	import { currentMonth, addMonths, formatMonth, getPayDaysInMonth } from '$lib/utils/date';
	import type { Bill, Paycheck } from '$lib/types';

	let month = currentMonth();

	function prevMonth() { month = addMonths(month, -1); }
	function nextMonth() { month = addMonths(month, 1); }

	// Compute all pay days in the current month, across all paychecks
	$: payPeriods = $paychecksStore.flatMap((pc) =>
		getPayDaysInMonth(pc, month).map((date) => ({ paycheck: pc, date }))
	).sort((a, b) => a.date.localeCompare(b.date));

	// Bills that are monthly (or applicable this month) and not yet assigned
	$: monthAssignments = $plannerStore.filter((a) => a.plannerMonth === month);
	$: assignedBillIds = new Set(monthAssignments.map((a) => a.billId));
	$: unassignedBills = $billsStore.filter(
		(b) => b.frequency === 'monthly' && !assignedBillIds.has(b.id)
	);

	// All transactions for this month
	$: monthTransactions = $transactionsStore.filter((t) => t.plannerMonth === month);

	// Summary stats
	$: totalBillsAssigned = monthAssignments.length;
	$: totalBillsCleared = monthAssignments.filter((a) =>
		monthTransactions.find((t) => t.id === a.transactionId && t.clearedStatus === 'cleared')
	).length;
</script>

<div class="max-w-7xl mx-auto space-y-6">
	<!-- Month navigation -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<button class="btn-secondary px-3 py-1.5" on:click={prevMonth} aria-label="Previous month">
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
			</button>
			<h1 class="text-2xl font-bold text-gray-100">{formatMonth(month)}</h1>
			<button class="btn-secondary px-3 py-1.5" on:click={nextMonth} aria-label="Next month">
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</button>
		</div>

		{#if totalBillsAssigned > 0}
			<div class="text-sm text-gray-400">
				{totalBillsCleared}/{totalBillsAssigned} bills cleared
			</div>
		{/if}
	</div>

	{#if $paychecksStore.length === 0}
		<EmptyState
			title="No paychecks configured"
			description="Set up your pay schedule in Accounts to use the Monthly Planner."
		/>
	{:else if payPeriods.length === 0}
		<div class="text-center py-16 text-gray-500">
			<p>No pay days found in {formatMonth(month)}.</p>
			<p class="text-sm mt-1">Check your paycheck anchor dates in Accounts.</p>
		</div>
	{:else}
		<!-- Paycheck columns -->
		<div class="flex gap-4 overflow-x-auto pb-4">
			{#each payPeriods as { paycheck, date } (`${paycheck.id}-${date}`)}
				<PaycheckColumn
					{paycheck}
					paycheckDate={date}
					plannerMonth={month}
					{monthTransactions}
					{unassignedBills}
				/>
			{/each}
		</div>

		<!-- Unassigned bills section -->
		{#if unassignedBills.length > 0}
			<div class="card">
				<h2 class="text-sm font-semibold text-yellow-400 mb-3">
					Unassigned Bills ({unassignedBills.length})
				</h2>
				<div class="space-y-2">
					{#each unassignedBills as bill (bill.id)}
						<div class="flex items-center justify-between text-sm py-1">
							<span class="text-gray-300">{bill.name}</span>
							<span class="text-gray-500 tabular-nums">${bill.amount.toFixed(2)}</span>
						</div>
					{/each}
				</div>
				<p class="text-xs text-gray-500 mt-3">Assign these bills using the "+ Bill" button in each paycheck column.</p>
			</div>
		{/if}
	{/if}
</div>
