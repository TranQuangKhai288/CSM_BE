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
    .optional({ values: 'falsy' })
    .trim()
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug must contain only lowercase letters, numbers, and hyphens'),

  body('sku')
    .optional({ values: 'falsy' })
    .trim()
    .matches(/^[A-Z0-9-]+$/i)
    .withMessage('SKU must contain only letters, numbers, and hyphens'),

  body('description')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Description must not exceed 5000 characters'),

  body('shortDescription')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Short description must not exceed 500 characters'),

  body('categoryId')
    .notEmpty()
    .withMessage('Category is required')
    .matches(REGEX.UUID)
    .withMessage('Invalid category ID format'),

  // Pricing validation
  body('basePrice')
    .notEmpty()
    .withMessage('Base price is required')
    .isFloat({ min: 0 })
    .withMessage('Base price must be a positive number'),
  body('salePrice')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0 })
    .withMessage('Sale price must be a positive number'),

  body('costPrice')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0 })
    .withMessage('Cost price must be a positive number'),

  // Inventory validation
  body('trackInventory')
    .optional({ values: 'falsy' })
    .isBoolean()
    .withMessage('trackInventory must be a boolean'),

  body('stockQuantity')
    .optional({ values: 'falsy' })
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer'),

  body('lowStockThreshold')
    .optional({ values: 'falsy' })
    .isInt({ min: 0 })
    .withMessage('Low stock threshold must be a non-negative integer'),

  // Attributes validation (JSONB array of {key, label?, value})
  body('attributes')
    .optional({ values: 'falsy' })
    .isArray()
    .withMessage('Attributes must be an array')
    .custom((value) => {
      if (!Array.isArray(value)) return true; // Already checked by isArray
      return value.every(
        (attr) =>
          typeof attr === 'object' &&
          attr !== null &&
          typeof attr.key === 'string' &&
          attr.key.length > 0 &&
          (attr.label === undefined || typeof attr.label === 'string') &&
          attr.value !== undefined
      );
    })
    .withMessage('Each attribute must have {key: string, label?: string, value: any}'),

  // Media validation
  body('images').optional({ values: 'falsy' }).isArray().withMessage('Images must be an array'),

  body('images.*')
    .optional({ values: 'falsy' })
    .isURL()
    .withMessage('Each image must be a valid URL'),

  body('featuredImage')
    .optional({ values: 'falsy' })
    .isURL()
    .withMessage('Featured image must be a valid URL'),

  // Status validation
  body('isActive')
    .optional({ values: 'falsy' })
    .isBoolean()
    .withMessage('isActive must be a boolean'),

  body('isFeatured')
    .optional({ values: 'falsy' })
    .isBoolean()
    .withMessage('isFeatured must be a boolean'),

  // SEO validation
  body('metaTitle')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 200 })
    .withMessage('Meta title must not exceed 200 characters'),

  body('metaDescription')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Meta description must not exceed 500 characters'),

  body('metaKeywords')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Meta keywords must not exceed 500 characters'),
];

