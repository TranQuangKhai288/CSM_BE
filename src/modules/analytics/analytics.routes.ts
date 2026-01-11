import { Router } from 'express';
import analyticsController from './analytics.controller';
import { validate } from '@middleware/validation.middleware';
import { authGuard } from '@common/guards/auth.guard';
import { permissionGuard } from '@common/guards/permission.guard';
import {
  createAnalyticsValidation,
  updateAnalyticsValidation,
  analyticsQueryValidation,
  salesAnalyticsValidation,
  productAnalyticsValidation,
  customerAnalyticsValidation,
  dashboardStatsValidation,
} from './dto/analytics.validation';
import { PERMISSIONS } from '@common/constants';

const router = Router();

// All routes require authentication except page view tracking
router.use(authGuard);

// Dashboard stats
router.get(
  '/dashboard',
  permissionGuard([PERMISSIONS.ANALYTICS_READ]),
  validate(dashboardStatsValidation),
  analyticsController.getDashboardStats
);

// Sales analytics
router.get(
  '/sales/overview',
  permissionGuard([PERMISSIONS.ANALYTICS_READ]),
  validate(salesAnalyticsValidation),
  analyticsController.getSalesAnalytics
);

router.get(
  '/sales/over-time',
  permissionGuard([PERMISSIONS.ANALYTICS_READ]),
  validate(salesAnalyticsValidation),
  analyticsController.getSalesOverTime
);

// Product analytics
router.get(
  '/products/overview',
  permissionGuard([PERMISSIONS.ANALYTICS_READ]),
  validate(productAnalyticsValidation),
  analyticsController.getProductAnalytics
);

router.get(
  '/products/low-stock',
  permissionGuard([PERMISSIONS.ANALYTICS_READ]),
  analyticsController.getLowStockProducts
);

// Customer analytics
router.get(
  '/customers/overview',
  permissionGuard([PERMISSIONS.ANALYTICS_READ]),
  validate(customerAnalyticsValidation),
  analyticsController.getCustomerAnalytics
);

// Page views
router.get(
  '/page-views/stats',
  permissionGuard([PERMISSIONS.ANALYTICS_READ]),
  validate(analyticsQueryValidation),
  analyticsController.getPageViewStats
);

router.get(
  '/page-views',
  permissionGuard([PERMISSIONS.ANALYTICS_READ]),
  validate(analyticsQueryValidation),
  analyticsController.getPageViews
);

// Generic analytics CRUD
router.get(
  '/',
  permissionGuard([PERMISSIONS.ANALYTICS_READ]),
  validate(analyticsQueryValidation),
  analyticsController.getAnalytics
);

router.post(
  '/',
  permissionGuard([PERMISSIONS.ANALYTICS_CREATE]),
  validate(createAnalyticsValidation),
  analyticsController.createAnalytics
);

router.get(
  '/:id',
  permissionGuard([PERMISSIONS.ANALYTICS_READ]),
  analyticsController.getAnalyticsById
);

router.patch(
  '/:id',
  permissionGuard([PERMISSIONS.ANALYTICS_UPDATE]),
  validate(updateAnalyticsValidation),
  analyticsController.updateAnalytics
);

router.delete(
  '/:id',
  permissionGuard([PERMISSIONS.ANALYTICS_DELETE]),
  analyticsController.deleteAnalytics
);

export default router;
