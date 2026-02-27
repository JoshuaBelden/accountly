import { accountsStore } from "$lib/stores/accounts.store"
import { billsStore } from "$lib/stores/bills.store"
import { budgetStore } from "$lib/stores/budget.store"
import { merchantsStore } from "$lib/stores/merchants.store"
import { paychecksStore } from "$lib/stores/paychecks.store"
import { transactionsStore } from "$lib/stores/transactions.store"
import type {
  Bill,
  BudgetCategory,
  BudgetSubcategory,
  CheckingAccount,
  Merchant,
  Paycheck,
  Transaction,
} from "$lib/types"

function uid() {
  return crypto.randomUUID()
}

function nowIso() {
  return new Date().toISOString()
}

/** Returns an ISO date string for a given day in the current month, capped to the last valid day. */
function monthDay(day: number): string {
  const today = new Date()
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const capped = Math.min(day, daysInMonth)
  return new Date(today.getFullYear(), today.getMonth(), capped).toISOString().split("T")[0]
}

/** Returns "cleared" for past days, "pending" for today and future. */
function statusFor(day: number): "cleared" | "pending" {
  return day < new Date().getDate() ? "cleared" : "pending"
}

/** Returns the ISO date of the most recent occurrence of a given weekday (0 = Sun, 5 = Fri). */
function mostRecentWeekday(weekday: number): string {
  const today = new Date()
  const diff = (today.getDay() - weekday + 7) % 7
  const result = new Date(today)
  result.setDate(today.getDate() - diff)
  return result.toISOString().split("T")[0]
}

