import { Router } from 'express';
import usersController from './users.controller';
import { validate } from '@middleware/validation.middleware';
import { authGuard } from '@common/guards/auth.guard';
import { permissionGuard } from '@common/guards/permission.guard';
import {
  createUserValidation,
  updateUserValidation,
  updateUserPasswordValidation,
  userListValidation,
} from './dto/users.validation';
import { PERMISSIONS } from '@common/constants';

const router = Router();

// All routes require authentication
router.use(authGuard);

// Get user statistics
router.get('/stats', permissionGuard([PERMISSIONS.USERS_READ]), usersController.getUserStats);

// Get all users
router.get(
  '/',
  permissionGuard([PERMISSIONS.USERS_READ]),
  validate(userListValidation),
  usersController.getUsers
);

// Get user by ID
router.get('/:id', permissionGuard([PERMISSIONS.USERS_READ]), usersController.getUserById);

// Create new user
router.post(
  '/',
  permissionGuard([PERMISSIONS.USERS_CREATE]),
  validate(createUserValidation),
  usersController.createUser
);

// Update user
router.put(
  '/:id',
  permissionGuard([PERMISSIONS.USERS_UPDATE]),
  validate(updateUserValidation),
  usersController.updateUser
);

// Update user password (admin function)
router.put(
  '/:id/password',
  permissionGuard([PERMISSIONS.USERS_UPDATE]),
  validate(updateUserPasswordValidation),
  usersController.updateUserPassword
);

// Delete user
router.delete('/:id', permissionGuard([PERMISSIONS.USERS_DELETE]), usersController.deleteUser);

export default router;
