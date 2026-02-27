import type {
  Account,
  AppSettings,
  Bill,
  BudgetCategory,
  Merchant,
  MonthlyBudgetOverride,
  Paycheck,
  PlannedBillAssignment,
  Transaction,
} from "$lib/types"

const PREFIX = "accountly:"

const CURRENT_VERSION = 1

export interface ExportEnvelope {
  version: number
  exportedAt: string
  accounts: Account[]
  bills: Bill[]
  paychecks: Paycheck[]
  transactions: Transaction[]
  budgetCategories: BudgetCategory[]
  budgetOverrides: MonthlyBudgetOverride[]
  plannerAssignments: PlannedBillAssignment[]
  merchants: Merchant[]
  settings: AppSettings
}

export function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof localStorage === "undefined") return fallback
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  if (typeof localStorage === "undefined") return
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // Storage quota exceeded or private mode
  }
}

export function clearAllStorage(): void {
  if (typeof localStorage === "undefined") return
  const keys = Object.keys(localStorage).filter(k => k.startsWith(PREFIX))
  keys.forEach(k => localStorage.removeItem(k))
}

export function exportAllData(
  accounts: Account[],
  bills: Bill[],
  paychecks: Paycheck[],
  transactions: Transaction[],
  budgetCategories: BudgetCategory[],
  budgetOverrides: MonthlyBudgetOverride[],
  plannerAssignments: PlannedBillAssignment[],
  merchants: Merchant[],
  settings: AppSettings,
): ExportEnvelope {
  return {
    version: CURRENT_VERSION,
    exportedAt: new Date().toISOString(),
    accounts,
    bills,
    paychecks,
    transactions,
    budgetCategories,
    budgetOverrides,
    plannerAssignments,
    merchants,
    settings,
  }
}

export function validateEnvelope(data: unknown): data is ExportEnvelope {
  if (!data || typeof data !== "object") return false
  const obj = data as Record<string, unknown>
  return (
    typeof obj.version === "number" &&
    typeof obj.exportedAt === "string" &&
    Array.isArray(obj.accounts) &&
    Array.isArray(obj.bills) &&
    Array.isArray(obj.paychecks) &&
    Array.isArray(obj.transactions) &&
    Array.isArray(obj.budgetCategories) &&
    Array.isArray(obj.budgetOverrides) &&
    Array.isArray(obj.plannerAssignments) &&
    (!("merchants" in obj) || Array.isArray(obj.merchants))
  )
}
