import type { Bill, BudgetCategory, LoanAccount, MonthlyBudgetOverride, Paycheck, PlannedPaymentAssignment, Transaction } from "$lib/types"
import { addMonths, daysInMonth, formatDateShort, getPayDaysInMonth, isoDate } from "$lib/utils/date"

export function effectiveBudgetAmount(
  overrides: MonthlyBudgetOverride[],
  categoryId: string,
  subcategoryId: string | undefined,
  defaultAmount: number,
  month: string,
): number {
  const override = overrides.find(o => o.categoryId === categoryId && o.subcategoryId === subcategoryId && o.month === month)
  return override?.budgetAmount ?? defaultAmount
}

export interface ResolvedPaymentStatus {
  transaction: Transaction | null
  clearedByImport: boolean
  manuallyPaid: boolean
  isPaid: boolean
  amount: number
}

/**
 * Single source of truth for "is this bill/loan payment paid" — trusts the assignment's linked
 * transaction first, and falls back to scanning transactions directly by source id + cleared status
 * when no assignment (or no linked transaction) exists yet.
 */
export function resolvePaymentStatus(
  sourceId: string,
  matchField: "billId" | "loanAccountId",
  defaultAmount: number,
  assignment: PlannedPaymentAssignment | null,
  transactions: Transaction[],
  plannerMonth: string,
): ResolvedPaymentStatus {
  const transaction =
    (assignment?.transactionId
      ? transactions.find(t => t.id === assignment.transactionId)
      : transactions.find(
          t =>
            t[matchField] === sourceId &&
            t.clearedStatus === "cleared" &&
            (t.plannerMonth === plannerMonth || t.date.startsWith(plannerMonth)),
        )) ?? null
  const clearedByImport = transaction?.clearedStatus === "cleared"
  const manuallyPaid = !clearedByImport && assignment?.manuallyPaid === true
  const isPaid = clearedByImport || manuallyPaid
  const amount = clearedByImport && transaction ? transaction.amount : (assignment?.overrideAmount ?? defaultAmount)
  return { transaction, clearedByImport, manuallyPaid, isPaid, amount }
}

export interface PayPeriodPaymentItem {
  id: string
  name: string
  dueDayOfMonth?: number
  kind: "bill" | "loan"
  source: Bill | LoanAccount
  isPaid: boolean
  amount: number
}

export interface PayPeriodIncomeItem {
  paycheck: Paycheck
  date: string
  amount: number
}

export interface PayPeriodBucket {
  label: string
  date: string | null
  incomeItems: PayPeriodIncomeItem[]
  income: number
  payments: PayPeriodPaymentItem[]
  paymentTotal: number
  net: number
}

function dayBefore(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number)
  const date = new Date(year, month - 1, day - 1)
  return isoDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
}

/**
 * Groups income and monthly bill/loan payment items into buckets anchored to "paycheck" type pay
 * periods only. "Other" income (e.g. rental income) still contributes to whichever bucket window it
 * falls in, but never creates its own bucket boundary — payments only ever split against real
 * paychecks. The last pay period of the month wraps to the day before next month's first paycheck,
 * rather than cutting off at the end of the calendar month.
 */
export function groupPaymentsByPayPeriod(
  paychecks: Paycheck[],
  incomeItems: PayPeriodIncomeItem[],
  paymentItems: PayPeriodPaymentItem[],
  month: string,
): PayPeriodBucket[] {
  const paycheckSources = paychecks.filter(paycheck => (paycheck.incomeType ?? "paycheck") === "paycheck")

  const paycheckPeriods = paycheckSources
    .flatMap(paycheck => getPayDaysInMonth(paycheck, month).map(date => ({ paycheck, date })))
    .sort((a, b) => a.date.localeCompare(b.date))

  const nextMonthFirstDate = paycheckSources
    .flatMap(paycheck => getPayDaysInMonth(paycheck, addMonths(month, 1)))
    .sort()[0]

  const [monthYear, monthNum] = month.split("-").map(Number)
  const lastDayOfMonth = isoDate(monthYear, monthNum, daysInMonth(month))

  const buckets: PayPeriodBucket[] = paycheckPeriods.map((period, index) => {
    const nextDate = paycheckPeriods[index + 1]?.date ?? nextMonthFirstDate
    const endDate = nextDate ? dayBefore(nextDate) : lastDayOfMonth
    return {
      label: `${formatDateShort(period.date)} – ${formatDateShort(endDate)}`,
      date: period.date,
      incomeItems: [],
      income: 0,
      payments: [],
      paymentTotal: 0,
      net: 0,
    }
  })

  const beforeFirstBucket: PayPeriodBucket = { label: "Before first paycheck", date: null, incomeItems: [], income: 0, payments: [], paymentTotal: 0, net: 0 }
  const unscheduledBucket: PayPeriodBucket = { label: "No due date set", date: null, incomeItems: [], income: 0, payments: [], paymentTotal: 0, net: 0 }

  function findBucketForDate(date: string): PayPeriodBucket | null {
    return [...buckets].reverse().find(bucket => bucket.date !== null && bucket.date <= date) ?? null
  }

  for (const item of incomeItems) {
    const bucket = findBucketForDate(item.date) ?? beforeFirstBucket
    bucket.incomeItems.push(item)
  }

  for (const item of paymentItems) {
    if (item.dueDayOfMonth == null) {
      unscheduledBucket.payments.push(item)
      continue
    }
    const dueDate = `${month}-${String(item.dueDayOfMonth).padStart(2, "0")}`
    const bucket = findBucketForDate(dueDate) ?? beforeFirstBucket
    bucket.payments.push(item)
  }

  const allBuckets = [
    ...(beforeFirstBucket.incomeItems.length > 0 || beforeFirstBucket.payments.length > 0 ? [beforeFirstBucket] : []),
    ...buckets,
    ...(unscheduledBucket.payments.length > 0 ? [unscheduledBucket] : []),
  ]

  for (const bucket of allBuckets) {
    bucket.income = bucket.incomeItems.reduce((sum, item) => sum + item.amount, 0)
    bucket.paymentTotal = bucket.payments.reduce((sum, item) => sum + item.amount, 0)
    bucket.net = bucket.income - bucket.paymentTotal
  }

  return allBuckets
}

