// Rebalances Bills, Budget, and a handful of miscategorized Transactions directly in the
// synced MongoDB document, per the plan at .claude/plans/budget-and-bills-distributed-charm.md.
//
// Usage: node --env-file=.env scripts/rebalance-budget.mjs [--apply-due-date-shift] [--write]
//
// Reads MONGODB_URI and SYNC_PASSPHRASE from the environment. Dry-run by default — prints a
// full diff/summary and writes a local backup of the current (pre-mutation) data, but never
// touches Mongo unless --write is passed.

import { randomUUID, webcrypto as crypto } from "node:crypto"
import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { MongoClient } from "mongodb"

const __dirname = dirname(fileURLToPath(import.meta.url))

const args = process.argv.slice(2)
const shouldWrite = args.includes("--write")
const applyDueDateShift = args.includes("--apply-due-date-shift")

const CAPITALONE_CHECKING_ID = "e7609fe2-f768-4a14-84ee-ce60d86cfbcd"
const COLUMBIA_NAME_PATTERN = /columbia/i

// ---- Encryption (mirrors src/lib/utils/crypto.ts — keep these two in sync) ----

const SALT = new TextEncoder().encode("accountly-sync-v1")
const PBKDF2_ITERATIONS = 100_000

async function deriveKey(passphrase) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  )
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: SALT, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  )
}

async function deriveSyncId(passphrase) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(passphrase))
  return Array.from(new Uint8Array(hash))
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("")
}

async function encryptBlob(plaintext, passphrase) {
  const key = await deriveKey(passphrase)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plaintext))
  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(ciphertext), iv.byteLength)
  return Buffer.from(combined).toString("base64")
}

async function decryptBlob(blob, passphrase) {
  const key = await deriveKey(passphrase)
  const combined = Buffer.from(blob, "base64")
  const iv = combined.subarray(0, 12)
  const ciphertext = combined.subarray(12)
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext)
  return new TextDecoder().decode(plaintext)
}

// ---- Mongo I/O (mirrors src/lib/server/db.ts and the sync API route) ----

async function fetchCurrentDoc(client, syncId) {
  const doc = await client.db("accountly").collection("syncs").findOne({ _id: syncId })
  if (!doc) throw new Error(`No sync document found for id ${syncId} — check SYNC_PASSPHRASE`)
  return doc
}

async function writeBlob(client, syncId, blob) {
  const updatedAt = new Date().toISOString()
  await client
    .db("accountly")
    .collection("syncs")
    .updateOne({ _id: syncId }, { $set: { blob, updatedAt } }, { upsert: true })
  return updatedAt
}

// ---- Envelope validation (mirrors validateEnvelope in src/lib/persistence/localStorage.ts) ----

function assertValidEnvelope(data, label) {
  const obj = data
  const ok =
    obj &&
    typeof obj === "object" &&
    typeof obj.version === "number" &&
    typeof obj.exportedAt === "string" &&
    Array.isArray(obj.accounts) &&
    Array.isArray(obj.bills) &&
    Array.isArray(obj.paychecks) &&
    Array.isArray(obj.transactions) &&
    Array.isArray(obj.budgetCategories) &&
    Array.isArray(obj.budgetOverrides) &&
    Array.isArray(obj.plannerAssignments) &&
    (!("merchants" in obj) || Array.isArray(obj.merchants))
  if (!ok) throw new Error(`Invalid ExportEnvelope shape (${label})`)
  if (obj.version !== 1) throw new Error(`Unsupported envelope version ${obj.version} (${label}), expected 1`)
}

function writeBackup(envelope) {
  const dir = join(__dirname, "backups")
  mkdirSync(dir, { recursive: true })
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
  const path = join(dir, `pre-rebalance-${timestamp}.json`)
  writeFileSync(path, JSON.stringify(envelope, null, 2))
  return path
}

// ---- Declarative change set ----

