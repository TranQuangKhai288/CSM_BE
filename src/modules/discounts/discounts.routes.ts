import { Router } from 'express';
import discountsController from './discounts.controller';
import { authGuard } from '@common/guards/auth.guard';
import { permissionGuard } from '@common/guards/permission.guard';
import { validate } from '@middleware/validation.middleware';
import {
  createDiscountValidation,
  updateDiscountValidation,
  discountListValidation,
  validateDiscountValidation,
} from './dto/discounts.validation';

const router = Router();

// Public routes (no auth required)
export const publicDiscountsRouter = Router();

// Validate discount code
publicDiscountsRouter.post(
  '/validate',
  validate(validateDiscountValidation),
  discountsController.validateDiscount
);

// Get active discounts
publicDiscountsRouter.get('/active', discountsController.getActiveDiscounts);

// Get discount by code
publicDiscountsRouter.get('/code/:code', discountsController.getDiscountByCode);

// Admin routes (require authentication and permissions)
router.use(authGuard);

// Get discount statistics
router.get('/stats', permissionGuard(['discounts.view']), discountsController.getStats);

// Get all discounts
router.get(
  '/',
  permissionGuard(['discounts.view']),
  validate(discountListValidation),
  discountsController.getDiscounts
);

// Get discount by ID
router.get('/:id', permissionGuard(['discounts.view']), discountsController.getDiscountById);

// Create discount
router.post(
  '/',
  permissionGuard(['discounts.create']),
  validate(createDiscountValidation),
  discountsController.createDiscount
);

// Update discount
router.put(
  '/:id',
  permissionGuard(['discounts.update']),
  validate(updateDiscountValidation),
  discountsController.updateDiscount
);

// Delete discount
router.delete('/:id', permissionGuard(['discounts.delete']), discountsController.deleteDiscount);

export default router;
