/** A single tier in a progressive tax schedule. */
export interface TaxBracket {
  min: number
  max?: number
  rate: number
}

/** IRS filing status options. */
export type FilingStatus = 'single' | 'marriedFilingJointly' | 'marriedFilingSeparately' | 'headOfHousehold'

/** A named pre-tax paycheck deduction that reduces taxable income. */
export interface PreTaxDeduction {
  id: string
  name: string
  amountPerPaycheck: number
}

/** Complete tax configuration for a single tax year, with user-entered brackets for both federal and state. */
export interface TaxProfile {
  id: string
  taxYear: number
  filingStatus: FilingStatus
  federalBrackets: TaxBracket[]
  federalStandardDeduction: number
  stateName: string
  stateBrackets: TaxBracket[]
  stateStandardDeduction: number
  preTaxDeductions: PreTaxDeduction[]
  /** Paycheck IDs to include in tax calculations; empty array means all paychecks are included. */
  includedPaycheckIds: string[]
  createdAt: string
  updatedAt: string
}

/** Actual withholdings entered by the user for a single paycheck occurrence. */
export interface WithholdingEntry {
  id: string
  paycheckId: string
  payDate: string
  taxYear: number
  federalWithheld: number
  stateWithheld: number
  socialSecurityWithheld: number
  medicareWithheld: number
  createdAt: string
  updatedAt: string
}

/** Full computed annual tax breakdown derived from a TaxProfile and paycheck data. */
export interface AnnualTaxEstimate {
  grossIncome: number
  preTaxDeductions: number
  federalAgi: number
  federalTaxableIncome: number
  federalTax: number
  federalEffectiveRate: number
  stateTaxableIncome: number
  stateTax: number
  stateEffectiveRate: number
  socialSecurityTax: number
  medicareTax: number
  totalTax: number
  totalEffectiveRate: number
}

/** Recommended per-paycheck withholding amounts derived from an annual estimate. */
export interface PerPaycheckRecommended {
  paycheckId: string
  paycheckName: string
  checksPerYear: number
  grossPerCheck: number
  preTaxDeductionsPerCheck: number
  federalRecommended: number
  stateRecommended: number
  socialSecurityRecommended: number
  medicareRecommended: number
  totalRecommended: number
  netPerCheck: number
}

/** Year-to-date withholding summary comparing actual withheld vs. recommended. */
export interface WithholdingTrackerSummary {
  ytdFederalActual: number
  ytdStateActual: number
  ytdFicaActual: number
  ytdTotalActual: number
  ytdFederalRecommended: number
  ytdStateRecommended: number
  ytdFicaRecommended: number
  ytdTotalRecommended: number
  /** Positive means over-withheld (refund expected), negative means under-withheld (will owe). */
  ytdOverUnder: number
  projectedYearEndTotal: number
  projectedOverUnder: number
}
