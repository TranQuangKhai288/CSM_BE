import { body, query } from 'express-validator';

const REGEX = {
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[\d\s\-\+\(\)]+$/,
};

export const createCustomerValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),

  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),

  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),

  body('phone').optional({ values: 'falsy' }).trim().matches(REGEX.PHONE).withMessage('Invalid phone number format'),

  body('avatar').optional({ values: 'falsy' }).isURL().withMessage('Avatar must be a valid URL'),

  body('addresses').optional({ values: 'falsy' }).isArray().withMessage('Addresses must be an array'),

  body('addresses.*.type')
    .optional({ values: 'falsy' })
    .isIn(['shipping', 'billing'])
    .withMessage('Address type must be either shipping or billing'),

  body('addresses.*.firstName')
    .optional({ values: 'falsy' })
    .trim()
    .notEmpty()
    .withMessage('Address first name is required'),

  body('addresses.*.lastName')
    .optional({ values: 'falsy' })
    .trim()
    .notEmpty()
    .withMessage('Address last name is required'),

  body('addresses.*.address1')
    .optional({ values: 'falsy' })
    .trim()
    .notEmpty()
    .withMessage('Address line 1 is required'),

  body('addresses.*.city').optional({ values: 'falsy' }).trim().notEmpty().withMessage('City is required'),

  body('addresses.*.postalCode')
    .optional({ values: 'falsy' })
    .trim()
    .notEmpty()
    .withMessage('Postal code is required'),

  body('addresses.*.country').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Country is required'),

  body('isActive').optional({ values: 'falsy' }).isBoolean().withMessage('isActive must be a boolean'),
];

export const updateCustomerValidation = [
  body('email').optional({ values: 'falsy' }).trim().isEmail().withMessage('Invalid email format').normalizeEmail(),

  body('firstName')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),

  body('lastName')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),

  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .custom((value) => value === null || REGEX.PHONE.test(value))
    .withMessage('Invalid phone number format'),

  body('avatar')
    .optional({ values: 'falsy' })
    .custom((value) => value === null || /^https?:\/\/.+/.test(value))
    .withMessage('Avatar must be a valid URL or null'),

  body('addresses').optional({ values: 'falsy' }).isArray().withMessage('Addresses must be an array'),

  body('addresses.*.type')
    .optional({ values: 'falsy' })
    .isIn(['shipping', 'billing'])
    .withMessage('Address type must be either shipping or billing'),

  body('addresses.*.firstName')
    .optional({ values: 'falsy' })
    .trim()
    .notEmpty()
    .withMessage('Address first name is required'),

  body('addresses.*.lastName')
    .optional({ values: 'falsy' })
    .trim()
    .notEmpty()
    .withMessage('Address last name is required'),

  body('addresses.*.address1')
    .optional({ values: 'falsy' })
    .trim()
    .notEmpty()
    .withMessage('Address line 1 is required'),

  body('addresses.*.city').optional({ values: 'falsy' }).trim().notEmpty().withMessage('City is required'),

  body('addresses.*.postalCode')
    .optional({ values: 'falsy' })
    .trim()
    .notEmpty()
    .withMessage('Postal code is required'),

  body('addresses.*.country').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Country is required'),

  body('isActive').optional({ values: 'falsy' }).isBoolean().withMessage('isActive must be a boolean'),
];

export const customerListValidation = [
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

  query('isActive').optional({ values: 'falsy' }).isBoolean().withMessage('isActive must be a boolean'),

  query('minSpent')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0 })
    .withMessage('Min spent must be a positive number'),

  query('maxSpent')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0 })
    .withMessage('Max spent must be a positive number'),

  query('minOrders')
    .optional({ values: 'falsy' })
    .isInt({ min: 0 })
    .withMessage('Min orders must be a non-negative integer'),

  query('hasOrders').optional({ values: 'falsy' }).isBoolean().withMessage('hasOrders must be a boolean'),

  query('sortBy')
    .optional({ values: 'falsy' })
    .isIn(['firstName', 'lastName', 'email', 'totalSpent', 'totalOrders', 'createdAt'])
    .withMessage(
      'sortBy must be one of: firstName, lastName, email, totalSpent, totalOrders, createdAt'
    ),

  query('sortOrder')
    .optional({ values: 'falsy' })
    .isIn(['asc', 'desc'])
    .withMessage('sortOrder must be either asc or desc'),
];
