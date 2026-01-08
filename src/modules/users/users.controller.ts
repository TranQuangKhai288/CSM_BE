import { Request, Response, NextFunction } from 'express';
import usersService from './users.service';
import { successResponse, paginatedResponse } from '@common/utils/response';
import { MESSAGES, HTTP_STATUS } from '@common/constants';

class UsersController {
  /**
   * @swagger
   * /users:
   *   get:
   *     tags: [Users]
   *     summary: Get all users with pagination
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
   *         name: roleId
   *         schema:
   *           type: string
   *       - in: query
   *         name: isActive
   *         schema:
   *           type: boolean
   *       - in: query
   *         name: sortBy
   *         schema:
   *           type: string
   *           enum: [createdAt, email, firstName]
   *       - in: query
   *         name: sortOrder
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *     responses:
   *       200:
   *         description: Users retrieved successfully
   */
  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await usersService.getUsers(req.query);
      return paginatedResponse(res, result.data, result.meta, MESSAGES.SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /users/stats:
   *   get:
   *     tags: [Users]
   *     summary: Get user statistics
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Statistics retrieved successfully
   */
  async getUserStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await usersService.getUserStats();
      return successResponse(res, stats, MESSAGES.SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /users/{id}:
   *   get:
   *     tags: [Users]
   *     summary: Get user by ID
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
   *         description: User retrieved successfully
   *       404:
   *         description: User not found
   */
  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await usersService.getUserById(req.params.id);
      return successResponse(res, user, MESSAGES.SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /users:
   *   post:
   *     tags: [Users]
   *     summary: Create new user
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *               - firstName
   *               - lastName
   *               - roleId
   *             properties:
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *               firstName:
   *                 type: string
   *               lastName:
   *                 type: string
   *               roleId:
   *                 type: string
   *               phone:
   *                 type: string
   *               avatar:
   *                 type: string
   *     responses:
   *       201:
   *         description: User created successfully
   */
  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await usersService.createUser(req.body);
      return successResponse(res, user, MESSAGES.CREATED, HTTP_STATUS.CREATED);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /users/{id}:
   *   put:
   *     tags: [Users]
   *     summary: Update user
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
   *               email:
   *                 type: string
   *               firstName:
   *                 type: string
   *               lastName:
   *                 type: string
   *               roleId:
   *                 type: string
   *               phone:
   *                 type: string
   *               avatar:
   *                 type: string
   *               isActive:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: User updated successfully
   */
  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await usersService.updateUser(req.params.id, req.body);
      return successResponse(res, user, MESSAGES.UPDATED);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /users/{id}/password:
   *   put:
   *     tags: [Users]
   *     summary: Update user password (admin)
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
   *               - newPassword
   *             properties:
   *               newPassword:
   *                 type: string
   *     responses:
   *       200:
   *         description: Password updated successfully
   */
  async updateUserPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await usersService.updateUserPassword(req.params.id, req.body);
      return successResponse(res, null, 'Password updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /users/{id}:
   *   delete:
   *     tags: [Users]
   *     summary: Delete user
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
   *         description: User deleted successfully
   */
  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      await usersService.deleteUser(req.params.id);
      return successResponse(res, null, MESSAGES.DELETED);
    } catch (error) {
      next(error);
    }
  }
}

export default new UsersController();
