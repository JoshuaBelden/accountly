<script lang="ts">
  import AccountCard from "$lib/components/accounts/AccountCard.svelte"
  import AccountForm from "$lib/components/accounts/AccountForm.svelte"
  import AssetCard from "$lib/components/accounts/AssetCard.svelte"
  import InvestmentCard from "$lib/components/accounts/InvestmentCard.svelte"
  import LoanCard from "$lib/components/accounts/LoanCard.svelte"
  import EmptyState from "$lib/components/shared/EmptyState.svelte"
  import HoldToDelete from "$lib/components/shared/HoldToDelete.svelte"
  import Modal from "$lib/components/shared/Modal.svelte"
  import {
    accountsStore,
    assetAccounts,
    checkingAccounts,
    investmentAccounts,
    loanAccounts,
    savingsAccounts,
  } from "$lib/stores/accounts.store"
  import { billsStore } from "$lib/stores/bills.store"
  import { paychecksStore } from "$lib/stores/paychecks.store"
  import { plannerStore } from "$lib/stores/planner.store"
  import { transactionsStore } from "$lib/stores/transactions.store"
  import type { Account, AssetAccount, InvestmentAccount, LoanAccount, Paycheck } from "$lib/types"
  import { formatCurrency } from "$lib/utils/currency"
  import { findMatchingPayDate } from "$lib/utils/date"
  import { get } from "svelte/store"

  let modalOpen = false
  let editAccount: Account | null = null
  let editPaycheck: Paycheck | null = null
  let updateMessage = ""
  let updateMessageTimer: ReturnType<typeof setTimeout> | null = null

  function openAdd() {
    editAccount = null
    editPaycheck = null
    modalOpen = true
  }

  function openEdit(e: CustomEvent<Account>) {
    editAccount = e.detail
    editPaycheck = null
    modalOpen = true
  }

  function openEditPaycheck(paycheck: Paycheck) {
    editAccount = null
    editPaycheck = paycheck
    modalOpen = true
  }

  function closeModal() {
    modalOpen = false
    editAccount = null
    editPaycheck = null
  }

  function handleDelete(e: CustomEvent<Account>) {
    accountsStore.remove(e.detail.id)
  }

  function getAccountName(id: string) {
    return $accountsStore.find(a => a.id === id)?.name ?? "Unknown"
  }

  const freqLabels: Record<string, string> = {
    weekly: "Weekly",
    biweekly: "Biweekly",
    semimonthly: "Semimonthly",
    monthly: "Monthly",
  }

  const incomeTypeLabels: Record<string, string> = {
    paycheck: "Paycheck",
    other: "Other",
  }

  /** Re-tests all transactions against bill and paycheck hint patterns, updating any that match. */
  function reapplyHints() {
    const transactions = get(transactionsStore)
    const bills = get(billsStore)
    const paychecks = get(paychecksStore)
    let matchCount = 0

    for (const transaction of transactions) {
      let matched = false

      for (const bill of bills) {
        if (!bill.hints) continue
        try {
          if (new RegExp(bill.hints, "i").test(transaction.description)) {
            const month = transaction.date.substring(0, 7)
            plannerStore.clearTransactionLink(transaction.id)
            const assignments = plannerStore.getForMonth(month)
            const assignment = assignments.find(a => a.billId === bill.id)
            if (assignment) plannerStore.linkTransaction(assignment.id, transaction.id)
            transactionsStore.update(transaction.id, {
              billId: bill.id,
              paycheckId: undefined,
              type: "bill_payment",
              plannerMonth: month,
            })
            matched = true
            matchCount++
            break
          }
        } catch {
          /* invalid regex — skip */
        }
      }

      if (!matched) {
        for (const paycheck of paychecks) {
          if (!paycheck.hints) continue
          try {
            if (new RegExp(paycheck.hints, "i").test(transaction.description)) {
              const payDate = findMatchingPayDate(paycheck, transaction.date)
              transactionsStore.update(transaction.id, {
                paycheckId: paycheck.id,
                billId: undefined,
                type: "income",
                clearedStatus: "cleared",
                plannedPaycheckDate: payDate,
                plannerMonth: payDate ? payDate.substring(0, 7) : transaction.date.substring(0, 7),
              })
              matched = true
              matchCount++
              break
            }
          } catch {
            /* invalid regex — skip */
          }
        }
      }
    }

    updateMessage = `Updated ${matchCount} transaction${matchCount === 1 ? "" : "s"}`
    if (updateMessageTimer) clearTimeout(updateMessageTimer)
    updateMessageTimer = setTimeout(() => (updateMessage = ""), 4000)
  }
</script>

