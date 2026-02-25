<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { get } from 'svelte/store';
	import { transactionsStore } from '$lib/stores/transactions.store';
	import { accountsStore, checkingAccounts, savingsAccounts } from '$lib/stores/accounts.store';
	import { budgetStore } from '$lib/stores/budget.store';
	import Modal from '$lib/components/shared/Modal.svelte';
	import { parseCsv, type ParsedCsvRow } from '$lib/utils/csvImport';
	import { formatCurrency } from '$lib/utils/currency';
	import { formatDateShort, todayISO } from '$lib/utils/date';
	import type { Transaction } from '$lib/types';

	export let open = false;

	const dispatch = createEventDispatcher();

	type RowWithMeta = ParsedCsvRow & { isDuplicate: boolean };

	let step: 'upload' | 'preview' = 'upload';
	let selectedAccountId = '';
	let parsedRows: RowWithMeta[] = [];
	let selected: boolean[] = [];
	let dragover = false;
	let error = '';
	let fileInput: HTMLInputElement;

	$: accounts = [...$checkingAccounts, ...$savingsAccounts];
	$: selectedCount = selected.filter(Boolean).length;
	$: duplicateCount = parsedRows.filter((r) => r.isDuplicate).length;
	$: allSelected = selected.length > 0 && selected.every(Boolean);
	// If the first (most recent) row is today, its balance reflects the current account balance
	$: balanceUpdate = parsedRows.length > 0 && parsedRows[0].date === todayISO()
		? parsedRows[0].balance
		: null;

	function reset() {
		step = 'upload';
		parsedRows = [];
		selected = [];
		selectedAccountId = '';
		error = '';
		dragover = false;
	}

	function handleClose() {
		reset();
		dispatch('close');
	}

	function processFile(file: File) {
		if (!file.name.toLowerCase().endsWith('.csv')) {
			error = 'Please select a CSV file.';
			return;
		}
		error = '';
		const reader = new FileReader();
		reader.onload = (evt) => {
			try {
				const text = evt.target?.result as string;
				const rows = parseCsv(text);
				if (rows.length === 0) {
					error = 'No transactions found in the file.';
					return;
				}
				const existing = get(transactionsStore);
				const existingKeys = new Set(
					existing.map((t) => `${t.date}|${t.description}|${t.amount}`)
				);
				parsedRows = rows.map((r) => ({
					...r,
					isDuplicate: existingKeys.has(`${r.date}|${r.description}|${r.amount}`)
				}));
				selected = parsedRows.map((r) => !r.isDuplicate);
				if (accounts.length === 1) selectedAccountId = accounts[0].id;
				step = 'preview';
			} catch {
				error = 'Failed to parse the CSV file. Please check the format.';
			}
		};
		reader.onerror = () => {
			error = 'Failed to read the file.';
		};
		reader.readAsText(file);
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragover = false;
		const file = e.dataTransfer?.files[0];
		if (file) processFile(file);
	}

	function handleDragover(e: DragEvent) {
		e.preventDefault();
		dragover = true;
	}

	function handleFileInput(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (file) processFile(file);
	}

	function toggleAll() {
		const newVal = !allSelected;
		selected = selected.map(() => newVal);
	}

	function skipDuplicates() {
		selected = parsedRows.map((r) => !r.isDuplicate);
	}

	function matchCategory(description: string): { categoryId: string; subcategoryId?: string } | undefined {
		const categories = get(budgetStore.categories);
		for (const cat of categories) {
			for (const sub of cat.subcategories) {
				if (!sub.hints) continue;
				try {
					if (new RegExp(sub.hints, 'i').test(description))
						return { categoryId: cat.id, subcategoryId: sub.id };
				} catch { /* invalid regex — skip */ }
			}
			if (!cat.hints) continue;
			try {
				if (new RegExp(cat.hints, 'i').test(description)) return { categoryId: cat.id };
			} catch { /* invalid regex — skip */ }
		}
		return undefined;
	}

	function importSelected() {
		if (!selectedAccountId) {
			error = 'Please select an account.';
			return;
		}
		const now = new Date().toISOString();
		parsedRows.forEach((row, i) => {
			if (!selected[i]) return;
			const match = matchCategory(row.description);
			const tx: Transaction = {
				id: crypto.randomUUID(),
				date: row.date,
				description: row.description,
				amount: row.amount,
				type: row.rawType === 'Credit' ? 'income' : 'expense',
				accountId: selectedAccountId,
				clearedStatus: 'cleared',
				imported: true,
				...match,
				createdAt: now,
				updatedAt: now
			};
			transactionsStore.add(tx);
		});
		if (balanceUpdate !== null) {
			accountsStore.update(selectedAccountId, { balance: balanceUpdate });
		}
		reset();
		dispatch('close');
	}
</script>

