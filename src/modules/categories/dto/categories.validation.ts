import { body, query } from 'express-validator';
import { REGEX } from '@common/constants';

export const createCategoryValidation = [
  body('name')
    .notEmpty()
    .withMessage('Category name is required')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters'),

  body('slug')
    .optional({ values: 'falsy' })
    .trim()
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug must contain only lowercase letters, numbers, and hyphens'),

  body('description')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),

  body('parentId')
    .optional({ values: 'falsy' })
    .custom((value) => value === null || REGEX.UUID.test(value))
    .withMessage('Invalid parent category ID format'),

  body('image').optional({ values: 'falsy' }).isURL().withMessage('Image must be a valid URL'),

  body('isActive').optional({ values: 'falsy' }).isBoolean().withMessage('isActive must be a boolean'),

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

export const updateCategoryValidation = [
  body('name')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters'),

  body('slug')
    .optional({ values: 'falsy' })
    .trim()
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug must contain only lowercase letters, numbers, and hyphens'),

  body('description')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),

  body('parentId')
    .optional({ values: 'falsy' })
    .custom((value) => value === null || REGEX.UUID.test(value))
    .withMessage('Invalid parent category ID format'),

  body('image')
    .optional({ values: 'falsy' })
    .custom((value) => value === null || /^https?:\/\/.+/.test(value))
    .withMessage('Image must be a valid URL or null'),

  body('isActive').optional({ values: 'falsy' }).isBoolean().withMessage('isActive must be a boolean'),

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

export const categoryListValidation = [
  query('page').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('pageSize')
    .optional({ values: 'falsy' })
    .isInt({ min: 1, max: 100 })
    .withMessage('Page size must be between 1 and 100'),

  query('search')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),

  query('parentId')
    .optional({ values: 'falsy' })
    .custom((value) => value === 'null' || REGEX.UUID.test(value))
    .withMessage('Invalid parent category ID format'),

  query('isActive').optional({ values: 'falsy' }).isBoolean().withMessage('isActive must be a boolean'),

  query('sortBy')
    .optional({ values: 'falsy' })
    .isIn(['name', 'createdAt', 'updatedAt'])
    .withMessage('sortBy must be one of: name, createdAt, updatedAt'),

  query('sortOrder')
    .optional({ values: 'falsy' })
    .isIn(['asc', 'desc'])
    .withMessage('sortOrder must be either asc or desc'),
];
