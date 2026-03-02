import type { Account, LoanAccount } from "$lib/types/account"
import type { BudgetCategory } from "$lib/types/budget"
import type { Paycheck } from "$lib/types/paycheck"
import type { Transaction } from "$lib/types/transaction"
import { formatCurrency } from "$lib/utils/currency"

export type HealthStatus = "green" | "yellow" | "red"

/** A single line in a metric's expanded calculation breakdown. */
export interface BreakdownLine {
  label: string
  value: string
  /** Styles this line as the final calculated result, separated from the inputs above it. */
  isResult?: boolean
  /** Styles this line as a warning (e.g. an over-budget category). */
  alert?: boolean
}

/** A single computed financial health metric with display-ready values and a traffic-light status. */
export interface HealthMetric {
  label: string
  value: string
  detail: string
  status: HealthStatus
  rawValue: number
  breakdown: BreakdownLine[]
}

const MONTHLY_PAY_MULTIPLIERS: Record<string, number> = {
  weekly: 52 / 12,
  biweekly: 26 / 12,
  semimonthly: 2,
  monthly: 1,
}

const MONTHLY_LOAN_MULTIPLIERS: Record<string, number> = {
  weekly: 52 / 12,
  biweekly: 26 / 12,
  monthly: 1,
}

/** Returns a "YYYY-MM" month key offset by the given number of months from a reference date. */
function offsetMonthKey(date: Date, offsetMonths: number): string {
  const normalized = new Date(date.getFullYear(), date.getMonth() + offsetMonths, 1)
  const year = normalized.getFullYear()
  const month = String(normalized.getMonth() + 1).padStart(2, "0")
  return `${year}-${month}`
}

/** Formats a "YYYY-MM" key as a short month label, e.g. "Dec '25". */
function shortMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-")
  const date = new Date(parseInt(year), parseInt(month) - 1, 1)
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
}

/** Sums expense and bill_payment transaction amounts for a given "YYYY-MM" month. Excludes voided entries. */
function monthlyExpenseTotal(transactions: Transaction[], month: string): number {
  return transactions
    .filter(
      transaction =>
        transaction.date.startsWith(month) &&
        (transaction.type === "expense" || transaction.type === "bill_payment") &&
        transaction.clearedStatus !== "void",
    )
    .reduce((sum, transaction) => sum + transaction.amount, 0)
}

/** Sums income transaction amounts for a given "YYYY-MM" month. Excludes voided entries. */
function monthlyIncomeTotal(transactions: Transaction[], month: string): number {
  return transactions
    .filter(
      transaction =>
        transaction.date.startsWith(month) && transaction.type === "income" && transaction.clearedStatus !== "void",
    )
    .reduce((sum, transaction) => sum + transaction.amount, 0)
}

/** Computes gross monthly income by normalizing all paychecks to a monthly cadence. */
export function computeMonthlyIncome(paychecks: Paycheck[]): number {
  return paychecks.reduce((sum, paycheck) => {
    const multiplier = MONTHLY_PAY_MULTIPLIERS[paycheck.frequency] ?? 1
    return sum + paycheck.expectedAmount * multiplier
  }, 0)
}

/**
 * Computes average monthly expenses over the 3 complete months prior to the reference date.
 * Uses closed months only to avoid partial-month distortion.
 */
export function computeAvgMonthlyExpenses(transactions: Transaction[], referenceDate: Date): number {
  const months = [-3, -2, -1].map(offset => offsetMonthKey(referenceDate, offset))
  const total = months.reduce((sum, month) => sum + monthlyExpenseTotal(transactions, month), 0)
  return total / 3
}

/** Sums minimum monthly debt payments across all loan accounts, normalized to a monthly amount. */
function computeMonthlyDebtPayments(accounts: Account[]): number {
  return accounts
    .filter(account => account.type === "loan")
    .reduce((sum, account) => {
      const loan = account as LoanAccount
      const multiplier = MONTHLY_LOAN_MULTIPLIERS[loan.paymentFrequency] ?? 1
      return sum + loan.minimumPayment * multiplier
    }, 0)
}

/** Returns the total budgeted amount for a category, including all subcategory budgets. */
function categoryTotalBudget(category: BudgetCategory): number {
  const subcategoryTotal = category.subcategories.reduce((sum, sub) => sum + sub.monthlyBudget, 0)
  return category.monthlyBudget + subcategoryTotal
}

