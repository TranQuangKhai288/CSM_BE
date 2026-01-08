export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const MESSAGES = {
  // Success
  SUCCESS: 'Operation successful',
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',

  // Auth
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  REGISTER_SUCCESS: 'Registration successful',
  TOKEN_REFRESHED: 'Token refreshed successfully',
  PASSWORD_CHANGED: 'Password changed successfully',
  PASSWORD_RESET: 'Password reset successful',

  // Errors
  INTERNAL_ERROR: 'Internal server error',
  VALIDATION_ERROR: 'Validation error',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  ALREADY_EXISTS: 'Resource already exists',
  INVALID_CREDENTIALS: 'Invalid credentials',
  INVALID_TOKEN: 'Invalid or expired token',
  RATE_LIMIT_EXCEEDED: 'Too many requests',
} as const;

export const PERMISSIONS = {
  // Users
  USERS_READ: 'users.read',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',

  // Roles
  ROLES_READ: 'roles.read',
  ROLES_CREATE: 'roles.create',
  ROLES_UPDATE: 'roles.update',
  ROLES_DELETE: 'roles.delete',

  // Products
  PRODUCTS_READ: 'products.read',
  PRODUCTS_CREATE: 'products.create',
  PRODUCTS_UPDATE: 'products.update',
  PRODUCTS_DELETE: 'products.delete',

  // Orders
  ORDERS_READ: 'orders.read',
  ORDERS_CREATE: 'orders.create',
  ORDERS_UPDATE: 'orders.update',
  ORDERS_DELETE: 'orders.delete',

  // Customers
  CUSTOMERS_READ: 'customers.read',
  CUSTOMERS_CREATE: 'customers.create',
  CUSTOMERS_UPDATE: 'customers.update',
  CUSTOMERS_DELETE: 'customers.delete',

  // Categories
  CATEGORIES_READ: 'categories.read',
  CATEGORIES_CREATE: 'categories.create',
  CATEGORIES_UPDATE: 'categories.update',
  CATEGORIES_DELETE: 'categories.delete',

  // Inventory
  INVENTORY_READ: 'inventory.read',
  INVENTORY_UPDATE: 'inventory.update',

  // Media
  MEDIA_READ: 'media.read',
  MEDIA_CREATE: 'media.create',
  MEDIA_UPDATE: 'media.update',
  MEDIA_DELETE: 'media.delete',

  // Analytics
  ANALYTICS_READ: 'analytics.read',
  ANALYTICS_CREATE: 'analytics.create',
  ANALYTICS_UPDATE: 'analytics.update',
  ANALYTICS_DELETE: 'analytics.delete',

  // Discounts
  DISCOUNTS_READ: 'discounts.read',
  DISCOUNTS_CREATE: 'discounts.create',
  DISCOUNTS_UPDATE: 'discounts.update',
  DISCOUNTS_DELETE: 'discounts.delete',

  // Settings
  SETTINGS_READ: 'settings.read',
  SETTINGS_UPDATE: 'settings.update',

  // Admin
  ADMIN_ALL: '*',
} as const;

export const CACHE_KEYS = {
  USER: (id: string) => `user:${id}`,
  USER_PERMISSIONS: (id: string) => `user:${id}:permissions`,
  ROLE: (id: string) => `role:${id}`,
  PRODUCT: (id: string) => `product:${id}`,
  CATEGORY: (id: string) => `category:${id}`,
  ORDER: (id: string) => `order:${id}`,
  CUSTOMER: (id: string) => `customer:${id}`,
  MEDIA: (id: string) => `media:${id}`,
  ANALYTICS: (id: string) => `analytics:${id}`,
  SETTINGS: (key: string) => `settings:${key}`,
  DASHBOARD_STATS: 'dashboard:stats',
} as const;

export const CACHE_TTL = {
  SHORT: 300, // 5 minutes
  MEDIUM: 1800, // 30 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
} as const;

export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[\d\s\-\+\(\)]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;
