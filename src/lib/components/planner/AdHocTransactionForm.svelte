<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { transactionsStore } from '$lib/stores/transactions.store';
	import { accountsStore } from '$lib/stores/accounts.store';
	import { budgetStore } from '$lib/stores/budget.store';
	import type { Transaction, TransactionType, BudgetCategory } from '$lib/types';
	import { todayISO } from '$lib/utils/date';

	export let plannerMonth: string;
	export let paycheckDate: string = '';

	const dispatch = createEventDispatcher();

	let description = '';
	let amount = 0;
	let type: TransactionType = 'expense';
	let accountId = '';
	let date = paycheckDate || todayISO();
	let categoryId = '';
	let subcategoryId = '';
	let notes = '';

	let budgetCategories: BudgetCategory[] = [];
	budgetStore.categories.subscribe((c: BudgetCategory[]) => (budgetCategories = c.slice().sort((a, b) => a.name.localeCompare(b.name))));

	$: subcategories = (budgetCategories.find((c) => c.id === categoryId)?.subcategories ?? []).slice().sort((a, b) => a.name.localeCompare(b.name));

	function uid() { return crypto.randomUUID(); }
	function now() { return new Date().toISOString(); }

	function submit() {
		const tx: Transaction = {
			id: uid(),
			date,
			description,
			amount,
			type,
			accountId,
			clearedStatus: 'pending',
			categoryId: categoryId || undefined,
			subcategoryId: subcategoryId || undefined,
			plannedPaycheckDate: paycheckDate || undefined,
			plannerMonth,
			notes: notes || undefined,
			createdAt: now(),
			updatedAt: now()
		};
		transactionsStore.add(tx);
		dispatch('save', tx);
	}
</script>

<form on:submit|preventDefault={submit} class="space-y-3">
	<div>
		<label class="label" for="tx-desc">Description</label>
		<input id="tx-desc" class="input" type="text" bind:value={description} required placeholder="e.g. Grocery run" />
	</div>

	<div class="grid grid-cols-2 gap-3">
		<div>
			<label class="label" for="tx-amount">Amount ($)</label>
			<input id="tx-amount" class="input" type="number" step="0.01" bind:value={amount} required min="0" />
		</div>
		<div>
			<label class="label" for="tx-type">Type</label>
			<select id="tx-type" class="input" bind:value={type}>
				<option value="expense">Expense</option>
				<option value="income">Income</option>
				<option value="transfer">Transfer</option>
			</select>
		</div>
	</div>

	<div class="grid grid-cols-2 gap-3">
		<div>
			<label class="label" for="tx-account">Account</label>
			<select id="tx-account" class="input" bind:value={accountId} required>
				<option value="">Select account</option>
				{#each $accountsStore as acct}
					{#if acct.type === 'checking' || acct.type === 'savings'}
						<option value={acct.id}>{acct.name}</option>
					{/if}
				{/each}
			</select>
		</div>
		<div>
			<label class="label" for="tx-date">Date</label>
			<input id="tx-date" class="input" type="date" bind:value={date} required />
		</div>
	</div>

	<div class="grid grid-cols-2 gap-3">
		<div>
			<label class="label" for="tx-cat">Category (optional)</label>
			<select id="tx-cat" class="input" bind:value={categoryId} on:change={() => subcategoryId = ''}>
				<option value="">None</option>
				{#each budgetCategories as cat}
					<option value={cat.id}>{cat.name}</option>
				{/each}
			</select>
		</div>
		{#if subcategories.length > 0}
			<div>
				<label class="label" for="tx-subcat">Subcategory</label>
				<select id="tx-subcat" class="input" bind:value={subcategoryId}>
					<option value="">None</option>
					{#each subcategories as sub}
						<option value={sub.id}>{sub.name}</option>
					{/each}
				</select>
			</div>
		{/if}
	</div>

	<div class="flex justify-end gap-3 pt-1">
		<button type="button" class="btn-secondary" on:click={() => dispatch('cancel')}>Cancel</button>
		<button type="submit" class="btn-primary">Add Transaction</button>
	</div>
</form>
