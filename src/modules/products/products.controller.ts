import { Request, Response, NextFunction } from 'express';
import productsService from './products.service';
import { successResponse, paginatedResponse } from '@common/utils/response';
import { MESSAGES, HTTP_STATUS } from '@common/constants';
import { RESPONSE_CODES } from '@common/constants/response-codes';

class ProductsController {
  /**
   * @swagger
   * /shop/products:
   *   get:
   *     tags: [Products]
   *     summary: Get all products with pagination and filtering
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
   *         name: categoryId
   *         schema:
   *           type: string
   *       - in: query
   *         name: isActive
   *         schema:
   *           type: boolean
   *       - in: query
   *         name: isFeatured
   *         schema:
   *           type: boolean
   *       - in: query
   *         name: minPrice
   *         schema:
   *           type: number
   *       - in: query
   *         name: maxPrice
   *         schema:
   *           type: number
   *       - in: query
   *         name: inStock
   *         schema:
   *           type: boolean
   *       - in: query
   *         name: sortBy
   *         schema:
   *           type: string
   *           enum: [name, price, createdAt, stockQuantity]
   *       - in: query
   *         name: sortOrder
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *     responses:
   *       200:
   *         description: Products retrieved successfully
   */
  async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await productsService.getProducts(req.query);
      return paginatedResponse(res, result.data, result.meta, MESSAGES.SUCCESS);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /shop/products/stats:
   *   get:
   *     tags: [Products]
   *     summary: Get product statistics
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Statistics retrieved successfully
   */
  async getProductStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await productsService.getProductStats();
      return successResponse(res, stats, MESSAGES.SUCCESS);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /shop/products/{id}:
   *   get:
   *     tags: [Products]
   *     summary: Get product by ID
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
   *         description: Product retrieved successfully
   *       404:
   *         description: Product not found
   */
  async getProductById(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productsService.getProductById(req.params.id);
      return successResponse(res, product, MESSAGES.SUCCESS);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /shop/products/slug/{slug}:
   *   get:
   *     tags: [Products]
   *     summary: Get product by slug
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: slug
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Product retrieved successfully
   *       404:
   *         description: Product not found
   */
  async getProductBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productsService.getProductBySlug(req.params.slug);
      return successResponse(res, product, MESSAGES.SUCCESS);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /shop/products/sku/{sku}:
   *   get:
   *     tags: [Products]
   *     summary: Get product by SKU
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: sku
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Product retrieved successfully
   *       404:
   *         description: Product not found
   */
  async getProductBySKU(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productsService.getProductBySKU(req.params.sku);
      return successResponse(res, product, MESSAGES.SUCCESS);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /shop/products:
   *   post:
   *     tags: [Products]
   *     summary: Create new product
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - categoryId
   *               - price
   *             properties:
   *               name:
   *                 type: string
   *               slug:
   *                 type: string
   *               sku:
   *                 type: string
   *               description:
   *                 type: string
   *               shortDescription:
   *                 type: string
   *               categoryId:
   *                 type: string
   *               price:
   *                 type: number
   *               compareAtPrice:
   *                 type: number
   *               costPrice:
   *                 type: number
   *               trackInventory:
   *                 type: boolean
   *               stockQuantity:
   *                 type: integer
   *               lowStockThreshold:
   *                 type: integer
   *               attributes:
   *                 type: object
   *                 description: Dynamic JSONB attributes (e.g., {color, size, brand})
   *               images:
   *                 type: array
   *                 items:
   *                   type: string
   *               featuredImage:
   *                 type: string
   *               isActive:
   *                 type: boolean
   *               isFeatured:
   *                 type: boolean
   *     responses:
   *       201:
   *         description: Product created successfully
   */
  async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productsService.createProduct(req.body);
      return successResponse(
        res,
        product,
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
   * /shop/products/{id}:
   *   put:
   *     tags: [Products]
   *     summary: Update product
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
   *               name:
   *                 type: string
   *               slug:
   *                 type: string
   *               sku:
   *                 type: string
   *               description:
   *                 type: string
   *               shortDescription:
   *                 type: string
   *               categoryId:
   *                 type: string
   *               price:
   *                 type: number
   *               compareAtPrice:
   *                 type: number
   *               costPrice:
   *                 type: number
   *               trackInventory:
   *                 type: boolean
   *               stockQuantity:
   *                 type: integer
   *               lowStockThreshold:
   *                 type: integer
   *               attributes:
   *                 type: object
   *               images:
   *                 type: array
   *                 items:
   *                   type: string
   *               featuredImage:
   *                 type: string
   *               isActive:
   *                 type: boolean
   *               isFeatured:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Product updated successfully
   */
  async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productsService.updateProduct(req.params.id, req.body);
      return successResponse(
        res,
        product,
        MESSAGES.UPDATED,
        HTTP_STATUS.OK,
        RESPONSE_CODES.UPDATED
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /shop/products/{id}:
   *   delete:
   *     tags: [Products]
   *     summary: Delete product
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
   *         description: Product deleted successfully
   */
  async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      await productsService.deleteProduct(req.params.id);
      return successResponse(res, null, MESSAGES.DELETED, HTTP_STATUS.OK, RESPONSE_CODES.DELETED);
    } catch (error) {
      return next(error);
    }
  }
}

export default new ProductsController();
