<script lang="ts">
	import { checkingAccounts, savingsAccounts } from '$lib/stores/accounts.store';
	import { transactionsStore } from '$lib/stores/transactions.store';
	import { budgetStore } from '$lib/stores/budget.store';
	import { formatCurrency } from '$lib/utils/currency';
	import { formatDateShort } from '$lib/utils/date';
	import type { BudgetCategory } from '$lib/types';
	import Modal from '$lib/components/shared/Modal.svelte';
	import TransactionForm from '$lib/components/transactions/TransactionForm.svelte';
	import EmptyState from '$lib/components/shared/EmptyState.svelte';

	let addTxOpen = false;

	// All checking + savings accounts for sub-nav (checking first)
	$: transactionAccounts = [...$checkingAccounts, ...$savingsAccounts];

	// Default to first checking account, then first savings
	let selectedAccountId = '';
	$: if (!selectedAccountId && $checkingAccounts.length > 0) {
		selectedAccountId = $checkingAccounts[0].id;
	} else if (!selectedAccountId && $savingsAccounts.length > 0) {
		selectedAccountId = $savingsAccounts[0].id;
	}

	$: selectedAccount = transactionAccounts.find((a) => a.id === selectedAccountId);

	// Cleared transactions for selected account, newest first by createdAt
	$: accountTransactions = $transactionsStore
		.filter((t) => t.accountId === selectedAccountId && t.clearedStatus === 'cleared')
		.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

	// Budget categories for display
	let budgetCategories: BudgetCategory[] = [];
	budgetStore.categories.subscribe((c) => (budgetCategories = c));

	function getCategoryLabel(categoryId?: string, subcategoryId?: string): string {
		if (!categoryId) return '';
		const cat = budgetCategories.find((c) => c.id === categoryId);
		if (!cat) return '';
		if (subcategoryId) {
			const sub = cat.subcategories.find((s) => s.id === subcategoryId);
			return sub ? `${cat.name} › ${sub.name}` : cat.name;
		}
		return cat.name;
	}

	const typeColors: Record<string, string> = {
		expense: 'text-red-400 bg-red-950/30 border-red-800/50',
		income: 'text-emerald-400 bg-emerald-950/30 border-emerald-800/50',
		transfer: 'text-blue-400 bg-blue-950/30 border-blue-800/50',
		bill_payment: 'text-orange-400 bg-orange-950/30 border-orange-800/50'
	};

	const typeLabels: Record<string, string> = {
		expense: 'Expense',
		income: 'Income',
		transfer: 'Transfer',
		bill_payment: 'Bill'
	};
</script>

<div class="max-w-4xl mx-auto space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-gray-100">Transactions</h1>
		{#if selectedAccount}
			<button class="btn-primary" on:click={() => (addTxOpen = true)}>+ Add Transaction</button>
		{/if}
	</div>

	{#if transactionAccounts.length === 0}
		<EmptyState
			title="No accounts"
			description="Add a checking or savings account to track transactions."
		/>
	{:else}
		<!-- Account sub-navigation -->
		<div class="flex gap-1 border-b border-gray-700">
			{#each transactionAccounts as account (account.id)}
				<button
					on:click={() => (selectedAccountId = account.id)}
					class="px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 -mb-px transition-colors
						{selectedAccountId === account.id
							? 'border-indigo-500 text-indigo-300 bg-gray-800/50'
							: 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'}"
				>
					{account.name}
					<span class="ml-1.5 text-xs opacity-60 capitalize">({account.type})</span>
				</button>
			{/each}
		</div>

		<!-- Transaction list -->
		{#if accountTransactions.length === 0}
			<div class="text-center py-16 text-gray-500">
				<p>No cleared transactions for this account.</p>
				<p class="text-sm mt-1">Add a transaction using the button above.</p>
			</div>
		{:else}
			<div class="card overflow-hidden p-0">
				<div class="divide-y divide-gray-700/50">
					{#each accountTransactions as tx (tx.id)}
						{@const catLabel = getCategoryLabel(tx.categoryId, tx.subcategoryId)}
						<div
							class="flex items-center gap-4 px-4 py-3 hover:bg-gray-800/30 transition-colors group"
						>
							<!-- Date -->
							<div class="text-sm text-gray-400 tabular-nums w-20 flex-shrink-0">
								{formatDateShort(tx.date)}
							</div>

							<!-- Description + category + notes -->
							<div class="flex-1 min-w-0">
								<div class="text-sm text-gray-100 truncate">{tx.description}</div>
								{#if catLabel}
									<div class="text-xs text-gray-500 truncate">{catLabel}</div>
								{/if}
								{#if tx.notes}
									<div class="text-xs text-gray-600 italic truncate">{tx.notes}</div>
								{/if}
							</div>

							<!-- Type badge -->
							<span
								class="text-xs px-2 py-0.5 rounded border flex-shrink-0
									{typeColors[tx.type] ?? 'text-gray-400 bg-gray-800 border-gray-700'}"
							>
								{typeLabels[tx.type] ?? tx.type}
							</span>

							<!-- Amount -->
							<div
								class="text-sm font-medium tabular-nums flex-shrink-0
									{tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'}"
							>
								{tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
							</div>

							<!-- Remove -->
							<button
								on:click={() => transactionsStore.remove(tx.id)}
								class="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-all flex-shrink-0"
								aria-label="Remove transaction"
							>
								<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
									/>
								</svg>
							</button>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>

<!-- Add Transaction Modal -->
<Modal open={addTxOpen} title="Add Transaction" on:close={() => (addTxOpen = false)}>
	<TransactionForm
		defaultAccountId={selectedAccountId}
		on:save={() => (addTxOpen = false)}
		on:cancel={() => (addTxOpen = false)}
	/>
</Modal>
