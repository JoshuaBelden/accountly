import type { LoanAccount } from "$lib/types"

/**
 * Returns the number of months until a loan is paid off.
 * Uses the formula: n = -ln(1 - r*B/P) / ln(1+r)
 * where r = monthly rate, B = balance, P = monthly payment
 */
export function loanPayoffMonths(balance: number, annualRate: number, monthlyPayment: number): number {
  if (balance <= 0 || monthlyPayment <= 0) return 0
  const r = annualRate / 12
  if (r === 0) {
    return Math.ceil(balance / monthlyPayment)
  }
  const rateTimesBalance = r * balance
  if (monthlyPayment <= rateTimesBalance) {
    // Payment doesn't even cover interest
    return Infinity
  }
  return Math.ceil(-Math.log(1 - rateTimesBalance / monthlyPayment) / Math.log(1 + r))
}

export function loanPayoffDate(loan: LoanAccount): Date | null {
  const months = loanPayoffMonths(loan.remainingBalance, loan.interestRate, loan.minimumPayment)
  if (!isFinite(months)) return null
  const now = new Date()
  now.setMonth(now.getMonth() + months)
  return now
}

export function loanProgress(loan: LoanAccount): number {
  if (loan.originalBalance <= 0) return 0
  const paid = loan.originalBalance - loan.remainingBalance
  return Math.min(1, Math.max(0, paid / loan.originalBalance))
}

export function futureValue(pv: number, annualRate: number, years: number): number {
  return pv * Math.pow(1 + annualRate, years)
}
