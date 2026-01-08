export interface CreateCategoryDto {
  name: string;
  slug?: string;
  description?: string;
  parentId?: string | null;
  image?: string;
  isActive?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  slug?: string;
  description?: string;
  parentId?: string | null;
  image?: string;
  isActive?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
}

export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  image: string | null;
  isActive: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  parent?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  children?: CategoryResponse[];
  _count?: {
    products: number;
    children: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryTreeNode {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  isActive: boolean;
  children?: CategoryTreeNode[];
  _count?: {
    products: number;
  };
}

export interface CategoryListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  parentId?: string | null;
  isActive?: boolean;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}
