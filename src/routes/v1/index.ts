import { Router } from 'express';
import publicRoutes from './public.routes';
import adminRoutes from './admin.routes';
import shopRoutes from './shop.routes';

const router = Router();

/**
 * API Version 1 Routes
 *
 * Structure:
 * - /api/v1/auth/*          - Public authentication routes
 * - /api/v1/admin/*         - Admin management (users, roles)
 * - /api/v1/shop/*          - E-commerce business logic (products, orders, etc.)
 */

// Public routes (no auth required)
router.use('/', publicRoutes);

// Admin routes (staff management)
router.use('/admin', adminRoutes);

// Shop routes (e-commerce)
router.use('/shop', shopRoutes);

export default router;
