// ── Shared ────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

export interface PageResponse<T> {
  content: T[]
  number: number
  size: number
  totalElements: number
  totalPages: number
}

// ── Auth ──────────────────────────────────────────────────────────────
export type UserRole = 'ADMIN' | 'FARM_MANAGER' | 'SALES_OFFICER' | 'ACCOUNTANT'

export interface LoginResponse {
  token: string
  username: string
  fullName: string
  role: UserRole
  tenantId: number
  tenantName: string
}

// ── Users ─────────────────────────────────────────────────────────────
export interface ManagedUser {
  id: number
  username: string
  fullName: string
  role: UserRole
  active: boolean
  createdAt: string
}

// ── Customers ─────────────────────────────────────────────────────────
export type CustomerType = string

export interface Customer {
  id: number
  name: string
  phone: string | null
  email: string | null
  address: string | null
  customerType: CustomerType
  createdAt: string
}

export interface CustomerTypeDef {
  id: number
  typeName: string
  pricePerKg: number
  currency: string
}

// ── Pricing ───────────────────────────────────────────────────────────
export interface PricingTier {
  id: number
  tierName: CustomerType
  pricePerKg: number
  currency: string
  updatedAt: string
  updatedBy: string
}

// ── Ponds ─────────────────────────────────────────────────────────────
export interface Pond {
  id: number
  name: string
  capacityKg: number | null
  notes: string | null
  active: boolean
}

// ── Cycles ────────────────────────────────────────────────────────────
export type CycleStatus = 'ACTIVE' | 'HARVESTED' | 'CLOSED'

export interface FarmCycle {
  id: number
  name: string
  pondId: number | null
  pondName: string | null
  startDate: string
  endDate: string | null
  status: CycleStatus
  fingerlingCount: number | null
  fingerlingSource: string | null
  expectedYieldKg: number | null
  actualYieldKg: number | null
  totalMortalities: number
  notes: string | null
  createdBy: string
  createdAt: string
}

export interface CycleMortality {
  id: number
  count: number
  cause: string | null
  recordedDate: string
  recordedBy: string
}

export interface CycleProfit {
  cycleId: number
  cycleName: string
  status: CycleStatus
  fingerlingCount: number | null
  expectedYieldKg: number | null
  actualYieldKg: number | null
  totalMortalities: number
  lossRatePercent: number
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  roiPercent: number
  totalSalesCount: number
}

export interface BackfillResult {
  cycleId: number
  cycleName: string
  expensesUpdated: number
  salesUpdated: number
  inventoryTransactionsUpdated: number
  totalUpdated: number
}

// ── Sales ─────────────────────────────────────────────────────────────
export interface Sale {
  id: number
  customerId: number
  customerName: string
  customerType: CustomerType
  cycleId: number | null
  cycleName: string | null
  saleDate: string
  totalQuantityKg: number
  totalPrice: number
  paymentMethod: string
  invoiceNumber: string | null
  invoiceStatus: 'PAID' | 'UNPAID' | 'PARTIAL'
  notes: string | null
  createdAt: string
}

// ── Expenses ──────────────────────────────────────────────────────────
export type ExpenseCategory =
  | 'FEED' | 'MEDICATION' | 'LABOR' | 'LOGISTICS'
  | 'SALARY' | 'UTILITIES' | 'OTHER'

export interface Expense {
  id: number
  cycleId: number | null
  cycleName: string | null
  category: ExpenseCategory
  amount: number
  description: string | null
  expenseDate: string
  recordedBy: string
  createdAt: string
}

// ── Inventory ─────────────────────────────────────────────────────────
export type InventoryCategory = 'FEED' | 'MEDICATION' | 'EQUIPMENT' | 'OTHER'

export interface InventoryItem {
  id: number
  name: string
  category: InventoryCategory
  quantityInStock: number
  unit: string
  reorderLevel: number | null
  lowStock: boolean
}

export interface InventoryTransaction {
  id: number
  itemId: number
  itemName: string
  category: InventoryCategory
  transactionType: 'PURCHASE' | 'USAGE' | 'ADJUSTMENT'
  quantity: number
  unit: string
  unitCost: number | null
  totalCost: number | null
  cycleId: number | null
  cycleName: string | null
  notes: string | null
  transactionDate: string
  recordedBy: string
}

// ── Payments / Debts ──────────────────────────────────────────────────
export interface Payment {
  id: number
  saleId: number
  amount: number
  paymentDate: string
  paymentMethod: string
  notes: string | null
  recordedBy: string
  createdAt: string
}

export interface DebtDto {
  saleId: number
  invoiceNumber: string | null
  customerId: number
  customerName: string
  saleDate: string
  totalAmount: number
  paidAmount: number
  balance: number
  invoiceStatus: 'PAID' | 'UNPAID' | 'PARTIAL'
}

export interface DebtSummary {
  totalDebtors: number
  totalOutstanding: number
  debts: DebtDto[]
}

// ── Expenses (summary) ────────────────────────────────────────────────
export interface ExpenseSummary {
  totalAmount: number
  byCategory: Record<string, number>
}

// ── Crisis Management ─────────────────────────────────────────────────
export type CrisisSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface CrisisEvent {
  id: number
  eventDate: string
  title: string
  severity: CrisisSeverity
  affectedCount: number | null
  solution: string | null
  description: string | null
  resolved: boolean
  recordedBy: string | null
  createdAt: string
}

// ── Reports ───────────────────────────────────────────────────────────
export interface DailySalesReport {
  date: string
  transactionCount: number
  totalQuantityKg: number
  totalRevenue: number
}

export interface RangeReport {
  from: string
  to: string
  salesCount: number
  totalQuantityKg: number
  totalRevenue: number
  totalExpenses: number
  netProfit: number
}
