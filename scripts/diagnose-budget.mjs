// Read-only diagnostic: verifies the Budget page's "Budgeted" header figure is the unfiltered sum of
// every category/subcategory's monthlyBudget (mirrors computeBudgetTotal in src/lib/utils/planner.ts).
// Bills/loans no longer link to budget categories at all, so nothing is excluded here by design —
// this just confirms the numbers line up and flags any cached-total desync (a parent category's
// monthlyBudget field out of sync with the sum of its own subcategories), a separate possible source
// of a mismatch between the header and a manual add-up.
//
// Never writes anything — safe to run any time.
//
// Usage: node --env-file=.env scripts/diagnose-budget.mjs [YYYY-MM]

import { webcrypto as crypto } from "node:crypto"
import { MongoClient } from "mongodb"

const monthArg = process.argv[2] ?? new Date().toISOString().slice(0, 7)

// ---- Encryption (mirrors src/lib/utils/crypto.ts) ----

const SALT = new TextEncoder().encode("accountly-sync-v1")
const PBKDF2_ITERATIONS = 100_000

async function deriveKey(passphrase) {
  const keyMaterial = await crypto.subtle.importKey("raw", new TextEncoder().encode(passphrase), "PBKDF2", false, ["deriveKey"])
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
  return Array.from(new Uint8Array(hash)).map(byte => byte.toString(16).padStart(2, "0")).join("")
}

async function decryptBlob(blob, passphrase) {
  const key = await deriveKey(passphrase)
  const combined = Buffer.from(blob, "base64")
  const iv = combined.subarray(0, 12)
  const ciphertext = combined.subarray(12)
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext)
  return new TextDecoder().decode(plaintext)
}

// ---- Mirrors computeBudgetTotal in src/lib/utils/planner.ts ----

function effectiveBudgetAmount(overrides, categoryId, subcategoryId, defaultAmount, month) {
  const override = overrides.find(o => o.categoryId === categoryId && o.subcategoryId === subcategoryId && o.month === month)
  return override?.budgetAmount ?? defaultAmount
}

function fmt(amount) {
  return `$${amount.toFixed(2)}`
}

async function main() {
  const MONGODB_URI = process.env.MONGODB_URI
  const SYNC_PASSPHRASE = process.env.SYNC_PASSPHRASE
  if (!MONGODB_URI || !SYNC_PASSPHRASE) {
    console.error("Missing MONGODB_URI or SYNC_PASSPHRASE. Run with: node --env-file=.env scripts/diagnose-budget.mjs")
    process.exit(1)
  }

  const syncId = await deriveSyncId(SYNC_PASSPHRASE)
  const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 8000, connectTimeoutMS: 8000 })
  await client.connect()

  try {
    const doc = await client.db("accountly").collection("syncs").findOne({ _id: syncId })
    if (!doc) throw new Error(`No sync document found for id ${syncId} — check SYNC_PASSPHRASE`)
    const plaintext = await decryptBlob(doc.blob, SYNC_PASSPHRASE)
    const envelope = JSON.parse(plaintext)

    const { bills, budgetCategories: categories, budgetOverrides: overrides } = envelope
    const month = monthArg

    console.log(`Diagnosing month: ${month}\n`)

    let nominalTotal = 0 // sum of every leaf monthlyBudget (subcategory, or category if no subcategories) — matches a manual add-up, no overrides applied
    let cachedParentTotal = 0 // sum of category.monthlyBudget (the cached field)
    let budgetTotal = 0 // what computeBudgetTotal produces (overrides applied) — what the header shows now
    const desyncLines = []

    for (const category of categories) {
      cachedParentTotal += category.monthlyBudget

      if (category.subcategories.length === 0) {
        nominalTotal += category.monthlyBudget
        budgetTotal += effectiveBudgetAmount(overrides, category.id, undefined, category.monthlyBudget, month)
        continue
      }

      let subSum = 0
      for (const sub of category.subcategories) {
        nominalTotal += sub.monthlyBudget
        subSum += sub.monthlyBudget
        budgetTotal += effectiveBudgetAmount(overrides, category.id, sub.id, sub.monthlyBudget, month)
      }

      if (subSum !== category.monthlyBudget) {
        desyncLines.push(
          `  - ${category.name}: cached parent total ${fmt(category.monthlyBudget)} != sum of subcategories ${fmt(subSum)} (diff ${fmt(category.monthlyBudget - subSum)})`,
        )
      }
    }

    const stragglers = bills.filter(bill => bill.categoryId || bill.subcategoryId)

    console.log("=== Totals ===")
    console.log(`Nominal total (sum of every leaf monthlyBudget, no overrides — matches a manual add-up): ${fmt(nominalTotal)}`)
    console.log(`Cached parent-category total (sum of category.monthlyBudget fields):                     ${fmt(cachedParentTotal)}`)
    console.log(`Budgeted total shown in the app for ${month} (overrides applied, nothing excluded):          ${fmt(budgetTotal)}`)

    console.log("\n=== Cached-total desyncs (parent category.monthlyBudget != sum of its subcategories) ===")
    if (desyncLines.length === 0) {
      console.log("  (none)")
    } else {
      desyncLines.forEach(line => console.log(line))
    }

    console.log("\n=== Stale Bill.categoryId/subcategoryId still present in synced data ===")
    console.log("(Bills no longer read or write these fields — harmless leftovers from before the cleanup, never affect any total.)")
    if (stragglers.length === 0) {
      console.log("  (none)")
    } else {
      stragglers.forEach(bill => console.log(`  - ${bill.name} (categoryId: ${bill.categoryId ?? "-"}, subcategoryId: ${bill.subcategoryId ?? "-"})`))
    }
  } finally {
    await client.close()
  }
}

main().catch(err => {
  console.error("Failed:", err.message)
  process.exit(1)
})
