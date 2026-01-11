import { Router } from 'express';
import rolesRoutes from '@modules/roles/roles.routes';
import usersRoutes from '@modules/users/users.routes';
import mediaRoutes from '@modules/media/media.routes';
import analyticsRoutes from '@modules/analytics/analytics.routes';
import cacheRoutes from '@modules/cache/cache.routes';

const router = Router();

/**
 * Admin routes - Manage internal staff and permissions
 * All routes require authentication and proper permissions
 */
router.use('/roles', rolesRoutes);
router.use('/users', usersRoutes);
router.use('/media', mediaRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/cache', cacheRoutes);

export default router;
