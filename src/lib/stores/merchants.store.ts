import { loadFromStorage, saveToStorage } from "$lib/persistence/localStorage"
import type { Merchant } from "$lib/types"
import { writable } from "svelte/store"

const KEY = "merchants"

function now() {
  return new Date().toISOString()
}

function createMerchantsStore() {
  const store = writable<Merchant[]>(loadFromStorage<Merchant[]>(KEY, []))
  store.subscribe(v => saveToStorage(KEY, v))

  return {
    subscribe: store.subscribe,
    set: store.set,
    add(merchant: Merchant) {
      store.update(list => [...list, merchant])
    },
    update(id: string, changes: Partial<Merchant>) {
      store.update(list => list.map(m => (m.id === id ? { ...m, ...changes, updatedAt: now() } : m)))
    },
    remove(id: string) {
      store.update(list => list.filter(m => m.id !== id))
    },
  }
}

export const merchantsStore = createMerchantsStore()