<div class="max-w-4xl mx-auto space-y-8">
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-bold text-gray-100">Accounts</h1>
    <div class="flex items-center gap-3">
      {#if updateMessage}
        <span class="text-sm text-emerald-400">{updateMessage}</span>
      {/if}
      <button class="btn-secondary" on:click={reapplyHints}>Update Transactions</button>
      <button class="btn-primary" on:click={openAdd}>
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add Account
      </button>
    </div>
  </div>

  <!-- Checking -->
  <section>
    <h2 class="section-title flex items-center gap-2">
      Checking
      {#if $checkingAccounts.length > 0}
        <span class="text-sm font-normal text-gray-400">
          Total: {formatCurrency($checkingAccounts.reduce((s, a) => s + a.balance, 0))}
        </span>
      {/if}
    </h2>
    {#if $checkingAccounts.length === 0}
      <EmptyState
        title="No checking accounts"
        description="Add a checking account to track your daily spending."
        actionLabel="Add Checking"
        on:action={openAdd}
      />
    {:else}
      <div class="space-y-3">
        {#each $checkingAccounts as account (account.id)}
          <AccountCard {account} on:edit={openEdit} on:delete={handleDelete} />
        {/each}
      </div>
    {/if}
  </section>

  <!-- Savings -->
  <section>
    <h2 class="section-title flex items-center gap-2">
      Savings
      {#if $savingsAccounts.length > 0}
        <span class="text-sm font-normal text-gray-400">
          Total: {formatCurrency($savingsAccounts.reduce((s, a) => s + a.balance, 0))}
        </span>
      {/if}
    </h2>
    {#if $savingsAccounts.length === 0}
      <EmptyState
        title="No savings accounts"
        description="Add a savings account to track your savings goals."
        actionLabel="Add Savings"
        on:action={openAdd}
      />
    {:else}
      <div class="space-y-3">
        {#each $savingsAccounts as account (account.id)}
          <AccountCard {account} on:edit={openEdit} on:delete={handleDelete} />
        {/each}
      </div>
    {/if}
  </section>

  <!-- Loans -->
  <section>
    <h2 class="section-title flex items-center gap-2">
      Loans
      {#if $loanAccounts.length > 0}
        <span class="text-sm font-normal text-gray-400">
          Total Owed: {formatCurrency($loanAccounts.reduce((s, a) => s + (a as LoanAccount).remainingBalance, 0))}
        </span>
      {/if}
    </h2>
    {#if $loanAccounts.length === 0}
      <EmptyState
        title="No loans"
        description="Add a loan to track payments and see your payoff date."
        actionLabel="Add Loan"
        on:action={openAdd}
      />
    {:else}
      <div class="space-y-3">
        {#each $loanAccounts as loan (loan.id)}
          <LoanCard loan={loan as LoanAccount} on:edit={openEdit} on:delete={handleDelete} />
        {/each}
      </div>
    {/if}
  </section>

  <!-- Assets -->
  <section>
    <h2 class="section-title flex items-center gap-2">
      Assets
      {#if $assetAccounts.length > 0}
        <span class="text-sm font-normal text-gray-400">
          Est. Value: {formatCurrency($assetAccounts.reduce((s, a) => s + (a as AssetAccount).estimatedValue, 0))}
        </span>
      {/if}
    </h2>
    {#if $assetAccounts.length === 0}
      <EmptyState
        title="No assets"
        description="Add mortgages, vehicles, or other assets to your net worth."
        actionLabel="Add Asset"
        on:action={openAdd}
      />
    {:else}
      <div class="space-y-3">
        {#each $assetAccounts as asset (asset.id)}
          <AssetCard asset={asset as AssetAccount} on:edit={openEdit} on:delete={handleDelete} />
        {/each}
      </div>
    {/if}
  </section>

  <!-- Investments -->
  <section>
    <h2 class="section-title flex items-center gap-2">
      Investments
      {#if $investmentAccounts.length > 0}
        <span class="text-sm font-normal text-gray-400">
          Total: {formatCurrency($investmentAccounts.reduce((s, a) => s + (a as InvestmentAccount).currentBalance, 0))}
        </span>
      {/if}
    </h2>
    {#if $investmentAccounts.length === 0}
      <EmptyState
        title="No investments"
        description="Track 401k, IRA, brokerage accounts, and more."
        actionLabel="Add Investment"
        on:action={openAdd}
      />
    {:else}
      <div class="space-y-3">
        {#each $investmentAccounts as inv (inv.id)}
          <InvestmentCard investment={inv as InvestmentAccount} on:edit={openEdit} on:delete={handleDelete} />
        {/each}
      </div>
    {/if}
  </section>

  <!-- Income -->
  <section>
    <h2 class="section-title">Income</h2>
    {#if $paychecksStore.length === 0}
      <EmptyState
        title="No income configured"
        description="Set up your income sources so the Monthly Planner can organize your bills."
        actionLabel="Add Income"
        on:action={openAdd}
      />
    {:else}
      <div class="space-y-3">
        {#each $paychecksStore as pc (pc.id)}
          <div class="card flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-indigo-900 flex items-center justify-center">
                <svg class="w-5 h-5 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div>
                <div class="font-medium text-gray-100">{pc.name}</div>
                <div class="text-xs text-gray-500">
                  {incomeTypeLabels[pc.incomeType ?? "paycheck"]} · {freqLabels[pc.frequency]} → {getAccountName(
                    pc.accountId,
                  )}
                </div>
              </div>
            </div>
            <div class="flex items-center gap-4">
              <div class="text-right">
                <div class="font-semibold text-emerald-400 tabular-nums">{formatCurrency(pc.expectedAmount)}</div>
              </div>
              <button
                class="p-1.5 text-gray-500 hover:text-gray-200 transition-colors"
                title="Edit income"
                on:click={() => openEditPaycheck(pc)}
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <HoldToDelete label="Delete income" on:confirm={() => paychecksStore.remove(pc.id)} />
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </section>
</div>

<Modal
  open={modalOpen}
  title={editPaycheck ? "Edit Income" : editAccount ? "Edit Account" : "Add"}
  on:close={closeModal}
>
  <AccountForm {editAccount} {editPaycheck} on:save={closeModal} on:cancel={closeModal} />
</Modal>
