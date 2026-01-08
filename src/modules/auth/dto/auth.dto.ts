export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface ChangePasswordDto {
  oldPassword: string;
  newPassword: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: {
      id: string;
      name: string;
      slug: string;
    };
  };
  accessToken: string;
  refreshToken: string;
}
