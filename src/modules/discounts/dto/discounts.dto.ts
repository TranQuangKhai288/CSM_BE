// Discount DTOs

export interface CreateDiscountDto {
  code: string;
  name: string;
  description?: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  value: number;
  minOrderValue?: number;
  maxDiscount?: number;
  usageLimit?: number;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}

export interface UpdateDiscountDto {
  name?: string;
  description?: string;
  value?: number;
  minOrderValue?: number;
  maxDiscount?: number;
  usageLimit?: number;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export interface DiscountResponse {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: string;
  value: number;
  minOrderValue: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usageCount: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiscountListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  isActive?: boolean;
  sortBy?: 'code' | 'value' | 'usageCount' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ValidateDiscountDto {
  code: string;
  orderTotal: number;
}

export interface ValidateDiscountResponse {
  valid: boolean;
  discount?: DiscountResponse;
  discountAmount?: number;
  finalTotal?: number;
  message?: string;
}

export interface DiscountStatsResponse {
  total: number;
  active: number;
  inactive: number;
  expired: number;
  totalUsage: number;
  mostUsed: Array<{
    id: string;
    code: string;
    name: string;
    usageCount: number;
  }>;
}
