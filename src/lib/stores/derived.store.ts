import { derived } from 'svelte/store';
import { accountsStore } from './accounts.store';
import type { LoanAccount, AssetAccount } from '$lib/types';

export const totalLiquid = derived(accountsStore, ($accounts) =>
	$accounts
		.filter((a) => a.type === 'checking' || a.type === 'savings')
		.reduce((sum, a) => sum + a.balance, 0)
);

export const totalLiabilities = derived(accountsStore, ($accounts) =>
	$accounts
		.filter((a) => a.type === 'loan')
		.reduce((sum, a) => sum + (a as LoanAccount).remainingBalance, 0)
);

export const totalAssets = derived(accountsStore, ($accounts) =>
	$accounts.reduce((sum, a) => {
		if (a.type === 'checking' || a.type === 'savings') return sum + a.balance;
		if (a.type === 'investment') return sum + a.balance;
		if (a.type === 'asset') return sum + (a as AssetAccount).estimatedValue;
		return sum;
	}, 0)
);

export const netWorth = derived(
	[totalAssets, totalLiabilities],
	([$assets, $liabilities]) => $assets - $liabilities
);
