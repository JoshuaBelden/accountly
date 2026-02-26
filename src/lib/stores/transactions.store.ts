import { loadFromStorage, saveToStorage } from "$lib/persistence/localStorage"
import type { Transaction } from "$lib/types"
import { derived, writable } from "svelte/store"

const KEY = "transactions"

function now() {
  return new Date().toISOString()
}

function createTransactionsStore() {
  const store = writable<Transaction[]>(loadFromStorage<Transaction[]>(KEY, []))
  store.subscribe(v => saveToStorage(KEY, v))

  return {
    subscribe: store.subscribe,
    set: store.set,
    add(tx: Transaction) {
      store.update(list => [...list, tx])
    },
    update(id: string, changes: Partial<Transaction>) {
      store.update(list => list.map(t => (t.id === id ? { ...t, ...changes, updatedAt: now() } : t)))
    },
    remove(id: string) {
      store.update(list => list.filter(t => t.id !== id))
    },
    removeMany(ids: string[]) {
      const set = new Set(ids)
      store.update(list => list.filter(t => !set.has(t.id)))
    },
    clearStatus(id: string, status: Transaction["clearedStatus"]) {
      store.update(list => list.map(t => (t.id === id ? { ...t, clearedStatus: status, updatedAt: now() } : t)))
    },
  }
}

export const transactionsStore = createTransactionsStore()

export function transactionsByMonth(month: string) {
  return derived(transactionsStore, $txs => $txs.filter(t => t.plannerMonth === month))
}

export function transactionsByAccount(accountId: string) {
  return derived(transactionsStore, $txs => $txs.filter(t => t.accountId === accountId))
}
