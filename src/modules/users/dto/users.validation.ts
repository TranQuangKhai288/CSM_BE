import { body, query } from 'express-validator';
import { REGEX } from '@common/constants';

export const createUserValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),

  body('password')
    .matches(REGEX.PASSWORD)
    .withMessage(
      'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),

  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),

  body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),

  body('roleId')
    .notEmpty()
    .withMessage('Role ID is required')
    .matches(REGEX.UUID)
    .withMessage('Invalid role ID format'),

  body('phone').optional({ values: 'falsy' }).matches(REGEX.PHONE).withMessage('Invalid phone number format'),

  body('avatar').optional({ values: 'falsy' }).isURL().withMessage('Avatar must be a valid URL'),
];

export const updateUserValidation = [
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('Valid email is required').normalizeEmail(),

  body('firstName')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),

  body('lastName')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),

  body('roleId').optional({ values: 'falsy' }).matches(REGEX.UUID).withMessage('Invalid role ID format'),

  body('phone').optional({ values: 'falsy' }).matches(REGEX.PHONE).withMessage('Invalid phone number format'),

  body('avatar').optional({ values: 'falsy' }).isURL().withMessage('Avatar must be a valid URL'),

  body('isActive').optional({ values: 'falsy' }).isBoolean().withMessage('isActive must be a boolean'),
];

export const updateUserPasswordValidation = [
  body('newPassword')
    .matches(REGEX.PASSWORD)
    .withMessage(
      'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
];

export const userListValidation = [
  query('page').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('pageSize')
    .optional({ values: 'falsy' })
    .isInt({ min: 1, max: 100 })
    .withMessage('Page size must be between 1 and 100'),

  query('search')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term must not exceed 100 characters'),

  query('roleId').optional({ values: 'falsy' }).matches(REGEX.UUID).withMessage('Invalid role ID format'),

  query('isActive').optional({ values: 'falsy' }).isBoolean().withMessage('isActive must be a boolean'),

  query('sortBy')
    .optional({ values: 'falsy' })
    .isIn(['createdAt', 'email', 'firstName'])
    .withMessage('sortBy must be one of: createdAt, email, firstName'),

  query('sortOrder')
    .optional({ values: 'falsy' })
    .isIn(['asc', 'desc'])
    .withMessage('sortOrder must be either asc or desc'),
];