/**
 * Computes savings rate as (income − expenses) / income over the last 3 complete months.
 * Prefers actual income transactions when available so both sides use the same data source;
 * falls back to configured paycheck amounts if no income transactions are recorded.
 * Thresholds: ≥20% green, ≥10% yellow, <10% red.
 */
export function computeSavingsRate(
  paychecks: Paycheck[],
  transactions: Transaction[],
  referenceDate: Date,
): HealthMetric {
  const months = [-3, -2, -1].map(offset => offsetMonthKey(referenceDate, offset))
  const rangeLabel = `${shortMonthLabel(months[0])} – ${shortMonthLabel(months[2])}`

  const recordedIncome = months.reduce((sum, month) => sum + monthlyIncomeTotal(transactions, month), 0)
  const recordedExpenses = months.reduce((sum, month) => sum + monthlyExpenseTotal(transactions, month), 0)

  let avgIncome: number
  let sourceLabel: string

  if (recordedIncome > 0) {
    avgIncome = recordedIncome / 3
    sourceLabel = `Income transactions (${rangeLabel})`
  } else {
    avgIncome = computeMonthlyIncome(paychecks)
    sourceLabel = "Configured paychecks"
  }

  if (avgIncome === 0) {
    return {
      label: "Savings Rate",
      value: "N/A",
      detail: "No income found",
      status: "red",
      rawValue: 0,
      breakdown: [{ label: "Source", value: sourceLabel }, { label: "Monthly income", value: "$0" }],
    }
  }

  const avgExpenses = recordedExpenses / 3
  const rate = ((avgIncome - avgExpenses) / avgIncome) * 100
  const status: HealthStatus = rate >= 20 ? "green" : rate >= 10 ? "yellow" : "red"
  const detail = rate >= 20 ? "On track" : rate >= 10 ? "Aim for 20%" : rate < 0 ? "Spending exceeds income" : "Below recommended minimum"

  const breakdown: BreakdownLine[] = [
    { label: "Source", value: sourceLabel },
    { label: "Avg monthly income", value: formatCurrency(avgIncome) },
    { label: "Avg monthly expenses", value: formatCurrency(avgExpenses) },
    { label: "Savings rate", value: `${rate.toFixed(1)}%`, isResult: true },
  ]

  return { label: "Savings Rate", value: `${rate.toFixed(1)}%`, detail, status, rawValue: rate, breakdown }
}

/**
 * Computes debt-to-income ratio as total monthly debt payments / gross monthly income.
 * Thresholds: ≤28% green, ≤43% yellow, >43% red.
 */
export function computeDebtToIncome(accounts: Account[], paychecks: Paycheck[]): HealthMetric {
  const monthlyIncome = computeMonthlyIncome(paychecks)
  if (monthlyIncome === 0) {
    return {
      label: "Debt-to-Income",
      value: "N/A",
      detail: "No income configured",
      status: "red",
      rawValue: 0,
      breakdown: [{ label: "Monthly income", value: "$0" }],
    }
  }

  const monthlyDebt = computeMonthlyDebtPayments(accounts)
  const ratio = monthlyDebt / monthlyIncome
  const status: HealthStatus = ratio <= 0.28 ? "green" : ratio <= 0.43 ? "yellow" : "red"
  const detail = ratio <= 0.28 ? "Healthy" : ratio <= 0.43 ? "Elevated" : "High — review debt load"

  const loanLines: BreakdownLine[] = accounts
    .filter(account => account.type === "loan")
    .map(account => {
      const loan = account as LoanAccount
      const multiplier = MONTHLY_LOAN_MULTIPLIERS[loan.paymentFrequency] ?? 1
      return { label: loan.name, value: `${formatCurrency(loan.minimumPayment * multiplier)}/mo` }
    })

  const breakdown: BreakdownLine[] = [
    ...(loanLines.length > 0 ? loanLines : [{ label: "No loans", value: "$0" }]),
    { label: "Total debt payments", value: `${formatCurrency(monthlyDebt)}/mo` },
    { label: "Monthly income", value: `${formatCurrency(monthlyIncome)}/mo` },
    { label: "Debt-to-income", value: `${(ratio * 100).toFixed(1)}%`, isResult: true },
  ]

  return { label: "Debt-to-Income", value: `${(ratio * 100).toFixed(1)}%`, detail, status, rawValue: ratio, breakdown }
}

/**
 * Computes how many months of average expenses liquid reserves would cover.
 * Thresholds: ≥6 months green, ≥3 months yellow, <3 months red.
 */
