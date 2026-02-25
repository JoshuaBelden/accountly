<script lang="ts">
	import { tick } from 'svelte';
	import type { PlannedBillAssignment, Bill, Transaction } from '$lib/types';
	import { formatCurrency } from '$lib/utils/currency';
	import { transactionsStore } from '$lib/stores/transactions.store';
	import { plannerStore } from '$lib/stores/planner.store';

	export let assignment: PlannedBillAssignment;
	export let bill: Bill;

	$: transaction = assignment.transactionId
		? $transactionsStore.find((t) => t.id === assignment.transactionId)
		: null;

	$: cleared = transaction?.clearedStatus === 'cleared';
	$: amount = assignment.overrideAmount ?? bill.amount;
	$: isOverridden =
		assignment.overrideAmount !== undefined && assignment.overrideAmount !== bill.amount;

	let editingAmount = false;
	let inputValue = 0;
	let amountInput: HTMLInputElement;

	async function startEdit() {
		inputValue = amount;
		editingAmount = true;
		await tick();
		amountInput?.focus();
		amountInput?.select();
	}

	function saveAmount() {
		editingAmount = false;
		if (isNaN(inputValue) || inputValue < 0) return;

		const newOverride = inputValue === bill.amount ? undefined : inputValue;
		plannerStore.setOverrideAmount(assignment.id, newOverride);

		// Keep the linked transaction in sync if already cleared
		if (transaction) {
			transactionsStore.update(transaction.id, { amount: inputValue });
		}
	}

	function handleAmountKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') saveAmount();
		if (e.key === 'Escape') editingAmount = false;
	}

	function toggleCleared() {
		if (!transaction) {
			const now = new Date().toISOString();
			const tx: Transaction = {
				id: crypto.randomUUID(),
				date: assignment.paycheckDate,
				description: `${bill.name} payment`,
				amount,
				type: 'bill_payment',
				accountId: bill.accountId ?? '',
				clearedStatus: 'cleared',
				billId: bill.id,
				categoryId: bill.categoryId,
				subcategoryId: bill.subcategoryId,
				plannerMonth: assignment.plannerMonth,
				plannedPaycheckDate: assignment.paycheckDate,
				createdAt: now,
				updatedAt: now
			};
			transactionsStore.add(tx);
			plannerStore.linkTransaction(assignment.id, tx.id);
		} else {
			transactionsStore.clearStatus(transaction.id, cleared ? 'pending' : 'cleared');
		}
	}

	function unassign() {
		plannerStore.unassign(bill.id, assignment.plannerMonth);
	}
</script>

<div
	class="flex items-center gap-3 py-2 px-3 rounded-lg {cleared
		? 'bg-emerald-950/30'
		: 'hover:bg-gray-800/50'} transition-colors group"
>
	<button
		on:click={toggleCleared}
		class="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors {cleared
			? 'bg-emerald-500 border-emerald-500'
			: 'border-gray-500 hover:border-emerald-400'}"
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
			{bill.name}
		</div>
	</div>

	{#if editingAmount}
		<input
			bind:this={amountInput}
			bind:value={inputValue}
			on:blur={saveAmount}
			on:keydown={handleAmountKeydown}
			type="number"
			step="0.01"
			min="0"
			class="w-24 text-sm text-right bg-gray-700 border border-blue-500 rounded px-1.5 py-0.5 text-gray-100 focus:outline-none tabular-nums"
		/>
	{:else}
		<div class="flex items-center gap-1.5">
			{#if isOverridden}
				<span class="text-xs text-gray-600 tabular-nums line-through"
					>{formatCurrency(bill.amount)}</span
				>
			{/if}
			<button
				on:click={startEdit}
				title={isOverridden
					? `Expected: ${formatCurrency(bill.amount)} — click to edit`
					: 'Click to set actual amount'}
				class="text-sm font-medium tabular-nums transition-colors {cleared
					? 'text-gray-500'
					: isOverridden
						? 'text-amber-400 hover:text-amber-300'
						: 'text-gray-200 hover:text-blue-400'}"
			>
				{formatCurrency(amount)}
			</button>
		</div>
	{/if}

	<button
		on:click={unassign}
		class="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-all"
		aria-label="Remove from this paycheck"
	>
		<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
		</svg>
	</button>
</div>
