export type PayFrequency = "weekly" | "biweekly" | "semimonthly" | "monthly"
export type IncomeType = "paycheck" | "other"

export interface SemimonthlyDays {
  firstDay: number
  secondDay: number
}

/** Represents a scheduled recurring income source tied to a pay cycle. */
export interface Paycheck {
  id: string
  name: string
  /** Take-home amount per paycheck after all employer withholdings and deductions. */
  expectedAmount: number
  /** Gross (pre-tax) amount per paycheck, if known. Used by the Tax Planner. When absent, expectedAmount is used as a fallback. */
  grossAmount?: number
  frequency: PayFrequency
  incomeType?: IncomeType
  accountId: string
  biweeklyAnchorDate?: string
  semimonthlyDays?: SemimonthlyDays
  monthlyDay?: number
  weeklyAnchorDate?: string
  hints?: string
  notes?: string
  createdAt: string
  updatedAt: string
}
