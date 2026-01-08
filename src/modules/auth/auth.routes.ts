import { Router } from 'express';
import authController from './auth.controller';
import { validate } from '@middleware/validation.middleware';
import { authGuard } from '@common/guards/auth.guard';
import { authRateLimitMiddleware } from '@middleware/rate-limit.middleware';
import {
  loginValidation,
  registerValidation,
  refreshTokenValidation,
  changePasswordValidation,
} from './dto/auth.validation';

const router = Router();

// Public routes
router.post(
  '/register',
  authRateLimitMiddleware,
  validate(registerValidation),
  authController.register
);

router.post(
  '/login',
  authRateLimitMiddleware,
  validate(loginValidation),
  authController.login
);

router.post(
  '/refresh',
  validate(refreshTokenValidation),
  authController.refreshToken
);

// Protected routes
router.post('/logout', authGuard, authController.logout);

router.get('/me', authGuard, authController.getCurrentUser);

router.post(
  '/change-password',
  authGuard,
  validate(changePasswordValidation),
  authController.changePassword
);

export default router;
