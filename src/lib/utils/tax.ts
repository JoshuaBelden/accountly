import type { PayFrequency, Paycheck } from "$lib/types"
import type {
  AnnualTaxEstimate,
  PerPaycheckRecommended,
  TaxBracket,
  TaxProfile,
  WithholdingEntry,
  WithholdingTrackerSummary,
} from "$lib/types/tax"

/** Social Security wage base for FICA withholding cap. */
const SS_WAGE_BASE = 168_600

/** Additional Medicare tax threshold for single filers. */
const MEDICARE_SURCHARGE_THRESHOLD_SINGLE = 200_000

/** Additional Medicare tax threshold for married filing jointly. */
const MEDICARE_SURCHARGE_THRESHOLD_JOINT = 250_000

/** Social Security tax rate (employee share). */
const SS_RATE = 0.062

/** Medicare base tax rate (employee share). */
const MEDICARE_RATE = 0.0145

/** Additional Medicare tax rate for high earners. */
const MEDICARE_SURCHARGE_RATE = 0.009

/** Returns the number of paychecks issued per year for a given pay frequency. */
export function paychecksPerYear(frequency: PayFrequency): number {
  switch (frequency) {
    case "weekly":
      return 52
    case "biweekly":
      return 26
    case "semimonthly":
      return 24
    case "monthly":
      return 12
  }
}

/** Returns the gross amount per paycheck, preferring the explicit grossAmount field over expectedAmount. */
export function grossPerPaycheck(paycheck: Paycheck): number {
  return paycheck.grossAmount ?? paycheck.expectedAmount
}

/** Computes total annualized gross income across all included paychecks. */
export function annualizeGrossIncome(paychecks: Paycheck[], includedIds: string[]): number {
  const included = includedIds.length === 0 ? paychecks : paychecks.filter(p => includedIds.includes(p.id))
  return included.reduce((sum, paycheck) => sum + grossPerPaycheck(paycheck) * paychecksPerYear(paycheck.frequency), 0)
}

/** Computes total annual pre-tax deductions across all included paycheck-type income sources only. */
export function annualPreTaxDeductions(paychecks: Paycheck[], profile: TaxProfile): number {
  const included =
    profile.includedPaycheckIds.length === 0 ? paychecks : paychecks.filter(p => profile.includedPaycheckIds.includes(p.id))
  const paycheckOnly = included.filter(p => !p.incomeType || p.incomeType === "paycheck")
  const perCheckTotal = profile.preTaxDeductions.reduce((sum, deduction) => sum + deduction.amountPerPaycheck, 0)
  return paycheckOnly.reduce((sum, paycheck) => sum + perCheckTotal * paychecksPerYear(paycheck.frequency), 0)
}

/**
 * Applies a progressive bracket table to a taxable income amount.
 * Brackets should be sorted ascending by min. Returns total tax owed.
 */
export function applyBrackets(taxableIncome: number, brackets: TaxBracket[]): number {
  if (taxableIncome <= 0 || brackets.length === 0) return 0

  let remaining = taxableIncome
  let tax = 0

  const sorted = [...brackets].sort((firstBracket, secondBracket) => firstBracket.min - secondBracket.min)

  for (let index = 0; index < sorted.length; index++) {
    const bracket = sorted[index]
    const bracketTop = bracket.max ?? Infinity
    const bracketWidth = bracketTop - bracket.min
    const incomeInBracket = Math.min(remaining, bracketWidth)

    if (incomeInBracket <= 0) break

    tax += incomeInBracket * bracket.rate
    remaining -= incomeInBracket

    if (remaining <= 0) break
  }

  return tax
}

/**
 * Computes the full annual tax estimate from a TaxProfile and list of paychecks.
 * Returns a structured breakdown of all tax components.
 */
export function computeAnnualTaxEstimate(paychecks: Paycheck[], profile: TaxProfile): AnnualTaxEstimate {
  const grossIncome = annualizeGrossIncome(paychecks, profile.includedPaycheckIds)
  const preTaxDeductionTotal = annualPreTaxDeductions(paychecks, profile)

  const federalAgi = Math.max(0, grossIncome - preTaxDeductionTotal)
  const federalTaxableIncome = Math.max(0, federalAgi - profile.federalStandardDeduction)
  const federalTax = applyBrackets(federalTaxableIncome, profile.federalBrackets)
  const federalEffectiveRate = grossIncome > 0 ? federalTax / grossIncome : 0

  const stateTaxableIncome = Math.max(0, federalAgi - profile.stateStandardDeduction)
  const stateTax = applyBrackets(stateTaxableIncome, profile.stateBrackets)
  const stateEffectiveRate = grossIncome > 0 ? stateTax / grossIncome : 0

  const socialSecurityTax = Math.min(grossIncome, SS_WAGE_BASE) * SS_RATE

  const medicareBase = grossIncome * MEDICARE_RATE
  const isJoint = profile.filingStatus === "marriedFilingJointly"
  const surchargeThreshold = isJoint ? MEDICARE_SURCHARGE_THRESHOLD_JOINT : MEDICARE_SURCHARGE_THRESHOLD_SINGLE
  const medicareSurcharge = Math.max(0, grossIncome - surchargeThreshold) * MEDICARE_SURCHARGE_RATE
  const medicareTax = medicareBase + medicareSurcharge

  const totalTax = federalTax + stateTax + socialSecurityTax + medicareTax
  const totalEffectiveRate = grossIncome > 0 ? totalTax / grossIncome : 0

  return {
    grossIncome,
    preTaxDeductions: preTaxDeductionTotal,
    federalAgi,
    federalTaxableIncome,
    federalTax,
    federalEffectiveRate,
    stateTaxableIncome,
    stateTax,
    stateEffectiveRate,
    socialSecurityTax,
    medicareTax,
    totalTax,
    totalEffectiveRate,
  }
}

