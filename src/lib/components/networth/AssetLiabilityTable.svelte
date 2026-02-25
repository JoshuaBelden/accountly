<script lang="ts">
	import { accountsStore } from '$lib/stores/accounts.store';
	import { formatCurrency } from '$lib/utils/currency';
	import type { LoanAccount, AssetAccount, InvestmentAccount } from '$lib/types';

	$: assets = $accountsStore.filter(
		(a) => a.type === 'checking' || a.type === 'savings' || a.type === 'investment' || a.type === 'asset'
	);
	$: liabilities = $accountsStore.filter((a) => a.type === 'loan');

	function assetValue(a: typeof assets[number]): number {
		if (a.type === 'asset') return (a as AssetAccount).estimatedValue;
		if (a.type === 'investment') return (a as InvestmentAccount).currentBalance;
		return a.balance;
	}

	$: assetTotal = assets.reduce((s, a) => s + assetValue(a), 0);
	$: liabilityTotal = liabilities.reduce((s, a) => s + (a as LoanAccount).remainingBalance, 0);
</script>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
	<!-- Assets -->
	<div class="card">
		<h3 class="section-title text-emerald-400">Assets</h3>
		{#if assets.length === 0}
			<p class="text-gray-500 text-sm">No assets added yet</p>
		{:else}
			<div class="space-y-2">
				{#each assets as asset}
					<div class="flex justify-between text-sm py-1 border-b border-gray-700 last:border-0">
						<div>
							<div class="text-gray-200">{asset.name}</div>
							<div class="text-xs text-gray-500 capitalize">{asset.type}</div>
						</div>
						<div class="text-gray-100 font-medium tabular-nums">{formatCurrency(assetValue(asset))}</div>
					</div>
				{/each}
			</div>
			<div class="mt-3 pt-3 border-t border-gray-600 flex justify-between font-semibold">
				<span class="text-gray-300">Total Assets</span>
				<span class="text-emerald-400 tabular-nums">{formatCurrency(assetTotal)}</span>
			</div>
		{/if}
	</div>

	<!-- Liabilities -->
	<div class="card">
		<h3 class="section-title text-red-400">Liabilities</h3>
		{#if liabilities.length === 0}
			<p class="text-gray-500 text-sm">No liabilities added yet</p>
		{:else}
			<div class="space-y-2">
				{#each liabilities as loan}
					<div class="flex justify-between text-sm py-1 border-b border-gray-700 last:border-0">
						<div>
							<div class="text-gray-200">{loan.name}</div>
							<div class="text-xs text-gray-500">Loan · {((loan as LoanAccount).interestRate * 100).toFixed(2)}% APR</div>
						</div>
						<div class="text-red-400 font-medium tabular-nums">{formatCurrency((loan as LoanAccount).remainingBalance)}</div>
					</div>
				{/each}
			</div>
			<div class="mt-3 pt-3 border-t border-gray-600 flex justify-between font-semibold">
				<span class="text-gray-300">Total Liabilities</span>
				<span class="text-red-400 tabular-nums">{formatCurrency(liabilityTotal)}</span>
			</div>
		{/if}
	</div>
</div>
