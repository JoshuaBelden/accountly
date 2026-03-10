import { loadFromStorage, saveToStorage } from "$lib/persistence/localStorage"
import type { TaxProfile, WithholdingEntry } from "$lib/types/tax"
import { writable } from "svelte/store"

const PROFILE_KEY = "taxProfile"
const WITHHOLDINGS_KEY = "withholdings"

function now() {
  return new Date().toISOString()
}

function createTaxProfileStore() {
  const store = writable<TaxProfile | null>(loadFromStorage<TaxProfile | null>(PROFILE_KEY, null))
  store.subscribe(value => saveToStorage(PROFILE_KEY, value))

  return {
    subscribe: store.subscribe,
    set: store.set,
    save(profile: TaxProfile) {
      store.set({ ...profile, updatedAt: now() })
    },
    clear() {
      store.set(null)
    },
  }
}

function createWithholdingsStore() {
  const store = writable<WithholdingEntry[]>(loadFromStorage<WithholdingEntry[]>(WITHHOLDINGS_KEY, []))
  store.subscribe(value => saveToStorage(WITHHOLDINGS_KEY, value))

  return {
    subscribe: store.subscribe,
    set: store.set,
    add(entry: WithholdingEntry) {
      store.update(list => [...list, entry])
    },
    update(id: string, changes: Partial<WithholdingEntry>) {
      store.update(list => list.map(entry => (entry.id === id ? { ...entry, ...changes, updatedAt: now() } : entry)))
    },
    remove(id: string) {
      store.update(list => list.filter(entry => entry.id !== id))
    },
  }
}

export const taxProfileStore = createTaxProfileStore()
export const withholdingsStore = createWithholdingsStore()
