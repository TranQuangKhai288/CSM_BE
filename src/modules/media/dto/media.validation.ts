import { body, query } from 'express-validator';

export const createMediaValidation = [
  body('filename').notEmpty().withMessage('Filename is required'),
  body('url').notEmpty().withMessage('URL is required').isURL().withMessage('Invalid URL format'),
  body('mimeType').notEmpty().withMessage('MIME type is required'),
  body('size')
    .notEmpty()
    .withMessage('Size is required')
    .isInt({ min: 1 })
    .withMessage('Size must be a positive integer'),
  body('width').optional().isInt({ min: 1 }).withMessage('Width must be a positive integer'),
  body('height').optional().isInt({ min: 1 }).withMessage('Height must be a positive integer'),
  body('alt')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Alt text must not exceed 255 characters'),
  body('title')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Title must not exceed 255 characters'),
  body('metadata').optional().isObject().withMessage('Metadata must be an object'),
];

export const updateMediaValidation = [
  body('filename').optional().notEmpty().withMessage('Filename cannot be empty'),
  body('alt')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Alt text must not exceed 255 characters'),
  body('title')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Title must not exceed 255 characters'),
  body('metadata').optional().isObject().withMessage('Metadata must be an object'),
];

export const mediaListValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Page size must be between 1 and 100'),
  query('search')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Search must not exceed 255 characters'),
  query('mimeType').optional().isString().withMessage('MIME type must be a string'),
  query('sortBy')
    .optional()
    .isIn(['filename', 'size', 'createdAt'])
    .withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
  query('minSize').optional().isInt({ min: 1 }).withMessage('Min size must be a positive integer'),
  query('maxSize').optional().isInt({ min: 1 }).withMessage('Max size must be a positive integer'),
];

export const uploadFileValidation = [
  body('alt')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Alt text must not exceed 255 characters'),
  body('title')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Title must not exceed 255 characters'),
  body('folder')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Folder must not exceed 100 characters'),
];