export const updateProductValidation = [
  body('name')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Product name must be between 2 and 200 characters'),

  body('slug')
    .optional({ values: 'falsy' })
    .trim()
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug must contain only lowercase letters, numbers, and hyphens'),

  body('sku')
    .optional({ values: 'falsy' })
    .trim()
    .matches(/^[A-Z0-9-]+$/i)
    .withMessage('SKU must contain only letters, numbers, and hyphens'),

  body('description')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Description must not exceed 5000 characters'),

  body('shortDescription')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Short description must not exceed 500 characters'),

  body('categoryId')
    .optional({ values: 'falsy' })
    .matches(REGEX.UUID)
    .withMessage('Invalid category ID format'),

  body('price')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),

  body('salePrice')
    .optional({ values: 'falsy' })
    .custom((value) => value === null || (typeof value === 'number' && value >= 0))
    .withMessage('Compare at price must be a positive number or null'),

  body('costPrice')
    .optional({ values: 'falsy' })
    .custom((value) => value === null || (typeof value === 'number' && value >= 0))
    .withMessage('Cost price must be a positive number or null'),

  body('trackInventory')
    .optional({ values: 'falsy' })
    .isBoolean()
    .withMessage('trackInventory must be a boolean'),

  body('stockQuantity')
    .optional({ values: 'falsy' })
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer'),

  body('lowStockThreshold')
    .optional({ values: 'falsy' })
    .custom((value) => value === null || (typeof value === 'number' && value >= 0))
    .withMessage('Low stock threshold must be a non-negative integer or null'),

  body('attributes')
    .optional({ values: 'falsy' })
    .custom((value) => {
      if (value === null || value === undefined) return true;
      if (!Array.isArray(value)) throw new Error('Attributes must be an array');
      if (
        !value.every(
          (attr) =>
            typeof attr === 'object' &&
            attr !== null &&
            typeof attr.key === 'string' &&
            attr.key.length > 0 &&
            (attr.label === undefined || typeof attr.label === 'string') &&
            attr.value !== undefined
        )
      ) {
        throw new Error('Each attribute must have {key: string, label?: string, value: any}');
      }
      return true;
    })
    .withMessage('Attributes must be array of {key, label?, value} or null'),

  body('images').optional({ values: 'falsy' }).isArray().withMessage('Images must be an array'),

  body('images.*')
    .optional({ values: 'falsy' })
    .isURL()
    .withMessage('Each image must be a valid URL'),

  body('featuredImage')
    .optional({ values: 'falsy' })
    .custom((value) => value === null || /^https?:\/\/.+/.test(value))
    .withMessage('Featured image must be a valid URL or null'),

  body('isActive')
    .optional({ values: 'falsy' })
    .isBoolean()
    .withMessage('isActive must be a boolean'),

  body('isFeatured')
    .optional({ values: 'falsy' })
    .isBoolean()
    .withMessage('isFeatured must be a boolean'),

  body('metaTitle')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 200 })
    .withMessage('Meta title must not exceed 200 characters'),

  body('metaDescription')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Meta description must not exceed 500 characters'),

  body('metaKeywords')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Meta keywords must not exceed 500 characters'),
];

export const productListValidation = [
  query('page')
    .optional({ values: 'falsy' })
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('pageSize')
    .optional({ values: 'falsy' })
    .isInt({ min: 1, max: 100 })
    .withMessage('Page size must be between 1 and 100'),

  query('search')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),

  query('categoryId')
    .optional({ values: 'falsy' })
    .matches(REGEX.UUID)
    .withMessage('Invalid category ID format'),

  query('isActive')
    .optional({ values: 'falsy' })
    .isBoolean()
    .withMessage('isActive must be a boolean'),

  query('isFeatured')
    .optional({ values: 'falsy' })
    .isBoolean()
    .withMessage('isFeatured must be a boolean'),

  query('minPrice')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0 })
    .withMessage('Min price must be a positive number'),

  query('maxPrice')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0 })
    .withMessage('Max price must be a positive number'),

  query('inStock')
    .optional({ values: 'falsy' })
    .isBoolean()
    .withMessage('inStock must be a boolean'),

  query('status')
    .optional({ values: 'falsy' })
    .isIn(['DRAFT', 'PUBLISHED', 'ARCHIVED', 'OUT_OF_STOCK'])
    .withMessage('status must be one of: DRAFT, PUBLISHED, ARCHIVED, OUT_OF_STOCK'),

  query('sortBy')
    .optional({ values: 'falsy' })
    .isIn(['name', 'basePrice', 'createdAt', 'stock'])
    .withMessage('sortBy must be one of: name, basePrice, createdAt, stock'),

  query('sortOrder')
    .optional({ values: 'falsy' })
    .isIn(['asc', 'desc'])
    .withMessage('sortOrder must be either asc or desc'),
];
