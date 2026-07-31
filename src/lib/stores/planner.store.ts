import { loadFromStorage, saveToStorage } from "$lib/persistence/localStorage"
import type { PlannedPaymentAssignment } from "$lib/types"
import { writable } from "svelte/store"

const KEY = "plannerAssignments"

/** Identifies which source (a Bill or a LoanAccount) an assignment tracks. */
export interface PaymentSourceRef {
  billId?: string
  loanAccountId?: string
}

function matchesSource(assignment: PlannedPaymentAssignment, source: PaymentSourceRef): boolean {
  if (source.billId) return assignment.billId === source.billId
  if (source.loanAccountId) return assignment.loanAccountId === source.loanAccountId
  return false
}

function createPlannerStore() {
  const store = writable<PlannedPaymentAssignment[]>(loadFromStorage<PlannedPaymentAssignment[]>(KEY, []))
  store.subscribe(v => saveToStorage(KEY, v))

  return {
    subscribe: store.subscribe,
    set: store.set,

    assign(assignment: PlannedPaymentAssignment) {
      store.update(list => {
        // Replace if same source+month combo exists
        const filtered = list.filter(a => !(matchesSource(a, assignment) && a.plannerMonth === assignment.plannerMonth))
        return [...filtered, assignment]
      })
    },
    unassign(source: PaymentSourceRef, plannerMonth: string) {
      store.update(list => list.filter(a => !(matchesSource(a, source) && a.plannerMonth === plannerMonth)))
    },
    linkTransaction(assignmentId: string, transactionId: string) {
      store.update(list => list.map(a => (a.id === assignmentId ? { ...a, transactionId } : a)))
    },
    clearTransactionLink(transactionId: string) {
      store.update(list => list.map(a => (a.transactionId === transactionId ? { ...a, transactionId: undefined } : a)))
    },
    setOverrideAmount(assignmentId: string, amount: number | undefined) {
      store.update(list => list.map(a => (a.id === assignmentId ? { ...a, overrideAmount: amount } : a)))
    },
    /** Marks or unmarks a bill/loan payment as manually paid for a given month. Creates a record if none exists. */
    setManuallyPaid(source: PaymentSourceRef, plannerMonth: string, paid: boolean) {
      store.update(list => {
        const existing = list.find(a => matchesSource(a, source) && a.plannerMonth === plannerMonth)
        if (existing) {
          return list.map(a => (matchesSource(a, source) && a.plannerMonth === plannerMonth ? { ...a, manuallyPaid: paid } : a))
        }
        return [...list, { id: crypto.randomUUID(), plannerMonth, ...source, manuallyPaid: paid }]
      })
    },
    getForMonth(month: string) {
      let result: PlannedPaymentAssignment[] = []
      store.subscribe(list => {
        result = list.filter(a => a.plannerMonth === month)
      })()
      return result
    },
  }
}

export const plannerStore = createPlannerStore()
