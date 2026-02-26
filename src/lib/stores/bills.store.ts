import { loadFromStorage, saveToStorage } from "$lib/persistence/localStorage"
import type { Bill } from "$lib/types"
import { writable } from "svelte/store"

const KEY = "bills"

function now() {
  return new Date().toISOString()
}

function createBillsStore() {
  const store = writable<Bill[]>(loadFromStorage<Bill[]>(KEY, []))
  store.subscribe(v => saveToStorage(KEY, v))

  return {
    subscribe: store.subscribe,
    set: store.set,
    add(bill: Bill) {
      store.update(list => [...list, bill])
    },
    update(id: string, changes: Partial<Bill>) {
      store.update(list => list.map(b => (b.id === id ? { ...b, ...changes, updatedAt: now() } : b)))
    },
    remove(id: string) {
      store.update(list => list.filter(b => b.id !== id))
    },
  }
}

export const billsStore = createBillsStore()
