import { body, query } from 'express-validator';

const REGEX = {
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  PHONE: /^[\d\s\-\+\(\)]+$/,
  POSTAL_CODE: /^[A-Za-z0-9\s\-]+$/,
};

export const createOrderValidation = [
  body('customerId')
    .trim()
    .notEmpty()
    .withMessage('Customer ID is required')
    .matches(REGEX.UUID)
    .withMessage('Invalid customer ID format'),

  body('items').isArray({ min: 1 }).withMessage('Order must have at least one item'),

  body('items.*.productId')
    .trim()
    .notEmpty()
    .withMessage('Product ID is required')
    .matches(REGEX.UUID)
    .withMessage('Invalid product ID format'),

  body('items.*.variantId')
    .optional()
    .trim()
    .matches(REGEX.UUID)
    .withMessage('Invalid variant ID format'),

  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),

  body('shippingAddress')
    .notEmpty()
    .withMessage('Shipping address is required')
    .isObject()
    .withMessage('Shipping address must be an object'),

  body('shippingAddress.firstName')
    .trim()
    .notEmpty()
    .withMessage('Shipping first name is required'),

  body('shippingAddress.lastName').trim().notEmpty().withMessage('Shipping last name is required'),

  body('shippingAddress.address1')
    .trim()
    .notEmpty()
    .withMessage('Shipping address line 1 is required'),

  body('shippingAddress.city').trim().notEmpty().withMessage('Shipping city is required'),

  body('shippingAddress.postalCode')
    .trim()
    .notEmpty()
    .withMessage('Shipping postal code is required')
    .matches(REGEX.POSTAL_CODE)
    .withMessage('Invalid postal code format'),

  body('shippingAddress.country').trim().notEmpty().withMessage('Shipping country is required'),

  body('shippingAddress.phone')
    .optional()
    .trim()
    .matches(REGEX.PHONE)
    .withMessage('Invalid phone number format'),

  body('billingAddress').optional().isObject().withMessage('Billing address must be an object'),

  body('billingAddress.firstName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Billing first name is required'),

  body('billingAddress.lastName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Billing last name is required'),

  body('billingAddress.address1')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Billing address line 1 is required'),

  body('billingAddress.city').optional().trim().notEmpty().withMessage('Billing city is required'),

  body('billingAddress.postalCode')
    .optional()
    .trim()
    .matches(REGEX.POSTAL_CODE)
    .withMessage('Invalid postal code format'),

  body('billingAddress.country')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Billing country is required'),

  body('paymentMethod')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Payment method must be between 1 and 50 characters'),

  body('discount').optional().isFloat({ min: 0 }).withMessage('Discount must be a positive number'),

  body('tax').optional().isFloat({ min: 0 }).withMessage('Tax must be a positive number'),

  body('shipping')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Shipping cost must be a positive number'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),

  body('metadata').optional().isObject().withMessage('Metadata must be a valid JSON object'),
];

export const updateOrderValidation = [
  body('status')
    .optional()
    .isIn(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'])
    .withMessage('Invalid order status'),

  body('paymentStatus')
    .optional()
    .isIn(['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'])
    .withMessage('Invalid payment status'),

  body('paymentMethod')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Payment method must be between 1 and 50 characters'),

  body('trackingNumber')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Tracking number must be between 1 and 100 characters'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),

  body('metadata').optional().isObject().withMessage('Metadata must be a valid JSON object'),
];

export const updateOrderStatusValidation = [
  body('status')
    .trim()
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'])
    .withMessage('Invalid order status'),

  body('note')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Note must not exceed 500 characters'),
];

export const orderListValidation = [
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

  query('customerId').optional().matches(REGEX.UUID).withMessage('Invalid customer ID format'),

  query('status')
    .optional()
    .isIn(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'])
    .withMessage('Invalid order status'),

  query('paymentStatus')
    .optional()
    .isIn(['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'])
    .withMessage('Invalid payment status'),

  query('minTotal')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Min total must be a positive number'),

  query('maxTotal')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Max total must be a positive number'),

  query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO 8601 date'),

  query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO 8601 date'),

  query('sortBy')
    .optional()
    .isIn(['orderNumber', 'total', 'createdAt', 'completedAt'])
    .withMessage('sortBy must be one of: orderNumber, total, createdAt, completedAt'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('sortOrder must be either asc or desc'),
];
