import { Router } from 'express';
import authRoutes from '@modules/auth/auth.routes';
import { publicDiscountsRouter } from '@modules/discounts/discounts.routes';
import { publicAnalyticsRouter } from '@modules/analytics/analytics.public.routes';

const router = Router();

/**
 * Public routes - No authentication required
 */
router.use('/auth', authRoutes);
router.use('/discounts', publicDiscountsRouter);
router.use('/analytics', publicAnalyticsRouter);

export default router;
