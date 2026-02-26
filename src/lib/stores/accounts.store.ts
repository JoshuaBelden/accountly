import { loadFromStorage, saveToStorage } from "$lib/persistence/localStorage"
import type { Account, AssetAccount, CheckingAccount, InvestmentAccount, LoanAccount, SavingsAccount } from "$lib/types"
import { derived, writable } from "svelte/store"

const KEY = "accounts"

function now() {
  return new Date().toISOString()
}

function createAccountsStore() {
  const store = writable<Account[]>(loadFromStorage<Account[]>(KEY, []))
  store.subscribe(v => saveToStorage(KEY, v))

  return {
    subscribe: store.subscribe,
    set: store.set,
    add(account: Account) {
      store.update(list => [...list, account])
    },
    update(id: string, changes: Partial<Account>) {
      store.update(list => list.map(a => (a.id === id ? ({ ...a, ...changes, updatedAt: now() } as Account) : a)))
    },
    remove(id: string) {
      store.update(list => list.filter(a => a.id !== id))
    },
  }
}

export const accountsStore = createAccountsStore()

export const checkingAccounts = derived(accountsStore, $a =>
  $a.filter((a): a is CheckingAccount => a.type === "checking"),
)
export const savingsAccounts = derived(accountsStore, $a => $a.filter((a): a is SavingsAccount => a.type === "savings"))
export const loanAccounts = derived(accountsStore, $a => $a.filter((a): a is LoanAccount => a.type === "loan"))
export const assetAccounts = derived(accountsStore, $a => $a.filter((a): a is AssetAccount => a.type === "asset"))
export const investmentAccounts = derived(accountsStore, $a =>
  $a.filter((a): a is InvestmentAccount => a.type === "investment"),
)
