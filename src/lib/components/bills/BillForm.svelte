<script lang="ts">
  import { accountsStore } from "$lib/stores/accounts.store"
  import { billsStore } from "$lib/stores/bills.store"
  import { budgetStore } from "$lib/stores/budget.store"
  import type { Bill, BillFrequency, BudgetCategory } from "$lib/types"
  import { createEventDispatcher } from "svelte"

  export let editBill: Bill | null = null

  const dispatch = createEventDispatcher()

  let name = editBill?.name ?? ""
  let amount = editBill?.amount ?? 0
  let frequency: BillFrequency = editBill?.frequency ?? "monthly"
  let dueDayOfMonth = editBill?.dueDayOfMonth ?? 1
  let autoPay = editBill?.autoPay ?? false
  let accountId = editBill?.accountId ?? ""
  let categoryId = editBill?.categoryId ?? ""
  let subcategoryId = editBill?.subcategoryId ?? ""
  let hints = editBill?.hints ?? ""
  let isSubscription = editBill?.isSubscription ?? false
  let isStreamingService = editBill?.isStreamingService ?? false
  let notes = editBill?.notes ?? ""

  function now() {
    return new Date().toISOString()
  }
  function uid() {
    return crypto.randomUUID()
  }

  let budgetCategories: BudgetCategory[] = []
  budgetStore.categories.subscribe(
    (c: BudgetCategory[]) => (budgetCategories = c.slice().sort((a, b) => a.name.localeCompare(b.name))),
  )

  // Subcategories for selected category
  $: subcategories = (budgetCategories.find(c => c.id === categoryId)?.subcategories ?? [])
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))

  function submit() {
    const bill: Bill = {
      id: editBill?.id ?? uid(),
      name,
      amount,
      frequency,
      dueDayOfMonth: ["monthly", "quarterly", "annually"].includes(frequency) ? dueDayOfMonth : undefined,
      autoPay,
      accountId: accountId || undefined,
      categoryId: categoryId || undefined,
      subcategoryId: subcategoryId || undefined,
      hints: hints || undefined,
      isSubscription: isSubscription || undefined,
      isStreamingService: isStreamingService || undefined,
      notes: notes || undefined,
      createdAt: editBill?.createdAt ?? now(),
      updatedAt: now(),
    }

    if (editBill) {
      billsStore.update(editBill.id, bill)
    } else {
      billsStore.add(bill)
    }
    dispatch("save", bill)
  }
</script>

<form on:submit|preventDefault={submit} class="space-y-4">
  <div>
    <label class="label" for="bill-name">Bill Name</label>
    <input id="bill-name" class="input" type="text" bind:value={name} required placeholder="e.g. Electric Bill" />
  </div>

  <div class="grid grid-cols-2 gap-4">
    <div>
      <label class="label" for="bill-amount">Amount ($)</label>
      <input id="bill-amount" class="input" type="number" step="0.01" bind:value={amount} required min="0" />
    </div>
    <div>
      <label class="label" for="bill-freq">Frequency</label>
      <select id="bill-freq" class="input" bind:value={frequency}>
        <option value="monthly">Monthly</option>
        <option value="bimonthly">Every 2 months</option>
        <option value="weekly">Weekly</option>
        <option value="biweekly">Biweekly</option>
        <option value="quarterly">Quarterly</option>
        <option value="annually">Annually</option>
      </select>
    </div>
  </div>

  {#if ["monthly", "quarterly", "annually", "bimonthly"].includes(frequency)}
    <div>
      <label class="label" for="due-day">Due Day of Month</label>
      <input id="due-day" class="input" type="number" min="1" max="31" bind:value={dueDayOfMonth} />
    </div>
  {/if}

  <div>
    <label class="label" for="bill-account">Pay From Account (optional)</label>
    <select id="bill-account" class="input" bind:value={accountId}>
      <option value="">Not specified</option>
      {#each $accountsStore as acct}
        {#if acct.type === "checking" || acct.type === "savings"}
          <option value={acct.id}>{acct.name}</option>
        {/if}
      {/each}
    </select>
  </div>

  <div class="grid grid-cols-2 gap-4">
    <div>
      <label class="label" for="bill-category">Budget Category (optional)</label>
      <select id="bill-category" class="input" bind:value={categoryId} on:change={() => (subcategoryId = "")}>
        <option value="">None</option>
        {#if budgetCategories}
          {#each budgetCategories as cat}
            <option value={cat.id}>{cat.name}</option>
          {/each}
        {/if}
      </select>
    </div>
    {#if subcategories.length > 0}
      <div>
        <label class="label" for="bill-subcategory">Subcategory (optional)</label>
        <select id="bill-subcategory" class="input" bind:value={subcategoryId}>
          <option value="">None</option>
          {#each subcategories as sub}
            <option value={sub.id}>{sub.name}</option>
          {/each}
        </select>
      </div>
    {/if}
  </div>

  <div class="space-y-2">
    <div class="flex items-center gap-3">
      <input id="autopay" type="checkbox" bind:checked={autoPay} class="w-4 h-4 accent-indigo-500" />
      <label for="autopay" class="text-sm text-gray-300 cursor-pointer">Auto-pay enabled</label>
    </div>
    <div class="flex items-center gap-3">
      <input
        id="bill-subscription"
        type="checkbox"
        bind:checked={isSubscription}
        on:change={() => { if (!isSubscription) isStreamingService = false }}
        class="w-4 h-4 accent-indigo-500"
      />
      <label for="bill-subscription" class="text-sm text-gray-300 cursor-pointer">
        Subscription — tracked in Subscription Tracker
      </label>
    </div>
    {#if isSubscription}
      <div class="flex items-center gap-3 pl-6">
        <input
          id="bill-streaming"
          type="checkbox"
          bind:checked={isStreamingService}
          class="w-4 h-4 accent-violet-500"
        />
        <label for="bill-streaming" class="text-sm text-gray-300 cursor-pointer">
          Streaming Service — grouped separately as entertainment
        </label>
      </div>
    {/if}
  </div>

  <div>
    <label class="label" for="bill-hints">Import Match Pattern (optional)</label>
    <input
      id="bill-hints"
      class="input font-mono text-sm"
      type="text"
      bind:value={hints}
      placeholder="e.g. electric|utility|xcel"
    />
    <p class="mt-1 text-xs text-gray-500">
      Regex matched against imported transaction descriptions to auto-resolve this bill.
    </p>
  </div>

  <div>
    <label class="label" for="bill-notes">Notes (optional)</label>
    <textarea id="bill-notes" class="input" rows="2" bind:value={notes}></textarea>
  </div>

  <div class="flex justify-end gap-3 pt-2">
    <button type="button" class="btn-secondary" on:click={() => dispatch("cancel")}>Cancel</button>
    <button type="submit" class="btn-primary">{editBill ? "Update" : "Add"} Bill</button>
  </div>
</form>
