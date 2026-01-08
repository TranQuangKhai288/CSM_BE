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

  body('note').optional().trim().isLength({ max: 500 }).withMessage('Note is too long'),
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

  body('note').optional().trim().isLength({ max: 500 }).withMessage('Note is too long'),
];

export const inventoryListValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Page size must be between 1 and 100'),

  query('productId').optional().trim().matches(REGEX.UUID).withMessage('Invalid product ID format'),

  query('type')
    .optional()
    .trim()
    .isIn(['PURCHASE', 'SALE', 'RETURN', 'ADJUSTMENT', 'DAMAGE'])
    .withMessage('Invalid inventory type'),

  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),

  query('endDate').optional().isISO8601().withMessage('Invalid end date format'),

  query('sortBy')
    .optional()
    .trim()
    .isIn(['createdAt', 'quantity'])
    .withMessage('Invalid sort field'),

  query('sortOrder').optional().trim().isIn(['asc', 'desc']).withMessage('Invalid sort order'),
];

export const lowStockValidation = [
  query('threshold')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Threshold must be a non-negative integer'),

  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Page size must be between 1 and 100'),
];
