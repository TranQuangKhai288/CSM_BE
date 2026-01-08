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

  body('phone').optional().matches(REGEX.PHONE).withMessage('Invalid phone number format'),

  body('avatar').optional().isURL().withMessage('Avatar must be a valid URL'),
];

export const updateUserValidation = [
  body('email').optional().isEmail().withMessage('Valid email is required').normalizeEmail(),

  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),

  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),

  body('roleId').optional().matches(REGEX.UUID).withMessage('Invalid role ID format'),

  body('phone').optional().matches(REGEX.PHONE).withMessage('Invalid phone number format'),

  body('avatar').optional().isURL().withMessage('Avatar must be a valid URL'),

  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

export const updateUserPasswordValidation = [
  body('newPassword')
    .matches(REGEX.PASSWORD)
    .withMessage(
      'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
];

export const userListValidation = [
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

  query('roleId').optional().matches(REGEX.UUID).withMessage('Invalid role ID format'),

  query('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),

  query('sortBy')
    .optional()
    .isIn(['createdAt', 'email', 'firstName'])
    .withMessage('sortBy must be one of: createdAt, email, firstName'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('sortOrder must be either asc or desc'),
];
