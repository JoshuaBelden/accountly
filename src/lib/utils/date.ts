import type { Paycheck } from "$lib/types"

export function todayISO(): string {
  return new Date().toISOString().split("T")[0]
}

export function monthKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  return `${y}-${m}`
}

export function currentMonth(): string {
  return monthKey(new Date())
}

export function formatMonth(month: string): string {
  const [year, m] = month.split("-").map(Number)
  const date = new Date(year, m - 1, 1)
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
}

export function addMonths(month: string, n: number): string {
  const [year, m] = month.split("-").map(Number)
  const date = new Date(year, m - 1 + n, 1)
  return monthKey(date)
}

export function daysInMonth(month: string): number {
  const [year, m] = month.split("-").map(Number)
  return new Date(year, m, 0).getDate()
}

export function clampDay(day: number, month: string): number {
  return Math.min(day, daysInMonth(month))
}

export function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

/**
 * Returns an array of ISO date strings (YYYY-MM-DD) for pay days
 * in the given month for the given paycheck configuration.
 */
export function getPayDaysInMonth(paycheck: Paycheck, month: string): string[] {
  const [year, m] = month.split("-").map(Number)
  const days: string[] = []

  switch (paycheck.frequency) {
    case "monthly": {
      const day = paycheck.monthlyDay ?? 1
      days.push(isoDate(year, m, clampDay(day, month)))
      break
    }

    case "semimonthly": {
      const sd = paycheck.semimonthlyDays ?? { firstDay: 1, secondDay: 15 }
      days.push(isoDate(year, m, clampDay(sd.firstDay, month)))
      days.push(isoDate(year, m, clampDay(sd.secondDay, month)))
      break
    }

    case "biweekly": {
      if (!paycheck.biweeklyAnchorDate) break
      const anchor = new Date(paycheck.biweeklyAnchorDate + "T00:00:00")
      // Walk forward/backward from anchor in 14-day steps to find all
      // pay days in this month
      const monthStart = new Date(year, m - 1, 1)
      const monthEnd = new Date(year, m, 0)

      // Find the first pay day on or after monthStart
      const anchorTime = anchor.getTime()
      const msPerDay = 86400000
      const msPerCycle = 14 * msPerDay

      // How many cycles from anchor to monthStart?
      const diffMs = monthStart.getTime() - anchorTime
      const cycles = Math.floor(diffMs / msPerCycle)
      let current = new Date(anchorTime + cycles * msPerCycle)
      // Ensure we start before or at monthStart
      while (current > monthStart) {
        current = new Date(current.getTime() - msPerCycle)
      }
      while (current <= monthEnd) {
        if (current >= monthStart) {
          days.push(current.toISOString().split("T")[0])
        }
        current = new Date(current.getTime() + msPerCycle)
      }
      break
    }

    case "weekly": {
      if (!paycheck.weeklyAnchorDate) break
      const anchor = new Date(paycheck.weeklyAnchorDate + "T00:00:00")
      const monthStart = new Date(year, m - 1, 1)
      const monthEnd = new Date(year, m, 0)
      const msPerWeek = 7 * 86400000
      const anchorTime = anchor.getTime()
      const diffMs = monthStart.getTime() - anchorTime
      const weeks = Math.floor(diffMs / msPerWeek)
      let current = new Date(anchorTime + weeks * msPerWeek)
      while (current > monthStart) {
        current = new Date(current.getTime() - msPerWeek)
      }
      while (current <= monthEnd) {
        if (current >= monthStart) {
          days.push(current.toISOString().split("T")[0])
        }
        current = new Date(current.getTime() + msPerWeek)
      }
      break
    }
  }

  return days.sort()
}

/**
 * Finds the scheduled pay date closest to a given transaction date, within a tolerance window.
 * Checks the transaction's month and adjacent months to handle boundary cases.
 * @returns The matching pay date string (YYYY-MM-DD), or undefined if none within tolerance.
 */
export function findMatchingPayDate(paycheck: Paycheck, txDate: string, toleranceDays = 4): string | undefined {
  const txTime = new Date(txDate + "T00:00:00").getTime()
  const toleranceMs = toleranceDays * 86400000
  const txMonth = txDate.substring(0, 7)

  const candidates = [
    ...getPayDaysInMonth(paycheck, addMonths(txMonth, -1)),
    ...getPayDaysInMonth(paycheck, txMonth),
    ...getPayDaysInMonth(paycheck, addMonths(txMonth, 1)),
  ]

  for (const payDate of candidates) {
    const payTime = new Date(payDate + "T00:00:00").getTime()
    if (Math.abs(txTime - payTime) <= toleranceMs) return payDate
  }

  return undefined
}

export function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function formatDateShort(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}
