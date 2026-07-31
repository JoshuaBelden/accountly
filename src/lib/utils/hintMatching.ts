import type { Bill, BudgetCategory, LoanAccount, Merchant, Paycheck, Transaction } from "$lib/types"

/** Tests a regex hint pattern against a transaction description, tolerating invalid patterns. */
export function testHintPattern(hints: string | undefined, description: string): boolean {
  if (!hints) return false
  try {
    return new RegExp(hints, "i").test(description)
  } catch {
    return false
  }
}

export function matchBillByHints(description: string, bills: Bill[]): Bill | undefined {
  return bills.find(bill => testHintPattern(bill.hints, description))
}

export function matchLoanByHints(description: string, loanAccounts: LoanAccount[]): LoanAccount | undefined {
  return loanAccounts.find(loan => testHintPattern(loan.hints, description))
}

export function matchPaycheckByHints(description: string, paychecks: Paycheck[]): Paycheck | undefined {
  return paychecks.find(paycheck => testHintPattern(paycheck.hints, description))
}

export function matchMerchantByHints(description: string, merchants: Merchant[]): Merchant | undefined {
  return merchants.find(merchant => testHintPattern(merchant.hints, description))
}

export interface CategoryHintMatch {
  categoryId: string
  subcategoryId?: string
}

/** Checks each category's subcategory hints first, then its own hints; first match wins. */
export function matchCategoryByHints(description: string, categories: BudgetCategory[]): CategoryHintMatch | undefined {
  for (const category of categories) {
    for (const sub of category.subcategories) {
      if (testHintPattern(sub.hints, description)) return { categoryId: category.id, subcategoryId: sub.id }
    }
    if (testHintPattern(category.hints, description)) return { categoryId: category.id }
  }
  return undefined
}

/** Fields to apply to a transaction when linking it to a bill. Bills never carry a budget category. */
export function applyBillLink(bill: Bill): Pick<Transaction, "billId" | "loanAccountId" | "type" | "categoryId" | "subcategoryId"> {
  return {
    billId: bill.id,
    loanAccountId: undefined,
    type: "bill_payment",
    categoryId: undefined,
    subcategoryId: undefined,
  }
}

/** Fields to apply to a transaction when linking it to a loan account. Loans never carry a budget category. */
export function applyLoanLink(loan: LoanAccount): Pick<Transaction, "billId" | "loanAccountId" | "type" | "categoryId" | "subcategoryId"> {
  return {
    billId: undefined,
    loanAccountId: loan.id,
    type: "loan_payment",
    categoryId: undefined,
    subcategoryId: undefined,
  }
}