export function computeEmergencyFund(accounts: Account[], transactions: Transaction[], referenceDate: Date): HealthMetric {
  const liquidAccounts = accounts.filter(account => account.type === "checking" || account.type === "savings")
  const liquid = liquidAccounts.reduce((sum, account) => sum + account.balance, 0)
  const avgExpenses = computeAvgMonthlyExpenses(transactions, referenceDate)

  if (avgExpenses === 0) {
    const accountLines: BreakdownLine[] = liquidAccounts.map(account => ({
      label: account.name,
      value: formatCurrency(account.balance),
    }))
    return {
      label: "Emergency Fund",
      value: "—",
      detail: "No expense history yet",
      status: "yellow",
      rawValue: 0,
      breakdown: [...accountLines, { label: "Total liquid", value: formatCurrency(liquid) }],
    }
  }

  const months = liquid / avgExpenses
  const status: HealthStatus = months >= 6 ? "green" : months >= 3 ? "yellow" : "red"
  const detail = months >= 6 ? "Well covered" : months >= 3 ? "Building up" : "Less than 3 months"

  const accountLines: BreakdownLine[] = liquidAccounts.map(account => ({
    label: account.name,
    value: formatCurrency(account.balance),
  }))

  const breakdown: BreakdownLine[] = [
    ...accountLines,
    { label: "Total liquid", value: formatCurrency(liquid) },
    { label: "Avg monthly expenses", value: formatCurrency(avgExpenses) },
    { label: "Coverage", value: `${months.toFixed(1)} months`, isResult: true },
  ]

  return { label: "Emergency Fund", value: `${months.toFixed(1)} mo`, detail, status, rawValue: months, breakdown }
}

/**
 * Computes budget adherence as the share of budgeted categories where actual spending stays within budget.
 * Evaluates the current month only. Thresholds: ≥80% green, ≥60% yellow, <60% red.
 */
export function computeBudgetAdherence(
  transactions: Transaction[],
  categories: BudgetCategory[],
  referenceDate: Date,
): HealthMetric {
  const currentMonth = offsetMonthKey(referenceDate, 0)

  const actualByCategoryId: Record<string, number> = {}
  transactions
    .filter(
      transaction =>
        transaction.date.startsWith(currentMonth) &&
        (transaction.type === "expense" || transaction.type === "bill_payment") &&
        transaction.clearedStatus !== "void",
    )
    .forEach(transaction => {
      if (transaction.splits && transaction.splits.length > 0) {
        transaction.splits.forEach(split => {
          actualByCategoryId[split.categoryId] = (actualByCategoryId[split.categoryId] ?? 0) + split.amount
        })
      } else if (transaction.categoryId) {
        actualByCategoryId[transaction.categoryId] =
          (actualByCategoryId[transaction.categoryId] ?? 0) + transaction.amount
      }
    })

  const budgetedCategories = categories.filter(category => categoryTotalBudget(category) > 0)
  if (budgetedCategories.length === 0) {
    return {
      label: "Budget Adherence",
      value: "N/A",
      detail: "No budget configured",
      status: "yellow",
      rawValue: 0,
      breakdown: [{ label: "No budget categories set up", value: "" }],
    }
  }

  const onTrackCount = budgetedCategories.filter(category => {
    const actual = actualByCategoryId[category.id] ?? 0
    return actual <= categoryTotalBudget(category)
  }).length

  const rate = (onTrackCount / budgetedCategories.length) * 100
  const status: HealthStatus = rate >= 80 ? "green" : rate >= 60 ? "yellow" : "red"
  const detail = rate >= 80 ? "Within budget" : rate >= 60 ? "Some overruns" : "Multiple overruns"

  // Sort over-budget categories first so problems are immediately visible
  const categoryLines: BreakdownLine[] = budgetedCategories
    .map(category => {
      const actual = actualByCategoryId[category.id] ?? 0
      const budget = categoryTotalBudget(category)
      const isOver = actual > budget
      return { label: category.name, value: `${formatCurrency(actual)} / ${formatCurrency(budget)}`, alert: isOver }
    })
    .sort((lineA, lineB) => (lineA.alert === lineB.alert ? 0 : lineA.alert ? -1 : 1))

  const breakdown: BreakdownLine[] = [
    ...categoryLines,
    {
      label: `${onTrackCount} of ${budgetedCategories.length} categories on track`,
      value: `${rate.toFixed(0)}%`,
      isResult: true,
    },
  ]

  return { label: "Budget Adherence", value: `${rate.toFixed(0)}%`, detail, status, rawValue: rate, breakdown }
}
