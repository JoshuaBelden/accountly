import { loadFromStorage, saveToStorage } from "$lib/persistence/localStorage"
import type { BudgetCategory, BudgetSubcategory, MonthlyBudgetOverride } from "$lib/types"
import { writable } from "svelte/store"

const CAT_KEY = "budgetCategories"
const OVERRIDE_KEY = "budgetOverrides"

function now() {
  return new Date().toISOString()
}

function createBudgetStore() {
  const catStore = writable<BudgetCategory[]>(loadFromStorage<BudgetCategory[]>(CAT_KEY, []))
  const overrideStore = writable<MonthlyBudgetOverride[]>(loadFromStorage<MonthlyBudgetOverride[]>(OVERRIDE_KEY, []))

  catStore.subscribe(v => saveToStorage(CAT_KEY, v))
  overrideStore.subscribe(v => saveToStorage(OVERRIDE_KEY, v))

  return {
    categories: { subscribe: catStore.subscribe, set: catStore.set },
    overrides: { subscribe: overrideStore.subscribe, set: overrideStore.set },

    addCategory(cat: BudgetCategory) {
      catStore.update(list => [...list, cat])
    },
    updateCategory(id: string, changes: Partial<BudgetCategory>) {
      catStore.update(list => list.map(c => (c.id === id ? { ...c, ...changes, updatedAt: now() } : c)))
    },
    removeCategory(id: string) {
      catStore.update(list => list.filter(c => c.id !== id))
    },

    addSubcategory(parentId: string, sub: BudgetSubcategory) {
      catStore.update(list =>
        list.map(c => (c.id === parentId ? { ...c, subcategories: [...c.subcategories, sub], updatedAt: now() } : c)),
      )
    },
    updateSubcategory(parentId: string, subId: string, changes: Partial<BudgetSubcategory>) {
      catStore.update(list =>
        list.map(c =>
          c.id === parentId
            ? {
                ...c,
                subcategories: c.subcategories.map(s => (s.id === subId ? { ...s, ...changes } : s)),
                updatedAt: now(),
              }
            : c,
        ),
      )
    },
    removeSubcategory(parentId: string, subId: string) {
      catStore.update(list =>
        list.map(c =>
          c.id === parentId
            ? { ...c, subcategories: c.subcategories.filter(s => s.id !== subId), updatedAt: now() }
            : c,
        ),
      )
    },

    setOverride(override: MonthlyBudgetOverride) {
      overrideStore.update(list => {
        const exists = list.findIndex(
          o =>
            o.categoryId === override.categoryId &&
            o.subcategoryId === override.subcategoryId &&
            o.month === override.month,
        )
        if (exists >= 0) {
          return list.map((o, i) => (i === exists ? override : o))
        }
        return [...list, override]
      })
    },
    removeOverride(id: string) {
      overrideStore.update(list => list.filter(o => o.id !== id))
    },
  }
}

export const budgetStore = createBudgetStore()
