// Inventory DTOs

export interface CreateInventoryLogDto {
  productId: string;
  type: 'PURCHASE' | 'SALE' | 'RETURN' | 'ADJUSTMENT' | 'DAMAGE';
  quantity: number;
  note?: string;
}

export interface AdjustStockDto {
  productId: string;
  type: 'ADJUSTMENT' | 'DAMAGE';
  quantity: number; // Can be positive or negative
  note?: string;
}

export interface InventoryLogResponse {
  id: string;
  productId: string;
  product?: {
    id: string;
    name: string;
    sku: string;
  };
  type: string;
  quantity: number;
  before: number;
  after: number;
  note: string | null;
  createdBy: string | null;
  createdAt: Date;
}

export interface InventoryListQuery {
  page?: number;
  pageSize?: number;
  productId?: string;
  type?: 'PURCHASE' | 'SALE' | 'RETURN' | 'ADJUSTMENT' | 'DAMAGE';
  startDate?: string;
  endDate?: string;
  sortBy?: 'createdAt' | 'quantity';
  sortOrder?: 'asc' | 'desc';
}

export interface InventoryStatsResponse {
  totalLogs: number;
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  recentActivity: Array<{
    id: string;
    productId: string;
    type: string;
    quantity: number;
    before: number;
    after: number;
    createdAt: Date;
  }>;
  topMovements: Array<{
    productId: string;
    type: string;
    _sum: {
      quantity: number | null;
    };
  }>;
}

export interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  stock: number;
  lowStock: number;
}
