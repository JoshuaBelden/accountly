export type AccountType = "checking" | "savings" | "loan" | "asset" | "investment"
export type AssetSubtype = "mortgage" | "vehicle" | "other"
export type LoanFrequency = "monthly" | "biweekly" | "weekly"

interface BaseAccount {
  id: string
  name: string
  type: AccountType
  balance: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface CheckingAccount extends BaseAccount {
  type: "checking"
}

export interface SavingsAccount extends BaseAccount {
  type: "savings"
  interestRate?: number
}

export interface LoanAccount extends BaseAccount {
  type: "loan"
  originalBalance: number
  remainingBalance: number
  interestRate: number
  minimumPayment: number
  paymentDueDay: number
  paymentFrequency: LoanFrequency
}

export interface AssetAccount extends BaseAccount {
  type: "asset"
  assetSubtype: AssetSubtype
  estimatedValue: number
  originalBalance?: number
  remainingBalance?: number
  interestRate?: number
  minimumPayment?: number
  paymentDueDay?: number
}

export interface InvestmentAccount extends BaseAccount {
  type: "investment"
  institution?: string
  currentBalance: number
}

export type Account = CheckingAccount | SavingsAccount | LoanAccount | AssetAccount | InvestmentAccount
