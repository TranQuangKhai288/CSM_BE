import { Router } from 'express';
import customersController from './customers.controller';
import { authGuard } from '@common/guards/auth.guard';
import { permissionGuard } from '@common/guards/permission.guard';
import { validate } from '@middleware/validation.middleware';
import {
  createCustomerValidation,
  updateCustomerValidation,
  customerListValidation,
} from './dto/customers.validation';

const router = Router();

// All routes require authentication
router.use(authGuard);

// Statistics - must be before /:id route
router.get(
  '/stats',
  permissionGuard(['customers.view', 'customers.manage']),
  customersController.getCustomerStats
);

// List customers
router.get(
  '/',
  permissionGuard(['customers.view', 'customers.manage']),
  validate(customerListValidation),
  customersController.getCustomers
);

// Get customer by email - must be before /:id route
router.get(
  '/email/:email',
  permissionGuard(['customers.view', 'customers.manage']),
  customersController.getCustomerByEmail
);

// Get customer by ID
router.get(
  '/:id',
  permissionGuard(['customers.view', 'customers.manage']),
  customersController.getCustomerById
);

// Create customer
router.post(
  '/',
  permissionGuard(['customers.create', 'customers.manage']),
  validate(createCustomerValidation),
  customersController.createCustomer
);

// Update customer
router.put(
  '/:id',
  permissionGuard(['customers.update', 'customers.manage']),
  validate(updateCustomerValidation),
  customersController.updateCustomer
);

// Delete customer
router.delete(
  '/:id',
  permissionGuard(['customers.delete', 'customers.manage']),
  customersController.deleteCustomer
);

// Loyalty points
router.post(
  '/:id/loyalty/add',
  permissionGuard(['customers.update', 'customers.manage']),
  customersController.addLoyaltyPoints
);

router.post(
  '/:id/loyalty/deduct',
  permissionGuard(['customers.update', 'customers.manage']),
  customersController.deductLoyaltyPoints
);

export default router;
