import { body, query } from 'express-validator';

export const createDiscountValidation = [
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Code is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Code must be between 3 and 50 characters')
    .matches(/^[A-Z0-9_-]+$/)
    .withMessage('Code must contain only uppercase letters, numbers, underscores, and hyphens'),

  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Name must be between 3 and 200 characters'),

  body('description')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description is too long'),

  body('type')
    .trim()
    .notEmpty()
    .withMessage('Type is required')
    .isIn(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING'])
    .withMessage('Invalid discount type'),

  body('value')
    .isFloat({ min: 0 })
    .withMessage('Value must be a non-negative number')
    .notEmpty()
    .withMessage('Value is required'),

  body('minOrderValue')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0 })
    .withMessage('Minimum order value must be non-negative'),

  body('maxDiscount')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0 })
    .withMessage('Maximum discount must be non-negative'),

  body('usageLimit')
    .optional({ values: 'falsy' })
    .isInt({ min: 1 })
    .withMessage('Usage limit must be a positive integer'),

  body('startDate').isISO8601().withMessage('Invalid start date format'),

  body('endDate').isISO8601().withMessage('Invalid end date format'),

  body('isActive').optional({ values: 'falsy' }).isBoolean().withMessage('isActive must be a boolean'),
];

export const updateDiscountValidation = [
  body('name')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Name must be between 3 and 200 characters'),

  body('description')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description is too long'),

  body('value').optional({ values: 'falsy' }).isFloat({ min: 0 }).withMessage('Value must be a non-negative number'),

  body('minOrderValue')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0 })
    .withMessage('Minimum order value must be non-negative'),

  body('maxDiscount')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0 })
    .withMessage('Maximum discount must be non-negative'),

  body('usageLimit')
    .optional({ values: 'falsy' })
    .isInt({ min: 1 })
    .withMessage('Usage limit must be a positive integer'),

  body('startDate').optional({ values: 'falsy' }).isISO8601().withMessage('Invalid start date format'),

  body('endDate').optional({ values: 'falsy' }).isISO8601().withMessage('Invalid end date format'),

  body('isActive').optional({ values: 'falsy' }).isBoolean().withMessage('isActive must be a boolean'),
];

export const discountListValidation = [
  query('page').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('pageSize')
    .optional({ values: 'falsy' })
    .isInt({ min: 1, max: 100 })
    .withMessage('Page size must be between 1 and 100'),

  query('search').optional({ values: 'falsy' }).trim().isLength({ max: 200 }).withMessage('Search is too long'),

  query('type')
    .optional({ values: 'falsy' })
    .trim()
    .isIn(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING'])
    .withMessage('Invalid discount type'),

  query('isActive').optional({ values: 'falsy' }).isBoolean().withMessage('isActive must be a boolean'),

  query('sortBy')
    .optional({ values: 'falsy' })
    .trim()
    .isIn(['code', 'value', 'usageCount', 'createdAt'])
    .withMessage('Invalid sort field'),

  query('sortOrder').optional({ values: 'falsy' }).trim().isIn(['asc', 'desc']).withMessage('Invalid sort order'),
];

export const validateDiscountValidation = [
  body('code').trim().notEmpty().withMessage('Code is required'),

  body('orderTotal')
    .isFloat({ min: 0 })
    .withMessage('Order total must be non-negative')
    .notEmpty()
    .withMessage('Order total is required'),
];
