/**
 * Represents a bill or loan payment tracked within a specific planner month, optionally linked to a
 * transaction. Exactly one of billId/loanAccountId is set, identifying which source this tracks.
 */
export interface PlannedPaymentAssignment {
  id: string
  plannerMonth: string
  billId?: string
  loanAccountId?: string
  paycheckDate?: string
  overrideAmount?: number
  transactionId?: string
  manuallyPaid?: boolean
}

export interface PlannerSettings {
  startDayOfMonth: number
  defaultView: "byPaycheck" | "byDate"
}
