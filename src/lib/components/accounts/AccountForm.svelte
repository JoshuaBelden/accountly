<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { accountsStore } from '$lib/stores/accounts.store';
	import { paychecksStore } from '$lib/stores/paychecks.store';
	import type {
		Account,
		AccountType,
		AssetSubtype,
		LoanFrequency,
		CheckingAccount,
		SavingsAccount,
		LoanAccount,
		AssetAccount,
		InvestmentAccount,
		Paycheck,
		PayFrequency
	} from '$lib/types';
	import { todayISO } from '$lib/utils/date';

	export let editAccount: Account | null = null;

	const dispatch = createEventDispatcher();

	type FormMode = 'account' | 'paycheck';
	let formMode: FormMode = 'account';

	// Account form fields
	let type: AccountType = (editAccount?.type as AccountType) ?? 'checking';
	let name = editAccount?.name ?? '';
	let balance = editAccount?.balance ?? 0;
	let notes = editAccount?.notes ?? '';

	// Loan/Asset specific
	let originalBalance = (editAccount as LoanAccount)?.originalBalance ?? 0;
	let remainingBalance = (editAccount as LoanAccount)?.remainingBalance ?? 0;
	let interestRate = ((editAccount as LoanAccount)?.interestRate ?? 0) * 100;
	let minimumPayment = (editAccount as LoanAccount)?.minimumPayment ?? 0;
	let paymentDueDay = (editAccount as LoanAccount)?.paymentDueDay ?? 1;
	let paymentFrequency: LoanFrequency = (editAccount as LoanAccount)?.paymentFrequency ?? 'monthly';

	// Asset specific
	let assetSubtype: AssetSubtype = (editAccount as AssetAccount)?.assetSubtype ?? 'other';
	let estimatedValue = (editAccount as AssetAccount)?.estimatedValue ?? 0;

	// Investment specific
	let institution = (editAccount as InvestmentAccount)?.institution ?? '';
	let currentBalance = (editAccount as InvestmentAccount)?.currentBalance ?? 0;

	// Paycheck form fields
	let paycheckName = '';
	let paycheckAmount = 0;
	let paycheckFrequency: PayFrequency = 'biweekly';
	let paycheckAccountId = editAccount?.id ?? '';
	let biweeklyAnchorDate = todayISO();
	let semimonthlyFirst = 1;
	let semimonthlySecond = 15;
	let monthlyDay = 1;
	let weeklyAnchorDate = todayISO();

	function now() { return new Date().toISOString(); }
	function uid() { return crypto.randomUUID(); }

	function saveAccount() {
		const base = { id: editAccount?.id ?? uid(), name, balance, notes, createdAt: editAccount?.createdAt ?? now(), updatedAt: now() };

		let account: Account;
		switch (type) {
			case 'checking':
				account = { ...base, type: 'checking' } as CheckingAccount;
				break;
			case 'savings':
				account = { ...base, type: 'savings' } as SavingsAccount;
				break;
			case 'loan':
				account = { ...base, type: 'loan', originalBalance, remainingBalance, interestRate: interestRate / 100, minimumPayment, paymentDueDay, paymentFrequency } as LoanAccount;
				break;
			case 'asset':
				account = { ...base, type: 'asset', assetSubtype, estimatedValue, remainingBalance, interestRate: interestRate / 100, minimumPayment, paymentDueDay } as AssetAccount;
				break;
			case 'investment':
				account = { ...base, type: 'investment', institution, currentBalance, balance: currentBalance } as InvestmentAccount;
				break;
			default:
				return;
		}

		if (editAccount) {
			accountsStore.update(editAccount.id, account);
		} else {
			accountsStore.add(account);
		}
		dispatch('save', account);
	}

	function savePaycheck() {
		const paycheck: Paycheck = {
			id: uid(),
			name: paycheckName,
			expectedAmount: paycheckAmount,
			frequency: paycheckFrequency,
			accountId: paycheckAccountId,
			biweeklyAnchorDate: paycheckFrequency === 'biweekly' ? biweeklyAnchorDate : undefined,
			semimonthlyDays: paycheckFrequency === 'semimonthly' ? { firstDay: semimonthlyFirst, secondDay: semimonthlySecond } : undefined,
			monthlyDay: paycheckFrequency === 'monthly' ? monthlyDay : undefined,
			weeklyAnchorDate: paycheckFrequency === 'weekly' ? weeklyAnchorDate : undefined,
			createdAt: now(),
			updatedAt: now()
		};
		paychecksStore.add(paycheck);
		dispatch('save', paycheck);
	}

	function submit() {
		if (formMode === 'account') saveAccount();
		else savePaycheck();
	}
</script>

<div class="mb-4 flex gap-2">
	<button
		type="button"
		class="{formMode === 'account' ? 'btn-primary' : 'btn-secondary'} text-xs"
		on:click={() => formMode = 'account'}
	>Account</button>
	<button
		type="button"
		class="{formMode === 'paycheck' ? 'btn-primary' : 'btn-secondary'} text-xs"
		on:click={() => formMode = 'paycheck'}
	>Paycheck</button>
</div>

