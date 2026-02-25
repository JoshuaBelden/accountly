<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { budgetStore } from '$lib/stores/budget.store';
	import type { BudgetCategory, BudgetSubcategory } from '$lib/types';

	export let editCategory: BudgetCategory | null = null;

	const dispatch = createEventDispatcher();

	let name = editCategory?.name ?? '';
	let monthlyBudget = editCategory?.monthlyBudget ?? 0;
	let notes = editCategory?.notes ?? '';
	let hints = editCategory?.hints ?? '';
	let subcategories: { name: string; budget: number; hints: string }[] =
		editCategory?.subcategories.map((s) => ({ name: s.name, budget: s.monthlyBudget, hints: s.hints ?? '' })) ?? [];

	function addSubcategory() {
		subcategories = [...subcategories, { name: '', budget: 0, hints: '' }];
	}

	function removeSubcategory(i: number) {
		subcategories = subcategories.filter((_, idx) => idx !== i);
	}

	function uid() { return crypto.randomUUID(); }
	function now() { return new Date().toISOString(); }

	function submit() {
		const subs: BudgetSubcategory[] = subcategories
			.filter((s) => s.name.trim())
			.map((s, i) => ({
				id: editCategory?.subcategories[i]?.id ?? uid(),
				parentId: editCategory?.id ?? '',
				name: s.name,
				monthlyBudget: s.budget,
				hints: s.hints.trim() || undefined,
				sortOrder: i
			}));

		const subTotal = subs.reduce((sum, s) => sum + s.monthlyBudget, 0);

		const category: BudgetCategory = {
			id: editCategory?.id ?? uid(),
			name,
			monthlyBudget: subcategories.length > 0 ? subTotal : monthlyBudget,
			subcategories: subs,
			notes: notes || undefined,
			hints: hints.trim() || undefined,
			sortOrder: editCategory?.sortOrder ?? Date.now(),
			createdAt: editCategory?.createdAt ?? now(),
			updatedAt: now()
		};

		// Fix parentId after category id is known
		category.subcategories = category.subcategories.map((s) => ({
			...s,
			parentId: category.id
		}));

		if (editCategory) {
			budgetStore.updateCategory(editCategory.id, category);
		} else {
			budgetStore.addCategory(category);
		}
		dispatch('save', category);
	}
</script>

<form on:submit|preventDefault={submit} class="space-y-4">
	<div>
		<label class="label" for="cat-name">Category Name</label>
		<input id="cat-name" class="input" type="text" bind:value={name} required placeholder="e.g. Housing" />
	</div>

	{#if subcategories.length === 0}
		<div>
			<label class="label" for="cat-budget">Monthly Budget ($)</label>
			<input id="cat-budget" class="input" type="number" step="0.01" bind:value={monthlyBudget} min="0" />
		</div>
	{/if}

	<!-- Subcategories -->
	{#if subcategories.length > 0}
		<div>
			<div class="label mb-2">Subcategories</div>
			<div class="space-y-2">
				{#each subcategories as sub, i}
					<div class="space-y-1">
						<div class="flex gap-2 items-center">
							<input
								class="input flex-1"
								type="text"
								bind:value={sub.name}
								placeholder="Subcategory name"
							/>
							<input
								class="input w-28"
								type="number"
								step="0.01"
								bind:value={sub.budget}
								min="0"
								placeholder="$0"
							/>
							<button
								type="button"
								class="btn-ghost p-2 hover:text-red-400"
								on:click={() => removeSubcategory(i)}
								aria-label="Remove subcategory"
							>
								<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
						<input
							class="input text-xs py-1"
							type="text"
							bind:value={sub.hints}
							placeholder="Hint regex (e.g. netflix|hulu)"
						/>
					</div>
				{/each}
			</div>
			<div class="text-xs text-gray-500 mt-2">
				Total: ${subcategories.reduce((s, sub) => s + (sub.budget || 0), 0).toFixed(2)}/mo
			</div>
		</div>
	{/if}

	<button type="button" class="btn-ghost text-sm" on:click={addSubcategory}>
		+ Add Subcategory
	</button>

	<div>
		<label class="label" for="cat-notes">Notes (optional)</label>
		<textarea id="cat-notes" class="input" rows="2" bind:value={notes}></textarea>
	</div>

	<div>
		<label class="label" for="cat-hints">Auto-assign hint (optional)</label>
		<input
			id="cat-hints"
			class="input"
			type="text"
			bind:value={hints}
			placeholder="e.g. amazon|whole foods|trader joe"
		/>
		<p class="mt-1 text-xs text-gray-500">Case-insensitive regex matched against transaction descriptions on import.</p>
	</div>

	<div class="flex justify-end gap-3 pt-2">
		<button type="button" class="btn-secondary" on:click={() => dispatch('cancel')}>Cancel</button>
		<button type="submit" class="btn-primary">{editCategory ? 'Update' : 'Add'} Category</button>
	</div>
</form>
