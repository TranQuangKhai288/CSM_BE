// Customer DTOs

export interface Address {
  type: 'shipping' | 'billing';
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefault?: boolean;
}

export interface CreateCustomerDto {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  addresses?: Address[];
  isActive?: boolean;
}

export interface UpdateCustomerDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  addresses?: Address[];
  isActive?: boolean;
}

export interface CustomerResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatar: string | null;
  addresses: Address[] | null;
  totalOrders: number;
  totalSpent: number;
  loyaltyPoints: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
  minSpent?: number;
  maxSpent?: number;
  minOrders?: number;
  hasOrders?: boolean;
  sortBy?: 'firstName' | 'lastName' | 'email' | 'totalSpent' | 'totalOrders' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface CustomerStatsResponse {
  total: number;
  active: number;
  inactive: number;
  withOrders: number;
  totalRevenue: number;
  averageSpent: number;
  averageOrders: number;
  topCustomers: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    totalSpent: number;
    totalOrders: number;
  }>;
}
