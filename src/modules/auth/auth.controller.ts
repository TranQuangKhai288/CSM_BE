import { Request, Response, NextFunction } from 'express';
import authService from './auth.service';
import { successResponse } from '@common/utils/response';
import { MESSAGES, HTTP_STATUS } from '@common/constants';
import { AuthRequest } from '@common/guards/auth.guard';

class AuthController {
  /**
   * @swagger
   * /auth/register:
   *   post:
   *     tags: [Auth]
   *     summary: Register a new user
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
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *                 format: password
   *               firstName:
   *                 type: string
   *               lastName:
   *                 type: string
   *     responses:
   *       201:
   *         description: User registered successfully
   */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      return successResponse(res, result, MESSAGES.REGISTER_SUCCESS, HTTP_STATUS.CREATED);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /auth/login:
   *   post:
   *     tags: [Auth]
   *     summary: Login user
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *                 format: password
   *     responses:
   *       200:
   *         description: Login successful
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      return successResponse(res, result, MESSAGES.LOGIN_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /auth/refresh:
   *   post:
   *     tags: [Auth]
   *     summary: Refresh access token
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - refreshToken
   *             properties:
   *               refreshToken:
   *                 type: string
   *     responses:
   *       200:
   *         description: Token refreshed successfully
   */
  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);
      return successResponse(res, result, MESSAGES.TOKEN_REFRESHED);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /auth/logout:
   *   post:
   *     tags: [Auth]
   *     summary: Logout user
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Logout successful
   */
  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const token = req.headers.authorization!.substring(7);
      
      await authService.logout(userId, token);
      return successResponse(res, null, MESSAGES.LOGOUT_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /auth/me:
   *   get:
   *     tags: [Auth]
   *     summary: Get current user
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User retrieved successfully
   */
  async getCurrentUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const result = await authService.getCurrentUser(userId);
      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /auth/change-password:
   *   post:
   *     tags: [Auth]
   *     summary: Change password
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - oldPassword
   *               - newPassword
   *             properties:
   *               oldPassword:
   *                 type: string
   *                 format: password
   *               newPassword:
   *                 type: string
   *                 format: password
   *     responses:
   *       200:
   *         description: Password changed successfully
   */
  async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { oldPassword, newPassword } = req.body;
      
      await authService.changePassword(userId, oldPassword, newPassword);
      return successResponse(res, null, MESSAGES.PASSWORD_CHANGED);
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
