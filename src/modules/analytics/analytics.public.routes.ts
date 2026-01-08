import { Router } from 'express';
import analyticsController from './analytics.controller';
import { validate } from '@middleware/validation.middleware';
import { pageViewValidation } from './dto/analytics.validation';

const router = Router();

// Public route for tracking page views (no auth required)
router.post('/page-view', validate(pageViewValidation), analyticsController.trackPageView);

export { router as publicAnalyticsRouter };
