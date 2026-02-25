<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import type { BudgetCategory, Transaction } from '$lib/types';
	import { formatCurrency } from '$lib/utils/currency';
	import BudgetVsActualBar from './BudgetVsActualBar.svelte';

	export let category: BudgetCategory;
	export let monthTransactions: Transaction[];

	const dispatch = createEventDispatcher();

	const STORAGE_KEY = 'accountly:budgetExpanded';

	function getExpandedSet(): Set<string> {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			return new Set(raw ? JSON.parse(raw) : []);
		} catch {
			return new Set();
		}
	}

	function saveExpandedSet(set: Set<string>) {
		localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
	}

	let expanded = false;

	onMount(() => {
		expanded = getExpandedSet().has(category.id);
	});

	function toggle() {
		expanded = !expanded;
		const set = getExpandedSet();
		if (expanded) set.add(category.id);
		else set.delete(category.id);
		saveExpandedSet(set);
	}

	function getActual(categoryId: string, subcategoryId?: string): number {
		return monthTransactions
			.filter((t) => {
				if (t.type === 'income') return false;
				if (t.splits && t.splits.length > 0) {
					return t.splits.some(
						(s) =>
							s.categoryId === categoryId &&
							(subcategoryId ? s.subcategoryId === subcategoryId : true)
					);
				}
				return (
					t.categoryId === categoryId &&
					(subcategoryId ? t.subcategoryId === subcategoryId : !t.subcategoryId)
				);
			})
			.reduce((sum, t) => {
				if (t.splits && t.splits.length > 0) {
					return (
						sum +
						t.splits
							.filter(
								(s) =>
									s.categoryId === categoryId &&
									(subcategoryId ? s.subcategoryId === subcategoryId : true)
							)
							.reduce((ss, s) => ss + s.amount, 0)
					);
				}
				return sum + t.amount;
			}, 0);
	}

	$: categoryActual = getActual(category.id);
	$: categoryBudget = category.monthlyBudget;
	$: over = categoryActual > categoryBudget;
</script>

<div class="card overflow-hidden">
	<!-- Category header -->
	<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
	<div
		class="w-full flex items-center justify-between cursor-pointer"
		on:click={toggle}
	>
		<div class="flex items-center gap-3">
			<svg
				class="w-4 h-4 text-gray-400 transition-transform {expanded ? 'rotate-90' : ''}"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
			<span class="font-medium text-gray-100">{category.name}</span>
		</div>
		<div class="flex items-center gap-4 text-sm">
			<span class="{over ? 'text-red-400' : 'text-gray-300'} tabular-nums">
				{formatCurrency(categoryActual)}
			</span>
			<span class="text-gray-500">/</span>
			<span class="text-gray-400 tabular-nums">{formatCurrency(categoryBudget)}</span>
			<div class="flex gap-1">
				<button
					type="button"
					class="btn-ghost p-1.5"
					on:click|stopPropagation={() => dispatch('edit', category)}
					aria-label="Edit category"
				>
					<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
					</svg>
				</button>
				<button
					type="button"
					class="btn-ghost p-1.5 hover:text-red-400"
					on:click|stopPropagation={() => dispatch('delete', category)}
					aria-label="Delete category"
				>
					<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
					</svg>
				</button>
			</div>
		</div>
	</div>

	<div class="mt-3">
		<BudgetVsActualBar budget={categoryBudget} actual={categoryActual} />
	</div>

	{#if expanded && category.subcategories.length > 0}
		<div class="mt-3 pl-4 border-l border-gray-700 space-y-2">
			{#each category.subcategories.slice().sort((a, b) => a.name.localeCompare(b.name)) as sub (sub.id)}
				{@const subActual = getActual(category.id, sub.id)}
				<div class="space-y-1">
					<div class="flex items-center justify-between text-sm">
						<span class="text-gray-400">{sub.name}</span>
						<div class="flex gap-2 tabular-nums">
							<span class="{subActual > sub.monthlyBudget ? 'text-red-400' : 'text-gray-300'}">{formatCurrency(subActual)}</span>
							<span class="text-gray-600">/</span>
							<span class="text-gray-500">{formatCurrency(sub.monthlyBudget)}</span>
						</div>
					</div>
					<BudgetVsActualBar budget={sub.monthlyBudget} actual={subActual} />
				</div>
			{/each}
		</div>
	{/if}
</div>