const REBALANCE_CONFIG = {
  billsToAdd: [
    {
      key: "citi",
      name: "Citi Credit Card",
      amount: 150,
      frequency: "monthly",
      dueDayOfMonth: 10,
      autoPay: false,
      accountId: CAPITALONE_CHECKING_ID,
      categoryId: "11d0849a-045b-4efc-a33b-bd82f6b0a6ec", // Loans/Debt
      subcategoryId: "212aedbd-141e-4a6a-b1ca-64eb4b31148b", // Credit Cards
      notes: "Revolving CC payment, variable $39–$465/mo; estimate only.",
    },
    {
      key: "proBros",
      name: "Pro-Bros Maintenance",
      amount: 160,
      frequency: "monthly",
      dueDayOfMonth: 10,
      autoPay: false,
      accountId: CAPITALONE_CHECKING_ID,
      categoryId: "2df3fb69-3c9c-4ade-8744-42fdcb467baa", // Household
      subcategoryId: "b49d963e-488a-4ec6-809b-47a953224fab", // Improvement
      notes: "Zelle payment, first observed Jun 2026.",
    },
    {
      key: "chatgpt",
      name: "ChatGPT Plus",
      amount: 20,
      frequency: "monthly",
      dueDayOfMonth: 21,
      autoPay: true,
      isSubscription: true,
      accountId: CAPITALONE_CHECKING_ID,
      categoryId: "ab5ab3e3-eb11-4c66-a099-1bc1b5f276b9", // Professional
      subcategoryId: "e72346e8-1928-4143-9891-56cfe7fbbe2a", // Services
      notes: "Subscription confirmed at a flat $20/mo from Jun 2026 onward.",
    },
  ],
  billAmountUpdates: [
    {
      id: "3107cf28-d689-4655-9406-179b62889885", // Amazon Prime Store Card
      amount: 200,
      appendNote: "Revolving store-card balance, varies $42–$300/mo; budgeted at estimated average, revisit quarterly.",
    },
  ],
  billAccountFixes: [
    "170570b3-8fb3-4654-b48e-3ed3450b1b6d", // Rogue Valley Sewer
    "9776e654-cfaa-49ac-9898-ec43054051ac", // Apple One
    "8c231847-7c9a-4c02-ad67-79ffb4213707", // iCloud+
  ],
  budgetAdjustments: [
    { subcategoryId: "e3335989-862b-48ed-b547-f7bd7c83931b", newMonthlyBudget: 260 }, // Convenience Store
    { subcategoryId: "567ea7cd-bc7b-41d6-9c2c-134e610eed96", newMonthlyBudget: 400 }, // Clubs & Hobbies
    { subcategoryId: "fab1d9c2-7369-4f6d-b816-b9946355b0c8", newMonthlyBudget: 150 }, // Travel
    { subcategoryId: "6701a325-72a8-40f5-ac27-94a00b462a13", newMonthlyBudget: 100 }, // Games
    { subcategoryId: "501418a0-6fc6-4a46-b103-a7a832f5ccb0", newMonthlyBudget: 60 }, // Video Games
    { subcategoryId: "7713d447-cf5a-406b-91eb-452cecf30055", newMonthlyBudget: 150 }, // Dining Out
    { subcategoryId: "ea5a0997-e875-4cad-a83e-639f551106f4", newMonthlyBudget: 90 }, // Meal Delivery
    { subcategoryId: "177d0ecb-a92c-4967-8f3d-19b22c542e84", newMonthlyBudget: 60 }, // Alcohol
    { subcategoryId: "0cabecf9-c208-4e95-bfc3-e22f9c0515f9", newMonthlyBudget: 300 }, // Groceries
  ],
  transactionRecategorizations: {
    savingsDeposits: {
      ids: [
        "727ad8a3-7a4e-4c85-8ba9-e468ae3d2f39",
        "a155ae51-cc84-4b79-b3d2-219d5bbfdb03",
        "8eda65ed-b08e-4a58-a875-7bbf265efffb",
        "d9fc2019-ae7d-4e01-8595-2b025d943a20",
        "df9a3687-0bda-493f-bb8f-3c3bb821574e",
        "1e794bce-ae40-41c6-86d9-4af99ef245c7",
      ],
      setType: "transfer",
      categoryId: "6b4dec7d-7fcb-4766-b10f-e978de1cc483", // Finance
      subcategoryId: "42104708-966c-48d8-9b2d-84109a784ba6", // Savings
    },
    citi: {
      ids: ["fb71ec9b-db48-4bca-8364-5bd8c8a0d1f4", "c4b810eb-fde6-46ee-b85a-96c0fb830659", "a100636c-06bd-42a3-91af-15191c1b1244"],
      categoryId: "11d0849a-045b-4efc-a33b-bd82f6b0a6ec",
      subcategoryId: "212aedbd-141e-4a6a-b1ca-64eb4b31148b",
    },
    proBros: {
      ids: ["e8e416e1-a664-440b-aedf-1ca6bc4f6f9a", "099262b2-6ef1-400e-a975-3f8dc217a624"],
      categoryId: "2df3fb69-3c9c-4ade-8744-42fdcb467baa",
      subcategoryId: "b49d963e-488a-4ec6-809b-47a953224fab",
    },
  },
  keywordRules: [
    {
      keywords: ["BACHELOR", "4UP", "GOLFNOW", "1UP", "WIDGI", "ASPENLAKES", "RIVERS EDGE", "PARSCRIPTION", "STONERIDGE"],
      categoryId: "a6f0b6e5-e4bf-412c-9f56-002f499a579d", // Entertainment
      subcategoryId: "567ea7cd-bc7b-41d6-9c2c-134e610eed96", // Clubs & Hobbies
    },
    {
      keywords: ["KOA", "CAMPING WORLD", "WEST GLACIER", "ST MARY", "PASCO"],
      categoryId: "a6f0b6e5-e4bf-412c-9f56-002f499a579d",
      subcategoryId: "fab1d9c2-7369-4f6d-b816-b9946355b0c8", // Travel
    },
    {
      keywords: ["ZOOTOWN", "SILVER MOON", "NORTHSIDE BAR", "LAZY BEAR"],
      categoryId: "c52bb2e9-e28a-4ba6-9b56-35273876cca9", // Food
      subcategoryId: "177d0ecb-a92c-4967-8f3d-19b22c542e84", // Alcohol
    },
  ],
  dueDateShifts: [
    { billName: "City of Bend", newDueDayOfMonth: 12 },
    { billName: "Verizon", newDueDayOfMonth: 12 },
  ],
}

