import { loadFromStorage, saveToStorage } from "$lib/persistence/localStorage"
import type { PlannedBillAssignment } from "$lib/types"
import { writable } from "svelte/store"

const KEY = "plannerAssignments"

function createPlannerStore() {
  const store = writable<PlannedBillAssignment[]>(loadFromStorage<PlannedBillAssignment[]>(KEY, []))
  store.subscribe(v => saveToStorage(KEY, v))

  return {
    subscribe: store.subscribe,
    set: store.set,

    assign(assignment: PlannedBillAssignment) {
      store.update(list => {
        // Replace if same bill+month combo exists
        const filtered = list.filter(
          a => !(a.billId === assignment.billId && a.plannerMonth === assignment.plannerMonth),
        )
        return [...filtered, assignment]
      })
    },
    unassign(billId: string, plannerMonth: string) {
      store.update(list => list.filter(a => !(a.billId === billId && a.plannerMonth === plannerMonth)))
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
    /** Marks or unmarks a bill as manually paid for a given month. Creates a record if none exists. */
    setManuallyPaid(billId: string, plannerMonth: string, paid: boolean) {
      store.update(list => {
        const existing = list.find(a => a.billId === billId && a.plannerMonth === plannerMonth)
        if (existing) {
          return list.map(a =>
            a.billId === billId && a.plannerMonth === plannerMonth ? { ...a, manuallyPaid: paid } : a,
          )
        }
        return [...list, { id: crypto.randomUUID(), plannerMonth, billId, manuallyPaid: paid }]
      })
    },
    getForMonth(month: string) {
      let result: PlannedBillAssignment[] = []
      store.subscribe(list => {
        result = list.filter(a => a.plannerMonth === month)
      })()
      return result
    },
  }
}

export const plannerStore = createPlannerStore()
