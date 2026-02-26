import { loadFromStorage, saveToStorage } from "$lib/persistence/localStorage"
import type { AppSettings } from "$lib/types"
import { writable } from "svelte/store"

const KEY = "settings"

const defaultSettings: AppSettings = {
  planner: {
    startDayOfMonth: 1,
    defaultView: "byPaycheck",
  },
  currency: "USD",
  locale: "en-US",
}

function createSettingsStore() {
  const initial = loadFromStorage<AppSettings>(KEY, defaultSettings)
  const store = writable<AppSettings>({ ...defaultSettings, ...initial })

  store.subscribe(value => saveToStorage(KEY, value))

  return {
    subscribe: store.subscribe,
    set: store.set,
    update: store.update,
    updatePlannerStartDay: (day: number) =>
      store.update(s => ({ ...s, planner: { ...s.planner, startDayOfMonth: day } })),
    reset: () => store.set(defaultSettings),
  }
}

export const settingsStore = createSettingsStore()
