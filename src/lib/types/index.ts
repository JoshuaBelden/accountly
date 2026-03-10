export * from "./account"
export * from "./tax"
export * from "./bill"
export * from "./budget"
export * from "./merchant"
export * from "./paycheck"
export * from "./planner"
export * from "./transaction"

import type { PlannerSettings } from "./planner"

export interface AppSettings {
  planner: PlannerSettings
  currency: string
  locale: string
  lastExported?: string
  sync?: {
    passphrase: string
    lastSynced?: string
  }
}
