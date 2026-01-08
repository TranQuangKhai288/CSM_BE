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
  body('metadata').optional().isObject().withMessage('Metadata must be an object'),
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Date must be a valid date'),
];

export const updateAnalyticsValidation = [
  body('value').optional().isNumeric().withMessage('Value must be a number'),
  body('metadata').optional().isObject().withMessage('Metadata must be an object'),
];

export const analyticsQueryValidation = [
  query('type')
    .optional()
    .isIn(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'REALTIME'])
    .withMessage('Invalid analytics type'),
  query('category').optional().isString().withMessage('Category must be a string'),
  query('metric').optional().isString().withMessage('Metric must be a string'),
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Page size must be between 1 and 100'),
];

export const salesAnalyticsValidation = [
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
  query('groupBy')
    .optional()
    .isIn(['day', 'week', 'month', 'year'])
    .withMessage('Invalid group by value'),
];

export const productAnalyticsValidation = [
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

export const customerAnalyticsValidation = [
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
];

export const pageViewValidation = [
  body('path').notEmpty().withMessage('Path is required'),
  body('referrer').optional().isString().withMessage('Referrer must be a string'),
  body('userAgent').optional().isString().withMessage('User agent must be a string'),
  body('ipAddress').optional().isIP().withMessage('Invalid IP address'),
  body('sessionId').optional().isString().withMessage('Session ID must be a string'),
  body('userId').optional().isString().withMessage('User ID must be a string'),
  body('duration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Duration must be a non-negative integer'),
  body('metadata').optional().isObject().withMessage('Metadata must be an object'),
];

export const dashboardStatsValidation = [
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
];
