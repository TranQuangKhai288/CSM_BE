export interface CreateProductDto {
  name: string;
  slug?: string;
  sku?: string;
  description?: string;
  shortDescription?: string;
  categoryId: string;

  // Pricing
  basePrice: number;
  costPrice?: number;
  salePrice?: number;

  // Inventory
  trackInventory?: boolean;
  stockQuantity?: number;
  lowStockThreshold?: number;

  // Product attributes (JSONB - dynamic)
  // Stored as array of attribute objects: [{ key, label?, value }]
  attributes?: Attribute[];

  // Media
  images?: string[];
  featuredImage?: string;

  // Status
  isActive?: boolean;
  isFeatured?: boolean;

  // SEO
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;

  // Variants (if product has variants like size, color)
  hasVariants?: boolean;
}

export interface UpdateProductDto {
  name?: string;
  slug?: string;
  sku?: string;
  description?: string;
  shortDescription?: string;
  categoryId?: string;

  // Pricing
  basePrice?: number;
  salePrice?: number;
  costPrice?: number;

  // Inventory
  trackInventory?: boolean;
  stockQuantity?: number;
  lowStockThreshold?: number;

  // Product attributes (JSONB)
  // Stored as array of attribute objects: [{ key, label?, value }]
  attributes?: Attribute[];

  // Media
  images?: string[];
  featuredImage?: string;

  // Status
  isActive?: boolean;
  isFeatured?: boolean;

  // SEO
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
}

export interface ProductResponse {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string | null;
  shortDescription: string | null;
  categoryId: string;

  basePrice: number;
  salePrice: number | null;
  costPrice: number | null;

  trackInventory: boolean;
  stockQuantity: number;
  lowStockThreshold: number | null;

  attributes: Attribute[] | null;

  images: string[];
  featuredImage: string | null;

  isActive: boolean;
  isFeatured: boolean;

  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;

  category: {
    id: string;
    name: string;
    slug: string;
  };

  createdAt: Date;
  updatedAt: Date;
}

export interface Attribute {
  key: string;
  label?: string;
  value: any;
}

export interface ProductListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'OUT_OF_STOCK';
  sortBy?: 'name' | 'basePrice' | 'createdAt' | 'stock';
  sortOrder?: 'asc' | 'desc';
}

export interface ProductStatsResponse {
  total: number;
  active: number;
  inactive: number;
  featured: number;
  outOfStock: number;
  lowStock: number;
  totalValue: number;
  byCategory: Array<{
    categoryId: string;
    categoryName: string;
    count: number;
  }>;
}
