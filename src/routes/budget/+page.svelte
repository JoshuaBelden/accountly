<script lang="ts">
	import { budgetStore } from '$lib/stores/budget.store';
	import { transactionsStore } from '$lib/stores/transactions.store';
	import CategoryGroup from '$lib/components/budget/CategoryGroup.svelte';
	import BudgetForm from '$lib/components/budget/BudgetForm.svelte';
	import SpendingChart from '$lib/components/budget/SpendingChart.svelte';
	import Modal from '$lib/components/shared/Modal.svelte';
	import ConfirmDialog from '$lib/components/shared/ConfirmDialog.svelte';
	import EmptyState from '$lib/components/shared/EmptyState.svelte';
	import { formatCurrency } from '$lib/utils/currency';
	import { currentMonth, addMonths, formatMonth } from '$lib/utils/date';
	import type { BudgetCategory, Transaction } from '$lib/types';

	let month = currentMonth();
	let modalOpen = false;
	let editCategory: BudgetCategory | null = null;
	let deleteTarget: string | null = null;

	let categories: BudgetCategory[] = [];
	budgetStore.categories.subscribe((c: BudgetCategory[]) => (categories = c));

	function prevMonth() { month = addMonths(month, -1); }
	function nextMonth() { month = addMonths(month, 1); }

	$: monthTransactions = $transactionsStore.filter(
		(t) => t.plannerMonth === month || t.date.startsWith(month)
	);

	function getActualForCategory(cat: BudgetCategory): number {
		return monthTransactions
			.filter((t) => {
				if (t.type === 'income') return false;
				if (t.splits?.length) return t.splits.some((s) => s.categoryId === cat.id);
				return t.categoryId === cat.id;
			})
			.reduce((sum, t) => {
				if (t.splits?.length) {
					return sum + t.splits.filter((s) => s.categoryId === cat.id).reduce((ss, s) => ss + s.amount, 0);
				}
				return sum + t.amount;
			}, 0);
	}

	$: totalBudget = categories.reduce((s, c) => s + c.monthlyBudget, 0);
	$: totalActual = categories.reduce((s, c) => s + getActualForCategory(c), 0);

	$: chartData = categories.map((cat, i) => {
		const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];
		return {
			label: cat.name,
			amount: getActualForCategory(cat),
			color: colors[i % colors.length]
		};
	}).filter((d) => d.amount > 0);

	function openAdd() {
		editCategory = null;
		modalOpen = true;
	}

	function openEdit(e: CustomEvent<BudgetCategory>) {
		editCategory = e.detail;
		modalOpen = true;
	}

	function closeModal() {
		modalOpen = false;
		editCategory = null;
	}

	function handleDelete(e: CustomEvent<BudgetCategory>) {
		deleteTarget = e.detail.id;
	}

	function confirmDelete() {
		if (deleteTarget) {
			budgetStore.removeCategory(deleteTarget);
			deleteTarget = null;
		}
	}
</script>

<div class="max-w-5xl mx-auto space-y-6">
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
		<button class="btn-primary" on:click={openAdd}>
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			Add Category
		</button>
	</div>

	{#if categories.length === 0}
		<EmptyState
			title="No budget categories"
			description="Create categories like Housing, Food, and Transportation to track your spending."
			actionLabel="Add Category"
			on:action={openAdd}
		/>
	{:else}
		<!-- Summary -->
		<div class="grid grid-cols-3 gap-4">
			<div class="card text-center">
				<div class="text-xs text-gray-500 uppercase tracking-wide mb-1">Budgeted</div>
				<div class="text-xl font-bold text-gray-100 tabular-nums">{formatCurrency(totalBudget)}</div>
			</div>
			<div class="card text-center">
				<div class="text-xs text-gray-500 uppercase tracking-wide mb-1">Spent</div>
				<div class="text-xl font-bold {totalActual > totalBudget ? 'text-red-400' : 'text-gray-100'} tabular-nums">{formatCurrency(totalActual)}</div>
			</div>
			<div class="card text-center">
				<div class="text-xs text-gray-500 uppercase tracking-wide mb-1">Remaining</div>
				<div class="text-xl font-bold {totalBudget - totalActual < 0 ? 'text-red-400' : 'text-emerald-400'} tabular-nums">{formatCurrency(totalBudget - totalActual)}</div>
			</div>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Category list -->
			<div class="lg:col-span-2 space-y-3">
				{#each categories.sort((a, b) => a.sortOrder - b.sortOrder) as cat (cat.id)}
					<CategoryGroup
						category={cat}
						{monthTransactions}
						on:edit={openEdit}
						on:delete={handleDelete}
					/>
				{/each}
			</div>

			<!-- Chart -->
			<div class="card">
				<h3 class="text-sm font-semibold text-gray-300 mb-4">Spending Breakdown</h3>
				<SpendingChart data={chartData} />
			</div>
		</div>
	{/if}
</div>

<Modal open={modalOpen} title={editCategory ? 'Edit Category' : 'Add Budget Category'} on:close={closeModal}>
	<BudgetForm {editCategory} on:save={closeModal} on:cancel={closeModal} />
</Modal>

<ConfirmDialog
	open={deleteTarget !== null}
	title="Delete Category"
	message="Delete this budget category? Transactions linked to it will not be deleted."
	confirmLabel="Delete"
	danger
	on:confirm={confirmDelete}
	on:cancel={() => (deleteTarget = null)}
/>