<Modal {open} title="Import Transactions" width="max-w-3xl" on:close={handleClose}>
	{#if step === 'upload'}
		<!-- Drop zone -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div
			class="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed px-8 py-14 text-center transition-colors
				{dragover
				? 'border-indigo-400 bg-indigo-950/20'
				: 'border-gray-600 hover:border-gray-500'}"
			on:drop={handleDrop}
			on:dragover={handleDragover}
			on:dragleave={() => (dragover = false)}
		>
			<svg
				class="w-12 h-12 text-gray-500"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="1.5"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
				/>
			</svg>
			<div>
				<p class="text-gray-200 font-medium">Drop your CSV file here</p>
				<p class="text-sm text-gray-500 mt-1">or</p>
			</div>
			<button type="button" class="btn-secondary text-sm" on:click={() => fileInput.click()}>
				Browse files
			</button>
			<p class="text-xs text-gray-600">Supports bank export CSV files</p>
		</div>

		<input
			bind:this={fileInput}
			type="file"
			accept=".csv"
			class="hidden"
			on:change={handleFileInput}
		/>

		{#if error}
			<p class="mt-3 text-sm text-red-400">{error}</p>
		{/if}
	{:else}
		<!-- Preview step -->
		<div class="space-y-4">
			<!-- Account selector -->
			<div class="flex items-center gap-3">
				<label class="label mb-0 whitespace-nowrap" for="import-account">Import to account</label>
				<select id="import-account" class="input flex-1" bind:value={selectedAccountId}>
					<option value="">Select account…</option>
					{#each accounts as acct}
						<option value={acct.id}>{acct.name}</option>
					{/each}
				</select>
			</div>

			<!-- Balance update notice -->
			{#if balanceUpdate !== null}
				<div class="flex items-center gap-2 rounded-lg border border-indigo-800/50 bg-indigo-950/30 px-3 py-2 text-sm text-indigo-300">
					<svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
						<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
					</svg>
					Most recent transaction is from today — account balance will be updated to <span class="font-medium text-indigo-200">{formatCurrency(balanceUpdate)}</span>.
				</div>
			{/if}

			<!-- Stats + bulk actions -->
			<div class="flex items-center justify-between">
				<p class="text-sm text-gray-400">
					<span class="text-gray-200 font-medium">{parsedRows.length}</span> transactions parsed
					{#if duplicateCount > 0}
						· <span class="text-yellow-400 font-medium">{duplicateCount}</span> possible duplicates
					{/if}
				</p>
				<div class="flex gap-2">
					<button type="button" class="btn-secondary text-xs py-1 px-2" on:click={toggleAll}>
						{allSelected ? 'Deselect All' : 'Select All'}
					</button>
					{#if duplicateCount > 0}
						<button
							type="button"
							class="btn-secondary text-xs py-1 px-2"
							on:click={skipDuplicates}
						>
							Skip Duplicates
						</button>
					{/if}
				</div>
			</div>

			<!-- Transaction table -->
			<div class="rounded-lg border border-gray-700 overflow-hidden">
				<div class="overflow-y-auto max-h-80">
					<table class="w-full text-sm">
						<thead class="bg-gray-800/60 sticky top-0">
							<tr class="text-left text-xs text-gray-400">
								<th class="px-3 py-2 w-8"></th>
								<th class="px-3 py-2 whitespace-nowrap">Date</th>
								<th class="px-3 py-2">Description</th>
								<th class="px-3 py-2 whitespace-nowrap">Type</th>
								<th class="px-3 py-2 text-right whitespace-nowrap">Amount</th>
								<th class="px-3 py-2 w-6"></th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-700/50">
							{#each parsedRows as row, i}
								<tr
									class="transition-colors
										{selected[i] ? 'bg-gray-800/20' : 'opacity-40'}
										{row.isDuplicate ? 'bg-yellow-950/10' : ''}"
								>
									<td class="px-3 py-2">
										<input
											type="checkbox"
											bind:checked={selected[i]}
											class="rounded border-gray-600 bg-gray-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-gray-900"
										/>
									</td>
									<td class="px-3 py-2 text-gray-400 tabular-nums whitespace-nowrap">
										{formatDateShort(row.date)}
									</td>
									<td class="px-3 py-2 text-gray-200 max-w-xs">
										<span class="block truncate" title={row.description}>{row.description}</span>
									</td>
									<td class="px-3 py-2">
										{#if row.rawType === 'Credit'}
											<span
												class="text-xs px-1.5 py-0.5 rounded border text-emerald-400 bg-emerald-950/30 border-emerald-800/50"
											>
												Income
											</span>
										{:else}
											<span
												class="text-xs px-1.5 py-0.5 rounded border text-red-400 bg-red-950/30 border-red-800/50"
											>
												Expense
											</span>
										{/if}
									</td>
									<td
										class="px-3 py-2 text-right tabular-nums font-medium
											{row.rawType === 'Credit' ? 'text-emerald-400' : 'text-red-400'}"
									>
										{row.rawType === 'Credit' ? '+' : '-'}{formatCurrency(row.amount)}
									</td>
									<td class="px-3 py-2">
										{#if row.isDuplicate}
											<span title="Possible duplicate" class="text-yellow-500">
												<svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
													<path
														fill-rule="evenodd"
														d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
														clip-rule="evenodd"
													/>
												</svg>
											</span>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>

			{#if error}
				<p class="text-sm text-red-400">{error}</p>
			{/if}
		</div>
	{/if}

	<svelte:fragment slot="footer">
		{#if step === 'preview'}
			<span class="text-sm text-gray-400 mr-auto">
				{selectedCount} of {parsedRows.length} selected
			</span>
			<button type="button" class="btn-secondary" on:click={() => (step = 'upload')}>Back</button>
			<button
				type="button"
				class="btn-primary"
				disabled={selectedCount === 0 || !selectedAccountId}
				on:click={importSelected}
			>
				Import {selectedCount}
				{selectedCount === 1 ? 'transaction' : 'transactions'}
			</button>
		{/if}
	</svelte:fragment>
</Modal>
