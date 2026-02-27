export type TransactionType = "expense" | "income" | "transfer" | "bill_payment"
export type ClearedStatus = "pending" | "cleared" | "void"

export interface TransactionSplit {
  categoryId: string
  subcategoryId?: string
  amount: number
  notes?: string
}

export interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  type: TransactionType
  accountId: string
  clearedStatus: ClearedStatus
  categoryId?: string
  subcategoryId?: string
  splits?: TransactionSplit[]
  billId?: string
  paycheckId?: string
  plannedPaycheckDate?: string
  plannerMonth?: string
  notes?: string
  imported?: boolean
  name?: string
  merchantId?: string
  createdAt: string
  updatedAt: string
}
