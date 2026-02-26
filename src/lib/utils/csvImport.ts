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

// Parse MM/DD/YY → YYYY-MM-DD
function parseMmDdYy(dateStr: string): string {
  const parts = dateStr.trim().split("/")
  if (parts.length !== 3) throw new Error(`Invalid date: ${dateStr}`)
  const [m, d, y] = parts
  const year = parseInt(y) < 70 ? 2000 + parseInt(y) : 1900 + parseInt(y)
  return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`
}

export function parseCsv(text: string): ParsedCsvRow[] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim()
  const lines = normalized.split("\n")
  if (lines.length < 2) return []

  const rows: ParsedCsvRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const cols = parseCSVLine(line)
    if (cols.length < 5) continue
    const amount = parseFloat(cols[4])
    if (isNaN(amount)) continue
    rows.push({
      accountNumber: cols[0],
      description: cols[1],
      date: parseMmDdYy(cols[2]),
      rawType: cols[3] as "Debit" | "Credit",
      amount,
      balance: cols[5] ? parseFloat(cols[5]) : 0,
    })
  }
  return rows
}