// ---- Mutation functions ----

function applyBillChanges(envelope, config, changeLog, shiftDueDates) {
  for (const billId of config.billAccountFixes) {
    const bill = envelope.bills.find(b => b.id === billId)
    if (!bill) throw new Error(`billAccountFixes: bill ${billId} not found`)
    const before = bill.accountId ?? null
    bill.accountId = CAPITALONE_CHECKING_ID
    changeLog.push({ what: `Bill accountId fix: ${bill.name}`, before, after: bill.accountId })
  }

  for (const update of config.billAmountUpdates) {
    const bill = envelope.bills.find(b => b.id === update.id)
    if (!bill) throw new Error(`billAmountUpdates: bill ${update.id} not found`)
    const before = bill.amount
    bill.amount = update.amount
    bill.notes = bill.notes ? `${bill.notes}\n${update.appendNote}` : update.appendNote
    changeLog.push({ what: `Bill amount update: ${bill.name}`, before, after: bill.amount })
  }

  const billIdMap = {}
  const now = new Date().toISOString()
  for (const def of config.billsToAdd) {
    const { key, ...billFields } = def
    const id = randomUUID()
    const bill = { id, createdAt: now, updatedAt: now, ...billFields }
    envelope.bills.push(bill)
    billIdMap[key] = id
    changeLog.push({ what: `Bill added: ${bill.name}`, before: null, after: `$${bill.amount}/mo, due day ${bill.dueDayOfMonth}` })
  }

  if (shiftDueDates) {
    for (const shift of config.dueDateShifts) {
      const bill = envelope.bills.find(b => b.name === shift.billName)
      if (!bill) throw new Error(`dueDateShifts: bill "${shift.billName}" not found`)
      const before = bill.dueDayOfMonth
      const note = "Due date shown here assumes biller confirms the move — call to request before relying on this."
      bill.dueDayOfMonth = shift.newDueDayOfMonth
      bill.notes = bill.notes ? `${bill.notes}\n${note}` : note
      changeLog.push({ what: `Bill due-date shift: ${bill.name}`, before, after: bill.dueDayOfMonth })
    }
  }

  return billIdMap
}

function applyBudgetChanges(envelope, config, changeLog) {
  for (const adjustment of config.budgetAdjustments) {
    let found = false
    for (const category of envelope.budgetCategories) {
      const sub = category.subcategories.find(s => s.id === adjustment.subcategoryId)
      if (!sub) continue
      const before = sub.monthlyBudget
      sub.monthlyBudget = adjustment.newMonthlyBudget
      changeLog.push({ what: `Budget: ${category.name} / ${sub.name}`, before, after: sub.monthlyBudget })
      found = true
      break
    }
    if (!found) throw new Error(`budgetAdjustments: subcategory ${adjustment.subcategoryId} not found`)
  }
}

