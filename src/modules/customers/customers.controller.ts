import { Request, Response, NextFunction } from 'express';
import customersService from './customers.service';
import { successResponse, paginatedResponse } from '@common/utils/response';
import { RESPONSE_CODES } from '@common/constants/response-codes';

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
};

const MESSAGES = {
  SUCCESS: 'Success',
  CREATED: 'Customer created successfully',
  UPDATED: 'Customer updated successfully',
  DELETED: 'Customer deleted successfully',
};

class CustomersController {
  /**
   * @swagger
   * /shop/customers:
   *   get:
   *     tags: [Customers]
   *     summary: Get all customers with filtering
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
   *         name: isActive
   *         schema:
   *           type: boolean
   *       - in: query
   *         name: minSpent
   *         schema:
   *           type: number
   *       - in: query
   *         name: maxSpent
   *         schema:
   *           type: number
   *       - in: query
   *         name: minOrders
   *         schema:
   *           type: integer
   *       - in: query
   *         name: hasOrders
   *         schema:
   *           type: boolean
   *       - in: query
   *         name: sortBy
   *         schema:
   *           type: string
   *           enum: [firstName, lastName, email, totalSpent, totalOrders, createdAt]
   *       - in: query
   *         name: sortOrder
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *     responses:
   *       200:
   *         description: Customers retrieved successfully
   */
  async getCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await customersService.getCustomers(req.query);
      return paginatedResponse(res, result.data, result.meta, MESSAGES.SUCCESS);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /shop/customers/stats:
   *   get:
   *     tags: [Customers]
   *     summary: Get customer statistics
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Statistics retrieved successfully
   */
  async getCustomerStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await customersService.getCustomerStats();
      return successResponse(res, stats, MESSAGES.SUCCESS);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /shop/customers/{id}:
   *   get:
   *     tags: [Customers]
   *     summary: Get customer by ID
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
   *         description: Customer retrieved successfully
   *       404:
   *         description: Customer not found
   */
  async getCustomerById(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await customersService.getCustomerById(req.params.id);
      return successResponse(res, customer, MESSAGES.SUCCESS);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /shop/customers/email/{email}:
   *   get:
   *     tags: [Customers]
   *     summary: Get customer by email
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: email
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Customer retrieved successfully
   *       404:
   *         description: Customer not found
   */
  async getCustomerByEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await customersService.getCustomerByEmail(req.params.email);
      return successResponse(res, customer, MESSAGES.SUCCESS);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /shop/customers:
   *   post:
   *     tags: [Customers]
   *     summary: Create new customer
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
   *               - firstName
   *               - lastName
   *             properties:
   *               email:
   *                 type: string
   *               firstName:
   *                 type: string
   *               lastName:
   *                 type: string
   *               phone:
   *                 type: string
   *               avatar:
   *                 type: string
   *               addresses:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     type:
   *                       type: string
   *                       enum: [shipping, billing]
   *                     firstName:
   *                       type: string
   *                     lastName:
   *                       type: string
   *                     company:
   *                       type: string
   *                     address1:
   *                       type: string
   *                     address2:
   *                       type: string
   *                     city:
   *                       type: string
   *                     state:
   *                       type: string
   *                     postalCode:
   *                       type: string
   *                     country:
   *                       type: string
   *                     phone:
   *                       type: string
   *                     isDefault:
   *                       type: boolean
   *               isActive:
   *                 type: boolean
   *     responses:
   *       201:
   *         description: Customer created successfully
   */
  async createCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await customersService.createCustomer(req.body);
      return successResponse(
        res,
        customer,
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
   * /shop/customers/{id}:
   *   put:
   *     tags: [Customers]
   *     summary: Update customer
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
   *               phone:
   *                 type: string
   *               avatar:
   *                 type: string
   *               addresses:
   *                 type: array
   *               isActive:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Customer updated successfully
   */
  async updateCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await customersService.updateCustomer(req.params.id, req.body);
      return successResponse(
        res,
        customer,
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
   * /shop/customers/{id}:
   *   delete:
   *     tags: [Customers]
   *     summary: Delete customer
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
   *         description: Customer deleted successfully
   */
  async deleteCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      await customersService.deleteCustomer(req.params.id);
      return successResponse(res, null, MESSAGES.DELETED, HTTP_STATUS.OK, RESPONSE_CODES.DELETED);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /shop/customers/{id}/loyalty/add:
   *   post:
   *     tags: [Customers]
   *     summary: Add loyalty points
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
   *               - points
   *             properties:
   *               points:
   *                 type: integer
   *     responses:
   *       200:
   *         description: Points added successfully
   */
  async addLoyaltyPoints(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await customersService.addLoyaltyPoints(req.params.id, req.body.points);
      return successResponse(res, customer, 'Loyalty points added successfully');
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /shop/customers/{id}/loyalty/deduct:
   *   post:
   *     tags: [Customers]
   *     summary: Deduct loyalty points
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
   *               - points
   *             properties:
   *               points:
   *                 type: integer
   *     responses:
   *       200:
   *         description: Points deducted successfully
   */
  async deductLoyaltyPoints(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await customersService.deductLoyaltyPoints(req.params.id, req.body.points);
      return successResponse(res, customer, 'Loyalty points deducted successfully');
    } catch (error) {
      return next(error);
    }
  }
}

export default new CustomersController();
