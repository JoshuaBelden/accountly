<script lang="ts">
	import { get } from 'svelte/store';
	import { billsStore } from '$lib/stores/bills.store';
	import { accountsStore } from '$lib/stores/accounts.store';
	import { budgetStore } from '$lib/stores/budget.store';
	import { transactionsStore } from '$lib/stores/transactions.store';
	import { plannerStore } from '$lib/stores/planner.store';
	import BillCard from '$lib/components/bills/BillCard.svelte';
	import BillForm from '$lib/components/bills/BillForm.svelte';
	import Modal from '$lib/components/shared/Modal.svelte';
	import ConfirmDialog from '$lib/components/shared/ConfirmDialog.svelte';
	import EmptyState from '$lib/components/shared/EmptyState.svelte';
	import { formatCurrency } from '$lib/utils/currency';
	import type { Bill, BudgetCategory } from '$lib/types';

	let modalOpen = false;
	let editBill: Bill | null = null;
	let deleteTarget: string | null = null;
	let categories: BudgetCategory[] = [];
	budgetStore.categories.subscribe((c) => (categories = c));

	function openAdd() {
		editBill = null;
		modalOpen = true;
	}

	function openEdit(e: CustomEvent<Bill>) {
		editBill = e.detail;
		modalOpen = true;
	}

	function closeModal() {
		modalOpen = false;
		editBill = null;
	}

	function handleDelete(e: CustomEvent<Bill>) {
		deleteTarget = e.detail.id;
	}

	function confirmDelete() {
		if (deleteTarget) {
			billsStore.remove(deleteTarget);
			deleteTarget = null;
		}
	}

	function getAccountName(id?: string) {
		if (!id) return '';
		return $accountsStore.find((a) => a.id === id)?.name ?? '';
	}

	function getCategoryName(id?: string) {
		if (!id) return '';
		return categories.find((c) => c.id === id)?.name ?? '';
	}

	let reapplyResult: string | null = null;

	function reapplyHints() {
		const txs = get(transactionsStore);
		const bills = get(billsStore);
		let updated = 0;
		for (const tx of txs) {
			if (tx.billId || !tx.description) continue;
			for (const bill of bills) {
				if (!bill.hints) continue;
				try {
					if (new RegExp(bill.hints, 'i').test(tx.description)) {
						plannerStore.clearTransactionLink(tx.id);
						const month = tx.date.substring(0, 7);
						const assignments = plannerStore.getForMonth(month);
						const assignment = assignments.find((a) => a.billId === bill.id);
						if (assignment) plannerStore.linkTransaction(assignment.id, tx.id);
						transactionsStore.update(tx.id, {
							billId: bill.id,
							type: 'bill_payment',
							plannerMonth: month
						});
						updated++;
						break;
					}
				} catch { /* invalid regex — skip */ }
			}
		}
		reapplyResult =
			updated === 0
				? 'No unassigned transactions matched.'
				: `Updated ${updated} transaction${updated === 1 ? '' : 's'}.`;
		setTimeout(() => (reapplyResult = null), 4000);
	}

	$: monthlyTotal = $billsStore
		.filter((b) => b.frequency === 'monthly')
		.reduce((s, b) => s + b.amount, 0);

	$: sortedBills = [...$billsStore].sort(
		(a, b) =>
			['monthly', 'biweekly', 'weekly', 'bimonthly', 'quarterly', 'annually'].indexOf(
				a.frequency
			) -
				['monthly', 'biweekly', 'weekly', 'bimonthly', 'quarterly', 'annually'].indexOf(
					b.frequency
				) || a.name.localeCompare(b.name)
	);
</script>

<div class="max-w-4xl mx-auto space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-100">Bills</h1>
			{#if $billsStore.length > 0}
				<p class="text-sm text-gray-400 mt-0.5">Monthly total: {formatCurrency(monthlyTotal)}</p>
			{/if}
		</div>
		<div class="flex items-center gap-3">
			{#if reapplyResult}
				<span class="text-sm text-emerald-400">{reapplyResult}</span>
			{/if}
			{#if $billsStore.some((b) => b.hints)}
				<button class="btn-secondary" on:click={reapplyHints} title="Apply bill hints to unassigned transactions">
					Update Transactions
				</button>
			{/if}
			<button class="btn-primary" on:click={openAdd}>
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
				</svg>
				Add Bill
			</button>
		</div>
	</div>

	{#if $billsStore.length === 0}
		<EmptyState
			title="No bills yet"
			description="Add your recurring bills — rent, utilities, subscriptions — to track them in the Monthly Planner."
			actionLabel="Add Bill"
			on:action={openAdd}
		/>
	{:else}
		<div class="space-y-3">
			{#each sortedBills as bill (bill.id)}
				<BillCard
					{bill}
					accountName={getAccountName(bill.accountId)}
					categoryName={getCategoryName(bill.categoryId)}
					on:edit={openEdit}
					on:delete={handleDelete}
				/>
			{/each}
		</div>
	{/if}
</div>

<Modal open={modalOpen} title={editBill ? 'Edit Bill' : 'Add Bill'} on:close={closeModal}>
	<BillForm {editBill} on:save={closeModal} on:cancel={closeModal} />
</Modal>

<ConfirmDialog
	open={deleteTarget !== null}
	title="Delete Bill"
	message="Are you sure you want to delete this bill? Any planner assignments will also be removed."
	confirmLabel="Delete"
	danger
	on:confirm={confirmDelete}
	on:cancel={() => (deleteTarget = null)}
/>
