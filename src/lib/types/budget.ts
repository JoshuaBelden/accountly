export interface BudgetSubcategory {
  id: string
  parentId: string
  name: string
  monthlyBudget: number
  notes?: string
  hints?: string
  sortOrder: number
}

export interface BudgetCategory {
  id: string
  name: string
  monthlyBudget: number
  subcategories: BudgetSubcategory[]
  notes?: string
  hints?: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface MonthlyBudgetOverride {
  id: string
  categoryId: string
  subcategoryId?: string
  month: string
  budgetAmount: number
}
