export type BillFrequency = "monthly" | "bimonthly" | "weekly" | "biweekly" | "quarterly" | "annually"

export interface Bill {
  id: string
  name: string
  amount: number
  frequency: BillFrequency
  dueDayOfMonth?: number
  dueWeekday?: number
  autoPay: boolean
  accountId?: string
  categoryId?: string
  subcategoryId?: string
  hints?: string
  /** Whether this bill is a recurring subscription service. */
  isSubscription?: boolean
  /** Whether this subscription is specifically a streaming entertainment service. Implies isSubscription. */
  isStreamingService?: boolean
  notes?: string
  createdAt: string
  updatedAt: string
}
