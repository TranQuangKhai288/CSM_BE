import { Router } from 'express';
import productsController from './products.controller';
import { validate } from '@middleware/validation.middleware';
import { authGuard } from '@common/guards/auth.guard';
import { permissionGuard } from '@common/guards/permission.guard';
import {
  createProductValidation,
  updateProductValidation,
  productListValidation,
} from './dto/products.validation';
import { PERMISSIONS } from '@common/constants';

const router = Router();

// All routes require authentication
router.use(authGuard);

// Get product statistics
router.get(
  '/stats',
  permissionGuard([PERMISSIONS.PRODUCTS_READ]),
  productsController.getProductStats
);

// Get all products
router.get(
  '/',
  permissionGuard([PERMISSIONS.PRODUCTS_READ]),
  validate(productListValidation),
  productsController.getProducts
);

// Get product by slug
router.get(
  '/slug/:slug',
  permissionGuard([PERMISSIONS.PRODUCTS_READ]),
  productsController.getProductBySlug
);

// Get product by SKU
router.get(
  '/sku/:sku',
  permissionGuard([PERMISSIONS.PRODUCTS_READ]),
  productsController.getProductBySKU
);

// Get product by ID
router.get('/:id', permissionGuard([PERMISSIONS.PRODUCTS_READ]), productsController.getProductById);

// Create new product
router.post(
  '/',
  permissionGuard([PERMISSIONS.PRODUCTS_CREATE]),
  validate(createProductValidation),
  productsController.createProduct
);

// Update product
router.put(
  '/:id',
  permissionGuard([PERMISSIONS.PRODUCTS_UPDATE]),
  validate(updateProductValidation),
  productsController.updateProduct
);

// Delete product
router.delete(
  '/:id',
  permissionGuard([PERMISSIONS.PRODUCTS_DELETE]),
  productsController.deleteProduct
);

export default router;
