import { Request, Response, NextFunction } from 'express';
import categoriesService from './categories.service';
import { successResponse, paginatedResponse } from '@common/utils/response';
import { MESSAGES, HTTP_STATUS } from '@common/constants';
import { RESPONSE_CODES } from '@common/constants/response-codes';

class CategoriesController {
  /**
   * @swagger
   * /shop/categories:
   *   get:
   *     tags: [Categories]
   *     summary: Get all categories with pagination
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
   *         name: parentId
   *         schema:
   *           type: string
   *         description: Use 'null' for root categories or UUID for specific parent
   *       - in: query
   *         name: isActive
   *         schema:
   *           type: boolean
   *       - in: query
   *         name: sortBy
   *         schema:
   *           type: string
   *           enum: [name, createdAt, updatedAt]
   *       - in: query
   *         name: sortOrder
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *     responses:
   *       200:
   *         description: Categories retrieved successfully
   */
  async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await categoriesService.getCategories(req.query);
      return paginatedResponse(res, result.data, result.meta, MESSAGES.SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /shop/categories/tree:
   *   get:
   *     tags: [Categories]
   *     summary: Get category tree (hierarchical structure)
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Category tree retrieved successfully
   */
  async getCategoryTree(req: Request, res: Response, next: NextFunction) {
    try {
      const tree = await categoriesService.getCategoryTree();
      return successResponse(res, tree, 'Category tree retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /shop/categories/{id}:
   *   get:
   *     tags: [Categories]
   *     summary: Get category by ID
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
   *         description: Category retrieved successfully
   *       404:
   *         description: Category not found
   */
  async getCategoryById(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await categoriesService.getCategoryById(req.params.id);
      return successResponse(res, category, MESSAGES.SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /shop/categories/slug/{slug}:
   *   get:
   *     tags: [Categories]
   *     summary: Get category by slug
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
   *         description: Category retrieved successfully
   *       404:
   *         description: Category not found
   */
  async getCategoryBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await categoriesService.getCategoryBySlug(req.params.slug);
      return successResponse(res, category, MESSAGES.SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /shop/categories:
   *   post:
   *     tags: [Categories]
   *     summary: Create new category
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
   *             properties:
   *               name:
   *                 type: string
   *               slug:
   *                 type: string
   *               description:
   *                 type: string
   *               parentId:
   *                 type: string
   *                 nullable: true
   *               image:
   *                 type: string
   *               isActive:
   *                 type: boolean
   *               metaTitle:
   *                 type: string
   *               metaDescription:
   *                 type: string
   *               metaKeywords:
   *                 type: string
   *     responses:
   *       201:
   *         description: Category created successfully
   */
  async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await categoriesService.createCategory(req.body);
      return successResponse(
        res,
        category,
        MESSAGES.CREATED,
        HTTP_STATUS.CREATED,
        RESPONSE_CODES.CREATED
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /shop/categories/{id}:
   *   put:
   *     tags: [Categories]
   *     summary: Update category
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
   *               description:
   *                 type: string
   *               parentId:
   *                 type: string
   *                 nullable: true
   *               image:
   *                 type: string
   *               isActive:
   *                 type: boolean
   *               metaTitle:
   *                 type: string
   *               metaDescription:
   *                 type: string
   *               metaKeywords:
   *                 type: string
   *     responses:
   *       200:
   *         description: Category updated successfully
   */
  async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await categoriesService.updateCategory(req.params.id, req.body);
      return successResponse(
        res,
        category,
        MESSAGES.UPDATED,
        HTTP_STATUS.OK,
        RESPONSE_CODES.UPDATED
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /shop/categories/{id}:
   *   delete:
   *     tags: [Categories]
   *     summary: Delete category
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
   *         description: Category deleted successfully
   */
  async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      await categoriesService.deleteCategory(req.params.id);
      return successResponse(res, null, MESSAGES.DELETED, HTTP_STATUS.OK, RESPONSE_CODES.DELETED);
    } catch (error) {
      next(error);
    }
  }
}

export default new CategoriesController();
