import { Router } from 'express';
import inventoryController from './inventory.controller';
import { authGuard } from '@common/guards/auth.guard';
import { permissionGuard } from '@common/guards/permission.guard';
import { validate } from '@middleware/validation.middleware';
import {
  createInventoryLogValidation,
  adjustStockValidation,
  inventoryListValidation,
  lowStockValidation,
} from './dto/inventory.validation';

const router = Router();

// All routes require authentication
router.use(authGuard);

// Get inventory statistics
router.get('/stats', permissionGuard(['inventory.view']), inventoryController.getStats);

// Get low stock products
router.get(
  '/low-stock',
  permissionGuard(['inventory.view']),
  validate(lowStockValidation),
  inventoryController.getLowStockProducts
);

// Get out of stock products
router.get(
  '/out-of-stock',
  permissionGuard(['inventory.view']),
  inventoryController.getOutOfStockProducts
);

// Get all inventory logs
router.get(
  '/',
  permissionGuard(['inventory.view']),
  validate(inventoryListValidation),
  inventoryController.getLogs
);

// Get inventory log by ID
router.get('/:id', permissionGuard(['inventory.view']), inventoryController.getLogById);

// Create inventory log
router.post(
  '/',
  permissionGuard(['inventory.create']),
  validate(createInventoryLogValidation),
  inventoryController.createLog
);

// Adjust stock
router.post(
  '/adjust',
  permissionGuard(['inventory.manage']),
  validate(adjustStockValidation),
  inventoryController.adjustStock
);

export default router;
