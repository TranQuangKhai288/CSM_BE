import { body, query } from 'express-validator';
import { REGEX } from '@common/constants';

export const createProductValidation = [
  body('name')
    .notEmpty()
    .withMessage('Product name is required')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Product name must be between 2 and 200 characters'),

  body('slug')
    .optional()
    .trim()
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug must contain only lowercase letters, numbers, and hyphens'),

  body('sku')
    .optional()
    .trim()
    .matches(/^[A-Z0-9-]+$/i)
    .withMessage('SKU must contain only letters, numbers, and hyphens'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Description must not exceed 5000 characters'),

  body('shortDescription')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Short description must not exceed 500 characters'),

  body('categoryId')
    .notEmpty()
    .withMessage('Category is required')
    .matches(REGEX.UUID)
    .withMessage('Invalid category ID format'),

  // Pricing validation
  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),

  body('compareAtPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Compare at price must be a positive number'),

  body('costPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cost price must be a positive number'),

  // Inventory validation
  body('trackInventory').optional().isBoolean().withMessage('trackInventory must be a boolean'),

  body('stockQuantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer'),

  body('lowStockThreshold')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Low stock threshold must be a non-negative integer'),

  // Attributes validation (JSONB)
  body('attributes').optional().isObject().withMessage('Attributes must be a valid JSON object'),

  // Media validation
  body('images').optional().isArray().withMessage('Images must be an array'),

  body('images.*').optional().isURL().withMessage('Each image must be a valid URL'),

  body('featuredImage').optional().isURL().withMessage('Featured image must be a valid URL'),

  // Status validation
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),

  body('isFeatured').optional().isBoolean().withMessage('isFeatured must be a boolean'),

  // SEO validation
  body('metaTitle')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Meta title must not exceed 200 characters'),

  body('metaDescription')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Meta description must not exceed 500 characters'),

  body('metaKeywords')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Meta keywords must not exceed 500 characters'),
];

export const updateProductValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Product name must be between 2 and 200 characters'),

  body('slug')
    .optional()
    .trim()
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug must contain only lowercase letters, numbers, and hyphens'),

  body('sku')
    .optional()
    .trim()
    .matches(/^[A-Z0-9-]+$/i)
    .withMessage('SKU must contain only letters, numbers, and hyphens'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Description must not exceed 5000 characters'),

  body('shortDescription')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Short description must not exceed 500 characters'),

  body('categoryId').optional().matches(REGEX.UUID).withMessage('Invalid category ID format'),

  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),

  body('compareAtPrice')
    .optional()
    .custom((value) => value === null || (typeof value === 'number' && value >= 0))
    .withMessage('Compare at price must be a positive number or null'),

  body('costPrice')
    .optional()
    .custom((value) => value === null || (typeof value === 'number' && value >= 0))
    .withMessage('Cost price must be a positive number or null'),

  body('trackInventory').optional().isBoolean().withMessage('trackInventory must be a boolean'),

  body('stockQuantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer'),

  body('lowStockThreshold')
    .optional()
    .custom((value) => value === null || (typeof value === 'number' && value >= 0))
    .withMessage('Low stock threshold must be a non-negative integer or null'),

  body('attributes')
    .optional()
    .custom((value) => value === null || typeof value === 'object')
    .withMessage('Attributes must be a valid JSON object or null'),

  body('images').optional().isArray().withMessage('Images must be an array'),

  body('images.*').optional().isURL().withMessage('Each image must be a valid URL'),

  body('featuredImage')
    .optional()
    .custom((value) => value === null || /^https?:\/\/.+/.test(value))
    .withMessage('Featured image must be a valid URL or null'),

  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),

  body('isFeatured').optional().isBoolean().withMessage('isFeatured must be a boolean'),

  body('metaTitle')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Meta title must not exceed 200 characters'),

  body('metaDescription')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Meta description must not exceed 500 characters'),

  body('metaKeywords')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Meta keywords must not exceed 500 characters'),
];

export const productListValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Page size must be between 1 and 100'),

  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),

  query('categoryId').optional().matches(REGEX.UUID).withMessage('Invalid category ID format'),

  query('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),

  query('isFeatured').optional().isBoolean().withMessage('isFeatured must be a boolean'),

  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Min price must be a positive number'),

  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Max price must be a positive number'),

  query('inStock').optional().isBoolean().withMessage('inStock must be a boolean'),

  query('status')
    .optional()
    .isIn(['DRAFT', 'PUBLISHED', 'ARCHIVED', 'OUT_OF_STOCK'])
    .withMessage('status must be one of: DRAFT, PUBLISHED, ARCHIVED, OUT_OF_STOCK'),

  query('sortBy')
    .optional()
    .isIn(['name', 'basePrice', 'createdAt', 'stock'])
    .withMessage('sortBy must be one of: name, basePrice, createdAt, stock'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('sortOrder must be either asc or desc'),
];
