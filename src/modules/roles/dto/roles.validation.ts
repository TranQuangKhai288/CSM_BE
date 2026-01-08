import { body, query } from 'express-validator';
import { REGEX } from '@common/constants';

export const createRoleValidation = [
  body('name')
    .notEmpty()
    .withMessage('Role name is required')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Role name must be between 2 and 50 characters'),

  body('slug')
    .notEmpty()
    .withMessage('Role slug is required')
    .trim()
    .matches(REGEX.SLUG)
    .withMessage('Slug must be lowercase, alphanumeric with hyphens only'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Description must not exceed 255 characters'),

  body('permissions')
    .isArray({ min: 0 })
    .withMessage('Permissions must be an array')
    .custom((permissions) => {
      if (!Array.isArray(permissions)) return false;
      return permissions.every((p) => typeof p === 'string' && p.length > 0);
    })
    .withMessage('Each permission must be a non-empty string'),
];

export const updateRoleValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Role name must be between 2 and 50 characters'),

  body('slug')
    .optional()
    .trim()
    .matches(REGEX.SLUG)
    .withMessage('Slug must be lowercase, alphanumeric with hyphens only'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Description must not exceed 255 characters'),

  body('permissions')
    .optional()
    .isArray()
    .withMessage('Permissions must be an array')
    .custom((permissions) => {
      if (!Array.isArray(permissions)) return false;
      return permissions.every((p) => typeof p === 'string' && p.length > 0);
    })
    .withMessage('Each permission must be a non-empty string'),

  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

export const roleListValidation = [
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

  query('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];