<form on:submit|preventDefault={submit} class="space-y-4">
	{#if formMode === 'account'}
		<div>
			<label class="label" for="acct-type">Account Type</label>
			<select id="acct-type" class="input" bind:value={type}>
				<option value="checking">Checking</option>
				<option value="savings">Savings</option>
				<option value="loan">Loan</option>
				<option value="asset">Asset</option>
				<option value="investment">Investment</option>
			</select>
		</div>

		<div>
			<label class="label" for="acct-name">Name</label>
			<input id="acct-name" class="input" type="text" bind:value={name} required placeholder="e.g. Chase Checking" />
		</div>

		{#if type === 'asset'}
			<div>
				<label class="label" for="asset-subtype">Asset Type</label>
				<select id="asset-subtype" class="input" bind:value={assetSubtype}>
					<option value="mortgage">Mortgage</option>
					<option value="vehicle">Vehicle</option>
					<option value="other">Other</option>
				</select>
			</div>
			<div>
				<label class="label" for="est-value">Estimated Market Value ($)</label>
				<input id="est-value" class="input" type="number" step="0.01" bind:value={estimatedValue} />
			</div>
		{:else if type === 'investment'}
			<div>
				<label class="label" for="institution">Institution (optional)</label>
				<input id="institution" class="input" type="text" bind:value={institution} placeholder="e.g. Fidelity" />
			</div>
			<div>
				<label class="label" for="inv-balance">Current Balance ($)</label>
				<input id="inv-balance" class="input" type="number" step="0.01" bind:value={currentBalance} />
			</div>
		{:else}
			<div>
				<label class="label" for="acct-balance">Balance ($)</label>
				<input id="acct-balance" class="input" type="number" step="0.01" bind:value={balance} />
			</div>
		{/if}

		{#if type === 'loan' || type === 'asset'}
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label class="label" for="orig-balance">Original Balance ($)</label>
					<input id="orig-balance" class="input" type="number" step="0.01" bind:value={originalBalance} />
				</div>
				<div>
					<label class="label" for="rem-balance">Remaining Balance ($)</label>
					<input id="rem-balance" class="input" type="number" step="0.01" bind:value={remainingBalance} />
				</div>
				<div>
					<label class="label" for="int-rate">Interest Rate (APR %)</label>
					<input id="int-rate" class="input" type="number" step="0.01" bind:value={interestRate} />
				</div>
				<div>
					<label class="label" for="min-payment">Monthly Payment ($)</label>
					<input id="min-payment" class="input" type="number" step="0.01" bind:value={minimumPayment} />
				</div>
				<div>
					<label class="label" for="due-day">Payment Due Day</label>
					<input id="due-day" class="input" type="number" min="1" max="31" bind:value={paymentDueDay} />
				</div>
				{#if type === 'loan'}
					<div>
						<label class="label" for="pay-freq">Payment Frequency</label>
						<select id="pay-freq" class="input" bind:value={paymentFrequency}>
							<option value="monthly">Monthly</option>
							<option value="biweekly">Biweekly</option>
							<option value="weekly">Weekly</option>
						</select>
					</div>
				{/if}
			</div>
		{/if}

		<div>
			<label class="label" for="acct-notes">Notes (optional)</label>
			<textarea id="acct-notes" class="input" rows="2" bind:value={notes}></textarea>
		</div>
	{:else}
		<!-- Paycheck Form -->
		<div>
			<label class="label" for="pc-name">Paycheck Name</label>
			<input id="pc-name" class="input" type="text" bind:value={paycheckName} required placeholder="e.g. Main Job" />
		</div>
		<div>
			<label class="label" for="pc-amount">Expected Amount ($)</label>
			<input id="pc-amount" class="input" type="number" step="0.01" bind:value={paycheckAmount} required />
		</div>
		<div>
			<label class="label" for="pc-freq">Pay Frequency</label>
			<select id="pc-freq" class="input" bind:value={paycheckFrequency}>
				<option value="weekly">Weekly</option>
				<option value="biweekly">Biweekly</option>
				<option value="semimonthly">Semimonthly (e.g. 1st & 15th)</option>
				<option value="monthly">Monthly</option>
			</select>
		</div>
		<div>
			<label class="label" for="pc-account">Deposit Account</label>
			<select id="pc-account" class="input" bind:value={paycheckAccountId} required>
				<option value="">Select account</option>
				{#each $accountsStore as acct}
					{#if acct.type === 'checking' || acct.type === 'savings'}
						<option value={acct.id}>{acct.name}</option>
					{/if}
				{/each}
			</select>
		</div>

		{#if paycheckFrequency === 'biweekly'}
			<div>
				<label class="label" for="bw-anchor">Known Pay Date</label>
				<input id="bw-anchor" class="input" type="date" bind:value={biweeklyAnchorDate} />
			</div>
		{:else if paycheckFrequency === 'weekly'}
			<div>
				<label class="label" for="wk-anchor">Known Pay Date</label>
				<input id="wk-anchor" class="input" type="date" bind:value={weeklyAnchorDate} />
			</div>
		{:else if paycheckFrequency === 'semimonthly'}
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label class="label" for="sm-first">First Pay Day</label>
					<input id="sm-first" class="input" type="number" min="1" max="28" bind:value={semimonthlyFirst} />
				</div>
				<div>
					<label class="label" for="sm-second">Second Pay Day</label>
					<input id="sm-second" class="input" type="number" min="1" max="28" bind:value={semimonthlySecond} />
				</div>
			</div>
		{:else if paycheckFrequency === 'monthly'}
			<div>
				<label class="label" for="mo-day">Pay Day</label>
				<input id="mo-day" class="input" type="number" min="1" max="28" bind:value={monthlyDay} />
			</div>
		{/if}
	{/if}

	<div class="flex justify-end gap-3 pt-2">
		<button type="button" class="btn-secondary" on:click={() => dispatch('cancel')}>Cancel</button>
		<button type="submit" class="btn-primary">
			{editAccount ? 'Update' : 'Add'}
		</button>
	</div>
</form>
