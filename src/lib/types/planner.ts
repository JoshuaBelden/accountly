export interface PlannedBillAssignment {
  id: string
  plannerMonth: string
  billId: string
  paycheckDate: string
  overrideAmount?: number
  transactionId?: string
}

export interface PlannerSettings {
  startDayOfMonth: number
  defaultView: "byPaycheck" | "byDate"
}
