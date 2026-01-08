// Order DTOs and Interfaces

export interface AddressDto {
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
}

export interface OrderItemDto {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface CreateOrderDto {
  customerId: string;
  items: OrderItemDto[];
  shippingAddress: AddressDto;
  billingAddress?: AddressDto;
  paymentMethod?: string;
  discount?: number;
  tax?: number;
  shipping?: number;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface UpdateOrderDto {
  status?:
    | 'PENDING'
    | 'CONFIRMED'
    | 'PROCESSING'
    | 'SHIPPED'
    | 'DELIVERED'
    | 'CANCELLED'
    | 'REFUNDED';
  paymentStatus?: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
  paymentMethod?: string;
  trackingNumber?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface OrderItemResponse {
  id: string;
  productId: string;
  variantId: string | null;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  total: number;
  metadata: any;
  createdAt: Date;
}

export interface OrderResponse {
  id: string;
  orderNumber: string;
  customerId: string;
  customer?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  userId: string | null;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  shippingAddress: AddressDto | null;
  billingAddress: AddressDto | null;
  trackingNumber: string | null;
  notes: string | null;
  metadata: any;
  items?: OrderItemResponse[];
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}

export interface OrderListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  customerId?: string;
  status?:
    | 'PENDING'
    | 'CONFIRMED'
    | 'PROCESSING'
    | 'SHIPPED'
    | 'DELIVERED'
    | 'CANCELLED'
    | 'REFUNDED';
  paymentStatus?: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
  minTotal?: number;
  maxTotal?: number;
  startDate?: string;
  endDate?: string;
  sortBy?: 'orderNumber' | 'total' | 'createdAt' | 'completedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface OrderStatsResponse {
  total: number;
  pending: number;
  confirmed: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  refunded: number;
  totalRevenue: number;
  averageOrderValue: number;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    total: number;
    status: string;
    createdAt: Date;
  }>;
}

export interface UpdateOrderStatusDto {
  status:
    | 'PENDING'
    | 'CONFIRMED'
    | 'PROCESSING'
    | 'SHIPPED'
    | 'DELIVERED'
    | 'CANCELLED'
    | 'REFUNDED';
  note?: string;
}
