import { loadFromStorage, saveToStorage } from "$lib/persistence/localStorage"
import type { Account, AssetAccount, CheckingAccount, InvestmentAccount, LoanAccount, SavingsAccount } from "$lib/types"
import { derived, writable } from "svelte/store"

const KEY = "accounts"

function now() {
  return new Date().toISOString()
}

function bankSortOrder(account: CheckingAccount | SavingsAccount): number {
  return account.sortOrder ?? Infinity
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
    /** Moves a checking or savings account up or down relative to other bank accounts of the same type. */
    reorderBankAccount(id: string, direction: "up" | "down") {
      store.update(accounts => {
        const account = accounts.find(a => a.id === id) as CheckingAccount | SavingsAccount | undefined
        if (!account || (account.type !== "checking" && account.type !== "savings")) return accounts

        const peers = accounts
          .filter((a): a is CheckingAccount | SavingsAccount => a.type === account.type)
          .sort((a, b) => bankSortOrder(a) - bankSortOrder(b))

        const currentIndex = peers.findIndex(a => a.id === id)
        const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
        if (targetIndex < 0 || targetIndex >= peers.length) return accounts

        // Normalize sortOrders to 0, 10, 20, … then swap
        const normalized = peers.map((peer, i) => ({ id: peer.id, sortOrder: i * 10 }))
        const tmp = normalized[currentIndex].sortOrder
        normalized[currentIndex].sortOrder = normalized[targetIndex].sortOrder
        normalized[targetIndex].sortOrder = tmp

        return accounts.map(a => {
          const updated = normalized.find(n => n.id === a.id)
          return updated ? ({ ...a, sortOrder: updated.sortOrder, updatedAt: now() } as Account) : a
        })
      })
    },
  }
}

export const accountsStore = createAccountsStore()

export const checkingAccounts = derived(accountsStore, $a =>
  $a
    .filter((a): a is CheckingAccount => a.type === "checking")
    .sort((a, b) => bankSortOrder(a) - bankSortOrder(b)),
)
export const savingsAccounts = derived(accountsStore, $a =>
  $a
    .filter((a): a is SavingsAccount => a.type === "savings")
    .sort((a, b) => bankSortOrder(a) - bankSortOrder(b)),
)
export const loanAccounts = derived(accountsStore, $a => $a.filter((a): a is LoanAccount => a.type === "loan"))
export const assetAccounts = derived(accountsStore, $a => $a.filter((a): a is AssetAccount => a.type === "asset"))
export const investmentAccounts = derived(accountsStore, $a =>
  $a.filter((a): a is InvestmentAccount => a.type === "investment"),
)
