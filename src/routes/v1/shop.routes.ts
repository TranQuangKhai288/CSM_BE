import { Router } from 'express';
import categoriesRoutes from '@modules/categories/categories.routes';
import productsRoutes from '@modules/products/products.routes';
import customersRoutes from '@modules/customers/customers.routes';
import ordersRoutes from '@modules/orders/orders.routes';
import inventoryRoutes from '@modules/inventory/inventory.routes';
import discountsRoutes from '@modules/discounts/discounts.routes';

const router = Router();

/**
 * Shop routes - E-commerce business logic
 * All routes require authentication and proper permissions
 */

router.use('/categories', categoriesRoutes);
router.use('/products', productsRoutes);
router.use('/customers', customersRoutes);
router.use('/orders', ordersRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/discounts', discountsRoutes);

export default router;
