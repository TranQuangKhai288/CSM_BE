import { Router } from 'express';
import categoriesController from './categories.controller';
import { validate } from '@middleware/validation.middleware';
import { authGuard } from '@common/guards/auth.guard';
import { permissionGuard } from '@common/guards/permission.guard';
import {
  createCategoryValidation,
  updateCategoryValidation,
  categoryListValidation,
} from './dto/categories.validation';
import { PERMISSIONS } from '@common/constants';

const router = Router();

// All routes require authentication
router.use(authGuard);

// Get category tree (no permission check - anyone can view)
router.get('/tree', categoriesController.getCategoryTree);

// Get all categories
router.get(
  '/',
  permissionGuard([PERMISSIONS.CATEGORIES_READ]),
  validate(categoryListValidation),
  categoriesController.getCategories
);

// Get category by slug
router.get(
  '/slug/:slug',
  permissionGuard([PERMISSIONS.CATEGORIES_READ]),
  categoriesController.getCategoryBySlug
);

// Get category by ID
router.get(
  '/:id',
  permissionGuard([PERMISSIONS.CATEGORIES_READ]),
  categoriesController.getCategoryById
);

// Create new category
router.post(
  '/',
  permissionGuard([PERMISSIONS.CATEGORIES_CREATE]),
  validate(createCategoryValidation),
  categoriesController.createCategory
);

// Update category
router.put(
  '/:id',
  permissionGuard([PERMISSIONS.CATEGORIES_UPDATE]),
  validate(updateCategoryValidation),
  categoriesController.updateCategory
);

// Delete category
router.delete(
  '/:id',
  permissionGuard([PERMISSIONS.CATEGORIES_DELETE]),
  categoriesController.deleteCategory
);

export default router;
