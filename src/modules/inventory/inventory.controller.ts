import { Request, Response, NextFunction } from 'express';
import inventoryService from './inventory.service';
import { successResponse } from '@common/utils/response';
import { CreateInventoryLogDto, AdjustStockDto, InventoryListQuery } from './dto/inventory.dto';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

class InventoryController {
  /**
   * @swagger
   * /shop/inventory:
   *   get:
   *     tags: [Inventory]
   *     summary: Get inventory logs
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *       - in: query
   *         name: pageSize
   *         schema:
   *           type: integer
   *       - in: query
   *         name: productId
   *         schema:
   *           type: string
   *       - in: query
   *         name: type
   *         schema:
   *           type: string
   *           enum: [PURCHASE, SALE, RETURN, ADJUSTMENT, DAMAGE]
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date-time
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date-time
   *     responses:
   *       200:
   *         description: Inventory logs retrieved successfully
   */
  getLogs = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const query: InventoryListQuery = req.query;
      const userId = req.user?.id || '';

      const result = await inventoryService.getLogs(query, userId);

      return successResponse(res, result, 'Inventory logs retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * @swagger
   * /shop/inventory/{id}:
   *   get:
   *     tags: [Inventory]
   *     summary: Get inventory log by ID
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
   *         description: Inventory log retrieved successfully
   *       404:
   *         description: Inventory log not found
   */
  getLogById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id || '';

      const log = await inventoryService.getLogById(id, userId);

      return successResponse(res, log, 'Inventory log retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * @swagger
   * /shop/inventory:
   *   post:
   *     tags: [Inventory]
   *     summary: Create inventory log
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               productId:
   *                 type: string
   *               type:
   *                 type: string
   *                 enum: [PURCHASE, SALE, RETURN, ADJUSTMENT, DAMAGE]
   *               quantity:
   *                 type: integer
   *               note:
   *                 type: string
   *     responses:
   *       201:
   *         description: Inventory log created successfully
   */
  createLog = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data: CreateInventoryLogDto = req.body;
      const userId = req.user?.id || '';

      const log = await inventoryService.createLog(data, userId);

      return successResponse(res, log, 'Inventory log created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @swagger
   * /shop/inventory/adjust:
   *   post:
   *     tags: [Inventory]
   *     summary: Adjust stock
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               productId:
   *                 type: string
   *               quantity:
   *                 type: integer
   *               type:
   *                 type: string
   *                 enum: [ADJUSTMENT, DAMAGE]
   *               note:
   *                 type: string
   *     responses:
   *       201:
   *         description: Stock adjusted successfully
   */
  adjustStock = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data: AdjustStockDto = req.body;
      const userId = req.user?.id || '';

      const log = await inventoryService.adjustStock(data, userId);

      return successResponse(res, log, 'Stock adjusted successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @swagger
   * /shop/inventory/stats:
   *   get:
   *     tags: [Inventory]
   *     summary: Get inventory statistics
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Inventory statistics retrieved successfully
   */
  getStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id || '';

      const stats = await inventoryService.getStats(userId);

      return successResponse(res, stats, 'Inventory statistics retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * @swagger
   * /api/v1/admin/inventory/low-stock:
   *   get:
   *     tags: [Inventory]
   *     summary: Get low stock products
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: threshold
   *         schema:
   *           type: integer
   *           default: 10
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
   *         description: Low stock products retrieved successfully
   */
  getLowStockProducts = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const threshold = parseInt(req.query.threshold as string) || 10;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;

      const result = await inventoryService.getLowStockProducts(threshold, page, pageSize);

      return successResponse(res, result, 'Low stock products retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * @swagger
   * /api/v1/admin/inventory/out-of-stock:
   *   get:
   *     tags: [Inventory]
   *     summary: Get out of stock products
   *     security:
   *       - bearerAuth: []
   *     parameters:
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
   *         description: Out of stock products retrieved successfully
   */
  getOutOfStockProducts = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;

      const result = await inventoryService.getOutOfStockProducts(page, pageSize);

      return successResponse(res, result, 'Out of stock products retrieved successfully');
    } catch (error) {
      next(error);
    }
  };
}

const inventoryController = new InventoryController();
export default inventoryController;