function applyTransactionChanges(envelope, config, changeLog, billIdMap, columbiaAccountIds) {
  function recategorizeByIds(ids, patch, label) {
    for (const id of ids) {
      const tx = envelope.transactions.find(t => t.id === id)
      if (!tx) {
        changeLog.push({ what: `${label}: transaction ${id} NOT FOUND`, before: null, after: null })
        continue
      }
      if (columbiaAccountIds.has(tx.accountId)) {
        throw new Error(`Refusing to touch transaction ${id} — belongs to a Columbia account`)
      }
      const before = { type: tx.type, categoryId: tx.categoryId, subcategoryId: tx.subcategoryId, billId: tx.billId }
      Object.assign(tx, patch)
      changeLog.push({ what: `${label}: ${tx.date} ${tx.description} ($${tx.amount})`, before, after: patch })
    }
  }

  const { savingsDeposits, citi, proBros } = config.transactionRecategorizations
  recategorizeByIds(
    savingsDeposits.ids,
    { type: savingsDeposits.setType, categoryId: savingsDeposits.categoryId, subcategoryId: savingsDeposits.subcategoryId },
    "Savings-deposit recategorization",
  )
  recategorizeByIds(
    citi.ids,
    { categoryId: citi.categoryId, subcategoryId: citi.subcategoryId, billId: billIdMap.citi },
    "Citi recategorization",
  )
  recategorizeByIds(
    proBros.ids,
    { categoryId: proBros.categoryId, subcategoryId: proBros.subcategoryId, billId: billIdMap.proBros },
    "Pro-Bros recategorization",
  )

  for (const rule of config.keywordRules) {
    let matched = 0
    let skipped = 0
    for (const tx of envelope.transactions) {
      if (tx.accountId !== CAPITALONE_CHECKING_ID) continue
      const description = tx.description.toUpperCase()
      if (!rule.keywords.some(keyword => description.includes(keyword))) continue
      if (tx.subcategoryId === rule.subcategoryId) {
        skipped++
        continue
      }
      const before = { categoryId: tx.categoryId, subcategoryId: tx.subcategoryId }
      tx.categoryId = rule.categoryId
      tx.subcategoryId = rule.subcategoryId
      changeLog.push({
        what: `Keyword match [${rule.keywords[0]}]: ${tx.date} ${tx.description} ($${tx.amount})`,
        before,
        after: { categoryId: rule.categoryId, subcategoryId: rule.subcategoryId },
      })
      matched++
    }
    changeLog.push({ what: `Keyword rule summary [${rule.keywords.join(", ")}]`, before: null, after: `${matched} matched, ${skipped} already tagged` })
  }
}

function assertNoColumbiaTouch(envelope, columbiaAccountIds) {
  const badBill = envelope.bills.find(bill => bill.accountId && columbiaAccountIds.has(bill.accountId))
  if (badBill) throw new Error(`Safety check failed: Bill "${badBill.name}" references a Columbia account`)
}

// ---- Summary ----

const FREQUENCY_MONTHLY_MULTIPLIER = { monthly: 1, bimonthly: 0.5, weekly: 4.33, biweekly: 2.17, quarterly: 1 / 3, annually: 1 / 12 }

function billTotal(envelope) {
  return envelope.bills.reduce((sum, bill) => sum + bill.amount * (FREQUENCY_MONTHLY_MULTIPLIER[bill.frequency] ?? 1), 0)
}

function budgetTotal(envelope) {
  return envelope.budgetCategories.reduce(
    (sum, category) => sum + category.subcategories.reduce((subSum, sub) => subSum + sub.monthlyBudget, 0),
    0,
  )
}

function uncategorizedCount(envelope) {
  return envelope.transactions.filter(t => t.type !== "income" && !t.categoryId).length
}

function computePayDays(paycheck) {
  if (paycheck.frequency === "semimonthly" && paycheck.semimonthlyDays) {
    return [paycheck.semimonthlyDays.firstDay, paycheck.semimonthlyDays.secondDay]
  }
  if (paycheck.frequency === "monthly" && typeof paycheck.monthlyDay === "number") {
    return [paycheck.monthlyDay]
  }
  return []
}

function printHalfSplit(label, envelope) {
  const incomeEvents = envelope.paychecks.flatMap(paycheck => computePayDays(paycheck).map(day => ({ day, amount: paycheck.expectedAmount })))
  const skipped = envelope.paychecks.filter(paycheck => computePayDays(paycheck).length === 0)
  const frontIncome = incomeEvents.filter(event => event.day < 25).reduce((sum, event) => sum + event.amount, 0)
  const backIncome = incomeEvents.filter(event => event.day >= 25).reduce((sum, event) => sum + event.amount, 0)

  const monthlyBills = envelope.bills.filter(bill => bill.frequency === "monthly" && typeof bill.dueDayOfMonth === "number")
  const frontBills = monthlyBills.filter(bill => bill.dueDayOfMonth < 25).reduce((sum, bill) => sum + bill.amount, 0)
  const backBills = monthlyBills.filter(bill => bill.dueDayOfMonth >= 25).reduce((sum, bill) => sum + bill.amount, 0)

  console.log(`${label} front (day<25):  income $${frontIncome.toFixed(2)} - bills $${frontBills.toFixed(2)} = $${(frontIncome - frontBills).toFixed(2)}`)
  console.log(`${label} back  (day>=25): income $${backIncome.toFixed(2)} - bills $${backBills.toFixed(2)} = $${(backIncome - backBills).toFixed(2)}`)
  if (skipped.length) {
    console.log(`  (skipped ${skipped.length} paycheck(s) with an unsupported frequency for this split: ${skipped.map(p => p.name).join(", ")})`)
  }
}

