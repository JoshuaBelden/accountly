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

/** Computes total interest paid over the life of a loan at the given monthly payment. */
export function loanTotalInterest(balance: number, annualRate: number, monthlyPayment: number): number {
  if (balance <= 0 || monthlyPayment <= 0) return 0
  const monthlyRate = annualRate / 12
  let remaining = balance
  let totalInterest = 0
  for (let month = 0; month < 1200; month++) {
    if (remaining <= 0) break
    const interest = remaining * monthlyRate
    if (monthlyPayment <= interest) break
    totalInterest += interest
    remaining -= Math.min(monthlyPayment - interest, remaining)
  }
  return totalInterest
}

/** Per-loan result from a waterfall payoff simulation. */
export interface LoanPayoffResult {
  loanId: string
  priority: number
  strategyMonths: number
  strategyInterest: number
}

/** One year's snapshot in a waterfall payoff simulation. */
export interface YearlyPayoffSummary {
  yearIndex: number
  calendarYear: number
  totalBalance: number
  cumulativeInterest: number
  loansCompletedThisYear: Array<{ loanId: string; name: string }>
}

/**
 * Simulates avalanche or snowball debt payoff across multiple loans.
 * Minimums freed when a loan is paid off are rolled into the next priority loan.
 */
export function simulateWaterfallPayoff(
  loans: LoanAccount[],
  extraPayment: number,
  strategy: "avalanche" | "snowball",
): LoanPayoffResult[] {
  if (loans.length === 0) return []

  const ordered = [...loans].sort((a, b) =>
    strategy === "avalanche" ? b.interestRate - a.interestRate : a.remainingBalance - b.remainingBalance,
  )

  const balances = new Map(loans.map(loan => [loan.id, loan.remainingBalance]))
  const interestAccrued = new Map(loans.map(loan => [loan.id, 0]))
  const payoffMonth = new Map<string, number>()

  for (let month = 1; month <= 1200; month++) {
    if ([...balances.values()].every(balance => balance <= 0)) break

    const rolledMinimums = ordered
      .filter(loan => payoffMonth.has(loan.id))
      .reduce((sum, loan) => sum + loan.minimumPayment, 0)
    const totalExtra = extraPayment + rolledMinimums

    const priorityLoan = ordered.find(loan => (balances.get(loan.id) ?? 0) > 0)

    for (const loan of ordered) {
      const balance = balances.get(loan.id) ?? 0
      if (balance <= 0) continue
      const monthlyRate = loan.interestRate / 12
      const interest = balance * monthlyRate
      interestAccrued.set(loan.id, (interestAccrued.get(loan.id) ?? 0) + interest)
      const payment = loan === priorityLoan ? loan.minimumPayment + totalExtra : loan.minimumPayment
      const principal = Math.min(Math.max(payment - interest, 0), balance)
      const newBalance = balance - principal
      balances.set(loan.id, newBalance < 0.005 ? 0 : newBalance)
      if (newBalance < 0.005 && !payoffMonth.has(loan.id)) {
        payoffMonth.set(loan.id, month)
      }
    }
  }

  return ordered.map((loan, index) => ({
    loanId: loan.id,
    priority: index + 1,
    strategyMonths: payoffMonth.get(loan.id) ?? Infinity,
    strategyInterest: interestAccrued.get(loan.id) ?? 0,
  }))
}

/**
 * Runs the waterfall payoff simulation and returns a year-by-year snapshot of remaining
 * balance, cumulative interest paid, and which loans were completed during each year.
 */
export function buildYearlySummary(
  loans: LoanAccount[],
  extraPayment: number,
  strategy: "avalanche" | "snowball",
): YearlyPayoffSummary[] {
  if (loans.length === 0) return []

  const ordered = [...loans].sort((a, b) =>
    strategy === "avalanche" ? b.interestRate - a.interestRate : a.remainingBalance - b.remainingBalance,
  )

  const balances = new Map(loans.map(loan => [loan.id, loan.remainingBalance]))
  const interestAccrued = new Map(loans.map(loan => [loan.id, 0]))
  const payoffMonth = new Map<string, number>()
  const summaries: YearlyPayoffSummary[] = []
  const startYear = new Date().getFullYear()
  let lastSnapshotYearIndex = 0

  const captureSnapshot = (yearIndex: number) => {
    const yearStart = (yearIndex - 1) * 12 + 1
    const yearEnd = yearIndex * 12
    summaries.push({
      yearIndex,
      calendarYear: startYear + yearIndex,
      totalBalance: [...balances.values()].reduce((sum, b) => sum + b, 0),
      cumulativeInterest: [...interestAccrued.values()].reduce((sum, interest) => sum + interest, 0),
      loansCompletedThisYear: ordered
        .filter(loan => {
          const pm = payoffMonth.get(loan.id)
          return pm !== undefined && pm >= yearStart && pm <= yearEnd
        })
        .map(loan => ({ loanId: loan.id, name: loan.name })),
    })
    lastSnapshotYearIndex = yearIndex
  }

  for (let month = 1; month <= 1200; month++) {
    if ([...balances.values()].every(b => b <= 0)) {
      const finalYearIndex = Math.ceil((month - 1) / 12)
      if (finalYearIndex > lastSnapshotYearIndex) {
        captureSnapshot(finalYearIndex)
      }
      break
    }

    const rolledMinimums = ordered
      .filter(loan => payoffMonth.has(loan.id))
      .reduce((sum, loan) => sum + loan.minimumPayment, 0)
    const totalExtra = extraPayment + rolledMinimums
    const priorityLoan = ordered.find(loan => (balances.get(loan.id) ?? 0) > 0)

    for (const loan of ordered) {
      const balance = balances.get(loan.id) ?? 0
      if (balance <= 0) continue
      const monthlyRate = loan.interestRate / 12
      const interest = balance * monthlyRate
      interestAccrued.set(loan.id, (interestAccrued.get(loan.id) ?? 0) + interest)
      const payment = loan === priorityLoan ? loan.minimumPayment + totalExtra : loan.minimumPayment
      const principal = Math.min(Math.max(payment - interest, 0), balance)
      const newBalance = balance - principal
      balances.set(loan.id, newBalance < 0.005 ? 0 : newBalance)
      if (newBalance < 0.005 && !payoffMonth.has(loan.id)) {
        payoffMonth.set(loan.id, month)
      }
    }

    if (month % 12 === 0) {
      captureSnapshot(month / 12)
      if ([...balances.values()].every(b => b <= 0)) break
    }
  }

  return summaries
}
