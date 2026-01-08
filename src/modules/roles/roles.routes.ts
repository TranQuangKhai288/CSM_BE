import { Router } from 'express';
import rolesController from './roles.controller';
import { validate } from '@middleware/validation.middleware';
import { authGuard } from '@common/guards/auth.guard';
import { permissionGuard } from '@common/guards/permission.guard';
import {
  createRoleValidation,
  updateRoleValidation,
  roleListValidation,
} from './dto/roles.validation';
import { PERMISSIONS } from '@common/constants';

const router = Router();

// All routes require authentication
router.use(authGuard);

// Get available permissions
router.get(
  '/permissions/available',
  permissionGuard([PERMISSIONS.ROLES_READ]),
  rolesController.getAvailablePermissions
);

// Get all roles
router.get(
  '/',
  permissionGuard([PERMISSIONS.ROLES_READ]),
  validate(roleListValidation),
  rolesController.getRoles
);

// Get role by slug
router.get('/slug/:slug', permissionGuard([PERMISSIONS.ROLES_READ]), rolesController.getRoleBySlug);

// Get role by ID
router.get('/:id', permissionGuard([PERMISSIONS.ROLES_READ]), rolesController.getRoleById);

// Create new role
router.post(
  '/',
  permissionGuard([PERMISSIONS.ROLES_CREATE]),
  validate(createRoleValidation),
  rolesController.createRole
);

// Update role
router.put(
  '/:id',
  permissionGuard([PERMISSIONS.ROLES_UPDATE]),
  validate(updateRoleValidation),
  rolesController.updateRole
);

// Delete role
router.delete('/:id', permissionGuard([PERMISSIONS.ROLES_DELETE]), rolesController.deleteRole);

export default router;
