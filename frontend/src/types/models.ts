export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface Company {
  id: number;
  corporateName: string;
  tradeName: string;
  cnpj: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  active: boolean;
  createdAt: string;
}

export interface UserItem {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'OPERADOR';
  active: boolean;
  createdAt: string;
}

export interface Customer {
  id: number;
  name: string;
  document?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
  active: boolean;
  createdAt: string;
}

export interface Supplier {
  id: number;
  corporateName: string;
  tradeName?: string;
  document: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
  active: boolean;
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  active: boolean;
  createdAt: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  description?: string;
  unit: string;
  categoryId?: number;
  categoryName?: string;
  supplierId?: number;
  supplierName?: string;
  costPrice: number;
  salePrice: number;
  currentStock: number;
  minStock: number;
  lowStock: boolean;
  active: boolean;
  createdAt: string;
}

export type StockMovementType =
  | 'ENTRADA'
  | 'SAIDA'
  | 'AJUSTE_POSITIVO'
  | 'AJUSTE_NEGATIVO'
  | 'SAIDA_VENDA'
  | 'ESTORNO_VENDA';

export interface StockMovement {
  id: number;
  productId: number;
  productName: string;
  productSku: string;
  productUnit: string;
  userId: number;
  userName: string;
  type: StockMovementType;
  quantity: number;
  balanceAfter: number;
  unitCost: number;
  reason?: string;
  sourceDocument?: string;
  createdAt: string;
}

export type PaymentMethod =
  | 'PIX'
  | 'DINHEIRO'
  | 'CARTAO_CREDITO'
  | 'CARTAO_DEBITO'
  | 'BOLETO'
  | 'A_PRAZO'
  | 'TRANSFERENCIA';

export type SaleStatus = 'ORCAMENTO' | 'CONFIRMADA' | 'CANCELADA';

export interface SaleItem {
  id?: number;
  productId: number;
  productName: string;
  productSku: string;
  productUnit: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

export interface Sale {
  id: number;
  saleNumber: string;
  customerId?: number;
  customerName?: string;
  customerDocument?: string;
  userId: number;
  userName: string;
  saleDate: string;
  subtotal: number;
  discount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  cancellationReason?: string;
  notes?: string;
  items: SaleItem[];
  createdAt: string;
}

export type FinancialType = 'RECEBER' | 'PAGAR';
export type FinancialStatus = 'PENDENTE' | 'PAGO' | 'CANCELADO';

export interface FinancialEntry {
  id: number;
  saleId?: number;
  customerId?: number;
  customerName?: string;
  supplierId?: number;
  supplierName?: string;
  description: string;
  type: FinancialType;
  category: string;
  amount: number;
  dueDate: string;
  paymentDate?: string;
  status: FinancialStatus;
  paymentMethod?: PaymentMethod;
  overdue: boolean;
  notes?: string;
  createdAt: string;
}

export interface FinancialSummary {
  pendingReceivables: number;
  pendingPayables: number;
  overdueReceivables: number;
  overduePayables: number;
  netProjectedCashFlow: number;
}

// Fase 4: Gestão, Dashboard, Relatórios & Auditoria
export interface DashboardOverview {
  monthlyRevenue: number;
  monthlySalesCount: number;
  pendingReceivables: number;
  pendingPayables: number;
  lowStockCount: number;
}

export interface SalesByPeriod {
  date: string;
  totalAmount: number;
  salesCount: number;
}

export interface TopProduct {
  productId: number;
  productName: string;
  productSku: string;
  quantitySold: number;
  totalRevenue: number;
}

export interface AuditLog {
  id: number;
  userId?: number;
  userName?: string;
  userEmail?: string;
  action: string;
  entityName: string;
  entityId?: string;
  ipAddress?: string;
  detailsJson?: string;
  createdAt: string;
}

export interface SalesReportItem {
  saleId: number;
  saleNumber: string;
  saleDate: string;
  customerName: string;
  userName: string;
  paymentMethod: string;
  status: string;
  subtotal: number;
  discount: number;
  totalAmount: number;
}

export interface InventoryReportItem {
  productId: number;
  name: string;
  sku: string;
  categoryName: string;
  unit: string;
  currentStock: number;
  minStock: number;
  costPrice: number;
  salePrice: number;
  totalCostValue: number;
  totalSaleValue: number;
  lowStock: boolean;
}

export interface FinancialReportItem {
  id: number;
  description: string;
  type: string;
  category: string;
  relatedEntity: string;
  amount: number;
  dueDate: string;
  paymentDate?: string;
  status: string;
  paymentMethod: string;
}