function printSummary(before, after, changeLog) {
  console.log("\n=== Change Log ===")
  for (const entry of changeLog) {
    console.log(`- ${entry.what}`)
    if (entry.before !== null || entry.after !== null) {
      console.log(`    before: ${JSON.stringify(entry.before)}`)
      console.log(`    after:  ${JSON.stringify(entry.after)}`)
    }
  }

  console.log("\n=== Totals ===")
  console.log(`Bills: ${before.bills.length} -> ${after.bills.length}; monthly-equivalent $${billTotal(before).toFixed(2)} -> $${billTotal(after).toFixed(2)}`)
  console.log(`Budget total: $${budgetTotal(before).toFixed(2)} -> $${budgetTotal(after).toFixed(2)}`)
  console.log(`Uncategorized expense/bill_payment transactions: ${uncategorizedCount(before)} -> ${uncategorizedCount(after)}`)

  console.log("\n=== Front-half vs back-half cash flow ===")
  printHalfSplit("Before", before)
  printHalfSplit("After ", after)
}

// ---- Main ----

async function main() {
  const MONGODB_URI = process.env.MONGODB_URI
  const SYNC_PASSPHRASE = process.env.SYNC_PASSPHRASE
  if (!MONGODB_URI) {
    console.error("Missing MONGODB_URI. Run with: node --env-file=.env scripts/rebalance-budget.mjs")
    process.exit(1)
  }
  if (!SYNC_PASSPHRASE) {
    console.error("Missing SYNC_PASSPHRASE. Run with: node --env-file=.env scripts/rebalance-budget.mjs")
    process.exit(1)
  }

  const syncId = await deriveSyncId(SYNC_PASSPHRASE)
  const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 8000, connectTimeoutMS: 8000 })
  await client.connect()

  try {
    const doc = await fetchCurrentDoc(client, syncId)
    const plaintext = await decryptBlob(doc.blob, SYNC_PASSPHRASE)
    const envelope = JSON.parse(plaintext)
    assertValidEnvelope(envelope, "current cloud data")

    const backupPath = writeBackup(envelope)
    console.log(`Backed up current data to ${backupPath}`)

    const before = structuredClone(envelope)
    const changeLog = []

    const columbiaAccountIds = new Set(envelope.accounts.filter(account => COLUMBIA_NAME_PATTERN.test(account.name)).map(account => account.id))

    const billIdMap = applyBillChanges(envelope, REBALANCE_CONFIG, changeLog, applyDueDateShift)
    applyBudgetChanges(envelope, REBALANCE_CONFIG, changeLog)
    applyTransactionChanges(envelope, REBALANCE_CONFIG, changeLog, billIdMap, columbiaAccountIds)
    assertNoColumbiaTouch(envelope, columbiaAccountIds)

    envelope.exportedAt = new Date().toISOString()
    assertValidEnvelope(envelope, "mutated data")

    printSummary(before, envelope, changeLog)

    if (!shouldWrite) {
      console.log("\nDry run only — no changes written to MongoDB. Re-run with --write to apply.")
      return
    }

    const newPlaintext = JSON.stringify(envelope)
    const newBlob = await encryptBlob(newPlaintext, SYNC_PASSPHRASE)
    const updatedAt = await writeBlob(client, syncId, newBlob)
    console.log(`\nWrote updated data to MongoDB at ${updatedAt}.`)

    const verifyDoc = await fetchCurrentDoc(client, syncId)
    const verifyPlaintext = await decryptBlob(verifyDoc.blob, SYNC_PASSPHRASE)
    const verifyEnvelope = JSON.parse(verifyPlaintext)
    assertValidEnvelope(verifyEnvelope, "post-write read-back")
    console.log("Post-write read-back verified OK.")
    console.log("\nNext step: open the app, go to Settings, and click Download (not Upload) to pull this into your browser.")
  } finally {
    await client.close()
  }
}

main().catch(err => {
  console.error("Failed:", err.message)
  process.exit(1)
})