/**
 * Sums every category/subcategory's budgeted amount, applying a month-specific override in place of
 * the default when one exists. Bills and loans never carry a budget category, so budget spending and
 * committed bill/loan payments are naturally distinct — nothing here is excluded on their account.
 */
export function computeBudgetTotal(categories: BudgetCategory[], overrides: MonthlyBudgetOverride[], month: string): number {
  return categories.reduce((sum, category) => {
    if (category.subcategories.length === 0) {
      return sum + effectiveBudgetAmount(overrides, category.id, undefined, category.monthlyBudget, month)
    }
    return (
      sum +
      category.subcategories.reduce(
        (subSum, sub) => subSum + effectiveBudgetAmount(overrides, category.id, sub.id, sub.monthlyBudget, month),
        0,
      )
    )
  }, 0)
}

export interface CategorySpendingLine {
  categoryId: string
  subcategoryId: string
  label: string
  budgeted: number
  cleared: number
}

export interface CategorySpendingGroup {
  categoryId: string
  label: string
  budgeted: number
  cleared: number
  subcategories: CategorySpendingLine[]
}

/**
 * Sums cleared spend for a budget category/subcategory. Excludes income and any transaction already
 * tracked as a bill or loan payment, so committed bills/loans are never double-counted as budget
 * category spend even if the bill happens to carry the same category for organizational purposes.
 */
export function categorySpend(transactions: Transaction[], categoryId: string, subcategoryId?: string): number {
  return transactions
    .filter(t => t.type !== "income" && t.type !== "bill_payment" && t.type !== "loan_payment" && t.clearedStatus === "cleared")
    .reduce((sum, t) => {
      if (t.splits?.length) {
        const matching = t.splits.filter(s => s.categoryId === categoryId && (!subcategoryId || s.subcategoryId === subcategoryId))
        return sum + matching.reduce((subSum, split) => subSum + split.amount, 0)
      }
      const matches = subcategoryId ? t.categoryId === categoryId && t.subcategoryId === subcategoryId : t.categoryId === categoryId
      return matches ? sum + t.amount : sum
    }, 0)
}

/** Groups every budget category with its subcategories' budgeted amount and cleared spend for the month, for at-a-glance spending tracking. */
export function computeCategorySpendingGroups(
  categories: BudgetCategory[],
  transactions: Transaction[],
  overrides: MonthlyBudgetOverride[],
  month: string,
): CategorySpendingGroup[] {
  const sortedCategories = [...categories].sort((a, b) => a.sortOrder - b.sortOrder)

  return sortedCategories.map(category => {
    if (category.subcategories.length === 0) {
      return {
        categoryId: category.id,
        label: category.name,
        budgeted: effectiveBudgetAmount(overrides, category.id, undefined, category.monthlyBudget, month),
        cleared: categorySpend(transactions, category.id),
        subcategories: [],
      }
    }

    const subcategories: CategorySpendingLine[] = [...category.subcategories]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(sub => ({
        categoryId: category.id,
        subcategoryId: sub.id,
        label: sub.name,
        budgeted: effectiveBudgetAmount(overrides, category.id, sub.id, sub.monthlyBudget, month),
        cleared: categorySpend(transactions, category.id, sub.id),
      }))

    return {
      categoryId: category.id,
      label: category.name,
      budgeted: subcategories.reduce((sum, line) => sum + line.budgeted, 0),
      cleared: categorySpend(transactions, category.id),
      subcategories,
    }
  })
}
