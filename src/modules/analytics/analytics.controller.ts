import { Request, Response, NextFunction } from 'express';
import analyticsService from './analytics.service';
import { successResponse, paginatedResponse } from '@common/utils/response';
import { MESSAGES, HTTP_STATUS } from '@common/constants';

class AnalyticsController {
  /**
   * @swagger
   * /admin/analytics:
   *   post:
   *     tags: [Analytics]
   *     summary: Create analytics record
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - type
   *               - category
   *               - metric
   *               - value
   *               - date
   *             properties:
   *               type:
   *                 type: string
   *                 enum: [DAILY, WEEKLY, MONTHLY, YEARLY, REALTIME]
   *               category:
   *                 type: string
   *               metric:
   *                 type: string
   *               value:
   *                 type: number
   *               metadata:
   *                 type: object
   *               date:
   *                 type: string
   *                 format: date
   *     responses:
   *       201:
   *         description: Analytics created successfully
   */
  async createAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const analytics = await analyticsService.createAnalytics(req.body);
      return successResponse(res, analytics, 'Analytics created successfully', HTTP_STATUS.CREATED);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/analytics:
   *   get:
   *     tags: [Analytics]
   *     summary: Get analytics with filtering
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: type
   *         schema:
   *           type: string
   *           enum: [DAILY, WEEKLY, MONTHLY, YEARLY, REALTIME]
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
   *       - in: query
   *         name: metric
   *         schema:
   *           type: string
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *       - in: query
   *         name: pageSize
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Analytics retrieved successfully
   */
  async getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await analyticsService.getAnalytics(req.query);
      return paginatedResponse(res, result.data, result.meta, MESSAGES.SUCCESS);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/analytics/{id}:
   *   get:
   *     tags: [Analytics]
   *     summary: Get analytics by ID
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Analytics retrieved successfully
   */
  async getAnalyticsById(req: Request, res: Response, next: NextFunction) {
    try {
      const analytics = await analyticsService.getAnalyticsById(req.params.id);
      return successResponse(res, analytics, MESSAGES.SUCCESS);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/analytics/{id}:
   *   patch:
   *     tags: [Analytics]
   *     summary: Update analytics
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               value:
   *                 type: number
   *               metadata:
   *                 type: object
   *     responses:
   *       200:
   *         description: Analytics updated successfully
   */
  async updateAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const analytics = await analyticsService.updateAnalytics(req.params.id, req.body);
      return successResponse(res, analytics, 'Analytics updated successfully');
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/analytics/{id}:
   *   delete:
   *     tags: [Analytics]
   *     summary: Delete analytics
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Analytics deleted successfully
   */
  async deleteAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await analyticsService.deleteAnalytics(req.params.id);
      return successResponse(res, result, 'Analytics deleted successfully');
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/analytics/sales/overview:
   *   get:
   *     tags: [Analytics]
   *     summary: Get sales analytics overview
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *     responses:
   *       200:
   *         description: Sales analytics retrieved successfully
   */
  async getSalesAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await analyticsService.getSalesAnalytics(req.query);
      return successResponse(res, stats, MESSAGES.SUCCESS);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/analytics/sales/over-time:
   *   get:
   *     tags: [Analytics]
   *     summary: Get sales over time
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *       - in: query
   *         name: groupBy
   *         schema:
   *           type: string
   *           enum: [day, week, month, year]
   *     responses:
   *       200:
   *         description: Sales over time retrieved successfully
   */
  async getSalesOverTime(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await analyticsService.getSalesOverTime(req.query);
      return successResponse(res, data, MESSAGES.SUCCESS);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/analytics/products/overview:
   *   get:
   *     tags: [Analytics]
   *     summary: Get product analytics
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Product analytics retrieved successfully
   */
  async getProductAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await analyticsService.getProductAnalytics(req.query);
      return successResponse(res, data, MESSAGES.SUCCESS);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/analytics/products/low-stock:
   *   get:
   *     tags: [Analytics]
   *     summary: Get low stock products
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: threshold
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Low stock products retrieved successfully
   */
  async getLowStockProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const threshold = req.query.threshold ? parseInt(req.query.threshold as string) : undefined;
      const products = await analyticsService.getLowStockProducts(threshold);
      return successResponse(res, products, MESSAGES.SUCCESS);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/analytics/customers/overview:
   *   get:
   *     tags: [Analytics]
   *     summary: Get customer analytics
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *     responses:
   *       200:
   *         description: Customer analytics retrieved successfully
   */
  async getCustomerAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await analyticsService.getCustomerAnalytics(req.query);
      return successResponse(res, data, MESSAGES.SUCCESS);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /public/analytics/page-view:
   *   post:
   *     tags: [Analytics]
   *     summary: Track page view
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - path
   *             properties:
   *               path:
   *                 type: string
   *               referrer:
   *                 type: string
   *               userAgent:
   *                 type: string
   *               ipAddress:
   *                 type: string
   *               sessionId:
   *                 type: string
   *               userId:
   *                 type: string
   *               duration:
   *                 type: integer
   *               metadata:
   *                 type: object
   *     responses:
   *       201:
   *         description: Page view tracked successfully
   */
  async trackPageView(req: Request, res: Response, next: NextFunction) {
    try {
      const pageView = await analyticsService.trackPageView(req.body);
      return successResponse(res, pageView, 'Page view tracked successfully', HTTP_STATUS.CREATED);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/analytics/page-views:
   *   get:
   *     tags: [Analytics]
   *     summary: Get page views
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *       - in: query
   *         name: pageSize
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Page views retrieved successfully
   */
  async getPageViews(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await analyticsService.getPageViews(req.query);
      return paginatedResponse(res, result.data, result.meta, MESSAGES.SUCCESS);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/analytics/page-views/stats:
   *   get:
   *     tags: [Analytics]
   *     summary: Get page view statistics
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *     responses:
   *       200:
   *         description: Page view statistics retrieved successfully
   */
  async getPageViewStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await analyticsService.getPageViewStats(req.query);
      return successResponse(res, stats, MESSAGES.SUCCESS);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/analytics/dashboard:
   *   get:
   *     tags: [Analytics]
   *     summary: Get dashboard statistics
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *     responses:
   *       200:
   *         description: Dashboard statistics retrieved successfully
   */
  async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await analyticsService.getDashboardStats(req.query);
      return successResponse(res, stats, MESSAGES.SUCCESS);
    } catch (error) {
      return next(error);
    }
  }
}

export default new AnalyticsController();
