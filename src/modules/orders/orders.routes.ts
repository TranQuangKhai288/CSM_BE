import { Router } from 'express';
import ordersController from './orders.controller';
import { authGuard } from '@common/guards/auth.guard';
import { permissionGuard } from '@common/guards/permission.guard';
import { validate } from '@middleware/validation.middleware';
import {
  createOrderValidation,
  updateOrderValidation,
  updateOrderStatusValidation,
  orderListValidation,
} from './dto/orders.validation';

const router = Router();

// All routes require authentication
router.use(authGuard);

// Statistics - must be before /:id route
router.get(
  '/stats',
  permissionGuard(['orders.view', 'orders.manage']),
  ordersController.getOrderStats
);

// List orders
router.get(
  '/',
  permissionGuard(['orders.view', 'orders.manage']),
  validate(orderListValidation),
  ordersController.getOrders
);

// Get order by order number - must be before /:id route
router.get(
  '/number/:orderNumber',
  permissionGuard(['orders.view', 'orders.manage']),
  ordersController.getOrderByNumber
);

// Get order by ID
router.get(
  '/:id',
  permissionGuard(['orders.view', 'orders.manage']),
  ordersController.getOrderById
);

// Create order
router.post(
  '/',
  permissionGuard(['orders.create', 'orders.manage']),
  validate(createOrderValidation),
  ordersController.createOrder
);

// Update order
router.put(
  '/:id',
  permissionGuard(['orders.update', 'orders.manage']),
  validate(updateOrderValidation),
  ordersController.updateOrder
);

// Update order status
router.put(
  '/:id/status',
  permissionGuard(['orders.update', 'orders.manage']),
  validate(updateOrderStatusValidation),
  ordersController.updateOrderStatus
);

// Cancel order
router.post(
  '/:id/cancel',
  permissionGuard(['orders.update', 'orders.manage']),
  ordersController.cancelOrder
);

export default router;
