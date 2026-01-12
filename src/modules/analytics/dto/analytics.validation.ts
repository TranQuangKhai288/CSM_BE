import { body, query } from 'express-validator';

export const createAnalyticsValidation = [
  body('type')
    .notEmpty()
    .withMessage('Type is required')
    .isIn(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'REALTIME'])
    .withMessage('Invalid analytics type'),
  body('category').notEmpty().withMessage('Category is required'),
  body('metric').notEmpty().withMessage('Metric is required'),
  body('value')
    .notEmpty()
    .withMessage('Value is required')
    .isNumeric()
    .withMessage('Value must be a number'),
  body('metadata').optional({ values: 'falsy' }).isObject().withMessage('Metadata must be an object'),
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Date must be a valid date'),
];

export const updateAnalyticsValidation = [
  body('value').optional({ values: 'falsy' }).isNumeric().withMessage('Value must be a number'),
  body('metadata').optional({ values: 'falsy' }).isObject().withMessage('Metadata must be an object'),
];

export const analyticsQueryValidation = [
  query('type')
    .optional({ values: 'falsy' })
    .isIn(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'REALTIME'])
    .withMessage('Invalid analytics type'),
  query('category').optional({ values: 'falsy' }).isString().withMessage('Category must be a string'),
  query('metric').optional({ values: 'falsy' }).isString().withMessage('Metric must be a string'),
  query('startDate').optional({ values: 'falsy' }).isISO8601().withMessage('Start date must be a valid date'),
  query('endDate').optional({ values: 'falsy' }).isISO8601().withMessage('End date must be a valid date'),
  query('page').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('pageSize')
    .optional({ values: 'falsy' })
    .isInt({ min: 1, max: 100 })
    .withMessage('Page size must be between 1 and 100'),
];

export const salesAnalyticsValidation = [
  query('startDate').optional({ values: 'falsy' }).isISO8601().withMessage('Start date must be a valid date'),
  query('endDate').optional({ values: 'falsy' }).isISO8601().withMessage('End date must be a valid date'),
  query('groupBy')
    .optional({ values: 'falsy' })
    .isIn(['day', 'week', 'month', 'year'])
    .withMessage('Invalid group by value'),
];

export const productAnalyticsValidation = [
  query('startDate').optional({ values: 'falsy' }).isISO8601().withMessage('Start date must be a valid date'),
  query('endDate').optional({ values: 'falsy' }).isISO8601().withMessage('End date must be a valid date'),
  query('limit')
    .optional({ values: 'falsy' })
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

export const customerAnalyticsValidation = [
  query('startDate').optional({ values: 'falsy' }).isISO8601().withMessage('Start date must be a valid date'),
  query('endDate').optional({ values: 'falsy' }).isISO8601().withMessage('End date must be a valid date'),
];

export const pageViewValidation = [
  body('path').notEmpty().withMessage('Path is required'),
  body('referrer').optional({ values: 'falsy' }).isString().withMessage('Referrer must be a string'),
  body('userAgent').optional({ values: 'falsy' }).isString().withMessage('User agent must be a string'),
  body('ipAddress').optional({ values: 'falsy' }).isIP().withMessage('Invalid IP address'),
  body('sessionId').optional({ values: 'falsy' }).isString().withMessage('Session ID must be a string'),
  body('userId').optional({ values: 'falsy' }).isString().withMessage('User ID must be a string'),
  body('duration')
    .optional({ values: 'falsy' })
    .isInt({ min: 0 })
    .withMessage('Duration must be a non-negative integer'),
  body('metadata').optional({ values: 'falsy' }).isObject().withMessage('Metadata must be an object'),
];

export const dashboardStatsValidation = [
  query('startDate').optional({ values: 'falsy' }).isISO8601().withMessage('Start date must be a valid date'),
  query('endDate').optional({ values: 'falsy' }).isISO8601().withMessage('End date must be a valid date'),
];
