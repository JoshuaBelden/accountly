export type PayFrequency = "weekly" | "biweekly" | "semimonthly" | "monthly"

export interface SemimonthlyDays {
  firstDay: number
  secondDay: number
}

export interface Paycheck {
  id: string
  name: string
  expectedAmount: number
  frequency: PayFrequency
  accountId: string
  biweeklyAnchorDate?: string
  semimonthlyDays?: SemimonthlyDays
  monthlyDay?: number
  weeklyAnchorDate?: string
  notes?: string
  createdAt: string
  updatedAt: string
}
