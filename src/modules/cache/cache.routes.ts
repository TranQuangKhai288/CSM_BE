import { Router } from 'express';
import cacheController from './cache.controller';
import { authGuard } from '@common/guards/auth.guard';
import { permissionGuard } from '@common/guards/permission.guard';
import { PERMISSIONS } from '@common/constants';

const router = Router();

// All routes require authentication
router.use(authGuard);

// Clear all cache
router.delete('/clear', permissionGuard([PERMISSIONS.ADMIN_ALL]), cacheController.clearCache);

export default router;
