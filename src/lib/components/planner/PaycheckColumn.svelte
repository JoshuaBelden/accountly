<script lang="ts">
	import type { Paycheck, Bill, PlannedBillAssignment, Transaction } from '$lib/types';
	import { plannerStore } from '$lib/stores/planner.store';
	import { billsStore } from '$lib/stores/bills.store';
	import { formatCurrency } from '$lib/utils/currency';
	import { formatDateShort } from '$lib/utils/date';
	import BillRow from './BillRow.svelte';
	import TransactionRow from './TransactionRow.svelte';
	import Modal from '$lib/components/shared/Modal.svelte';
	import AdHocTransactionForm from './AdHocTransactionForm.svelte';

	export let paycheck: Paycheck;
	export let paycheckDate: string;
	export let plannerMonth: string;
	export let monthTransactions: Transaction[];
	export let unassignedBills: Bill[];

	let addTxOpen = false;
	let assignBillOpen = false;
	let selectedBillId = '';

	$: assignments = $plannerStore.filter(
		(a) => a.plannerMonth === plannerMonth && a.paycheckDate === paycheckDate
	);

	$: assignedBills = assignments
		.map((a) => {
			const bill = $billsStore.find((b) => b.id === a.billId);
			return bill ? { assignment: a, bill } : null;
		})
		.filter((x): x is { assignment: PlannedBillAssignment; bill: Bill } => x !== null);

	$: columnTransactions = monthTransactions.filter(
		(t) => t.plannedPaycheckDate === paycheckDate && t.type !== 'bill_payment'
	);

	$: billTotal = assignedBills.reduce(
		(s, { assignment, bill }) => s + (assignment.overrideAmount ?? bill.amount),
		0
	);
	$: txTotal = columnTransactions.reduce(
		(s, t) => s + (t.type === 'income' ? -t.amount : t.amount),
		0
	);
	$: totalOut = billTotal + txTotal;
	$: clearedCount = assignedBills.filter(
		({ assignment }) =>
			monthTransactions.find((t) => t.id === assignment.transactionId)?.clearedStatus === 'cleared'
	).length;

	function assignBill() {
		if (!selectedBillId) return;
		plannerStore.assign({
			id: crypto.randomUUID(),
			plannerMonth,
			billId: selectedBillId,
			paycheckDate
		});
		selectedBillId = '';
		assignBillOpen = false;
	}
</script>

<div class="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden flex flex-col min-w-[240px]">
	<!-- Header -->
	<div class="px-4 py-3 bg-gray-750 border-b border-gray-700">
		<div class="text-xs text-gray-500 uppercase tracking-wide">Paycheck</div>
		<div class="font-semibold text-gray-100">{paycheck.name}</div>
		<div class="text-sm text-indigo-300">{formatDateShort(paycheckDate)}</div>
		<div class="text-xs text-emerald-400 font-medium mt-1">+{formatCurrency(paycheck.expectedAmount)}</div>
	</div>

	<!-- Bills section -->
	<div class="flex-1 px-2 py-2 space-y-0.5 min-h-[100px]">
		{#each assignedBills as { assignment, bill } (assignment.id)}
			<BillRow {assignment} {bill} />
		{/each}

		{#each columnTransactions as tx (tx.id)}
			<TransactionRow transaction={tx} />
		{/each}

		{#if assignedBills.length === 0 && columnTransactions.length === 0}
			<p class="text-xs text-gray-600 text-center py-4">No bills assigned</p>
		{/if}
	</div>

	<!-- Footer -->
	<div class="px-4 py-3 border-t border-gray-700 space-y-2">
		<div class="flex justify-between text-xs text-gray-500">
			<span>{clearedCount}/{assignedBills.length} cleared</span>
			<span class="text-gray-300 font-medium">-{formatCurrency(totalOut)}</span>
		</div>

		<div class="flex gap-2">
			{#if unassignedBills.length > 0}
				<button
					class="btn-secondary text-xs flex-1"
					on:click={() => assignBillOpen = true}
				>+ Bill</button>
			{/if}
			<button
				class="btn-secondary text-xs flex-1"
				on:click={() => addTxOpen = true}
			>+ Transaction</button>
		</div>
	</div>
</div>

<!-- Add Transaction Modal -->
<Modal open={addTxOpen} title="Add Transaction" on:close={() => addTxOpen = false}>
	<AdHocTransactionForm {plannerMonth} {paycheckDate} on:save={() => addTxOpen = false} on:cancel={() => addTxOpen = false} />
</Modal>

<!-- Assign Bill Modal -->
<Modal open={assignBillOpen} title="Assign Bill" width="max-w-sm" on:close={() => assignBillOpen = false}>
	<div class="space-y-4">
		<select class="input" bind:value={selectedBillId}>
			<option value="">Select a bill</option>
			{#each unassignedBills as bill}
				<option value={bill.id}>{bill.name} — {formatCurrency(bill.amount)}</option>
			{/each}
		</select>
		<div class="flex justify-end gap-3">
			<button class="btn-secondary" on:click={() => assignBillOpen = false}>Cancel</button>
			<button class="btn-primary" on:click={assignBill} disabled={!selectedBillId}>Assign</button>
		</div>
	</div>
</Modal>
