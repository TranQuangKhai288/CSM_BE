import { body, query } from 'express-validator';

const REGEX = {
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
};

export const createInventoryLogValidation = [
  body('productId')
    .trim()
    .notEmpty()
    .withMessage('Product ID is required')
    .matches(REGEX.UUID)
    .withMessage('Invalid product ID format'),

  body('type')
    .trim()
    .notEmpty()
    .withMessage('Type is required')
    .isIn(['PURCHASE', 'SALE', 'RETURN', 'ADJUSTMENT', 'DAMAGE'])
    .withMessage('Invalid inventory type'),

  body('quantity')
    .isInt()
    .withMessage('Quantity must be an integer')
    .notEmpty()
    .withMessage('Quantity is required'),

  body('note').optional({ values: 'falsy' }).trim().isLength({ max: 500 }).withMessage('Note is too long'),
];

export const adjustStockValidation = [
  body('productId')
    .trim()
    .notEmpty()
    .withMessage('Product ID is required')
    .matches(REGEX.UUID)
    .withMessage('Invalid product ID format'),

  body('quantity')
    .isInt()
    .withMessage('Quantity must be an integer')
    .notEmpty()
    .withMessage('Quantity is required'),

  body('type')
    .trim()
    .notEmpty()
    .withMessage('Type is required')
    .isIn(['ADJUSTMENT', 'DAMAGE'])
    .withMessage('Invalid adjustment type'),

  body('note').optional({ values: 'falsy' }).trim().isLength({ max: 500 }).withMessage('Note is too long'),
];

export const inventoryListValidation = [
  query('page').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('pageSize')
    .optional({ values: 'falsy' })
    .isInt({ min: 1, max: 100 })
    .withMessage('Page size must be between 1 and 100'),

  query('productId').optional({ values: 'falsy' }).trim().matches(REGEX.UUID).withMessage('Invalid product ID format'),

  query('type')
    .optional({ values: 'falsy' })
    .trim()
    .isIn(['PURCHASE', 'SALE', 'RETURN', 'ADJUSTMENT', 'DAMAGE'])
    .withMessage('Invalid inventory type'),

  query('startDate').optional({ values: 'falsy' }).isISO8601().withMessage('Invalid start date format'),

  query('endDate').optional({ values: 'falsy' }).isISO8601().withMessage('Invalid end date format'),

  query('sortBy')
    .optional({ values: 'falsy' })
    .trim()
    .isIn(['createdAt', 'quantity'])
    .withMessage('Invalid sort field'),

  query('sortOrder').optional({ values: 'falsy' }).trim().isIn(['asc', 'desc']).withMessage('Invalid sort order'),
];

export const lowStockValidation = [
  query('threshold')
    .optional({ values: 'falsy' })
    .isInt({ min: 0 })
    .withMessage('Threshold must be a non-negative integer'),

  query('page').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('pageSize')
    .optional({ values: 'falsy' })
    .isInt({ min: 1, max: 100 })
    .withMessage('Page size must be between 1 and 100'),
];
