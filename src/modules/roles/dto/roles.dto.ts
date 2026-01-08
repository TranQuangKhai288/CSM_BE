export interface CreateRoleDto {
  name: string;
  slug: string;
  description?: string;
  permissions: string[];
}

export interface UpdateRoleDto {
  name?: string;
  slug?: string;
  description?: string;
  permissions?: string[];
  isActive?: boolean;
}

export interface RoleResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    users: number;
  };
}

export interface RoleListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
}
