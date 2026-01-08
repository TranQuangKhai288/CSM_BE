import { Request, Response, NextFunction } from 'express';
import ordersService from './orders.service';
import { successResponse, paginatedResponse } from '@common/utils/response';
import { RESPONSE_CODES } from '@common/constants/response-codes';

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
};

const MESSAGES = {
  SUCCESS: 'Success',
  CREATED: 'Order created successfully',
  UPDATED: 'Order updated successfully',
  STATUS_UPDATED: 'Order status updated successfully',
  CANCELLED: 'Order cancelled successfully',
};

class OrdersController {
  /**
   * @swagger
   * /shop/orders:
   *   get:
   *     tags: [Orders]
   *     summary: Get all orders with filtering
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *       - in: query
   *         name: pageSize
   *       - in: query
   *         name: search
   *       - in: query
   *         name: customerId
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED]
   *       - in: query
   *         name: paymentStatus
   *         schema:
   *           type: string
   *           enum: [PENDING, PAID, FAILED, REFUNDED, PARTIALLY_REFUNDED]
   *     responses:
   *       200:
   *         description: Orders retrieved successfully
   */
  async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ordersService.getOrders(req.query);
      return paginatedResponse(res, result.data, result.meta, MESSAGES.SUCCESS);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /shop/orders/stats:
   *   get:
   *     tags: [Orders]
   *     summary: Get order statistics
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Statistics retrieved successfully
   */
  async getOrderStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await ordersService.getOrderStats();
      return successResponse(res, stats, MESSAGES.SUCCESS);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /shop/orders/{id}:
   *   get:
   *     tags: [Orders]
   *     summary: Get order by ID
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
   *         description: Order retrieved successfully
   *       404:
   *         description: Order not found
   */
  async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await ordersService.getOrderById(req.params.id);
      return successResponse(res, order, MESSAGES.SUCCESS);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /shop/orders/number/{orderNumber}:
   *   get:
   *     tags: [Orders]
   *     summary: Get order by order number
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: orderNumber
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Order retrieved successfully
   *       404:
   *         description: Order not found
   */
  async getOrderByNumber(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await ordersService.getOrderByNumber(req.params.orderNumber);
      return successResponse(res, order, MESSAGES.SUCCESS);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /shop/orders:
   *   post:
   *     tags: [Orders]
   *     summary: Create new order
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - customerId
   *               - items
   *               - shippingAddress
   *             properties:
   *               customerId:
   *                 type: string
   *               items:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     productId:
   *                       type: string
   *                     variantId:
   *                       type: string
   *                     quantity:
   *                       type: integer
   *               shippingAddress:
   *                 type: object
   *               billingAddress:
   *                 type: object
   *               paymentMethod:
   *                 type: string
   *               discount:
   *                 type: number
   *               tax:
   *                 type: number
   *               shipping:
   *                 type: number
   *               notes:
   *                 type: string
   *     responses:
   *       201:
   *         description: Order created successfully
   */
  async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      const order = await ordersService.createOrder(req.body, userId);
      return successResponse(
        res,
        order,
        MESSAGES.CREATED,
        HTTP_STATUS.CREATED,
        RESPONSE_CODES.CREATED
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /shop/orders/{id}:
   *   put:
   *     tags: [Orders]
   *     summary: Update order
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               paymentMethod:
   *                 type: string
   *               trackingNumber:
   *                 type: string
   *               notes:
   *                 type: string
   *     responses:
   *       200:
   *         description: Order updated successfully
   */
  async updateOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      const order = await ordersService.updateOrder(req.params.id, req.body, userId);
      return successResponse(res, order, MESSAGES.UPDATED, HTTP_STATUS.OK, RESPONSE_CODES.UPDATED);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /shop/orders/{id}/status:
   *   put:
   *     tags: [Orders]
   *     summary: Update order status
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
   *             required:
   *               - status
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED]
   *               note:
   *                 type: string
   *     responses:
   *       200:
   *         description: Order status updated successfully
   */
  async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      const order = await ordersService.updateOrderStatus(req.params.id, req.body, userId);
      return successResponse(
        res,
        order,
        MESSAGES.STATUS_UPDATED,
        HTTP_STATUS.OK,
        RESPONSE_CODES.UPDATED
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /shop/orders/{id}/cancel:
   *   post:
   *     tags: [Orders]
   *     summary: Cancel order
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               note:
   *                 type: string
   *     responses:
   *       200:
   *         description: Order cancelled successfully
   */
  async cancelOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      const order = await ordersService.cancelOrder(req.params.id, req.body.note, userId);
      return successResponse(
        res,
        order,
        MESSAGES.CANCELLED,
        HTTP_STATUS.OK,
        RESPONSE_CODES.UPDATED
      );
    } catch (error) {
      return next(error);
    }
  }
}

export default new OrdersController();