/**
 * Computes recommended per-paycheck withholding amounts for a single paycheck,
 * proportioned from an annual estimate.
 */
export function computePerPaycheckRecommended(paycheck: Paycheck, estimate: AnnualTaxEstimate, profile: TaxProfile): PerPaycheckRecommended {
  const checksPerYear = paychecksPerYear(paycheck.frequency)
  const grossPerCheck = grossPerPaycheck(paycheck)
  const preTaxDeductionsPerCheck = profile.preTaxDeductions.reduce((sum, deduction) => sum + deduction.amountPerPaycheck, 0)

  const federalRecommended = estimate.federalTax / checksPerYear
  const stateRecommended = estimate.stateTax / checksPerYear
  const socialSecurityRecommended = estimate.socialSecurityTax / checksPerYear
  const medicareRecommended = estimate.medicareTax / checksPerYear
  const totalRecommended = federalRecommended + stateRecommended + socialSecurityRecommended + medicareRecommended
  const netPerCheck = grossPerCheck - preTaxDeductionsPerCheck - totalRecommended

  return {
    paycheckId: paycheck.id,
    paycheckName: paycheck.name,
    checksPerYear,
    grossPerCheck,
    preTaxDeductionsPerCheck,
    federalRecommended,
    stateRecommended,
    socialSecurityRecommended,
    medicareRecommended,
    totalRecommended,
    netPerCheck,
  }
}

/**
 * Summarizes YTD actual withholdings versus recommended, and projects the year-end over/under.
 * YTD recommended is based on the number of withholding entries entered (not the full annual amount),
 * so comparisons are always apples-to-apples for the same number of pay periods.
 */
export function computeWithholdingTrackerSummary(
  entries: WithholdingEntry[],
  perPaycheckRows: PerPaycheckRecommended[],
  taxYear: number,
  annualEstimate: AnnualTaxEstimate,
): WithholdingTrackerSummary {
  const yearEntries = entries.filter(entry => entry.taxYear === taxYear)

  const ytdFederalActual = yearEntries.reduce((sum, entry) => sum + entry.federalWithheld, 0)
  const ytdStateActual = yearEntries.reduce((sum, entry) => sum + entry.stateWithheld, 0)
  const ytdFicaActual = yearEntries.reduce(
    (sum, entry) => sum + entry.socialSecurityWithheld + entry.medicareWithheld,
    0,
  )
  const ytdTotalActual = ytdFederalActual + ytdStateActual + ytdFicaActual

  // Build a map of recommended per check by paycheckId
  const recommendedByPaycheck = new Map(perPaycheckRows.map(row => [row.paycheckId, row]))

  let ytdFederalRecommended = 0
  let ytdStateRecommended = 0
  let ytdFicaRecommended = 0

  // Count entries per paycheck to determine how many periods have been entered
  const entriesByPaycheck = new Map<string, number>()
  for (const entry of yearEntries) {
    entriesByPaycheck.set(entry.paycheckId, (entriesByPaycheck.get(entry.paycheckId) ?? 0) + 1)
  }

  for (const [paycheckId, count] of entriesByPaycheck) {
    const recommended = recommendedByPaycheck.get(paycheckId)
    if (!recommended) continue
    ytdFederalRecommended += recommended.federalRecommended * count
    ytdStateRecommended += recommended.stateRecommended * count
    ytdFicaRecommended += (recommended.socialSecurityRecommended + recommended.medicareRecommended) * count
  }

  const ytdTotalRecommended = ytdFederalRecommended + ytdStateRecommended + ytdFicaRecommended
  const ytdOverUnder = ytdTotalActual - ytdTotalRecommended
  const projectedYearEndTotal = ytdTotalActual + (annualEstimate.totalTax - ytdTotalRecommended)
  const projectedOverUnder = ytdTotalActual - annualEstimate.totalTax

  return {
    ytdFederalActual,
    ytdStateActual,
    ytdFicaActual,
    ytdTotalActual,
    ytdFederalRecommended,
    ytdStateRecommended,
    ytdFicaRecommended,
    ytdTotalRecommended,
    ytdOverUnder,
    projectedYearEndTotal,
    projectedOverUnder,
  }
}
