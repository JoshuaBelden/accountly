export type AccountType = "checking" | "savings" | "loan" | "asset" | "investment"
export type AssetSubtype = "mortgage" | "vehicle" | "other"
export type LoanFrequency = "monthly" | "biweekly" | "weekly"
export type CsvDateFormat = "MM/DD/YY" | "M/D/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD"

/** Configures how a bank's CSV export columns map to importable transaction fields. */
export interface CsvFormat {
  dateField: string
  descriptionField: string
  /** Single combined amount column (e.g. Capital One). Requires typeField or treats all as debits. */
  amountField?: string
  /** Column containing "Debit" or "Credit" text, used alongside amountField. */
  typeField?: string
  /** Separate debit amount column (e.g. Columbia Bank). Mutually exclusive with amountField. */
  debitField?: string
  /** Separate credit amount column (e.g. Columbia Bank). Mutually exclusive with amountField. */
  creditField?: string
  /** Optional running balance column. */
  balanceField?: string
  dateFormat: CsvDateFormat
}

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
  csvFormat?: CsvFormat
  sortOrder?: number
}

export interface SavingsAccount extends BaseAccount {
  type: "savings"
  interestRate?: number
  csvFormat?: CsvFormat
  sortOrder?: number
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
