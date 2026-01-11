import { Request, Response, NextFunction } from 'express';
import discountsService from './discounts.service';
import { successResponse } from '@common/utils/response';
import {
  CreateDiscountDto,
  UpdateDiscountDto,
  DiscountListQuery,
  ValidateDiscountDto,
} from './dto/discounts.dto';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

class DiscountsController {
  /**
   * @swagger
   * /shop/discounts:
   *   get:
   *     tags: [Discounts]
   *     summary: Get all discounts
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
   *         name: search
   *         schema:
   *           type: string
   *       - in: query
   *         name: type
   *         schema:
   *           type: string
   *           enum: [PERCENTAGE, FIXED_AMOUNT, FREE_SHIPPING]
   *       - in: query
   *         name: isActive
   *         schema:
   *           type: boolean
   *     responses:
   *       200:
   *         description: Discounts retrieved successfully
   */
  getDiscounts = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const query: DiscountListQuery = req.query;
      const userId = req.user?.id || '';

      const result = await discountsService.getDiscounts(query, userId);

      return successResponse(res, result, 'Discounts retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * @swagger
   * /shop/discounts/{id}:
   *   get:
   *     tags: [Discounts]
   *     summary: Get discount by ID
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
   *         description: Discount retrieved successfully
   *       404:
   *         description: Discount not found
   */
  getDiscountById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id || '';

      const discount = await discountsService.getDiscountById(id, userId);

      return successResponse(res, discount, 'Discount retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * @swagger
   * /discounts/code/{code}:
   *   get:
   *     tags: [Discounts]
   *     summary: Get discount by code (public)
   *     parameters:
   *       - in: path
   *         name: code
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Discount retrieved successfully
   *       404:
   *         description: Discount not found
   */
  getDiscountByCode = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { code } = req.params;

      const discount = await discountsService.getDiscountByCode(code);

      return successResponse(res, discount, 'Discount retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * @swagger
   * /shop/discounts:
   *   post:
   *     tags: [Discounts]
   *     summary: Create new discount
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               code:
   *                 type: string
   *               name:
   *                 type: string
   *               description:
   *                 type: string
   *               type:
   *                 type: string
   *                 enum: [PERCENTAGE, FIXED_AMOUNT, FREE_SHIPPING]
   *               value:
   *                 type: number
   *               minOrderValue:
   *                 type: number
   *               maxDiscount:
   *                 type: number
   *               usageLimit:
   *                 type: integer
   *               startDate:
   *                 type: string
   *                 format: date-time
   *               endDate:
   *                 type: string
   *                 format: date-time
   *               isActive:
   *                 type: boolean
   *     responses:
   *       201:
   *         description: Discount created successfully
   */
  createDiscount = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data: CreateDiscountDto = req.body;
      const userId = req.user?.id || '';

      const discount = await discountsService.createDiscount(data, userId);

      return successResponse(res, discount, 'Discount created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @swagger
   * /shop/discounts/{id}:
   *   put:
   *     tags: [Discounts]
   *     summary: Update discount
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
   *     responses:
   *       200:
   *         description: Discount updated successfully
   *       404:
   *         description: Discount not found
   */
  updateDiscount = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data: UpdateDiscountDto = req.body;
      const userId = req.user?.id || '';

      const discount = await discountsService.updateDiscount(id, data, userId);

      return successResponse(res, discount, 'Discount updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * @swagger
   * /shop/discounts/{id}:
   *   delete:
   *     tags: [Discounts]
   *     summary: Delete discount
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
   *         description: Discount deleted successfully
   *       404:
   *         description: Discount not found
   */
  deleteDiscount = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id || '';

      await discountsService.deleteDiscount(id, userId);

      return successResponse(res, null, 'Discount deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * @swagger
   * /discounts/validate:
   *   post:
   *     tags: [Discounts]
   *     summary: Validate discount code
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               code:
   *                 type: string
   *               orderTotal:
   *                 type: number
   *     responses:
   *       200:
   *         description: Discount validation result
   */
  validateDiscount = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data: ValidateDiscountDto = req.body;

      const result = await discountsService.validateDiscount(data);

      return successResponse(res, result, 'Discount validated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * @swagger
   * /shop/discounts/stats:
   *   get:
   *     tags: [Discounts]
   *     summary: Get discount statistics
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Discount statistics retrieved successfully
   */
  getStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id || '';

      const stats = await discountsService.getStats(userId);

      return successResponse(res, stats, 'Discount statistics retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * @swagger
   * /discounts/active:
   *   get:
   *     tags: [Discounts]
   *     summary: Get active discounts (public)
   *     responses:
   *       200:
   *         description: Active discounts retrieved successfully
   */
  getActiveDiscounts = async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const discounts = await discountsService.getActiveDiscounts();

      return successResponse(res, discounts, 'Active discounts retrieved successfully');
    } catch (error) {
      next(error);
    }
  };
}

const discountsController = new DiscountsController();
export default discountsController;
