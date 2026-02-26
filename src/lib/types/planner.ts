/** Represents a bill tracked within a specific planner month, optionally linked to a transaction. */
export interface PlannedBillAssignment {
  id: string
  plannerMonth: string
  billId: string
  paycheckDate?: string
  overrideAmount?: number
  transactionId?: string
  manuallyPaid?: boolean
}

export interface PlannerSettings {
  startDayOfMonth: number
  defaultView: "byPaycheck" | "byDate"
}
