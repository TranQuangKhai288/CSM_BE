export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleId: string;
  phone?: string;
  avatar?: string;
}

export interface UpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  roleId?: string;
  phone?: string;
  avatar?: string;
  isActive?: boolean;
}

export interface UpdateUserPasswordDto {
  newPassword: string;
}

export interface UserResponse {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  phone: string | null;
  isActive: boolean;
  roleId: string;
  role: {
    id: string;
    name: string;
    slug: string;
    permissions: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface UserListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  roleId?: string;
  isActive?: boolean;
  sortBy?: 'createdAt' | 'email' | 'firstName';
  sortOrder?: 'asc' | 'desc';
}
