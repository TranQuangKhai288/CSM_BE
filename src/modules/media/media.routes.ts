import { Router } from 'express';
import mediaController from './media.controller';
import { validate } from '@middleware/validation.middleware';
import { authGuard } from '@common/guards/auth.guard';
import { permissionGuard } from '@common/guards/permission.guard';
import { updateMediaValidation, mediaListValidation } from './dto/media.validation';
import { PERMISSIONS } from '@common/constants';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// All routes require authentication
router.use(authGuard);

// Get media statistics
router.get('/stats', permissionGuard([PERMISSIONS.MEDIA_READ]), mediaController.getMediaStats);

// Upload single file
router.post(
  '/upload',
  permissionGuard([PERMISSIONS.MEDIA_CREATE]),
  upload.single('file'),
  mediaController.uploadFile
);

// Upload multiple files
router.post(
  '/upload-multiple',
  permissionGuard([PERMISSIONS.MEDIA_CREATE]),
  upload.array('files', 10),
  mediaController.uploadFiles
);

// Bulk delete media
router.post(
  '/bulk-delete',
  permissionGuard([PERMISSIONS.MEDIA_DELETE]),
  mediaController.deleteMediaBulk
);

// Get all media
router.get(
  '/',
  permissionGuard([PERMISSIONS.MEDIA_READ]),
  validate(mediaListValidation),
  mediaController.getMedia
);

// Get media by ID
router.get('/:id', permissionGuard([PERMISSIONS.MEDIA_READ]), mediaController.getMediaById);

// Get signed URL
router.get(
  '/:id/signed-url',
  permissionGuard([PERMISSIONS.MEDIA_READ]),
  mediaController.getSignedUrl
);

// Update media
router.patch(
  '/:id',
  permissionGuard([PERMISSIONS.MEDIA_UPDATE]),
  validate(updateMediaValidation),
  mediaController.updateMedia
);

// Delete media
router.delete('/:id', permissionGuard([PERMISSIONS.MEDIA_DELETE]), mediaController.deleteMedia);

export default router;
