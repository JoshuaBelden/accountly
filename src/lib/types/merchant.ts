/** A merchant entity that maps an imported transaction description pattern to a display name and budget category. */
export interface Merchant {
  id: string
  name: string
  hints: string
  icon?: string
  categoryId?: string
  subcategoryId?: string
  notes?: string
  createdAt: string
  updatedAt: string
}
