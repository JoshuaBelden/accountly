import type { CsvDateFormat, CsvFormat } from "$lib/types/account"

export interface ParsedCsvRow {
  accountNumber: string
  description: string
  date: string // ISO YYYY-MM-DD
  rawType: "Debit" | "Credit"
  amount: number
  balance: number
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim())
      current = ""
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

function parseDateString(dateStr: string, format: CsvDateFormat): string {
  const s = dateStr.trim()
  if (format === "YYYY-MM-DD") return s
  const parts = s.split("/")
  if (parts.length !== 3) throw new Error(`Invalid date: ${s}`)
  const [month, day, year] = parts
  if (format === "MM/DD/YY") {
    const fullYear = parseInt(year) < 70 ? 2000 + parseInt(year) : 1900 + parseInt(year)
    return `${fullYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
  }
  // M/D/YYYY or MM/DD/YYYY — year is already 4 digits
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
}

/** Parses the first non-empty line of a CSV text and returns the column header names. */
export function detectHeaders(text: string): string[] {
  // Strip UTF-8 BOM if present (common in bank exports from Windows/Excel)
  const stripped = text.startsWith("\uFEFF") ? text.slice(1) : text
  const normalized = stripped.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim()
  // Find first non-empty line that actually contains comma-separated values
  for (const line of normalized.split("\n")) {
    if (!line.trim()) continue
    const fields = parseCSVLine(line.trim())
    if (fields.length > 1 || (fields.length === 1 && fields[0])) return fields
  }
  return []
}

/** Sniffs the date format from a sample date string by inspecting the year portion. */
export function detectDateFormat(sample: string): CsvDateFormat {
  const parts = sample.trim().split("/")
  if (parts.length !== 3) return "MM/DD/YY"
  return parts[2].length === 4 ? "M/D/YYYY" : "MM/DD/YY"
}

/**
 * Suggests field mappings by matching header names against common bank column names.
 * Returns partial mappings — unrecognized columns are left empty.
 */
export function autoDetectFormat(headers: string[]): { format: Partial<CsvFormat>; useDebitCredit: boolean } {
  const lower = headers.map(header => header.toLowerCase().trim())

  const find = (...names: string[]): string => {
    for (const name of names) {
      const index = lower.findIndex(header => header === name)
      if (index >= 0) return headers[index]
    }
    return ""
  }

  const dateField = find("transaction date", "post date", "date", "trans date", "posting date")
  const descriptionField = find("transaction description", "description", "memo", "payee", "name", "narrative")
  const amountField = find("transaction amount", "amount", "transaction amt")
  const typeField = find("transaction type", "type", "debit/credit", "dr/cr")
  const debitField = find("debit", "debit amount", "withdrawal")
  const creditField = find("credit", "credit amount", "deposit")
  const balanceField = find("balance", "running balance", "ledger balance")

  const useDebitCredit = !amountField && (!!debitField || !!creditField)

  return {
    format: { dateField, descriptionField, amountField, typeField, debitField, creditField, balanceField },
    useDebitCredit,
  }
}

/** Parses CSV text using a configured field mapping. */
export function parseCsvWithFormat(text: string, format: CsvFormat): ParsedCsvRow[] {
  const stripped = text.startsWith("\uFEFF") ? text.slice(1) : text
  const normalized = stripped.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim()
  const lines = normalized.split("\n")
  if (lines.length < 2) return []

  const headers = parseCSVLine(lines[0])
  const colIndex = (fieldName: string) =>
    headers.findIndex(header => header.toLowerCase().trim() === fieldName.toLowerCase().trim())

  const dateIndex = colIndex(format.dateField)
  const descIndex = colIndex(format.descriptionField)
  const amountIndex = format.amountField ? colIndex(format.amountField) : -1
  const typeIndex = format.typeField ? colIndex(format.typeField) : -1
  const debitIndex = format.debitField ? colIndex(format.debitField) : -1
  const creditIndex = format.creditField ? colIndex(format.creditField) : -1
  const balanceIndex = format.balanceField ? colIndex(format.balanceField) : -1

  if (dateIndex < 0 || descIndex < 0) return []

  const rows: ParsedCsvRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const cols = parseCSVLine(line)

    let amount: number
    let rawType: "Debit" | "Credit"

    if (amountIndex >= 0) {
      const rawAmount = parseFloat(cols[amountIndex] || "0")
      if (isNaN(rawAmount)) continue
      amount = Math.abs(rawAmount)
      if (typeIndex >= 0) {
        rawType = (cols[typeIndex] ?? "").toLowerCase().includes("credit") ? "Credit" : "Debit"
      } else {
        // Negative value = debit, positive = credit
        rawType = rawAmount >= 0 ? "Credit" : "Debit"
      }
    } else if (debitIndex >= 0 || creditIndex >= 0) {
      const debitVal = debitIndex >= 0 ? parseFloat(cols[debitIndex] || "") : NaN
      const creditVal = creditIndex >= 0 ? parseFloat(cols[creditIndex] || "") : NaN
      if (!isNaN(debitVal) && debitVal > 0) {
        amount = debitVal
        rawType = "Debit"
      } else if (!isNaN(creditVal) && creditVal > 0) {
        amount = creditVal
        rawType = "Credit"
      } else {
        continue
      }
    } else {
      continue
    }

    let date: string
    try {
      date = parseDateString(cols[dateIndex] ?? "", format.dateFormat)
    } catch {
      continue
    }

    rows.push({
      accountNumber: cols[0] ?? "",
      description: cols[descIndex] ?? "",
      date,
      rawType,
      amount,
      balance: balanceIndex >= 0 ? parseFloat(cols[balanceIndex] || "0") || 0 : 0,
    })
  }

  return rows
}

/** The built-in Capital One format used as the default when no format is configured. */
export const CAPITAL_ONE_FORMAT: CsvFormat = {
  dateField: "Transaction Date",
  descriptionField: "Transaction Description",
  amountField: "Transaction Amount",
  typeField: "Transaction Type",
  balanceField: "Balance",
  dateFormat: "MM/DD/YY",
}

/** Parses a CSV using the default Capital One format. Kept for backward compatibility. */
export function parseCsv(text: string): ParsedCsvRow[] {
  return parseCsvWithFormat(text, CAPITAL_ONE_FORMAT)
}
