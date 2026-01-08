import { Request, Response, NextFunction } from 'express';
import rolesService from './roles.service';
import { successResponse, paginatedResponse } from '@common/utils/response';
import { MESSAGES, HTTP_STATUS } from '@common/constants';

class RolesController {
  /**
   * @swagger
   * /roles:
   *   get:
   *     tags: [Roles]
   *     summary: Get all roles with pagination
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Page number
   *       - in: query
   *         name: pageSize
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *         description: Items per page
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search by name, slug, or description
   *       - in: query
   *         name: isActive
   *         schema:
   *           type: boolean
   *         description: Filter by active status
   *     responses:
   *       200:
   *         description: Roles retrieved successfully
   */
  async getRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await rolesService.getRoles(req.query);
      return paginatedResponse(res, result.data, result.meta, MESSAGES.SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /roles/{id}:
   *   get:
   *     tags: [Roles]
   *     summary: Get role by ID
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Role ID
   *     responses:
   *       200:
   *         description: Role retrieved successfully
   *       404:
   *         description: Role not found
   */
  async getRoleById(req: Request, res: Response, next: NextFunction) {
    try {
      const role = await rolesService.getRoleById(req.params.id);
      return successResponse(res, role, MESSAGES.SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /roles/slug/{slug}:
   *   get:
   *     tags: [Roles]
   *     summary: Get role by slug
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: slug
   *         required: true
   *         schema:
   *           type: string
   *         description: Role slug
   *     responses:
   *       200:
   *         description: Role retrieved successfully
   *       404:
   *         description: Role not found
   */
  async getRoleBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const role = await rolesService.getRoleBySlug(req.params.slug);
      return successResponse(res, role, MESSAGES.SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /roles:
   *   post:
   *     tags: [Roles]
   *     summary: Create new role
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
   *               - permissions
   *             properties:
   *               name:
   *                 type: string
   *               slug:
   *                 type: string
   *               description:
   *                 type: string
   *               permissions:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       201:
   *         description: Role created successfully
   *       409:
   *         description: Role already exists
   */
  async createRole(req: Request, res: Response, next: NextFunction) {
    try {
      const role = await rolesService.createRole(req.body);
      return successResponse(res, role, MESSAGES.CREATED, HTTP_STATUS.CREATED);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /roles/{id}:
   *   put:
   *     tags: [Roles]
   *     summary: Update role
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
   *               name:
   *                 type: string
   *               slug:
   *                 type: string
   *               description:
   *                 type: string
   *               permissions:
   *                 type: array
   *                 items:
   *                   type: string
   *               isActive:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Role updated successfully
   *       404:
   *         description: Role not found
   */
  async updateRole(req: Request, res: Response, next: NextFunction) {
    try {
      const role = await rolesService.updateRole(req.params.id, req.body);
      return successResponse(res, role, MESSAGES.UPDATED);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /roles/{id}:
   *   delete:
   *     tags: [Roles]
   *     summary: Delete role
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
   *         description: Role deleted successfully
   *       400:
   *         description: Cannot delete role with assigned users
   *       404:
   *         description: Role not found
   */
  async deleteRole(req: Request, res: Response, next: NextFunction) {
    try {
      await rolesService.deleteRole(req.params.id);
      return successResponse(res, null, MESSAGES.DELETED);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /roles/permissions/available:
   *   get:
   *     tags: [Roles]
   *     summary: Get all available permissions
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Permissions retrieved successfully
   */
  async getAvailablePermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const permissions = await rolesService.getAvailablePermissions();
      return successResponse(res, permissions, MESSAGES.SUCCESS);
    } catch (error) {
      next(error);
    }
  }
}

export default new RolesController();