/** Populates all stores with realistic sample data so new users can explore the app right away. */
export function importDefaultData() {
  const now = nowIso()

  // ── Account ───────────────────────────────────────────────────────────────

  const checkingId = uid()
  const checking: CheckingAccount = {
    id: checkingId,
    type: "checking",
    name: "Main Checking",
    balance: 1234.56,
    createdAt: now,
    updatedAt: now,
  }
  accountsStore.add(checking)

  // ── Paycheck ──────────────────────────────────────────────────────────────

  const paycheckId = uid()
  const paycheck: Paycheck = {
    id: paycheckId,
    name: "ShipIt Friday",
    expectedAmount: 2500,
    frequency: "biweekly",
    incomeType: "paycheck",
    accountId: checkingId,
    biweeklyAnchorDate: mostRecentWeekday(5),
    createdAt: now,
    updatedAt: now,
  }
  paychecksStore.add(paycheck)

  // ── Budget Categories ─────────────────────────────────────────────────────

  const housingId = uid()
  const rentSubId = uid()
  const utilitiesSubId = uid()
  const internetSubId = uid()
  const homeMaintSubId = uid()

  const foodId = uid()
  const groceriesSubId = uid()
  const restaurantsSubId = uid()
  const coffeeSubId = uid()

  const transportId = uid()
  const gasSubId = uid()
  const carInsuranceSubId = uid()
  const carMaintSubId = uid()

  const shoppingId = uid()
  const onlineShoppingSubId = uid()
  const clothingSubId = uid()

  const entertainmentId = uid()
  const streamingSubId = uid()
  const moviesSubId = uid()

  const healthcareId = uid()
  const healthInsuranceSubId = uid()
  const doctorSubId = uid()

  const personalCareId = uid()
  const groomingSubId = uid()
  const fitnessSubId = uid()

  const savingsId = uid()
  const emergencyFundSubId = uid()
  const investmentsSubId = uid()

  function makeSub(id: string, parentId: string, name: string, budget: number, order: number): BudgetSubcategory {
    return { id, parentId, name, monthlyBudget: budget, sortOrder: order }
  }

  const categories: BudgetCategory[] = [
    {
      id: housingId,
      name: "Housing",
      monthlyBudget: 1800,
      sortOrder: 0,
      subcategories: [
        makeSub(rentSubId, housingId, "Rent / Mortgage", 1500, 0),
        makeSub(utilitiesSubId, housingId, "Utilities", 150, 1),
        makeSub(internetSubId, housingId, "Internet", 100, 2),
        makeSub(homeMaintSubId, housingId, "Home Maintenance", 50, 3),
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: foodId,
      name: "Food & Dining",
      monthlyBudget: 600,
      sortOrder: 1,
      subcategories: [
        makeSub(groceriesSubId, foodId, "Groceries", 350, 0),
        makeSub(restaurantsSubId, foodId, "Restaurants", 200, 1),
        makeSub(coffeeSubId, foodId, "Coffee", 50, 2),
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: transportId,
      name: "Transportation",
      monthlyBudget: 400,
      sortOrder: 2,
      subcategories: [
        makeSub(gasSubId, transportId, "Gas", 150, 0),
        makeSub(carInsuranceSubId, transportId, "Car Insurance", 150, 1),
        makeSub(carMaintSubId, transportId, "Car Maintenance", 100, 2),
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: shoppingId,
      name: "Shopping",
      monthlyBudget: 200,
      sortOrder: 3,
      subcategories: [
        makeSub(onlineShoppingSubId, shoppingId, "Online Shopping", 100, 0),
        makeSub(clothingSubId, shoppingId, "Clothing", 100, 1),
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: entertainmentId,
      name: "Entertainment",
      monthlyBudget: 150,
      sortOrder: 4,
      subcategories: [
        makeSub(streamingSubId, entertainmentId, "Streaming Services", 50, 0),
        makeSub(moviesSubId, entertainmentId, "Movies & Events", 100, 1),
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: healthcareId,
      name: "Healthcare",
      monthlyBudget: 150,
      sortOrder: 5,
      subcategories: [
        makeSub(healthInsuranceSubId, healthcareId, "Insurance", 100, 0),
        makeSub(doctorSubId, healthcareId, "Doctor Visits", 50, 1),
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: personalCareId,
      name: "Personal Care",
      monthlyBudget: 150,
      sortOrder: 6,
      subcategories: [
        makeSub(groomingSubId, personalCareId, "Haircuts & Grooming", 75, 0),
        makeSub(fitnessSubId, personalCareId, "Gym & Fitness", 75, 1),
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: savingsId,
      name: "Savings",
      monthlyBudget: 500,
      sortOrder: 7,
      subcategories: [
        makeSub(emergencyFundSubId, savingsId, "Emergency Fund", 300, 0),
        makeSub(investmentsSubId, savingsId, "Investments", 200, 1),
      ],
      createdAt: now,
      updatedAt: now,
    },
  ]

  for (const category of categories) {
    budgetStore.addCategory(category)
  }

  // ── Merchants ─────────────────────────────────────────────────────────────

  const amazonId = uid()
  const walmartId = uid()
  const targetId = uid()
  const starbucksId = uid()
  const netflixId = uid()
  const spotifyId = uid()
  const costcoId = uid()
  const wholeFoodsId = uid()
  const shellId = uid()
  const mcdonaldsId = uid()

  const merchants: Merchant[] = [
    {
      id: amazonId,
      name: "Amazon",
      hints: "amazon",
      categoryId: shoppingId,
      subcategoryId: onlineShoppingSubId,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: walmartId,
      name: "Walmart",
      hints: "walmart",
      categoryId: foodId,
      subcategoryId: groceriesSubId,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: targetId,
      name: "Target",
      hints: "target",
      categoryId: shoppingId,
      subcategoryId: clothingSubId,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: starbucksId,
      name: "Starbucks",
      hints: "starbucks",
      categoryId: foodId,
      subcategoryId: coffeeSubId,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: netflixId,
      name: "Netflix",
      hints: "netflix",
      categoryId: entertainmentId,
      subcategoryId: streamingSubId,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: spotifyId,
      name: "Spotify",
      hints: "spotify",
      categoryId: entertainmentId,
      subcategoryId: streamingSubId,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: costcoId,
      name: "Costco",
      hints: "costco",
      categoryId: foodId,
      subcategoryId: groceriesSubId,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: wholeFoodsId,
      name: "Whole Foods",
      hints: "whole foods,wholefoods",
      categoryId: foodId,
      subcategoryId: groceriesSubId,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: shellId,
      name: "Shell",
      hints: "shell",
      categoryId: transportId,
      subcategoryId: gasSubId,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: mcdonaldsId,
      name: "McDonald's",
      hints: "mcdonald",
      categoryId: foodId,
      subcategoryId: restaurantsSubId,
      createdAt: now,
      updatedAt: now,
    },
  ]

  for (const merchant of merchants) {
    merchantsStore.add(merchant)
  }

  // ── Bills ─────────────────────────────────────────────────────────────────

  const rentBillId = uid()
  const electricBillId = uid()
  const internetBillId = uid()
  const carInsuranceBillId = uid()
  const gymBillId = uid()

  const bills: Bill[] = [
    {
      id: rentBillId,
      name: "Rent",
      amount: 1500,
      frequency: "monthly",
      dueDayOfMonth: 1,
      autoPay: false,
      accountId: checkingId,
      categoryId: housingId,
      subcategoryId: rentSubId,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: electricBillId,
      name: "Electric",
      amount: 120,
      frequency: "monthly",
      dueDayOfMonth: 15,
      autoPay: true,
      accountId: checkingId,
      categoryId: housingId,
      subcategoryId: utilitiesSubId,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: internetBillId,
      name: "Internet",
      amount: 80,
      frequency: "monthly",
      dueDayOfMonth: 10,
      autoPay: true,
      accountId: checkingId,
      categoryId: housingId,
      subcategoryId: internetSubId,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: carInsuranceBillId,
      name: "Car Insurance",
      amount: 150,
      frequency: "monthly",
      dueDayOfMonth: 5,
      autoPay: true,
      accountId: checkingId,
      categoryId: transportId,
      subcategoryId: carInsuranceSubId,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: gymBillId,
      name: "Gym Membership",
      amount: 45,
      frequency: "monthly",
      dueDayOfMonth: 20,
      autoPay: true,
      accountId: checkingId,
      categoryId: personalCareId,
      subcategoryId: fitnessSubId,
      createdAt: now,
      updatedAt: now,
    },
  ]

  for (const bill of bills) {
    billsStore.add(bill)
  }

  // ── Transactions ──────────────────────────────────────────────────────────

  function makeTx(
    day: number,
    description: string,
    amount: number,
    type: Transaction["type"],
    categoryId?: string,
    subcategoryId?: string,
    merchantId?: string,
    billId?: string,
    paycheckId?: string,
  ): Transaction {
    return {
      id: uid(),
      date: monthDay(day),
      description,
      amount,
      type,
      accountId: checkingId,
      clearedStatus: statusFor(day),
      categoryId,
      subcategoryId,
      merchantId,
      billId,
      paycheckId,
      createdAt: now,
      updatedAt: now,
    }
  }

  const transactions: Transaction[] = [
    makeTx(1, "Rent", 1500, "bill_payment", housingId, rentSubId, undefined, rentBillId),
    makeTx(2, "Starbucks", 6.75, "expense", foodId, coffeeSubId, starbucksId),
    makeTx(3, "Walmart", 87.42, "expense", foodId, groceriesSubId, walmartId),
    makeTx(4, "Amazon", 34.99, "expense", shoppingId, onlineShoppingSubId, amazonId),
    makeTx(5, "Car Insurance", 150, "bill_payment", transportId, carInsuranceSubId, undefined, carInsuranceBillId),
    makeTx(5, "Netflix", 15.99, "expense", entertainmentId, streamingSubId, netflixId),
    makeTx(6, "Shell Gas", 52.3, "expense", transportId, gasSubId, shellId),
    makeTx(7, "McDonald's", 11.45, "expense", foodId, restaurantsSubId, mcdonaldsId),
    makeTx(8, "ShipIt Friday", 2500, "income", undefined, undefined, undefined, undefined, paycheckId),
    makeTx(10, "Internet", 80, "bill_payment", housingId, internetSubId, undefined, internetBillId),
    makeTx(11, "Whole Foods", 124.67, "expense", foodId, groceriesSubId, wholeFoodsId),
    makeTx(12, "Starbucks", 7.25, "expense", foodId, coffeeSubId, starbucksId),
    makeTx(13, "Target", 43.18, "expense", shoppingId, clothingSubId, targetId),
    makeTx(14, "Shell Gas", 48.9, "expense", transportId, gasSubId, shellId),
    makeTx(15, "Electric", 120, "bill_payment", housingId, utilitiesSubId, undefined, electricBillId),
    makeTx(16, "McDonald's", 9.87, "expense", foodId, restaurantsSubId, mcdonaldsId),
    makeTx(17, "Spotify", 9.99, "expense", entertainmentId, streamingSubId, spotifyId),
    makeTx(18, "Whole Foods", 98.34, "expense", foodId, groceriesSubId, wholeFoodsId),
    makeTx(19, "Amazon", 67.89, "expense", shoppingId, onlineShoppingSubId, amazonId),
    makeTx(20, "Gym Membership", 45, "bill_payment", personalCareId, fitnessSubId, undefined, gymBillId),
  ]

  for (const transaction of transactions) {
    transactionsStore.add(transaction)
  }
}
